import { notesAPI } from "@/services/api";
import { CanvasBackground, NoteType } from "@/types/notes";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

interface Note {
	id: string;
	user_id: number;
	folder_id: string;
	title: string;
	type: NoteType;
	content: string;
	thumbnail: string | null;
	canvas_background: CanvasBackground;
	path: string | null;
	github_sha: string | null;
	sync_status: "pending" | "synced" | "conflict";
	created_at: string;
	updated_at: string;
}

export function useApiNotes(folderId?: string) {
	const [notes, setNotes] = useState<Note[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		loadNotes();
	}, [folderId]);

	const loadNotes = async () => {
		try {
			setIsLoading(true);
			const data = folderId
				? await notesAPI.getByFolder(folderId)
				: await notesAPI.getAll();
			setNotes(data);
		} catch (error: any) {
			console.error("Error loading notes:", error);
			if (error.response?.status !== 401 && error.response?.status !== 403) {
				toast({
					title: "Error",
					description: "Failed to load notes",
					variant: "destructive",
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	const createNote = async (
		id: string,
		folderId: string,
		type: NoteType,
		title: string = "Untitled",
	) => {
		try {
			const newNote = await notesAPI.create({
				id,
				folderId,
				title,
				type,
				content: "",
				canvasBackground: "grid",
			});

			setNotes((prev) => [...prev, newNote]);

			toast({
				title: "Note Created",
				description: `New ${type} note created`,
			});

			return newNote;
		} catch (error: any) {
			console.error("Error creating note:", error);
			toast({
				title: "Error",
				description: "Failed to create note",
				variant: "destructive",
			});
			return null;
		}
	};

	const updateNote = async (id: string, updates: Partial<Note>) => {
		try {
			const updated = await notesAPI.update(id, updates);
			setNotes((prev) => prev.map((note) => (note.id === id ? updated : note)));
			return updated;
		} catch (error: any) {
			console.error("Error updating note:", error);
			toast({
				title: "Error",
				description: "Failed to update note",
				variant: "destructive",
			});
			return null;
		}
	};

	const deleteNote = async (id: string) => {
		try {
			await notesAPI.delete(id);
			setNotes((prev) => prev.filter((note) => note.id !== id));

			toast({
				title: "Note Deleted",
				description: "Note has been deleted",
			});

			return true;
		} catch (error: any) {
			console.error("Error deleting note:", error);
			toast({
				title: "Error",
				description: "Failed to delete note",
				variant: "destructive",
			});
			return false;
		}
	};

	const getPendingNotes = async () => {
		try {
			return await notesAPI.getPending();
		} catch (error: any) {
			console.error("Error getting pending notes:", error);
			return [];
		}
	};

	return {
		notes,
		isLoading,
		createNote,
		updateNote,
		deleteNote,
		getPendingNotes,
		refreshNotes: loadNotes,
	};
}
