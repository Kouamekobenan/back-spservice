# SP-Services Backend V1.0 🚀
### Gestion de Services - Superette & Quincaillerie

Bienvenue dans le backend de **SP-Services**, une plateforme robuste conçue pour la gestion moderne des commerces multi-boutiques (Superettes, Quincailleries, Dépôts de Gaz, etc.). 

Cette application est construite avec **NestJS** en suivant les principes de l'**Architecture Orientée Domaine (DDD)** pour garantir scalabilité, maintenabilité et robustesse.

---

## 🏗️ Architecture du Projet (DDD)

Le projet respecte une architecture en couches (Clean Architecture / DDD) :

- **Domain Layer** : Contient le cœur métier (Entities, Interfaces de dépôts, Logique pure).
- **Application Layer** : Orchestre les cas d'utilisation (Use Cases) et gère les DTOs.
- **Infrastructure Layer** : Implémentations techniques (Prisma, Cloudinary, etc.).
- **Presentation Layer** : Contrôleurs REST exposant l'API.

---

## 👥 Rôles Utilisateurs & Permissions

Le système gère 5 niveaux d'accès distincts pour assurer une sécurité maximale et une séparation des responsabilités :

| Rôle | Description | Portée |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Accès total et absolu à l'ensemble du système. | Global (Toutes les boutiques) |
| **ADMIN** | Administrateur de sa propre boutique. | Boutique Spécifique |
| **MANAGER** | Gère les stocks, les achats et les rapports quotidiens. | Boutique Spécifique |
| **CASHIER** | Utilise l'interface POS pour les ventes uniquement. | Point de Vente |
| **AUDITOR** | Accès en lecture seule pour l'audit et le contrôle. | Boutique Spécifique |

---

## 🏢 Gestion Multi-Boutiques (Shops)

Le système est conçu pour être **Multi-Boutiques**. Chaque boutique est une entité isolée avec ses propres configurations, stocks et personnels.

### Caractéristiques principales :
- **Isolation des données** : Les produits, ventes et utilisateurs sont rattachés à une boutique spécifique.
- **Paramètres personnalisés** : Chaque boutique définit sa devise (ex: XOF), ses taxes et son logo.
- **Statut d'activité** : Possibilité d'activer ou désactiver une boutique instantanément.

---

## 📂 Gestion des Catégories (Hiérarchie)

Le module **Category** permet une classification arborescente des produits.

### Fonctionnement Parent/Enfant :
```mermaid
graph TD
    A[Alimentation] --> B[Boissons]
    A --> C[Conserves]
    B --> D[Jus de Fruits]
    F[Quincaillerie] --> G[Outillage]
```

---

## 📏 Gestion des Unités (Units)

Le module **Unit** standardise les mesures pour tout le catalogue.

### Points clés :
- **Standardisation** : Définit les unités (Kg, Litre, Pièce, Carton, etc.).
- **Conversion Visuelle** : Stockage des abréviations (pcs, kg, L) pour les reçus et étiquettes.
- **Impact Inventaire** : Crucial pour les calculs de stock et les ventes au détail.

---

## 📦 Catalogue Produits (Products)

Le module **Product** est le noyau central de l'application. Il lie toutes les entités pour permettre la vente et la gestion de stock.

### Architecture du Produit :
```mermaid
erDiagram
    SHOP ||--o{ PRODUCT : "possède"
    CATEGORY ||--o{ PRODUCT : "classifie"
    UNIT ||--o{ PRODUCT : "mesure"
    PRODUCT ||--o{ STOCK_MOVEMENT : "génère"
    PRODUCT ||--o{ SALE_ITEM : "est vendu via"
    PRODUCT {
        string id
        string name
        string barcode
        decimal buyingPrice
        decimal sellingPrice
        decimal stockQty
        json metadata
    }
```

### Logique Métier Avancée :
- **Isolation Critique** : Un code-barres est unique **par boutique**. Cela permet à deux commerces différents d'utiliser le même backend pour leurs propres stocks.
- **Seuils d'Alerte** : Chaque produit possède un `minStockQty`. Le backend expose des endpoints d'alerte pour notifier le frontend des ruptures imminentes.
- **Métadonnées Flexibles** : Le champ `metadata` permet d'ajouter des spécificités métier (ex: type de gaz, poids net, dimensions) sans changer la structure de la base de données.
- **Valorisation du Stock** : Calcul automatique des marges et de la valeur totale du stock.

---

## 📦 Kits & Produits Composés (Product Components)

Le module **ProductComponent** permet de créer des offres groupées ou des produits transformés à partir de composants de base.

### Fonctionnalités :
- **Composition Flexible** : Liez plusieurs produits (composants) à un produit maître (kit).
- **Gestion des Quantités** : Définissez précisément la quantité de chaque composant utilisée dans le kit.
- **Réduction de Stock** : (Prévu) La vente d'un kit peut automatiquement déduire les stocks de ses composants.
- **Transparence** : Visualisation complète de la structure d'un kit pour le frontend.

---

## 📅 Gestion des Lots & Péremption (Product Batches)

Le module **ProductBatch** assure la traçabilité et la sécurité alimentaire/sanitaire du catalogue.

### Fonctionnalités :
- **Suivi par Lot** : Chaque arrivage est identifié par un numéro de lot unique.
- **Gestion des Dates (DLC/DLUO)** : Surveillance automatique des dates d'expiration.
- **Alertes Proactives** : Extraction des lots arrivant à échéance pour éviter les pertes.
- **Coûts Précis** : Permet de suivre le prix d'achat exact de chaque lot pour une comptabilité rigoureuse.

---

## 👥 Gestion des Clients (Customers)

Le module **Customer** centralise la gestion de la relation client et le suivi des balances financières.

### Fonctionnalités Clés :
- **Suivi des Dettes (Balance)** : Monitoring en temps réel de la dette totale (`totalDebt`) pour chaque client.
- **Gestion des Risques** : Définition de plafonds de crédit (`creditLimit`) pour limiter l'exposition financière.
- **Support Offline-First** : Création et modification de clients en mode hors-ligne avec synchronisation intelligente.
- **Fiche Client Complète** : Centralisation des coordonnées (téléphone, email, adresse) et historique des transactions.

---

## 💳 Règlements de Crédits (Credit Payments)

Le module **CreditPayment** gère le recouvrement des dettes et assure l'intégrité des flux financiers.

### Fonctionnalités Clés :
- **Transactions Atomiques** : Chaque règlement met à jour instantanément la dette du client via des transactions de base de données sécurisées.
- **Multi-Modes de Paiement** : Support complet pour les règlements en espèces, Mobile Money (avec référence) et carte bancaire.
- **Traçabilité & Audit** : Archivage précis de chaque versement avec notes explicatives pour un rapprochement comptable facilité.
- **Files d'Attente de Sync** : Les paiements encaissés hors-ligne sont mis en file d'attente et synchronisés dès le retour de la connexion.

---

## 🏧 Sessions de Caisse (Cash Sessions)

Le module **CashSession** assure le contrôle rigoureux des flux de trésorerie quotidiens et la responsabilité des caissiers.

### Fonctionnalités Clés :
- **Réconciliation de Caisse** : Calcul automatique du solde attendu (`expectedBalance`) basé sur les ventes réelles par rapport au fond de caisse initial.
- **Suivi des Écarts** : Identification immédiate des surplus ou manquants de caisse (`difference`) lors de la clôture pour un audit simplifié.
- **Gestion de la Responsabilité** : Verrouillage logique empêchant un opérateur d'ouvrir plusieurs sessions simultanées, garantissant une traçabilité sans faille.
- **Intégration des Ventes** : Liaison directe de chaque transaction de vente à une session spécifique pour un rapport financier consolidé.

---

## 🛒 Gestion des Ventes (Sales)

Le module **Sale** est le moteur transactionnel central qui orchestre les stocks, les finances et la relation client.

### Fonctionnalités Clés :
- **Paniers Multi-Articles** : Traitement de paniers complexes avec prix unitaires et remises spécifiques par ligne.
- **Paiements Mixtes** : Support de plusieurs modes de règlement (Espèces, Carte, Mobile Money, Crédit) pour une même vente.
- **Synchronisation Atomique du Stock** : Réduction en temps réel des stocks et traçabilité de chaque mouvement via `StockMovement`.
- **Intégration de la Dette** : Mise à jour automatique de la balance client en cas de paiement à crédit.
- **Facturation Intelligente** : Génération de numéros de reçus uniques et normalisés (ex: `VTE-20260510-0001`).

### Flux de Communication d'une Vente :
```mermaid
sequenceDiagram
    participant FE as Frontend
    participant SC as SaleController
    participant UC as CreateSaleUseCase
    participant SR as SaleRepository
    participant DB as Prisma/Database

    FE->>SC: POST /sales (CreateSaleDto)
    SC->>UC: execute(dto)
    UC->>SR: generateReceiptNumber(shopId)
    SR->>DB: count today's sales
    DB-->>SR: count
    SR-->>UC: receiptNumber
    UC->>SR: create(dto, receiptNumber)
    Note over SR,DB: DEBUT TRANSACTION (Atomique)
    SR->>DB: Créer l'enregistrement Sale
    loop chaque article
        SR->>DB: Décrémenter Stock Produit
        SR->>DB: Créer StockMovement (SALE)
    end
    alt Paiement à Crédit
        SR->>DB: Incrémenter Dette Client
    end
    Note over SR,DB: FIN TRANSACTION (Commit)
    SR-->>UC: Entité Sale
    UC-->>SC: Entité Sale
    SC-->>FE: 201 Created (Détails de la vente)
```

---

## 🛠️ Stack Technique

- **Framework** : [NestJS](https://nestjs.com/) (Node.js)
- **Langage** : TypeScript
- **ORM** : [Prisma](https://www.prisma.io/)
- **Base de Données** : PostgreSQL
- **Documentation** : Swagger / OpenAPI

---

## 🚀 Installation & Démarrage

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

---

## 📝 Documentation API
Une fois le serveur lancé, accédez à Swagger : `http://localhost:3001/api/v1/docs`