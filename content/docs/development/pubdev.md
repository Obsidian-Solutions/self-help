---
title: 'Public Development'
weight: 20
---

If you need to share your local development site with a client or tester, use the **Public Dev** mode.

## Single Command Startup

```bash
npm run pubdev
```

## How it Works

1.  **Proxy Gateway**: A local proxy starts on port `4242`.
2.  **Public Tunnel**: **Localtunnel** creates a secure random URL (e.g., `https://random-id.loca.lt`).
3.  **Unified Link**: Both your Hugo Frontend and CMS Backend are accessible via that single public URL.

No account or token is required. Simply share the link generated in your terminal.
