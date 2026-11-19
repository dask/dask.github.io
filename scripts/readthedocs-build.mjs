import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// RTD supplies this version-specific URL, including the language/version mount.
// Do not derive a preview hostname from a PR number or change production config.
assert.ok(
  process.env.READTHEDOCS_CANONICAL_URL,
  'RTD canonical URL is required',
);
assert.ok(process.env.READTHEDOCS_OUTPUT, 'RTD output directory is required');
const url = new URL(process.env.READTHEDOCS_CANONICAL_URL);
assert.equal(url.protocol, 'https:');
assert.equal(url.search + url.hash + url.username + url.password, '');
assert.ok(url.pathname.endsWith('/'), 'RTD mount must end with /');
const base = url.pathname;
const output = path.resolve(process.env.READTHEDOCS_OUTPUT, 'html');
const result = spawnSync(
  process.execPath,
  [
    'node_modules/astro/bin/astro.mjs',
    'build',
    '--site',
    url.origin,
    '--base',
    base,
    '--outDir',
    output,
  ],
  { stdio: 'inherit' },
);
if (result.status !== 0) process.exit(result.status || 1);

// Astro prefixes its generated bundles/CSS URLs with --base, but intentionally
// leaves author-written root-relative HTML links and public images unchanged.
// Rewrite only URL-valued HTML attributes in this RTD artifact, never sources,
// JavaScript, external destinations, fragments, or already-prefixed URLs.
async function mountLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await mountLinks(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = await readFile(file, 'utf8');
      const mounted = html.replace(
        /(\s(?:href|src|poster|action|data-[\w-]+)=)(["'])(\/(?!\/)[^"'<>]*)(\2)/g,
        (match, attribute, quote, value) =>
          value.startsWith(base)
            ? match
            : attribute + quote + base + value.slice(1) + quote,
      );
      await writeFile(file, mounted);
    }
  }
}
await mountLinks(output);
console.log(`Read the Docs artifact: ${output}; canonical/mount: ${url.href}`);
