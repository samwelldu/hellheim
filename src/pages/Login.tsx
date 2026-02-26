import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { cmsService } from '../services/cmsService';
import { useEffect } from 'react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [TanModoAdmin, setTanModoAdmin] = useState(false);
    const [region, setRegion] = useState<'us' | 'eu'>('us');
    const [TanEslogan, setTanEslogan] = useState("Hermandad de la Sombra");
    const { user, blizzardUser, loading, isRoleSettled } = useAuth();

    useEffect(() => {
        const unsubscribe = cmsService.subscribeToLanding((content) => {
            if (content?.hero?.subtitle) {
                setTanEslogan(content.hero.subtitle);
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading) return null;

    // Tan: Solo redirigimos si 1) Ya definimos quién eres y 2) Tienes sesión
    if (isRoleSettled && (user || blizzardUser)) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Tan: Eliminamos navigate() manual para que actúe el AuthContext cuando defina roles
        } catch (err: any) {
            setError('Credenciales de oficialía inválidas.');
            console.error(err);
        }
    };

    const handleBlizzardLogin = () => {
        // Tan: Enviamos nuestro origen dinámico para que el proxy sepa a dónde volver
        const TanOrigen = window.location.origin;
        window.location.href = `https://digitan.cl/api/hell/blizzard_api/blizzard_proxy.php?type=auth&mode=login&region=${region}&return=${encodeURIComponent(TanOrigen)}`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#05020a] relative overflow-hidden">
            {/* Fondo de Tan - Sombras de Quel'Thalas */}
            <div className="absolute inset-0 bg-void-gradient opacity-30"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-void/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md relative z-10 px-6">
                <div className="text-center mb-12 space-y-4 flex flex-col items-center">
                    <Link to="/" className="inline-block group/logo cursor-pointer">
                        <img
                            src="/logo_hellheim_ice.png"
                            alt="Hellheim Logo"
                            className="w-48 h-auto object-contain transition-all duration-500 group-hover/logo:scale-105 drop-shadow-[0_0_20px_rgba(0,195,255,0.4)]"
                        />
                    </Link>
                    <div className="flex items-center justify-center gap-2 text-midnight-500 font-bold uppercase tracking-[0.3em] text-[10px] text-center px-4">
                        <div className="w-8 h-[1px] bg-midnight-800 shrink-0"></div>
                        <span className="line-clamp-1">{TanEslogan}</span>
                        <div className="w-8 h-[1px] bg-midnight-800 shrink-0"></div>
                    </div>
                </div>

                <div className="bg-midnight-900/40 backdrop-blur-2xl p-8 lg:p-12 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-void/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <AnimatePresence mode="wait">
                        {!TanModoAdmin ? (
                            <motion.div
                                key="blizzard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Registro de Combate</h2>
                                    <p className="text-xs text-midnight-400 font-medium">Conéctate con tu cuenta de Blizzard para acceder.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {(['us', 'eu'] as const).map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setRegion(r)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    region === r
                                                        ? "bg-[#00c3ff]/20 text-[#00c3ff] border border-[#00c3ff]/30 shadow-[0_0_15px_rgba(0,195,255,0.2)]"
                                                        : "bg-midnight-800/50 text-midnight-500 border border-white/5 hover:text-white"
                                                )}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleBlizzardLogin}
                                        className="w-full group/bnet relative flex items-center justify-center gap-4 py-5 bg-[#00c3ff] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(0,195,255,0.3)]"
                                    >
                                        <svg viewBox="0 0 30 30" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M 26.193 11.848 c 0.895 -2.755 1.063 -5.267 0.453 -7.17 l -0.017 -0.054 c -0.037 -0.103 -0.128 -0.321 -0.243 -0.321 c -0.088 0 -0.089 0.146 -0.084 0.22 l 0.006 0.043 c 0.194 1.7 -0.326 4.124 -1.371 6.663 c -2.143 -0.973 -4.717 -1.75 -7.573 -2.208 c -2.566 -0.413 -5.023 -0.504 -7.25 -0.322 c 0.264 -1.752 0.919 -2.971 1.993 -3.229 c 1.478 -0.353 3.09 0.619 4.627 2.388 q 0.399 0.054 0.798 0.118 q 1.138 0.183 2.234 0.434 c -2.803 -5.272 -6.562 -8.227 -9.421 -7.136 c -2.176 0.83 -3.287 3.823 -3.155 7.846 c -2.833 0.603 -5.093 1.713 -6.436 3.193 l -0.037 0.041 c -0.072 0.084 -0.215 0.272 -0.157 0.372 c 0.043 0.075 0.17 0.003 0.233 -0.038 l 0.034 -0.026 c 1.375 -1.018 3.735 -1.78 6.456 -2.145 c 0.229 2.343 0.843 4.96 1.873 7.662 c 0.926 2.429 2.076 4.602 3.348 6.44 c -1.65 0.648 -3.034 0.69 -3.793 -0.111 c -1.046 -1.103 -1.01 -2.985 -0.246 -5.202 q -0.152 -0.372 -0.297 -0.75 a 35 35 0 0 1 -0.741 -2.151 c -3.165 5.063 -3.844 9.796 -1.47 11.727 c 1.806 1.47 4.955 0.935 8.372 -1.19 c 1.939 2.152 4.03 3.554 5.983 3.977 l 0.055 0.012 c 0.108 0.02 0.342 0.05 0.4 -0.05 c 0.044 -0.076 -0.082 -0.15 -0.149 -0.183 l -0.04 -0.017 c -1.569 -0.681 -3.409 -2.344 -5.085 -4.518 c 1.914 -1.37 3.874 -3.21 5.699 -5.454 c 1.64 -2.016 2.947 -4.098 3.904 -6.119 c 1.385 1.106 2.113 2.282 1.8 3.34 c -0.433 1.458 -2.08 2.368 -4.382 2.814 a 35 35 0 0 1 -1.994 2.35 c 5.967 0.21 10.405 -1.57 10.89 -4.59 c 0.37 -2.3 -1.667 -4.759 -5.217 -6.656 m -5.183 6.026 c -2.104 2.587 -4.727 4.789 -7.06 6.062 a 26.4 26.4 0 0 1 -2.248 -4.496 c -1.188 -3.116 -1.784 -6.489 -1.72 -9.146 a 26.4 26.4 0 0 1 5.018 0.301 c 3.292 0.53 6.511 1.7 8.78 3.083 a 26.4 26.4 0 0 1 -2.77 4.196" />
                                        </svg>
                                        Acceso Jugadores
                                    </button>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-4">
                                    <p className="text-[9px] text-midnight-500 font-black uppercase tracking-[0.3em] text-center">Nivel de Acceso Superior</p>
                                    <button
                                        onClick={() => setTanModoAdmin(true)}
                                        className="w-full py-4 bg-void/5 hover:bg-void/10 border border-void-light/10 text-void-light font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-void/5"
                                    >
                                        <Lock size={12} />
                                        Acceso de Oficialía
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="admin"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setTanModoAdmin(false)}
                                        className="text-midnight-500 hover:text-white transition-colors"
                                    >
                                        <ArrowRight className="rotate-180" size={20} />
                                    </button>
                                    <span className="text-[10px] font-black text-void-light uppercase tracking-widest">Oficialía</span>
                                    <div className="w-5"></div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="relative group/input">
                                            <Mail className="absolute left-4 top-4 text-midnight-600 group-focus-within/input:text-void-light transition-colors" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-void-light/50 text-sm text-white transition-all placeholder-midnight-600"
                                                placeholder="oficial@hellheim.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-4 text-midnight-600 group-focus-within/input:text-void-light transition-colors" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-void-light/50 text-sm text-white transition-all placeholder-midnight-600"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-4 text-midnight-600 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-void/20 hover:bg-void/40 border border-void-light/30 text-void-light font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all duration-300"
                                    >
                                        Validar Acceso
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="mt-8 text-center text-[10px] text-midnight-600 font-bold uppercase tracking-[0.2em]">
                    Hellheim • © 2026 Quel'Thalas
                </p>
            </div>
        </div>
    );
};
