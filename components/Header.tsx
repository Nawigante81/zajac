import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center p-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-red-500 tracking-wider font-mono shadow-lg">
        Jasiek 'Kurewiusz' Zając
      </h1>
      <p className="text-gray-400 mt-2">Jego los jest tak samo spierdolony jak ty</p>
    </header>
  );
};