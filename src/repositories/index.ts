import { IRepository } from './IRepository';
import { storageRepo } from './storageRepository';

/**
 * Repository Provider Factory for GasOnline.
 * Allows seamless switching between LocalStorageRepository (Demo / Offline)
 * and FirestoreRepository / Server API (Production Multi-Tenant) without modifying page views.
 */
export function getRepository(): IRepository {
  // If production Firestore repository is enabled via environment flag:
  // if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
  //   return firestoreRepository;
  // }
  return storageRepo;
}

export { storageRepo };
export type { IRepository };
