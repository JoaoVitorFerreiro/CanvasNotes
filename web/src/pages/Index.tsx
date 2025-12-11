import { LoginScreen } from "@/components/auth/LoginScreen";
import { DrawingEditor } from "@/components/notes/DrawingEditor";
import { MobileHeader } from "@/components/notes/MobileHeader";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { Sidebar } from "@/components/notes/Sidebar";
import { TextEditor } from "@/components/notes/TextEditor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useNotes";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { CanvasBackground, NoteType } from "@/types/notes";
import {
	hasLocalStorageData,
	migrateFromLocalStorage,
} from "@/utils/migrateLocalStorage";
import { useEffect, useState } from "react";

const Index = () => {
	const {
		user,
		isLoading: authLoading,
		signInWithGitHub,
		isInitializing,
	} = useAuth();
	const { toast } = useToast();
	const [migrationComplete, setMigrationComplete] = useState(false);

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
	} = useNotes(user);

	const { theme, toggleTheme } = useTheme();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	// Migrate localStorage data after authentication
	useEffect(() => {
		if (user && !migrationComplete && hasLocalStorageData()) {
			const performMigration = async () => {
				const result = await migrateFromLocalStorage(user.id);

				if (result.migrated) {
					toast({
						title: "Data Migrated",
						description: `Successfully migrated ${result.notesCount} notes and ${result.foldersCount} folders.`,
					});
					setMigrationComplete(true);
				} else if (result.error) {
					toast({
						title: "Migration Error",
						description: result.error,
						variant: "destructive",
					});
				}
			};

			performMigration();
		}
	}, [user, migrationComplete, toast]);

	const handleCreateNote = (type: NoteType) => {
		if (selectedFolderId) {
			const note = createNote(type, selectedFolderId);
			if (note) {
				setSelectedNoteId(note.id);
			}
		}
	};

	const handleSaveDrawing = (content: string, thumbnail: string) => {
		if (selectedNote) {
			updateNote(selectedNote.id, { content, thumbnail });
		}
	};

	const handleSaveText = (content: string) => {
		if (selectedNote) {
			updateNote(selectedNote.id, { content });
		}
	};

	const handleUpdateTitle = (title: string) => {
		if (selectedNote) {
			updateNote(selectedNote.id, { title });
		}
	};

	const handleUpdateBackground = (canvasBackground: CanvasBackground) => {
		if (selectedNote) {
			updateNote(selectedNote.id, { canvasBackground });
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
		return (
			<LoginScreen onSignIn={signInWithGitHub} isLoading={isInitializing} />
		);
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

export default Index;
