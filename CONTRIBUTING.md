# Contributing

Dask is community maintained. Bug reports, documentation, code, and design
contributions are welcome. General guidance:
https://docs.dask.org/en/latest/develop.html.

For website changes, follow the Node.js 24 setup and `npm run check` in README.
Keep route data and shared Astro components DRY; use native browser behavior,
not Webflow/jQuery libraries. Commit the lockfile with dependency changes.
Run `npm run format` before submitting a PR. Include reproducible test evidence
and screenshots when relevant, but do not commit generated evidence/build output.

Do not change public redirect destinations, add submission backends, claim a
custom domain, or modify deployment permissions without explicit maintainer
review. CI runs with read-only permissions on fork PRs; never add secrets or
privileged PR execution. Deployment is main-only and requires administrator
setup and opt-in described in README. Maintainers merge; automation does not.
