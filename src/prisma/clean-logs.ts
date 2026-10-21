import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanLogs() {
  console.log('🧹 [MAINTENANCE] Début du nettoyage des logs...');

  // 1. Vider les logs d'audit (désactivés et non nécessaires)
  const deletedAudit = await prisma.auditLog.deleteMany();
  console.log(`✅ ${deletedAudit.count} logs d'audit supprimés.`);

  // 2. Nettoyer le changelog (conserver 7 jours max pour la synchro)
  const thresholdChangeLog = new Date();
  thresholdChangeLog.setDate(thresholdChangeLog.getDate() - 7);
  const deletedChangeLog = await prisma.changeLog.deleteMany({
    where: { changedAt: { lt: thresholdChangeLog } },
  });
  console.log(`✅ ${deletedChangeLog.count} entrées de changelog (> 7 jours) supprimées.`);

  // 3. Nettoyer la file de synchronisation déjà traitée
  const thresholdSync = new Date();
  thresholdSync.setDate(thresholdSync.getDate() - 7);
  const deletedSyncQueue = await prisma.syncQueue.deleteMany({
    where: {
      syncStatus: 'SYNCED',
      syncedAt: { lt: thresholdSync },
    },
  });
  console.log(`✅ ${deletedSyncQueue.count} éléments sync_queue (> 7 jours) supprimés.`);

  // 4. Défragmentation et libération de l'espace physique disque (PostgreSQL)
  try {
    console.log('🧹 Exécution du VACUUM FULL pour récupérer l\'espace disque sur Render...');
    await prisma.$executeRawUnsafe('VACUUM FULL change_log;');
    await prisma.$executeRawUnsafe('VACUUM FULL audit_logs;');
    await prisma.$executeRawUnsafe('VACUUM FULL sync_queue;');
    console.log('✅ VACUUM FULL terminé avec succès (espace disque Render libéré).');
  } catch (vacuumErr: any) {
    console.log('ℹ️ Remarque VACUUM :', vacuumErr?.message || vacuumErr);
  }

  console.log('🎉 Espace disque libéré avec succès !');
}

cleanLogs()
  .catch((err) => {
    console.error('❌ Erreur lors du nettoyage :', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
