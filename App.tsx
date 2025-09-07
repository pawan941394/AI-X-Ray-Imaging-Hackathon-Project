
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageDisplay from './components/ImageDisplay';
import { generateClinicalPrompt, generateXRayImage, generateXRayExplanation, generateQuiz, QuizData, createChatSession, analyzeUploadedXRay } from './services/geminiService';
import { drawImageWithPointer } from './services/imageUtils';
import PatientInfoInput from './components/PatientInfoInput';
import PointerModal from './components/PointerModal';
import type { Chat, Part } from '@google/genai';
import UploadInput from './components/UploadInput';
import Footer from './components/Footer';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const App: React.FC = () => {
    const [userInput, setUserInput] = useState<string>('Patient ke left hand me fracture hai — mujhe uska X-ray dikhaiye.');
    const [age, setAge] = useState<number>(35);
    const [gender, setGender] = useState<string>('Male');
    const [clinicalPrompt, setClinicalPrompt] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [explanation, setExplanation] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [quizzes, setQuizzes] = useState<QuizData[] | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, boolean>>({});

    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

    const [pointerCoords, setPointerCoords] = useState<{ x: number, y: number } | null>(null);
    const [isPointerModalOpen, setIsPointerModalOpen] = useState<boolean>(false);
    const [isPointerQueryLoading, setIsPointerQueryLoading] = useState<boolean>(false);
    const [pointerResponse, setPointerResponse] = useState<string>('');
    
    // New state for upload/generate mode
    const [mode, setMode] = useState<'generate' | 'upload'>('generate');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);


    const handleClearPointer = useCallback(() => {
        setPointerCoords(null);
    }, []);

    // Resets only the analysis results, preserving the image and inputs.
    const resetAnalysisState = () => {
        setClinicalPrompt('');
        setExplanation('');
        setError(null);
        setQuizzes(null);
        setSelectedAnswers({});
        setAnsweredQuestions({});
        setChat(null);
        setChatHistory([]);
        handleClearPointer();
    };
    
    // Resets the entire application state, including inputs and images.
    const resetState = () => {
        resetAnalysisState();
        setImageUrl('');
        setUploadedFile(null);
    };

    const switchMode = (newMode: 'generate' | 'upload') => {
        if (mode === newMode) return;
        setMode(newMode);
        resetState();
    };


    const handleGenerate = useCallback(async () => {
        if (!userInput.trim()) {
            setError('Please enter a description to generate an X-ray.');
            return;
        }

        setIsLoading(true);
        setLoadingStep('Initializing...');
        resetState(); // Full reset is correct here

        try {
            setLoadingStep('Generating clinical prompt...');
            const prompt = await generateClinicalPrompt(userInput, age, gender);
            setClinicalPrompt(prompt);

            setLoadingStep('Generating X-ray image...');
            const url = await generateXRayImage(prompt);
            setImageUrl(url);

            setLoadingStep('Generating medical explanation...');
            const explanationText = await generateXRayExplanation(prompt);
            setExplanation(explanationText);

            setLoadingStep('Generating interactive quiz...');
            const quizzesData = await generateQuiz(prompt);
            setQuizzes(quizzesData);

            setLoadingStep('Initializing chat assistant...');
            const context = `Clinical Prompt: ${prompt}\n\nMedical Explanation: ${explanationText}`;
            const newChat = createChatSession(context);
            setChat(newChat);


        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate X-ray. ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }, [userInput, age, gender]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
             if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (e.g., PNG, JPG, WEBP).');
                return;
            }
            
            // Clear any previous analysis results before showing the new image
            resetAnalysisState();
            setUploadedFile(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                // Instantly show the uploaded image for preview
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeUpload = useCallback(async () => {
        if (!uploadedFile) {
            setError('Please upload an image for analysis.');
            return;
        }

        setIsLoading(true);
        setLoadingStep('Initializing...');
        // Clear previous analysis results, but keep the image
        const currentImageUrl = imageUrl;
        resetAnalysisState();
        setImageUrl(currentImageUrl);
        
        try {
            setLoadingStep('Analyzing image to generate description...');
            const generatedPrompt = await analyzeUploadedXRay(uploadedFile);
            setClinicalPrompt(generatedPrompt);

            setLoadingStep('Generating medical explanation...');
            const explanationText = await generateXRayExplanation(generatedPrompt);
            setExplanation(explanationText);

            setLoadingStep('Generating interactive quiz...');
            const quizzesData = await generateQuiz(generatedPrompt);
            setQuizzes(quizzesData);

            setLoadingStep('Initializing chat assistant...');
            const context = `Clinical Prompt: ${generatedPrompt}\n\nMedical Explanation: ${explanationText}`;
            const newChat = createChatSession(context);
            setChat(newChat);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to analyze X-ray. ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }, [uploadedFile, imageUrl]);


    const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
        setAnsweredQuestions(prev => ({ ...prev, [questionIndex]: true }));
    };

    const handleSendChatMessage = async (message: string) => {
        if (!chat || !message.trim()) return;

        setIsChatLoading(true);
        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(updatedHistory);

        try {
            const response = await chat.sendMessage({ message });
            
            const modelResponse = response.text;
            setChatHistory([...updatedHistory, { role: 'model', text: modelResponse }]);
        } catch (err) {
            console.error("Chat error:", err);
            const errorText = err instanceof Error ? err.message : "Sorry, I couldn't respond right now.";
            setChatHistory([...updatedHistory, { role: 'model', text: `Error: ${errorText}` }]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleSetPointer = useCallback((coords: { x: number; y: number }) => {
        setPointerCoords(coords);
        setIsPointerModalOpen(true);
        setPointerResponse(''); // Clear old response when setting a new pointer
    }, []);

    const handleClosePointerModal = useCallback(() => {
        setIsPointerModalOpen(false);
        handleClearPointer();
    }, [handleClearPointer]);

    const handlePointerQuerySubmit = async (question: string) => {
        if (!chat || !pointerCoords || !imageUrl || !question.trim()) return;

        setIsPointerQueryLoading(true);
        setPointerResponse('');

        const userMessageText = `(User pointed at image) ${question}`;
        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMessageText }];
        setChatHistory(updatedHistory);

        try {
            const imageWithPointer = await drawImageWithPointer(imageUrl, pointerCoords);
            const base64Data = imageWithPointer.split(',')[1];

            const imagePart: Part = {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data,
                },
            };
            const textPart: Part = { text: question };
            
            const response = await chat.sendMessage({ message: [imagePart, textPart] });
            
            const modelResponse = response.text;
            setPointerResponse(modelResponse);
            
            setChatHistory([...updatedHistory, { role: 'model', text: modelResponse }]);

        } catch (err) {
            console.error("Pointer query error:", err);
            const errorText = err instanceof Error ? err.message : "Sorry, I couldn't respond right now.";
            const formattedError = `Error: ${errorText}`;
            setPointerResponse(formattedError);
            setChatHistory([...updatedHistory, { role: 'model', text: formattedError }]);
        } finally {
            setIsPointerQueryLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 text-slate-200 min-h-screen font-sans flex flex-col">
            <Header />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col gap-6 p-6 bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm">
                        <h2 className="text-2xl font-bold text-teal-400">Request an X-Ray</h2>

                        <div className="flex bg-slate-900 p-1 rounded-lg">
                            <button
                                onClick={() => switchMode('generate')}
                                className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'generate' ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-slate-700/50 text-slate-300'}`}
                            >
                                Generate
                            </button>
                             <button
                                onClick={() => switchMode('upload')}
                                className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'upload' ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-slate-700/50 text-slate-300'}`}
                            >
                                Upload
                            </button>
                        </div>
                        
                        {mode === 'generate' ? (
                            <div className="flex flex-col gap-6 animate-fade-in">
                                <p className="text-slate-400 text-sm">
                                    Describe a medical condition, specify patient details, and MedX Tutor will generate a realistic, educational X-ray image for you.
                                </p>
                                <PatientInfoInput
                                    age={age}
                                    setAge={setAge}
                                    gender={gender}
                                    setGender={setGender}
                                    isLoading={isLoading}
                                />
                                <PromptInput
                                    value={userInput}
                                    onChange={setUserInput}
                                    onSubmit={handleGenerate}
                                    isLoading={isLoading}
                                />
                            </div>
                        ) : (
                             <div className="flex flex-col gap-6 animate-fade-in">
                                <p className="text-slate-400 text-sm">
                                    Upload your own X-ray image (e.g., from a study set), and the AI will analyze it to generate a clinical description, explanation, and quiz.
                                </p>
                                <UploadInput
                                    onFileChange={handleFileChange}
                                    onSubmit={handleAnalyzeUpload}
                                    isLoading={isLoading}
                                    fileName={uploadedFile?.name}
                                />
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-h-[500px] flex flex-col justify-center shadow-sm">
                         <ImageDisplay
                            imageUrl={imageUrl}
                            clinicalPrompt={clinicalPrompt}
                            explanation={explanation}
                            isLoading={isLoading}
                            loadingStep={loadingStep}
                            error={error}
                            quizzes={quizzes}
                            selectedAnswers={selectedAnswers}
                            answeredQuestions={answeredQuestions}
                            onAnswerSelect={handleAnswerSelect}
                            chatHistory={chatHistory}
                            isChatLoading={isChatLoading}
                            onSendChatMessage={handleSendChatMessage}
                            isChatAvailable={!!chat}
                            pointerCoords={pointerCoords}
                            onSetPointer={handleSetPointer}
                            onClearPointer={handleClearPointer}
                        />
                    </div>
                </div>
            </main>
             {isPointerModalOpen && pointerCoords && (
                 <PointerModal
                    isOpen={isPointerModalOpen}
                    onClose={handleClosePointerModal}
                    onFollowUpSubmit={handlePointerQuerySubmit}
                    isFollowUpLoading={isPointerQueryLoading}
                    followUpResponse={pointerResponse}
                    baseImageUrl={imageUrl}
                    pointerCoords={pointerCoords}
                />
            )}
            <Footer />
        </div>
    );
};

export default App;
