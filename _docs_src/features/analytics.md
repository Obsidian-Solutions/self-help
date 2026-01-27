---
title: 'Search & Analytics'
weight: 30
---

MindFull prioritizes Free and Open Source Software (FOSS) for all supplementary services.

## 1. Static Search (Pagefind)

By default, MindFull uses **Pagefind**, a static search library that runs entirely in the browser.

### Search Providers

| Provider       | Type          | Privacy            | Scale            |
| :------------- | :------------ | :----------------- | :--------------- |
| **Pagefind**   | Static (WASM) | 100%               | Small to Medium  |
| **OpenSearch** | Server-side   | 100% (Self-hosted) | Large/Enterprise |

### Features

- [x] **Zero-Server**: Runs entirely in the browser.
- [x] **High Performance**: Instant results as you type.
- [x] **FOSS**: MIT Licensed.

> [!NOTE]
> To update the search index, you must run the build command:
>
> ```bash
> npm run build
> ```

## 2. FOSS Analytics (Umami)

We recommend **Umami** as a FOSS alternative to Google Analytics. It is privacy-focused and can be self-hosted.

### Setup Checklist

- [ ] Sign up for [Umami Cloud](https://umami.is/) or host your own instance.
- [ ] Add your website to the Umami dashboard.
- [ ] Copy the `Website ID`.
- [ ] Update `hugo.toml` with the configuration below.

```toml
[params.analytics.foss]
  enabled = true
  provider = "umami"
  website_id = "your-uuid-here"
```

> [!IMPORTANT]
> Umami does not use cookies and does not collect personal data, making it fully compliant with MindFull's privacy-first philosophy.

## 3. OpenSearch Integration

If you require a dedicated search cluster for large-scale deployments:

1.  Build the site to generate the `public/` folder.
2.  Use the OpenSearch `bulk` API to ingest the generated JSON data from the Pagefind output.
3.  Update `hugo.toml` to set `provider = 'opensearch'`.
