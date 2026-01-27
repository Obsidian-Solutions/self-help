---
title: 'Deployment'
weight: 30
---

MindFull is architected for maximum stability and performance in production environments.

## 1. Production Strengths

The theme is rigorously tested to ensure a high-quality user experience and minimal maintenance.

### Strength Assessment

| Pillar          | Rating              | Description                                    |
| :-------------- | :------------------ | :--------------------------------------------- |
| **Performance** | ⚡ Ultra-Fast       | 40ms build time with minified output.          |
| **Security**    | 🛡️ Hardened         | Zero external API calls; native DOM only.      |
| **Privacy**     | 🔒 100% Client-Side | All user data stays in browser `localStorage`. |
| **SEO**         | 🔍 Optimized        | 100% crawlable with automated meta-tags.       |

## 2. Final Deployment Checklist

Before pushing your site live, ensure you have completed the following steps:

- [ ] **Domain**: Update `baseURL` in `hugo.toml` to your production URL.
- [ ] **Branding**: Set your `title` and `author` in `hugo.toml`.
- [ ] **SSO**: Verify that `GOOGLE_CLIENT_ID` and `GITHUB_CLIENT_ID` are configured for the production domain.
- [ ] **Build**: Run `npm run build` to generate the minified `public/` directory.
- [ ] **Search**: Confirm that the Pagefind index was generated (`public/pagefind`).
- [ ] **Compliance**: Verify that `data/cookies.json` accurately reflects your tracking setup.

## 3. Production Build Command

MindFull uses an environment-aware build script to ensure security and performance.

```bash
npm run build
```

> [!IMPORTANT]
> The build script physically isolates documentation source files during the render process. This guarantees that your private technical guides never leak into the public `public/` folder.

> [!TIP]
> MindFull is a static site. You can host the `public/` folder on any FOSS-friendly static host like **Netlify**, **Vercel**, or **GitHub Pages**.
