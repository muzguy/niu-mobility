import { apiSuccess } from '@/lib/api-response';
import { getDatabaseConfig } from '@/lib/db/supabase-client';

export async function GET() {
  const dbConfig = getDatabaseConfig();

  return apiSuccess({
    service: 'NIU Mobility Backend API',
    status: 'healthy',
    version: '1.0.0',
    dataMode: dbConfig.mode,
    databaseConfigured: dbConfig.isConfigured,
    environment: process.env.NODE_ENV || 'development',
    monitoredRegion: 'Greater Noida Urban Grid',
  });
}
