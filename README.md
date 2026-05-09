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
Une fois le serveur lancé, accédez à Swagger : `http://localhost:3000/api/v1/docs`