import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center p-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-500 tracking-wider font-mono shadow-lg text-glow animate-bounce">
        Zając Kurewiusz
      </h1>
      <p className="text-gray-400 mt-2 text-sm sm:text-base opacity-0 animate-[fadeIn_1s_ease-in_0.5s_forwards]">
        Jego los jest tak samo spierdolony jak ty
      </p>
    </header>
  );
};