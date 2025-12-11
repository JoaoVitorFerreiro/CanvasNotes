import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncStatusBadgeProps {
  pendingCount: number;
  isSyncing: boolean;
  syncEnabled: boolean;
  lastSyncAt: Date | null;
  className?: string;
}

export function SyncStatusBadge({
  pendingCount,
  isSyncing,
  syncEnabled,
  lastSyncAt,
  className
}: SyncStatusBadgeProps) {
  const getStatusIcon = () => {
    if (!syncEnabled) {
      return <CloudOff className="w-4 h-4 text-muted-foreground" />;
    }

    if (isSyncing || pendingCount > 0) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncEnabled) {
      return 'Sync disabled';
    }

    if (pendingCount > 0) {
      return `Syncing ${pendingCount} note${pendingCount > 1 ? 's' : ''}...`;
    }

    if (lastSyncAt) {
      const now = new Date();
      const diffMs = now.getTime() - lastSyncAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        return 'Synced just now';
      } else if (diffMins === 1) {
        return 'Synced 1 minute ago';
      } else if (diffMins < 60) {
        return `Synced ${diffMins} minutes ago`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        return `Synced ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }
    }

    return 'All notes synced';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer',
              className
            )}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount}` : ''}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
