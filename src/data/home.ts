import { docs } from './site';
export const workloads = [
  {
    title: 'Big Pandas',
    text: 'Dask DataFrames use pandas under the hood, so your current code likely just works. It’s faster than Spark and easier too.',
    href: docs + 'dataframe.html',
    secondary: {
      label: 'Performance Benchmarks',
      href: 'https://docs.coiled.io/blog/tpch.html?utm_source=dask.org&utm_medium=homepage',
    },
    logos: [
      'Parquet_logo.svg',
      'Apache-arrow-logo.svg',
      'Pandas_logo-gray.svg',
    ],
    code: `import dask.dataframe as dd\n\ndf = dd.read_parquet("s3://data/uber/")\n\n# How much did NYC pay Uber?\ndf.base_passenger_fare.sum().compute()\n\n# And how much did drivers make?\ndf.driver_pay.sum().compute()`,
  },
  {
    title: 'Parallel For Loops',
    text: 'Parallelize your Python code, no matter how complex. Dask is flexible and supports arbitrary dependencies and fine-grained task scheduling.',
    href: docs + 'futures.html',
    secondary: {
      label: 'Process 5,000 files in parallel',
      href: 'https://docs.coiled.io/user_guide/arxiv-matplotlib.html?utm_source=dask.org&utm_medium=homepage',
    },
    logos: [],
    code: `from dask.distributed import Client\n\nclient = Client()\n\n# Define your own code\ndef f(x):\n    return x + 1\n\n# Run your code in parallel\nfutures = client.map(f, range(100))\nresults = client.gather(futures)`,
  },
  {
    title: 'Big Arrays',
    text: 'Use Dask and NumPy/Xarray to churn through terabytes of multi-dimensional array data in formats like HDF, NetCDF, TIFF, or Zarr.',
    href: docs + 'array.html',
    secondary: {
      label: 'Aggregate 250 TB of Water Model Data',
      href: 'https://docs.coiled.io/blog/coiled-xarray.html?utm_source=dask.org&utm_medium=homepage',
    },
    logos: ['NumPy-logo.svg', 'Xarray-Logo.svg', 'zarr-logo.svg'],
    code: `import xarray as xr\n\n# Open image/array files natively\nds = xr.open_mfdataset("data/*.nc")\n\n# Process across dimensions\nds.mean(dims=["lat", "lon"]).compute()`,
  },
  {
    title: 'Machine Learning',
    text: 'Use Dask with common machine learning libraries to train or predict on large datasets, increasing model accuracy by using all of your data.',
    href: docs + 'ml.html',
    secondary: {
      label: 'Example: XGBoost Model Training',
      href: 'https://docs.coiled.io/user_guide/xgboost.html?utm_source=dask.org&utm_medium=homepage',
    },
    logos: [
      'xGBoost-logo.svg',
      'PyTorch_logo_black-1.svg',
      'optuna-logo.svg',
      'scikit-learn-logo.svg',
    ],
    code: `import xgboost as xgb\nimport dask.dataframe as dd\n\ndf = dd.read_parquet("s3://my-data/")\ndtrain = xgb.dask.DaskDMatrix(df)\n\nmodel = xgb.dask.train(\n    dtrain,\n    {"tree_method": "hist", ...},\n    ...\n)`,
  },
];
export const deployments = [
  {
    title: 'Open Source Deployment',
    text: 'Run Dask on your laptop (it’s trivial) or deploy it on any resource manager like Kubernetes, an HPC job schedulers, cloud SaaS services, or even legacy Hadoop/Spark clusters.',
    href: docs + 'deploying.html',
    video: 'https://www.youtube.com/watch?v=faFncNrXmIY',
    videoLabel: 'Dask deployment video',
    logos: [
      'Kubernetes_logo.svg',
      'Yarn-logo-kitten.svg',
      'Slurm_logo.svg',
      'lsf-logo-svg-vector-2.svg',
      'openPBS-logo.svg',
    ],
    code: `from dask.distributed import LocalCluster\n\ncluster = LocalCluster(\n    processes=False,\n)\nclient = cluster.get_client()\n\n# Use Dask locally\nimport dask.dataframe as dd\ndf = dd.read_parquet("/path/to/data.parquet")\ndf.value.mean().compute()`,
  },
  {
    title: 'Managed Cloud',
    text: 'Run Dask in the cloud with open source Kubernetes, or with an easy SaaS solution. Coiled is free for individuals with modest use and easy for anyone with a cloud account.',
    href: 'https://docs.coiled.io/user_guide/index.html?utm_source=dask.org&utm_medium=homepage',
    video: 'https://youtu.be/SfPzmIqMKp0',
    videoLabel: 'Video: Dask in the Cloud',
    logos: [
      'Amazon_Web_Services_Logo.svg',
      'Google_Cloud_logo.svg',
      'Microsoft_Azure_Logo.svg',
    ],
    code: `from coiled import Cluster\n\ncluster = Cluster(\n    n_workers=100, region="us-east-2",\n)\nclient = cluster.get_client()\n\n# Use Dask on the cloud\nimport dask.dataframe as dd\ndf = dd.read_parquet("s3://data.*.parquet")\ndf.value.mean().compute()`,
  },
];
