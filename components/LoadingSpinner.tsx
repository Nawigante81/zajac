import React from 'react';

const LoadingMessages = [
    "Mieszam w tym szambie...",
    "Chwila, muszę wytrzeźwieć...",
    "Myślę, jak cię jeszcze bardziej upokorzyć...",
    "Przetwarzam twoją żałosną decyzję...",
    "Nawet ja muszę czasem pomyśleć, kurwa mać.",
    "Ładuję porcję beznadziei..."
];

export const LoadingSpinner: React.FC = () => {
    const [message, setMessage] = React.useState(LoadingMessages[0]);
    const [messageKey, setMessageKey] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(LoadingMessages[Math.floor(Math.random() * LoadingMessages.length)]);
            setMessageKey(prev => prev + 1); // Wymusza ponowną animację
        }, 2000);
        return () => clearInterval(interval);
    }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-[fadeIn_0.5s_ease-out_forwards]">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-red-500 hover:text-red-400 transition-colors duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p 
        key={messageKey} 
        className="mt-4 text-gray-300 font-mono text-lg opacity-0 animate-[slideInLeft_0.5s_ease-out_0.2s_forwards] hover:text-white transition-colors duration-300"
      >
        {message}
      </p>
      <div className="mt-2 flex space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};