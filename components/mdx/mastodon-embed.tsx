'use client';

import { useEffect } from 'react';

/**
 * Embeds a Mastodon post using the instance's official /embed iframe and
 * embed.js (which auto-resizes the iframe to the post's height).
 */
export function MastodonEmbed({ url }: { url: string }) {
  const clean = url.replace(/\/+$/, '');
  const src = `${clean}/embed`;
  const scriptSrc = new URL('/embed.js', clean).href;

  useEffect(() => {
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const s = document.createElement('script');
      s.src = scriptSrc;
      s.async = true;
      document.body.appendChild(s);
    }
  }, [scriptSrc]);

  return (
    <iframe
      src={src}
      className="mastodon-embed"
      title="Mastodon post"
      style={{
        maxWidth: '100%',
        width: '100%',
        border: 0,
        margin: '0 0 1.5rem',
      }}
      width={450}
      height={420}
      allowFullScreen
    />
  );
}
