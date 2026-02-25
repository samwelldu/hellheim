import React from 'react';
import { Construction } from 'lucide-react';

interface ModulePlaceholderProps {
    title: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-pulse">
            <div className="p-6 bg-midnight-800 rounded-full border border-dashed border-midnight-600">
                <Construction size={48} className="text-void" />
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-midnight-400 max-w-md">
                Este módulo está en construcción. Pronto podrás ver los datos desde Firebase aquí.
            </p>
        </div>
    );
};
