import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(
  await readFile('tests/fixtures/provenance.json', 'utf8'),
);
const hash = (data) => createHash('sha256').update(data).digest('hex');
let unchanged = 0;
for (const [file, expected] of Object.entries(manifest.imported)) {
  if (manifest.intentionalChanges.includes(file)) continue;
  assert.equal(
    hash(await readFile(file)),
    expected,
    `approved source identity: ${file}`,
  );
  unchanged++;
}
for (const [file, expected] of Object.entries(manifest.legacy)) {
  assert.equal(hash(await readFile('public/' + file)), expected, file);
  assert.equal(
    hash(await readFile('dist/' + file)),
    expected,
    'built legacy ' + file,
  );
}
const origin = 'https://dask.org';
for (const slug of [
  '',
  'get-started',
  'get-help',
  'powered-by',
  'brand-guide',
  'press-mentions',
]) {
  const html = await readFile(
    `dist/${slug ? slug + '/' : ''}index.html`,
    'utf8',
  );
  assert.ok(
    html.includes(
      `rel="canonical" href="${new URL('/' + (slug ? slug + '/' : ''), origin).href}"`,
    ),
    'canonical ' + slug,
  );
  assert.ok(html.includes('Hosted by GitHub Pages'), 'hosting credit ' + slug);
  assert.ok(
    !/webflow\.js|jquery|cdn\.prod\.website-files/i.test(html),
    'native runtime ' + slug,
  );
}
assert.ok(
  !(await readdir('dist')).includes('CNAME'),
  'no premature custom domain',
);
const mappings = JSON.parse(await readFile('src/data/redirects.json', 'utf8'));
assert.equal(mappings.length, 5);
assert.ok(
  mappings.every(
    (m) =>
      m.destination === 'https://blog.dask.org/' && m.status === 'resolved',
  ),
);
console.log(
  `${unchanged} unchanged source/asset identities, 3 legacy documents, 6 root canonicals/credits, native runtime, domain and redirect integrity passed.`,
);
