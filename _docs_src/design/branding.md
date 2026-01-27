---
title: 'Branding'
weight: 10
---

MindFull is designed to be reskinned in seconds while maintaining elite-level visual polish through centralized configuration and global smoothing engines.

## 1. Core Visuals

### Branding Configuration

| Property            | File        | Value Type        | Description                                 |
| :------------------ | :---------- | :---------------- | :------------------------------------------ |
| **Logo Icon**       | `hugo.toml` | FontAwesome Class | Primary icon for header/footer (GPG signed) |
| **Site Title**      | `hugo.toml` | String            | Your organization's name                    |
| **Primary Color**   | `hugo.toml` | Hex Code          | Brand identity color (Indigo default)       |
| **Secondary Color** | `hugo.toml` | Hex Code          | Accent color (Emerald default)              |

---

## 2. High-Fidelity Rendering

MindFull includes a built-in **Smoothing Stack** that ensures your brand looks sharp on all displays.

### Visual Standards

- ✨ **Sub-Pixel Smoothing**: Advanced anti-aliasing for all typography, with custom weight adjustments for Dark Mode.
- 🎨 **Natural Easing**: Custom cubic-bezier transitions (`0.4, 0, 0.2, 1`) for all interactive elements.
- 🎭 **Multi-Layered Shadows**: Soft, 3-layer depth system for cards and buttons.
- 🚀 **Hardware Acceleration**: GPU-optimized transforms (`translate3d`) for all animations.

### Implementation Utility

You can apply elite rendering to any custom component using the `.smooth-render` class:

```html
<div class="my-custom-box smooth-render">
  <!-- Content here will be GPU-accelerated and anti-aliased -->
</div>
```

---

## 3. Configuration Example

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
