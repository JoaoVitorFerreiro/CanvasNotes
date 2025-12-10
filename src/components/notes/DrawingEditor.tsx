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
  LayoutGrid
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

interface DrawingEditorProps {
  note: Note;
  onSave: (content: string, thumbnail: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateBackground: (background: CanvasBackground) => void;
  onClose: () => void;
}

const COLORS = [
  '#1a1a1a', '#6B7280', '#EF4444', '#F97316', '#F59E0B', 
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

  const saveToHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    
    // Remove any future history if we're in the middle of the history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

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
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    fabricRef.current = canvas;

    // Load existing content
    if (note.content) {
      try {
        canvas.loadFromJSON(note.content, () => {
          canvas.renderAll();
          saveToHistory();
        });
      } catch (e) {
        console.error('Failed to load canvas content:', e);
        saveToHistory();
      }
    } else {
      saveToHistory();
    }

    // Save history on path creation
    canvas.on('path:created', saveToHistory);

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!fabricRef.current?.freeDrawingBrush) return;
    
    if (activeTool === 'eraser') {
      fabricRef.current.freeDrawingBrush.color = 'white';
      fabricRef.current.freeDrawingBrush.width = brushSize * 3;
    } else {
      fabricRef.current.freeDrawingBrush.color = activeColor;
      fabricRef.current.freeDrawingBrush.width = activeTool === 'pen' ? brushSize * 1.5 : brushSize;
    }
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
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={cn(
          'flex-1 relative',
          background === 'lined' && 'canvas-lined',
          background === 'grid' && 'canvas-grid',
          background === 'dotted' && 'canvas-dotted',
          background === 'blank' && 'canvas-blank'
        )}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
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
