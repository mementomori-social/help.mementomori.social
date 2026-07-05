import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // `author` overrides the git last-commit author in the page footer.
    schema: pageSchema.extend({ author: z.string().optional() }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Keep image `src` as plain string paths (assets are served from /public);
    // our custom `img` component renders them as native <img> for static export.
    remarkImageOptions: false,
    // Render ```mermaid code blocks as <Mermaid> diagrams.
    remarkPlugins: [remarkMdxMermaid],
  },
});
