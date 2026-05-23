// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// async function clearDatabase() {
//   // Respecte l'ordre des dépendances FK
//   await prisma.syncQueue.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.supplier.deleteMany();
//   await prisma.user.deleteMany();
//   console.log('✅ Base vidée avec succès');
// }

// clearDatabase()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());