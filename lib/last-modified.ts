import { execFileSync } from 'node:child_process';

export interface GitInfo {
  date: string;
  author: string;
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
