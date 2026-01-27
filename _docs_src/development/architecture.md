---
title: 'Architecture'
weight: 10
---

MindFull is designed with two core principles: **Data-Driven UI** and **Security by Default**.

## 1. Data-Driven Logic

We strictly separate data from presentation.

> [!CAUTION]
> **Zero Hardcoding Rule:** No user-facing text should be hardcoded in HTML layouts.

### Data Storage Strategy

| Category             | Storage Location       | Usage                                   |
| :------------------- | :--------------------- | :-------------------------------------- |
| **Global UI Labels** | `data/labels.json`     | Buttons, navigation, and component text |
| **Page Content**     | `content/*.md`         | Blog posts, lessons, and static pages   |
| **Compliance Data**  | `data/cookies.json`    | Legal transparency and consent manager  |
| **User State**       | Browser `localStorage` | Moods, journal, and theme settings      |

## 2. Security Standards

MindFull implements a hardened security posture across the entire application.

### Security Compliance Checklist

- [x] **Safe Redirects**: Whitelist-based redirection via `window.safeRedirect()`.
- [x] **Native DOM APIs**: Strict avoidance of `innerHTML` to prevent XSS.
- [x] **Isolated Secrets**: OAuth credentials isolated in Node.js backend.
- [x] **GDPR Ready**: Integrated Google Consent Mode v2.

### Secure Proxy Architecture

The CMS and Hugo are bridged via a secure proxy during development to maintain strict CORS policies while allowing cross-site communication.
