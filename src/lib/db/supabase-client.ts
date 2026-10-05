/**
 * Supabase / Database Abstraction Layer
 *
 * Supports two operational data modes:
 * - 'simulation': Local deterministic simulation data (default when credentials are empty)
 * - 'database': Remote Supabase / PostgreSQL persistence via PostgREST / Service Role
 *
 * Never throws or crashes the application if credentials are not configured.
 */

export type DataMode = 'simulation' | 'database';

export interface DatabaseConfig {
  mode: DataMode;
  supabaseUrl: string | null;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  isConfigured: boolean;
}

export function getDataMode(): DataMode {
  const configuredMode = process.env.NIU_DATA_MODE?.toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only switch to 'database' if explicitly set and credentials exist
  if (configuredMode === 'database' && supabaseUrl && anonKey) {
    return 'database';
  }

  return 'simulation';
}

export function getDatabaseConfig(): DatabaseConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  const mode = getDataMode();

  return {
    mode,
    supabaseUrl,
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    isConfigured: Boolean(supabaseUrl && anonKey),
  };
}

/**
 * Server-side REST helper to query Supabase PostgREST tables securely.
 * Uses SUPABASE_SERVICE_ROLE_KEY (server-only) or NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export async function supabaseRestQuery<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: string;
    body?: unknown;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  const { mode, supabaseUrl } = getDatabaseConfig();

  if (mode !== 'database' || !supabaseUrl) {
    return { data: null, error: new Error('Database mode is not active or Supabase URL is missing') };
  }

  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey) {
    return { data: null, error: new Error('Supabase API key is missing') };
  }

  const method = options.method || 'GET';
  const queryString = options.query ? `?${options.query}` : '';
  const url = `${supabaseUrl}/rest/v1/${table}${queryString}`;

  try {
    const headers: Record<string, string> = {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation' : 'count=none',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: new Error(`Supabase REST error (${res.status}): ${errText}`) };
    }

    const json = (await res.json()) as T;
    return { data: json, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return { data: null, error: new Error(message) };
  }
}
