import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Cloud, CloudOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { getGitHubConfig } from '@/lib/db';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  noteId?: string; // Se fornecido, sincroniza apenas esta nota
  className?: string;
}

export function SyncButton({ noteId, className }: SyncButtonProps) {
  const { isSyncing, syncProgress, pushNote, syncAllPending, getSyncStatus } = useGitHubSync();
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    conflicts: 0,
    synced: 0,
    total: 0
  });
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfig();
    updateStatus();

    // Atualizar status a cada 5 segundos
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkConfig = async () => {
    const config = await getGitHubConfig();
    setHasConfig(!!config);
  };

  const updateStatus = async () => {
    const status = await getSyncStatus();
    setSyncStatus(status);
  };

  const handleSync = async () => {
    if (noteId) {
      // Sincronizar nota específica
      await pushNote(noteId);
    } else {
      // Sincronizar todas as pendentes
      await syncAllPending();
    }
    await updateStatus();
  };

  if (!hasConfig) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className={className}>
              <CloudOff className="h-4 w-4 mr-2" />
              Sync Disabled
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure GitHub repository to enable sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    }
    if (syncStatus.conflicts > 0) {
      return <AlertCircle className="h-4 w-4 mr-2 text-destructive" />;
    }
    if (syncStatus.pending > 0) {
      return <RefreshCw className="h-4 w-4 mr-2 text-orange-500" />;
    }
    return <Cloud className="h-4 w-4 mr-2 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSyncing) {
      if (syncProgress.total > 0) {
        return `Syncing ${syncProgress.current}/${syncProgress.total}`;
      }
      return 'Syncing...';
    }
    if (syncStatus.conflicts > 0) {
      return `${syncStatus.conflicts} Conflict${syncStatus.conflicts > 1 ? 's' : ''}`;
    }
    if (syncStatus.pending > 0) {
      return `${syncStatus.pending} Pending`;
    }
    return 'Synced';
  };

  const getVariant = () => {
    if (syncStatus.conflicts > 0) return 'destructive';
    if (syncStatus.pending > 0) return 'default';
    return 'outline';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getVariant()}
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || (syncStatus.pending === 0 && !noteId)}
            >
              {getStatusIcon()}
              {getStatusText()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Sync Status</p>
              <p>Synced: {syncStatus.synced}</p>
              <p>Pending: {syncStatus.pending}</p>
              <p>Conflicts: {syncStatus.conflicts}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {syncStatus.pending > 0 && !isSyncing && (
        <Badge variant="secondary" className="text-xs">
          {syncStatus.pending}
        </Badge>
      )}
    </div>
  );
}
