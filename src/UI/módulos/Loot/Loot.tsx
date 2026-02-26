import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Upload, FileJson, CheckCircle2, AlertCircle, FilterX, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TanCalendario } from '../../componentes/TanCalendario';
import { deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

interface LootItem {
    id?: string;
    name: string;
    item: string;
    itemId?: string;
    response?: string;
    date: any;
    uploadedAt: Timestamp;
}

export const Loot: React.FC = () => {
    // Tan organiza los datos y el estado para que todo fluya con elegancia
    const [TanLootOriginal, setTanLootOriginal] = useState<LootItem[]>([]);
    const [TanFechaFiltro, setTanFechaFiltro] = useState<string>(''); // Formato YYYY-MM-DD
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { isAdmin } = useAuth();

    useEffect(() => {
        const q = query(collection(db, 'loot'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LootItem[];
            setTanLootOriginal(items);
        });
        return () => unsubscribe();
    }, []);

    // Tan normaliza las fechas del JSON para que coincidan con el calendario, soportando múltiples formatos internacionales
    const TanNormalizarFecha = (fechaOriginal: any): string[] => {
        if (!fechaOriginal || typeof fechaOriginal !== 'string') return [];

        // Limpiamos y estandarizamos separadores (/ o -)
        const cleanDate = fechaOriginal.split(' ')[0].replace(/-/g, '/');
        const parts = cleanDate.split('/');

        if (parts.length === 3) {
            const [p1, p2, p3] = parts;

            // Heurística de Tan: Detectamos dónde está el año para no fallar nunca
            if (p1.length === 4) { // Formato: YYYY/MM/DD
                return [
                    `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`,
                    `${p1}-${p3.padStart(2, '0')}-${p2.padStart(2, '0')}` // Por si acaso es YYYY/DD/MM
                ];
            } else if (p3.length === 2 || p3.length === 4) { // Formato: DD/MM/YY o MM/DD/YYYY
                const año = p3.length === 2 ? `20${p3}` : p3;
                return [
                    `${año}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`,
                    `${año}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`
                ];
            }
        }
        return [cleanDate];
    };

    // Tan filtra los registros para que solo veas lo que realmente importa (como la raid de ayer)
    const TanLootFiltrado = useMemo(() => {
        if (!TanFechaFiltro) return TanLootOriginal;

        return TanLootOriginal.filter(item => {
            const fechasPosibles = TanNormalizarFecha(item.date);
            return fechasPosibles.includes(TanFechaFiltro);
        });
    }, [TanLootOriginal, TanFechaFiltro]);

    // Tan detecta en qué días hubo acción para que el calendario brille
    const TanDiasConActividad = useMemo(() => {
        const dias = new Set<string>();
        TanLootOriginal.forEach(item => {
            TanNormalizarFecha(item.date).forEach(f => dias.add(f));
        });
        return Array.from(dias);
    }, [TanLootOriginal]);

    const TanBorrarRegistro = async (id: string) => {
        if (!window.confirm('¿Tan seguro estás de borrar este registro?')) return;
        try {
            await deleteDoc(doc(db, 'loot', id));
        } catch (error) {
            console.error("Error al borrar:", error);
        }
    };

    const TanBorrarTodo = async () => {
        if (!window.confirm('⚠️ ATENCIÓN: ¿Estás seguro de que quieres ELIMINAR TODO el historial de loot? Esta acción no se puede deshacer y es necesaria para el reinicio de producción.')) return;
        if (!window.confirm('CONFIRMACIÓN DOBLE: ¿Realmente deseas borrar todos los registros del sistema?')) return;

        setIsUploading(true);
        try {
            const snapshot = await getDocs(collection(db, 'loot'));
            const batch = writeBatch(db);

            snapshot.docs.forEach((d) => {
                batch.delete(d.ref);
            });

            await batch.commit();
            setMessage({ type: 'success', text: 'Sistema de Loot reiniciado con éxito 🫡' });
        } catch (error) {
            console.error("Error al resetear loot:", error);
            setMessage({ type: 'error', text: 'Error al intentar reiniciar el sistema' });
        } finally {
            setIsUploading(false);
        }
    };

    const normalizeLootItem = (rawItem: any) => {
        const keys = Object.keys(rawItem);

        const findValue = (possibleKeys: string[]) => {
            const foundKey = keys.find(k =>
                possibleKeys.map(pk => pk.toLowerCase())
                    .includes(k.toLowerCase().trim())
            );
            return foundKey ? rawItem[foundKey] : '';
        };

        const itemId = findValue(['itemId', 'item_id', 'itemid']);
        const itemName = findValue(['item', 'itemName', 'loot', 'object', 'objeto', 'articulo', 'item_name']);

        return {
            name: findValue(['name', 'player', 'playerName', 'character', 'char', 'jugador', 'nombre', 'user']),
            item: itemName,
            itemId: itemId,
            response: findValue(['response', 'reason', 'vote', 'how', 'respuesta', 'motivo', 'ganado']),
            date: findValue(['date', 'dateTime', 'time', 'timestamp', 'day', 'fecha', 'hora']),
        };
    };

    const getResponseStyle = (response: string) => {
        const r = response.toLowerCase();
        if (r.includes('bis') || r.includes('mejor') || r.includes('main'))
            return "bg-amber-500/20 text-amber-500 border-amber-500/30";
        if (r.includes('need') || r.includes('necesidad') || r.includes('upgrade'))
            return "bg-green-500/20 text-green-500 border-green-500/30";
        if (r.includes('minor') || r.includes('menor'))
            return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (r.includes('offspec') || r.includes('greed') || r.includes('codicia'))
            return "bg-blue-500/20 text-blue-500 border-blue-500/30";
        return "bg-white/5 text-midnight-400 border-white/5";
    };

    const getRaiderIOUrl = (fullName: string) => {
        if (!fullName) return "#";
        // RCLootCouncil: "Nombre-Reino". Usamos el primer '-' para separar.
        const dashIndex = fullName.indexOf('-');
        const name = dashIndex > -1 ? fullName.substring(0, dashIndex).trim() : fullName.trim();
        const realm = dashIndex > -1 ? fullName.substring(dashIndex + 1).trim() : '';

        const targetRealm = realm ? realm.toLowerCase().replace(/['\s-]/g, '') : 'quelthalas';
        return `https://raider.io/characters/us/${targetRealm}/${encodeURIComponent(name)}`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const rawData = Array.isArray(json) ? json : [json];

                let successCount = 0;
                for (const rawItem of rawData) {
                    const normalized = normalizeLootItem(rawItem);

                    if (normalized.name || normalized.item) {
                        await addDoc(collection(db, 'loot'), {
                            ...normalized,
                            uploadedAt: Timestamp.now()
                        });
                        successCount++;
                    }
                }

                if (successCount > 0) {
                    setMessage({ type: 'success', text: `${successCount} registros procesados 🫡` });
                } else {
                    setMessage({ type: 'error', text: 'Formato de JSON no reconocido' });
                }
            } catch (error) {
                console.error("Error al subir loot:", error);
                setMessage({ type: 'error', text: 'Error al procesar el archivo JSON' });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-void/20 rounded-xl flex items-center justify-center border border-void/30">
                        <FileJson className="text-void-light" size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Módulo Loot</h2>
                        <p className="text-midnight-400 text-[10px] font-bold uppercase tracking-widest">Sincronización de registros de batalla</p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={TanBorrarTodo}
                        disabled={isUploading || TanLootOriginal.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-xl border border-red-500/20 transition-all font-black text-xs uppercase tracking-widest shadow-lg disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        Eliminar todo
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="glass rounded-[32px] p-10">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-16 transition-all hover:bg-black/20 hover:border-void-light/30 group relative overflow-hidden">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            id="loot-upload"
                            disabled={isUploading}
                        />
                        <div className="flex flex-col items-center space-y-6 text-center">
                            <div className="w-20 h-20 bg-void/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-void/20">
                                <Upload className="text-void-light animate-bounce-slow" size={32} />
                            </div>
                            <div>
                                <span className="text-xl font-black text-white block uppercase tracking-tight">
                                    {isUploading ? 'Procesando Transmisión...' : 'Importar Datos de Loot'}
                                </span>
                                <span className="text-xs text-midnight-500 font-bold uppercase tracking-[0.2em] mt-2 block">
                                    Sube tu archivo .JSON (RCLootCouncil / Personal)
                                </span>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={clsx(
                            "mt-8 p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500",
                            message.type === 'success' ? "bg-green-500/5 text-green-400 border border-green-500/20" : "bg-red-500/5 text-red-400 border border-red-500/20"
                        )}>
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center border",
                                message.type === 'success' ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                            )}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <span className="font-bold text-sm uppercase tracking-wide">{message.text}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-6 pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <div className="w-2 h-2 bg-void-light rounded-full animate-pulse"></div>
                            Registros de Batalla
                        </h3>
                        <p className="text-[10px] text-midnight-500 font-bold uppercase tracking-widest">
                            {TanLootFiltrado.length} Entradas encontradas
                        </p>
                    </div>

                    {/* El Calendario Dinámico de Tan - Robusto y Visual */}
                    <div className="flex items-center gap-3">
                        <TanCalendario
                            TanFechaSeleccionada={TanFechaFiltro}
                            TanAlCambiarFecha={setTanFechaFiltro}
                            TanDiasConLoot={TanDiasConActividad}
                        />

                        {TanFechaFiltro && (
                            <button
                                onClick={() => setTanFechaFiltro('')}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/5 group"
                                title="Limpiar Filtro"
                            >
                                <FilterX size={16} className="group-hover:scale-110 transition-transform" /> Borrar
                            </button>
                        )}
                    </div>
                </div>

                <div className="glass rounded-[24px] overflow-hidden">
                    {/* Tan aplica un scroll interno para que la web respire */}
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black text-midnight-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="px-8 py-5">Jugador</th>
                                    <th className="px-8 py-5">Objeto</th>
                                    <th className="px-8 py-5">Motivo</th>
                                    <th className="px-8 py-5 text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {TanLootFiltrado.length > 0 ? (
                                    TanLootFiltrado.map((raw) => {
                                        // Normalizamos en tiempo de render para soportar datos antiguos en Firestore
                                        const display = normalizeLootItem(raw);
                                        return (
                                            <tr key={raw.id} className="bg-black/40 hover:bg-black/60 transition-colors group border-b border-white/5 last:border-0">
                                                <td className="px-8 py-6">
                                                    <a
                                                        href={getRaiderIOUrl(display.name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-black text-void-light group-hover:text-white transition-colors uppercase tracking-tight hover:underline underline-offset-4"
                                                    >
                                                        {display.name || '---'}
                                                    </a>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <a
                                                        href={display.itemId ? `https://www.wowhead.com/item=${display.itemId}` : `https://www.wowhead.com/search?q=${encodeURIComponent(display.item)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-midnight-200 font-medium line-clamp-1 hover:text-void-light transition-colors"
                                                        data-wowhead={display.itemId ? `item=${display.itemId}` : `q=${encodeURIComponent(display.item)}`}
                                                    >
                                                        {display.item || 'Objeto Desconocido'}
                                                    </a>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {display.response ? (
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                            getResponseStyle(display.response)
                                                        )}>
                                                            {display.response}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-midnight-600 font-bold uppercase tracking-widest italic opacity-40">Adjudicado</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <span className="text-[11px] font-black text-midnight-500 font-mono">
                                                            {display.date || 'Sin Fecha'}
                                                        </span>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => TanBorrarRegistro(raw.id!)}
                                                                className="p-2 text-midnight-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center space-y-4 opacity-30">
                                                <FileJson size={48} className="text-midnight-700" />
                                                <p className="text-sm font-black uppercase tracking-[0.3em] text-midnight-700">
                                                    Sin transmisiones de loot pendientes
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
