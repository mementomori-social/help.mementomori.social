import { Card } from 'fumadocs-ui/components/card';
import {
  ExternalLink,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequest,
} from 'lucide-react';
import type { ReactNode } from 'react';

const MAX_DIFF_LINES = 40;

/**
 * Renders a GitHub link. Commit links fetch the diff at build time and show the
 * code snippet; repo / pull request links render as a styled card.
 */
export async function GitHubCard({ url }: { url: string }) {
  const info = parse(url);

  if (info.type === 'commit') {
    const commit = await fetchCommit(info.owner, info.repo, info.ref);
    return (
      <div className="commit-embed">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="commit-embed__header"
        >
          <GitCommitHorizontal size={16} aria-hidden />
          <span className="commit-embed__title">
            {commit?.message || info.title}
          </span>
          <span className="commit-embed__repo">
            {info.owner}/{info.repo}@{info.ref.slice(0, 7)}
          </span>
        </a>
        {commit?.diff ? (
          <DiffBlock diff={commit.diff} href={url} truncated={commit.truncated} />
        ) : null}
      </div>
    );
  }

  return (
    <Card
      href={url}
      title={info.title}
      description={info.description}
      icon={info.icon}
      external
      style={{ marginBottom: '0.75rem' }}
    />
  );
}

function DiffBlock({
  diff,
  href,
  truncated,
}: {
  diff: string;
  href: string;
  truncated: boolean;
}) {
  const lines = diff.split('\n');
  return (
    <>
      <pre className="commit-embed__diff">
        <code>
          {lines.map((line, i) => (
            <span key={i} className={`diff-line ${diffClass(line)}`}>
              {line || ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      {truncated ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="commit-embed__more"
        >
          View full diff on GitHub
        </a>
      ) : null}
    </>
  );
}

function diffClass(line: string) {
  if (line.startsWith('+') && !line.startsWith('+++')) return 'diff-add';
  if (line.startsWith('-') && !line.startsWith('---')) return 'diff-del';
  if (line.startsWith('@@')) return 'diff-hunk';
  if (line.startsWith('diff --git') || line.startsWith('index ')) return 'diff-meta';
  return '';
}

async function fetchCommit(
  owner: string,
  repo: string,
  sha: string,
): Promise<{ message: string; diff: string; truncated: boolean } | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'MementomoriDocs/1.0',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      commit?: { message?: string };
      files?: { filename: string; patch?: string }[];
    };
    const message = (data.commit?.message || '').split('\n')[0];

    const chunks: string[] = [];
    for (const f of data.files ?? []) {
      if (!f.patch) continue;
      chunks.push(`--- ${f.filename}`, f.patch);
    }
    const all = chunks.join('\n').split('\n');
    const truncated = all.length > MAX_DIFF_LINES;
    const diff = all.slice(0, MAX_DIFF_LINES).join('\n');
    return { message, diff, truncated };
  } catch {
    return null;
  }
}

function parse(url: string): {
  type: 'commit' | 'pull' | 'repo' | 'other';
  owner: string;
  repo: string;
  ref: string;
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
        type: 'commit',
        owner,
        repo,
        ref,
        title: `${base}@${ref.slice(0, 7)}`,
        description: 'Commit on GitHub',
        icon: <GitCommitHorizontal />,
      };
    }
    if (type === 'pull' && ref) {
      return {
        type: 'pull',
        owner,
        repo,
        ref,
        title: `${base} #${ref}`,
        description: 'Pull request on GitHub',
        icon: <GitPullRequest />,
      };
    }
    if (repo) {
      return {
        type: 'repo',
        owner,
        repo,
        ref: '',
        title: base,
        description: 'Repository on GitHub',
        icon: <FolderGit2 />,
      };
    }
    return {
      type: 'other',
      owner: owner ?? '',
      repo: '',
      ref: '',
      title: base,
      description: 'GitHub',
      icon: <ExternalLink />,
    };
  } catch {
    return {
      type: 'other',
      owner: '',
      repo: '',
      ref: '',
      title: url,
      description: 'GitHub',
      icon: <ExternalLink />,
    };
  }
}
