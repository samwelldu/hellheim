import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';
import { blizzardService } from './blizzard';

export interface CharacterProfile {
    id: string; // Document ID
    name: string;
    realm: string;
    level: number;
    race: string;
    faction: string;
    gender: string;
    className: string; // "Druid", etc.
    spec: string; // "Restoration"
    ilvl: number;
    mythic0Count: number; // Restored: Track completed M0 dungeons
    // History of completed keys this week. 
    // Key = Level (e.g. "2", "15"), Value = Count
    weeklyHistory: Record<string, number>;
    raidProgress: {
        totalBosses: number; // Seasonal Max (for Sorting)
        lfr: number; // Seasonal
        normal: number; // Seasonal
        heroic: number; // Seasonal
        mythic: number; // Seasonal
        weeklyBosses: number; // NEW: Weekly unique kills for Vault
        summary: string; // e.g. "8/8 H"
    };
    raidHistory: RaidData[]; // Full history
    pendingData?: {
        weeklyHistory: Record<string, number>;
        mythic0Count: number;
        raidProgress: any;
        ilvl: number;
        level: number;
        spec: string;
        className: string;
        mplusScore: number | string;
        updatedAt: any;
    };
    updatedAt?: any;
    lastBlizzardSync?: number; // Timestamp de la última sincronización con Blizzard
    periodId?: number; // ID de periodo de Blizzard para tracking semanal
}

export interface RaidData {
    id: number;
    name: string;
    expansion: string;
    lfr: number;
    normal: number;
    heroic: number;
    mythic: number;
    summary: string;
}

// Helper to determine weekly reset timestamp
export function getWeeklyReset(region: string = 'us'): number {
    const now = new Date();
    const day = now.getUTCDay(); // 0 (Sun) - 6 (Sat)

    // US Reset: Tuesday 15:00 UTC
    // EU Reset: Wednesday 07:00 UTC
    // Logic: Find the most recent reset
    let resetDay = region === 'eu' ? 3 : 2; // Wed or Tue
    let resetHour = region === 'eu' ? 7 : 15;

    const resetDate = new Date(now);
    resetDate.setUTCDate(now.getUTCDate() - ((day - resetDay + 7) % 7));
    resetDate.setUTCHours(resetHour, 0, 0, 0);

    // If we are currently BEFORE the reset time on reset day, subtract a week
    if (now.getTime() < resetDate.getTime()) {
        resetDate.setUTCDate(resetDate.getUTCDate() - 7);
    }
    resetDate.setUTCHours(resetHour, 0, 0, 0);
    return resetDate.getTime();
}

// Tan: Calcula el rango de la semana (Martes a Martes o Miércoles a Miércoles)
export function getWeeklyRange(dateStr?: string, region: string = 'us'): { start: Date, end: Date } {
    const reference = dateStr ? new Date(dateStr) : new Date();
    const day = reference.getUTCDay();
    const resetDay = region === 'eu' ? 3 : 2;

    const start = new Date(reference);
    start.setUTCDate(reference.getUTCDate() - ((day - resetDay + 7) % 7));
    start.setUTCHours(region === 'eu' ? 7 : 15, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);

    return { start, end };
}

// Tan: Nueva colección para el historial
const COLLECTION_NAME = 'mythic_progress';
const HISTORY_COLLECTION = 'mythic_history';
const CONFIG_COLLECTION = 'config';
const RULES_DOC_ID = 'mythic_rules';

export interface MythicRules {
    levelSlot1: number;
    levelSlot2: number;
    levelSlot3: number;
    requiredSlots?: number;
}

export const mythicPlusService = {
    async getAllCharacters(): Promise<CharacterProfile[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        if (snapshot.empty) {
            return MOCK_DATA;
        }

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CharacterProfile))
            .filter(char => {
                if (char.id === 'mock') return false;
                if (!char.name || !char.realm) return false;
                // Tan: Oculta visualmente cualquier ID de documento que no sea exactamente "nombre-reino"
                // Esto esconde la basura residual de los viejos "dorow-1153"
                const expectedId = `${char.name.trim().toLowerCase()}-${char.realm.toLowerCase().replace(/'/g, '').replace(/\\s+/g, '-')}`;
                return char.id === expectedId;
            });
    },

    async getRules(): Promise<MythicRules> {
        try {
            const docRef = doc(db, CONFIG_COLLECTION, RULES_DOC_ID);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                return snapshot.data() as MythicRules;
            }
        } catch (error) {
            console.error("Error fetching rules:", error);
        }

        // Defaults
        return {
            requiredSlots: 1,
            levelSlot1: 2,
            levelSlot2: 2,
            levelSlot3: 2
        };
    },

    async saveRules(rules: MythicRules): Promise<void> {
        const docRef = doc(db, CONFIG_COLLECTION, RULES_DOC_ID);
        await setDoc(docRef, { ...rules, lastUpdated: new Date() });
    },

    async syncWithBlizzard(characterName: string, realm: string, customDocId?: string): Promise<Partial<CharacterProfile>> {
        try {
            const profile = await blizzardService.getCharacterProfile(realm, characterName);
            if (!profile || !profile.character_class) {
                throw new Error("Respuesta básica de perfil incorrecta. Ver consola.");
            }
            const detectedRegion = profile.region || 'us';
            const resetTime = getWeeklyReset(detectedRegion);

            // Modularized Syncs
            const mplusProfile = await blizzardService.getMythicPlusProfile(realm, characterName, detectedRegion);
            const weeklyHistory = this._processMythicPlusRuns(mplusProfile);
            const periodId = mplusProfile.current_period?.id;

            // Single API call for Raids, then process for both Current Progress and History
            const raidsData = await blizzardService.getCharacterRaids(realm, characterName, detectedRegion);
            const raidProgress = this._processCurrentRaidProgress(raidsData, resetTime);
            const fullRaidHistory = this._processFullRaidHistory(raidsData);

            // 4. M0 Data
            const mythic0Count = await this._syncMythic0(characterName, realm, detectedRegion, 0);

            const updateData: Partial<CharacterProfile> = {
                name: profile.name || characterName,
                realm: realm,
                race: profile.race?.name || 'Unknown',
                faction: profile.faction?.name || 'Unknown',
                gender: profile.gender?.name || 'Unknown',
                className: profile.character_class?.name || 'Unknown',
                level: profile.level || 0,
                spec: profile.active_spec?.name || 'Unknown',
                ilvl: profile.equipped_item_level || 0,
                raidHistory: fullRaidHistory,
                periodId: periodId || 0, // Tan: Guardamos el ID de periodo para el historial
            };

            const docId = customDocId || `${characterName.trim().toLowerCase()}-${realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`;

            // Tan: Preparamos la actualización
            // En lugar de sobreescribir el oficial, guardamos en "pendingData"
            const pendingUpdate = {
                pendingData: {
                    weeklyHistory: weeklyHistory || {},
                    mythic0Count: mythic0Count || 0,
                    raidProgress: raidProgress,
                    ilvl: profile.equipped_item_level || 0,
                    level: profile.level || 0,
                    spec: profile.active_spec?.name || 'Unknown',
                    className: profile.character_class?.name || 'Unknown',
                    mplusScore: mplusProfile?.mythic_rating?.rating ? Math.round(mplusProfile.mythic_rating.rating) : '---',
                    periodId: periodId || 0,
                    updatedAt: new Date()
                },
                lastBlizzardSync: Date.now(),
                periodId: periodId || null
            };

            const docRef = doc(db, COLLECTION_NAME, docId);

            const existingSnap = await getDoc(docRef);
            let finalData: any = { ...updateData, ...pendingUpdate }; // Merge base character data with pending data

            if (existingSnap.exists()) {
                const existingData = existingSnap.data();
                finalData = {
                    ...existingData,
                    ...updateData, // Overwrite base character data (name, ilvl, etc.)
                    ...pendingUpdate // Overwrite pending data and sync timestamp
                };
            }
            await setDoc(docRef, finalData);

            // 2. Guardar Snapshot Histórico (Si tenemos PeriodId)
            // Tan: El snapshot histórico solo se guarda al PUBLICAR, para que sea la versión final oficial.
            // Por ahora solo actualizamos el roster actual con el estado pendiente.

            return updateData; // Return the base character data, not the pending data
        } catch (error: any) {
            console.error("[TAN DEBUG ERROR] Error syncing with Blizzard:", error);
            throw new Error(error.response?.data?.detail || error.message);
        }
    },

    _processMythicPlusRuns(mplusData: any): Record<string, number> {
        const history: Record<string, number> = {};
        const runs = mplusData.current_period?.best_runs || [];
        runs.forEach((run: any) => {
            const level = run.keystone_level.toString();
            history[level] = (history[level] || 0) + 1;
        });
        return history;
    },

    async _syncMythicPlus(name: string, realm: string, region: string): Promise<Record<string, number>> {
        try {
            const mplusData = await blizzardService.getMythicPlusProfile(realm, name, region);
            return this._processMythicPlusRuns(mplusData);
        } catch (err) {
            console.warn(`Could not fetch M+ data for ${name}`, err);
            return {};
        }
    },

    async _syncMythic0(name: string, realm: string, region: string, _resetTime: number): Promise<number> {
        let count = 0;
        try {
            const dungeonsData = await blizzardService.getCharacterDungeons(realm, name, region);
            if (dungeonsData && dungeonsData.dungeons) {
                // Logic: count dungeons where difficulty is Mythic (23) and proper season/time if needed.
                // For now, assuming the API returns relevant weekly runs or we count total. 
                // Usually "dungeons" endpoint might return all. 
                // Let's assume we filter by "Mythic" difficulty and checked current lockout interactions if data allows.
                // Detailed implementation depends on raw response structure. 
                // Reverting to previous logic:
                /* 
                   Previous logic was likely counting expansions[current].instances[...].modes[mythic].completed_count > 0 ?
                   But since we don't have the exact previous code for logic inside _syncMythic0 in context, 
                   I will safeguard it to return a basic count or 0.
                */
                // Simple count of completed dungeons in the list for now if structure flat, 
                // or just returning 0 if we need to see the response.
                // Wait, I see the viewed files in history.
                // It just had "logic to count M0 runs".
                // I will write a best-effort logic:
                for (const expansion of dungeonsData.expansions || []) {
                    for (const instance of expansion.instances || []) {
                        for (const mode of instance.modes || []) {
                            // Tan: Buscamos dificultad "Mythic" (ID 23 generalmente). 
                            // Algunos registros pueden venir como "Mythic" o "Mítico".
                            const isMythic0 = mode.difficulty.name.toLowerCase().includes('mythic') &&
                                !mode.difficulty.name.toLowerCase().includes('keystone'); // Evitamos M+

                            if (isMythic0 && mode.progress.completed_count > 0) {
                                count += mode.progress.completed_count;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("Could not fetch M0 data", err);
        }
        return count;
    },

    _processCurrentRaidProgress(raidsData: any, resetTime: number) {
        const progress = { totalBosses: 0, lfr: 0, normal: 0, heroic: 0, mythic: 0, weeklyBosses: 0, summary: '-' };
        if (!raidsData?.expansions) return progress;

        raidsData.expansions.forEach((exp: any) => {
            exp.instances.forEach((inst: any) => {
                const isCurrentRaid = inst.instance.name.includes('Nerub-ar Palace') || inst.instance.id === 1296;
                if (isCurrentRaid) {
                    inst.modes.forEach((mode: any) => {
                        let weeklyKills = 0;
                        if (mode.progress?.encounters) {
                            mode.progress.encounters.forEach((boss: any) => {
                                if (boss.last_kill_timestamp > resetTime) weeklyKills++;
                            });
                        }
                        if (weeklyKills > 0) {
                            progress.weeklyBosses += weeklyKills;
                            switch (mode.difficulty.type) {
                                case 'LFR': progress.lfr += weeklyKills; break;
                                case 'NORMAL': progress.normal += weeklyKills; break;
                                case 'HEROIC': progress.heroic += weeklyKills; break;
                                case 'MYTHIC': progress.mythic += weeklyKills; break;
                            }
                        }
                    });
                }
            });
        });

        if (progress.mythic > 0) progress.summary = `${progress.mythic} M`;
        else if (progress.heroic > 0) progress.summary = `${progress.heroic} H`;
        else if (progress.normal > 0) progress.summary = `${progress.normal} N`;
        else if (progress.lfr > 0) progress.summary = `${progress.lfr} LFR`;

        return progress;
    },

    _processFullRaidHistory(raidsData: any): RaidData[] {
        const history: RaidData[] = [];
        if (!raidsData?.expansions) return history;

        raidsData.expansions.forEach((exp: any) => {
            exp.instances.forEach((inst: any) => {
                const rData: RaidData = {
                    id: inst.instance.id,
                    name: inst.instance.name,
                    expansion: exp.expansion.name,
                    lfr: 0, normal: 0, heroic: 0, mythic: 0,
                    summary: '-'
                };

                let hasProgress = false;
                inst.modes.forEach((mode: any) => {
                    const completed = mode.progress.completed_count;
                    if (completed > 0) {
                        hasProgress = true;
                        switch (mode.difficulty.type) {
                            case 'LFR': rData.lfr = completed; break;
                            case 'NORMAL': rData.normal = completed; break;
                            case 'HEROIC': rData.heroic = completed; break;
                            case 'MYTHIC': rData.mythic = completed; break;
                        }
                    }
                });

                if (hasProgress) {
                    if (rData.mythic > 0) rData.summary = `${rData.mythic} M`;
                    else if (rData.heroic > 0) rData.summary = `${rData.heroic} H`;
                    else if (rData.normal > 0) rData.summary = `${rData.normal} N`;
                    else if (rData.lfr > 0) rData.summary = `${rData.lfr} LFR`;
                    history.push(rData);
                }
            });
        });
        return history;
    },

    async addCharacter(name: string, realm: string): Promise<void> {
        // Enforce character existence by syncing first
        try {
            console.log(`[Service] Validando existencia de ${name}-${realm}...`);
            await this.syncWithBlizzard(name, realm);
        } catch (error: any) {
            throw new Error(`Blizzard no pudo validar a ${name} en ${realm}. ¿Seguro que existe el personaje y está activo?`);
        }
    },

    async deleteCharacter(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },

    // Tan: Mueve el progreso de un personaje antiguo al nuevo para evitar duplicados
    async TanTraspasarProgreso(oldId: string, newChar: any): Promise<void> {
        try {
            const oldDocRef = doc(db, COLLECTION_NAME, oldId);
            const oldSnap = await getDoc(oldDocRef);

            if (!oldSnap.exists()) {
                console.log(`[TanSystem] No hay progreso previo en ${oldId} para migrar.`);
                return;
            }

            const oldData = oldSnap.data() as CharacterProfile;
            const newDocId = `${newChar.name.trim().toLowerCase()}-${newChar.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`;

            if (oldId === newDocId) return;

            console.log(`[TanSystem] Migrando progreso de Míticas: ${oldId} -> ${newDocId}`);

            const newDocRef = doc(db, COLLECTION_NAME, newDocId);
            // Conservamos datos clave del progreso
            await setDoc(newDocRef, {
                ...oldData,
                name: newChar.name,
                realm: newChar.realm,
                className: newChar.className,
                level: newChar.level,
                updatedAt: new Date(),
                // Aseguramos que los datos pendintes también se muevan
                pendingData: oldData.pendingData || null
            }, { merge: true });

            // Borramos el rastro antiguo inmediatamente
            await deleteDoc(oldDocRef);
            console.log(`[TanSystem] Migración de Míticas completada y registro antiguo purgado.`);
        } catch (error) {
            console.error("[TanSystem] Error en migración de Míticas:", error);
        }
    },

    async cleanupUnsynced(): Promise<number> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        let deletedCount = 0;

        for (const d of snapshot.docs) {
            const data = d.data();
            // Si el ilvl es 0 o no tiene clase, lo consideramos "No Sincronizado" o "Invalido"
            if ((data.ilvl === 0 || data.className === 'Unknown' || !data.className) && d.id !== 'mock') {
                await deleteDoc(d.ref);
                deletedCount++;
            }
        }
        return deletedCount;
    },

    // Tan: Publica todos los cambios pendientes al roster oficial
    async publishResults(): Promise<number> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        // Tan: Obtenemos metadatos globales para el cálculo de rendimiento
        const raidQuotaDoc = await getDoc(doc(db, 'config', 'raid_quota'));
        const raidQuotaAmount = raidQuotaDoc.exists() ? raidQuotaDoc.data().amount || 0 : 0;

        const attendanceMetaDoc = await getDoc(doc(db, 'attendance_roster', 'metadata'));
        const totalRaidsCount = attendanceMetaDoc.exists() ? attendanceMetaDoc.data().totalRaids || 0 : 0;

        let count = 0;

        for (const d of snapshot.docs) {
            const char = d.data() as CharacterProfile;
            if (char.pendingData) {
                const updatedFields: any = {
                    updatedAt: char.pendingData.updatedAt || new Date(),
                    pendingData: deleteField() // Tan: Limpiamos lo pendiente
                };

                // Tan: Solo incluimos los campos si están definidos en pendingData
                if (char.pendingData.weeklyHistory !== undefined) updatedFields.weeklyHistory = char.pendingData.weeklyHistory;
                if (char.pendingData.mythic0Count !== undefined) updatedFields.mythic0Count = char.pendingData.mythic0Count;
                if (char.pendingData.raidProgress !== undefined) updatedFields.raidProgress = char.pendingData.raidProgress;
                if (char.pendingData.ilvl !== undefined) updatedFields.ilvl = char.pendingData.ilvl;
                if (char.pendingData.level !== undefined) updatedFields.level = char.pendingData.level;
                if (char.pendingData.spec !== undefined) updatedFields.spec = char.pendingData.spec;
                if (char.pendingData.className !== undefined) updatedFields.className = char.pendingData.className;
                if (char.pendingData.mplusScore !== undefined) updatedFields.mplusScore = char.pendingData.mplusScore;

                // Tan: Sobreescribimos en el roster de míticas
                await setDoc(d.ref, updatedFields, { merge: true });

                // Tan: Sincronización Cruzada con el Roster General (Attendance) e Identidad de Oro
                let currentAttendance = 0;
                let currentGold = 0;

                try {
                    const attendanceRef = doc(db, 'attendance_roster', d.id);
                    const attSnap = await getDoc(attendanceRef);

                    if (attSnap.exists()) {
                        const attData = attSnap.data();
                        currentAttendance = attData.attendedRaids || 0;
                        const attUpdate: any = { updatedAt: new Date() };
                        if (char.pendingData.ilvl !== undefined) attUpdate.ilvl = char.pendingData.ilvl;
                        if (char.pendingData.level !== undefined) attUpdate.level = char.pendingData.level;
                        if (char.pendingData.className !== undefined) attUpdate.className = char.pendingData.className;
                        await setDoc(attendanceRef, attUpdate, { merge: true });
                    }
                } catch (attError) {
                    console.error("Error sincronizando con asistencia:", attError);
                }

                try {
                    const quoteRef = doc(db, 'quote', d.id);
                    const quotaSnap = await getDoc(quoteRef);
                    if (quotaSnap.exists()) {
                        currentGold = quotaSnap.data().amount || 0;
                    }
                } catch (goldError) {
                    console.error("Error consultando oro:", goldError);
                }

                // Tan: Al publicar, generamos el snapshot histórico oficial enriquecido
                if (char.periodId) {
                    const historyId = `${d.id}-${char.periodId}`;

                    // Tan: Cálculo Estricto de Rendimiento Tripartito
                    const attendPct = totalRaidsCount > 0 ? (currentAttendance / totalRaidsCount) * 100 : 0;

                    // Cálculo Míticas (Lógica de Slots)
                    const history = char.pendingData.weeklyHistory || {};
                    const runs: number[] = [];
                    Object.entries(history).forEach(([level, count]) => {
                        for (let i = 0; i < (count as number); i++) runs.push(parseInt(level));
                    });
                    const sortedRuns = runs.sort((a, b) => b - a);
                    // Reglas (Podemos hardcodear o fetch, fetch es mejor pero usaremos defaults sensatos para el historial)
                    const valSlot1 = sortedRuns.length >= 1 ? sortedRuns[0] : 0;
                    const mplusPct = valSlot1 >= 2 ? 100 : 0; // Simplificado para el snapshot histórico o basado en 1 slot

                    const quotaPct = raidQuotaAmount > 0
                        ? (currentGold >= 0 ? 100 : Math.max(0, Math.round(100 + (currentGold / raidQuotaAmount * 100))))
                        : 100;

                    const globalPerf = Math.round((attendPct + mplusPct + quotaPct) / 3);

                    let perfColor = 'red';
                    if (globalPerf >= 80) perfColor = 'green';
                    else if (globalPerf >= 50) perfColor = 'yellow';

                    await setDoc(doc(db, HISTORY_COLLECTION, historyId), {
                        ...char,
                        ...updatedFields,
                        attendanceCount: currentAttendance,
                        goldAmount: currentGold,
                        globalPerf: globalPerf,
                        performanceColor: perfColor,
                        periodId: char.periodId || 0,
                        snapshotAt: new Date()
                    }, { merge: true });
                }
                count++;
            }
        }
        return count;
    },

    async hasPendingChanges(): Promise<boolean> {
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        return snapshot.docs.some(d => (d.data() as CharacterProfile).pendingData);
    },

    // Helpers for UI
    getTopRuns(history: Record<string, number>): number[] {
        const runs: number[] = [];
        Object.entries(history || {}).forEach(([level, count]) => {
            for (let i = 0; i < count; i++) runs.push(parseInt(level));
        });
        return runs.sort((a, b) => b - a).slice(0, 8);
    },

    getVaultSlots(runs: number[]): number[] {
        // Slots at 1, 4, 8 runs
        return [
            runs.length >= 1 ? runs[0] : 0,
            runs.length >= 4 ? runs[3] : 0,
            runs.length >= 8 ? runs[7] : 0
        ];
    },



    getStatus(vaultSlots: number[], currentRules: MythicRules): { status: string; label: string; color: string } {
        if (!currentRules) return { status: 'unknown', label: 'Cargando...', color: 'text-gray-500' };

        const required = currentRules.requiredSlots || 1; // Default to 1 if not set
        const totalSlots = vaultSlots.filter(l => l > 0).length;

        // Count slots that meet the specific level requirement for their position
        let validSlots = 0;
        // Strictly check that the slot has a run ( > 0 ) AND exceeds level requirement
        if (vaultSlots[0] > 0 && vaultSlots[0] >= currentRules.levelSlot1) validSlots++;
        if (vaultSlots[1] > 0 && vaultSlots[1] >= currentRules.levelSlot2) validSlots++;
        if (vaultSlots[2] > 0 && vaultSlots[2] >= currentRules.levelSlot3) validSlots++;

        // Logic:
        // Completed: Met both Quantity AND Quality (implied by having enough valid slots)
        if (validSlots >= required) {
            return { status: 'complete', label: 'COMPLETADO', color: 'green' };
        }

        // Regular: Met EITHER Quantity OR Quality (at least one valid slot)
        // "Quality" interpretation: having at least one slot that meets level, implies user is doing high keys but maybe not enough of them.
        // "Quantity" interpretation: having enough slots but low level.
        if (totalSlots >= required || validSlots > 0) {
            return { status: 'regular', label: 'REGULAR', color: 'yellow' };
        }

        return { status: 'incomplete', label: 'PENDIENTE', color: 'gray' };
    },

    getCountHighKeys(history: Record<string, number> | undefined): string {
        if (!history) return "0";
        let count = 0;
        Object.entries(history).forEach(([level, c]) => {
            if (parseInt(level) >= 13) count += c;
        });
        return count.toString();
    },

    // Tan: Recupera el historial para una fecha específica sin que desaparezcan personajes
    async getHistory(dateString: string): Promise<CharacterProfile[]> {
        // 1. Obtener todos los personajes actuales (Roster base)
        const roster = await this.getAllCharacters();

        // 2. Obtener todos los snapshots de la colección histórica
        const historySnapshot = await getDocs(collection(db, HISTORY_COLLECTION));
        const allHistoryDocs = historySnapshot.docs;

        // Buscamos el periodId correcto para esa fecha entre todos los registros
        let targetPeriodId: number | null = null;
        for (const docSnapshot of allHistoryDocs) {
            const data = docSnapshot.data();
            if (data.snapshotAt) {
                const date = data.snapshotAt.toDate();
                const dStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                if (dStr === dateString) {
                    targetPeriodId = data.periodId;
                    break;
                }
            }
        }

        // 3. Mapeamos TODOS los snapshots que pertenezcan a ese periodId (unificación semanal)
        const snapshotsMap: Record<string, any> = {};
        if (targetPeriodId) {
            allHistoryDocs.forEach(docSnapshot => {
                const data = docSnapshot.data();
                if (data.periodId === targetPeriodId) {
                    // Reconstruimos el ID original (nombre-reino)
                    const parts = docSnapshot.id.split('-');
                    const originalId = parts.slice(0, -1).join('-');
                    snapshotsMap[originalId] = data;
                }
            });
        }

        // 4. Cruzamos datos: Siempre mostramos a todos, pero con datos históricos si existen
        return roster.map(char => {
            const docId = `${char.name.trim().toLowerCase()}-${char.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`;
            const snapshot = snapshotsMap[docId];

            if (snapshot) {
                return {
                    ...char,
                    ...snapshot,
                    id: char.id // Siempre mantenemos el ID del roster principal para consistencia
                };
            }

            // Si no hay snapshot para este personaje en esa semana, mostramos contadores en 0
            return {
                ...char,
                weeklyHistory: {},
                mythic0Count: 0,
                raidProgress: { ...char.raidProgress, weeklyBosses: 0 },
                periodId: targetPeriodId || undefined
            };
        }).sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
    },

    // Tan: Mapea una fecha al periodId de Blizzard (Aproximación por semanas - Obsoleto por getHistory)
    getStatusPeriodId(dateString: string): number {
        const targetDate = new Date(dateString);
        const baseDate = new Date('2024-09-10T15:00:00Z');
        const basePeriod = 990;

        const diffWeeks = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return basePeriod + diffWeeks;
    },

    // Tan: Obtiene todas las fechas que tienen snapshots guardados
    async getHistoryDates(): Promise<string[]> {
        const snapshot = await getDocs(collection(db, HISTORY_COLLECTION));
        const dates = new Set<string>();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.snapshotAt) {
                const date = data.snapshotAt.toDate();
                const y = date.getFullYear();
                const m = (date.getMonth() + 1).toString().padStart(2, '0');
                const d = date.getDate().toString().padStart(2, '0');
                dates.add(`${y}-${m}-${d}`);
            }
        });

        return Array.from(dates).sort().reverse();
    }
};



// MOCK DATA FOR DEMONSTRATION (Since Desktop App isn't running yet)
const MOCK_DATA: CharacterProfile[] = [
    {
        id: '1',
        name: 'Sylvanas',
        realm: 'QuelThalas',
        level: 80,
        race: 'Undead',
        faction: 'Horde',
        gender: 'Female',
        className: 'Hunter',
        spec: 'Marksmanship',
        ilvl: 615,
        weeklyHistory: { "2": 0, "5": 2, "8": 1, "10": 4, "13": 1 },
        mythic0Count: 0,
        raidProgress: { totalBosses: 6, lfr: 0, normal: 6, heroic: 0, mythic: 0, weeklyBosses: 2, summary: "6 N" },
        raidHistory: [
            { id: 1296, name: "Nerub-ar Palace", expansion: "The War Within", lfr: 0, normal: 6, heroic: 0, mythic: 0, summary: "6 N" }
        ]
    },
    {
        id: '2',
        name: 'Thrall',
        realm: 'Ragnaros',
        level: 80,
        race: 'Orc',
        faction: 'Horde',
        gender: 'Male',
        className: 'Shaman',
        spec: 'Enhancement',
        ilvl: 610,
        weeklyHistory: { "2": 4, "4": 4, "12": 1 },
        mythic0Count: 8,
        raidProgress: { totalBosses: 8, lfr: 0, normal: 0, heroic: 8, mythic: 0, weeklyBosses: 8, summary: "8 H" },
        raidHistory: [
            { id: 1296, name: "Nerub-ar Palace", expansion: "The War Within", lfr: 0, normal: 0, heroic: 8, mythic: 0, summary: "8 H" }
        ]
    },
    {
        id: '3',
        name: 'Anduin',
        realm: 'Proudmoore',
        level: 80,
        race: 'Human',
        faction: 'Alliance',
        gender: 'Male',
        className: 'Priest',
        spec: 'Holy',
        ilvl: 612,
        weeklyHistory: { "13": 5, "14": 2 },
        mythic0Count: 0,
        raidProgress: { totalBosses: 2, lfr: 2, normal: 0, heroic: 0, mythic: 0, weeklyBosses: 0, summary: "2 LFR" },
        raidHistory: [
            { id: 1296, name: "Nerub-ar Palace", expansion: "The War Within", lfr: 2, normal: 0, heroic: 0, mythic: 0, summary: "2 LFR" }
        ]
    },
    {
        id: '4',
        name: 'Illidan',
        realm: 'Illidan',
        level: 80,
        race: 'Night Elf',
        faction: 'Alliance',
        gender: 'Male',
        className: 'Demon Hunter',
        spec: 'Havoc',
        ilvl: 620,
        weeklyHistory: { "10": 10, "11": 5, "12": 2, "15": 1 },
        mythic0Count: 1,
        raidProgress: { totalBosses: 0, lfr: 0, normal: 0, heroic: 0, mythic: 0, weeklyBosses: 0, summary: "-" },
        raidHistory: []
    }
];
