---
title: 'Branding'
weight: 10
---

MindFull is designed to be reskinned in seconds via centralized configuration.

## 1. Core Visuals

### Branding Configuration

| Property            | File        | Value Type        | Description                           |
| :------------------ | :---------- | :---------------- | :------------------------------------ |
| **Logo Icon**       | `hugo.toml` | FontAwesome Class | The primary icon for header/footer    |
| **Site Title**      | `hugo.toml` | String            | Your organization's name              |
| **Primary Color**   | `hugo.toml` | Hex Code          | Brand identity color (Indigo default) |
| **Secondary Color** | `hugo.toml` | Hex Code          | Accent color (Emerald default)        |

### Branding Checklist

- [ ] Update `site_logo_icon` in `hugo.toml`.
- [ ] Set `title` and `author` in `hugo.toml`.
- [ ] Configure `[params.colors]` to match your brand.
- [ ] Run `npm run build:css` to regenerate styles.

## 2. Configuration Example

```toml
[params]
  site_logo_icon = "fa-solid fa-brain"

[params.colors]
  primary = "#4F46E5"
  secondary = "#10B981"
```

> [!TIP]
> You can use any **FontAwesome 6** free icon for the logo. Simply provide the full class name (e.g., `fa-solid fa-heart-pulse`).

> [!IMPORTANT]
> Always run `npm run build:css` after changing color codes to ensure Tailwind re-compiles the utility classes correctly.
