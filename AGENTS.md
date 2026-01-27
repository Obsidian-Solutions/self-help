# MindFull AI Agent Directive (AGENTS.md)

Welcome, Agent. This document is your single source of truth for the MindFull project's architecture, philosophy, and operational standards. Adhere to these guidelines strictly to maintain project integrity.

## Project Vision

MindFull is a professional, high-performance, and privacy-first Hugo theme for mental health and wellness. It balances a static, secure frontend with a lightweight Node.js CMS for authentication and secure logic.

## Technical Stack

| Component    | Technology        | Role                    |
| :----------- | :---------------- | :---------------------- |
| **Frontend** | Hugo (Extended)   | Static Site Generation  |
| **CSS**      | Tailwind CSS 3.4+ | Utility-first styling   |
| **Backend**  | Node.js + Express | CMS & Auth Logic        |
| **Database** | SQLite            | Privacy-focused storage |
| **Search**   | Pagefind          | Static, FOSS search     |
| **Proxy**    | Express + Ngrok   | Unified dev gateway     |

## Architectural Principles

> [!IMPORTANT]
>
> ### 1. Data-Driven UI (Strict)
>
> **Zero hardcoded user-facing text in HTML.**
>
> - All global labels must live in `data/labels.json`.
> - All page-specific content must live in `content/*.md` frontmatter.
> - Layouts (`layouts/`) must only contain structural logic and data references.

### 2. Physical & Virtual Isolation

- [x] **Documentation Source**: Lives in `_docs_src/`.
- [x] **Virtual Mount**: Mounted to `/docs` ONLY during development via `hugo.toml`.
- [x] **Production Build Isolation**: `npm run build` physically moves `_docs_src/` to prevent leakage.

### 3. Security Standards (Hardened)

- [x] **DOM Access**: No `innerHTML` or `innerText`. Use `textContent` and `createElement` only.
- [x] **Redirection**: All client-side navigation must pass through `window.safeRedirect(path)`.
- [x] **SSO**: Secrets are strictly server-side. Frontend only handles redirects.

## Core Workflows

### Command Reference

| Command          | Action                         | Ports            |
| :--------------- | :----------------------------- | :--------------- |
| `npm run dev`    | Launch development environment | 1313, 3000, 1314 |
| `npm run pubdev` | Launch public proxy via Ngrok  | 4242             |
| `npm run test`   | Execute full QA suite          | N/A              |
| `npm run build`  | Generate production build      | N/A              |

## Project Lifecycle Status

| Property       | Value                       |
| :------------- | :-------------------------- |
| **Status**     | PRODUCTION READY & HARDENED |
| **Version**    | 1.5.0                       |
| **Last Audit** | January 27, 2026            |

### Phase Completion

- [x] **Phase 1-6**: Visuals, Quizzes, Moods, Tooling, Security, UX.
- [x] **Phase 7**: Real OAuth 2.0 Backend (Google/GitHub).
- [x] **Phase 8**: FOSS Search (Pagefind) & Analytics (Umami).
- [x] **Phase 9**: Unified Proxy Gateway for Public Dev.
- [x] **Phase 10**: Multi-Site Documentation Architecture.

## Roadmap

- [ ] **CMS Admin UI**: Implement a secure dashboard for therapists to manage courses.
- [ ] **Payments**: Integrate a privacy-conscious payment flow (Stripe/Mock).
- [ ] **Media**: Add Lesson Video Embed support via secure Markdown shortcodes.

---

_Last Updated: January 27, 2026_
