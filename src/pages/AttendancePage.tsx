import React, { useEffect, useState } from 'react';
import { Users, ExternalLink, Shield, Search, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { getClassColor } from '../utils/wowClasses';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CharacterDetailModal } from '../components/common/CharacterDetailModal';
import { Modal } from '../components/ui/Modal';

import { attendanceService, type AttendanceProfile } from '../services/attendanceService';
import { warcraftLogsService } from '../services/warcraftLogsService';

// Simple Modal for Attendees
interface AttendeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendees: string[];
}

const AttendeesModal: React.FC<AttendeesModalProps> = ({ isOpen, onClose, attendees }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-midnight-900 border border-midnight-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-midnight-700 flex justify-between items-center bg-midnight-950/50">
                    <h3 className="text-lg font-bold text-white">Asistencia Procesada</h3>
                    <button onClick={onClose} className="text-midnight-400 hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-midnight-700">
                    <p className="text-sm text-midnight-300 mb-4">Se ha registrado la asistencia de <span className="text-accent-cyan font-bold">{attendees.length}</span> jugadores:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {attendees.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-midnight-800/50 rounded-lg text-xs text-white border border-midnight-700/50">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-midnight-950/50 border-t border-midnight-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-midnight-800 hover:bg-midnight-700 text-white text-sm font-bold rounded-lg transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AttendancePage: React.FC = () => {
    const { showToast } = useToast();
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';

    // Data State
    const [roster, setRoster] = useState<AttendanceProfile[]>([]);
    const [totalRaids, setTotalRaids] = useState(0);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [wclUrl, setWclUrl] = useState('');
    const [selectedChar, setSelectedChar] = useState<{ name: string; realm: string } | null>(null);
    const [attendeesModalData, setAttendeesModalData] = useState<string[] | null>(null);

    // Add Character Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCharName, setNewCharName] = useState('');
    const [newCharRealm, setNewCharRealm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [chars, metadata] = await Promise.all([
                attendanceService.getCharacters(),
                attendanceService.getMetadata()
            ]);
            setRoster(chars);
            setTotalRaids(metadata.totalRaids || 0);
        } catch (error) {
            console.error("Error fetching data", error);
            showToast("Error cargando datos de asistencia", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddCharacter = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            await attendanceService.addCharacter(newCharName, newCharRealm);
            showToast(`${newCharName} agregado al roster correctamente.`, 'success');
            setIsAddModalOpen(false);
            setNewCharName('');
            setNewCharRealm('');
            fetchData();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteCharacter = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${name} del roster de asistencia?`)) return;
        try {
            await attendanceService.deleteCharacter(id);
            setRoster(prev => prev.filter(c => c.id !== id));
            showToast(`${name} eliminado.`, 'success');
        } catch (error) {
            showToast("Error al eliminar personaje.", 'error');
        }
    };

    const handleWclSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wclUrl) return;

        setIsProcessing(true);
        showToast("Procesando reporte de WarcraftLogs...", "info");

        try {
            // 1. Get Participants from WCL
            const wclParticipants = await warcraftLogsService.getParticipantsFromUrl(wclUrl);
            if (wclParticipants.length === 0) throw new Error("No se encontraron participantes en el log.");

            // 2. Validate WCL Data Integrity
            const hasRealms = wclParticipants.some(p => !!p.realm);
            if (!hasRealms) {
                const errorMsg = "⛔ ERROR CRÍTICO: El archivo 'wcl_proxy.php' en el servidor está desactualizado.\n\n" +
                    "WarcraftLogs no está entregando la información del Reino, lo que causaría errores de asignación.\n\n" +
                    "SOLUCIÓN: Sube el archivo 'server/wcl_proxy.php' actualizado a tu hosting.";
                throw new Error(errorMsg);
            }

            // 3. Match with Manual Roster (Strict: Name + Realm)
            // Create a Set of "name-realm" for O(1) lookup.
            const wclKeys = new Set(wclParticipants.map(p => {
                const name = (p.name || '').toLowerCase();
                const realm = (p.realm || '').toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                return `${name}-${realm}`;
            }));

            let matchedIds: string[] = [];
            let matchedNames: string[] = [];

            roster.forEach(member => {
                const memberName = member.name.toLowerCase();
                const memberRealm = member.realm.toLowerCase();
                const key = `${memberName}-${memberRealm}`;

                if (wclKeys.has(key)) {
                    matchedIds.push(member.id);
                    matchedNames.push(`${member.name} (${member.realm})`);
                }
            });

            if (matchedIds.length === 0) {
                throw new Error("No se encontraron coincidencias exactas (Nombre + Reino). Verifica que los personajes estén en el Roster con su reino correcto.");
            }

            // 3. Register Attendance 
            await attendanceService.registerAttendance(matchedIds);

            // 4. Update Local State
            setRoster(prev => prev.map(m => {
                if (matchedIds.includes(m.id)) {
                    return { ...m, attendedRaids: (m.attendedRaids || 0) + 1 };
                }
                return m;
            }));
            setTotalRaids(prev => prev + 1);
            setAttendeesModalData(matchedNames.sort());
            setWclUrl('');

            showToast(`Asistencia registrada para ${matchedIds.length} jugadores.`, 'success');

        } catch (error: any) {
            console.error("Error processing WCL:", error);
            showToast(error.message || "Error procesando el reporte.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // === ADMIN FUNCTIONS ===
    const handleResetDatabase = async () => {
        const confirmMsg = "⚠️ PELIGRO: ¿Estás seguro de BORRAR TODO el roster y el historial?\n\nEsta acción eliminará todos los personajes y pondrá el contador a 0.\n\nEs IRREVERSIBLE.";
        if (!window.confirm(confirmMsg)) return;

        try {
            setIsProcessing(true);
            await attendanceService.resetDatabase();
            setRoster([]);
            setTotalRaids(0);
            showToast('Base de datos de asistencia reseteada completamente.', 'success');
        } catch (error) {
            showToast('Error al resetear la base de datos.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearAttendance = async () => {
        if (!window.confirm('⚠️ ¿Limpiar solo los contadores de asistencia (mantener roster)?')) return;
        try {
            setIsProcessing(true);
            await attendanceService.clearAttendanceData();
            setRoster(prev => prev.map(p => ({ ...p, attendedRaids: 0 })));
            setTotalRaids(0);
            showToast('Contadores de asistencia reiniciados.', 'success');
        } catch (error) {
            showToast('Error al limpiar contadores.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 glass p-6 rounded-2xl relative z-50">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-midnight-900 rounded-xl border border-midnight-700 shadow-lg">
                        <Shield className="text-accent-cyan" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Asistencia de Raid</h1>
                        <p className="text-midnight-400 text-sm">Registro Manual de Asistencia</p>
                    </div>
                </div>

                <div className="flex gap-8 items-center">
                    <div className="text-right">
                        <span className="block text-[10px] text-midnight-400 uppercase tracking-widest font-bold mb-1">Total Raids</span>
                        <span className="text-4xl font-bold font-mono text-white text-shadow-glow">{totalRaids}</span>
                    </div>

                    {isAdmin && (
                        <>
                            <div className="w-px h-12 bg-midnight-700"></div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleClearAttendance}
                                    className="p-2 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 rounded-lg border border-yellow-900/50 transition-all"
                                    title="Limpiar Contadores (Mantener Roster)"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    onClick={handleResetDatabase}
                                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg border border-red-900/50 transition-all"
                                    title="BORRAR TODO (Reset Completo)"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* WCL Input Section */}
            {isAdmin && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-6"
                >
                    <form onSubmit={handleWclSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold uppercase text-midnight-400 mb-2 tracking-wider">
                                WarcraftLogs URL
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ExternalLink size={16} className="text-midnight-500 group-focus-within:text-accent-cyan transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={wclUrl}
                                    onChange={(e) => setWclUrl(e.target.value)}
                                    placeholder="https://www.warcraftlogs.com/reports/..."
                                    className="w-full bg-midnight-950/50 border border-midnight-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-midnight-600 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[46px]"
                        >
                            {isProcessing ? 'Procesando...' : 'Procesar Asistencia'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Roster Controls */}
            <div className="flex justify-between items-center glass p-4 rounded-xl">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar jugador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-midnight-800 border border-midnight-700 rounded-lg text-white text-sm placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 transition-all w-64"
                        />
                    </div>
                    <div className="text-sm text-midnight-400 font-mono">
                        {roster.length} Miembros
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-void hover:bg-void-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-void/20 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Agregar Personaje</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/60">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Users size={18} className="text-midnight-400" />
                        Roster Oficial
                    </h3>
                </div>
                <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#030105] sticky top-0 z-10 text-midnight-400 uppercase text-[10px] tracking-[0.2em] font-black backdrop-blur-md border-b border-white/5">
                            <tr>
                                <th className="p-5 border-b border-midnight-700/50">Nombre</th>
                                <th className="p-5 border-b border-midnight-700/50 text-center">Nivel</th>
                                <th className="p-5 border-b border-midnight-700/50 text-center">ILVL</th>
                                <th className="p-5 border-b border-midnight-700/50 text-right">Asistencia</th>
                                {isAdmin && <th className="p-5 border-b border-midnight-700/50 text-center w-16">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700/20">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="p-12 text-center text-midnight-400 animate-pulse font-medium">
                                        Cargando roster manual...
                                    </td>
                                </tr>
                            ) : roster.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="p-12 text-center text-midnight-500 font-medium">
                                        El roster está vacío. ¡Agrega personajes para comenzar!
                                    </td>
                                </tr>
                            ) : roster
                                .filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((member) => {
                                    const classColor = getClassColor(member.className);
                                    const percent = totalRaids > 0 ? Math.round((member.attendedRaids / totalRaids) * 100) : 0;

                                    // Colors
                                    let barColor = 'bg-green-500';
                                    let textColor = 'text-green-400';
                                    if (percent < 90) { barColor = 'bg-yellow-500'; textColor = 'text-yellow-400'; }
                                    if (percent < 50) { barColor = 'bg-red-500'; textColor = 'text-red-400'; }

                                    return (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-void/5 transition-all duration-300 group"
                                        >
                                            <td
                                                className="p-5 cursor-pointer relative overflow-hidden"
                                                onClick={() => setSelectedChar({ name: member.name, realm: member.realm })}
                                            >
                                                <div className="flex flex-col relative z-10">
                                                    <span className="font-black text-lg tracking-tight group-hover:translate-x-1 transition-transform" style={{ color: classColor }}>
                                                        {member.name}
                                                    </span>
                                                    <span className="text-[10px] text-midnight-500 uppercase tracking-[0.1em] font-black opacity-60">
                                                        {member.className} <span className="text-midnight-700 px-1">•</span> {member.realm}
                                                    </span>
                                                </div>
                                                {/* Subtle class color glow behind name */}
                                                <div className="absolute inset-y-0 left-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: classColor }}></div>
                                            </td>
                                            <td className="p-5 text-center text-sm text-midnight-300 font-black">
                                                {member.level}
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className="text-sm font-black text-yellow-500 drop-shadow-glow">
                                                    {member.ilvl || '---'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-midnight-500 font-black uppercase tracking-tighter leading-none mb-1">
                                                            {member.attendedRaids} de {totalRaids}
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-midnight-950 rounded-full overflow-hidden p-[1px] border border-midnight-800">
                                                            <div
                                                                className={`h-full rounded-full ${barColor} transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                                                                style={{ width: `${percent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xl font-black ${textColor} tracking-tighter min-w-[3ch]`}>
                                                        {percent}%
                                                    </span>
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="p-5 text-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(member.id, member.name); }}
                                                        className="p-3 text-midnight-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Eliminar del roster"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CharacterDetailModal
                characterName={selectedChar?.name || ''}
                realm={selectedChar?.realm || ''}
                isOpen={!!selectedChar}
                onClose={() => setSelectedChar(null)}
            />

            <AttendeesModal
                isOpen={!!attendeesModalData}
                onClose={() => setAttendeesModalData(null)}
                attendees={attendeesModalData || []}
            />

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Personaje al Roster">
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
                            {isAdding ? 'Verificando...' : 'Agregar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
