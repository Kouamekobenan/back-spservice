# 🗄️ Architecture Offline & Coexistence PostgreSQL / SQLite
## Backend `back-spservice` (NestJS + Prisma)

Ce document explique l'implémentation de la coexistence des deux bases de données (PostgreSQL pour le cloud et SQLite pour le mode hors-ligne local) et fournit un guide complet pour le développeur frontend (Electron / Capacitor) afin de gérer la synchronisation, les médias locaux et la résilience réseau.

---

## 🏗️ Architecture Globale (Dual-Provider)

```mermaid
graph TD
    subgraph Client (Electron / Mobile)
        FE[Application Frontend React/Vue/Capacitor]
        BE[Serveur Backend NestJS Local]
        SQLITE[(SQLite DB local)]
        Uploads[Dossier uploads/]
    end

    subgraph Cloud (Production)
        PG[(PostgreSQL DB Cloud)]
        CLOUDINARY[(Cloudinary Storage)]
    end

    FE <-->|API REST / localhost:3001| BE
    BE <-->|Prisma Service Proxy| SQLITE
    BE -.->|Local Upload| Uploads
    
    %% Synchronisation
    BE ===>|SyncQueue Background Worker| PG
```

### Le Pattern "Prisma Service Proxy"
Pour éviter de dupliquer les dépôts ou d'écrire des requêtes complexes, `PrismaService` a été refactorisé avec un pattern **Composition + Proxy JS**. 
* Si `DATABASE_PROVIDER=sqlite` : Le service charge dynamiquement le client SQLite (`.prisma/client-sqlite`), active les verrous de performance SQLite (WAL mode, foreign keys) et intercepte tous les appels.
* Si `DATABASE_PROVIDER=postgres` : Le service charge le client standard PostgreSQL.
* **Impact sur le code** : Absolument aucun. Les repositories existants écrivent toujours `this.prisma.model.action()` sans savoir quel provider tourne en arrière-plan.

---

## 🛠️ Configuration & Démarrage

### 1. Variables d'environnement (.env.offline)
Le fichier `.env.offline` configure le backend pour s'exécuter localement sans dépendance réseau :
```bash
DATABASE_PROVIDER=sqlite
DATABASE_URL_SQLITE="file:./prisma/data/spservice_offline.db"
NODE_ENV=offline

# Services cloud laissés vides (gérés silencieusement comme No-Op)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ULTRAMSG_API_URL=
ULTRAMSG_TOKEN=
```

### 2. Commandes de Démarrage Offline
Les scripts npm suivants ont été ajoutés pour gérer le cycle de vie SQLite :

```bash
# 1. Générer le client Prisma spécifique pour SQLite
npm run prisma:generate:sqlite

# 2. Pousser le schéma sur la base locale SQLite
npm run prisma:push:sqlite

# 3. Démarrer le serveur NestJS en mode Offline
npm run start:offline:dev
```

---

## ⚠️ Différences Critiques Backend & Adaptations

1. **Champs Decimal vs Float** : SQLite ne possède pas de type `Decimal`. Dans le schéma `schema.sqlite.prisma`, tous les champs `@db.Decimal` ont été convertis en `Float` (REAL IEEE 754). Le `ProductMapper` a été ajusté pour convertir dynamiquement les types en toute transparence.
2. **Recherche Insensible à la Casse (Case Insensitivity)** : SQLite est nativement insensible à la casse pour les caractères ASCII avec l'opérateur `LIKE`, mais n'accepte pas l'option `mode: 'insensitive'` de Prisma (qui provoque un crash). Les requêtes dans les repositories ont été modifiées avec un helper conditionnel :
   ```typescript
   const caseInsensitive = () => process.env.DATABASE_PROVIDER === 'sqlite' ? {} : { mode: 'insensitive' as const };
   ```
3. **Fichiers / Images** : En mode offline, `CloudinaryModule` instancie automatiquement `LocalFileService`. Les images chargées par les utilisateurs sont sauvegardées localement dans le dossier `./uploads` (au lieu de Cloudinary) et l'API renvoie des chemins relatifs (`/uploads/1716...filename.jpg`).
4. **WhatsApp** : Si les tokens d'API WhatsApp sont vides (mode offline), le service ne lève plus d'erreur bloquante et simule l'envoi des messages en mode No-Op dans la console de debug.

---

## 📱 Guide d'Intégration pour le Développeur Frontend

Le développeur frontend doit suivre ces directives pour interagir correctement avec le backend local dans Electron ou Capacitor.

### 1. Gestion de la Détection de Réseau (Connectivity Guard)
Le frontend doit surveiller l'état de la connexion Internet et changer son comportement :
* **Sur Mobile (Capacitor)** : Utiliser le plugin `@capacitor/network`.
* **Sur Desktop (Electron)** : Utiliser `navigator.onLine` combiné avec des écouteurs d'événements.

```javascript
import { Network } from '@capacitor/network';

// Écouter les changements de connexion
Network.addListener('networkStatusChange', status => {
  console.log('Changement de statut réseau :', status);
  if (status.connected) {
    // Déclencher la synchronisation en tâche de fond
    triggerSync();
  }
});
```

### 2. Adresses IP, CORS et Protocoles
Le CORS du backend (`main.ts`) autorise désormais :
* `app://.` et `file://` pour l'intégration sécurisée dans Electron.
* `capacitor://localhost` et `http://localhost` pour Capacitor Android/iOS WebView.

Le frontend Electron doit requérir le serveur NestJS local sur `http://localhost:3001` (ou le port défini).

### 3. Gestion des Identifiants (UUID temporaires) & Local ID
En mode déconnecté, la création d'enregistrements (Ventes, Mouvements de stock, Clients) doit générer des **UUID côté client**.
* Le schéma Prisma contient un champ `localId` et un statut `syncStatus`.
* Lors de la création hors-ligne, le frontend génère un UUID client pour l'enregistrement, l'enregistre localement sur le backend offline avec `syncStatus: "PENDING"`.

### 4. Utilisation de la SyncQueue (File de Synchronisation)
Chaque fois qu'une action de modification (écriture/mise à jour/suppression) est effectuée hors-ligne :
1. L'application frontend appelle le backend local.
2. Le backend local sauvegarde la donnée dans SQLite et crée automatiquement une entrée dans la table `SyncQueue`.
3. Lorsque la connexion Internet est rétablie, le service de fond du backend (`SyncQueueProcessor`) va dépiler les actions et les envoyer vers le serveur PostgreSQL cloud de production.

Le frontend peut surveiller la queue ou forcer la synchronisation :
* **Récupérer l'état de la queue** : `GET /api/v1/sync-queue`
* **Forcer un traitement** : `POST /api/v1/sync-queue/process`

### 5. Résolution des Conflits sur le Frontend
Si un enregistrement échoue à la synchronisation centrale (statut `CONFLICT`), le développeur frontend doit afficher un écran de résolution à l'utilisateur. 
Trois stratégies sont disponibles via `PATCH /api/v1/sync-queue/:id/resolve` :
1. **`KEEP_LOCAL`** : Écraser les données du serveur cloud avec la version locale de l'appareil.
2. **`KEEP_SERVER`** : Abandonner les modifications locales de l'appareil et garder la version cloud.
3. **`MERGE`** : Envoyer un payload combiné (fusionné manuellement par l'utilisateur).

### 6. Affichage des Images
Le frontend doit savoir lire à la fois :
* Les URLs absolues de production (ex: `https://res.cloudinary.com/...`)
* Les chemins relatifs en mode offline (ex: `/uploads/1716500.jpg`). 
Pour ces derniers, préfixer avec l'adresse du backend local : `http://localhost:3001/uploads/1716500.jpg`.
> **Note** : Le serveur NestJS expose statiquement le dossier `uploads/` via `http://localhost:3001/uploads/`.
