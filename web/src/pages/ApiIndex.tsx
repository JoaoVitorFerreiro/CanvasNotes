import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { DrawingEditor } from "@/components/notes/DrawingEditor";
import { MobileHeader } from "@/components/notes/MobileHeader";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { Sidebar } from "@/components/notes/Sidebar";
import { TextEditor } from "@/components/notes/TextEditor";
import { useToast } from "@/hooks/use-toast";
import { useApiAuth } from "@/hooks/useApiAuth";
import { useApiFolders } from "@/hooks/useApiFolders";
import { useApiNotes } from "@/hooks/useApiNotes";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { CanvasBackground, NoteType } from "@/types/notes";

const ApiIndex = () => {
	const { noteId: urlNoteId } = useParams<{ noteId?: string }>();
	const navigate = useNavigate();
	const { user, isLoading: authLoading, register, login } = useApiAuth();
	const {
		folders,
		isLoading: foldersLoading,
		createFolder,
		renameFolder,
		deleteFolder,
		refreshFolders,
	} = useApiFolders();
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

	const {
		notes,
		isLoading: notesLoading,
		createNote,
		updateNote,
		deleteNote,
		refreshNotes,
	} = useApiNotes(selectedFolderId || undefined);

	// Reload data when user becomes authenticated
	useEffect(() => {
		if (user) {
			refreshFolders();
		}
	}, [user]);

	const { theme, toggleTheme } = useTheme();
	const { toast } = useToast();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	const selectedNote = notes.find((n) => n.id === selectedNoteId);
	const selectedFolder = folders.find((f) => f.id === selectedFolderId);

	// Sync URL with selected note
	useEffect(() => {
		if (urlNoteId && urlNoteId !== selectedNoteId) {
			setSelectedNoteId(urlNoteId);
		}
	}, [urlNoteId]);

	// Auto-select first folder when folders load
	useEffect(() => {
		if (folders.length > 0 && !selectedFolderId) {
			setSelectedFolderId(folders[0].id);
		}
	}, [folders, selectedFolderId]);

	// When a note is selected, update URL
	const handleSelectNote = (noteId: string | null) => {
		if (noteId) {
			navigate(`/note/${noteId}`);
		} else {
			navigate("/");
		}
		setSelectedNoteId(noteId);
	};

	const handleCreateNote = async (type: NoteType) => {
		if (!selectedFolderId) {
			toast({
				title: "Select a Folder",
				description: "Please select a folder before creating a note",
				variant: "destructive",
			});
			return;
		}

		const id = `note-${Date.now()}`;
		const note = await createNote(id, selectedFolderId, type);
		if (note) {
			handleSelectNote(note.id);
		}
	};

	const handleCreateFolder = async (name: string) => {
		const id = `folder-${Date.now()}`;
		const folder = await createFolder(id, name);
		if (folder && folders.length === 0) {
			setSelectedFolderId(folder.id);
		}
	};

	const handleSaveDrawing = async (
		content: string,
		thumbnail: string,
		title: string,
		canvasBackground: CanvasBackground,
	) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, {
				content,
				thumbnail,
				title,
				canvasBackground: canvasBackground,
			});
		}
	};

	const handleSaveText = async (content: string, title: string) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { content, title });
		}
	};

	const handleUpdateTitle = async (title: string) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { title });
		}
	};

	const handleUpdateBackground = async (canvasBackground: CanvasBackground) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, {
				canvasBackground: canvasBackground,
			});
		}
	};

	// Show loading while checking authentication
	if (authLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-pulse-soft text-lg font-medium text-muted-foreground">
					Loading...
				</div>
			</div>
		);
	}

	// Show login screen if not authenticated
	if (!user) {
		return <LoginForm onLogin={login} onRegister={register} />;
	}

	// Show loading while fetching data
	if (foldersLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-pulse-soft text-lg font-medium text-muted-foreground">
					Loading notes...
				</div>
			</div>
		);
	}

	// Helper function to safely convert date strings
	const parseDate = (dateString: string | undefined | null): Date => {
		if (!dateString) return new Date();
		const date = new Date(dateString);
		return isNaN(date.getTime()) ? new Date() : date;
	};

	// Convert API folder format to component format
	const formattedFolders = folders.map((f) => ({
		id: f.id,
		name: f.name,
		createdAt: parseDate(f.created_at),
		updatedAt: parseDate(f.updated_at),
	}));

	// Convert API note format to component format
	const formattedNotes = notes.map((n) => ({
		id: n.id,
		folderId: n.folder_id,
		title: n.title,
		type: n.type,
		content: n.content,
		thumbnail: n.thumbnail || undefined,
		canvasBackground: n.canvasBackground,
		createdAt: parseDate(n.created_at),
		updatedAt: parseDate(n.updated_at),
	}));

	return (
		<div className="min-h-screen bg-background flex">
			{/* Desktop Sidebar */}
			<div className="hidden md:block">
				<Sidebar
					folders={formattedFolders}
					selectedFolderId={selectedFolderId}
					onSelectFolder={setSelectedFolderId}
					onCreateFolder={handleCreateFolder}
					onRenameFolder={renameFolder}
					onDeleteFolder={deleteFolder}
					onCreateNote={handleCreateNote}
					theme={theme}
					onToggleTheme={toggleTheme}
					isCollapsed={sidebarCollapsed}
					onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>
			</div>

			{/* Mobile Sidebar Overlay */}
			<div
				className={cn(
					"fixed inset-0 z-40 md:hidden transition-opacity duration-base",
					mobileSidebarOpen
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none",
				)}
			>
				<div
					className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
					onClick={() => setMobileSidebarOpen(false)}
				/>
				<div
					className={cn(
						"absolute left-0 top-0 h-full transition-transform duration-base",
						mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					<Sidebar
						folders={formattedFolders}
						selectedFolderId={selectedFolderId}
						onSelectFolder={(id) => {
							setSelectedFolderId(id);
							setMobileSidebarOpen(false);
						}}
						onCreateFolder={handleCreateFolder}
						onRenameFolder={renameFolder}
						onDeleteFolder={deleteFolder}
						onCreateNote={(type) => {
							handleCreateNote(type);
							setMobileSidebarOpen(false);
						}}
						theme={theme}
						onToggleTheme={toggleTheme}
						isCollapsed={false}
						onToggleCollapse={() => setMobileSidebarOpen(false)}
					/>
				</div>
			</div>

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-w-0">
				<MobileHeader
					onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
					isSidebarOpen={mobileSidebarOpen}
				/>

				<NotesGrid
					notes={formattedNotes}
					selectedNoteId={selectedNoteId}
					onSelectNote={handleSelectNote}
					onDeleteNote={deleteNote}
					folderName={selectedFolder?.name || "Notes"}
				/>
			</main>

			{/* Editors */}
			{selectedNote?.type === "drawing" && (
				<DrawingEditor
					key={selectedNoteId}
					note={formattedNotes.find((n) => n.id === selectedNoteId)!}
					onSave={handleSaveDrawing}
					onUpdateTitle={handleUpdateTitle}
					onUpdateBackground={handleUpdateBackground}
					onClose={() => handleSelectNote(null)}
				/>
			)}

			{selectedNote?.type === "text" && (
				<TextEditor
					key={selectedNoteId}
					note={formattedNotes.find((n) => n.id === selectedNoteId)!}
					onSave={handleSaveText}
					onUpdateTitle={handleUpdateTitle}
					onClose={() => handleSelectNote(null)}
				/>
			)}
		</div>
	);
};

export default ApiIndex;
