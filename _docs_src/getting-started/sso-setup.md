# Single Sign-On (SSO) Setup Guide

MindFull supports authenticating users via **Google** and **GitHub**. Because these services require secure secret management, the logic is handled by the **MindFull CMS** (Node.js backend), not the static theme itself.

To enable SSO, you must configure your API keys in the CMS environment.

## 1. Google OAuth Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "MindFull SSO").
3.  Navigate to **APIs & Services > Credentials**.
4.  Click **Create Credentials** -> **OAuth client ID**.
5.  Select **Web application**.
6.  **Authorized JavaScript origins**:
    - `http://localhost:3000` (for local CMS dev)
    - `http://localhost:1313` (for local Hugo dev)
    - Your production domain (e.g., `https://api.yourdomain.com`)
7.  **Authorized redirect URIs**:
    - `http://localhost:3000/api/auth/google/callback`
    - `https://api.yourdomain.com/api/auth/google/callback`
8.  Copy the **Client ID** and **Client Secret**.

## 2. GitHub OAuth Setup

1.  Go to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click **New OAuth App**.
3.  **Application Name**: MindFull (or your app name).
4.  **Homepage URL**: `http://localhost:1313` (or your production frontend).
5.  **Authorization callback URL**:
    - `http://localhost:3000/api/auth/github/callback`
    - `https://api.yourdomain.com/api/auth/github/callback`
6.  Click **Register application**.
7.  Copy the **Client ID** and generate a new **Client Secret**.

## 3. Configure the CMS

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

## 4. How it Works

1.  **User Clicks Login**: The frontend (`auth.js`) redirects the browser to `http://localhost:3000/api/auth/google`.
2.  **Provider Redirect**: The CMS constructs the correct OAuth URL and sends the user to Google/GitHub.
3.  **Authentication**: The user logs in on the provider's site.
4.  **Callback**: Google/GitHub redirects the user back to `/api/auth/google/callback` with a secure code.
5.  **Token Exchange**: The CMS securely exchanges this code for the user's profile (Email, Name, Avatar) using the Client Secret.
6.  **Account Creation**:
    - If the user exists in `mindfull.sqlite`, they are logged in.
    - If not, a new account is automatically created.
7.  **Final Redirect**: The CMS redirects the user back to your frontend dashboard (`http://localhost:1313/dashboard`) with a secure session token.

> **Note:** For this flow to work locally, you must have the CMS running (`npm start` inside `cms/`) alongside your Hugo server.
