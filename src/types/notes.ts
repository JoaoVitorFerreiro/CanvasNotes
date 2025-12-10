export type NoteType = 'drawing' | 'text';

export type CanvasBackground = 'blank' | 'lined' | 'grid' | 'dotted';

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  folderId: string;
  content: string; // For text notes: markdown/html, for drawing: JSON string of canvas
  thumbnail?: string; // Base64 image for preview
  createdAt: Date;
  updatedAt: Date;
  canvasBackground?: CanvasBackground;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotesState {
  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
}
