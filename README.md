# Dask website

Six native Astro pages for the Dask community website, served as a static site.
The initial target is **https://dask.github.io/** (an organization-root Pages
site, not a project mounted at /dask.org). No Webflow runtime is used.

## Develop and check

Use Node.js 24 and npm. All dependency versions are locked.

```sh
npm ci
npx playwright install --with-deps chromium
npm run dev
# Stop the development server, then:
npm run check
```

`check` runs formatting, the production build, static integrity/provenance checks,
browser smoke and interaction regressions, and 116 Pages-style redirect cases.
The browser suite checks all six routes at desktop/tablet/phone widths, local
assets, runtime errors, overflow, navigation, tabs, dialogs, clipboard, animation,
and the visible hosting credit immediately below copyright on every page.
It starts/stops its own production preview; optional `BASE_URL` selects an
already-running local preview. Generated test reports/screenshots go to ignored
`evidence/`. Tests do not require the live original site and never submit forms
or navigate to external redirect destinations. Chromium is the automated engine;
this is not a cross-browser or exact visual-equivalence certification.

## Source files versus generated output

`public/` is **source input**, not generated output: Astro copies these checked-in
images, fonts and preserved legacy HTML documents into each build. Keep them
tracked. The generated `dist/`, `.astro/`, `node_modules/`, and test `evidence/`
are ignored and untracked. Read the Docs output `_readthedocs/` is ignored too.
The same source can build for Pages or Read the Docs without committing output.

## Read the Docs PR previews

The already-configured `daskorg` project builds PR previews from
`.readthedocs.yaml`: Ubuntu 24.04, supported Node.js 24, locked `npm ci`, then a
native Astro HTML build into `$READTHEDOCS_OUTPUT/html`. No Sphinx, uv, Python
environment, deploy credential or Pages permission is needed. The helper uses
RTD's `READTHEDOCS_CANONICAL_URL`, including its language/version mount, for
preview canonicals and asset URLs. It prefixes author-written root-relative HTML
links in the **generated preview only**; source files and Pages output stay
unchanged. Never guess a preview URL from the PR number: follow the successful
RTD check/build's actual preview link.

```sh
npm run test:readthedocs
# Or reproduce the RTD build job locally, with output outside this checkout:
READTHEDOCS_CANONICAL_URL=https://preview.example.invalid/en/59/ \
READTHEDOCS_OUTPUT=/tmp/dask-rtd-reproduction node scripts/readthedocs-build.mjs
```

The focused check builds real root/version-mounted artifacts on dynamic local
ports and checks six routes, canonicals, local assets and internal links, the
hosting credit, brand image states, scoped redirects and unrelated 404s.
`npm run check` includes this focused preview gate as well as the production
Pages regressions. The RTD project must retain PR builds and the
GitHub integration; failed builds expose diagnostics in their RTD build page.
PR builds must not receive production secrets or execute privileged deployment
hooks. Public preview content is untrusted PR output, not a production release.

RTD can also host the production static Astro HTML: its custom build interface
supports arbitrary HTML generators, and the helper uses each version's supplied
canonical URL rather than a fixed PR URL. **This change only enables previews;
it does not select RTD as the production host.** If maintainers later choose RTD,
an administrator must select the production/default version and URL/versioning
policy in RTD, verify the generated artifact and redirect/404 behavior on that
host (RTD's hosted 404 behavior may differ from Pages), then separately coordinate
any domain/DNS/certificate cutover and the Pages deployment opt-in. Do not enable
two competing production publishers. Keep the existing hosting credit unchanged
until maintainers explicitly request a hosting/credit change.

Official references, checked 2026-11-19:

- https://docs.readthedocs.com/platform/stable/build-customization.html
- https://docs.readthedocs.com/platform/stable/config-file/v2.html
- https://docs.readthedocs.com/platform/stable/reference/environment-variables.html

## Deployment: administrator action required

**This migration does not change Pages settings, deploy, or change DNS.**
At migration inspection, Pages was legacy, main branch, root directory, no
custom domain. A legacy source cannot build Astro. Coordinate the switch with
merging this migration so the old legacy publisher does not briefly serve a
repository without a generated root index.

1. Review the pull request and its CI, then merge only with human approval.
2. A repository administrator must select **Settings → Pages → Build and
   deployment → Source → GitHub Actions**, before deploying.
3. Under **Settings → Actions → General**, allow the pinned official actions
   and workflow execution. Organization policy must allow the explicit job
   permissions: build has contents/page metadata read; deploy alone has Pages
   write and OIDC token write. Do not enable write tokens or secrets for fork
   PRs, and do not replace CI with pull_request_target.
4. Under **Settings → Environments → github-pages**, restrict deployment branches
   to main and configure required human reviewers as appropriate.
5. Under **Settings → Secrets and variables → Actions → Variables**, set
   `PAGES_DEPLOY_ENABLED=true` only when ready. Leave `SITE_URL` unset for the
   preview. Run **Actions → GitHub Pages → Run workflow → main**. Subsequent
   pushes to main deploy while this explicit opt-in remains enabled.
6. Verify https://dask.github.io/ in a real browser: all six pages, credit,
   mobile navigation, assets, known redirects, arbitrary blog/event URLs,
   and unrelated 404s. CI is not proof of a successful live deployment.

Forks, PR events, and manual non-main refs cannot use the deployment job.
Build/upload and deployment are separate jobs in one trusted workflow; only
`dist/` is uploaded. No repository credentials persist in checkout.
Remove/disable the opt-in to stop future deployments; this does not roll back
an already published site. Revert through a reviewed commit and redeploy for
rollback.

### Later optional custom domain cutover

First accept the GitHub preview. A separately authorized administrator may then
verify domain ownership in GitHub, coordinate existing hosting and DNS, configure
Pages for dask.org (and www.dask.org as appropriate), point DNS to GitHub's
documented Pages targets, wait for certificates, and enforce HTTPS. Choose one
canonical hostname and set the repository `SITE_URL` variable to its HTTPS
origin before rebuilding. Leave Astro's base at root. Test both hostnames and
canonical tags after cutover; preserve email/unrelated DNS records and retain a
rollback plan. **No CNAME file, domain claim, or DNS change is included here.**
For Actions publishing, manage the custom domain in Pages settings; a CNAME file
is not needed to configure the workflow.

## Redirects and boundaries

`src/data/redirects.json` is authoritative. /blog, /blog/_, /events, /events/_
and /archive/2022-news-events target **exactly https://blog.dask.org/**,
discarding old suffix/query/fragment. Known routes emit HTML/meta-refresh
fallbacks; unknown scoped descendants use the actual static-host 404 plus
JavaScript. Without JS, unknown descendants show a helpful 404 with a blog link.
These are not HTTP 301 responses. Unrelated missing URLs never redirect.

Legacy /slides.html and /ml-slides.html retain their exact Google Slides targets;
/survey.html retains the existing closed-survey message and Dask Examples link.
They are copied byte-for-byte from the old site. Forms retain the approved
truthful “Not sent” behavior: there is no backend.

## Provenance and licensing

See [PROVENANCE.md](PROVENANCE.md), [LICENSE.txt](LICENSE.txt), and
[licenses](licenses/). Original public artwork/font source URLs remain in
`src/data/assets.json`; trademarks and third-party assets retain their owners'
rights. Historical visual evidence stays in the source repository, not here.

This Astro migration supersedes the approach in
[dask/dask.github.io#58](https://github.com/dask/dask.github.io/pull/58)
(Sphinx/Read the Docs). That older PR is not closed by this work.

## Official deployment references

Verified 2026-11-19:

- https://docs.astro.build/en/guides/deploy/github/
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

Astro recommends its official action; this repository uses the also-supported
explicit npm build plus GitHub's official configure/upload/deploy actions to
keep build tooling and job permissions auditable. Action SHAs resolve the
commented major-version refs; review upstream changes before updating pins.
