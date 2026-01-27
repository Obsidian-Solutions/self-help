---
title: 'Branding'
weight: 10
---

MindFull is designed to be reskinned in seconds.

## Site Logo Icon

The main logo icon (displayed in the header, sidebar, and footer) is configurable in `hugo.toml`.

```toml
[params]
  site_logo_icon = "fa-solid fa-brain" # Supports any FontAwesome 6 icon
```

## Theme Colors

The primary and secondary colors are controlled via Tailwind and Hugo params.

```toml
[params.colors]
  primary = "#4F46E5"
  secondary = "#10B981"
```

To update the build, run:

```bash
npm run build:css
```
