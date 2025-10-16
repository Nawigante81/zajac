import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { StoryWindow } from './components/StoryWindow';
import { ChoiceBox } from './components/ChoiceBox';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LogActions } from './components/LogActions';
import { SessionSummary } from './components/SessionSummary';
import { generateStorySegment } from './services/geminiService';
import { LogEntry, GameState, SavedSession } from './types';

const LOCAL_STORAGE_KEY = 'zajac:last-session';

type RawSavedSession = Partial<SavedSession> & {
  log?: unknown;
  choices?: unknown;
  savedAt?: unknown;
};

const isLogEntry = (entry: unknown): entry is LogEntry => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const candidate = entry as LogEntry;
  return (
    typeof candidate.id === 'number' &&
    (candidate.type === 'story' || candidate.type === 'choice') &&
    typeof candidate.text === 'string'
  );
};

const sanitizeSavedSession = (raw: unknown): SavedSession | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as RawSavedSession;

  if (!Array.isArray(candidate.log) || !Array.isArray(candidate.choices)) {
    return null;
  }

  const log = candidate.log
    .filter(isLogEntry)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      text: entry.text,
    } satisfies LogEntry));
  const choices = candidate.choices.filter(
    (choice): choice is string => typeof choice === 'string'
  );

  if (log.length === 0 && choices.length === 0) {
    return null;
  }

  const savedAt =
    typeof candidate.savedAt === 'number' && Number.isFinite(candidate.savedAt)
      ? candidate.savedAt
      : Date.now();

  return { log, choices, savedAt };
};

const formatSavedAt = (timestamp: number) =>
  new Date(timestamp).toLocaleString('pl-PL');

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const logRef = useRef<LogEntry[]>(log);

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      const sanitized = sanitizeSavedSession(parsed);

      if (sanitized) {
        setSavedSession(sanitized);
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (storageError) {
      console.warn('Nie udało się odczytać zapisu gry:', storageError);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const persistSession = useCallback((sessionLog: LogEntry[], sessionChoices: string[]) => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: SavedSession = {
      log: sessionLog,
      choices: sessionChoices,
      savedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (storageError) {
      console.warn('Nie udało się zapisać stanu gry w localStorage:', storageError);
    }

    setSavedSession(payload);
  }, []);

  const clearSavedSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setSavedSession(null);
  }, []);

  const startGame = useCallback(async () => {
    setLog([]);
    setChoices([]);
    setError(null);
    setGameState(GameState.Loading);
    logRef.current = [];
    try {
      const initialSegment = await generateStorySegment([]);
      const initialLog: LogEntry[] = [
        { id: Date.now(), type: 'story', text: initialSegment.story },
      ];
      setLog(initialLog);
      logRef.current = initialLog;
      setChoices(initialSegment.choices);
      setGameState(GameState.Playing);
      persistSession(initialLog, initialSegment.choices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany, chujowy błąd.");
      setGameState(GameState.Error);
    }
  }, [persistSession]);

  const resumeGame = useCallback(() => {
    if (!savedSession) {
      return;
    }

    setLog(savedSession.log);
    logRef.current = savedSession.log;
    setChoices(savedSession.choices);
    setError(null);
    setGameState(savedSession.choices.length > 0 ? GameState.Playing : GameState.Start);
  }, [savedSession]);

  const handleChoice = useCallback(async (choice: string) => {
    const choiceEntry: LogEntry = { id: Date.now(), type: 'choice', text: choice };
    const updatedLog = [...logRef.current, choiceEntry];

    setLog(updatedLog);
    logRef.current = updatedLog;
    setChoices([]);
    setGameState(GameState.Loading);

    // Reset if the only choice is to restart
    if (choice === "Od nowa") {
      await startGame();
      return;
    }

    try {
      const nextSegment = await generateStorySegment(updatedLog);
      const storyEntry: LogEntry = {
        id: Date.now() + 1,
        type: 'story',
        text: nextSegment.story,
      };

      const nextLog = [...updatedLog, storyEntry];
      setLog(nextLog);
      logRef.current = nextLog;
      setChoices(nextSegment.choices);
      setGameState(GameState.Playing);
      persistSession(nextLog, nextSegment.choices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany, chujowy błąd.");
      setGameState(GameState.Error);
    }
  }, [persistSession, startGame]);

  const summaryLog = useMemo(() => {
    if (log.length > 0) {
      return log;
    }
    return savedSession?.log ?? [];
  }, [log, savedSession]);

  const isSummaryPreview = log.length === 0 && !!savedSession;

  const renderContent = () => {
    switch (gameState) {
      case GameState.Start:
        return (
          <div className="text-center p-8 animate-[fadeIn_1s_ease-out_forwards]">
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 px-4 opacity-0 animate-[slideInLeft_1s_ease-out_0.5s_forwards]">
              Masz na imię Jasiek, ale wszyscy mówią na ciebie Zając. Albo Kurewiusz. Twój los jest spierdolony bardziej niż poranek po libacji. Czas podjąć kilka chujowych decyzji i zobaczyć, jak bardzo można zjebać sobie życie.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={startGame}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-red-500/50 opacity-0 animate-[bounce_1s_ease-out_1s_forwards] hover:animate-pulse"
              >
                <span className="inline-block transition-transform duration-200 hover:animate-[shake_0.5s_ease-in-out]">
                  Dobra, kurwa, zaczynajmy ten burdel
                </span>
              </button>
              {savedSession && (
                <button
                  onClick={resumeGame}
                  className="px-5 py-2 bg-gray-800 text-green-300 border border-green-500 rounded-md font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 hover:bg-gray-700 hover:text-white opacity-0 animate-[fadeIn_1s_ease-out_1.4s_forwards]"
                >
                  <span className="inline-block">
                    Kontynuuj ostatnią rozwałkę (zapis z {formatSavedAt(savedSession.savedAt)})
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      case GameState.Playing:
        return (
          <div className="animate-[fadeIn_0.8s_ease-out_forwards]">
            <StoryWindow log={log} />
            <ChoiceBox choices={choices} onChoice={handleChoice} disabled={choices.length === 0} />
            <div className="w-full mt-6 text-center opacity-0 animate-[fadeIn_1s_ease-out_1s_forwards]">
              <button
                onClick={() => handleChoice("Spierdalaj, gnoju.")}
                className="px-5 py-2 bg-yellow-800 text-yellow-200 border border-yellow-600 rounded-md font-semibold text-sm hover:bg-yellow-700 transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-yellow-500/30 hover:animate-[shake_0.3s_ease-in-out]"
                disabled={choices.length === 0}
              >
                <span className="inline-block transition-transform duration-200">
                  Zbluzgaj Mistrza Gry
                </span>
              </button>
            </div>
          </div>
        );
      case GameState.Loading:
          return (
            <div className="animate-[fadeIn_0.5s_ease-out_forwards]">
              <StoryWindow log={log} />
              <LoadingSpinner />
            </div>
          );
      case GameState.Error:
        return (
          <div className="text-center p-8 bg-red-900/50 border-2 border-red-500 rounded-lg animate-[shake_0.5s_ease-in-out] opacity-0 animate-[fadeIn_0.5s_ease-out_0.2s_forwards]">
            <h2 className="text-2xl text-red-400 font-bold mb-4 animate-[shake_1s_ease-in-out_infinite]">
              No i się, kurwa, zesrało!
            </h2>
            <p className="text-gray-200 mb-6 opacity-0 animate-[slideInLeft_0.8s_ease-out_0.5s_forwards]">
              {error}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95 opacity-0 animate-[bounce_1s_ease-out_1s_forwards] hover:shadow-lg hover:shadow-gray-500/50"
            >
              <span className="inline-block transition-transform duration-200 hover:animate-[shake_0.3s_ease-in-out]">
                Jeszcze raz, do chuja
              </span>
            </button>
            {savedSession && (
              <button
                onClick={resumeGame}
                className="mt-4 px-6 py-3 bg-green-800 text-green-200 font-bold rounded-lg border border-green-600 hover:bg-green-700 transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-green-500/30 opacity-0 animate-[fadeIn_1s_ease-out_1.4s_forwards]"
              >
                <span className="inline-block">Kontynuuj z ostatniego zapisu</span>
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 flex flex-col gap-6">
          {renderContent()}
          {summaryLog.length > 0 && (
            <SessionSummary
              log={summaryLog}
              lastSavedAt={savedSession?.savedAt ?? null}
              isPreview={isSummaryPreview}
            />
          )}
          {(log.length > 0 || !!savedSession) && (
            <LogActions
              log={log.length > 0 ? log : savedSession?.log ?? []}
              hasSavedSession={!!savedSession}
              onClearSaved={clearSavedSession}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;