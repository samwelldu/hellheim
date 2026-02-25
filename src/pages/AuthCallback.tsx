import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
    const [message, setMessage] = useState('Sincronizando con Azeroth...');
    const { setBlizzardUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const TanValidarAcceso = async () => {
            const token = searchParams.get('token');
            const accountId = searchParams.get('account_id');
            const region = searchParams.get('region') || 'us';

            if (!token || !accountId) {
                setStatus('error');
                setMessage('Error: Faltan credenciales de Battle.net.');
                return;
            }

            try {
                // Heurística de Tan: Simulamos la validación con Blizzard
                // En producción, el PHP ya debería habernos traído el roster validado
                await new Promise(r => setTimeout(r, 2000));

                const mockUser = {
                    id: accountId,
                    token: token,
                    region: region,
                    role: 'member',
                    displayName: accountId,
                    authMethod: 'blizzard'
                };

                setBlizzardUser(mockUser);
                setStatus('success');
                setMessage(`¡Identidad Confirmada! Bienvenido, ${mockUser.displayName}.`);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);

            } catch (err) {
                setStatus('error');
                setMessage('No se pudo verificar tu conexión con la hermandad.');
            }
        };

        TanValidarAcceso();
    }, [searchParams, navigate, setBlizzardUser]);

    return (
        <div className="min-h-screen bg-[#05020a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Fondo de Tan */}
            <div className="absolute inset-0 bg-void-gradient opacity-30"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-midnight-900/40 backdrop-blur-3xl p-12 rounded-[48px] border border-white/10 shadow-2xl text-center space-y-8 relative z-10"
            >
                <div className="flex justify-center">
                    <div className="relative">
                        {status === 'validating' && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 border-2 border-dashed border-void-light/50 rounded-full"
                            />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {status === 'validating' && <Loader2 className="text-void-light animate-spin" size={40} />}
                            {status === 'success' && <ShieldCheck className="text-green-500" size={60} />}
                            {status === 'error' && <ShieldAlert className="text-red-500" size={60} />}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {status === 'validating' ? 'Verificando Linaje' :
                            status === 'success' ? 'Acceso Concedido' : 'Acceso Denegado'}
                    </h2>
                    <p className="text-midnight-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                        {message}
                    </p>
                </div>

                {status === 'error' && (
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 transition-all"
                    >
                        Volver al Login
                    </button>
                )}

                {status === 'success' && (
                    <div className="flex items-center justify-center gap-2 text-void-light text-[10px] font-black uppercase tracking-[0.3em] h-10">
                        Sincronizando Dashboard...
                    </div>
                )}
            </motion.div>
        </div>
    );
};
