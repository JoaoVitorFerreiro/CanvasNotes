import { Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function MobileHeader({ onToggleSidebar, isSidebarOpen }: MobileHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:hidden">
      <button
        onClick={onToggleSidebar}
        className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
      >
        {isSidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {showSearch ? (
        <div className="flex-1 mx-4">
          <Input
            placeholder="Search notes..."
            className="h-9"
            autoFocus
            onBlur={() => setShowSearch(false)}
          />
        </div>
      ) : (
        <h1 className="font-semibold">Notes</h1>
      )}

      <button
        onClick={() => setShowSearch(!showSearch)}
        className="p-2 -mr-2 rounded-xl hover:bg-secondary transition-colors"
      >
        {showSearch ? (
          <X className="w-5 h-5" />
        ) : (
          <Search className="w-5 h-5" />
        )}
      </button>
    </header>
  );
}
