import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, app } from '../config/firebase';

export type UserRole = 'admin' | 'supervisor' | 'member';

export interface AppUser {
    id?: string;
    email?: string;
    accountId?: string; // BattleTag
    alias?: string;
    role: UserRole;
    createdAt: any;
    updatedAt?: any; // Tan: Para rastrear el último personaje activo
    mainCharacter?: any;
    playerToken?: string;
}

const COLLECTION_NAME = 'USERS';

// Initialize a secondary app for admin actions (to avoid logging out the current user)
const getSecondaryApp = () => {
    const secondaryAppName = "secondary";
    const existingApps = getApps();
    const secondaryApp = existingApps.find(a => a.name === secondaryAppName);

    if (secondaryApp) return secondaryApp;

    // Reuse the same config as the main app
    return initializeApp(app.options, secondaryAppName);
};

export const userService = {
    // Get all allowed users
    async getAllUsers(): Promise<AppUser[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            let date = data.createdAt;

            // Tan: Normalización de fecha robusta (Timestamp, Date o Número)
            if (date && typeof date.toDate === 'function') {
                date = date.toDate();
            } else if (typeof date === 'number') {
                date = new Date(date);
            }

            return {
                id: docSnap.id,
                ...data,
                createdAt: date
            } as AppUser;
        });
    },

    // Add a new user (Firestore + Auth)
    async addUser(email: string, password?: string, role: UserRole = 'member', alias?: string): Promise<AppUser> {

        // 1. Create/Update in Firestore (Whitelist)
        const newUser: Omit<AppUser, 'id'> = {
            email,
            role,
            alias: alias || '', // Initialize alias
            createdAt: new Date()
        };

        // Use email as the specific Document ID
        await setDoc(doc(db, COLLECTION_NAME, email), newUser, { merge: true });

        // 2. Create in Firebase Auth (if password provided)
        if (password) {
            try {
                const secondaryApp = getSecondaryApp();
                const secondaryAuth = getAuth(secondaryApp);
                await createUserWithEmailAndPassword(secondaryAuth, email, password);
                await signOut(secondaryAuth);
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log(`User ${email} already exists in Auth. Whitelisted successfully.`);
                } else {
                    console.error("Error creating auth user:", error);
                    throw new Error(`User whitelisted but Auth creation failed: ${error.message}`);
                }
            }
        }

        return { id: email, ...newUser };
    },

    // Update user role
    async updateUserRole(id: string, role: UserRole): Promise<void> {
        await updateDoc(doc(db, COLLECTION_NAME, id), { role });
    },

    // Update user alias
    async updateUserAlias(id: string, alias: string): Promise<void> {
        await updateDoc(doc(db, COLLECTION_NAME, id), { alias });
    },

    // Remove a user from the whitelist
    async deleteUser(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
