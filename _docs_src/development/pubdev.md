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

> [!TIP]
> This mode uses **Localtunnel** to generate a public URL instantly with zero registration required.

### Gateway Routing

| Path        | Destination         | Port |
| :---------- | :------------------ | :--- |
| `/api/*`    | **MindFull CMS**    | 3000 |
| `/*` (Root) | **Hugo Frontend**   | 1313 |
| **Gateway** | Local Reverse Proxy | 4242 |

### Launch Checklist

- [ ] Run `npm run pubdev`.
- [ ] Wait for `🔗 SHAREABLE URL` to appear.
- [ ] Share the URL with your external collaborator.

### Technical Sequence

1.  **Proxy Gateway**: A local proxy starts on port `4242`.
2.  **Public Tunnel**: Localtunnel creates a secure random URL (e.g., `https://random-id.loca.lt`).
3.  **Unified Link**: Both your Hugo Frontend and CMS Backend are accessible via that single public URL.
