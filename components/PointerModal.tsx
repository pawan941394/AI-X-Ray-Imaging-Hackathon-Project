
import React, { useState, useEffect, useRef } from 'react';
import { drawImageWithPointer } from '../services/imageUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { XIcon } from './icons/XIcon';
import { LogoIcon } from './icons/LogoIcon';
import { generatePointerExplanationAndDiagram } from '../services/geminiService';
import { UserIcon } from './icons/UserIcon';


interface PointerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFollowUpSubmit: (question: string) => void;
    isFollowUpLoading: boolean;
    followUpResponse: string;
    baseImageUrl: string;
    pointerCoords: { x: number; y: number };
}

interface AnalysisResult {
    explanation: string;
    diagramImageUrl: string;
}

const PointerModal: React.FC<PointerModalProps> = ({
    isOpen,
    onClose,
    onFollowUpSubmit,
    isFollowUpLoading,
    followUpResponse,
    baseImageUrl,
    pointerCoords,
}) => {
    const [followUpQuestion, setFollowUpQuestion] = useState('');
    const [initialAnalysis, setInitialAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const performInitialAnalysis = async () => {
            if (isOpen && !initialAnalysis && !isAnalyzing) {
                setIsAnalyzing(true);
                setError(null);
                try {
                    const result = await generatePointerExplanationAndDiagram(baseImageUrl, pointerCoords);
                    setInitialAnalysis(result);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                    setError(`Failed to analyze the selected point. ${errorMessage}`);
                    console.error(err);
                } finally {
                    setIsAnalyzing(false);
                }
            }
        };

        performInitialAnalysis();

        // Reset state when modal is closed
        if (!isOpen) {
            setInitialAnalysis(null);
            setFollowUpQuestion('');
            setError(null);
        }

    }, [isOpen, baseImageUrl, pointerCoords, initialAnalysis, isAnalyzing]);

    useEffect(() => {
        // Scroll to the bottom of the response when it updates
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [followUpResponse, isFollowUpLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (followUpQuestion.trim() && !isFollowUpLoading) {
            onFollowUpSubmit(followUpQuestion);
            setFollowUpQuestion('');
        }
    };
    
    if (!isOpen) return null;

    const renderContent = () => {
        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <LoadingSpinner />
                    <p className="mt-4 font-semibold text-teal-400">Analyzing Point...</p>
                    <p className="text-sm text-slate-400 mt-1">Generating explanation and diagram.</p>
                </div>
            )
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-red-900/20 border border-red-500/50 rounded-lg p-4 m-4">
                    <p className="text-red-400 font-bold">Analysis Error</p>
                    <p className="text-slate-300 mt-2 text-center text-sm">{error}</p>
                </div>
            )
        }
        if (initialAnalysis) {
            return (
                 <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-base font-bold text-teal-400 mb-2">AI-Generated Diagram</h3>
                        <img src={initialAnalysis.diagramImageUrl} alt="AI Generated Diagram" className="rounded-md border border-slate-600 w-full" />
                    </div>
                     <div>
                        <h3 className="text-base font-bold text-teal-400 mb-2">Explanation</h3>
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                             <p className="text-sm text-slate-300 whitespace-pre-wrap">{initialAnalysis.explanation}</p>
                        </div>
                    </div>

                    {/* Follow-up conversation display */}
                    {followUpResponse && (
                         <div className="flex items-start gap-3 animate-fade-in mt-4 border-t border-slate-700 pt-4">
                           <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center mt-1">
                             <LogoIcon className="w-5 h-5 text-teal-400" />
                           </div>
                           <div className="max-w-md p-3 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                                <p className="text-sm whitespace-pre-wrap">{followUpResponse}</p>
                           </div>
                        </div>
                    )}
                    {isFollowUpLoading && (
                        <div className="flex items-start gap-3 mt-4">
                            <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
                               <LogoIcon className="w-5 h-5 text-teal-400" />
                            </div>
                            <div className="max-w-md p-3 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-teal-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                 </div>
            )
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-lg font-bold text-teal-400">Image Explorer</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto">
                   {renderContent()}
                </div>

                <footer className="p-4 border-t border-slate-700 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                         <input
                            type="text"
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            placeholder={initialAnalysis ? "Ask a follow-up question..." : "Waiting for analysis to complete..."}
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow text-slate-200 placeholder-slate-400"
                            disabled={isFollowUpLoading || !initialAnalysis}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isFollowUpLoading || !followUpQuestion.trim()}
                            className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default PointerModal;
