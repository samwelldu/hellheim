import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { mythicPlusService } from '../services/mythicPlusService';
import { attendanceService } from '../services/attendanceService';
import { blizzardService } from '../services/blizzard';

interface AuthContextType {
    user: User | null;
    userRole: string | null;
    blizzardUser: any | null;
    mainCharacter: any | null;
    playerToken: string | null;
    isAdmin: boolean;
    loading: boolean;
    setBlizzardUser: (user: any) => void;
    setMainCharacter: (char: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userRole: null,
    blizzardUser: null,
    mainCharacter: null,
    playerToken: null,
    isAdmin: false,
    loading: true,
    setBlizzardUser: () => { },
    setMainCharacter: async () => { }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [blizzardUser, setBlizzardUser] = useState<any | null>(null);
    const [mainCharacter, setMainCharacter] = useState<any | null>(null);
    const [playerToken, setPlayerToken] = useState<string | null>(null); // Initialized playerToken state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tan: Recuperamos usuario de Blizzard de sessionStorage si existe
        const savedBlizzard = sessionStorage.getItem('TanBlizzardUser');
        if (savedBlizzard) {
            const parsed = JSON.parse(savedBlizzard);
            setBlizzardUser(parsed);
            if (parsed?.id) {
                const token = parsed.id.toLowerCase().replace('#', '-');
                setPlayerToken(token);

                // Tan: Cargamos datos persistentes de este linaje
                getDoc(doc(db, 'USERS', parsed.id)).then(docSnap => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserRole(data.role || 'member');
                        setMainCharacter(data.mainCharacter || null);
                    }
                });
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                try {
                    // Load user role from Firestore
                    const userDocRef = doc(db, 'USERS', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role || 'member');
                        setMainCharacter(data.mainCharacter || null);
                    } else {
                        // User document doesn't exist, create it
                        // Check if this is the first user (auto-promote to admin)
                        const usersCollection = collection(db, 'USERS');
                        const adminQuery = query(usersCollection, where('role', '==', 'admin'));
                        const adminSnapshot = await getDocs(adminQuery);

                        const isFirstUser = adminSnapshot.empty;
                        const newRole = isFirstUser ? 'admin' : 'member';

                        await setDoc(userDocRef, {
                            email: user.email,
                            role: newRole,
                            displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        });

                        setUserRole(newRole);
                        console.log(`User created with role: ${newRole}${isFirstUser ? ' (first user, auto-admin)' : ''}`);
                    }
                } catch (error) {
                    console.error('Error loading user role:', error);
                    setUserRole('member'); // Fallback to member
                }
            } else if (blizzardUser) {
                // Tan: Si es usuario de Blizzard, es miembro de la hermandad
                setUserRole('member');
            } else {
                setUserRole(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, [blizzardUser]);

    // Tan: Recuperamos el usuario de Blizzard si existe en la sesión
    useEffect(() => {
        const saved = sessionStorage.getItem('TanBlizzardUser');
        if (saved) {
            setBlizzardUser(JSON.parse(saved));
        }
    }, []);

    const TanSetBlizzardUser = async (data: any) => {
        setBlizzardUser(data);
        if (data) {
            sessionStorage.setItem('TanBlizzardUser', JSON.stringify(data));
            if (data?.id) {
                const token = data.id.toLowerCase().replace('#', '-');
                setPlayerToken(token);

                // Tan: Registro automático en Firestore para usuarios de Blizzard
                try {
                    const userDocRef = doc(db, 'USERS', data.id);
                    const userDoc = await getDoc(userDocRef);

                    if (!userDoc.exists()) {
                        console.log(`[TanSystem] Registrando nuevo linaje Blizzard: ${data.id}`);
                        await setDoc(userDocRef, {
                            accountId: data.id,
                            playerToken: token,
                            role: 'member',
                            authMethod: 'blizzard',
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        });
                        setUserRole('member');
                    } else {
                        const existingData = userDoc.data();
                        setUserRole(existingData.role || 'member');
                        setMainCharacter(existingData.mainCharacter || null);
                    }

                    // Tan: Sincronización del Mapa de Identidades (Personaje -> PlayerToken)
                    // Esto permite que el sistema de Oro atribuya aportes de alters al mismo jugador
                    console.log(`[TanSystem] Sincronizando mapa de personajes para ${data.id}...`);
                    const blizzardData = await blizzardService.getUserCharacters(data.token, data.region || 'us');
                    if (blizzardData && blizzardData.wow_accounts) {
                        for (const account of blizzardData.wow_accounts) {
                            if (!account.characters) continue;
                            for (const char of account.characters) {
                                if (char.level < 10) continue; // Ignoramos niveles muy bajos para no saturar
                                const charMappingId = `${char.name.toLowerCase().trim()}-${char.realm.slug}`;
                                await setDoc(doc(db, 'character_mapping', charMappingId), {
                                    playerToken: token,
                                    updatedAt: Date.now()
                                }, { merge: true });
                            }
                        }
                    }

                } catch (error) {
                    console.error("[TanSystem] Error al sincronizar perfil Blizzard:", error);
                }
            }
        } else {
            sessionStorage.removeItem('TanBlizzardUser');
            setPlayerToken(null);
            setUserRole(null);
        }
    };

    const TanActualizarMain = async (charData: any) => {
        // Tan: Permitimos el registro si hay usuario de Firebase O de Blizzard
        const userId = user?.uid || blizzardUser?.id;
        if (!userId || !playerToken) {
            console.warn("[TanSystem] No hay identidad activa para guardar el main o playerToken.");
            return;
        }

        try {
            const userDocRef = doc(db, 'USERS', userId);
            await setDoc(userDocRef, {
                mainCharacter: charData,
                playerToken: playerToken, // Save playerToken to Firestore
                updatedAt: Date.now()
            }, { merge: true });

            setMainCharacter(charData);

            // Tan: Registro unificado usando el ID natural del personaje (nombre-reino)
            // Ya no usamos playerToken como ID del documento para evitar sobreescritura de alters
            console.log(`[TanSystem] Vinculando progreso del main: ${charData.name}`);
            await Promise.allSettled([
                mythicPlusService.syncWithBlizzard(charData.name, charData.realm),
                attendanceService.addCharacter(charData.name, charData.realm)
            ]);

        } catch (error) {
            console.error('Error al actualizar personaje principal:', error);
            throw error;
        }
    };

    // Tan: Centralizamos la verificación de oficialía (Solo Firebase Auth puede ser Admin)
    const isAdmin = !!user && userRole === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            blizzardUser,
            mainCharacter,
            playerToken,
            isAdmin,
            loading,
            setBlizzardUser: TanSetBlizzardUser,
            setMainCharacter: TanActualizarMain
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);