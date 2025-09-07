import React from 'react';

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onSubmit, isLoading }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                 <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-300 mb-1">
                    Condition Description
                </label>
                <textarea
                    id="prompt-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., 'Show me an X-ray of a fractured left hand'"
                    rows={4}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow text-slate-200 placeholder-slate-500 disabled:opacity-50"
                    disabled={isLoading}
                />
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors w-full flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    'Generate X-Ray'
                )}
            </button>
             <p className="text-xs text-slate-500 text-center">
                Pro tip: Press Ctrl+Enter (or Cmd+Enter) to submit.
            </p>
        </div>
    );
};

export default PromptInput;