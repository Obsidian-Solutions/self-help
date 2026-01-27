# MindFull Hugo Theme: Professional Documentation

A cinematic, high-performance, and security-hardened Hugo theme for mental health, self-help, and educational platforms. Built with Tailwind CSS, real-world OAuth 2.0 authentication, dynamic globally-aware pricing, and a "privacy-first" architecture.

## 🎯 Key Features

### 🔐 Authentication & Identity

- ✅ **Real OAuth 2.0 SSO** - Integrated support for Google and GitHub authentication.
- ✅ **Secure Backend** - Logic handled by a lightweight Node.js CMS to protect secrets.
- ✅ **Self-Healing Demo** - One-click "Demo User" login for easy testing and previews.
- ✅ **Privacy-First** - Local data storage combined with secure, encrypted session handling.

### 🎭 Cinematic Learning Experience

- ✅ **Overhauled Course Catalog** - High-impact hero sections and two-column premium grids.
- ✅ **Immersive Audio Player** - Professional-grade player with speed control, seeking, and marquee titles.
- ✅ **Guided Breathing Tool** - Configurable rhythms, ambient soundscapes, and phase chimes.
- ✅ **High-Fidelity Rendering** - Global sub-pixel anti-aliasing and GPU-accelerated transitions.

### 📈 Engagement & Social Proof

- ✅ **Real-Time Course Ratings** - Data-driven 5-star rating system with live averages.
- ✅ **Interactive Discussions** - Community comments and post reactions (likes/dislikes) via CMS.
- ✅ **Live View Tracking** - Accurate, unique view counter for all articles and courses.
- ✅ **Progress Visualization** - Sticky sidebar navigation with dynamic course completion tracking.

### 💸 Dynamic Commerce

- ✅ **Global Currency Engine** - Automatically detects user locale and maps to 150+ currencies.
- ✅ **Contextual Subscriptions** - Dynamic "Upgrade," "Downgrade," and "Current Plan" logic.

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/Obsidian-Solutions/self-help.git
npm install
```

### 2. Configure SSO

Copy `cms/.env.example` to `cms/.env` and add your Google/GitHub API keys. See [SSO Setup Guide](_docs_src/getting-started/sso-setup.md) for details.

### 3. Start Development

```bash
# Full local environment (Concurrently)
npm run dev

# High-Density Health Check
npm run test
```

## 📝 Internal Documentation

- **[installation.md](_docs_src/getting-started/installation.md)** - Hardware requirements and setup.
- **[sso-setup.md](_docs_src/getting-started/sso-setup.md)** - Step-by-step Google/GitHub integration.
- **[shortcodes.md](_docs_src/features/shortcodes.md)** - Configuration for Audio, Video, and Breathing tools.
- **[architecture.md](_docs_src/development/architecture.md)** - Technical deep-dive into the CMS and Auth logic.

---

**Built with ❤️ by [Obsidian Solutions](https://obsidiansolutions.co.uk)**  
_Empowering mental wellness through secure, modern technology._
