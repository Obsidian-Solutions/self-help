---
title: 'Illustrations'
weight: 20
---

MindFull uses a hybrid illustration system designed for **speed**, **reliability**, and **flexibility**.

## 1. How it Works

The `undraw.html` partial handles illustrations using a 3-tier **local-first** strategy.

### Lookup Logic

| Tier       | Priority | Method                    | Description                         |
| :--------- | :------- | :------------------------ | :---------------------------------- |
| **Local**  | 1        | `assets/illustrations/`   | Fastest. Flexible pattern matching. |
| **Remote** | 2        | `data/undraw_remote.json` | Fallback to CDN for unindexed SVGs. |
| **Box**    | 3        | CSS Placeholder           | Last resort. Styled dashed box.     |

## 2. Usage

```html
{{ partial "shared/undraw.html" (dict "name" "meditation" "width" "w-64") }}
```

> [!NOTE]
> The `name` parameter can be the slug (e.g., `meditation`) or the full filename. The system handles case-insensitivity and prefix matching automatically.

## 3. Optimizing for Speed

To keep your production builds fast and your site independent of external repos:

- [ ] **Individual Pick**: Find an SVG you like in the `data/undraw_catalog.json` list.
- [ ] **Download**: Save the SVG from unDraw.
- [ ] **Place**: Move it to `assets/illustrations/library/`.
- [ ] **Verify**: Hugo will now bake it into the site instantly during build.

> [!IMPORTANT]
> Local illustrations are minified during the build process, reducing bundle size by up to 40% compared to CDN links.
