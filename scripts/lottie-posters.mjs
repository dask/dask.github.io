// Regenerate deterministic no-JS/reduced-motion posters from the original data.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  for (const name of ['dask-home', 'type-gauge']) {
    const data = JSON.parse(await readFile(`public/animations/${name}.json`));
    const page = await browser.newPage({
      viewport: { width: data.w, height: data.h },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      '<style>html,body{margin:0;background:transparent}#art{width:100vw;height:100vh}</style><div id="art"></div>',
    );
    await page.addScriptTag({
      path: 'node_modules/lottie-web/build/player/lottie_light.min.js',
    });
    await page.evaluate(
      (data) =>
        new Promise((resolve) => {
          const animation = window.lottie.loadAnimation({
            container: document.querySelector('#art'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: data,
          });
          animation.addEventListener('DOMLoaded', () => {
            animation.goToAndStop(48, true);
            resolve(true);
          });
        }),
      data,
    );
    await page.screenshot({
      path: `public/animations/${name}.png`,
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
