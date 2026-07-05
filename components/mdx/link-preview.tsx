import { ExternalLink } from 'lucide-react';

/**
 * Rich link preview card. Fetches the target's Open Graph metadata
 * (og:title / og:description / og:image) at build time (static export),
 * so the result is baked into the HTML with no client-side requests.
 */
export async function LinkPreview({ url }: { url: string }) {
  const og = await fetchOG(url);
  const host = safeHost(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="link-preview not-prose"
    >
      {og.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="link-preview__img" src={og.image} alt="" loading="lazy" />
      ) : null}
      <span className="link-preview__body">
        <span className="link-preview__title">{og.title || host}</span>
        {og.description ? (
          <span className="link-preview__desc">{og.description}</span>
        ) : null}
        <span className="link-preview__host">
          <ExternalLink size={13} aria-hidden />
          {host}
        </span>
      </span>
    </a>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function decodeEntities(s?: string) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function fetchOG(
  url: string,
): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; MementomoriDocs/1.0; +https://help.mementomori.social)',
        accept: 'text/html',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const html = (await res.text()).slice(0, 500_000);

    const meta = (prop: string) => {
      const patterns = [
        new RegExp(
          `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
          'i',
        ),
        new RegExp(
          `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`,
          'i',
        ),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return decodeEntities(m[1]);
      }
      return undefined;
    };

    const title =
      meta('og:title') ||
      decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
    const description = meta('og:description') || meta('description');
    let image = meta('og:image') || meta('og:image:url');
    if (image) {
      try {
        image = new URL(image, url).href;
      } catch {
        image = undefined;
      }
    }
    return { title, description, image };
  } catch {
    return {};
  }
}
