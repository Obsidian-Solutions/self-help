---
title: 'Search & Analytics'
weight: 30
---

MindFull prioritizes Free and Open Source Software (FOSS) for all supplementary services.

## Search (Pagefind)

By default, MindFull uses **Pagefind**, a static search library that runs entirely in the browser.

- **Privacy**: No tracking, no external server calls.
- **Speed**: Instant results as you type.
- **FOSS**: MIT Licensed.

To update the search index, run:

```bash
npm run build
```

## Analytics (Umami)

We recommend **Umami** as a FOSS alternative to Google Analytics. It is privacy-focused and can be self-hosted.

1.  Sign up for [Umami Cloud](https://umami.is/) or host your own instance.
2.  Add your `website_id` to `hugo.toml`:

```toml
[params.analytics.foss]
  enabled = true
  website_id = "your-uuid-here"
```

## OpenSearch Integration

If you require a dedicated search cluster, you can export the Pagefind index to **OpenSearch**.

1.  Build the site to generate the `public/` folder.
2.  Use the OpenSearch `bulk` API to ingest the generated JSON data.
3.  Update `hugo.toml` to set `provider = 'opensearch'`.
