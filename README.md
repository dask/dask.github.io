# Dask.org Website

This repository contains the Dask.org website built with Sphinx and MyST Markdown to allow for easier content management in the future.

## Project Structure

```
dask.org/
├── _build/              # Generated HTML output
├── _static/             # Static assets (CSS, JS, images)
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── images/         # Images and logos
│   └── original/       # Original downloaded website (reference)
├── _templates/          # Sphinx templates
│   └── page.html       # Main page template (exact replica)
├── conf.py             # Sphinx configuration
├── index.md            # Main page content (for future refactoring)
├── pyproject.toml      # Python dependencies
├── Makefile            # Build commands
└── README.md           # This file
```

## Setup

### Prerequisites

- Python 3.9 or higher
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

### Installation

The project uses `uv` for dependency management. Dependencies will be automatically installed when you run build commands.

## Building the Site

### One-time Build

```bash
uv run sphinx-build -b html . _build/html
```

Or using Make:

```bash
make html
```

### Live Preview with Auto-rebuild

For development, use the autobuild feature which watches for changes and automatically rebuilds:

```bash
make autobuild
```

This will:
- Build the documentation
- Start a local web server at http://127.0.0.1:8000
- Watch for file changes and automatically rebuild
- Open your browser to preview the site

## Configuration

Key Sphinx settings in `conf.py`:

- **Theme**: `basic` (minimal, allows custom template)
- **Extensions**: `myst_parser` for Markdown support
- **Static files**: Served from `_static/`
- **Templates**: Custom templates in `_templates/`

## Maintenance

### Updating Assets

To update CSS, JavaScript, or images:

1. Place new files in the appropriate `_static/` subdirectory
2. Update references in `_templates/page.html` if needed
3. Rebuild the site

### Modifying Content

Currently, the content is embedded in the template. A long term goal is to factor that our into markdown that can be built with sphinx. Until then to make changes edit `_templates/page.html` directly.

## License

The Dask project is licensed under the New BSD License. See the [Dask repository](https://github.com/dask/dask) for details.

