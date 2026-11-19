import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

// Serve the output as a real static host: no SPA rewrite or HTTP redirects.
async function serve(root, mount = '/') {
  const notFound = await readFile(path.join(root, '404.html'));
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
      if (pathname.startsWith(mount)) {
        let file = path.resolve(root, pathname.slice(mount.length));
        if (file === root || file.startsWith(root + path.sep)) {
          if ((await stat(file)).isDirectory())
            file = path.join(file, 'index.html');
          const data = await readFile(file);
          response.writeHead(200, {
            'content-type':
              types[path.extname(file)] || 'application/octet-stream',
          });
          response.end(data);
          return;
        }
      }
    } catch {
      // A missing file or malformed path gets the built 404 page.
    }
    response.writeHead(404, { 'content-type': 'text/html' });
    response.end(notFound);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

export default async function setup() {
  const dist = path.resolve('dist');
  try {
    await access(path.join(dist, 'index.html'));
  } catch {
    throw new Error(
      'Missing dist/index.html; run npm run build before npm test.',
    );
  }
  const output = await mkdtemp(path.join(tmpdir(), 'dask-site-test-'));
  const servers = [];
  const cleanup = async () => {
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
    await rm(output, { recursive: true, force: true });
  };

  try {
    const mount = '/en/59/';
    const canonical = 'https://preview.example.invalid' + mount;
    await promisify(execFile)(
      process.execPath,
      ['scripts/readthedocs-build.mjs'],
      {
        env: {
          ...process.env,
          READTHEDOCS_CANONICAL_URL: canonical,
          READTHEDOCS_OUTPUT: output,
        },
      },
    );
    const mounted = path.join(output, 'html');
    for (const [dir, prefix] of [
      [dist, '/'],
      [mounted, mount],
    ]) {
      servers.push(await serve(dir, prefix));
    }
    process.env.TEST_SITE_URL =
      'http://127.0.0.1:' + servers[0].address().port + '/';
    process.env.TEST_MOUNTED_URL =
      'http://127.0.0.1:' + servers[1].address().port + mount;
    process.env.TEST_MOUNTED_CANONICAL = canonical;
  } catch (error) {
    await cleanup();
    throw error;
  }
  return cleanup;
}
