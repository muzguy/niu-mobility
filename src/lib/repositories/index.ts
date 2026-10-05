import { getDataMode } from '../db/supabase-client';
import { IMobilityRepository } from './types';
import { getSimulationRepository } from './simulation-repository';
import { SupabaseRepository } from './supabase-repository';

export * from './types';
export * from './simulation-repository';
export * from './supabase-repository';

/**
 * getRepository
 * Factory resolving the active repository based on NIU_DATA_MODE and environment configuration.
 */
export function getRepository(): IMobilityRepository {
  const mode = getDataMode();
  const simRepo = getSimulationRepository();

  if (mode === 'database') {
    return new SupabaseRepository(simRepo);
  }

  return simRepo;
}
