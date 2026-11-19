# Dask website

Astro keeps pages close to familiar HTML, so routine content and layout edits are straightforward.

1. **Edit.** Start in `src/pages/` for a route. Keep page-specific content beside its page; edit shared content once in `src/components/`, `src/layouts/`, `src/styles/` or `src/data/`, as appropriate. Prefer small Astro, CSS and native browser edits; extract shared code only when it has more than one use. `public/` holds tracked static assets; `dist/` is generated output.
2. **Check.** For environment setup, read [CONTRIBUTING.md](CONTRIBUTING.md). For test commands, see the scripts in [package.json](package.json). Run `npm run format:check` for formatting or `npm run check` for the full suite. Match coverage to the change: verify content on the affected route, check layout at desktop and mobile widths, and exercise changed interactions or redirects. Add a regression to the closest existing suite when changed behavior isn't covered.
3. **Open a PR.** Summarize what changed and list the checks run and their results. Use the Read the Docs PR preview when a hosted visual check helps. Merging to upstream `main` deploys automatically to GitHub Pages via GitHub Actions; ordinary edits need no manual publishing or DNS changes.
