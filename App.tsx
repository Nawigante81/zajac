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
          <div className="text-center p-8 animate-[fadeIn_1s_ease-out_forwards]">
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 px-4 opacity-0 animate-[slideInLeft_1s_ease-out_0.5s_forwards]">
              Masz na imię Jasiek, ale wszyscy mówią na ciebie Zając. Albo Kurewiusz. Twój los jest spierdolony bardziej niż poranek po libacji. Czas podjąć kilka chujowych decyzji i zobaczyć, jak bardzo można zjebać sobie życie.
            </p>
            <button
              onClick={startGame}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-red-500/50 opacity-0 animate-[bounce_1s_ease-out_1s_forwards] hover:animate-pulse"
            >
              <span className="inline-block transition-transform duration-200 hover:animate-[shake_0.5s_ease-in-out]">
                Dobra, kurwa, zaczynajmy ten burdel
              </span>
            </button>
          </div>
        );
      case GameState.Playing:
        return (
          <div className="animate-[fadeIn_0.8s_ease-out_forwards]">
            <StoryWindow log={log} />
            <ChoiceBox choices={choices} onChoice={handleChoice} disabled={false} />
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