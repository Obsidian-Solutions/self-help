# MindFull Architectural & Development Standards

## 1. Data-Driven Philosophy

Every string, icon, and configuration must be sourced from `/content` or `/data`.

- **Labels:** Global UI strings belong in `data/labels.json`.
- **Pages:** Content structure belongs in `content/*.md`.
- **Compliance:** Cookie data belongs in `data/cookies.json`.

**Rule:** Zero hardcoded HTML text in `layouts/`. Use `{{ .Site.Data.labels.key }}`.

## 2. Security Standards

MindFull follows a "Strict-Internal" security policy to prevent XSS and injection.

### Native DOM APIs

NEVER use `innerHTML`, `innerText`, or `insertAdjacentHTML`.

- **Acceptable:** `document.createElement`, `textContent`, `setAttribute`, `appendChild`.

### Redirection

All client-side redirects must use the `window.safeRedirect(path)` function defined in `auth.js`. This function validates the origin and checks against a whitelist.

### SSO Flow

OAuth secrets must NEVER be present in the frontend. All token exchanges occur in the `cms/` Node.js backend.

## 3. Dynamic Currency Engine

The theme uses a privacy-first approach to currency:

1.  Detects locale via `navigator.language`.
2.  Maps locale to currency code.
3.  Formats using `Intl.NumberFormat`.
4.  Allows manual override saved in `localStorage`.

To add a price to a template, use:
`<span class="js-price" data-price-base="29">$29</span>`

## 4. Illustration System

Uses the `undraw` and `handcrafts` partials.

- **Illustration:** `{{ partial "shared/undraw.html" (dict "name" "meditation") }}`
- **Decoration:** `{{ partial "shared/handcrafts.html" (dict "element" "fun-star") }}`

## 5. Development Workflow

1.  **Test:** `npm run test` (Includes linting, formatting, and Hugo build).

2.  **Lint:** `npm run lint` (ESLint for JS, Markdownlint for docs).

3.  **Public Dev:** `npm run pubdev` (Starts local services and a public tunnel via localtunnel).

4.  **Clean:** `npm run clean`.
