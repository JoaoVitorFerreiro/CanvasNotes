import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import {
  Pencil,
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Save,
  ArrowLeft,
  Grid3X3,
  Circle,
  Minus,
  LayoutGrid,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note, CanvasBackground } from '@/types/notes';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface DrawingEditorProps {
  note: Note;
  onSave: (content: string, thumbnail: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateBackground: (background: CanvasBackground) => void;
  onClose: () => void;
}

const COLORS = [
  '#1a1a1a', '#FFFFFF', '#6B7280', '#EF4444', '#F97316', '#F59E0B',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
];

type Tool = 'pencil' | 'pen' | 'eraser';

export function DrawingEditor({ 
  note, 
  onSave, 
  onUpdateTitle,
  onUpdateBackground,
  onClose 
}: DrawingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [title, setTitle] = useState(note.title);
  const [background, setBackground] = useState<CanvasBackground>(note.canvasBackground || 'blank');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  const autoSave = useCallback(() => {
    if (!fabricRef.current) return;

    setSaveStatus('saving');
    const json = JSON.stringify(fabricRef.current.toJSON());
    const thumbnail = fabricRef.current.toDataURL({
      format: 'png',
      quality: 0.5,
      multiplier: 0.3,
    });

    onSave(json, thumbnail);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  }, [onSave]);

  const debouncedAutoSave = useDebouncedCallback(autoSave, 2000);

  const saveToHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());

    // Remove any future history if we're in the middle of the history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);

    // Trigger auto-save
    debouncedAutoSave();
  }, [debouncedAutoSave]);

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

    const container = containerRef.current;
    // Create a large infinite canvas - 20000x20000px
    const canvasWidth = 20000;
    const canvasHeight = 20000;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 'transparent',
      isDrawingMode: true,
      selection: false,
    });

    // Initialize brush
    const brush = new PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    fabricRef.current = canvas;

    // Load existing content first, then position viewport
    if (note.content) {
      try {
        const contentData = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
        console.log('Loading canvas content, objects:', contentData.objects?.length || 0);

        canvas.loadFromJSON(contentData, () => {
          canvas.renderAll();
          saveToHistory();

          // Position viewport to show content
          const objects = canvas.getObjects();
          console.log('Canvas loaded with', objects.length, 'objects');

          if (objects.length > 0) {
            // Calculate bounds of all objects
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            objects.forEach(obj => {
              const bounds = obj.getBoundingRect();
              minX = Math.min(minX, bounds.left);
              minY = Math.min(minY, bounds.top);
              maxX = Math.max(maxX, bounds.left + bounds.width);
              maxY = Math.max(maxY, bounds.top + bounds.height);
            });

            console.log('Content bounds:', { minX, minY, maxX, maxY });

            // Center viewport on content
            const contentCenterX = (minX + maxX) / 2;
            const contentCenterY = (minY + maxY) / 2;
            container.scrollLeft = contentCenterX - container.clientWidth / 2;
            container.scrollTop = contentCenterY - container.clientHeight / 2;
          } else {
            // No objects, center viewport
            container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
            container.scrollTop = (canvasHeight - container.clientHeight) / 2;
          }
        });
      } catch (e) {
        console.error('Failed to load canvas content:', e);
        saveToHistory();
        // Center viewport on error
        container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
        container.scrollTop = (canvasHeight - container.clientHeight) / 2;
      }
    } else {
      // No content, center viewport
      container.scrollLeft = (canvasWidth - container.clientWidth) / 2;
      container.scrollTop = (canvasHeight - container.clientHeight) / 2;
      // Force initial render
      canvas.renderAll();
      saveToHistory();
    }

    // Save history on path creation
    canvas.on('path:created', saveToHistory);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!fabricRef.current) return;

    const brush = new PencilBrush(fabricRef.current);

    if (activeTool === 'eraser') {
      // Use destination-out to create eraser effect
      brush.width = brushSize * 3;
      brush.color = 'rgba(0,0,0,1)';
      brush.globalCompositeOperation = 'destination-out';
    } else {
      brush.color = activeColor;
      brush.width = activeTool === 'pen' ? brushSize * 1.5 : brushSize;
      brush.globalCompositeOperation = 'source-over';
    }

    fabricRef.current.freeDrawingBrush = brush;
    fabricRef.current.isDrawingMode = true;
  }, [activeTool, activeColor, brushSize]);

  const handleSave = () => {
    if (!fabricRef.current) return;
    
    const json = JSON.stringify(fabricRef.current.toJSON());
    const thumbnail = fabricRef.current.toDataURL({
      format: 'png',
      quality: 0.5,
      multiplier: 0.3,
    });
    
    onSave(json, thumbnail);
    onUpdateTitle(title);
  };

  const handleBackgroundChange = (bg: CanvasBackground) => {
    setBackground(bg);
    onUpdateBackground(bg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-xs font-semibold border-none bg-transparent text-lg focus-visible:ring-0"
            placeholder="Note title..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={cn(
              'toolbar-btn',
              !canUndo && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={cn(
              'toolbar-btn',
              !canRedo && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-border mx-2" />

          {/* Auto-save status indicator */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Saving...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-500">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
          {saveStatus === 'idle' && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 relative overflow-auto',
          background === 'lined' && 'canvas-lined',
          background === 'grid' && 'canvas-grid',
          background === 'dotted' && 'canvas-dotted',
          background === 'blank' && 'canvas-blank'
        )}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Toolbar */}
      <div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2">
        {/* Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <button
            onClick={() => setActiveTool('pencil')}
            className={cn('toolbar-btn', activeTool === 'pencil' && 'active')}
            title="Pencil"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('pen')}
            className={cn('toolbar-btn', activeTool === 'pen' && 'active')}
            title="Pen"
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={cn('toolbar-btn', activeTool === 'eraser' && 'active')}
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
                'w-7 h-7 rounded-lg transition-all',
                activeColor === color && 'ring-2 ring-primary ring-offset-2 ring-offset-card'
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
                      'w-8 h-8 rounded-lg transition-all',
                      activeColor === color && 'ring-2 ring-primary ring-offset-2'
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
            onClick={() => handleBackgroundChange('blank')}
            className={cn('toolbar-btn', background === 'blank' && 'active')}
            title="Blank"
          >
            <div className="w-5 h-5 rounded border border-current" />
          </button>
          <button
            onClick={() => handleBackgroundChange('lined')}
            className={cn('toolbar-btn', background === 'lined' && 'active')}
            title="Lined"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleBackgroundChange('grid')}
            className={cn('toolbar-btn', background === 'grid' && 'active')}
            title="Grid"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleBackgroundChange('dotted')}
            className={cn('toolbar-btn', background === 'dotted' && 'active')}
            title="Dotted"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
