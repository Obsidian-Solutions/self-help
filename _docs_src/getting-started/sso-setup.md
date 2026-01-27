---
title: 'SSO Configuration'
weight: 20
---

MindFull supports authenticating users via **Google** and **GitHub**. These services require secure secret management, which is handled by the **MindFull CMS**.

## 1. Provider Setup

### Google OAuth Setup

- [ ] Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
- [ ] Navigate to **APIs & Services > Credentials**.
- [ ] Create an **OAuth client ID** for a "Web Application".
- [ ] Configure the redirect URIs (see table below).

### GitHub OAuth Setup

- [ ] Go to [GitHub Developer Settings](https://github.com/settings/developers).
- [ ] Register a **New OAuth App**.
- [ ] Configure the homepage and callback URLs (see table below).

### Required Redirect URIs

| Provider   | Environment | Redirect URI                                     |
| :--------- | :---------- | :----------------------------------------------- |
| **Google** | Local       | `http://localhost:3000/api/auth/google/callback` |
| **GitHub** | Local       | `http://localhost:3000/api/auth/github/callback` |

## 2. Configure the CMS

Create or edit the `.env` file inside the `cms/` directory:

```bash
# cms/.env

# Server Config
CMS_PORT=3000
FRONTEND_URL=http://localhost:1313
JWT_SECRET=super-secret-key-change-this

# Google SSO
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub SSO
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

> [!IMPORTANT]
> Never commit your `.env` file to version control. It contains sensitive API secrets.

## 3. How it Works

| Sequence | Actor        | Action                                             |
| :------- | :----------- | :------------------------------------------------- |
| 1        | **User**     | Clicks "Login with Google/GitHub"                  |
| 2        | **Frontend** | Redirects to CMS Auth Route                        |
| 3        | **CMS**      | Redirects to Provider (Google/GitHub)              |
| 4        | **Provider** | Authenticates user and redirects to CMS Callback   |
| 5        | **CMS**      | Validates code, creates/finds user, and issues JWT |
| 6        | **Frontend** | Receives JWT and logs user in                      |

> [!TIP]
> For this flow to work locally, you must have the CMS running (`npm start` inside `cms/`) alongside your Hugo server.
