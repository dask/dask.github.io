# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information
from datetime import datetime


project = 'Dask'
copyright = f'{datetime.now().year}, Dask Contributors'
author = 'Dask Contributors'
release = '1.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'myst_parser',
]

# MyST parser configuration
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "html_image",
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', '_static/original', '.venv']

language = 'en'

# Source suffix
source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'basic'
html_static_path = ['_static']
html_css_files = []
html_js_files = []

# Disable default theme sidebar
html_sidebars = {
    '**': []
}

# Footer link sections
footer_links = {
    "Get Started": {
        "Latest": "https://docs.dask.org/en/stable/",
    },
    "Community": {
        "Get Help": "https://github.com/dask/dask/issues/new/choose",
        "Demo Day": "https://github.com/dask/community/issues/307",
    },
    "Blog": {
        "Dask Blog": "https://blog.dask.org",
        "Contribute": "https://github.com/dask/dask-blog/blob/gh-pages/README.md",
    },
}

html_context = {
    "footer_links": footer_links,
}

# Don't add default stylesheets
html_style = None
