import assets from './assets.json';
export function asset(name: string) {
  const key = name.startsWith('/assets/') ? name : `/assets/${name}`;
  const matches = assets.filter(
    (a) => a.path.toLowerCase() === key.toLowerCase(),
  );
  if (matches.length !== 1)
    throw new Error(`Unknown or ambiguous artwork: ${name}`);
  return matches[0].path;
}

export const docs = 'https://docs.dask.org/en/stable/';
export const demo = 'https://github.com/dask/community/issues/307';
export const socials = [
  ['git-hub.svg', 'GitHub', 'https://github.com/dask/dask'],
  ['twitter.svg', 'Twitter', 'https://twitter.com/dask_dev'],
  ['youtube.svg', 'YouTube', 'https://www.youtube.com/c/Dask-dev'],
  [
    'stack-x.svg',
    'Stack Overflow',
    'https://stackoverflow.com/questions/tagged/dask',
  ],
  ['chat.svg', 'Dask Discourse', 'https://dask.discourse.group'],
];
export const supporters = [
  {
    name: 'Anaconda',
    image: 'anaconda.png',
    href: 'http://anaconda.com',
    text: 'Dask is installed by default in Anaconda',
  },
  {
    name: 'Coiled',
    image: 'coiled-black-logo.png',
    href: 'http://coiled.io',
    text: 'Coiled makes Dask infrastructure accessible to everyone',
  },
  {
    name: 'NVIDIA',
    image: 'nvidia.png',
    href: 'https://www.nvidia.com/en-us/deep-learning-ai/software/rapids/',
    text: 'Dask integrates with RAPIDS cuDF, XGBoost, and RAPIDS cuML for GPU-accelerated data analytics and machine learning.',
  },
  {
    name: 'Saturn Cloud',
    image: 'saturn-cloud.png',
    href: 'https://saturncloud.io',
    text: 'Saturn Cloud lets users create Dask clusters in a hosted platform or within their own AWS accounts.',
  },
];
export const companies = [
  'barclays',
  'capital-one',
  'chan-zuckerberg-initiative',
  'citi-bank',
  'deshaw-co',
  'grubhub',
  'microsoft',
  'mit',
  'nasa',
  'nih',
  'novartis',
  'oak-ridge',
  'shell',
  'us-air-force',
  'walmart',
  'wayfair',
];
export const projects = [
  'cesium',
  'contra-force',
  'dataprep',
  'datashader',
  'featuretools',
  'intake',
  'iris',
  'kartothek',
  'light-gbm',
  'mo-analysis',
  'napari',
  'numpy',
  'pandas',
  'pangeo',
  'prefect',
  'rapids',
  'satpy',
  'scikit-allel',
  'scikit-image',
  'scikit-learn',
  'skyportal',
  'snorkel',
  'stumpy',
  'tpot',
  'tsfresh',
  'xarray',
  'Xarray-Spatial',
  'xGBoost',
];
export const learn = [
  [
    'Introduction to Dask',
    'This 7-minute video provides a short overview of Dask.',
    'Watch the video',
    'https://youtu.be/nnndxbr_Xq4',
  ],
  [
    '10 Minutes to Dask',
    'This document gives new users an overview of what you can do with Dask.',
    'Read the overview',
    docs + '10-minutes-to-dask.html',
  ],
  [
    'Dask Tutorial',
    'This collection of Jupyter Notebooks, presented in the Dask Tutorial at SciPy, helps new users get started with Dask.',
    'Start the tutorial',
    'https://tutorial.dask.org/',
  ],
  [
    'Dask Video Tutorial',
    'This 90-minute video covers the basics of using Dask.',
    'Watch the tutorial',
    'https://www.youtube.com/watch?v=_u0OQm9qf_A',
  ],
  [
    'Dask Tutorial Recording',
    'This video is a recording of a three-hour Dask tutorial presented at SciPy 2020.',
    'Watch the recording',
    'https://www.youtube.com/watch?v=EybGGLbLipI',
  ],
];
export const explore = [
  [
    'Ecosystem',
    'Browse the ecosystem to learn more about the open source projects that extend the Dask interface and provide different mechanisms for deploying Dask clusters.',
    'Browse the ecosystem',
    '/powered-by',
    '♧',
  ],
  [
    'Case studies',
    'Get inspired by learning how people are using Dask in the real world today, from biomedical research and earth science to financial services and urban engineering.',
    'Read real stories',
    'https://stories.dask.org/en/latest/',
    '♧',
  ],
  [
    'Examples',
    'Explore these examples of APIs to see how you can use Dask in a variety of situations. You can also run these examples in a live session with Binder.',
    'Explore examples',
    'https://examples.dask.org/',
    '▤',
  ],
];
export const deeper = [
  ['Dask Best Practices', docs + 'best-practices.html'],
  ['Dask Documentation', docs],
  ['Talks and Tutorials', docs + 'presentations.html'],
  ['The Dask Blog', 'https://blog.dask.org'],
  ['Dask YouTube Channel', 'https://www.youtube.com/c/Dask-dev/videos'],
];
export const colors = [
  ['White', '#FFFFFF'],
  ['Green', '#61BA92'],
  ['Light Gray', '#F6F6F6'],
  ['Blue', '#1F5AFF'],
  ['Gray', '#EBEAEE'],
  ['Navy', '#183D72'],
  ['Yellow', '#FFC11E'],
  ['Gray Black', '#33363D'],
  ['Salmon', '#FC6E6B'],
  ['Dark Gray', '#262326'],
  ['Pink', '#EF1561'],
  ['Black', '#080815'],
];
