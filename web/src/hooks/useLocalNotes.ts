import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { LocalFolder, LocalNote } from "@/types/local-first";
import { NoteType } from "@/types/notes";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useLocalNotes() {
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

	// Usar Dexie live queries para reatividade automática
	const folders =
		useLiveQuery(() => db.folders.orderBy("createdAt").toArray()) || [];
	const notes =
		useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray()) || [];

	// Selecionar primeira pasta automaticamente
	useEffect(() => {
		if (folders.length > 0 && !selectedFolderId) {
			setSelectedFolderId(folders[0].id);
		}
	}, [folders, selectedFolderId]);

	// OPERAÇÕES DE PASTAS

	const createFolder = useCallback(
		async (name: string): Promise<LocalFolder | null> => {
			try {
				const newFolder: LocalFolder = {
					id: uuidv4(),
					name,
					createdAt: new Date(),
					updatedAt: new Date(),
					githubPath: `folders/${slugify(name)}`,
				};

				await db.folders.add(newFolder);
				return newFolder;
			} catch (error) {
				console.error("Error creating folder:", error);
				return null;
			}
		},
		[],
	);

	const renameFolder = useCallback(
		async (id: string, name: string): Promise<void> => {
			try {
				await db.folders.update(id, {
					name,
					updatedAt: new Date(),
					githubPath: `folders/${slugify(name)}`,
				});
			} catch (error) {
				console.error("Error renaming folder:", error);
			}
		},
		[],
	);

	const deleteFolder = useCallback(
		async (id: string): Promise<void> => {
			try {
				// Deletar todas as notas da pasta
				const folderNotes = await db.notes
					.where("folderId")
					.equals(id)
					.toArray();
				await db.notes.bulkDelete(folderNotes.map((n) => n.id));

				// Deletar a pasta
				await db.folders.delete(id);

				// Limpar seleção se necessário
				if (selectedFolderId === id) {
					const remainingFolders = await db.folders.toArray();
					setSelectedFolderId(remainingFolders[0]?.id || null);
				}
			} catch (error) {
				console.error("Error deleting folder:", error);
			}
		},
		[selectedFolderId],
	);

	// OPERAÇÕES DE NOTAS

	const createNote = useCallback(
		async (
			type: NoteType,
			folderId: string,
			title?: string,
		): Promise<LocalNote | null> => {
			try {
				const defaultTitle =
					type === "drawing" ? "Untitled Drawing" : "Untitled Note";
				const noteTitle = title || defaultTitle;
				const now = new Date();

				const newNote: LocalNote = {
					id: uuidv4(),
					title: noteTitle,
					type,
					folderId,
					content: "",
					thumbnail: undefined,
					createdAt: now,
					updatedAt: now,
					canvasBackground: type === "drawing" ? "blank" : undefined,
					path: `notes/${slugify(noteTitle)}-${Date.now()}.md`,
					syncStatus: "pending",
					lastSyncedAt: undefined,
				};

				await db.notes.add(newNote);
				return newNote;
			} catch (error) {
				console.error("Error creating note:", error);
				return null;
			}
		},
		[],
	);

	const getNote = useCallback(async (id: string): Promise<LocalNote | null> => {
		try {
			const note = await db.notes.get(id);
			return note || null;
		} catch (error) {
			console.error("Error getting note:", error);
			return null;
		}
	}, []);

	const saveNote = useCallback(
		async (
			id: string,
			updates: Partial<Omit<LocalNote, "id" | "createdAt">>,
		): Promise<void> => {
			try {
				const updateData: any = {
					...updates,
					updatedAt: new Date(),
				};

				// Se o título mudou, atualizar o path
				if (updates.title) {
					updateData.path = `notes/${slugify(updates.title)}-${Date.now()}.md`;
				}

				// Marcar como pendente de sincronização se houver mudanças de conteúdo
				if (updates.content !== undefined || updates.title !== undefined) {
					updateData.syncStatus = "pending";
				}

				await db.notes.update(id, updateData);
			} catch (error) {
				console.error("Error saving note:", error);
			}
		},
		[],
	);

	const updateNote = useCallback(
		async (
			id: string,
			updates: Partial<Omit<LocalNote, "id" | "createdAt">>,
		): Promise<void> => {
			await saveNote(id, updates);
		},
		[saveNote],
	);

	const deleteNote = useCallback(
		async (id: string): Promise<void> => {
			try {
				await db.notes.delete(id);

				if (selectedNoteId === id) {
					setSelectedNoteId(null);
				}
			} catch (error) {
				console.error("Error deleting note:", error);
			}
		},
		[selectedNoteId],
	);

	const listNotes = useCallback(async (): Promise<LocalNote[]> => {
		try {
			return await db.notes.toArray();
		} catch (error) {
			console.error("Error listing notes:", error);
			return [];
		}
	}, []);

	const getNotesInFolder = useCallback(
		(folderId: string): LocalNote[] => {
			return notes.filter((n) => n.folderId === folderId);
		},
		[notes],
	);

	// Buscar nota e pasta selecionadas
	const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;
	const selectedFolder = folders.find((f) => f.id === selectedFolderId) || null;

	return {
		// Estado
		folders,
		notes,
		selectedFolderId,
		selectedNoteId,
		selectedNote,
		selectedFolder,
		isLoading: folders === undefined || notes === undefined,

		// Seletores
		setSelectedFolderId,
		setSelectedNoteId,

		// Operações de pastas
		createFolder,
		renameFolder,
		deleteFolder,

		// Operações de notas
		createNote,
		getNote,
		saveNote,
		updateNote,
		deleteNote,
		listNotes,
		getNotesInFolder,
	};
}
