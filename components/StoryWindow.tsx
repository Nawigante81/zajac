
import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface StoryWindowProps {
  log: LogEntry[];
}

export const StoryWindow: React.FC<StoryWindowProps> = ({ log }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="w-full h-96 bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 overflow-y-auto font-mono text-lg leading-relaxed shadow-inner">
      {log.map((entry) => (
        <div key={entry.id} className="mb-4 animate-fadeIn">
          {entry.type === 'story' ? (
            <p className="text-gray-200">
              <span className="text-red-500 font-bold mr-2">&gt;</span>
              {entry.text}
            </p>
          ) : (
            <p className="text-green-400 italic text-right">
              {entry.text}
              <span className="text-green-600 font-bold ml-2">&lt;</span>
            </p>
          )}
        </div>
      ))}
      <div ref={endOfLogRef} />
    </div>
  );
};
