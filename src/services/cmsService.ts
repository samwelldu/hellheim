import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface LandingContent {
    hero: {
        title: string;
        subtitle: string;
        videoId: string;
    };
    vision: {
        tag: string;
        title: string;
        highlight: string;
        description: string;
    };
    recruitment: {
        role: string;
        status: 'Alta' | 'Media' | 'Cerrado';
        icon: string;
        color: string;
    }[];
}

export interface GuildNews {
    id?: string;
    title: string;
    author: string;
    bannerUrl: string;
    content: string;
    createdAt: number;
}

const DEFAULT_CONTENT: LandingContent = {
    hero: {
        title: "MIDNIGHT",
        subtitle: "El Retorno a Quel'Thalas • Legión de la Sombra",
        videoId: "Z0_cI-DqjE8"
    },
    vision: {
        tag: "Nuestra Historia",
        title: "Forjados en Classic,",
        highlight: "Renacidos en Midnight.",
        description: "Hellheim nació en los ecos de TBC Classic como una promesa de lealtad. Tras enfrentar tormentas en Pandaria y problemas técnicos que pusieron a prueba nuestra voluntad, decidimos evolucionar y migrar hacia Retail. Durante The War Within, forjamos un roster que tanteó el terreno mítico con valentía. Hoy, en Midnight, regresamos con toda nuestra fuerza para conquistar cada desafío que Azeroth nos ponga por delante. El legado continúa."
    },
    recruitment: [
        { role: 'Tanks', status: 'Cerrado', icon: 'Shield', color: 'text-red-500' },
        { role: 'Healers', status: 'Alta', icon: 'Zap', color: 'text-green-500' },
        { role: 'DPS', status: 'Media', icon: 'Sword', color: 'text-yellow-500' }
    ]
};

export const cmsService = {
    getLandingContent: async (): Promise<LandingContent> => {
        const docRef = doc(db, 'cms', 'landing');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as LandingContent;
        } else {
            // Initialize with default if not exists
            await setDoc(docRef, DEFAULT_CONTENT);
            return DEFAULT_CONTENT;
        }
    },

    updateLandingContent: async (content: LandingContent): Promise<void> => {
        const docRef = doc(db, 'cms', 'landing');
        await setDoc(docRef, content);
    },

    subscribeToLanding: (callback: (content: LandingContent) => void) => {
        const docRef = doc(db, 'cms', 'landing');
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as LandingContent);
            } else {
                setDoc(docRef, DEFAULT_CONTENT).catch(console.error);
                callback(DEFAULT_CONTENT);
            }
        });
    },

    // Guild News Methods
    getGuildNews: async (): Promise<GuildNews[]> => {
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const newsRef = collection(db, 'guild_news');
        const q = query(newsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuildNews));
    },

    addNewsItem: async (news: GuildNews): Promise<void> => {
        const { collection, addDoc } = await import('firebase/firestore');
        const newsRef = collection(db, 'guild_news');
        await addDoc(newsRef, { ...news, createdAt: Date.now() });
    },

    deleteNewsItem: async (id: string): Promise<void> => {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'guild_news', id);
        await deleteDoc(docRef);
    }
};
