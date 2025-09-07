import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const Header: React.FC = () => {
    return (
        <header className="bg-slate-900/70 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <LogoIcon className="h-8 w-8 text-teal-400" />
                    <h1 className="text-xl font-bold text-white tracking-wider">
                        MedX Tutor
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default Header;