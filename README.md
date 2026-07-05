# help.mementomori.social

Documentation site for [Mementomori.social](https://mementomori.social), built with [Fumadocs](https://fumadocs.dev) (Next.js, static export). Ported from GitBook.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Content

Docs live in `content/docs/` as MDX. The sidebar order comes from `meta.json` files. Images are served from `public/images/`.

- `content/docs/index.mdx` is the home page (`/`).
- Folders map to URL segments and sidebar groups (title set in each folder's `meta.json`).

## Build

```bash
npm run build
```

Outputs a fully static site to `out/`.

## Deployment

Hosted on Cloudflare Pages. Pushing to `main` triggers a deploy.

- Build command: `npm run build`
- Build output directory: `out`
