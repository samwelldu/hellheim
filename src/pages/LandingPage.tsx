import React, { useEffect, useState } from 'react';
import { ParallaxHero } from '../UI/componentes/ParallaxHero';
import { Shield, Zap, Sword, Users, ArrowRight, ExternalLink, Calendar, Newspaper, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { cmsService, type LandingContent, type GuildNews } from '../services/cmsService';

const B_ICON_MAP: Record<string, any> = {
    Shield: <Shield />,
    Zap: <Zap />,
    Sword: <Sword />
};

interface WoWHeadArticle {
    title: string;
    link: string;
    pubDate: string;
    thumbnail: string;
    description: string;
}

export const LandingPage: React.FC = () => {
    const [content, setContent] = useState<LandingContent | null>(null);
    const [guildNews, setGuildNews] = useState<GuildNews[]>([]);
    const [wowheadNews, setWowheadNews] = useState<WoWHeadArticle[]>([]);
    const [TanNoticiaActiva, setTanNoticiaActiva] = useState<GuildNews | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = cmsService.subscribeToLanding((data) => {
            setContent(data);
        });

        loadNews();

        return () => unsubscribe();
    }, []);

    const loadNews = async () => {
        try {
            const [gNews, whResponse] = await Promise.all([
                cmsService.getGuildNews().catch(() => []),
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://www.wowhead.com/news/rss/all')}`)
            ]);

            setGuildNews(gNews.slice(0, 3));

            if (whResponse.ok) {
                const whData = await whResponse.json();
                if (whData.status === 'ok') {
                    const processedItems = whData.items.map((item: any) => {
                        let thumbnail = "";

                        // 1. Intentar desde enclosure (es lo más común para imágenes de alta calidad)
                        if (item.enclosure && item.enclosure.link) {
                            thumbnail = item.enclosure.link;
                        }
                        // 2. Intentar desde thumbnail del feed
                        else if (item.thumbnail) {
                            thumbnail = item.thumbnail;
                        }
                        // 3. Fallback a regex en la descripción (HTML codificado)
                        else if (item.description) {
                            const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                            if (imgMatch) thumbnail = imgMatch[1];
                        }

                        return {
                            ...item,
                            thumbnail: thumbnail || "https://wow.zamimg.com/images/logos/wowhead-logo.png"
                        };
                    });
                    setWowheadNews(processedItems.slice(0, 4));
                }
            } else {
                console.error("WoWHead API Error:", whResponse.status);
            }
        } catch (e) {
            console.error("Error loading news", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !content) {
        return <div className="bg-black min-h-screen flex items-center justify-center font-black text-midnight-500 uppercase tracking-widest animate-pulse">Cargando Quel'Thalas...</div>;
    }

    return (
        <div className="bg-[#05020a] text-white min-h-screen font-sans selection:bg-void selection:text-white">
            {/* Navbar / Direct Access */}
            <nav className="absolute top-0 right-0 p-8 z-50">
                <Link to="/login" className="px-6 py-2 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-full text-xs font-black uppercase tracking-widest transition-all">
                    Acceso Jugadores
                </Link>
            </nav>

            {/* Hero Section - La bienvenida de Tan a la hermandad */}
            <ParallaxHero
                TanTitulo={content.hero.title}
                TanSubtitulo={content.hero.subtitle}
                TanBannerVisual="/BANNER_WOW.jpg"
            />

            {/* Vision Section */}
            <section className="relative px-6 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-void/10 border border-void/20 rounded-full text-void-light text-xs font-black tracking-widest uppercase">
                            <Shield size={14} />
                            {content.vision.tag}
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
                            {content.vision.title} <br />
                            <span className="text-void-light">{content.vision.highlight}</span>
                        </h2>
                        <p className="text-midnight-400 text-lg leading-relaxed max-w-xl">
                            {content.vision.description}
                        </p>
                        <div className="grid grid-cols-2 gap-8 pt-8">
                            <div className="space-y-2">
                                <div className="text-4xl font-black text-white">CE</div>
                                <div className="text-xs uppercase tracking-widest text-midnight-500 font-bold">Cutting Edge Aim</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black text-white">+15k</div>
                                <div className="text-xs uppercase tracking-widest text-midnight-500 font-bold">Comunidad Activa</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="aspect-square bg-void/5 rounded-3xl border border-white/5 flex items-center justify-center p-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-void/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <Sword className="text-void-light opacity-20 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" size={200} />
                            <div className="absolute bottom-8 left-8 right-8 p-6 glass rounded-2xl border border-white/10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <p className="text-sm font-medium text-white/80 italic">"Donde otros ven sombras, nosotros vemos nuestro hogar."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WoWHead News Section (Retail US) */}
            <section className="py-32 px-6 bg-gradient-to-b from-[#05020a] to-[#05020a]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-void-light font-black uppercase tracking-[0.4em] text-[10px]">
                                <span className="w-8 h-[1px] bg-void-light/50"></span>
                                <Newspaper size={14} className="animate-pulse" /> Breaking News
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">WoWHead <span className="text-midnight-600">INTEL</span></h2>
                        </div>
                        <a
                            href="https://www.wowhead.com/news"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500"
                        >
                            Ver Todo en WoWHead <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wowheadNews.length > 0 ? wowheadNews.map((article, i) => (
                            <a
                                key={i}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex flex-col h-full bg-midnight-950/40 backdrop-blur-sm rounded-[24px] border border-white/10 overflow-hidden hover:border-void-light/40 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.15)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-void/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="h-52 overflow-hidden relative">
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-midnight-950 via-transparent to-transparent opacity-80"></div>
                                    <img
                                        src={article.thumbnail}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/logos/wowhead-logo.png";
                                        }}
                                    />
                                    <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-void-light">News</span>
                                    </div>
                                </div>

                                <div className="p-7 flex-1 flex flex-col relative z-20">
                                    <h3 className="font-bold text-base leading-tight group-hover:text-void-light transition-colors duration-300 line-clamp-3 mb-6">
                                        {article.title}
                                    </h3>

                                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-midnight-500 font-bold uppercase tracking-tighter">Publicado</span>
                                            <span className="text-[10px] text-white/50 font-black">{new Date(article.pubDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-void group-hover:border-void transition-all duration-500">
                                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        )) : (
                            <div className="col-span-full py-24 text-center border border-white/5 bg-midnight-950/20 backdrop-blur-sm rounded-[32px] group">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:border-void-light/50 transition-colors">
                                    <Newspaper size={24} className="text-midnight-600 group-hover:text-void-light transition-colors" />
                                </div>
                                <p className="text-midnight-500 font-black uppercase tracking-[0.2em] text-xs">
                                    Sincronizando Archivos de Azeroth...
                                </p>
                                <p className="text-[10px] text-midnight-700 font-bold mt-3 uppercase tracking-widest animate-pulse">Estableciendo conexión encriptada</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Guild Blog Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <div className="flex items-center justify-center gap-2 text-void-light font-black uppercase tracking-[0.3em] text-xs">
                            <Zap size={16} /> Official Blog
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">Noticias de la Hermandad</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {guildNews.length > 0 ? guildNews.map((news, i) => (
                            <div
                                key={i}
                                onClick={() => setTanNoticiaActiva(news)}
                                className="group relative bg-midnight-950 rounded-[40px] border border-white/5 overflow-hidden hover:border-void/50 transition-all cursor-pointer"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    <img
                                        src={news.bannerUrl}
                                        alt={news.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/20 to-transparent"></div>
                                </div>
                                <div className="p-10 -mt-20 relative z-10 glass mx-6 mb-6 rounded-3xl border border-white/10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="px-3 py-1 bg-void/20 rounded-full text-[10px] font-black uppercase tracking-widest text-void-light border border-void/30">
                                            Noticia
                                        </div>
                                        <div className="flex items-center gap-2 text-midnight-500 text-[10px] font-bold">
                                            <Calendar size={12} /> {new Date(news.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black leading-tight group-hover:text-void-light transition-colors">{news.title}</h3>
                                    <p className="text-midnight-400 text-sm line-clamp-3 leading-relaxed">{news.content}</p>
                                    <div className="pt-6 flex items-center justify-between border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Por {news.author}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTanNoticiaActiva(news);
                                            }}
                                            className="text-void-light group/btn flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                                        >
                                            Leer Más <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-midnight-950/50">
                                <p className="text-midnight-500 font-black uppercase tracking-widest">Esperando el primer reporte de batalla...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Recruitment / Classes Section */}
            <section className="bg-[#05020a]/50 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Buscamos Talento</h2>
                        <p className="text-midnight-400 uppercase tracking-[0.2em] text-sm font-bold">Estado del Reclutamiento</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {content.recruitment.map((item, i) => (
                            <div key={i} className="bg-midnight-900/50 p-10 rounded-3xl border border-white/5 hover:border-void/50 transition-all group hover:-translate-y-2">
                                <div className={clsx("p-4 rounded-2xl bg-black/50 border border-white/5 w-fit mb-8 group-hover:scale-110 transition-transform", item.color)}>
                                    {B_ICON_MAP[item.icon] || <Sword />}
                                </div>
                                <h3 className="text-2xl font-black mb-2">{item.role}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-midnight-500 text-sm font-bold uppercase tracking-widest">Prioridad</span>
                                    <span className={clsx("text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                        item.status === 'Alta' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            item.status === 'Media' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                'bg-red-500/10 border-red-500/20 text-red-500'
                                    )}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-void/20 to-midnight-950 p-1 rounded-3xl border border-white/10">
                    <div className="bg-black/80 p-12 md:p-20 rounded-[22px] text-center space-y-10">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                            ¿Listo para <span className="text-void-light">reclamar Quel'Thalas</span>?
                        </h2>
                        <p className="text-midnight-400 text-lg">
                            Las inscripciones para la core de raid en Midnight ya están abiertas. <br /> Únete a nuestro Discord y postula hoy mismo.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="w-full sm:w-auto bg-white text-black font-black px-12 py-5 rounded-full hover:scale-105 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                                <Users size={20} /> Aplicar Ahora
                            </button>
                            <Link to="/login" className="w-full sm:w-auto text-white/50 hover:text-white font-bold px-12 py-5 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 group">
                                Acceso Jugadores <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-20 px-6 text-center">
                <div className="text-2xl font-black tracking-tighter mb-4">MIDNIGHT GUILD</div>
                <p className="text-midnight-600 text-xs font-bold uppercase tracking-widest">© 2026 World of Warcraft - Hermandad Privada</p>
            </footer>

            {/* Modal de Lectura de Tan - Para sumergirse en la historia de la hermandad */}
            <AnimatePresence>
                {TanNoticiaActiva && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTanNoticiaActiva(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-midnight-950 rounded-[48px] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                        >
                            <button
                                onClick={() => setTanNoticiaActiva(null)}
                                className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>

                            <div className="overflow-y-auto custom-scrollbar">
                                <div className="h-80 relative">
                                    <img
                                        src={TanNoticiaActiva.bannerUrl}
                                        alt={TanNoticiaActiva.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 to-transparent"></div>
                                </div>

                                <div className="p-12 lg:p-20 -mt-24 relative z-10 glass mx-6 lg:mx-12 mb-12 rounded-[32px] border border-white/10 space-y-8">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="px-4 py-1.5 bg-void/20 rounded-full text-xs font-black uppercase tracking-widest text-void-light border border-void/30">
                                            Mise en Scène
                                        </div>
                                        <div className="flex items-center gap-4 text-midnight-500 text-xs font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} /> {new Date(TanNoticiaActiva.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="w-1.5 h-1.5 bg-midnight-800 rounded-full" />
                                            <span>Por {TanNoticiaActiva.author}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                                        {TanNoticiaActiva.title}
                                    </h2>

                                    <div className="prose prose-invert max-w-none">
                                        {TanNoticiaActiva.content.split('\n').map((paragraph, idx) => (
                                            paragraph ? (
                                                <p key={idx} className="text-midnight-300 text-lg leading-relaxed mb-6 font-medium">
                                                    {paragraph}
                                                </p>
                                            ) : <br key={idx} />
                                        ))}
                                    </div>

                                    <div className="pt-12 flex justify-center">
                                        <button
                                            onClick={() => setTanNoticiaActiva(null)}
                                            className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all text-xs"
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
