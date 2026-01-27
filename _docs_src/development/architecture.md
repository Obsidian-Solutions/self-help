---
title: 'Architecture'
weight: 10
---

MindFull is designed with two core principles: **Data-Driven UI** and **Security by Default**.

## 1. Data-Driven Logic

We strictly separate data from presentation. No user-facing text should be hardcoded in HTML.

- **UI Labels**: All global strings (buttons, tabs, navigation) live in `data/labels.json`.
- **Pages**: Layouts pull from markdown frontmatter in `content/*.md`.
- **Compliance**: Cookie and privacy definitions live in `data/cookies.json`.

## 2. Security Standards

- **Safe Redirects**: All client-side navigation uses `window.safeRedirect()` to prevent open-redirect vulnerabilities.
- **Native DOM APIs**: We avoid `innerHTML`. All dynamic content is injected via `textContent` or `document.createElement`.
- **CORS Handling**: The CMS and Hugo are bridged via a secure proxy during development.
