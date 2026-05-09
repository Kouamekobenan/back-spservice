export enum UserRole {
  ADMIN = 'ADMIN',   // Accès total à sa boutique
  SUPER_ADMIN ='SUPER_ADMIN',  // Accès total à toutes les boutiques
  MANAGER   = 'MANAGER',  // Gestion stocks, rapports, mais pas paramètres
  CASHIER="CASHIER",   // Caisse uniquement
  AUDITOR = 'AUDITOR',  // Lecture seule, audit
}
 
  
  