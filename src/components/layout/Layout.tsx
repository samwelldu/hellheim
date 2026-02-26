import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div
            className="min-h-screen bg-midnight-950 text-white font-sans selection:bg-void selection:text-white relative"
            style={{
                backgroundImage: 'url(/BG_HELL_BODY.png.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Overlay para legibilidad */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            <div className="relative z-10">
                <Sidebar />
                <main className="md:ml-64 p-4 md:p-8 min-h-screen transition-all duration-300">
                    <div className="max-w-7xl mx-auto mt-12 md:mt-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
