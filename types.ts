export interface EpisodeOutline {
  episodeNumber: number;
  title: string;
  synopsis: string;
}

export interface GeneratedScript {
  episodeNumber: number;
  content: string; // Markdown content
  isGenerating: boolean;
}

export interface AppState {
  step: 'upload' | 'outline' | 'scripting';
  fileContent: string | null;
  fileName: string | null;
  episodeCount: number;
  outline: EpisodeOutline[];
  scripts: Record<number, GeneratedScript>;
  isGeneratingOutline: boolean;
  loadingStatus?: string;
  error: string | null;
}