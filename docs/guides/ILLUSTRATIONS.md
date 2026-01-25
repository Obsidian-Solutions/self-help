# Illustration Library & System

The MindFull theme uses a hybrid illustration system designed for **speed**, **reliability**, and **flexibility**.

## How it Works

The `undraw.html` partial handles illustrations using a 3-tier strategy:

1.  **Local (Primary/Fastest):** Checks `assets/illustrations/` for an exact match. Use this for your most-used images to ensure zero-latency builds and instant loading.
2.  **Remote (Secondary/Library):** If not found locally, it consults the catalog in `data/undraw_catalog.json` and fetches the SVG from a high-speed GitHub mirror at build-time.
3.  **Placeholder (Fallback):** If both fail, it renders a styled dashed box with the illustration name to prevent layout shifts.

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

1.  Find an illustration you like in the catalog.
2.  Download the SVG (or let Hugo fetch it once).
3.  Move it to `assets/illustrations/[name].svg`.
4.  Hugo will now pick it up from your local disk instantly during every subsequent build.

## Maintenance

- **Adding new illustrations:** Simply drop any SVG into `assets/illustrations/`.
- **Updating the library:** The remote fallback is powered by the `cuuupid/undraw-illustrations` mirror.
