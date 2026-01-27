# MindFull AI Agent Directive (AGENTS.md)

Welcome, Agent. This document is your single source of truth for the MindFull project's architecture, philosophy, and operational standards. Adhere to these guidelines strictly to maintain project integrity.

## 🎯 Project Vision

MindFull is a professional, high-performance, and privacy-first Hugo theme for mental health and wellness. It balances a static, secure frontend with a lightweight Node.js CMS for authentication and secure logic.

## 🛠️ Technical Stack

- **Frontend**: Hugo (Extended) + Tailwind CSS 3.4+
- **Styling**: Native CSS + PostCSS (Autoprefixer)
- **Backend**: Node.js + Express (Lite CMS)
- **Database**: SQLite (Privacy-focused, self-hostable)
- **Search**: Pagefind (Static, FOSS)
- **Auth**: Real OAuth 2.0 (Google/GitHub) + Local Storage Fallback
- **Public Dev**: Ngrok (Unified Gateway Proxy)

## 🏗️ Architectural Principles

### 1. Data-Driven UI (Strict)

**Zero hardcoded user-facing text in HTML.**

- All global labels must live in `data/labels.json`.
- All page-specific content must live in `content/*.md` frontmatter.
- Layouts (`layouts/`) must only contain structural logic and data references.

### 2. Physical & Virtual Isolation

- **Documentation**: Source lives in `_docs_src/`. It is virtually mounted to `/docs` ONLY during development via `hugo.toml`.
- **Production Build**: The `npm run build` script physically isolates `_docs_src/` during the build process to guarantee zero leakage of docs into the live site.

### 3. Security Standards (Hardened)

- **DOM Access**: No `innerHTML` or `innerText`. Use `textContent` and `createElement` only.
- **Redirection**: All client-side navigation must pass through `window.safeRedirect(path)` in `auth.js`.
- **SSO**: Secrets are strictly server-side. The frontend only handles redirects to the CMS.

## 🚀 Core Workflows

### Development

```bash
npm run dev      # Launches Main Site (1313), CMS (3000), Docs (1314), and CSS Watcher
```

### Public Development (Free-Tier Friendly)

```bash
npm run pubdev   # Launches Unified Proxy (4242) + Ngrok Tunnel for remote testing
```

### Testing & Quality

```bash
npm run test     # Linting (JS/MD) + Prettier + Hugo Build
```

## 📈 Current Project Status

**Status**: ✅ **PRODUCTION READY & HARDENED**
**Version**: 1.5.0 (Data-Driven, SSO-Integrated, Multi-Site Docs)

### Phase Completion

- ✅ Phase 1-6: Visuals, Quizzes, Moods, Tooling, Security, UX.
- ✅ Phase 7: Real OAuth 2.0 Backend (Google/GitHub).
- ✅ Phase 8: FOSS Search (Pagefind) & Analytics (Umami).
- ✅ Phase 9: Unified Proxy Gateway for Public Dev.
- ✅ Phase 10: Multi-Site Documentation Architecture.

## 🗺️ Roadmap

1. **CMS Admin UI**: Implement a secure dashboard for therapists to manage courses.
2. **Payments**: Integrate a privacy-conscious payment flow (Stripe/Mock).
3. **Media**: Add Lesson Video Embed support via secure Markdown shortcodes.

---

_Last Updated: January 27, 2026_
