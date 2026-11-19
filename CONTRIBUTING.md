# Contributing

Dask is community maintained. Bug reports, documentation, code, and design
contributions are welcome. General guidance:
https://docs.dask.org/en/latest/develop.html.

For website changes, use Node.js 24, install dependencies with `npm ci`,
install Chromium with `npx playwright install --with-deps chromium`, and run
`npm run check`.
Keep route data and shared Astro components DRY; use native browser behavior,
not Webflow/jQuery libraries. Commit the lockfile with dependency changes.
Run `npm run format` before submitting a PR. Include reproducible test evidence
and screenshots when relevant, but do not commit generated evidence/build output.

Do not change public redirect destinations, add submission backends, claim a
custom domain, or modify deployment permissions without explicit maintainer
review. CI runs with read-only permissions on fork PRs; never add secrets or
privileged PR execution. Deployment is main-only and requires administrator
selection of GitHub Actions as the Pages source. Maintainers merge; automation does not.
