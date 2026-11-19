# Dask website

The Dask community website is a static Astro site with six pages: Home,
Get Started, Get Help, Powered By, Brand Guide and Press Mentions. Shared
components provide navigation and the footer. Homepage animations use local
Dask Lottie artwork and the standalone light renderer; there is no Webflow runtime.

`src/` contains pages, components, styles and site data. `public/` contains
tracked source assets, including images, fonts, animation JSON, static posters
and legacy HTML. Astro produces `dist/`; generated output, dependencies and test
evidence are ignored by Git.

The build uses Node.js 24 and npm with a committed lockfile. Automated checks
cover formatting, builds, asset integrity, browser interactions, responsive
layouts, animations and redirects.

GitHub Actions CI checks pull requests. The Pages workflow builds and publishes
upstream main, with separate build and deployment jobs and main-only manual
runs. Read the Docs builds native Astro PR previews with version-mounted links,
assets and canonical URLs. The production canonical origin is https://dask.org/.

Blog, events and the news archive routes target https://blog.dask.org/.
Known routes include HTML redirects; unknown scoped paths use the static 404
page and JavaScript. Unrelated missing paths remain 404s. Legacy slides and
closed-survey pages are included. Forms have no submission backend.

Dask content and implementation are attributed to Dask core developers.
[LICENSE.txt](LICENSE.txt) contains the BSD license; [licenses](licenses/)
contains font and renderer notices. Third-party artwork and trademarks retain
their owners' rights. Asset source URLs are recorded in `src/data/assets.json`;
source identities and original animation URLs/hashes are recorded in
`tests/fixtures/provenance.json`.
