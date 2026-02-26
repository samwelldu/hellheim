import React, { useState, useEffect } from 'react';
import { cmsService, type LandingContent, type GuildNews } from '../services/cmsService';
import { useToast } from '../context/ToastContext';
import { Save, Settings, Layout, Users, Play, RefreshCw, Plus, Trash2, FileText, Globe, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const CMSPage: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'news'>('general');
    const [content, setContent] = useState<LandingContent | null>(null);
    const [news, setNews] = useState<GuildNews[]>([]);
    const [isAddingNews, setIsAddingNews] = useState(false);
    const [newNews, setNewNews] = useState<GuildNews>({
        title: '',
        author: '',
        bannerUrl: '',
        content: '',
        createdAt: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [landingData, newsData] = await Promise.all([
                cmsService.getLandingContent(),
                cmsService.getGuildNews()
            ]);
            setContent(landingData);
            setNews(newsData);
        } catch (e) {
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        try {
            await cmsService.updateLandingContent(content);
            showToast("Cambios guardados con éxito", "success");
        } catch (e) {
            showToast("Error al guardar cambios", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddNews = async () => {
        if (!newNews.title || !newNews.author) return;
        setSaving(true);
        try {
            await cmsService.addNewsItem(newNews);
            const updatedNews = await cmsService.getGuildNews();
            setNews(updatedNews);
            setIsAddingNews(false);
            setNewNews({ title: '', author: '', bannerUrl: '', content: '', createdAt: 0 });
            showToast("Noticia publicada", "success");
        } catch (e) {
            showToast("Error al publicar", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNews = async (id: string) => {
        if (!window.confirm("¿Eliminar esta noticia?")) return;
        try {
            await cmsService.deleteNewsItem(id);
            setNews(news.filter(n => n.id !== id));
            showToast("Noticia eliminada", "success");
        } catch (e) {
            showToast("Error al eliminar", "error");
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest text-midnight-500 text-xl">Accediendo a la Cámara de las Sombras...</div>;
    if (!content) return null;

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 glass p-8 rounded-3xl relative">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-void/10 rounded-2xl border border-void/20 shadow-2xl shadow-void/10">
                        <Settings className="text-void-light" size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Portal de Gestión Web</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-midnight-400 text-xs font-black uppercase tracking-[0.2em]">ADMINISTRADOR DE CONTENIDOS</span>
                            <div className="h-1 w-1 bg-void rounded-full"></div>
                            <span className="text-void-light text-xs font-black uppercase tracking-widest">GOLD STANDARD CMS</span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={clsx(
                            "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'general' ? "bg-void text-white shadow-lg" : "text-midnight-400 hover:text-white"
                        )}
                    >
                        <Globe size={16} /> Estructura
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={clsx(
                            "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'news' ? "bg-void text-white shadow-lg" : "text-midnight-400 hover:text-white"
                        )}
                    >
                        <FileText size={16} /> Blog Interno
                    </button>
                </div>
            </header>

            {activeTab === 'general' ? (
                <div className="space-y-8 animate-fade-up">
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-3 bg-void hover:bg-void-light text-white font-black px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-void/30 hover:scale-105 active:scale-95 disabled:opacity-50 group"
                        >
                            <Save size={20} className="group-hover:rotate-12 transition-transform" />
                            {saving ? 'SINCRONIZANDO...' : 'PUBLICAR CAMBIOS GENERALES'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Hero Settings */}
                        <div className="glass p-1 relative">
                            <div className="bg-black/40 p-10 rounded-[28px] border border-white/5 space-y-8">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Layout className="text-void-light" size={24} /> Banner Principal</h2>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Título de Portada</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-black text-xl tracking-tight"
                                            value={content.hero.title}
                                            onChange={e => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Slogan del Hero</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-bold"
                                            value={content.hero.subtitle}
                                            onChange={e => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1 flex justify-between">
                                            ID de YouTube
                                            <span className="text-void-light lowercase font-mono">ID: {content.hero.videoId}</span>
                                        </label>
                                        <div className="relative group">
                                            <Play className="absolute left-6 top-1/2 -translate-y-1/2 text-midnight-500 group-focus-within:text-void-light transition-colors" size={20} />
                                            <input
                                                className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-void outline-none transition-all font-mono"
                                                value={content.hero.videoId}
                                                onChange={e => setContent({ ...content, hero: { ...content.hero, videoId: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vision Settings */}
                        <div className="glass p-1 relative">
                            <div className="bg-black/40 p-10 rounded-[28px] border border-white/5 space-y-8">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Users className="text-void-light" size={24} /> Nuestra Visión</h2>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Tag de Sección</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-black"
                                            value={content.vision.tag}
                                            onChange={e => setContent({ ...content, vision: { ...content.vision, tag: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Título de Visión</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-black text-xl"
                                            value={content.vision.title}
                                            onChange={e => setContent({ ...content, vision: { ...content.vision, title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Cuerpo del Mensaje</label>
                                        <textarea
                                            className="w-full bg-black/40 border-2 border-midnight-700/50 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all h-40 resize-none leading-relaxed"
                                            value={content.vision.description}
                                            onChange={e => setContent({ ...content, vision: { ...content.vision, description: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recruitment Settings */}
                        <div className="lg:col-span-2 glass p-1 relative">
                            <div className="bg-black/40 p-10 rounded-[28px] border border-white/5 space-y-10">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3"><RefreshCw className="text-void-light" size={24} /> Estado del Reclutamiento</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {content.recruitment.map((item, idx) => (
                                        <div key={idx} className="bg-black/30 p-8 rounded-3xl border border-midnight-700/50 space-y-8 flex flex-col items-center group hover:border-void/50 transition-all">
                                            <div className={clsx(
                                                "p-6 rounded-2xl border transition-all scale-110",
                                                item.status === 'Alta' ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' :
                                                    item.status === 'Media' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)]' :
                                                        'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                                            )}>
                                                <Users size={32} />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-black">{item.role}</h3>
                                                <p className="text-[10px] text-midnight-500 uppercase font-black tracking-widest">Priority Status</p>
                                            </div>
                                            <select
                                                className="w-full bg-black border-2 border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-void-light text-white font-black text-center"
                                                value={item.status}
                                                onChange={e => {
                                                    const newRec = [...content.recruitment];
                                                    newRec[idx].status = e.target.value as any;
                                                    setContent({ ...content, recruitment: newRec });
                                                }}
                                            >
                                                <option value="Alta">ALTA</option>
                                                <option value="Media">MEDIA</option>
                                                <option value="Cerrado">CERRADO</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-up">
                    <div className="flex justify-between items-center">
                        <p className="text-midnight-400 font-bold uppercase tracking-widest text-sm">Gestionar entradas del blog oficial</p>
                        <button
                            onClick={() => setIsAddingNews(true)}
                            className="flex items-center gap-3 bg-white text-black font-black px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} /> NUEVA ENTRADA
                        </button>
                    </div>

                    {isAddingNews && (
                        <div className="glass p-10 relative border-2 border-void/30 space-y-8 animate-scale-in">
                            <h2 className="text-2xl font-black text-white">Publicar Nueva Noticia</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Título de la noticia</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-bold"
                                            value={newNews.title}
                                            onChange={e => setNewNews({ ...newNews, title: e.target.value })}
                                            placeholder="Ej: Nuevo Récord en Mythic+"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Autor</label>
                                        <input
                                            className="w-full bg-black/40 border-2 border-midnight-700 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all font-bold"
                                            value={newNews.author}
                                            onChange={e => setNewNews({ ...newNews, author: e.target.value })}
                                            placeholder="Tu Nombre"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">URL del Banner (Imagen)</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-midnight-500" size={20} />
                                            <input
                                                className="w-full bg-black/40 border-2 border-midnight-700 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-void outline-none transition-all"
                                                value={newNews.bannerUrl}
                                                onChange={e => setNewNews({ ...newNews, bannerUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 flex flex-col">
                                    <label className="text-[10px] text-midnight-500 uppercase font-black tracking-widest px-1">Contenido / Cuerpo</label>
                                    <textarea
                                        className="flex-1 w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:border-void outline-none transition-all resize-none leading-relaxed"
                                        value={newNews.content}
                                        onChange={e => setNewNews({ ...newNews, content: e.target.value })}
                                        placeholder="Escribe el contenido aquí..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    onClick={() => setIsAddingNews(false)}
                                    className="px-8 py-4 rounded-xl text-midnight-400 font-black uppercase text-xs hover:text-white transition-colors"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleAddNews}
                                    disabled={saving}
                                    className="bg-void text-white font-black px-12 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest"
                                >
                                    PUBLICAR AHORA
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map((item) => (
                            <div key={item.id} className="glass group relative flex flex-col overflow-hidden">
                                {item.bannerUrl ? (
                                    <div className="h-48 overflow-hidden">
                                        <img src={item.bannerUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-void/10 flex items-center justify-center">
                                        <FileText className="text-void-light/20" size={64} />
                                    </div>
                                )}
                                <div className="p-8 space-y-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-black text-white leading-tight">{item.title}</h3>
                                        <button
                                            onClick={() => handleDeleteNews(item.id!)}
                                            className="p-2 text-midnight-600 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-midnight-400 text-sm line-clamp-3">{item.content}</p>
                                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-midnight-800/50">
                                        <span className="text-[10px] font-black uppercase text-void-light tracking-widest">{item.author}</span>
                                        <span className="text-[9px] text-midnight-600 font-bold uppercase tracking-widest">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
