
export interface StorySegment {
  story: string;
  choices: string[];
}

export interface LogEntry {
  id: number;
  type: 'story' | 'choice';
  text: string;
}

export enum GameState {
  Start,
  Playing,
  Error,
  Loading,
}

export interface SavedSession {
  log: LogEntry[];
  choices: string[];
  savedAt: number;
}
