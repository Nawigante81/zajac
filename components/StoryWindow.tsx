
import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../types';

interface StoryWindowProps {
  log: LogEntry[];
}

export const StoryWindow: React.FC<StoryWindowProps> = ({ log }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);
  const [typewriterEntries, setTypewriterEntries] = useState<Set<number>>(new Set());

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    // Dodaj efekt maszyny do pisania dla nowych wpisów historii
    const newStoryEntries = log.filter(entry => 
      entry.type === 'story' && !typewriterEntries.has(entry.id)
    );
    
    if (newStoryEntries.length > 0) {
      const latestEntry = newStoryEntries[newStoryEntries.length - 1];
      setTypewriterEntries(prev => new Set(prev).add(latestEntry.id));
      
      // Usuń efekt maszyny do pisania po zakończeniu animacji
      setTimeout(() => {
        setTypewriterEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(latestEntry.id);
          return newSet;
        });
      }, Math.min(latestEntry.text.length * 50 + 1000, 4000)); // Maksymalnie 4 sekundy
    }
  }, [log, typewriterEntries]);

  return (
    <div className="w-full h-96 bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 overflow-y-auto font-mono text-lg leading-relaxed shadow-inner transition-all duration-300 hover:border-gray-600">
      {log.map((entry, index) => {
        const isTypewriter = typewriterEntries.has(entry.id);
        const animationDelay = index * 0.1; // Kolejne wpisy pojawiają się z opóźnieniem
        
        return (
          <div 
            key={entry.id} 
            className={`mb-4 opacity-0 ${isTypewriter ? 'story-text typewriter-effect' : 'story-text'}`}
            style={{ 
              animationDelay: `${animationDelay}s`,
              animationFillMode: 'forwards'
            }}
          >
            {entry.type === 'story' ? (
              <p className="text-gray-200">
                <span className="text-red-500 font-bold mr-2 animate-pulse">&gt;</span>
                <span className={isTypewriter ? 'typewriter' : ''}>
                  {entry.text}
                </span>
              </p>
            ) : (
              <p className="text-green-400 italic text-right transform transition-all duration-300 hover:scale-105">
                <span className="inline-block animate-[slideInRight_0.5s_ease-out_forwards]">
                  {entry.text}
                </span>
                <span className="text-green-600 font-bold ml-2 animate-pulse">&lt;</span>
              </p>
            )}
          </div>
        );
      })}
      <div ref={endOfLogRef} />
    </div>
  );
};
