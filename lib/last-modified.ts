import { execFileSync } from 'node:child_process';

export interface GitInfo {
  date: string;
  author: string;
  /** Link to the commit on GitHub (only set by the API resolver). */
  url?: string;
}

const cache = new Map<string, GitInfo | null>();

/** Last commit date + author for a repo-relative file path (build time). */
export function getGitInfo(file: string): GitInfo | null {
  if (cache.has(file)) return cache.get(file) ?? null;

  let result: GitInfo | null = null;
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%aI%x00%an', '--', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (out) {
      const [date, author] = out.split('\0');
      if (date) result = { date, author: author ?? '' };
    }
  } catch {
    result = null;
  }

  cache.set(file, result);
  return result;
}

const ghCache = new Map<string, Promise<GitInfo | null>>();

/**
 * Last commit date + GitHub username for a repo-relative file path, resolved
 * from the GitHub API at build time. `author` is the committer's GitHub login
 * (falls back to the git author name when the email isn't linked to an account).
 */
export function getGitHubInfo(repo: string, file: string): Promise<GitInfo | null> {
  const key = `${repo}:${file}`;
  const cached = ghCache.get(key);
  if (cached) return cached;

  const p = fetchGitHubInfo(repo, file);
  ghCache.set(key, p);
  return p;
}

async function fetchGitHubInfo(repo: string, file: string): Promise<GitInfo | null> {
  try {
    const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(file)}&per_page=1`;
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'help.mementomori.social',
    };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const res = await fetch(url, { headers });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      sha: string;
      html_url?: string;
      author: { login?: string } | null;
      commit: { committer?: { date?: string }; author?: { date?: string; name?: string } };
    }>;
    const c = Array.isArray(data) ? data[0] : null;
    if (!c) return null;

    const date = c.commit?.committer?.date ?? c.commit?.author?.date;
    if (!date) return null;
    return {
      date,
      author: c.author?.login ?? c.commit?.author?.name ?? '',
      url: c.html_url ?? `https://github.com/${repo}/commit/${c.sha}`,
    };
  } catch {
    return null;
  }
}

/** "3 days ago", "2 months ago", ... relative to build time. */
export function formatRelative(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const s = diff / 1000;
  if (s < 45) return rtf.format(-Math.round(s), 'second');
  const m = s / 60;
  if (m < 45) return rtf.format(-Math.round(m), 'minute');
  const h = m / 60;
  if (h < 24) return rtf.format(-Math.round(h), 'hour');
  const d = h / 24;
  if (d < 30) return rtf.format(-Math.round(d), 'day');
  const mo = d / 30.44;
  if (mo < 12) return rtf.format(-Math.round(mo), 'month');
  return rtf.format(-Math.round(d / 365.25), 'year');
}
