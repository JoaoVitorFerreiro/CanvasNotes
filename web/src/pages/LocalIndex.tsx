import { LocalLoginScreen } from "@/components/auth/LocalLoginScreen";
import { DrawingEditor } from "@/components/notes/DrawingEditor";
import { MobileHeader } from "@/components/notes/MobileHeader";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { Sidebar } from "@/components/notes/Sidebar";
import { TextEditor } from "@/components/notes/TextEditor";
import { RepoConfigForm } from "@/components/sync/RepoConfigForm";
import { SyncButton } from "@/components/sync/SyncButton";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useLocalNotes } from "@/hooks/useLocalNotes";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { CanvasBackground, NoteType } from "@/types/notes";
import { useState } from "react";

const LocalIndex = () => {
	const { user, isLoading: authLoading, signIn } = useLocalAuth();

	const {
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
	} = useLocalNotes();

	const { theme, toggleTheme } = useTheme();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	const handleCreateNote = async (type: NoteType) => {
		if (selectedFolderId) {
			const note = await createNote(type, selectedFolderId);
			if (note) {
				setSelectedNoteId(note.id);
			}
		}
	};

	const handleSaveDrawing = async (content: string, thumbnail: string) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { content, thumbnail });
		}
	};

	const handleSaveText = async (content: string) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { content });
		}
	};

	const handleUpdateTitle = async (title: string) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { title });
		}
	};

	const handleUpdateBackground = async (canvasBackground: CanvasBackground) => {
		if (selectedNote) {
			await updateNote(selectedNote.id, { canvasBackground });
		}
	};

	const folderNotes = selectedFolderId
		? getNotesInFolder(selectedFolderId)
		: [];

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
		return <LocalLoginScreen onSignIn={signIn} />;
	}

	// Show loading while fetching notes
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-pulse-soft text-lg font-medium text-muted-foreground">
					Loading notes...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex">
			{/* Desktop Sidebar */}
			<div className="hidden md:block">
				<Sidebar
					folders={folders}
					selectedFolderId={selectedFolderId}
					onSelectFolder={setSelectedFolderId}
					onCreateFolder={createFolder}
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
						folders={folders}
						selectedFolderId={selectedFolderId}
						onSelectFolder={(id) => {
							setSelectedFolderId(id);
							setMobileSidebarOpen(false);
						}}
						onCreateFolder={createFolder}
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

				{/* Toolbar com sync */}
				<div className="border-b px-4 py-2 flex items-center justify-between gap-2">
					<h2 className="text-lg font-semibold">
						{selectedFolder?.name || "Notes"}
					</h2>
					<div className="flex items-center gap-2">
						<RepoConfigForm />
						<SyncButton />
					</div>
				</div>

				<NotesGrid
					notes={folderNotes}
					selectedNoteId={selectedNoteId}
					onSelectNote={setSelectedNoteId}
					onDeleteNote={deleteNote}
					folderName={selectedFolder?.name || "Notes"}
				/>
			</main>

			{/* Editors */}
			{selectedNote?.type === "drawing" && (
				<DrawingEditor
					note={selectedNote}
					onSave={handleSaveDrawing}
					onUpdateTitle={handleUpdateTitle}
					onUpdateBackground={handleUpdateBackground}
					onClose={() => setSelectedNoteId(null)}
				/>
			)}

			{selectedNote?.type === "text" && (
				<TextEditor
					note={selectedNote}
					onSave={handleSaveText}
					onUpdateTitle={handleUpdateTitle}
					onClose={() => setSelectedNoteId(null)}
				/>
			)}
		</div>
	);
};

export default LocalIndex;
