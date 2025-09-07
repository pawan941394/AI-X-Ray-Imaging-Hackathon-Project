
import React, { useState, useRef, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import Quiz from './Quiz';
import { QuizData } from '../services/geminiService';
import Chat from './Chat';
import type { ChatMessage } from '../App';
import { XIcon } from './icons/XIcon';
import { ExploreIcon } from './icons/ExploreIcon';


// Let TypeScript know that jspdf is available on the window object
declare global {
    interface Window {
        jspdf: any;
    }
}

interface ImageDisplayProps {
    imageUrl: string;
    clinicalPrompt: string;
    explanation: string;
    isLoading: boolean;
    loadingStep: string;
    error: string | null;
    quizzes: QuizData[] | null;
    selectedAnswers: Record<number, number>;
    answeredQuestions: Record<number, boolean>;
    onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
    // Props for chat functionality
    chatHistory: ChatMessage[];
    isChatLoading: boolean;
    onSendChatMessage: (message: string) => void;
    isChatAvailable: boolean;
    // Props for pointer functionality
    pointerCoords: { x: number; y: number } | null;
    onSetPointer: (coords: { x: number; y: number }) => void;
    onClearPointer: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
    imageUrl, 
    clinicalPrompt, 
    explanation, 
    isLoading, 
    loadingStep, 
    error,
    quizzes,
    selectedAnswers,
    answeredQuestions,
    onAnswerSelect,
    chatHistory,
    isChatLoading,
    onSendChatMessage,
    isChatAvailable,
    pointerCoords,
    onSetPointer,
    onClearPointer
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const startPanPoint = useRef({ x: 0, y: 0 });
    const [isPointerMode, setIsPointerMode] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);


    const handleCopy = () => {
        navigator.clipboard.writeText(explanation).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleDownloadImage = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'medx-tutor-xray.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleDownloadPdf = () => {
        if (!imageUrl || !explanation) return;
    
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
    
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const availableWidth = pageWidth - 2 * margin;
    
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('MedX Tutor: X-Ray Analysis', pageWidth / 2, 20, { align: 'center' });
    
            const aspectRatio = img.width / img.height;
            let imgHeight = availableWidth / aspectRatio;
            let imgWidth = availableWidth;

            if (imgHeight > pageHeight * 0.4) {
                imgHeight = pageHeight * 0.4;
                imgWidth = imgHeight * aspectRatio;
            }
            
            const imgX = (pageWidth - imgWidth) / 2;
            doc.addImage(imageUrl, 'PNG', imgX, 30, imgWidth, imgHeight);
    
            let yPos = 30 + imgHeight + 15;
    
            const addTextWithWrap = (text: string, size: number, style: 'normal' | 'bold') => {
                 if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.setFontSize(size);
                doc.setFont('helvetica', style);
                const splitText = doc.splitTextToSize(text, availableWidth);
                doc.text(splitText, margin, yPos);
                yPos += (splitText.length * (size * 0.4));
            };

            addTextWithWrap('Medical Explanation', 14, 'bold');
            yPos += 5;
    
            explanation.split('\n').forEach(line => {
                if (line.trim() === '---') {
                    if (yPos > pageHeight - margin - 5) { doc.addPage(); yPos = margin; }
                    doc.setDrawColor(200);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 5;
                } else if (line.startsWith('### ')) {
                    addTextWithWrap(line.substring(4), 11, 'bold');
                    yPos += 2;
                } else if (line.trim()) {
                    addTextWithWrap(line.replace(/\*\*/g, ''), 10, 'normal');
                } else {
                    yPos += 3;
                }
            });
    
            doc.save('medx-tutor-report.pdf');
        };
        img.onerror = () => {
            console.error("Failed to load image for PDF generation.");
        }
    };

    const renderExplanation = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.trim() === '---') {
                return <hr key={index} className="my-4 border-slate-600" />;
            }
            if (line.startsWith('### ')) {
                return (
                    <h4 key={index} className="text-md font-bold text-teal-400 mt-4 mb-1">
                        {line.substring(4)}
                    </h4>
                );
            }
            const parts = line.split('**');
            const renderedLine = parts.map((part, partIndex) => {
                if (partIndex % 2 === 1) {
                    return <strong key={partIndex} className="font-semibold text-slate-100">{part}</strong>;
                }
                return part;
            });
            if (line.trim() === '') return null;
            return <p key={index} className="text-slate-300">{renderedLine}</p>;
        });
    };

    // Zoom and Pan Handlers
    const resetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.5, Math.min(zoom * zoomFactor, 5));
        setZoom(newZoom);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPanning(true);
        startPanPoint.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        setPan({
            x: e.clientX - startPanPoint.current.x,
            y: e.clientY - startPanPoint.current.y,
        });
    };

    const handleMouseUp = () => setIsPanning(false);

    // Pointer Handlers
    const handleTogglePointerMode = () => {
        const nextState = !isPointerMode;
        setIsPointerMode(nextState);
        if (!nextState) { // If turning off, clear any existing pointer
            onClearPointer();
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPointerMode || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const clampedX = Math.max(0, Math.min(1, x));
        const clampedY = Math.max(0, Math.min(1, y));

        onSetPointer({ x: clampedX, y: clampedY });
        setIsPointerMode(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsZoomModalOpen(false);
                setIsPointerMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const ZoomModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsZoomModalOpen(false)}>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                 <div className="flex items-center bg-slate-800/80 border border-slate-600 rounded-lg p-1">
                    <button onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoom * 1.2, 5)); }} className="p-2 text-white hover:bg-slate-700 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setZoom(Math.max(zoom / 1.2, 0.5)); }} className="p-2 text-white hover:bg-slate-700 rounded-md">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); resetZoom(); }} className="p-2 text-white hover:bg-slate-700 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 20l16-16" /></svg>
                    </button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setIsZoomModalOpen(false); }} className="p-2 text-white bg-slate-800/80 border border-slate-600 rounded-lg hover:bg-slate-700">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div
                className="w-full h-full"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Zoomed X-Ray"
                    className="object-contain"
                    style={{
                        width: '100%',
                        height: '100%',
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        cursor: isPanning ? 'grabbing' : 'grab',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    }}
                />
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <LoadingSpinner />
                <p className="mt-4 text-teal-400 font-semibold">{loadingStep}</p>
                <p className="text-slate-400 text-sm mt-2 text-center">This may take a moment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 font-bold mt-4">Error</p>
                <p className="text-slate-300 mt-2 text-center text-sm">{error}</p>
            </div>
        );
    }

    if (imageUrl && clinicalPrompt) {
        return (
            <>
                {isZoomModalOpen && <ZoomModal />}
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-teal-400">Generated X-Ray Image</h3>
                             <button
                                onClick={handleTogglePointerMode}
                                className={`flex items-center gap-2 text-sm font-semibold py-1 px-3 rounded-md transition-colors ${
                                    isPointerMode
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                }`}
                            >
                                <ExploreIcon className="w-4 h-4" />
                                {isPointerMode ? 'Cancel' : 'Explore Image'}
                            </button>
                        </div>
                        <div
                            ref={imageContainerRef}
                            onClick={handleImageClick}
                            className={`bg-black rounded-lg overflow-hidden border-2 border-slate-700 relative group ${isPointerMode ? 'cursor-crosshair' : 'cursor-default'}`}
                        >
                            <img src={imageUrl} alt="Generated X-Ray" className="w-full h-auto object-contain" />
                             {pointerCoords && !isPointerMode && ( // Only show pointer when not in pointer mode
                                <div
                                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/70 ring-2 ring-white shadow-lg pointer-events-none"
                                    style={{
                                        left: `${pointerCoords.x * 100}%`,
                                        top: `${pointerCoords.y * 100}%`,
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClearPointer();
                                        }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center pointer-events-auto hover:bg-red-500 transition-colors"
                                        aria-label="Clear pointer"
                                    >
                                    <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                           {!isPointerMode && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => {
                                        resetZoom();
                                        setIsZoomModalOpen(true);
                                    }}>
                                    <div className="flex items-center gap-2 bg-slate-800/80 text-white py-2 px-4 rounded-lg">
                                        <ZoomIcon className="w-6 h-6" />
                                        <span className="font-semibold">Zoom</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-teal-400 mb-2">Clinical Image Prompt</h3>
                        <p className="bg-slate-900/50 p-4 rounded-lg text-sm text-slate-300 border border-slate-700 font-mono whitespace-pre-wrap">
                            {clinicalPrompt}
                        </p>
                    </div>
                    {explanation && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-teal-400">Medical Explanation</h3>
                                <button onClick={handleCopy} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-3 rounded-md transition-colors min-w-[80px] justify-center">
                                    <CopyIcon className="w-4 h-4" />
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg text-sm border border-slate-700 space-y-2">
                            {renderExplanation(explanation)}
                            </div>
                        </div>
                    )}
                    {quizzes && quizzes.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-bold text-teal-400 mb-3">Knowledge Check</h3>
                            <div className="space-y-4">
                                {quizzes.map((quizItem, index) => (
                                    <Quiz
                                        key={index}
                                        quiz={quizItem}
                                        questionIndex={index}
                                        selectedAnswer={selectedAnswers[index]}
                                        isAnswered={!!answeredQuestions[index]}
                                        onAnswerSelect={onAnswerSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {isChatAvailable && (
                        <div className="mt-6">
                             <h3 className="text-lg font-bold text-teal-400 mb-3">Chat with your X-Ray</h3>
                            <Chat
                                history={chatHistory}
                                isLoading={isChatLoading}
                                onSendMessage={onSendChatMessage}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                         <button
                            onClick={handleDownloadImage}
                            className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download Image (.png)
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download Report (.pdf)
                        </button>
                    </div>
                </div>
            </>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-slate-500">Your generated X-ray will appear here</p>
        </div>
    );
};

export default ImageDisplay;
