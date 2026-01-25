# Illustration Library & System

The MindFull theme uses a hybrid illustration system designed for **speed**, **reliability**, and **flexibility**.

## How it Works

The `undraw.html` partial handles illustrations using a 3-tier **local-first** strategy:

1.  **Local Library (Primary):** Checks `assets/illustrations/library/` using flexible pattern matching (case-insensitive, handles various prefixes). This is the fastest and most reliable method.
2.  **Remote Fallback (Secondary):** If not found locally, it consults `data/undraw_remote.json` for known CDN links.
3.  **Placeholder (Fallback):** If both fail, it renders a styled dashed box.

## Usage

```html
{{ partial "undraw.html" (dict "name" "meditation" "width" "w-64") }}
```

- **name:** The slug of the illustration (e.g., `meditation`, `sleep`, `productive-morning`).
- **width/height:** Standard Tailwind classes.

## Available Catalog

We have indexed **1,000+ illustrations** from the UnDraw library. You can find the full list of available slugs in:

- `data/undraw_catalog.json` (Local filenames)
- `data/undraw_remote.json` (Remote CDN links)

## Optimizing for Speed

To keep your production builds fast and your site independent of external repos:

1.  **Bulk Download:** You can download the entire UnDraw library mirror into your `assets/illustrations/library/` folder to ensure every possible illustration loads instantly from your disk.
    - Path: `assets/illustrations/library/`
2.  **Individual Pick:** Find an illustration you like in the catalog, download the SVG, and move it to `assets/illustrations/[name].svg`.
3.  Hugo will now pick it up from your local disk instantly during every subsequent build.

## Maintenance

- **Adding new illustrations:** Simply drop any SVG into `assets/illustrations/`.
- **Updating the library:** The remote fallback is powered by the `cuuupid/undraw-illustrations` mirror.
