# Migration provenance

Approved native Astro source: `dask/dask.org`, commit
`b611c2c63cbc11b78805f052ad723d3dbe922d41`, imported using
`git archive` (tracked paths only). Target base:
`dask/dask.github.io@2e54caa3b0a9660b4a97711117816d134a7daffa`.
The local source checkout's untracked rebuild-file-inventory.txt was not imported.

All six pages, shared components/styles/data, and public assets are imported.
Only three production source files intentionally differ: Footer adds the shared
hosting credit; Site uses Astro's configured canonical origin; footer-papers CSS
puts the credit on its own visible line. Astro config defaults to organization
root Pages and allows a later SITE_URL override. No page content is rebuilt
through Webflow libraries. The full per-file SHA-256 inventory in
`tests/fixtures/provenance.json` is checked by `npm run test:static`.

Public asset origin URLs are preserved in `src/data/assets.json`. Dask content
and native implementation are attributed to Dask core developers and the prior
approved Astro rebuild. Dask's New BSD license text is retained in LICENSE.txt.
Inter and Inconsolata font OFL notices are included in licenses/, sourced from
Google Fonts' respective ofl/inter and ofl/inconsolata directories. Logo,
photograph, and third-party artwork rights remain with their respective owners;
their inclusion is not a blanket BSD relicensing or endorsement claim.

The target had no license file. Its old CONTRIBUTING guidance remains in the
new contributor guide. The old static homepage/assets are removed, not left as
a second competing site. Target slides.html, ml-slides.html and survey.html are
preserved byte-for-byte under public/, with base hashes recorded in the manifest.
The survey was not a redirect: it says the survey is closed and links to Dask
Examples, so that behavior is intentionally unchanged.

## Runnable checks, not historical evidence bulk

Imported source test runner retains six-route responsive/browser smoke, native
interaction, safe forms and keyboard checks. Self-contained round2, round3
(responsive/motion/artwork), and round6 regressions remain runnable; round6 now creates its ignored output directory
on a clean checkout. The sole
round3 frozen narrow-specimen JSON fixture moved to tests/fixtures/; it documents
an original 320px glyph exception, not a new screenshot baseline.

The complete approved source repository retains its historical visual-review
scripts/evidence, including many screenshot rounds. They are not copied here:
round4–14 suites depend on large original geometry/paint/screenshot collections;
round15 additionally opens a live original browser. Migration CI intentionally
does not claim to run these historical fidelity suites or re-certify all visual
states. It runs the retained meaningful standalone checks and new source identity,
canonical, legacy URL, shared-footer and exact scoped-redirect checks offline.
No old results are presented as checks of this migration. A historical whole-page
footer pixel/height comparison would need a new baseline for the requested credit.

The unchanged redirect checker builds both root and project mounts in temporary
directories and exercises 116 browser cases (JS on/off) against a genuine static
404 server. The project-mount test is solely defensive coverage of redirect scope;
production remains root, with no /dask.org base. All external redirect requests
are intercepted. Generated evidence, dist, node_modules, Git objects, private
build paths and bulk reference screenshots are excluded from the migration.
