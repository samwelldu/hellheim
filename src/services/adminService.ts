import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTIONS_TO_PURGE = [
    'mythic_progress',
    'mythic_history',
    'attendance_roster',
    'quota_uploads',
    'quote',
    'applications',
    'raid_compositions',
    'raid_progress'
];

export const adminService = {
    /**
     * Purga todas las colecciones de datos operativos.
     * Mantiene la configuración y al usuario administrador actual.
     */
    async TanPurgarBaseDeDatos(adminEmail: string): Promise<void> {
        console.log(`[TanSystem] Iniciando purga total solicitada por: ${adminEmail}`);

        try {
            // 1. Purgar colecciones operativas
            for (const collectionName of COLLECTIONS_TO_PURGE) {
                await this._deleteCollection(collectionName);
            }

            // 2. Purgar colección de USERS (excepto el actual)
            await this._purgeUsers(adminEmail);

            console.log('[TanSystem] Purga completada con éxito.');
        } catch (error) {
            console.error('[TanSystem] Error durante la purga:', error);
            throw error;
        }
    },

    /**
     * Helper para borrar todos los documentos de una colección en batches
     */
    async _deleteCollection(collectionName: string): Promise<void> {
        const snapshot = await getDocs(collection(db, collectionName));
        if (snapshot.empty) {
            console.log(`[TanSystem] Colección ${collectionName} ya está limpia.`);
            return;
        }

        console.log(`[TanSystem] Limpiando ${snapshot.size} documentos de ${collectionName}...`);

        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
            batch.delete(d.ref);
        });

        await batch.commit();
    },

    /**
     * Helper específico para USERS que protege al admin actual
     */
    async _purgeUsers(excludeEmail: string): Promise<void> {
        const snapshot = await getDocs(collection(db, 'USERS'));
        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((d) => {
            if (d.id !== excludeEmail) {
                batch.delete(d.ref);
                count++;
            }
        });

        if (count > 0) {
            console.log(`[TanSystem] Eliminando ${count} usuarios de la whitelist.`);
            await batch.commit();
        } else {
            console.log(`[TanSystem] No hay otros usuarios para eliminar.`);
        }
    }
};
