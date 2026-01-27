---
title: 'Architecture'
weight: 10
---

MindFull is designed with two core principles: **Data-Driven UI** and **Security by Default**.

## 1. Hybrid Data Architecture

We strictly separate static data from dynamic user engagement.

### Data Storage Strategy

| Category             | Storage Location         | Usage                                      |
| :------------------- | :----------------------- | :----------------------------------------- |
| **Global UI Labels** | `data/labels.json`       | Buttons, navigation, and component text    |
| **Static Content**   | `content/*.md`           | Blog posts, lessons, and course curriculum |
| **Compliance Data**  | `data/cookies.json`      | Legal transparency and consent manager     |
| **Engagement Data**  | `cms/db/mindfull.sqlite` | Views, Ratings, Comments, and Reactions    |
| **Auth Sessions**    | JWT + `localStorage`     | Secure identity management                 |

### Dynamic Engagement System

The Node.js CMS manages real-time interactions using an optimized SQLite backend:

- **View Locking**: Prevents redundant view counts using 1-year persistent anonymous cookies.
- **Course Ratings**: Prevents double-voting via Course Rating Locks.
- **Reaction Engine**: Handles post likes/dislikes with instant visual feedback.

---

## 2. Security Standards

MindFull implements a hardened security posture across the entire application.

### Security Compliance Checklist

- [x] **XSS Prevention**: Strict use of `textContent` and `safeHTML` filtering.
- [x] **CSRF Hardening**: Origin-restricted CORS policies on the CMS backend.
- [x] **Secure Auth**: JWT-based session handling with standard OAuth 2.0 flows.
- [x] **Safe Redirection**: Whitelist-based redirection to eliminate open-redirect risks.

### Sub-System Isolation

The platform consists of three isolated layers:

1.  **Static Frontend**: Pre-rendered Hugo site for maximum SEO and performance.
2.  **Auth CMS**: Minimalist Node.js API server for identity and dynamic data.
3.  **Docs Hub**: Dedicated documentation portal for developers and content managers.
