# Bilan Mode Offline — ERP/POS Multi-Boutiques
**Projet :** back-spservice  
**Date :** 02 juin 2026  
**Auteur :** Analyse technique automatisée

---

## Score de maturité offline : 42 / 100

> Le backend est un bon prototype. La fondation est solide, mais des éléments critiques manquent pour aller en production multi-device.

---

## 1. Ce qui existe déjà

### Architecture duale PostgreSQL / SQLite
- `PrismaService` avec switch automatique via la variable `DATABASE_PROVIDER`
- PRAGMAs SQLite optimisés : WAL mode, foreign_keys, busy_timeout
- Conversion automatique `Decimal` → `Float` pour SQLite
- Deux schémas séparés : `prisma/schema.prisma` (cloud) et `prisma/schema.sqlite.prisma` (offline)

### File de synchronisation (SyncQueue)
- Module complet avec architecture DDD
- 4 statuts : `PENDING`, `SYNCED`, `CONFLICT`, `ERROR`
- Retry automatique jusqu'à 5 tentatives
- CRON toutes les 5 minutes, retry erreurs toutes les 30 min
- Nettoyage automatique des items > 30 jours (dimanche 02h00)
- 3 stratégies de résolution de conflits : `KEEP_LOCAL`, `KEEP_SERVER`, `MERGE`

**Endpoints disponibles :**

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/v1/sync-queue` | Enqueue un item |
| GET | `/api/v1/sync-queue` | Lister (paginée) |
| GET | `/api/v1/sync-queue/stats` | Statistiques |
| POST | `/api/v1/sync-queue/process` | Forcer le traitement |
| POST | `/api/v1/sync-queue/retry` | Retraiter les erreurs |
| PATCH | `/api/v1/sync-queue/:id/resolve` | Résoudre un conflit |

### Champs SyncStatus et LocalId
Présents sur **11 entités** : `User`, `Product`, `Customer`, `CreditPayment`, `CashSession`, `Sale`, `Supplier`, `PurchaseOrder`, `StockMovement`, `StockTransfer`, `Expense`

Pattern idempotent : `findFirst({ where: { localId } })` avant chaque CREATE

### Storage dual provider
- Mode cloud → `CloudinaryService` (images uploadées sur Cloudinary)
- Mode offline → `LocalFileService` (images stockées dans `./uploads/`)
- Switch automatique selon `DATABASE_PROVIDER`

### Scripts npm prêts
```bash
npm run start:offline:dev     # Démarrage dev en mode offline
npm run start:offline         # Démarrage production offline
npm run build:electron        # Build Electron
npm run prisma:push:sqlite    # Pousser le schéma SQLite
npm run prisma:migrate:sqlite # Migrer SQLite
```

### CORS Electron / Capacitor
Origines autorisées dans `src/main.ts` :
- `capacitor-electron://localhost`
- `app://`
- `http://localhost:*`

### Audit Trail
- Événement `audit.created` émis automatiquement sur les Create UseCases
- Listener `@OnEvent('audit.created')` → persistance en base
- `userId` maintenant optionnel (opérations système sans utilisateur)

---

## 2. Ce qui manque

### Bloquant pour la production

#### Synchronisation PULL absente
- La SyncQueue est **PUSH uniquement** (local → cloud)
- Aucun mécanisme pour recevoir les changements faits par d'autres appareils
- Un terminal offline ne voit jamais les mises à jour des autres

**Ce qu'il faut :** Un endpoint `GET /api/v1/sync/pull?since=<timestamp>` et une logique de réconciliation côté client.

#### Authentification offline
- Le JWT expire → l'utilisateur est bloqué hors ligne après quelques heures
- Aucun fallback PIN ou biométrique
- Pas de refresh token persisté localement

**Ce qu'il faut :** Session locale persistée + fallback PIN avec validation locale.

#### Validation métier dans le dispatcher
- Le `dispatchSyncItem` fait un cast `as any` sur le payload
- Aucune vérification des contraintes métier avant synchronisation
- Un payload corrompu offline synchronise silencieusement

### Importants

#### Transactions atomiques absentes
Le traitement dans `process-sync-queue.usecase.ts` n'est pas transactionnel :
```
Sale sync OK → StockMovement échoue → données incohérentes, pas de rollback
```

#### Pas de snapshot initial
- Impossible de déployer offline sans connexion réseau au départ
- Aucun endpoint `GET /snapshot` pour charger produits/clients au premier démarrage

#### Zéro intégration client
- Aucun composant frontend fourni
- Pas de badge "mode offline" pour l'utilisateur
- Pas d'interface de résolution de conflits

#### Pas de détection réseau
- Aucun `ConnectivityGuard` côté application
- La synchronisation ne se déclenche pas automatiquement à la reconnexion

#### Pas de versioning des entités
- Sans champ `version` ou comparaison `updatedAt`, le merge 3-way est impossible
- Le dernier appareil à synchroniser écrase les données des autres

---

## 3. Problèmes architecturaux identifiés

### Dispatcher non-transactionnel (Critique)
```typescript
// process-sync-queue.usecase.ts
for (const item of pendingItems) {
  await dispatchSyncItem(item, this.prisma); // Sale OK
  // StockMovement échoue → Sale déjà committée → état incohérent
}
```
**Solution :** Utiliser des transactions Prisma (`prisma.$transaction`) ou un pattern Saga.

### SyncQueue unidirectionnelle
- Pas de concept de "pull queue" ni de changelog
- Multi-device = données divergentes sans possibilité de réconciliation

### Pas de rate limiting sur la sync
- `ProcessSyncQueueUseCase` peut traiter des centaines d'items d'un coup
- Pas de throttling → surcharge réseau et CPU

### Pas de backoff exponentiel
- Les retry se font toujours au même intervalle (30 min)
- Un serveur en panne → spam de requêtes inutiles

---

## 4. Plan de correction priorisé

### Semaine 1 — Bloquants critiques
- [ ] Authentification offline : session locale + fallback PIN
- [ ] Transactions Prisma dans le dispatcher (saga ou `$transaction`)
- [ ] Validation métier des payloads avant dispatch

### Semaine 2 — Fonctionnalités manquantes
- [ ] Endpoint snapshot initial `GET /sync/snapshot`
- [ ] Sync PULL bidirectionnelle `GET /sync/pull?since=<timestamp>`
- [ ] Changelog table en base pour tracer les modifications

### Semaine 3-4 — Intégration client
- [ ] Détection réseau Electron/Capacitor (`navigator.onLine` + événements)
- [ ] Badge "mode offline" dans l'interface utilisateur
- [ ] Interface de résolution de conflits
- [ ] Déclenchement automatique de la sync à la reconnexion

### Post-MVP — Qualité et performance
- [ ] Versioning des entités (champ `version: Int`)
- [ ] Backoff exponentiel pour les retry
- [ ] Tests offline : scénario "30 jours offline" puis reconnexion
- [ ] Compression des payloads (mobile)
- [ ] Rate limiting sur les endpoints de sync
- [ ] Indices SQLite sur `syncStatus` et `createdAt`
- [ ] Logging local et diagnostics offline

---

## 5. Tableau de maturité détaillé

| Critère | Score | Poids | Contribution |
|---------|-------|-------|-------------|
| Stockage dual PostgreSQL/SQLite | 90% | 15% | 13.5 pts |
| File de synchronisation (PUSH) | 75% | 15% | 11.25 pts |
| Configuration offline | 80% | 10% | 8 pts |
| Détection et résolution conflits | 40% | 10% | 4 pts |
| Synchronisation PULL | 0% | 15% | 0 pts |
| Authentification offline | 10% | 10% | 1 pt |
| Intégration client frontend | 0% | 10% | 0 pts |
| Tests offline | 5% | 10% | 0.5 pt |
| Documentation | 70% | 5% | 3.5 pts |
| **TOTAL** | | **100%** | **41.75 pts** |

---

## 6. Fichiers clés du projet

| Fichier | Rôle |
|---------|------|
| `src/prisma/prisma.service.ts` | Switch automatique PostgreSQL / SQLite |
| `src/modules/sync-queue/` | Module complet de synchronisation |
| `src/modules/sync-queue/application/usecases/process-sync-queue.usecase.ts` | Moteur de sync PUSH |
| `src/modules/sync-queue/application/usecases/resolve-conflict.usecase.ts` | Résolution de conflits |
| `src/modules/sync-queue/presentation/schedulers/sync-queue.scheduler.ts` | CRON scheduler |
| `prisma/schema.prisma` | Schéma PostgreSQL (cloud) |
| `prisma/schema.sqlite.prisma` | Schéma SQLite (offline) |
| `src/common/storage/local-file.service.ts` | Stockage fichiers local |
| `src/common/cloudinary/cloudinary.module.ts` | Switch storage auto |
| `src/main.ts` | Config CORS Electron/Capacitor |
| `.env.offline` | Variables d'environnement offline |

---

*Document généré le 02 juin 2026*
