import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { blizzardService } from '../services/blizzard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe, User, Loader2, Sparkles, ChevronDown, ChevronUp, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface BlizzardCharacter {
    name: string;
    id: number;
    realm: {
        name: string;
        id: number;
        slug: string;
    };
    playable_class: {
        name: string;
        id: number;
    };
    playable_race: {
        name: string;
        id: number;
    };
    level: number;
}

const CLASS_COLORS: Record<string, string> = {
    'Warrior': '#C69B6D',
    'Paladin': '#F48CBA',
    'Hunter': '#AAD372',
    'Rogue': '#FFF468',
    'Priest': '#FFFFFF',
    'Death Knight': '#C41E3A',
    'Shaman': '#0070DD',
    'Mage': '#3FC7EB',
    'Warlock': '#8788EE',
    'Monk': '#00FF98',
    'Druid': '#FF7C0A',
    'Demon Hunter': '#A330C9',
    'Evoker': '#33937F'
};

export const PerfilPage: React.FC = () => {
    const { blizzardUser, mainCharacter, setMainCharacter } = useAuth();
    const [characters, setCharacters] = useState<BlizzardCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugData, setDebugData] = useState<any>(null);
    const [collapsedRealms, setCollapsedRealms] = useState<Record<string, boolean>>({});

    // Estados para Modales
    const [confirmingMain, setConfirmingMain] = useState<BlizzardCharacter | null>(null);
    const [scoutingChar, setScoutingChar] = useState<BlizzardCharacter | null>(null);
    const [scoutData, setScoutData] = useState<any>(null);
    const [scoutLoading, setScoutLoading] = useState(false);
    const [updatingMain, setUpdatingMain] = useState(false);

    useEffect(() => {
        const TanCargarPerfil = async () => {
            if (!blizzardUser?.token) return;

            try {
                setLoading(true);
                setError(null);
                const region = blizzardUser.region || 'us';
                const data = await blizzardService.getUserCharacters(blizzardUser.token, region);
                setDebugData(data);

                if (data && data.wow_accounts) {
                    const allChars: BlizzardCharacter[] = data.wow_accounts.flatMap((acc: any) => acc.characters || []);
                    setCharacters(allChars.sort((a, b) => b.level - a.level));
                }
            } catch (err: any) {
                console.error("Error al cargar personajes:", err);
                setDebugData(err.response?.data);
                setError(err.response?.data?.details || err.message || "No pudimos sincronizar tus personajes de Azeroth.");
            } finally {
                setLoading(false);
            }
        };

        TanCargarPerfil();
    }, [blizzardUser]);

    // Tan: Protocolo V9 SCOUT - Carga de Datos Técnica
    useEffect(() => {
        const TanScoutActive = async () => {
            if (!scoutingChar) {
                setScoutData(null);
                return;
            }

            try {
                setScoutLoading(true);
                const region = blizzardUser?.region || 'us';

                // Consultas paralelas para máxima eficiencia
                const [profile, mplus] = await Promise.all([
                    blizzardService.getCharacterProfile(scoutingChar.realm.slug, scoutingChar.name, region),
                    blizzardService.getMythicPlusProfile(scoutingChar.realm.slug, scoutingChar.name, region)
                ]);

                setScoutData({
                    ilvl: profile?.equipped_item_level || '---',
                    mplusScore: mplus?.mythic_rating?.rating ? Math.round(mplus.mythic_rating.rating) : '---',
                    spec: profile?.active_spec?.name || '---',
                    title: profile?.active_title?.name || 'Aventurero'
                });
            } catch (err) {
                console.error("Error en V9 SCOUT:", err);
            } finally {
                setScoutLoading(false);
            }
        };

        TanScoutActive();
    }, [scoutingChar, blizzardUser]);

    const handleSetMain = async () => {
        if (!confirmingMain) return;
        try {
            setUpdatingMain(true);
            await setMainCharacter({
                name: confirmingMain.name,
                realm: confirmingMain.realm.slug,
                level: confirmingMain.level,
                className: confirmingMain.playable_class.name,
                id: confirmingMain.id
            });
            setConfirmingMain(null);
        } catch (err) {
            console.error("Error al establecer main:", err);
        } finally {
            setUpdatingMain(false);
        }
    };

    const toggleRealm = (realm: string) => {
        setCollapsedRealms(prev => ({ ...prev, [realm]: !prev[realm] }));
    };

    const charactersByRealm = characters.reduce((acc, char) => {
        const realmName = char.realm.name;
        if (!acc[realmName]) acc[realmName] = [];
        acc[realmName].push(char);
        return acc;
    }, {} as Record<string, BlizzardCharacter[]>);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="text-[#00c3ff] animate-spin" size={48} />
                <p className="text-midnight-400 font-black uppercase tracking-widest text-[10px] animate-pulse">
                    Invocando Roster de la Cuenta...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20 max-w-7xl mx-auto">
            {/* Header de Perfil */}
            <div className="relative p-8 md:p-12 rounded-[40px] overflow-hidden border border-white/5 bg-midnight-900/40 backdrop-blur-3xl shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield size={240} className="text-[#00c3ff]" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00c3ff] to-void flex items-center justify-center border-4 border-midnight-950 shadow-[0_0_30px_rgba(0,195,255,0.3)]">
                        <User size={40} className="text-white" />
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <h1 className="text-3xl font-black text-white tracking-tighter text-glow-cyan">
                                {blizzardUser?.displayName}
                            </h1>
                            <Sparkles className="text-[#00c3ff]" size={18} />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                            <p className="text-[#00c3ff] font-black uppercase tracking-[0.3em] text-[9px] opacity-70">
                                Identidad Verificada de Blizzard
                            </p>
                            {mainCharacter && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-void/20 border border-void-light/20 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-void-light" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                        Main: {mainCharacter.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado por Reinos */}
            <div className="grid grid-cols-1 gap-6">
                {Object.entries(charactersByRealm).map(([realm, chars]) => {
                    const isCollapsed = collapsedRealms[realm];
                    return (
                        <section key={realm} className="space-y-3">
                            <button
                                onClick={() => toggleRealm(realm)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-3 bg-midnight-900/10 border border-white/5 rounded-2xl hover:bg-midnight-800/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Globe size={14} className="text-[#00c3ff]/60 group-hover:text-[#00c3ff] transition-colors" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity">
                                        {realm} <span className="text-midnight-600 ml-1">({chars.length})</span>
                                    </h2>
                                </div>
                                {isCollapsed ? <ChevronDown size={16} className="text-midnight-600" /> : <ChevronUp size={16} className="text-midnight-600" />}
                            </button>

                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-1">
                                            {chars.map((char) => {
                                                const classColor = CLASS_COLORS[char.playable_class.name] || '#ffffff';
                                                const isMain = mainCharacter?.id === char.id;
                                                return (
                                                    <motion.div
                                                        key={char.id}
                                                        layout
                                                        className={clsx(
                                                            "group relative p-4 bg-midnight-950/40 border rounded-2xl transition-all shadow-lg overflow-hidden flex flex-col justify-between h-28",
                                                            isMain ? "border-void-light/40 bg-void/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "border-midnight-800/40 hover:border-white/10"
                                                        )}
                                                    >
                                                        {/* Acento lateral */}
                                                        <div
                                                            className="absolute top-0 left-0 w-1 h-full opacity-30 group-hover:opacity-100 transition-opacity"
                                                            style={{ backgroundColor: classColor }}
                                                        />

                                                        <div className="space-y-1 relative z-10">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[8px] font-black text-midnight-600 uppercase tracking-widest">
                                                                    lvl {char.level}
                                                                </span>
                                                                {isMain && (
                                                                    <div className="px-1.5 py-0.5 bg-void/30 border border-void-light/30 rounded text-[7px] font-black text-void-light uppercase tracking-tighter">
                                                                        IDENTIDAD
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <h3
                                                                className="text-sm font-black uppercase tracking-tight truncate leading-none"
                                                                style={{ color: classColor }}
                                                            >
                                                                {char.name}
                                                            </h3>
                                                            <p className="text-[8px] font-bold text-midnight-500 uppercase tracking-wider truncate">
                                                                {char.playable_class.name}
                                                            </p>
                                                        </div>

                                                        {/* Botones Compactos */}
                                                        <div className="flex items-center gap-1.5 relative z-10 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <button
                                                                onClick={() => setScoutingChar(char)}
                                                                title="V9 SCOUT: Consultar equipo"
                                                                className="flex-1 py-1.5 bg-midnight-900/60 hover:bg-[#00c3ff]/20 text-midnight-400 hover:text-[#00c3ff] rounded-lg transition-colors flex items-center justify-center border border-white/5"
                                                            >
                                                                <Eye size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmingMain(char)}
                                                                disabled={isMain}
                                                                title="Establecer como Main"
                                                                className={clsx(
                                                                    "flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center border",
                                                                    isMain
                                                                        ? "bg-void/40 border-void-light/30 text-void-light cursor-default"
                                                                        : "bg-midnight-900/60 hover:bg-green-500/20 text-midnight-400 hover:text-green-500 border-white/5"
                                                                )}
                                                            >
                                                                <CheckCircle2 size={12} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    );
                })}
            </div>

            {/* Modal de Confirmación para Main */}
            <AnimatePresence>
                {confirmingMain && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 bg-black/80 backdrop-blur-sm pt-[10vh]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-midnight-900 border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-8 text-center"
                        >
                            <div className="w-20 h-20 bg-void/20 text-void-light rounded-2xl flex items-center justify-center mx-auto border border-void-light/30 shadow-xl shadow-void/10">
                                <Shield size={40} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Vincular Identidad</h3>

                                {mainCharacter ? (
                                    <p className="text-sm text-midnight-300 leading-relaxed font-black">
                                        Actualmente eres <span className="text-void-light">{mainCharacter.name}</span>.<br />
                                        <span className="text-white/60 text-[10px] uppercase tracking-widest leading-loose">
                                            Estás por cambiar tu identidad principal por <span className="text-void-light">{confirmingMain.name}</span>.
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-sm text-midnight-300 leading-relaxed font-black uppercase tracking-tight">
                                        Estás por vincular a <span className="text-void-light">{confirmingMain.name}</span> como tu identidad principal en Hellheim.
                                    </p>
                                )}

                                <div className="p-5 bg-midnight-950/80 rounded-3xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-void-light">
                                        <AlertCircle size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Aviso de Sincronización</span>
                                    </div>
                                    <p className="text-[9px] text-midnight-500 uppercase tracking-widest leading-loose font-bold">
                                        Tus promedios, notas y tesorería se mantendrán vinculados a tu cuenta, ya que el avance es del Jugador y no del personaje.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setConfirmingMain(null)}
                                    className="flex-1 py-4 text-midnight-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSetMain}
                                    disabled={updatingMain}
                                    className="flex-1 py-4 bg-void/20 hover:bg-void/40 border border-void-light/30 text-void-light font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-void/10"
                                >
                                    {updatingMain ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirmar"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Provisional V9 SCOUT */}
            <AnimatePresence>
                {scoutingChar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-lg bg-midnight-950 border border-[#00c3ff]/20 p-1 rounded-[40px] shadow-[0_0_50px_rgba(0,195,255,0.1)] overflow-hidden"
                        >
                            <div className="p-8 space-y-6 bg-midnight-900/40 rounded-[39px]">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[#00c3ff] font-black uppercase tracking-[0.4em] text-[8px]">Protocolo V9 SCOUT</p>
                                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                            {scoutingChar.name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setScoutingChar(null)}
                                        className="p-2 text-midnight-600 hover:text-white transition-colors"
                                    >
                                        <ChevronDown className="rotate-180" size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-1">
                                        <p className="text-[8px] font-black text-midnight-600 uppercase tracking-widest">Nivel de Objeto</p>
                                        <p className="text-2xl font-black text-white">
                                            {scoutLoading ? "..." : scoutData?.ilvl || "---"}
                                        </p>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-1">
                                        <p className="text-[8px] font-black text-midnight-600 uppercase tracking-widest">Mítica+ Score</p>
                                        <p className="text-2xl font-black text-[#00c3ff]">
                                            {scoutLoading ? "..." : scoutData?.mplusScore || "---"}
                                        </p>
                                    </div>
                                </div>

                                {scoutLoading ? (
                                    <div className="p-8 bg-midnight-950/50 rounded-3xl border border-dashed border-midnight-800 text-center space-y-4">
                                        <Loader2 className="mx-auto text-[#00c3ff]/40 animate-spin" size={32} />
                                        <p className="text-[9px] font-black text-midnight-500 uppercase tracking-[0.3em]">
                                            Extrayendo datos de Azeroth...
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-void/5 border border-void-light/10 rounded-2xl flex items-center justify-between">
                                            <span className="text-[9px] font-black text-midnight-500 uppercase tracking-widest">Especialización</span>
                                            <span className="text-[10px] font-black text-white uppercase">{scoutData?.spec}</span>
                                        </div>
                                        <div className="p-4 bg-midnight-950/50 border border-white/5 rounded-2xl flex items-center justify-between">
                                            <span className="text-[9px] font-black text-midnight-500 uppercase tracking-widest">Título Activo</span>
                                            <span className="text-[10px] font-black text-midnight-200 uppercase truncate max-w-[150px]">{scoutData?.title}</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setScoutingChar(null)}
                                    className="w-full py-5 bg-[#00c3ff]/10 hover:bg-[#00c3ff]/20 text-[#00c3ff] font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                                >
                                    Cerrar Consulta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {characters.length === 0 && !loading && !error && (
                <div className="flex flex-col gap-8 items-center">
                    <div className="w-full text-center py-20 bg-midnight-950/20 rounded-[40px] border border-dashed border-midnight-800 space-y-6">
                        <p className="text-midnight-500 font-black uppercase tracking-widest text-xs">
                            No se encontraron personajes activos en esta región.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-[#00c3ff]/10 text-[#00c3ff] font-black uppercase tracking-widest text-[10px] rounded-2xl border border-[#00c3ff]/20 hover:bg-[#00c3ff]/20 transition-all font-sans"
                        >
                            Refrescar Conexión
                        </button>
                    </div>

                    {debugData && (
                        <div className="w-full p-8 bg-midnight-950/50 rounded-3xl border border-midnight-800/50 font-mono text-[10px] overflow-auto max-h-96">
                            <p className="text-[#00c3ff] mb-4 uppercase tracking-widest font-black">Debug Log:</p>
                            <pre className="text-midnight-500">{JSON.stringify(debugData, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
