import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Check, Loader2 } from 'lucide-react';
import { saveGitHubConfig, getGitHubConfig, getAuthToken } from '@/lib/db';
import { GitHubConfig } from '@/types/local-first';
import { listUserRepos } from '@/integrations/github';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function RepoConfigForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Array<{ owner: string; repo: string; fullName: string }>>([]);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({
    owner: '',
    repo: '',
    branch: 'main',
    basePath: 'notes'
  });
  const [hasConfig, setHasConfig] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (open) {
      loadRepos();
    }
  }, [open]);

  const loadConfig = async () => {
    const existingConfig = await getGitHubConfig();
    if (existingConfig) {
      setConfig(existingConfig);
      setHasConfig(true);
    }
  };

  const loadRepos = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        toast({
          title: 'Not Authenticated',
          description: 'Please login with GitHub first',
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      const userRepos = await listUserRepos(token);
      setRepos(userRepos);
    } catch (error: any) {
      console.error('Error loading repos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load repositories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.owner || !config.repo) {
      toast({
        title: 'Invalid Configuration',
        description: 'Please select a repository',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const fullConfig: GitHubConfig = {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch || 'main',
        token,
        basePath: config.basePath || 'notes'
      };

      await saveGitHubConfig(fullConfig);
      setHasConfig(true);

      toast({
        title: 'Configuration Saved',
        description: `Sync enabled for ${config.owner}/${config.repo}`
      });

      setOpen(false);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  const handleRepoSelect = (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    setConfig({ ...config, owner, repo });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasConfig ? 'outline' : 'default'} size="sm">
          {hasConfig ? <Check className="h-4 w-4 mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
          {hasConfig ? 'Configured' : 'Configure Sync'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>GitHub Sync Configuration</DialogTitle>
          <DialogDescription>
            Configure which GitHub repository to sync your notes to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="repo">Repository</Label>
                <Select
                  value={config.owner && config.repo ? `${config.owner}/${config.repo}` : ''}
                  onValueChange={handleRepoSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Or enter manually below
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={config.owner}
                    onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                    placeholder="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository</Label>
                  <Input
                    id="repo-name"
                    value={config.repo}
                    onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                    placeholder="my-notes"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={config.branch}
                  onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                  placeholder="main"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePath">Base Path</Label>
                <Input
                  id="basePath"
                  value={config.basePath}
                  onChange={(e) => setConfig({ ...config, basePath: e.target.value })}
                  placeholder="notes"
                />
                <p className="text-xs text-muted-foreground">
                  Path in repository where notes will be stored
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Configuration
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
