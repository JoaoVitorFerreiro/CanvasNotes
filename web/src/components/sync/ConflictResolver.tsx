import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConflictData } from '@/types/local-first';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { generateDiff, formatDiffForDisplay, getDiffStats } from '@/lib/conflict';
import { AlertCircle, FileText, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConflictResolverProps {
  conflict: ConflictData | null;
  open: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export function ConflictResolver({ conflict, open, onClose, onResolved }: ConflictResolverProps) {
  const [resolving, setResolving] = useState(false);
  const { resolveConflict } = useGitHubSync();
  const { toast } = useToast();

  if (!conflict) return null;

  const diff = generateDiff(conflict.localNote.content, conflict.remoteContent);
  const stats = getDiffStats(diff);

  const handleResolve = async (resolution: 'keep-local' | 'keep-remote') => {
    setResolving(true);
    try {
      const result = await resolveConflict(conflict, resolution);

      if (result.success) {
        toast({
          title: 'Conflict Resolved',
          description: result.message
        });
        onResolved?.();
        onClose();
      } else {
        toast({
          title: 'Resolution Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The note "{conflict.localNote.title}" has conflicting changes.
            Choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics */}
          <div className="flex gap-2">
            <Badge variant="outline">
              +{stats.added} additions
            </Badge>
            <Badge variant="outline">
              -{stats.removed} deletions
            </Badge>
            <Badge variant="outline">
              {stats.unchanged} unchanged
            </Badge>
          </div>

          {/* Content Comparison */}
          <Tabs defaultValue="diff" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diff">
                <GitBranch className="h-4 w-4 mr-2" />
                Diff
              </TabsTrigger>
              <TabsTrigger value="local">
                <FileText className="h-4 w-4 mr-2" />
                Local Version
              </TabsTrigger>
              <TabsTrigger value="remote">
                <FileText className="h-4 w-4 mr-2" />
                Remote Version
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diff" className="mt-4">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {diff.map((item, index) => (
                    <div
                      key={index}
                      className={
                        item.type === 'added'
                          ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                          : item.type === 'removed'
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                          : 'text-muted-foreground'
                      }
                    >
                      {item.type === 'added' && '+ '}
                      {item.type === 'removed' && '- '}
                      {item.type === 'unchanged' && '  '}
                      {item.line}
                    </div>
                  ))}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="local" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Last modified:</span>
                  <span className="font-medium">
                    {conflict.localNote.updatedAt.toLocaleString()}
                  </span>
                </div>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {conflict.localNote.content}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="remote" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Last modified:</span>
                  <span className="font-medium">
                    {new Date(conflict.remoteUpdatedAt).toLocaleString()}
                  </span>
                </div>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {conflict.remoteContent}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleResolve('keep-remote')}
              disabled={resolving}
            >
              Keep Remote Version
            </Button>
            <Button
              onClick={() => handleResolve('keep-local')}
              disabled={resolving}
            >
              Keep Local Version
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
