import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mdx/mermaid';
import { MastodonEmbed } from '@/components/mdx/mastodon-embed';
import { GitHubCard } from '@/components/mdx/github-card';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Mermaid,
    MastodonEmbed,
    GitHubCard,
    // Render images as plain <img> so they work with static export without
    // next/image width/height requirements. Assets live in /public/images.
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        alt={props.alt ?? ''}
        loading="lazy"
        className="rounded-lg border border-fd-border"
      />
    ),
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
