import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Quote,
  Code,
  Undo2,
  Redo2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note } from '@/types/notes';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface TextEditorProps {
  note: Note;
  onSave: (content: string, title: string) => void;
  onUpdateTitle: (title: string) => void;
  onClose: () => void;
}

export function TextEditor({
  note,
  onSave,
  onUpdateTitle,
  onClose
}: TextEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: note.content || '',
    editorProps: {
      attributes: {
        class: 'editor-container outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.on('update', () => {
        setHasUnsavedChanges(true);
      });
    }
  }, [editor]);

  const handleSave = async () => {
    if (!editor || isSaving) return;

    setIsSaving(true);
    try {
      // Save everything together in a single update
      await onSave(editor.getHTML(), title);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('[TextEditor] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('Você tem alterações não salvas. Deseja sair sem salvar?');
      if (!confirmClose) return;
    }
    onClose();
  };

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children,
    disabled = false
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded-lg transition-colors',
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-secondary text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );

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
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={cn(
              'toolbar-btn',
              !editor.can().undo() && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={cn(
              'toolbar-btn',
              !editor.can().redo() && 'opacity-50 cursor-not-allowed'
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
              (isSaving || !hasUnsavedChanges) && "opacity-50 cursor-not-allowed"
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
                {hasUnsavedChanges ? 'Salvar' : 'Salvo'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-1 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
          >
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white dark:bg-card rounded-lg shadow-sm min-h-[calc(100vh-300px)] p-8 border border-border/50">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

    </div>
  );
}
