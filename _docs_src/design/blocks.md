---
title: 'Block Library'
weight: 30
---

MindFull uses a modular "Block" architecture. You can build complex, professional pages by simply defining blocks in your markdown frontmatter.

## 1. Hero Block

The Hero block is the first thing users see. It's designed for high impact and clear calls to action.

### Configuration

```yaml
[hero]
tagline = "Your Science-Backed Wellness Journey"
headline = "Master your mind"
subheadline = "with daily CBT."
description = "Learn proven techniques to manage anxiety..."
illustration = "meditation"
primaryCta = "Browse Courses"
primaryCtaLink = "/courses"
secondaryCta = "Log In"
secondaryCtaLink = "/login"
```

### Key Properties

| Property       | Description                                    |
| :------------- | :--------------------------------------------- |
| `tagline`      | Small text badge above the headline.           |
| `illustration` | Slug from the UnDraw library.                  |
| `secondaryCta` | Automatically hidden if the user is logged in. |

---

## 2. Features Block

The Features block displays your value propositions in a clean, responsive grid.

### Configuration

```yaml
[[features]]
title = "Proven CBT Techniques"
description = "Designed by licensed therapists..."
icon = "check-circle" # Supports: check-circle, chart, lock, users
```

> [!TIP]
> You can add as many `[[features]]` blocks as you like. The layout automatically adjusts from a 1-column list on mobile to a 3-column grid on desktop.

---

## 3. Testimonials Block

Social proof is critical for wellness platforms. This block creates elegant quote cards.

### Configuration

```yaml
[[testimonials]]
quote = "I've struggled with anxiety for years. This is life-changing."
author = "Jane Doe"
initials = "JD"
```

---

## 4. Pricing Block

This block displays your subscription tiers and includes a "Best Value" recommendation flag.

### Configuration

The pricing block automatically pulls data from `content/plans/*.md`. To modify what is shown:

1.  Navigate to `content/plans/`.
2.  Edit the `features` array in any plan file.
3.  Set `recommended: true` to highlight a specific plan.

---

## 5. Final CTA Block

The "bottom of the page" hook to drive conversions.

### Configuration

```yaml
[sections]
ctaHeading = "Ready to dive in?"
cataSubheading = "Start your free trial today."
cataButton = "Get started"
```

---

## 🏗️ Customizing Global Blocks

Some blocks are "Global" and managed in `data/labels.json`.

### Global Components Checklist

- [ ] **Navigation**: Managed in `labels.json` under `header.nav`.
- [ ] **Sidebar**: Managed in `labels.json` under `sidebar.nav`.
- [ ] **Footer**: Links and descriptions managed in `labels.json`.

> [!IMPORTANT]
> To change the **Logo Icon** sitewide, you must update the `site_logo_icon` parameter in your root `hugo.toml` file, not in the markdown content.
