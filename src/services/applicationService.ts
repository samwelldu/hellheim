import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    onSnapshot
} from 'firebase/firestore';

export interface GuildApplication {
    id?: string;
    characterName: string;
    className: string;
    spec: string;
    masteryLevel: number; // 1-10
    objectives: string;
    isConstant: 'si' | 'no' | 'alternativa';
    guildMeaning: string;
    battleTag: string;
    discord: string;
    status: 'Pendiente' | 'Revisando' | 'Aceptado' | 'Rechazado';
    createdAt: number;
}

const COLLECTION_NAME = 'applications';

export const applicationService = {
    // Tan: Envío de nueva postulación
    submitApplication: async (data: Omit<GuildApplication, 'status' | 'createdAt'>): Promise<string> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            status: 'Pendiente',
            createdAt: Date.now()
        });
        return docRef.id;
    },

    // Tan: Obtener todas las postulaciones (Admin)
    getApplications: async (): Promise<GuildApplication[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GuildApplication));
    },

    // Tan: Suscribirse en tiempo real (Admin)
    subscribeApplications: (callback: (apps: GuildApplication[]) => void) => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GuildApplication));
            callback(apps);
        });
    },

    // Tan: Cambiar estado de una aplicación
    updateStatus: async (id: string, status: GuildApplication['status']): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
    },

    // Tan: Eliminar postulación
    deleteApplication: async (id: string): Promise<void> => {
        const { deleteDoc } = await import('firebase/firestore');
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
