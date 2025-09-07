
import React from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface UploadInputProps {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    isLoading: boolean;
    fileName?: string;
}

const UploadInput: React.FC<UploadInputProps> = ({
    onFileChange,
    onSubmit,
    isLoading,
    fileName,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center hover:border-teal-500 transition-colors"
                >
                    <UploadIcon className="w-10 h-10 text-slate-500 mb-2" />
                    <span className="font-semibold text-teal-400">Click to upload a file</span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                    <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={onFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        disabled={isLoading}
                    />
                </label>
                {fileName && (
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        Selected file: <span className="font-medium text-slate-300">{fileName}</span>
                    </p>
                )}
            </div>

            <button
                onClick={onSubmit}
                disabled={isLoading || !fileName}
                className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors w-full flex items-center justify-center gap-2 mt-4"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    'Analyze X-Ray'
                )}
            </button>
        </div>
    );
};

export default UploadInput;
