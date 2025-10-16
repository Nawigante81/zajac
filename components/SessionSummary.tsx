import React, { useMemo } from 'react';
import { LogEntry } from '../types';

interface SessionSummaryProps {
  log: LogEntry[];
  lastSavedAt: number | null;
  isPreview?: boolean;
}

const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) {
    return 'brak zapisu';
  }

  return new Date(timestamp).toLocaleString('pl-PL');
};

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  log,
  lastSavedAt,
  isPreview = false,
}) => {
  const { storyCount, choiceCount } = useMemo(() => {
    return log.reduce(
      (acc, entry) => {
        if (entry.type === 'story') {
          acc.storyCount += 1;
        } else {
          acc.choiceCount += 1;
        }
        return acc;
      },
      { storyCount: 0, choiceCount: 0 }
    );
  }, [log]);

  const totalEntries = storyCount + choiceCount;

  if (totalEntries === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gray-900/60 border border-gray-700 rounded-lg p-4 shadow-inner">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-red-400">
          {isPreview ? 'Ostatnia zapisana jatka' : 'Statystyki aktualnej jatki'}
        </h2>
        <span className="text-xs uppercase tracking-widest text-gray-400">
          Zapis z: {formatTimestamp(lastSavedAt)}
        </span>
      </header>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-300">
        <div className="bg-gray-800/60 rounded-md p-3 border border-gray-700">
          <dt className="font-semibold text-gray-200">Fragmenty historii</dt>
          <dd className="text-2xl font-bold text-red-300">{storyCount}</dd>
        </div>
        <div className="bg-gray-800/60 rounded-md p-3 border border-gray-700">
          <dt className="font-semibold text-gray-200">Twoje wybory</dt>
          <dd className="text-2xl font-bold text-green-300">{choiceCount}</dd>
        </div>
        <div className="bg-gray-800/60 rounded-md p-3 border border-gray-700">
          <dt className="font-semibold text-gray-200">Łącznie gówna w logu</dt>
          <dd className="text-2xl font-bold text-yellow-300">{totalEntries}</dd>
        </div>
      </dl>
      {isPreview && (
        <p className="mt-3 text-xs text-gray-400 italic">
          To tylko podgląd ostatniej sesji. Kliknij "Kontynuuj", żeby wrócić do chaosu.
        </p>
      )}
    </section>
  );
};
