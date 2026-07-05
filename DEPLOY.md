# Deploying help.mementomori.social

The site is a static build (`npm run build` -> `out/`) hosted on Cloudflare Pages.
Pick ONE of the two methods below.

## Method A: Cloudflare Pages Git integration (recommended)

No API token, no secrets. Cloudflare builds and deploys on every push to `main`,
and you get preview deployments for pull requests.

1. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Pick the repo `mementomori-social/help.mementomori.social`.
3. Build settings:
   - Framework preset: None (or Next.js Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
4. Save and Deploy. The first build gives you a `*.pages.dev` URL.
5. Custom domain: in the Pages project -> Custom domains -> Set up a custom domain
   -> `help.mementomori.social`. Since the zone is on Cloudflare, the DNS record
   and SSL are created automatically.

After this, delete or ignore the GitHub Actions workflow (it will just run the
build as a CI check and skip deploying).

## Method B: GitHub Actions + wrangler

Deploys from CI using the committed workflow in `.github/workflows/deploy.yml`.

1. Create a Cloudflare API token (My Profile -> API Tokens -> Create Token ->
   Custom token) with permission: Account -> Cloudflare Pages -> Edit.
2. Copy your Cloudflare Account ID (dashboard right sidebar / Pages overview).
3. In the GitHub repo -> Settings -> Secrets and variables -> Actions, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Push to `main`. The workflow builds and runs `wrangler pages deploy out`,
   creating the `help-mementomori-social` Pages project on first run.
5. Attach the custom domain `help.mementomori.social` in the Pages project
   (same as Method A, step 5).

Until the secrets exist, the workflow still runs the build as a CI check and
skips the deploy step (no failures).
