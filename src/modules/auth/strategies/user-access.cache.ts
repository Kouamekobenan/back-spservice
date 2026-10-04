/**
 * Cache mémoire des accès boutiques par utilisateur.
 *
 * Objectif : éviter une requête `userShopAccess.findMany()` à CHAQUE requête
 * authentifiée (JwtStrategy.validate), ce qui surcharge la base PostgreSQL.
 *
 * - TTL court (60 s) : un changement d'accès est pris en compte au plus tard après 60 s,
 *   et immédiatement si `invalidate()` / `clear()` est appelé après une modification.
 * - Déduplication des requêtes concurrentes : si plusieurs requêtes du même
 *   utilisateur arrivent en même temps, une seule requête SQL est exécutée.
 * - Taille bornée pour ne pas consommer trop de RAM côté API.
 */

const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

interface CacheEntry {
  shopIds: string[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string[]>>();

export const UserAccessCache = {
  async getOrLoad(
    userId: string,
    loader: () => Promise<string[]>,
  ): Promise<string[]> {
    const now = Date.now();
    const entry = cache.get(userId);
    if (entry && entry.expiresAt > now) {
      return entry.shopIds;
    }

    const pending = inFlight.get(userId);
    if (pending) return pending;

    const promise = loader()
      .then((shopIds) => {
        if (cache.size >= MAX_ENTRIES) {
          // Supprime l'entrée la plus ancienne (ordre d'insertion de Map)
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) cache.delete(oldestKey);
        }
        cache.set(userId, { shopIds, expiresAt: Date.now() + TTL_MS });
        return shopIds;
      })
      .finally(() => {
        inFlight.delete(userId);
      });

    inFlight.set(userId, promise);
    return promise;
  },

  /** Invalide le cache d'un utilisateur (après ajout/suppression d'un accès). */
  invalidate(userId: string): void {
    cache.delete(userId);
  },

  /** Vide tout le cache (ex. suppression d'une boutique). */
  clear(): void {
    cache.clear();
  },
};
