import { formatDistanceToNow } from "date-fns";
import { Clock, FileText, MoreHorizontal, PenTool, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Note } from "@/types/notes";

interface NotesGridProps {
	notes: Note[];
	selectedNoteId: string | null;
	onSelectNote: (id: string) => void;
	onDeleteNote: (id: string) => void;
	folderName: string;
}

export function NotesGrid({
	notes,
	selectedNoteId,
	onSelectNote,
	onDeleteNote,
	folderName,
}: NotesGridProps) {
	if (notes.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
				<div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
					<FileText className="w-10 h-10 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					No notes yet
				</h3>
				<p className="text-muted-foreground max-w-sm">
					Create your first note or drawing by clicking the buttons in the
					sidebar.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 md:p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-foreground">{folderName}</h2>
				<p className="text-muted-foreground">
					{notes.length} {notes.length === 1 ? "note" : "notes"}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{notes.map((note, index) => (
					<div
						key={note.id}
						className={cn(
							"note-card group animate-fade-in",
							selectedNoteId === note.id && "ring-2 ring-primary",
						)}
						style={{ animationDelay: `${index * 50}ms` }}
						onClick={() => onSelectNote(note.id)}
					>
						{/* Thumbnail */}
						<div className="aspect-[4/3] bg-muted relative overflow-hidden">
							{note.type === "drawing" ? (
								note.thumbnail ? (
									<img
										src={note.thumbnail}
										alt={note.title}
										className="w-full h-full object-cover"
									/>
								) : (
									<div
										className={cn(
											"w-full h-full flex items-center justify-center",
											note.canvasBackground === "lined" && "canvas-lined",
											note.canvasBackground === "grid" && "canvas-grid",
											note.canvasBackground === "dotted" && "canvas-dotted",
											(!note.canvasBackground ||
												note.canvasBackground === "blank") &&
												"canvas-blank",
										)}
									>
										<PenTool className="w-8 h-8 text-muted-foreground/50" />
									</div>
								)
							) : (
								<div className="w-full h-full p-4 bg-card">
									<p className="text-sm text-muted-foreground line-clamp-4">
										{note.content ? (
											note.content.replace(/<[^>]*>/g, "").substring(0, 150)
										) : (
											<span className="italic">Empty note</span>
										)}
									</p>
								</div>
							)}

							{/* Type Badge */}
							<div className="absolute top-2 left-2">
								<div
									className={cn(
										"px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1",
										note.type === "drawing"
											? "bg-accent/90 text-accent-foreground"
											: "bg-primary/90 text-primary-foreground",
									)}
								>
									{note.type === "drawing" ? (
										<PenTool className="w-3 h-3" />
									) : (
										<FileText className="w-3 h-3" />
									)}
									{note.type === "drawing" ? "Drawing" : "Note"}
								</div>
							</div>

							{/* Actions */}
							<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<DropdownMenu>
									<DropdownMenuTrigger
										className="p-1.5 rounded-lg bg-background/80 backdrop-blur hover:bg-background transition-colors"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontal className="w-4 h-4" />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											className="text-destructive"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteNote(note.id);
											}}
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Info */}
						<div className="p-3">
							<h3 className="font-medium text-card-foreground truncate">
								{note.title}
							</h3>
							<div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
								<Clock className="w-3 h-3" />
								<span>
									{formatDistanceToNow(note.updatedAt, { addSuffix: true })}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
