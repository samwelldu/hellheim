import React, { useState, useEffect } from 'react';
import { cmsService, type LandingContent } from '../../services/cmsService';
import { Tv, X, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const StreamerWidget: React.FC = () => {
    const [content, setContent] = useState<LandingContent | null>(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const unsubscribe = cmsService.subscribeToLanding((data: LandingContent) => {
            setContent(data);
        });
        return () => unsubscribe();
    }, []);

    if (!content || !content.streamers || content.streamers.length === 0) return null;

    return (
        <>
            {/* Desktop Sidebar (Floating Right) */}
            <div className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-row-reverse items-start pointer-events-none">
                <div className="pointer-events-auto flex items-start group">
                    {/* Trigger Handle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="bg-void border-y border-l border-white/10 p-3 rounded-l-2xl shadow-2xl transition-all hover:bg-void-light flex flex-col items-center gap-2 group-hover:pr-4"
                    >
                        <Tv size={20} className="text-white" />
                        <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-widest text-white/70">Streamers</span>
                    </button>

                    {/* Content Panel */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                className="bg-midnight-950/95 backdrop-blur-xl border border-white/5 w-80 shadow-3xl overflow-hidden flex flex-col h-[600px]"
                            >
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-void-light">Guild Streamers</h3>
                                    <button onClick={() => setIsOpen(false)} className="text-midnight-500 hover:text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-void">
                                    {content.streamers.map((s) => (
                                        <div key={s.name} className="p-2">
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 group/stream bg-black">
                                                <iframe
                                                    src={s.platform === 'twitch'
                                                        ? `https://player.twitch.tv/?muted=true&autoplay=true&channel=${s.name}&parent=${window.location.hostname || 'localhost'}&playsinline=true`
                                                        : `https://player.kick.com/${s.name}?muted=true&autoplay=true`
                                                    }
                                                    height="100%"
                                                    width="100%"
                                                    allow="autoplay; fullscreen"
                                                    allowFullScreen
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    className="w-full h-full pointer-events-auto"
                                                ></iframe>
                                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center pointer-events-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className={clsx(
                                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                                            s.platform === 'twitch' ? "bg-purple-500" : "bg-green-500"
                                                        )} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-white drop-shadow-md">{s.name}</span>
                                                    </div>
                                                    <a
                                                        href={s.platform === 'twitch' ? `https://twitch.tv/${s.name}` : `https://kick.com/${s.name}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="pointer-events-auto p-1.5 bg-void rounded-lg text-white opacity-0 group-hover/stream:opacity-100 transition-opacity"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Bottom Bar / Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-void text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-90 transition-transform"
                >
                    {isOpen ? <X size={24} /> : <Play size={24} className="ml-1" />}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.9 }}
                            className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] max-w-sm bg-midnight-950 border border-white/10 rounded-3xl shadow-3xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 bg-black/40 flex items-center gap-3">
                                <Tv size={18} className="text-void-light" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">Streamers Activos</span>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {content.streamers.map((s) => (
                                    <div key={s.name} className="space-y-2">
                                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                                            <iframe
                                                src={s.platform === 'twitch'
                                                    ? `https://player.twitch.tv/?muted=true&autoplay=true&channel=${s.name}&parent=${window.location.hostname || 'localhost'}&playsinline=true`
                                                    : `https://player.kick.com/${s.name}?muted=true&autoplay=true`
                                                }
                                                height="100%"
                                                width="100%"
                                                allow="autoplay; fullscreen"
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="w-full h-full"
                                            ></iframe>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-bold text-midnight-300">{s.platform === 'twitch' ? 'twitch.tv' : 'kick.com'}/{s.name}</span>
                                            <a
                                                href={s.platform === 'twitch' ? `https://twitch.tv/${s.name}` : `https://kick.com/${s.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-black uppercase tracking-widest text-void-light"
                                            >
                                                Ver Canal
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

const ExternalLink = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);
