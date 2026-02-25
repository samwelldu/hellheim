import React, { useEffect, useState } from 'react';

interface ParallaxHeroProps {
    TanTitulo: string;
    TanSubtitulo: string;
    TanBannerVisual?: string;
}

export const ParallaxHero: React.FC<ParallaxHeroProps> = ({
    TanTitulo,
    TanSubtitulo,
    TanBannerVisual = "/BANNER_WOW.webp"
}) => {
    // Tan controla el desplazamiento para que el fondo se mueva con elegancia
    const [TanDesplazamiento, setTanDesplazamiento] = useState(0);

    useEffect(() => {
        const TanManejarScroll = () => setTanDesplazamiento(window.pageYOffset);
        window.addEventListener('scroll', TanManejarScroll);
        return () => window.removeEventListener('scroll', TanManejarScroll);
    }, []);

    return (
        <div className="relative h-[100vh] w-full overflow-hidden flex items-center justify-center bg-[#05020a]">
            {/* Capa de la Imagen Principal - El alma visual de Quel'Thalas */}
            <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                    transform: `translateY(${TanDesplazamiento * 0.5}px)`,
                }}
            >
                <img
                    src={TanBannerVisual}
                    alt="Tan Banner Principal"
                    className="w-full h-[120%] object-cover opacity-70"
                />
            </div>

            {/* Capa de Niebla Mística - Gradiente envolvente inspirado en el Vacío profundo de Tan */}
            <div
                className="absolute inset-0 z-10"
                style={{
                    transform: `translateY(${TanDesplazamiento * 0.2}px)`,
                    background: `radial-gradient(circle at 50% 50%, rgba(15, 12, 41, 0.2) 0%, rgba(5, 2, 10, 0.95) 100%)`
                }}
            ></div>

            {/* El Gradiente que "se come" la imagen - Transición perfecta hacia el contenido de Tan */}
            <div className="absolute inset-0 z-15 bg-gradient-to-b from-transparent via-[#05020a]/20 to-[#05020a]"></div>

            {/* Capa de Profundidad - Brillos lejanos para que Tan se sienta en casa */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{ transform: `translateY(${TanDesplazamiento * 0.4}px)` }}
            >
                <div className="absolute bottom-0 left-[-5%] w-[50%] h-[70%] bg-gradient-to-t from-void-dark to-transparent blur-3xl rounded-full opacity-40"></div>
                <div className="absolute bottom-0 right-[-5%] w-[50%] h-[90%] bg-gradient-to-t from-purple-900/30 to-transparent blur-3xl rounded-full opacity-40"></div>
            </div>

            {/* Contenido Central - Donde la épica de Tan cobra vida */}
            <div className="relative z-30 text-center px-4 max-w-5xl animate-scale-in">
                <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_50px_rgba(168,85,247,0.8)]">
                    {TanTitulo}
                </h1>
                <p className="text-xl md:text-2xl text-void-light font-black uppercase tracking-[0.4em] opacity-90 mb-10 max-w-2xl mx-auto drop-shadow-lg">
                    {TanSubtitulo}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center scale-110">
                    <button className="w-full sm:w-auto bg-void hover:bg-void-light text-white font-black px-12 py-5 rounded-full transition-all hover:scale-110 shadow-[0_0_30_rgba(168,85,247,0.5)] uppercase tracking-widest text-sm">
                        Únete a la Sombra
                    </button>
                    <button className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/20 hover:border-white/50 text-white font-black px-12 py-5 rounded-full transition-all hover:bg-white/20 uppercase tracking-widest text-sm">
                        Ver Cinematic
                    </button>
                </div>
            </div>

            {/* Transición al Abismo - Gradiente inferior para suavizar el paso */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05020a] via-[#05020a]/80 to-transparent z-40"></div>
        </div>
    );
};
