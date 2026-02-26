import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Shield, RefreshCw, X, Settings, RotateCw, FilterX, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mythicPlusService, getWeeklyRange } from '../services/mythicPlusService';
import type { CharacterProfile, MythicRules } from '../services/mythicPlusService';
import { Modal } from '../components/ui/Modal';
import { CharacterTable } from '../components/layout/CharacterTable';
import { CharacterDetailModal } from '../components/common/CharacterDetailModal';
import { TanCalendario } from '../UI/componentes/TanCalendario';
import { useToast } from '../context/ToastContext';


export const KeystonesPage: React.FC = () => {
    const { isAdmin, mainCharacter } = useAuth();
    const { showToast } = useToast();
    const [characters, setCharacters] = useState<CharacterProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<MythicRules | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [editableRules, setEditableRules] = useState<MythicRules>({
        requiredSlots: 1, levelSlot1: 2, levelSlot2: 2, levelSlot3: 2
    });
    const [hasPending, setHasPending] = useState(false);
    const [weeklyRange, setWeeklyRange] = useState<{ start: Date, end: Date } | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    // Tan: Estados para el Historial
    const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
    const [historyDates, setHistoryDates] = useState<string[]>([]);
    const [isHistoricalView, setIsHistoricalView] = useState(false);


    // Add Character Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCharName, setNewCharName] = useState('');
    const [newCharRealm, setNewCharRealm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Quick Armory Modal State
    const [selectedCharProfile, setSelectedCharProfile] = useState<CharacterProfile | null>(null);

    // Per-character syncing state
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

    const fetchData = async () => {
        setLoading(true);
        try {
            // Tan: Cargamos las fechas que tienen snapshots para el calendario
            const snapshotDates = await mythicPlusService.getHistoryDates();
            setHistoryDates(snapshotDates);

            // Tan: Si hay fecha seleccionada, cargamos del historial
            if (selectedDate) {
                const historyData = await mythicPlusService.getHistory(selectedDate);
                setCharacters(historyData);
                setIsHistoricalView(true);
            } else {
                const [chars, fetchedRules, pendingStatus] = await Promise.all([
                    mythicPlusService.getAllCharacters(),
                    mythicPlusService.getRules(),
                    mythicPlusService.hasPendingChanges()
                ]);
                setCharacters(chars.sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0)));
                setRules(fetchedRules);
                if (fetchedRules) setEditableRules(fetchedRules);
                setHasPending(pendingStatus);
                setIsHistoricalView(false);

                // Tan: Calculamos el rango de la semana actual
                setWeeklyRange(getWeeklyRange());
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handleAddCharacter = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            await mythicPlusService.addCharacter(newCharName, newCharRealm);
            setIsAddModalOpen(false);
            setNewCharName('');
            setNewCharRealm('');
            fetchData();
            showToast(`"${newCharName}" agregado y sincronizado con éxito.`, 'success');
        } catch (error: any) {
            console.error("Error adding character:", error);
            showToast(error.message, 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleCleanup = async () => {
        if (!confirm("¿Deseas borrar los personajes que no tienen datos de Blizzard (ilvl 0)?")) return;
        setLoading(true);
        try {
            const deleted = await mythicPlusService.cleanupUnsynced();
            showToast(`Limpieza completada: ${deleted} personajes eliminados.`, 'success');
            fetchData();
        } catch (error) {
            console.error("Error cleaning up:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCharacter = async (id: string, name: string) => {
        if (!confirm(`¿Borrar a ${name} del roster?`)) return;
        try {
            await mythicPlusService.deleteCharacter(id);
            setCharacters(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleSyncAll = async () => {
        if (!confirm("¿Sincronizar todos los personajes con Blizzard? Esto puede tomar un momento.")) return;
        setLoading(true);
        try {
            // Get all chars first to have the list
            const allChars = await mythicPlusService.getAllCharacters();
            const promises = allChars.map(char =>
                mythicPlusService.syncWithBlizzard(char.name, char.realm, char.id)
                    .catch(e => console.error(`Failed to sync ${char.name}:`, e))
            );

            await Promise.all(promises);
            await fetchData(); // Refresh data
            showToast("Sincronización masiva completada.", 'success');
        } catch (error) {
            console.error("Sync all error:", error);
            showToast("Error en sincronización masiva description.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const syncSingle = async (char: CharacterProfile) => {
        setSyncingIds(prev => new Set(prev).add(char.id));
        try {
            await mythicPlusService.syncWithBlizzard(char.name, char.realm, char.id);
            const updatedData = await mythicPlusService.getAllCharacters();
            setCharacters(updatedData.sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0)));
            showToast(`${char.name} sincronizado.`, 'success');
        } catch (err: any) {
            showToast(`Error sincronizando ${char.name}: ` + err.message, 'error');
        } finally {
            setSyncingIds(prev => {
                const next = new Set(prev);
                next.delete(char.id);
                return next;
            });
        }
    };

    const handleSaveRules = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await mythicPlusService.saveRules(editableRules);
            setRules(editableRules);
            setIsRulesModalOpen(false);
            showToast("Reglas guardadas correctamente.", 'success');
        } catch (error) {
            console.error("Error saving rules:", error);
        }
    };

    const handlePublish = async () => {
        if (!confirm("¿Deseas publicar los resultados actuales? Se guardará un registro histórico y los datos serán oficiales.")) return;
        setIsPublishing(true);
        try {
            const count = await mythicPlusService.publishResults();
            showToast(`Se publicaron resultados de ${count} personajes.`, 'success');
            await fetchData();
        } catch (error) {
            console.error("Error publishing:", error);
            showToast("Error al publicar resultados.", 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    // Filter characters based on search
    const filteredCharacters = characters.filter(char =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.realm.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-midnight-800/50 p-6 rounded-2xl border border-midnight-700 backdrop-blur-md relative z-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-midnight-900 rounded-xl border border-midnight-700 shadow-lg">
                        <Shield className="text-void-light" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Roster de Míticas+</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-midnight-400 text-sm">Seguimiento de Great Vault</p>
                            {weeklyRange && !isHistoricalView && (
                                <span className="px-2 py-0.5 bg-void/20 text-void-light text-[10px] font-black rounded border border-void/30 uppercase tracking-tighter">
                                    {weeklyRange.start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {weeklyRange.end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar personaje..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-midnight-950/50 border border-midnight-700 text-white rounded-lg pl-3 pr-4 py-1.5 text-sm focus:border-void-light focus:outline-none w-48 transition-all"
                        />
                    </div>

                    {/* Tan: Calendario de Míticas */}
                    <div className="flex items-center gap-2">
                        <TanCalendario
                            TanFechaSeleccionada={selectedDate}
                            TanAlCambiarFecha={setSelectedDate}
                            TanDiasConLoot={historyDates}
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg border border-red-900/50 transition-all"
                                title="Volver al Roster Actual"
                            >
                                <FilterX size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setIsRulesModalOpen(true)}
                                    className="p-2 bg-midnight-800 hover:bg-midnight-700 text-midnight-300 rounded-lg border border-midnight-600 transition-all shadow-sm"
                                    title="Configurar Reglas"
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={handleCleanup}
                                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg border border-red-900/50 transition-all shadow-sm"
                                    title="Limpiar Roster (ilvl 0)"
                                >
                                    <X size={18} />
                                </button>
                                <button
                                    onClick={handleSyncAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-midnight-800 hover:bg-midnight-700 text-white rounded-lg border border-midnight-600 transition-all font-bold shadow-lg text-xs"
                                >
                                    <RotateCw size={14} />
                                    Sync Todo
                                </button>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-void hover:bg-void-dark text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-void/20 transition-all transform hover:scale-105 text-xs truncate"
                                >
                                    + Agregar
                                </button>
                                {hasPending && (
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg border border-emerald-400 transition-all font-black shadow-lg text-xs animate-pulse-subtle"
                                    >
                                        {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                        {isPublishing ? 'Publicando...' : 'Publicar Resultados'}
                                    </button>
                                )}
                            </>
                        )}
                        {!isAdmin && mainCharacter && (
                            <button
                                onClick={() => {
                                    const charId = `${mainCharacter.name.trim().toLowerCase()}-${mainCharacter.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`;
                                    syncSingle({
                                        id: charId,
                                        name: mainCharacter.name,
                                        realm: mainCharacter.realm
                                    } as any);
                                }}
                                disabled={syncingIds.has(`${mainCharacter.name.trim().toLowerCase()}-${mainCharacter.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`)}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-void hover:bg-void-dark text-white rounded-lg border border-void-light/30 transition-all font-black shadow-lg text-xs"
                            >
                                <RefreshCw size={14} className={syncingIds.has(`${mainCharacter.name.trim().toLowerCase()}-${mainCharacter.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`) ? "animate-spin" : ""} />
                                {syncingIds.has(`${mainCharacter.name.trim().toLowerCase()}-${mainCharacter.realm.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`) ? 'Sincronizando...' : 'Sincronizar Mi Personaje'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <CharacterTable
                characters={filteredCharacters}
                loading={loading}
                syncingIds={syncingIds}
                rules={rules}
                isAdmin={isAdmin}
                onSyncSingle={syncSingle}
                onDeleteCharacter={handleDeleteCharacter}
                getTopRuns={mythicPlusService.getTopRuns}
                getVaultSlots={mythicPlusService.getVaultSlots}
                getStatus={mythicPlusService.getStatus}
                getCountHighKeys={mythicPlusService.getCountHighKeys}
                onCharacterClick={(char) => setSelectedCharProfile(char)}
                isHistoricalView={isHistoricalView}
                mainCharacter={mainCharacter}
            />

            {/* Quick Armory Modal */}
            <CharacterDetailModal
                isOpen={!!selectedCharProfile}
                onClose={() => setSelectedCharProfile(null)}
                characterName={selectedCharProfile?.name || ''}
                realm={selectedCharProfile?.realm || ''}
                region="us"
            />

            {/* Add Character Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Personaje">
                <form onSubmit={handleAddCharacter} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-midnight-300 mb-1">Nombre del Personaje</label>
                        <input
                            type="text"
                            value={newCharName}
                            onChange={(e) => setNewCharName(e.target.value)}
                            className="w-full bg-midnight-950 border border-midnight-700 rounded p-2 text-white focus:border-void-light focus:outline-none"
                            placeholder="Ej: Sylvanas"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-midnight-300 mb-1">Reino (Slug)</label>
                        <input
                            type="text"
                            value={newCharRealm}
                            onChange={(e) => setNewCharRealm(e.target.value)}
                            className="w-full bg-midnight-950 border border-midnight-700 rounded p-2 text-white focus:border-void-light focus:outline-none"
                            placeholder="Ej: ragnaros"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-midnight-400 hover:text-white">Cancelar</button>
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded font-bold shadow-lg flex items-center gap-2"
                        >
                            {isAdding && <RefreshCw size={16} className="animate-spin" />}
                            {isAdding ? 'Sincronizando...' : 'Agregar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Rules Modal */}
            <Modal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} title="Configurar Reglas del Great Vault">
                <form onSubmit={handleSaveRules} className="space-y-6">
                    <div className="p-4 bg-midnight-900/50 rounded border border-midnight-700 text-sm text-midnight-300">
                        Define qué nivel de piedra mítica se considera "Completo" para cada slot del cofre semanal.
                    </div>

                    {/* Required Chests Selector */}
                    <div>
                        <label className="block text-xs font-bold text-midnight-400 uppercase mb-3">Cofres Exigidos por Semana</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setEditableRules({ ...editableRules, requiredSlots: num })}
                                    className={clsx(
                                        "py-3 rounded-lg font-bold text-xl border transition-all",
                                        (editableRules.requiredSlots || 1) === num
                                            ? "bg-void border-void-light text-white shadow-lg shadow-void/20"
                                            : "bg-midnight-950 border-midnight-700 text-midnight-500 hover:border-midnight-500 hover:text-midnight-300"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minimum Levels Inputs */}
                    <div>
                        <label className="block text-xs font-bold text-void-light uppercase mb-3 tracking-widest">Niveles Mínimos</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase mb-1.5 ml-1">Slot 1 (1 Run)</label>
                                <input
                                    type="number"
                                    value={editableRules.levelSlot1 || ''}
                                    onChange={(e) => setEditableRules({ ...editableRules, levelSlot1: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-midnight-950 border border-midnight-700 rounded p-3 text-white font-mono text-center text-xl focus:border-void-light focus:outline-none"
                                    placeholder="Min"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase mb-1.5 ml-1">Slot 2 (4 Runs)</label>
                                <input
                                    type="number"
                                    value={editableRules.levelSlot2 || ''}
                                    onChange={(e) => setEditableRules({ ...editableRules, levelSlot2: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-midnight-950 border border-midnight-700 rounded p-3 text-white font-mono text-center text-xl focus:border-void-light focus:outline-none"
                                    placeholder="Min"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-midnight-500 uppercase mb-1.5 ml-1">Slot 3 (8 Runs)</label>
                                <input
                                    type="number"
                                    value={editableRules.levelSlot3 || ''}
                                    onChange={(e) => setEditableRules({ ...editableRules, levelSlot3: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-midnight-950 border border-midnight-700 rounded p-3 text-white font-mono text-center text-xl focus:border-void-light focus:outline-none"
                                    placeholder="Min"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 border-t border-midnight-700 pt-4">
                        <button type="button" onClick={() => setIsRulesModalOpen(false)} className="px-4 py-2 text-midnight-400 hover:text-white">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded font-bold shadow-lg">Guardar Cambios</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
