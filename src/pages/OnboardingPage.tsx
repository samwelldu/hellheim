import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { blizzardService } from '../services/blizzard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe, User, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export const OnboardingPage: React.FC = () => {
    const { blizzardUser, mainCharacter, setMainCharacter } = useAuth();
    const [characters, setCharacters] = useState<BlizzardCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmingMain, setConfirmingMain] = useState<BlizzardCharacter | null>(null);
    const [updatingMain, setUpdatingMain] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Si ya tiene un main, lo mandamos al dashboard
        if (mainCharacter) {
            navigate('/dashboard');
            return;
        }

        const loadCharacters = async () => {
            if (!blizzardUser?.token) {
                setLoading(false);
                setError("Debes iniciar sesión con Blizzard para registrar tu identidad.");
                return;
            }

            try {
                setLoading(true);
                const region = blizzardUser.region || 'us';
                const data = await blizzardService.getUserCharacters(blizzardUser.token, region);

                if (data && data.wow_accounts) {
                    const allChars: BlizzardCharacter[] = data.wow_accounts.flatMap((acc: any) => acc.characters || []);
                    // Filtrar solo niveles altos para el main
                    setCharacters(allChars
                        .filter(c => c.level >= 10)
                        .sort((a, b) => b.level - a.level)
                    );
                }
            } catch (err: any) {
                console.error("Error al cargar personajes:", err);
                setError("No pudimos sincronizar tus personajes de Azeroth.");
            } finally {
                setLoading(false);
            }
        };

        loadCharacters();
    }, [blizzardUser, mainCharacter, navigate]);

    const handleSelectMain = async () => {
        if (!confirmingMain) return;
        try {
            setUpdatingMain(true);
            await setMainCharacter({
                name: confirmingMain.name || 'Desconocido',
                realm: confirmingMain.realm?.slug || 'unknown',
                level: confirmingMain.level || 0,
                className: confirmingMain.playable_class?.name || 'Unknown',
                id: confirmingMain.id || Date.now()
            });
            // Una vez seleccionado, el useEffect de arriba redirigirá al Dashboard
        } catch (err) {
            console.error("Error al establecer main:", err);
        } finally {
            setUpdatingMain(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030105] flex flex-col items-center justify-center p-6 gap-6">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-void/20 border-t-void-light rounded-full animate-spin" />
                    <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-void-light opacity-50" size={32} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic animate-pulse">Invocando tu Linaje...</h2>
                    <p className="text-midnight-500 font-black uppercase text-[10px] tracking-[0.3em]">Conectando con los servidores de Blizzard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030105] text-white p-6 md:p-12 lg:p-20 relative overflow-hidden flex flex-col items-center">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-void/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00c3ff]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-5xl space-y-12 relative z-10">
                {/* Header Bienvenida */}
                <header className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-void/10 border border-void-light/20 rounded-full mb-4"
                    >
                        <Sparkles className="text-void-light" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-void-light">Bienvenido a Hellheim</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase text-glow-cyan"
                    >
                        Define tu Identidad
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-midnight-400 font-bold text-sm md:text-base leading-relaxed"
                    >
                        Para acceder al panel de la hermandad, primero debemos vincular tu cuenta con tu personaje principal.
                        Este será tu nombre oficial dentro del sistema de Hellheim.
                    </motion.p>
                </header>

                {error ? (
                    <div className="glass p-12 text-center space-y-6 max-w-md mx-auto relative overflow-hidden">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <p className="text-red-400 font-black uppercase text-xs tracking-widest">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-all text-white"
                        >
                            Reintentar Conexión
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-midnight-500 flex items-center gap-3">
                                <User size={14} className="text-void-light" /> Selecciona tu Personaje Principal
                            </h2>
                            <span className="text-[10px] font-black text-midnight-600 uppercase tracking-widest">
                                {characters.length} Personajes Detectados
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {characters.map((char, index) => {
                                const classNameStr = char.playable_class?.name || 'Unknown';
                                const classColor = CLASS_COLORS[classNameStr] || '#ffffff';
                                return (
                                    <motion.button
                                        key={char.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setConfirmingMain(char)}
                                        className="glass p-6 group relative overflow-hidden text-left hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <div className="absolute top-0 left-0 w-1.5 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: classColor }} />

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-midnight-500 uppercase tracking-widest">LVL {char.level || 0}</span>
                                                <Globe size={14} className="text-midnight-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight truncate" style={{ color: classColor }}>{char.name || 'Desconocido'}</h3>
                                                <p className="text-[9px] font-black text-midnight-400 uppercase tracking-widest leading-none mt-1">{char.realm?.name || 'Desconocido'}</p>
                                            </div>
                                            <div className="pt-4 flex items-center justify-between border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">Vincular Main</span>
                                                <ArrowRight size={14} className="text-void-light" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación */}
            <AnimatePresence>
                {confirmingMain && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm glass p-10 space-y-8 text-center relative overflow-hidden"
                        >
                            <div className="w-20 h-20 bg-void/20 text-void-light rounded-3xl flex items-center justify-center mx-auto border border-void-light/30 shadow-2xl shadow-void/20">
                                <Shield size={40} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic italic">Confirmar Identidad</h3>
                                <p className="text-sm text-midnight-300 font-bold leading-relaxed px-4">
                                    ¿Estás seguro que <span className="text-void-light text-xl font-black block mt-2 uppercase">{confirmingMain.name}</span> es tu personaje principal?
                                </p>
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-midnight-500 font-black uppercase tracking-widest leading-loose">
                                        Esta será tu identidad en todos los registros de la hermandad. Podrás cambiarla luego en tu perfil si es necesario.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={handleSelectMain}
                                    disabled={updatingMain}
                                    className="w-full py-4 bg-void hover:bg-void-light text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-void/20 flex items-center justify-center gap-3"
                                >
                                    {updatingMain ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>ESTABLECER IDENTIDAD <ArrowRight size={16} /></>
                                    )}
                                </button>
                                <button
                                    onClick={() => setConfirmingMain(null)}
                                    disabled={updatingMain}
                                    className="w-full py-4 text-midnight-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                                >
                                    Volver a la lista
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
