import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "samsung-notes-clone";

interface LocalStorageNote {
	id: string;
	title: string;
	type: "text" | "drawing";
	folderId: string;
	content: string;
	thumbnail?: string;
	createdAt: string;
	updatedAt: string;
	canvasBackground?: string;
}

interface LocalStorageFolder {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface LocalStorageData {
	folders: LocalStorageFolder[];
	notes: LocalStorageNote[];
}

export async function migrateFromLocalStorage(userId: string): Promise<{
	migrated: boolean;
	foldersCount: number;
	notesCount: number;
	error?: string;
}> {
	try {
		// Check if there's data in localStorage
		const stored = localStorage.getItem(STORAGE_KEY);

		if (!stored) {
			return { migrated: false, foldersCount: 0, notesCount: 0 };
		}

		// Parse localStorage data
		const data: LocalStorageData = JSON.parse(stored);

		if (!data.folders || !data.notes) {
			return { migrated: false, foldersCount: 0, notesCount: 0 };
		}

		// Check if user already has data in Supabase
		const { count: existingFoldersCount } = await supabase
			.from("folders")
			.select("*", { count: "exact", head: true })
			.eq("user_id", userId);

		const { count: existingNotesCount } = await supabase
			.from("notes")
			.select("*", { count: "exact", head: true })
			.eq("user_id", userId);

		// If user already has data in Supabase, don't migrate
		if (
			(existingFoldersCount && existingFoldersCount > 0) ||
			(existingNotesCount && existingNotesCount > 0)
		) {
			console.log("User already has data in Supabase, skipping migration");
			return { migrated: false, foldersCount: 0, notesCount: 0 };
		}

		// Migrate folders
		const foldersToInsert = data.folders.map((f) => ({
			id: f.id,
			user_id: userId,
			name: f.name,
			created_at: f.createdAt,
			updated_at: f.updatedAt,
		}));

		const { error: foldersError } = await supabase
			.from("folders")
			.insert(foldersToInsert);

		if (foldersError) {
			console.error("Error migrating folders:", foldersError);
			throw new Error(`Failed to migrate folders: ${foldersError.message}`);
		}

		// Migrate notes
		const notesToInsert = data.notes.map((n) => ({
			id: n.id,
			user_id: userId,
			folder_id: n.folderId,
			title: n.title,
			type: n.type,
			content: n.content || "",
			thumbnail: n.thumbnail || null,
			canvas_background: n.canvasBackground || "blank",
			created_at: n.createdAt,
			updated_at: n.updatedAt,
			sync_status: "pending", // Mark all notes for sync
		}));

		const { error: notesError } = await supabase
			.from("notes")
			.insert(notesToInsert);

		if (notesError) {
			console.error("Error migrating notes:", notesError);
			throw new Error(`Failed to migrate notes: ${notesError.message}`);
		}

		// Clear localStorage after successful migration
		localStorage.removeItem(STORAGE_KEY);

		console.log(
			`Migration successful: ${data.folders.length} folders, ${data.notes.length} notes`,
		);

		return {
			migrated: true,
			foldersCount: data.folders.length,
			notesCount: data.notes.length,
		};
	} catch (error) {
		console.error("Migration error:", error);
		return {
			migrated: false,
			foldersCount: 0,
			notesCount: 0,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Check if there's data to migrate from localStorage
 */
export function hasLocalStorageData(): boolean {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return false;

		const data = JSON.parse(stored);
		return (
			(data.folders && data.folders.length > 0) ||
			(data.notes && data.notes.length > 0)
		);
	} catch (error) {
		console.error("Error checking localStorage:", error);
		return false;
	}
}
