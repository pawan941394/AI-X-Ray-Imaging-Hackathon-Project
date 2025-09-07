import React from 'react';

interface PatientInfoInputProps {
    age: number;
    setAge: (age: number) => void;
    gender: string;
    setGender: (gender: string) => void;
    isLoading: boolean;
}

const PatientInfoInput: React.FC<PatientInfoInputProps> = ({ age, setAge, gender, setGender, isLoading }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="age-input" className="block text-sm font-medium text-slate-300 mb-1">
                    Patient Age
                </label>
                <input
                    type="number"
                    id="age-input"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                    min="0"
                    max="120"
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 w-full focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow text-slate-200 disabled:opacity-50"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="gender-select" className="block text-sm font-medium text-slate-300 mb-1">
                    Patient Gender
                </label>
                <select
                    id="gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 w-full focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow text-slate-200 disabled:opacity-50"
                    disabled={isLoading}
                >
                    <option>Unspecified</option>
                    <option>Male</option>
                    <option>Female</option>
                </select>
            </div>
        </div>
    );
};

export default PatientInfoInput;