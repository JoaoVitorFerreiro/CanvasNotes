import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Folder, Note, NoteType, CanvasBackground } from '@/types/notes';

const STORAGE_KEY = 'samsung-notes-clone';

interface StoredData {
  folders: Folder[];
  notes: Note[];
}

const getStoredData = (): StoredData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        folders: data.folders.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
        })),
        notes: data.notes.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        })),
      };
    }
  } catch (e) {
    console.error('Failed to load stored data:', e);
  }
  
  // Default data
  const defaultFolderId = uuidv4();
  return {
    folders: [
      {
        id: defaultFolderId,
        name: 'My Notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    notes: [],
  };
};

export function useNotes() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const data = getStoredData();
    setFolders(data.folders);
    setNotes(data.notes);
    if (data.folders.length > 0) {
      setSelectedFolderId(data.folders[0].id);
    }
    setIsLoading(false);
  }, []);

  // Save data on change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, notes }));
    }
  }, [folders, notes, isLoading]);

  const createFolder = useCallback((name: string) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev =>
      prev.map(f =>
        f.id === id ? { ...f, name, updatedAt: new Date() } : f
      )
    );
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.filter(n => n.folderId !== id));
    if (selectedFolderId === id) {
      setSelectedFolderId(folders.find(f => f.id !== id)?.id || null);
    }
  }, [selectedFolderId, folders]);

  const createNote = useCallback((type: NoteType, folderId: string, title?: string) => {
    const newNote: Note = {
      id: uuidv4(),
      title: title || (type === 'drawing' ? 'Untitled Drawing' : 'Untitled Note'),
      type,
      folderId,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      canvasBackground: type === 'drawing' ? 'blank' : undefined,
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId]);

  const getNotesInFolder = useCallback((folderId: string) => {
    return notes.filter(n => n.folderId === folderId);
  }, [notes]);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;
  const selectedFolder = folders.find(f => f.id === selectedFolderId) || null;

  return {
    folders,
    notes,
    selectedFolderId,
    selectedNoteId,
    selectedNote,
    selectedFolder,
    isLoading,
    setSelectedFolderId,
    setSelectedNoteId,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    getNotesInFolder,
  };
}
