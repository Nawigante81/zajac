import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StoryWindow } from './components/StoryWindow';
import { ChoiceBox } from './components/ChoiceBox';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateStorySegment } from './services/geminiService';
import { LogEntry, GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(async () => {
    setLog([]);
    setChoices([]);
    setError(null);
    setGameState(GameState.Loading);
    try {
      const initialSegment = await generateStorySegment([]);
      setLog([{ id: Date.now(), type: 'story', text: initialSegment.story }]);
      setChoices(initialSegment.choices);
      setGameState(GameState.Playing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany, chujowy błąd.");
      setGameState(GameState.Error);
    }
  }, []);

  const handleChoice = async (choice: string) => {
    const newLog: LogEntry[] = [
      ...log,
      { id: Date.now(), type: 'choice', text: choice },
    ];
    setLog(newLog);
    setChoices([]);
    setGameState(GameState.Loading);
    
    // Reset if the only choice is to restart
    if (choice === "Od nowa") {
      await startGame();
      return;
    }

    try {
      const nextSegment = await generateStorySegment(newLog);
      setLog(prevLog => [...prevLog, { id: Date.now() + 1, type: 'story', text: nextSegment.story }]);
      setChoices(nextSegment.choices);
      setGameState(GameState.Playing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany, chujowy błąd.");
      setGameState(GameState.Error);
    }
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.Start:
        return (
          <div className="text-center p-8">
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 px-4">
              Masz na imię Jasiek, ale wszyscy mówią na ciebie Zając. Albo Kurewiusz. Twój los jest spierdolony bardziej niż poranek po libacji. Czas podjąć kilka chujowych decyzji i zobaczyć, jak bardzo można zjebać sobie życie.
            </p>
            <button
              onClick={startGame}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-red-700 transition-transform transform hover:scale-110 shadow-2xl"
            >
              Dobra, kurwa, zaczynajmy ten burdel
            </button>
          </div>
        );
      case GameState.Playing:
        return (
          <>
            <StoryWindow log={log} />
            <ChoiceBox choices={choices} onChoice={handleChoice} disabled={false} />
            <div className="w-full mt-6 text-center">
              <button
                onClick={() => handleChoice("Spierdalaj, gnoju.")}
                className="px-5 py-2 bg-yellow-800 text-yellow-200 border border-yellow-600 rounded-md font-semibold text-sm hover:bg-yellow-700 transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={choices.length === 0}
              >
                Zbluzgaj Mistrza Gry
              </button>
            </div>
          </>
        );
      case GameState.Loading:
          return (
            <>
              <StoryWindow log={log} />
              <LoadingSpinner />
            </>
          );
      case GameState.Error:
        return (
          <div className="text-center p-8 bg-red-900/50 border-2 border-red-500 rounded-lg">
            <h2 className="text-2xl text-red-400 font-bold mb-4">No i się, kurwa, zesrało!</h2>
            <p className="text-gray-200 mb-6">{error}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
            >
              Jeszcze raz, do chuja
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;