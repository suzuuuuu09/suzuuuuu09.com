# suzuuuuuu09.com

Astro / React portfolio implementation. Editorial sources are maintained in the private portfolio-content repository.

## Local development

From the public code repository root, clone the private content repository
into the ignored `src/content` directory. Git must already be authenticated
with read access to `suzuuuuu09/portfolio-content`:

```sh
git clone https://github.com/suzuuuuu09/portfolio-content.git src/content
```

Then install dependencies and start Astro:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open the URL printed by Astro (normally `http://localhost:4321/blog/`) to
preview the blog. `src/content` is itself the private Git repository and is
ignored by the public repository. Open it as the Obsidian Vault; commit, push,
and pull content changes from that directory.

The clone uses your existing GitHub CLI authentication; local development does
not need `PORTFOLIO_CONTENT_TOKEN`. Publish Desk source is in `tools/publish-desk`.

## Encrypted environment

The root .env contains dotenvx ciphertext and its public key. Never commit
.env.keys, DOTENV_PRIVATE_KEY, plaintext secrets, or other .env files.
Public PR checks need no decryption key. For local development, provide the
existing DOTENV_PRIVATE_KEY through your secure shell environment, or link the
existing private key file locally after cloning:

```sh
ln -s /absolute/path/to/existing-private-checkout/.env.keys .env.keys
chmod 600 /absolute/path/to/existing-private-checkout/.env.keys
git check-ignore .env.keys
```

Replace the path with your existing trusted key file. Do not copy keys into
source files or shell command arguments. Keep the original key file available;
the ignored symlink depends on it. Never use git add -f for key files.
Cloudflare Workers Builds keeps its existing build Secret management; no
keys are registered in Public GitHub Actions.


## Verification

```sh
pnpm test
pnpm run build:check
```

Public CI uses synthetic content when no private checkout is present. Production builds refuse PREVIEW_DRAFTS=true and exclude drafts before content ingestion.

Workers Builds production command: node scripts/build-production.mjs with SKIP_DEPENDENCY_INSTALL=1. Deployment command: env -u PORTFOLIO_CONTENT_TOKEN pnpm exec wrangler deploy --config dist/server/wrangler.json. Production-only content access credentials must never be registered in Public PR workflows. The fetch step pins the content commit and records codeSha/contentSha privately. Replays can set PORTFOLIO_CONTENT_SHA to a full content commit SHA.

### Google Analytics

Production builds (`pnpm run build`) fail if `PUBLIC_GA_TRACKING_ID` is
missing, empty, or still encrypted after dotenvx loads the environment. This
prevents publishing pages without analytics. Check builds
(`pnpm run build:check`) succeed without the ID and omit the analytics tag
even when an ID is configured.

Set the GA4 measurement ID as `PUBLIC_GA_TRACKING_ID` in the Cloudflare Workers
Builds production environment. If the value is encrypted, make sure the
matching dotenvx decryption key is available during the production build. The
tag is embedded in static HTML, so changing only a Worker runtime variable
does not update it. After configuring the ID, rebuild the site and verify that
the published HTML includes the `googletagmanager.com/gtag/js` URL and that
Google Analytics receives traffic in Realtime.
