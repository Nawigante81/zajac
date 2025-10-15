
import React from 'react';

interface ChoiceBoxProps {
  choices: string[];
  onChoice: (choice: string) => void;
  disabled: boolean;
}

export const ChoiceBox: React.FC<ChoiceBoxProps> = ({ choices, onChoice, disabled }) => {
  if (choices.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-4 flex flex-col sm:flex-row justify-center gap-4">
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onChoice(choice)}
          disabled={disabled}
          className="w-full sm:w-auto sm:flex-grow sm:max-w-xs px-6 py-3 bg-gray-800 text-green-400 border-2 border-green-700 rounded-md font-bold hover:bg-green-900 hover:text-white transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg text-center"
        >
          {choice}
        </button>
      ))}
    </div>
  );
};
