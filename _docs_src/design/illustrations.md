---
title: 'Illustrations'
weight: 20
---

MindFull uses a hybrid illustration system designed for **speed**, **reliability**, and **cinematic polish**.

## 1. Visual Presentation

All illustrations in MindFull are automatically enhanced by the **Premium Frame Engine**.

### Course Image Wrapper

Use the `.course-image-wrapper` to ensure your visuals match the platform's high-fidelity aesthetic:

- 🧊 **Squircle Shape**: Enforces a consistent 3rem rounded "Squircle" border.
- цент **Perfect Centering**: Automatically centers SVGs without clipping.
- 🎨 **Mesh Background**: Injects a subtle, dual-radial gradient behind the image.
- 🚀 **Interactive Scale**: Automatically scales to 105% on parent card hover.

```html
<div class="course-image-wrapper w-full p-12">
  {{ partial "shared/undraw.html" (dict "name" "meditation") }}
</div>
```

---

## 2. Rendering Logic

The `undraw.html` partial handles illustrations using a 3-tier **local-first** strategy.

### Lookup Logic

| Tier       | Priority | Method                    | Description                         |
| :--------- | :------- | :------------------------ | :---------------------------------- |
| **Local**  | 1        | `assets/illustrations/`   | Fastest. Flexible pattern matching. |
| **Remote** | 2        | `data/undraw_remote.json` | Fallback to CDN for unindexed SVGs. |
| **Box**    | 3        | CSS Placeholder           | Last resort. Styled dashed box.     |

---

## 3. Tooltip-Free Experience

The illustration engine automatically **strips title and desc tags** from raw SVGs. This ensures users can hover over images without seeing distracting browser-default tooltips containing filenames.

## 4. Optimizing for Speed

- [ ] **Download**: Save an SVG from unDraw or your favorite library.
- [ ] **Place**: Move it to `assets/illustrations/library/`.
- [ ] **Minify**: Hugo automatically minifies the content during the build.

> [!IMPORTANT]
> Always prefer local illustrations. They are minified during the build process, reducing bundle size by up to 40%.
