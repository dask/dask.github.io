# Asset origins

The website incorporates Dask artwork from
[dask/dask.org at b611c2c](https://github.com/dask/dask.org/tree/b611c2c63cbc11b78805f052ad723d3dbe922d41).
Individual image and font source URLs are listed in
[`src/data/assets.json`](../src/data/assets.json). Third-party artwork and
trademarks retain their owners' rights. The
[Inter](Inter-OFL.txt), [Inconsolata](Inconsolata-OFL.txt) and
[lottie-web](lottie-web-MIT.txt) notices are included here.

The locally served animation JSON was sourced from the Dask site's asset CDN:

- [`dask-home.json`](../public/animations/dask-home.json):
  [Dask Home animation](https://cdn.prod.website-files.com/655926fa24195711dbf38624/655926fa24195711dbf388c3_Dask_Home_2_Updates.json).
- [`type-gauge.json`](../public/animations/type-gauge.json):
  [Type Gauge animation](https://cdn.prod.website-files.com/655926fa24195711dbf38624/6633b38bbf5010e99c1329dc_Type-Gauge.json).

The local PNG posters are generated from the corresponding animations using
[`scripts/lottie-posters.mjs`](../scripts/lottie-posters.mjs). The CDN links are
for attribution only; the site does not load animation data from them.
