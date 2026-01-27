# MindFull Hugo Theme: Professional Documentation

A modern, high-performance, and security-hardened Hugo theme for mental health, self-help, and educational platforms. Built with Tailwind CSS, real-world OAuth 2.0 authentication, dynamic globally-aware pricing, and a "privacy-first" architecture.

## 🎯 Key Features

### 🔐 Authentication & Identity

- ✅ **Real OAuth 2.0 SSO** - Integrated support for Google and GitHub authentication.
- ✅ **Secure Backend** - Logic handled by a lightweight Node.js CMS to protect secrets.
- ✅ **Self-Healing Demo** - One-click "Demo User" login for easy testing and previews.
- ✅ **Privacy-First** - Local data storage combined with secure, encrypted session handling.

### 💸 Dynamic Commerce

- ✅ **Global Currency Engine** - Automatically detects user locale (VPN-friendly) and maps to 150+ currencies.
- ✅ **Contextual Subscriptions** - Dynamic "Upgrade," "Downgrade," and "Current Plan" logic based on plan weight.
- ✅ **Real-Time Formatting** - Uses the `Intl` API for perfect local currency presentation.

### 🛡️ Compliance & Security

- ✅ **GDPR & Google Consent Mode v2** - Built-in granular consent manager (Necessary, Analytics, Marketing).
- ✅ **Zero-Vulnerability DOM** - Hardened templates using native DOM APIs to prevent XSS.
- ✅ **Safe Redirection** - Whitelist-based redirection engine to eliminate open-redirect risks.

### 🎨 Visual & Interactive

- ✅ **Illustration Library** - Integrated access to 1000+ unDraw SVG illustrations.
- ✅ **Interactive Quizzes** - Full-featured quiz engine with scoring and achievement triggers.
- ✅ **Mood Tracking** - Professional mood check-ins with streak tracking.
- ✅ **Dark Mode** - Advanced, persistent dark theme support.

## 📁 Project Structure

```
self-help/
├── cms/                       # Node.js Auth & Content Backend
├── content/                   # 100% Data-Driven Content Pages
├── data/                      # Structured Data (Labels, Cookies, Badges)
├── layouts/                   # Refactored, Security-Hardened Templates
├── assets/
│   ├── js/                    # Dynamic Bundled Logic (Auth, Currency, Main)
│   └── css/                   # Tailwind & Component Styles
├── static/                    # Global Assets (Favicon, Robots)
└── hugo.toml                  # Central Configuration (SSO, Branding, Features)
```

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/Obsidian-Solutions/self-help.git
npm install
```

### 2. Configure SSO

Copy `cms/.env.example` to `cms/.env` and add your Google/GitHub API keys. See [SSO Setup Guide](docs/guides/SSO_SETUP.md) for details.

### 3. Start Development

```bash

# Local testing

npm run dev



# External testing (via ngrok)

npm run pubdev

```

### 4. Ngrok Setup (Optional)

To use `npm run pubdev`, ensure you have an [ngrok account](https://ngrok.com/) and have configured your authtoken locally:

```bash

npx ngrok config add-authtoken <your-token>

```

## 📝 Essential Documentation

- **[SSO_SETUP.md](docs/guides/SSO_SETUP.md)** - Guide for Google/GitHub API integration.
- **[QUIZ_DOCUMENTATION.md](docs/guides/QUIZ_DOCUMENTATION.md)** - Front-matter schema for lessons and quizzes.
- **[ILLUSTRATIONS.md](docs/guides/ILLUSTRATIONS.md)** - How to use the `undraw` and `handcrafts` partials.
- **[DEVELOPMENT.md](docs/architecture/DEVELOPMENT.md)** - Architectural deep-dive and security standards.

## 📄 Compliance Data

All tracking and storage is transparently managed in `data/cookies.json` and automatically rendered on the `/cookie-policy` page.

---

**Built with ❤️ by [Obsidian Solutions](https://obsidiansolutions.co.uk)**  
_Empowering mental wellness through secure, modern technology._
