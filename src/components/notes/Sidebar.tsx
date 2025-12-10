import { useState } from 'react';
import { 
  Folder as FolderIcon, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Moon, 
  Sun,
  ChevronLeft,
  FileText,
  PenTool,
  Github
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Folder } from '@/types/notes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateNote: (type: 'drawing' | 'text') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateNote,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [renameFolderDialog, setRenameFolderDialog] = useState<{ id: string; name: string } | null>(null);
  const [folderName, setFolderName] = useState('');

  const handleCreateFolder = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName('');
      setNewFolderDialog(false);
    }
  };

  const handleRenameFolder = () => {
    if (renameFolderDialog && folderName.trim()) {
      onRenameFolder(renameFolderDialog.id, folderName.trim());
      setFolderName('');
      setRenameFolderDialog(null);
    }
  };

  return (
    <>
      <aside
        className={cn(
          'h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-base',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <PenTool className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">Notes</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 text-sidebar-foreground transition-transform duration-base',
                isCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* New Note Buttons */}
        <div className={cn('p-3 space-y-2', isCollapsed && 'px-2')}>
          <button
            onClick={() => onCreateNote('text')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Note</span>}
          </button>
          <button
            onClick={() => onCreateNote('drawing')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <PenTool className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Drawing</span>}
          </button>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <div className="flex items-center justify-between mb-2">
            {!isCollapsed && (
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Folders
              </span>
            )}
            <button
              onClick={() => setNewFolderDialog(true)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                  selectedFolderId === folder.id
                    ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  isCollapsed && 'justify-center px-2'
                )}
                onClick={() => onSelectFolder(folder.id)}
              >
                <FolderIcon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{folder.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sidebar-accent transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderName(folder.name);
                            setRenameFolderDialog({ id: folder.id, name: folder.name });
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFolder(folder.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={onToggleTheme}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Sun className="w-4 h-4 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Github className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Connect GitHub</span>}
          </button>
        </div>
      </aside>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renameFolderDialog} onOpenChange={() => setRenameFolderDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
