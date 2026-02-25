import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Sword, Zap, Target, Clock, MessageSquare,
    Shield, Send, ArrowRight, ArrowLeft, CheckCircle2,
    Star, Info, X
} from 'lucide-react';
import { applicationService, type GuildApplication } from '../services/applicationService';
import { useToast } from '../context/ToastContext';
import { getClassColor } from '../utils/wowClasses';
import { CLASS_SPECS, getClassIconUrl, getSpecIconUrl } from '../utils/wowIcons';
import { Link } from 'react-router-dom';

const STEPS = [
    { title: "Identidad", icon: <User size={20} /> },
    { title: "Clase", icon: <Sword size={20} /> },
    { title: "Maestría", icon: <Zap size={20} /> },
    { title: "Objetivos", icon: <Target size={20} /> },
    { title: "Constancia", icon: <Clock size={20} /> },
    { title: "Filosofía", icon: <MessageSquare size={20} /> },
    { title: "Contacto", icon: <Info size={20} /> },
    { title: "Finalizar", icon: <Send size={20} /> }
];

export const ApplyPage: React.FC = () => {
    const { showToast } = useToast();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState<Partial<GuildApplication>>({
        characterName: '',
        className: '',
        spec: '',
        masteryLevel: 5,
        objectives: '',
        isConstant: 'si',
        guildMeaning: '',
        battleTag: '',
        discord: ''
    });

    const handleNext = () => {
        if (!validateStep()) return;
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const validateStep = () => {
        switch (step) {
            case 0: return !!form.characterName;
            case 1: return !!form.className && !!form.spec;
            case 2: return true;
            case 3: return (form.objectives?.length || 0) > 10;
            case 5: return (form.guildMeaning?.length || 0) > 10;
            case 6: return !!form.battleTag && !!form.discord;
            default: return true;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await applicationService.submitApplication(form as any);
            setIsSuccess(true);
            showToast("¡Tan bien! Tu postulación ha sido enviada 🫡", "success");
        } catch (e) {
            showToast("Vaya... hubo un error al enviar. Intenta de nuevo.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#05020a] flex items-center justify-center p-6 text-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-void/20 to-transparent"></div>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 glass p-12 rounded-[48px] border border-white/10 max-w-lg space-y-8"
                >
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                        <CheckCircle2 size={48} className="text-green-500" />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">¡Postulación Recibida!</h2>
                    <p className="text-midnight-400 text-lg leading-relaxed text-pretty">
                        Tu viaje hacia Hellheim ha comenzado. Revisaremos tu perfil con la atención que merece un héroe de Quel'Thalas. Esté atento a Discord.
                    </p>
                    <Link to="/" className="inline-block px-12 py-4 bg-white text-black font-black rounded-full uppercase tracking-widest text-xs hover:scale-105 transition-all">
                        Volver a Tierras de Sombras
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05020a] text-white flex flex-col p-6 lg:p-12 selection:bg-void selection:text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-void/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-purple-900/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Unirse a la Hermandad</h1>
                    <p className="text-midnight-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                        <Shield size={14} className="text-void-light" /> Hellheim Recruitment • Midnight Era
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                        <div
                            key={i}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${i === step ? 'bg-void border-void-light text-white scale-110 shadow-lg shadow-void/40' :
                                i < step ? 'bg-void/10 border-void/30 text-void-light' :
                                    'bg-midnight-950/40 border-white/5 text-midnight-600'
                                }`}
                        >
                            {i < step ? <CheckCircle2 size={16} /> : s.icon}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Form Area */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-2xl bg-midnight-950/40 backdrop-blur-xl border border-white/5 p-12 lg:p-16 rounded-[48px] shadow-2xl relative"
                    >
                        {/* Step Content */}
                        <div className="space-y-10">
                            {/* STEP 0: Nombre */}
                            {step === 0 && (
                                <div className="space-y-8">
                                    <div className="space-y-4 text-center">
                                        <h2 className="text-5xl font-black tracking-tighter">¿Cómo te conocen en <span className="text-void-light">Azeroth</span>?</h2>
                                        <p className="text-midnight-400 font-medium">Ingresa el nombre de tu personaje principal.</p>
                                    </div>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={form.characterName}
                                        onChange={e => setForm({ ...form, characterName: e.target.value })}
                                        placeholder="Ej: Silvanas..."
                                        className="w-full bg-black/50 border-2 border-white/5 rounded-2xl p-6 text-2xl font-black text-center focus:outline-none focus:border-void/50 transition-all placeholder:text-midnight-800"
                                    />
                                </div>
                            )}

                            {/* STEP 1: Clase y Spec */}
                            {step === 1 && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black tracking-tighter text-center">¿Cuál es tu <span className="text-void-light">especialidad</span>?</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Class Selector */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500">Clase</p>
                                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.keys(CLASS_SPECS).sort().map(cls => (
                                                    <button
                                                        key={cls}
                                                        onClick={() => setForm({ ...form, className: cls as any, spec: '' })}
                                                        className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-2 ${form.className === cls ? 'bg-void/20 border-void/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                                    >
                                                        <img src={getClassIconUrl(cls)} className="w-8 h-8 rounded" alt={cls} />
                                                        <span className="text-[9px] font-bold uppercase truncate w-full text-center" style={{ color: getClassColor(cls) }}>{cls}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Spec Selector */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500">Especialización</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {form.className ? (
                                                    CLASS_SPECS[form.className as keyof typeof CLASS_SPECS].map(spec => (
                                                        <button
                                                            key={spec}
                                                            onClick={() => setForm({ ...form, spec })}
                                                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-3 ${form.spec === spec ? 'bg-void shadow-lg shadow-void/20 border-void-light' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                                        >
                                                            <img src={getSpecIconUrl(form.className!, spec)} className="w-10 h-10 rounded-full" alt={spec} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{spec}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="h-40 flex items-center justify-center bg-black/20 rounded-2xl border border-dashed border-white/5 text-midnight-700 font-bold uppercase text-[10px] tracking-widest">
                                                        Selecciona clase
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Nivel de Dominio */}
                            {step === 2 && (
                                <div className="space-y-12 py-10">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-4xl font-black tracking-tighter">¿Cuánto dominas a tu <span className="text-void-light">héroe</span>?</h2>
                                        <p className="text-midnight-400">Sé honesto contigo mismo y con Hellheim.</p>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-widest text-midnight-600">Novato</span>
                                            <span className="text-6xl font-black text-void-light drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">{form.masteryLevel}</span>
                                            <span className="text-xs font-black uppercase tracking-widest text-void-light">Dios del Class</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="10" step="1"
                                            value={form.masteryLevel}
                                            onChange={e => setForm({ ...form, masteryLevel: parseInt(e.target.value) })}
                                            className="w-full h-3 bg-midnight-900 rounded-lg appearance-none cursor-pointer accent-void-light"
                                        />
                                        <div className="flex items-center gap-4 p-6 bg-void/10 border border-void/20 rounded-2xl">
                                            <div className="w-12 h-12 bg-void/20 rounded-xl flex items-center justify-center text-void-light shrink-0">
                                                <Star className={form.masteryLevel && form.masteryLevel >= 8 ? 'animate-spin-slow' : ''} />
                                            </div>
                                            <p className="text-sm text-midnight-300 italic">
                                                {form.masteryLevel && form.masteryLevel >= 9 ? "Un maestro absoluto. Hellheim necesita tu poder." :
                                                    form.masteryLevel && form.masteryLevel >= 6 ? "Buen dominio, siempre hay espacio para perfeccionar la sombra." :
                                                        "Aprendiendo los caminos. La voluntad es lo más importante."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Objetivos */}
                            {step === 3 && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black tracking-tighter text-center">¿Qué buscas alcanzar en <span className="text-void-light">Midnight</span>?</h2>
                                    <textarea
                                        autoFocus
                                        value={form.objectives}
                                        onChange={e => setForm({ ...form, objectives: e.target.value })}
                                        placeholder="Cuéntanos tus metas, ambiciones y qué esperas lograr con nosotros..."
                                        className="w-full h-48 bg-black/40 border-2 border-white/5 rounded-3xl p-8 text-lg font-medium focus:outline-none focus:border-void/50 transition-all resize-none placeholder:text-midnight-700"
                                    />
                                    <div className="flex justify-end pr-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${(form.objectives?.length || 0) > 10 ? 'text-green-500' : 'text-midnight-600 animate-pulse'}`}>
                                            {(form.objectives?.length || 0)} / 10 min
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Constancia */}
                            {step === 4 && (
                                <div className="space-y-12">
                                    <h2 className="text-4xl font-black tracking-tighter text-center">¿Eres constante en las <span className="text-void-light">sombras</span>?</h2>
                                    <div className="grid grid-cols-3 gap-6">
                                        <button
                                            onClick={() => setForm({ ...form, isConstant: 'si' })}
                                            className={`p-8 rounded-[32px] border transition-all flex flex-col items-center gap-4 text-center ${form.isConstant === 'si' ? 'bg-void border-void-light shadow-[0_20px_40px_-10px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100'}`}
                                        >
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <CheckCircle2 size={32} className={form.isConstant === 'si' ? 'text-white' : 'text-midnight-500'} />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs">Siempre</p>
                                                <p className="text-[10px] text-white/50 mt-1 uppercase">100% Asistencia</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setForm({ ...form, isConstant: 'alternativa' })}
                                            className={`p-8 rounded-[32px] border transition-all flex flex-col items-center gap-4 text-center ${form.isConstant === 'alternativa' ? 'bg-void border-void-light shadow-[0_20px_40px_-10px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100'}`}
                                        >
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Clock size={32} className={form.isConstant === 'alternativa' ? 'text-white' : 'text-midnight-500'} />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs">Alternar</p>
                                                <p className="text-[10px] text-white/50 mt-1 uppercase">Sujeto a horario</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setForm({ ...form, isConstant: 'no' })}
                                            className={`p-8 rounded-[32px] border transition-all flex flex-col items-center gap-4 text-center ${form.isConstant === 'no' ? 'bg-void border-void-light shadow-[0_20px_40px_-10px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100'}`}
                                        >
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <X size={32} className={form.isConstant === 'no' ? 'text-white' : 'text-midnight-500'} />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs">Ocasional</p>
                                                <p className="text-[10px] text-white/50 mt-1 uppercase">Casual / Backup</p>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="p-6 bg-midnight-950/60 rounded-2xl border border-white/5 flex items-start gap-4">
                                        <Info size={18} className="text-void-light mt-1 shrink-0" />
                                        <p className="text-xs text-midnight-400 italic leading-relaxed">
                                            En Hellheim valoramos la transparencia. No penalizamos la honestidad, pero ajustamos el roster según el compromiso declarado.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Filosofía */}
                            {step === 5 && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black tracking-tighter text-center">¿Qué es para ti una <span className="text-void-light">Guild</span>?</h2>
                                    <textarea
                                        autoFocus
                                        value={form.guildMeaning}
                                        onChange={e => setForm({ ...form, guildMeaning: e.target.value })}
                                        placeholder="Define con tus palabras qué significa ser parte de una comunidad como Hellheim..."
                                        className="w-full h-48 bg-black/40 border-2 border-white/5 rounded-3xl p-8 text-lg font-medium focus:outline-none focus:border-void/50 transition-all resize-none placeholder:text-midnight-700"
                                    />
                                    <div className="flex justify-end pr-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${(form.guildMeaning?.length || 0) > 10 ? 'text-green-500' : 'text-midnight-600 animate-pulse'}`}>
                                            {(form.guildMeaning?.length || 0)} / 10 min
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* STEP 6: Contacto */}
                            {step === 6 && (
                                <div className="space-y-12">
                                    <h2 className="text-4xl font-black tracking-tighter text-center">Canales de <span className="text-void-light">Comunicación</span></h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-void/20 flex items-center justify-center text-void-light border border-void/30">
                                                    <Shield size={16} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-400">Battle Net Tag</p>
                                            </div>
                                            <input
                                                type="text"
                                                value={form.battleTag}
                                                onChange={e => setForm({ ...form, battleTag: e.target.value })}
                                                placeholder="Ej: Hellheim#1234"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 font-bold text-center focus:outline-none focus:border-void/50"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] border border-[#5865F2]/30">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-400">Usuario Discord</p>
                                            </div>
                                            <input
                                                type="text"
                                                value={form.discord}
                                                onChange={e => setForm({ ...form, discord: e.target.value })}
                                                placeholder="Ej: helheim_user"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 font-bold text-center focus:outline-none focus:border-[#5865F2]/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 7: Confirmación Final */}
                            {step === 7 && (
                                <div className="space-y-10 text-center">
                                    <div className="space-y-4">
                                        <h2 className="text-5xl font-black tracking-tighter uppercase">¿Todo <span className="text-void-light">listo</span>?</h2>
                                        <p className="text-midnight-400 text-lg">Revisa tu información antes de sellar el pacto.</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 p-8 bg-black/40 border border-white/5 rounded-3xl text-left">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-midnight-600">Personaje</p>
                                            <p className="font-black text-white" style={{ color: getClassColor(form.className || '') }}>{form.characterName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-midnight-600">Especialización</p>
                                            <p className="font-black text-white uppercase text-xs">{form.spec} {form.className}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-midnight-600">Dominio</p>
                                            <p className="font-black text-void-light">{form.masteryLevel}/10</p>
                                        </div>
                                        <div className="col-span-full pt-4 border-t border-white/5 space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-midnight-600">Contacto</p>
                                            <p className="font-bold text-xs text-midnight-300">{form.battleTag} • {form.discord}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="w-full bg-white text-black font-black py-6 rounded-full uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Enviando al Vacío..." : (
                                                <>
                                                    Sellar Pacto <Send size={20} />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[10px] text-midnight-600 uppercase font-black">Al enviar, aceptas que los oficiales de Hellheim te contacten</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer (within the card padding for alignment) */}
                        {step < 7 && (
                            <div className="flex justify-between items-center mt-12 pt-10 border-t border-white/5">
                                <button
                                    onClick={handleBack}
                                    disabled={step === 0}
                                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${step === 0 ? 'opacity-0' : 'text-midnight-500 hover:text-white'}`}
                                >
                                    <ArrowLeft size={16} /> Atrás
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-3 px-8 py-4 bg-void hover:bg-void-light text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 hover:shadow-lg hover:shadow-void/30"
                                >
                                    Siguiente <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Subtle Footer */}
            <div className="relative z-10 text-center py-8">
                <p className="text-[10px] text-midnight-700 font-bold uppercase tracking-widest">Quel'Thalas te observa • Midnight @ 2026</p>
            </div>
        </div>
    );
};
