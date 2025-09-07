import React from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

export interface QuizData {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface QuizProps {
    quiz: QuizData;
    questionIndex: number;
    onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
    selectedAnswer?: number;
    isAnswered: boolean;
}

const Quiz: React.FC<QuizProps> = ({ quiz, questionIndex, onAnswerSelect, selectedAnswer, isAnswered }) => {
    
    const getButtonClass = (index: number) => {
        if (!isAnswered) {
            return 'bg-slate-700 hover:bg-slate-600';
        }
        if (index === quiz.correctAnswerIndex) {
            return 'bg-green-500/80 ring-2 ring-green-400';
        }
        if (index === selectedAnswer && index !== quiz.correctAnswerIndex) {
            return 'bg-red-500/80 ring-2 ring-red-400';
        }
        return 'bg-slate-700 opacity-60';
    };

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
            <p className="font-semibold text-slate-200">{questionIndex + 1}. {quiz.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quiz.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswerSelect(questionIndex, index)}
                        disabled={isAnswered}
                        className={`p-3 rounded-lg text-left transition-all duration-200 w-full disabled:cursor-not-allowed flex items-center justify-between ${getButtonClass(index)}`}
                    >
                       <span className="flex-grow">{option}</span>
                       {isAnswered && index === quiz.correctAnswerIndex && <CheckIcon className="w-5 h-5 text-white ml-2" />}
                       {isAnswered && index === selectedAnswer && index !== quiz.correctAnswerIndex && <XIcon className="w-5 h-5 text-white ml-2" />}
                    </button>
                ))}
            </div>
            {isAnswered && (
                <div className="mt-4 p-3 bg-slate-800 rounded-md border border-slate-600 animate-fade-in">
                    <h4 className="font-bold text-teal-400 mb-1">Explanation</h4>
                    <p className="text-slate-300 text-sm">{quiz.explanation}</p>
                </div>
            )}
        </div>
    );
};

export default Quiz;