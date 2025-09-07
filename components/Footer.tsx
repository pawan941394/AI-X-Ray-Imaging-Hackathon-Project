
import React from 'react';
import { WarningIcon } from './icons/WarningIcon';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-700 mt-12 py-6">
            <div className="container mx-auto px-4 md:px-8 text-center text-slate-400 text-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-yellow-400 bg-yellow-900/20 border border-yellow-700/50 rounded-full px-4 py-2">
                        <WarningIcon className="w-5 h-5 flex-shrink-0" />
                        <p className="font-semibold text-xs">For educational purposes only. Not for real medical diagnosis.</p>
                    </div>
                    <div className="text-xs">
                        <p>
                            Developed by{' '}
                            <a
                                href="https://www.linkedin.com/in/pawan941394/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                            >
                                Pawan Kumar
                            </a>
                            {' | '}
                            <a
                                href="https://www.youtube.com/@Pawankumar-py4tk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                            >
                                YouTube
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
