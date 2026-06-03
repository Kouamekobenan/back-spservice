# Guide d'implémentation Offline — Côté Frontend

**Projet :** ERP/POS Multi-Boutiques  
**Date :** 03 juin 2026  
**Destinataire :** Développeur Frontend (Electron / Capacitor / React)

---

## Vue d'ensemble

Le backend expose **six fonctionnalités offline** réparties sur deux semaines d'implémentation :

| # | Feature | Endpoint | Semaine |
|---|---------|----------|---------|
| 1 | Générer un token offline 30 jours | `POST /auth/offline-session` | S1 |
| 2 | Se connecter avec un PIN | `POST /auth/pin-login` | S1 |
| 3 | Synchroniser les données locales (PUSH) | `POST /sync-queue/process` | S1 |
| 4 | Charger toutes les données initiales | `GET /sync/snapshot` | S2 |
| 5 | Récupérer les changements serveur (PULL) | `GET /sync/pull?since=...` | S2 |
| 6 | Changelog automatique côté serveur | *(géré automatiquement)* | S2 |

### Cycle de vie complet d'un terminal offline

```
1. PREMIÈRE INSTALLATION
   └─ GET /sync/snapshot  → charger produits, clients, catégories en local

2. USAGE QUOTIDIEN (ONLINE)
   ├─ Login → POST /auth/offline-session  → stocker offlineToken 30j
   ├─ Actions utilisateur → API normale
   └─ GET /sync/pull?since=<lastSync>   → récupérer les changements des autres terminaux

3. USAGE OFFLINE
   ├─ Toutes les actions → base SQLite locale + SyncQueue
   └─ JWT expire → écran PIN → validation locale

4. RETOUR EN LIGNE
   ├─ POST /sync-queue + POST /sync-queue/process  → PUSH local → serveur
   └─ GET /sync/pull?since=<lastSync>              → PULL serveur → local
```

---

## 1. Authentification Offline

### Principe général

```
ONLINE  → login normal → stocker offlineToken + snapshot user en local
OFFLINE → utiliser offlineToken stocké (valide 30 jours)
OFFLINE + token expiré → saisir PIN → POST /auth/pin-login (si connexion disponible)
```

---

### Étape 1 — Login normal (déjà existant)

Lors d'un login classique, appeler en plus `POST /auth/offline-session` pour générer le token offline.

```typescript
// auth.service.ts (frontend)
async login(phone: string, password: string) {
  // 1. Login classique
  const { accessToken, refreshToken, user } = await api.post('/auth/login', {
    phone,
    password,
  });

  // Stocker le token d'accès normal
  await storage.set('accessToken', accessToken);
  await storage.set('refreshToken', refreshToken);

  // 2. Générer et stocker le token offline (appel immédiat pendant qu'on est en ligne)
  const offlineSession = await api.post(
    '/auth/offline-session',
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Stocker localement (SQLite / localStorage / SecureStorage)
  await storage.set('offlineToken', offlineSession.offlineToken);
  await storage.set('offlineTokenExpiry', offlineSession.expiresAt);
  await storage.set('offlineUserSnapshot', JSON.stringify(offlineSession.user));
}
```

**Réponse de `POST /auth/offline-session` :**
```json
{
  "offlineToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-07-03T07:00:00.000Z",
  "user": {
    "id": "uuid-utilisateur",
    "username": "jean.dupont",
    "name": "Jean Dupont",
    "role": "CASHIER",
    "pin": "1234",
    "phone": "+225 07 00 00 00",
    "shopAccesses": [
      { "shopId": "uuid-shop", "shopName": "Boutique Centrale", "roleInShop": "CASHIER" }
    ]
  }
}
```

> **Sécurité** : Le champ `pin` dans le snapshot est le PIN brut ou hashé.  
> Stocker ce snapshot dans un stockage chiffré (Electron: `electron-store` avec encryption, Capacitor: `@capacitor/preferences` ou SQLite chiffré).

---

### Étape 2 — Intercepteur HTTP : basculer automatiquement en mode offline

Créer un intercepteur qui détecte si l'appareil est hors ligne et utilise le token offline :

```typescript
// http.interceptor.ts (frontend)
async function getAuthToken(): Promise<string | null> {
  const isOnline = navigator.onLine; // ou Capacitor Network plugin

  if (isOnline) {
    // Vérifier si l'access token est encore valide
    const accessToken = await storage.get('accessToken');
    if (accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }

    // Tenter un refresh
    try {
      const newToken = await refreshAccessToken();
      return newToken;
    } catch {
      // Refresh échoué → basculer sur offline
    }
  }

  // Mode offline : utiliser l'offlineToken
  const offlineToken = await storage.get('offlineToken');
  const expiry = await storage.get('offlineTokenExpiry');

  if (offlineToken && new Date(expiry) > new Date()) {
    return offlineToken;
  }

  return null; // Nécessite un PIN
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
```

---

### Étape 3 — Écran de connexion PIN (token expiré en mode offline)

Afficher cet écran quand l'`offlineToken` est expiré et que l'appareil est hors ligne.

```typescript
// PinLoginScreen.tsx
async function handlePinSubmit(pin: string) {
  const snapshot = JSON.parse(await storage.get('offlineUserSnapshot'));

  if (navigator.onLine) {
    // En ligne : appeler le backend pour valider le PIN et obtenir un nouveau token
    try {
      const result = await api.post('/auth/pin-login', {
        username: snapshot.username,
        pin,
      });
      await storage.set('offlineToken', result.offlineToken);
      await storage.set('offlineTokenExpiry', result.expiresAt);
      await storage.set('offlineUserSnapshot', JSON.stringify(result.user));
      navigateToDashboard();
    } catch {
      showError('PIN incorrect');
    }
  } else {
    // Hors ligne : valider le PIN contre le snapshot local
    const storedPin = snapshot.pin;
    const isValid = storedPin.startsWith('$2')
      ? await bcrypt.compare(pin, storedPin)  // PIN hashé
      : storedPin === pin;                    // PIN brut

    if (isValid) {
      // Générer un token local temporaire (JWT signé côté client, valide 8h)
      // OU simplement marquer la session comme authentifiée localement
      await storage.set('localSessionActive', 'true');
      await storage.set('localSessionExpiry', new Date(Date.now() + 8 * 3600000).toISOString());
      navigateToDashboard();
    } else {
      showError('PIN incorrect');
    }
  }
}
```

**Pour le PIN offline côté client, installer :**
```bash
npm install bcryptjs
# ou
npm install @noble/hashes  # plus léger
```

---

### Étape 4 — Détection réseau (Electron / Capacitor)

```typescript
// network.service.ts

// Electron
window.addEventListener('online',  () => onNetworkRestored());
window.addEventListener('offline', () => onNetworkLost());

// Capacitor
import { Network } from '@capacitor/network';
Network.addListener('networkStatusChange', (status) => {
  if (status.connected) onNetworkRestored();
  else onNetworkLost();
});

async function onNetworkRestored() {
  console.log('Connexion rétablie → lancement de la synchronisation');
  await triggerSync();
}

async function onNetworkLost() {
  console.log('Mode offline activé');
  showOfflineBanner();
}
```

---

## 2. Synchronisation des données (SyncQueue)

### Principe général

```
Action utilisateur offline
  → créer l'entité en local (SQLite)
  → ajouter à la SyncQueue locale
  → attendre la reconnexion
  → POST /sync-queue (enqueue)
  → POST /sync-queue/process (déclencher)
```

---

### Étape 1 — Structure d'un item de sync

Chaque action offline doit être mise en file d'attente avec ce format :

```typescript
interface SyncQueueItem {
  entityType: 'Sale' | 'Product' | 'Customer' | 'Expense' |
              'CashSession' | 'StockMovement' | 'PurchaseOrder' |
              'CreditPayment' | 'StockTransfer';
  localId: string;       // UUID généré localement
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;  // Données complètes de l'entité
}
```

---

### Étape 2 — Créer une vente offline

```typescript
// sale.service.ts (frontend)
import { v4 as uuidv4 } from 'uuid';

async function createSaleOffline(saleData: CreateSaleDto) {
  const localId = uuidv4();

  // 1. Sauvegarder en local (SQLite)
  await localDb.sales.insert({
    ...saleData,
    id: localId,
    localId,
    syncStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // 2. Décrémenter le stock localement
  for (const item of saleData.items) {
    await localDb.products.updateStock(item.productId, -item.quantity);
  }

  // 3. Ajouter à la file de sync locale
  await localSyncQueue.add({
    entityType: 'Sale',
    localId,
    operation: 'CREATE',
    payload: {
      ...saleData,
      localId,
      receiptNumber: generateReceiptNumber(),
    },
  });

  return { id: localId, ...saleData };
}

function generateReceiptNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `SP-${date}-${rand}`;
}
```

---

### Étape 3 — Synchroniser au retour en ligne

```typescript
// sync.service.ts (frontend)
async function triggerSync() {
  const pendingItems = await localSyncQueue.getPending();
  if (pendingItems.length === 0) return;

  const token = await getAuthToken();
  if (!token) return; // Pas de token valide, reporter

  // 1. Envoyer chaque item dans la file côté serveur
  for (const item of pendingItems) {
    try {
      await api.post('/sync-queue', {
        entityType: item.entityType,
        localId: item.localId,
        operation: item.operation,
        payload: item.payload,
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error(`Enqueue échoué pour ${item.localId}:`, err);
    }
  }

  // 2. Déclencher le traitement côté serveur
  const result = await api.post('/sync-queue/process', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`Sync: ${result.succeeded} OK, ${result.failed} erreurs, ${result.conflicts} conflits`);

  // 3. Mettre à jour les statuts locaux
  for (const syncedId of result.syncedIds) {
    await localSyncQueue.markSynced(syncedId);
  }

  // 4. Afficher les conflits à résoudre si nécessaire
  if (result.conflicts > 0) {
    showConflictNotification(result.conflicts);
  }
}
```

---

### Étape 4 — Payload requis par entité

Le backend valide ces champs **avant** toute écriture. S'assurer qu'ils sont présents dans le payload :

| Entité | Champs obligatoires |
|--------|---------------------|
| `Sale` | `shopId`, `userId`, `receiptNumber`, `totalAmount` (>= 0) |
| `Product` | `shopId`, `name`, `sellingPrice`, `buyingPrice` (>= 0) |
| `Customer` | `name` |
| `Expense` | `shopId`, `title`, `category`, `amount` (>= 0) |
| `CashSession` | `shopId`, `userId`, `openingBalance` (>= 0) |
| `StockMovement` | `productId`, `shopId`, `userId`, `reason`, `quantity`, `stockBefore`, `stockAfter` |
| `PurchaseOrder` | `shopId`, `supplierId`, `orderNumber`, `totalAmount` (>= 0) |
| `CreditPayment` | `customerId`, `method`, `amount` (> 0) |
| `StockTransfer` | `fromShopId`, `toShopId` (≠ fromShopId), `transferNumber` |

---

### Étape 5 — Gérer les conflits

```typescript
// conflict-resolver.service.ts (frontend)
async function resolveConflict(
  syncQueueId: string,
  strategy: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE',
  mergedPayload?: Record<string, unknown>
) {
  const token = await getAuthToken();

  await api.patch(`/sync-queue/${syncQueueId}/resolve`, {
    strategy,
    mergedPayload,          // requis si strategy = 'MERGE'
    resolvedId: undefined,  // requis si strategy = 'KEEP_SERVER'
  }, { headers: { Authorization: `Bearer ${token}` } });
}

// Exemple : l'utilisateur choisit de garder la version locale
await resolveConflict(conflictItem.id, 'KEEP_LOCAL');

// Exemple : garder la version serveur
await resolveConflict(conflictItem.id, 'KEEP_SERVER', undefined);
```

---

---

## 3. Snapshot initial — Charger les données au premier démarrage

### Quand l'appeler

- À la **première installation** du terminal offline
- Après une **réinstallation** ou **reset de la base locale**
- Jamais en usage normal (utiliser `/sync/pull` à la place)

### Entités disponibles dans le snapshot

| Clé | Description | Filtre shopId |
|-----|-------------|:-------------:|
| `products` | Tous les produits actifs | Oui |
| `customers` | Tous les clients | Non |
| `categories` | Catégories | Oui |
| `units` | Unités de mesure | Non |
| `suppliers` | Fournisseurs | Non |
| `expenses` | Dépenses | Oui |

### Étape 1 — Appel du snapshot paginé

```typescript
// snapshot.service.ts (frontend)
async function loadInitialSnapshot(shopId: string) {
  const token = await getAuthToken();
  const ENTITIES = 'products,customers,categories,units,suppliers';
  const PAGE_SIZE = 100;

  const firstPage = await api.get('/sync/snapshot', {
    params: { shopId, entities: ENTITIES, page: 1, limit: PAGE_SIZE },
    headers: { Authorization: `Bearer ${token}` },
  });

  // Stocker la date du snapshot pour le premier pull
  await storage.set('lastSyncTime', firstPage.serverTime);

  // Insérer chaque entité en SQLite local
  for (const [entityKey, entityData] of Object.entries(firstPage.entities)) {
    const { data, total, totalPages } = entityData as any;
    await localDb[entityKey].bulkInsert(data);

    // Si plusieurs pages, charger les suivantes
    for (let page = 2; page <= totalPages; page++) {
      const nextPage = await api.get('/sync/snapshot', {
        params: { shopId, entities: entityKey, page, limit: PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` },
      });
      await localDb[entityKey].bulkInsert(nextPage.entities[entityKey].data);
    }

    console.log(`${entityKey}: ${total} enregistrements chargés`);
  }

  await storage.set('snapshotLoaded', 'true');
  console.log('Snapshot initial terminé →', firstPage.serverTime);
}
```

**Réponse de `GET /sync/snapshot?shopId=xxx&entities=products,customers&page=1&limit=100` :**
```json
{
  "serverTime": "2026-06-03T07:41:00.000Z",
  "shopId": "uuid-shop",
  "entities": {
    "products": {
      "data": [
        { "id": "uuid", "name": "Huile de palme 1L", "sellingPrice": 800, "stockQty": 45, ... }
      ],
      "total": 342,
      "page": 1,
      "totalPages": 4
    },
    "customers": {
      "data": [...],
      "total": 87,
      "page": 1,
      "totalPages": 1
    }
  }
}
```

### Étape 2 — Vérifier si le snapshot est nécessaire au démarrage

```typescript
// app.startup.ts (frontend)
async function checkAndLoadSnapshot(shopId: string) {
  const snapshotLoaded = await storage.get('snapshotLoaded');
  const isOnline = navigator.onLine;

  if (!snapshotLoaded && isOnline) {
    showLoadingScreen('Chargement des données initiales...');
    await loadInitialSnapshot(shopId);
    hideLoadingScreen();
  } else if (!snapshotLoaded && !isOnline) {
    // Impossible de démarrer sans données et sans réseau
    showError('Connexion requise pour le premier démarrage. Veuillez vous connecter au réseau.');
    return;
  }

  navigateToDashboard();
}
```

---

## 4. Sync PULL bidirectionnel — Récupérer les changements serveur

### Principe

Le PULL permet à un terminal de recevoir les modifications faites **par d'autres terminaux ou par l'interface web**. Il complète le PUSH (local → serveur) pour avoir une synchronisation bidirectionnelle.

```
Terminal A (offline) → PUSH → Serveur
                                 ↓ ChangeLog automatique
Terminal B (online)  ← PULL ← Serveur
```

### Quand appeler le PULL

- **Au retour en ligne** — juste après le PUSH
- **Périodiquement** — toutes les 5 minutes si en ligne (en arrière-plan)
- **Au démarrage de l'app** — si en ligne

### Étape 1 — Implémentation du service PULL

```typescript
// pull-sync.service.ts (frontend)

async function pullChangesFromServer(shopId: string) {
  const token = await getAuthToken();
  if (!token) return;

  // Récupérer le dernier timestamp de sync (stocké après chaque pull réussi)
  const lastSyncTime = await storage.get('lastSyncTime');
  if (!lastSyncTime) {
    // Jamais synchronisé → faire un snapshot d'abord
    await loadInitialSnapshot(shopId);
    return;
  }

  const since = lastSyncTime;
  let offset = 0;
  let hasMore = true;
  let totalApplied = 0;

  while (hasMore) {
    const response = await api.get('/sync/pull', {
      params: { since, shopId, limit: 500, offset },
      headers: { Authorization: `Bearer ${token}` },
    });

    // Appliquer chaque changement en local
    for (const change of response.changes) {
      await applyChangeLocally(change);
      totalApplied++;
    }

    hasMore  = response.hasMore;
    offset   = response.nextOffset;

    // Stocker le serverTime du dernier pull réussi
    if (!hasMore) {
      await storage.set('lastSyncTime', response.serverTime);
    }
  }

  console.log(`PULL terminé: ${totalApplied} changements appliqués`);
}
```

**Réponse de `GET /sync/pull?since=2026-06-01T00:00:00Z&shopId=xxx` :**
```json
{
  "since": "2026-06-01T00:00:00.000Z",
  "serverTime": "2026-06-03T07:41:05.123Z",
  "total": 12,
  "hasMore": false,
  "nextOffset": 0,
  "changes": [
    {
      "id": "changelog-uuid",
      "entityType": "Product",
      "entityId": "product-uuid",
      "operation": "UPDATE",
      "shopId": "shop-uuid",
      "payload": { "id": "product-uuid", "name": "Huile 1L", "stockQty": 40, ... },
      "changedAt": "2026-06-02T14:30:00.000Z"
    },
    {
      "id": "changelog-uuid-2",
      "entityType": "Sale",
      "entityId": "sale-uuid",
      "operation": "CREATE",
      "shopId": "shop-uuid",
      "payload": { "id": "sale-uuid", "totalAmount": 5000, ... },
      "changedAt": "2026-06-02T15:00:00.000Z"
    }
  ]
}
```

> **Important :** Toujours utiliser `serverTime` (pas `since`) pour le prochain appel. `serverTime` est l'heure du serveur au moment de la réponse, ce qui évite de rater des changements survenus pendant l'appel.

### Étape 2 — Appliquer un changement localement

```typescript
// change-applier.ts (frontend)
async function applyChangeLocally(change: ChangeDto) {
  const { entityType, entityId, operation, payload } = change;

  // Mapper le type serveur vers la table SQLite locale
  const tableMap: Record<string, string> = {
    Sale:          'sales',
    Product:       'products',
    Customer:      'customers',
    Expense:       'expenses',
    CashSession:   'cashSessions',
    StockMovement: 'stockMovements',
    PurchaseOrder: 'purchaseOrders',
    CreditPayment: 'creditPayments',
    StockTransfer: 'stockTransfers',
  };

  const table = tableMap[entityType];
  if (!table) return;

  switch (operation) {
    case 'CREATE': {
      // Vérifier si l'entité existe déjà (idempotence)
      const existing = await localDb[table].findById(entityId);
      if (!existing) {
        await localDb[table].insert({ ...payload, syncStatus: 'SYNCED' });
      }
      break;
    }

    case 'UPDATE': {
      const existing = await localDb[table].findById(entityId);
      if (existing) {
        // Conflit potentiel : l'entité a été modifiée localement ET sur le serveur
        if (existing.syncStatus === 'PENDING') {
          // Ne pas écraser une modification locale non encore synchronisée
          console.warn(`Conflit ignoré pour ${entityType}:${entityId} — modification locale en attente`);
        } else {
          await localDb[table].update(entityId, { ...payload, syncStatus: 'SYNCED' });
        }
      } else {
        // L'entité n'existe pas localement → la créer
        await localDb[table].insert({ ...payload, syncStatus: 'SYNCED' });
      }
      break;
    }

    case 'DELETE': {
      await localDb[table].softDelete(entityId); // Marquer comme inactif, ne pas supprimer physiquement
      break;
    }
  }
}
```

### Étape 3 — Cycle PUSH puis PULL complet au retour en ligne

```typescript
// sync-orchestrator.ts (frontend)
async function fullSync(shopId: string) {
  const token = await getAuthToken();
  if (!token || !navigator.onLine) return;

  try {
    showSyncIndicator('Synchronisation en cours...');

    // 1. PUSH : envoyer les changements locaux vers le serveur
    await pushLocalChanges(token);

    // 2. PULL : récupérer les changements du serveur
    await pullChangesFromServer(shopId);

    showSyncIndicator('Synchronisé', { success: true });
  } catch (err) {
    showSyncIndicator('Erreur de synchronisation', { error: true });
    console.error('Sync failed:', err);
  }
}

// Déclencher au retour en ligne
window.addEventListener('online', () => {
  fullSync(currentShopId);
});

// Sync périodique toutes les 5 minutes si en ligne
setInterval(() => {
  if (navigator.onLine) fullSync(currentShopId);
}, 5 * 60 * 1000);
```

### Étape 4 — Cas particulier : trop longtemps hors ligne (> 90 jours)

Le backend refuse les pulls avec `since` datant de plus de 90 jours.

```typescript
async function handlePullError(error: any, shopId: string) {
  if (error.status === 400 && error.message?.includes('90 jours')) {
    // Trop longtemps offline → refaire un snapshot complet
    const confirmed = await showConfirm(
      'Vous étiez hors ligne depuis trop longtemps. Un rechargement complet des données est nécessaire. Continuer ?'
    );
    if (confirmed) {
      await storage.remove('lastSyncTime');
      await storage.remove('snapshotLoaded');
      await localDb.clearAll(); // ⚠️ Vider la base locale
      await loadInitialSnapshot(shopId);
    }
  }
}
```

---

## 5. Composants UI recommandés

### Badge mode offline

```tsx
// OfflineBadge.tsx
function OfflineBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localSyncQueue.countPending().then(setPendingCount);
  }, [isOnline]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`badge ${isOnline ? 'syncing' : 'offline'}`}>
      {isOnline
        ? `Synchronisation... (${pendingCount} en attente)`
        : `Hors ligne — ${pendingCount} opération(s) en attente`}
    </div>
  );
}
```

### Écran PIN

```tsx
// PinScreen.tsx
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin(pin + d);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    try {
      await handlePinSubmit(pin);
      onSuccess();
    } catch {
      setError('PIN incorrect');
      setPin('');
    }
  };

  return (
    <div className="pin-screen">
      <h2>Session expirée</h2>
      <p>Entrez votre PIN pour continuer</p>
      <div className="pin-dots">
        {[0,1,2,3].map(i => (
          <div key={i} className={`dot ${pin.length > i ? 'filled' : ''}`} />
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="keypad">
        {['1','2','3','4','5','6','7','8','9','0'].map(d => (
          <button key={d} onClick={() => handleDigit(d)}>{d}</button>
        ))}
        <button onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
        <button onClick={handleSubmit} disabled={pin.length !== 4}>OK</button>
      </div>
    </div>
  );
}
```

---

## 6. Dépendances frontend à installer

```bash
# Génération d'UUID pour les localId
npm install uuid
npm install -D @types/uuid

# Validation PIN hashé (si PIN stocké en bcrypt)
npm install bcryptjs
npm install -D @types/bcryptjs

# Réseau (Capacitor)
npm install @capacitor/network

# Stockage sécurisé (Capacitor)
npm install @capacitor/preferences

# SQLite local (Capacitor)
npm install @capacitor-community/sqlite

# Electron
npm install electron-store  # stockage persistant chiffré
```

---

## 7. Résumé des endpoints utilisés

| Méthode | Endpoint | Auth | Usage |
|---------|----------|------|-------|
| `POST` | `/auth/login` | Public | Login classique |
| `POST` | `/auth/offline-session` | JWT requis | Générer token 30j |
| `POST` | `/auth/pin-login` | Public | Login PIN → token 30j |
| `POST` | `/auth/refresh/:id` | Public | Rafraîchir access token |
| `POST` | `/sync-queue` | JWT requis | Ajouter item à synchroniser |
| `POST` | `/sync-queue/process` | JWT requis | Déclencher la synchronisation (PUSH) |
| `GET` | `/sync-queue/stats` | JWT requis | Voir l'état de la file |
| `PATCH` | `/sync-queue/:id/resolve` | JWT requis | Résoudre un conflit |
| `GET` | `/sync/snapshot` | JWT requis | Snapshot initial complet |
| `GET` | `/sync/pull` | JWT requis | Changements depuis un timestamp (PULL) |

---

## 8. Ordre d'implémentation recommandé

Voici l'ordre dans lequel implémenter les fonctionnalités côté frontend pour minimiser les blocages :

```
Semaine 1
├─ [1] Détection réseau (navigator.onLine + événements)
├─ [2] Stockage local sécurisé (electron-store ou @capacitor/preferences)
├─ [3] Login + appel POST /auth/offline-session → stocker offlineToken
├─ [4] Intercepteur HTTP → basculer sur offlineToken automatiquement
├─ [5] Écran PIN (validation locale sur snapshot)
└─ [6] SyncQueue locale : créer entités offline + POST /sync-queue/process

Semaine 2
├─ [7] GET /sync/snapshot → chargement initial au premier démarrage
├─ [8] Stockage de lastSyncTime après chaque sync
├─ [9] GET /sync/pull → appliquer les changements serveur localement
├─ [10] applyChangeLocally() avec gestion des conflits PENDING
└─ [11] fullSync() = PUSH + PULL au retour en ligne + timer 5min
```

---

*Guide mis à jour le 03 juin 2026 — Semaine 1 (Auth offline + SyncQueue PUSH) + Semaine 2 (Snapshot + PULL bidirectionnel)*
