
import React, { useState, useEffect } from 'react';

interface ChoiceBoxProps {
  choices: string[];
  onChoice: (choice: string) => void;
  disabled: boolean;
}

export const ChoiceBox: React.FC<ChoiceBoxProps> = ({ choices, onChoice, disabled }) => {
  const [visibleChoices, setVisibleChoices] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (choices.length > 0) {
      setVisibleChoices(0);
      // Animacja pojawiania się wyborów jeden po drugim
      const timer = setInterval(() => {
        setVisibleChoices(prev => {
          if (prev < choices.length) {
            return prev + 1;
          } else {
            clearInterval(timer);
            return prev;
          }
        });
      }, 200); // 200ms opóźnienie między kolejnymi wyborami

      return () => clearInterval(timer);
    }
  }, [choices.length]);

  if (choices.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-4 flex flex-col sm:flex-row justify-center gap-4">
      {choices.map((choice, index) => {
        const isVisible = index < visibleChoices;
        const isHovered = hoveredIndex === index;
        
        return (
          <button
            key={index}
            onClick={() => onChoice(choice)}
            disabled={disabled || !isVisible}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              w-full sm:w-auto sm:flex-grow sm:max-w-xs px-6 py-3 
              bg-gray-800 text-green-400 border-2 border-green-700 rounded-md 
              font-bold transition-all duration-500 shadow-lg text-center
              ${isVisible 
                ? 'choice-appear opacity-100' 
                : 'opacity-0 translate-x-10'
              }
              ${isHovered 
                ? 'bg-green-900 text-white shadow-2xl shadow-green-500/20 animate-pulse transform scale-110' 
                : 'hover:bg-green-900 hover:text-white'
              }
              ${disabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'transform hover:scale-105 active:scale-95'
              }
              ${!disabled && isVisible 
                ? 'animate-[pulse_2s_ease-in-out_infinite]' 
                : ''
              }
            `}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationFillMode: 'both'
            }}
          >
            <span className={`inline-block transition-transform duration-300 ${
              isHovered ? 'animate-[shake_0.5s_ease-in-out]' : ''
            }`}>
              {choice}
            </span>
          </button>
        );
      })}
    </div>
  );
};
