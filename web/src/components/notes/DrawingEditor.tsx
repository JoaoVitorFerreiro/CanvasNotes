import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import {
	ArrowLeft,
	Circle,
	Eraser,
	Grid3X3,
	LayoutGrid,
	Loader2,
	Minus,
	Pen,
	Pencil,
	Redo2,
	Save,
	Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { CanvasBackground, Note } from "@/types/notes";

interface DrawingEditorProps {
	note: Note;
	onSave: (
		content: string,
		thumbnail: string,
		title: string,
		background: CanvasBackground,
	) => void;
	onUpdateTitle: (title: string) => void;
	onUpdateBackground: (background: CanvasBackground) => void;
	onClose: () => void;
}

const COLORS = [
	"#1a1a1a",
	"#FFFFFF",
	"#6B7280",
	"#EF4444",
	"#F97316",
	"#F59E0B",
	"#22C55E",
	"#06B6D4",
	"#3B82F6",
	"#8B5CF6",
	"#EC4899",
];

type Tool = "pencil" | "pen" | "eraser";

export function DrawingEditor({
	note,
	onSave,
	onUpdateTitle,
	onUpdateBackground,
	onClose,
}: DrawingEditorProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fabricRef = useRef<FabricCanvas | null>(null);
	const [activeTool, setActiveTool] = useState<Tool>("pencil");
	const [activeColor, setActiveColor] = useState(COLORS[0]);
	const [brushSize, setBrushSize] = useState(3);
	const [title, setTitle] = useState(note.title);
	const [background, setBackground] = useState<CanvasBackground>(
		note.canvasBackground || "blank",
	);
	const [isCanvasLoading, setIsCanvasLoading] = useState(true);
	const historyRef = useRef<string[]>([]);
	const historyIndexRef = useRef(-1);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// Sync background state with prop changes
	useEffect(() => {
		setBackground(note.canvasBackground || "blank");
	}, [note.canvasBackground]);

	const saveToHistory = useCallback(() => {
		if (!fabricRef.current) return;
		const json = JSON.stringify(fabricRef.current.toJSON());

		// Remove any future history if we're in the middle of the history
		historyRef.current = historyRef.current.slice(
			0,
			historyIndexRef.current + 1,
		);
		historyRef.current.push(json);
		historyIndexRef.current = historyRef.current.length - 1;

		setCanUndo(historyIndexRef.current > 0);
		setCanRedo(false);
		setHasUnsavedChanges(true);
	}, []);

	useEffect(() => {
		if (!fabricRef.current) return;

		const brush = new PencilBrush(fabricRef.current);

		if (activeTool === "eraser") {
			brush.width = brushSize * 3;
			brush.color = "rgba(0,0,0,1)";
			(brush as any).globalCompositeOperation = "destination-out";
		} else {
			brush.color = activeColor;
			brush.width = activeTool === "pen" ? brushSize * 1.5 : brushSize;
			(brush as any).globalCompositeOperation = "source-over";
		}

		fabricRef.current.freeDrawingBrush = brush;
		fabricRef.current.isDrawingMode = true;
	}, [activeTool, activeColor, brushSize]);
	const handleUndo = useCallback(() => {
		if (historyIndexRef.current > 0) {
			historyIndexRef.current--;
			const json = historyRef.current[historyIndexRef.current];
			fabricRef.current?.loadFromJSON(json, () => {
				fabricRef.current?.renderAll();
			});
			setCanUndo(historyIndexRef.current > 0);
			setCanRedo(true);
		}
	}, []);

	const handleRedo = useCallback(() => {
		if (historyIndexRef.current < historyRef.current.length - 1) {
			historyIndexRef.current++;
			const json = historyRef.current[historyIndexRef.current];
			fabricRef.current?.loadFromJSON(json, () => {
				fabricRef.current?.renderAll();
			});
			setCanUndo(true);
			setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
		}
	}, []);

	useEffect(() => {
		if (!canvasRef.current || !containerRef.current) return;
		// Only initialize once
		if (fabricRef.current) return;

		const container = containerRef.current;
		const canvasWidth = 1920;
		const canvasHeight = 1080;

		const canvas = new FabricCanvas(canvasRef.current, {
			width: canvasWidth,
			height: canvasHeight,
			backgroundColor: "transparent",
			isDrawingMode: true,
			selection: false,
		});

		// Initialize brush
		const brush = new PencilBrush(canvas);
		brush.color = activeColor;
		brush.width = brushSize;
		canvas.freeDrawingBrush = brush;

		fabricRef.current = canvas;

		// Sempre que desenhar, salva no histórico
		canvas.on("path:created", saveToHistory);

		// Se tiver conteúdo salvo:
		if (note.content) {
			setIsCanvasLoading(true);

			try {
				const contentData =
					typeof note.content === "string"
						? JSON.parse(note.content)
						: note.content;

				console.log(
					"Loading canvas content, objects:",
					contentData.objects?.length || 0,
				);

				canvas.loadFromJSON(contentData, () => {
					// Primeiro render
					canvas.requestRenderAll();
					saveToHistory();

					// Espera um frame pro layout “assentar”
					requestAnimationFrame(() => {
						const objects = canvas.getObjects();
						console.log("Canvas loaded with", objects.length, "objects");

						if (objects.length > 0) {
							let minX = Infinity,
								minY = Infinity,
								maxX = -Infinity,
								maxY = -Infinity;

							objects.forEach((obj) => {
								const bounds = obj.getBoundingRect();
								minX = Math.min(minX, bounds.left);
								minY = Math.min(minY, bounds.top);
								maxX = Math.max(maxX, bounds.left + bounds.width);
								maxY = Math.max(maxY, bounds.top + bounds.height);
							});

							const contentCenterX = (minX + maxX) / 2;
							const contentCenterY = (minY + maxY) / 2;

							container.scrollLeft = contentCenterX - container.clientWidth / 2;
							container.scrollTop = contentCenterY - container.clientHeight / 2;
						} else {
							container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
							container.scrollTop = (canvasHeight - container.clientHeight) / 2;
						}

						setIsCanvasLoading(false);
					});
				});
			} catch (e) {
				console.error("Failed to load canvas content:", e);
				canvas.requestRenderAll();
				saveToHistory();

				container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
				container.scrollTop = (canvasHeight - container.clientHeight) / 2;

				setIsCanvasLoading(false);
			}
		} else {
			// Nota vazia: só centraliza e renderiza uma vez
			container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
			container.scrollTop = (canvasHeight - container.clientHeight) / 2;
			canvas.requestRenderAll();
			saveToHistory();
			setIsCanvasLoading(false);
		}

		return () => {
			canvas.dispose();
			fabricRef.current = null;
		};
	}, []);

	// Update brush settings
	useEffect(() => {
		if (!fabricRef.current) return;

		const brush = new PencilBrush(fabricRef.current);

		if (activeTool === "eraser") {
			brush.width = brushSize * 3;
			brush.color = "rgba(0,0,0,1)";
			(brush as any).globalCompositeOperation = "destination-out";
		} else {
			brush.color = activeColor;
			brush.width = activeTool === "pen" ? brushSize * 1.5 : brushSize;
			(brush as any).globalCompositeOperation = "source-over";
		}

		fabricRef.current.freeDrawingBrush = brush;
		fabricRef.current.isDrawingMode = true;
	}, [activeTool, activeColor, brushSize]);

	const handleSave = async () => {
		if (!fabricRef.current || isSaving) return;

		console.log("[DrawingEditor] Starting save...");
		setIsSaving(true);
		try {
			const json = JSON.stringify(fabricRef.current.toJSON());
			const thumbnail = fabricRef.current.toDataURL({
				format: "png",
				quality: 0.5,
				multiplier: 0.3,
			});

			console.log("[DrawingEditor] Saving drawing...", {
				contentSize: json.length,
				thumbnailSize: thumbnail.length,
				title,
				background,
			});

			// Save everything together in a single update
			await onSave(json, thumbnail, title, background);
			console.log("[DrawingEditor] Save completed successfully");

			setHasUnsavedChanges(false);
		} catch (error) {
			console.error("[DrawingEditor] Save failed:", error);
			throw error;
		} finally {
			setIsSaving(false);
		}
	};

	const handleBackgroundChange = (bg: CanvasBackground) => {
		setBackground(bg);
		setHasUnsavedChanges(true);
	};

	const handleClose = () => {
		if (hasUnsavedChanges) {
			const confirmClose = window.confirm(
				"Você tem alterações não salvas. Deseja sair sem salvar?",
			);
			if (!confirmClose) return;
		}
		onClose();
	};

	// Warn before leaving page with unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [hasUnsavedChanges]);

	return (
		<div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
			{/* Header */}
			<header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
				<div className="flex items-center gap-4">
					<button
						onClick={handleClose}
						className="p-2 rounded-xl hover:bg-secondary transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<Input
						value={title}
						onChange={(e) => {
							setTitle(e.target.value);
							setHasUnsavedChanges(true);
						}}
						className="max-w-xs font-semibold border-none bg-transparent text-lg focus-visible:ring-0"
						placeholder="Note title..."
					/>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={handleUndo}
						disabled={!canUndo}
						className={cn(
							"toolbar-btn",
							!canUndo && "opacity-50 cursor-not-allowed",
						)}
					>
						<Undo2 className="w-5 h-5" />
					</button>
					<button
						onClick={handleRedo}
						disabled={!canRedo}
						className={cn(
							"toolbar-btn",
							!canRedo && "opacity-50 cursor-not-allowed",
						)}
					>
						<Redo2 className="w-5 h-5" />
					</button>
					<div className="w-px h-6 bg-border mx-2" />

					<button
						onClick={handleSave}
						disabled={isSaving || !hasUnsavedChanges}
						className={cn(
							"flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium",
							(isSaving || !hasUnsavedChanges) &&
								"opacity-50 cursor-not-allowed",
						)}
					>
						{isSaving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Salvando...
							</>
						) : (
							<>
								<Save className="w-4 h-4" />
								{hasUnsavedChanges ? "Salvar" : "Salvo"}
							</>
						)}
					</button>
				</div>
			</header>

			{/* Canvas */}
			<div
				ref={containerRef}
				className={cn(
					"flex-1 relative overflow-auto",
					background === "lined" && "canvas-lined",
					background === "grid" && "canvas-grid",
					background === "dotted" && "canvas-dotted",
					background === "blank" && "canvas-blank",
				)}
			>
				<canvas ref={canvasRef} style={{ background: "transparent" }} />
				{isCanvasLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-background/60">
						<div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card shadow-lg">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span className="text-sm text-muted-foreground">
								Carregando desenho...
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Toolbar */}
			<div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2">
				{/* Tools */}
				<div className="flex items-center gap-1 pr-2 border-r border-border">
					<button
						onClick={() => setActiveTool("pencil")}
						className={cn("toolbar-btn", activeTool === "pencil" && "active")}
						title="Pencil"
					>
						<Pencil className="w-5 h-5" />
					</button>
					<button
						onClick={() => setActiveTool("pen")}
						className={cn("toolbar-btn", activeTool === "pen" && "active")}
						title="Pen"
					>
						<Pen className="w-5 h-5" />
					</button>
					<button
						onClick={() => setActiveTool("eraser")}
						className={cn("toolbar-btn", activeTool === "eraser" && "active")}
						title="Eraser"
					>
						<Eraser className="w-5 h-5" />
					</button>
				</div>

				{/* Colors */}
				<div className="flex items-center gap-1 px-2 border-r border-border">
					{COLORS.slice(0, 5).map((color) => (
						<button
							key={color}
							onClick={() => setActiveColor(color)}
							className={cn(
								"w-7 h-7 rounded-lg transition-all",
								activeColor === color &&
									"ring-2 ring-primary ring-offset-2 ring-offset-card",
							)}
							style={{ backgroundColor: color }}
						/>
					))}
					<Popover>
						<PopoverTrigger asChild>
							<button className="toolbar-btn">
								<div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-3">
							<div className="grid grid-cols-5 gap-2">
								{COLORS.map((color) => (
									<button
										key={color}
										onClick={() => setActiveColor(color)}
										className={cn(
											"w-8 h-8 rounded-lg transition-all",
											activeColor === color &&
												"ring-2 ring-primary ring-offset-2",
										)}
										style={{ backgroundColor: color }}
									/>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Brush Size */}
				<div className="flex items-center gap-2 px-2 border-r border-border">
					<Circle className="w-3 h-3 text-muted-foreground" />
					<Slider
						value={[brushSize]}
						onValueChange={([value]) => setBrushSize(value)}
						min={1}
						max={20}
						step={1}
						className="w-24"
					/>
					<Circle className="w-5 h-5 text-muted-foreground" />
				</div>

				{/* Background */}
				<div className="flex items-center gap-1 pl-2">
					<button
						onClick={() => handleBackgroundChange("blank")}
						className={cn("toolbar-btn", background === "blank" && "active")}
						title="Blank"
					>
						<div className="w-5 h-5 rounded border border-current" />
					</button>
					<button
						onClick={() => handleBackgroundChange("lined")}
						className={cn("toolbar-btn", background === "lined" && "active")}
						title="Lined"
					>
						<Minus className="w-5 h-5" />
					</button>
					<button
						onClick={() => handleBackgroundChange("grid")}
						className={cn("toolbar-btn", background === "grid" && "active")}
						title="Grid"
					>
						<Grid3X3 className="w-5 h-5" />
					</button>
					<button
						onClick={() => handleBackgroundChange("dotted")}
						className={cn("toolbar-btn", background === "dotted" && "active")}
						title="Dotted"
					>
						<LayoutGrid className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
