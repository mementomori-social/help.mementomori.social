import { Card } from 'fumadocs-ui/components/card';
import {
  ExternalLink,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequest,
} from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Renders a GitHub repo / pull request / commit link as a styled card
 * (replacement for GitBook's rich link embeds). Fully static, no API calls.
 */
export function GitHubCard({ url }: { url: string }) {
  const { title, description, icon } = parse(url);
  return (
    <Card href={url} title={title} description={description} icon={icon} external />
  );
}

function parse(url: string): {
  title: string;
  description: string;
  icon: ReactNode;
} {
  try {
    const u = new URL(url);
    const [owner, repo, type, ref] = u.pathname.split('/').filter(Boolean);
    const base = repo ? `${owner}/${repo}` : owner;

    if (type === 'commit' && ref) {
      return {
        title: `${base}@${ref.slice(0, 7)}`,
        description: 'Commit on GitHub',
        icon: <GitCommitHorizontal />,
      };
    }
    if (type === 'pull' && ref) {
      return {
        title: `${base} #${ref}`,
        description: 'Pull request on GitHub',
        icon: <GitPullRequest />,
      };
    }
    if (repo) {
      return {
        title: base,
        description: 'Repository on GitHub',
        icon: <FolderGit2 />,
      };
    }
    return { title: base, description: 'GitHub', icon: <ExternalLink /> };
  } catch {
    return { title: url, description: 'GitHub', icon: <ExternalLink /> };
  }
}
