import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogActionsProps {
  log: LogEntry[];
  hasSavedSession: boolean;
  onClearSaved: () => void;
}

const formatLog = (entries: LogEntry[]): string => {
  if (entries.length === 0) {
    return 'Brak zapisanej historii walki z losem.';
  }

  return entries
    .map((entry) =>
      `${entry.type === 'story' ? 'Mistrz Gry' : 'Gracz'}: ${entry.text}`
    )
    .join('\n');
};

export const LogActions: React.FC<LogActionsProps> = ({
  log,
  hasSavedSession,
  onClearSaved,
}) => {
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleCopy = async () => {
    const formatted = formatLog(log);

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Brak dostępu do schowka w tej przeglądarce.');
      }

      await navigator.clipboard.writeText(formatted);
      setStatusMessage('Skopiowano do schowka. Możesz się tym dzielić albo palić dowody.');
    } catch (copyError) {
      console.error('Clipboard error:', copyError);
      setStatusMessage('Nie udało się skopiować. Spróbuj z innej karty albo wklep ręcznie.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([formatLog(log)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'zajac-kurewiusz-log.txt';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Ściągnąłem ci raport. Nie zgub tego gówna.');
  };

  return (
    <section className="w-full bg-gray-900/40 border border-gray-700 rounded-lg p-4 shadow-inner transition-all duration-300 hover:border-gray-600">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">Zapisz tę katastrofę</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 px-4 py-2 bg-green-700 text-white font-semibold rounded-md transition-all duration-300 hover:bg-green-600 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/20"
        >
          Skopiuj log do schowka
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-2 bg-blue-700 text-white font-semibold rounded-md transition-all duration-300 hover:bg-blue-600 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
        >
          Pobierz jako plik .txt
        </button>
        {hasSavedSession && (
          <button
            onClick={onClearSaved}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-md transition-all duration-300 hover:bg-gray-600 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-500/20"
          >
            Wyczyść zapis z pamięci
          </button>
        )}
      </div>
      {statusMessage && (
        <p className="mt-3 text-sm text-gray-400 animate-[fadeIn_0.3s_ease-out_forwards]">
          {statusMessage}
        </p>
      )}
    </section>
  );
};
