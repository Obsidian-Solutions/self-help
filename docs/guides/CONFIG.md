# Configuration Guide

Complete guide to configuring the MindFull Hugo Theme for your needs. All configuration is organized in a structured way with JSON files, environment variables, and hugo.toml sections.

---

## 📋 Configuration Overview

The theme uses a multi-layered configuration system:

1. **hugo.toml** - Hugo-specific settings and features
2. **config/** folder - JSON configuration files
3. **.env file** - Environment variables and secrets
4. **tailwind.config.js** - CSS framework settings
5. **package.json** - Build scripts and dependencies

---

## 🎯 Quick Configuration (5 minutes)

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit .env with Your Values

```env
SITE_URL=https://yourdomain.com
SITE_TITLE=Your Site Name
AUTHOR_NAME=Your Name
AUTHOR_EMAIL=your@email.com
```

### 3. Update hugo.toml Base Settings

```toml
baseURL = 'https://yourdomain.com/'  # Your domain
title = 'Your Site Name'              # Your site name
author = 'Your Name'                  # Your name
```

### 4. Build and Test

```bash
hugo --minify
hugo server -D
```

---

## 📁 Configuration File Structure

### config/ Folder Contents

```
config/
├── settings.json          # Theme colors, typography, components
├── features.json          # Feature flags (quizzes, mood tracking, etc.)
├── api.json               # API endpoints and third-party services
├── plugins.json           # Plugin configuration and modules
└── environment.json       # Environment-specific settings
```

### Root Configuration Files

```
hugo.toml                  # Hugo settings and feature configuration
.env.example               # Template for environment variables
.env                       # Local environment variables (git ignored)
tailwind.config.js         # Tailwind CSS settings
package.json               # NPM scripts and dependencies
```

---

## 🎨 Configuring Settings (colors, typography, components)

**File:** `config/settings.json`

### Colors

```json
"colors": {
  "primary": "#4F46E5",      // Main brand color
  "secondary": "#10B981",    // Secondary color
  "accent": "#F59E0B",       // Accent color
  "neutral": "#374151"       // Neutral gray
}
```

### Typography

```json
"typography": {
  "fontFamily": "system-ui, -apple-system, sans-serif",
  "fontSize": {
    "xs": "0.75rem",
    "sm": "0.875rem",
    "base": "1rem",
    "lg": "1.125rem",
    "xl": "1.25rem",
    "2xl": "1.5rem"
  }
}
```

### Dark Mode

```json
"darkMode": {
  "enabled": true,
  "selector": "[class~=\"dark\"]",
  "storageKey": "theme-preference"
}
```

### Components

```json
"components": {
  "navbar": {
    "sticky": true,
    "showBrand": true,
    "showMenu": true,
    "showDarkToggle": true
  },
  "footer": {
    "showLinks": true,
    "showCopyright": true,
    "showSocial": false
  }
}
```

---

## ✨ Configuring Features

**File:** `config/features.json`

### Enable/Disable Features

```json
"features": {
  "quizzes": {
    "enabled": true,
    "description": "Interactive quiz system"
  },
  "moodTracking": {
    "enabled": true,
    "description": "Daily mood check-ins"
  },
  "achievements": {
    "enabled": true,
    "count": 6
  },
  "darkMode": {
    "enabled": true
  },
  "journal": {
    "enabled": true
  },
  "dashboard": {
    "enabled": true
  }
}
```

### Experimental Features

```json
"experimental": {
  "codeSharing": {
    "enabled": false,
    "description": "Share quiz results"
  },
  "recommendations": {
    "enabled": false,
    "description": "AI-based recommendations"
  }
}
```

---

## 🔌 Configuring Plugins & APIs

**File:** `config/api.json` and `config/plugins.json`

### API Configuration

```json
"api": {
  "external": {
    "illustrations": {
      "enabled": false,
      "name": "Undraw API",
      "endpoint": "https://api.undraw.co"
    }
  },
  "internal": {
    "quiz": {
      "enabled": true,
      "storage": "localStorage"
    },
    "mood": {
      "enabled": true,
      "storage": "localStorage"
    }
  }
}
```

### Plugin Configuration

```json
"plugins": {
  "installed": [],
  "available": [
    {
      "name": "analytics",
      "description": "Analytics tracking",
      "enabled": false
    },
    {
      "name": "seo",
      "description": "SEO optimization",
      "enabled": true
    }
  ]
}
```

---

## 🌍 Configuring Environments

**File:** `config/environment.json`

### Multiple Environments

```json
"environments": {
  "development": {
    "baseUrl": "http://localhost:1313",
    "debug": true,
    "caching": false,
    "minify": false
  },
  "staging": {
    "baseUrl": "https://staging.yourdomain.com",
    "debug": true,
    "caching": true,
    "minify": true
  },
  "production": {
    "baseUrl": "https://yourdomain.com",
    "debug": false,
    "caching": true,
    "minify": true
  }
}
```

---

## 🔐 Configuring Environment Variables

**File:** `.env.example` → `.env` (local, not in git)

### Setup

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

### Environment Variables

```env
# Site Configuration
SITE_URL=https://yourdomain.com
SITE_TITLE=Your Site Name
AUTHOR_NAME=Your Name
AUTHOR_EMAIL=your@email.com

# Feature Flags
FEATURE_QUIZZES=true
FEATURE_MOOD_TRACKING=true
FEATURE_ACHIEVEMENTS=true
FEATURE_DARK_MODE=true

# API Keys (Optional)
API_KEY=your-api-key-here

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=

# Secrets (Do NOT share)
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
```

---

## 🎛️ Configuring Hugo (hugo.toml)

### Basic Settings

```toml
baseURL = 'https://yourdomain.com/'
languageCode = 'en-US'
title = 'Your Site Name'
description = 'Your site description'
author = 'Your Name'
copyright = 'Copyright © 2026 Your Name'
```

### Features Configuration

```toml
[params.features]
  quizzes = true
  moodTracking = true
  achievements = true
  darkMode = true
  journal = true
  dashboard = true
  authentication = false
  therapistDirectory = true
```

### Colors Configuration

```toml
[params.colors]
  primary = '#4F46E5'
  secondary = '#10B981'
  accent = '#F59E0B'
  neutral = '#374151'
```

### Dark Mode Settings

```toml
[params.darkMode]
  enabled = true
  defaultMode = 'auto'  # 'light', 'dark', or 'auto'
  storageKey = 'theme-preference'
```

### Analytics (Optional)

```toml
[params.analytics]
  enabled = false
  googleAnalyticsId = 'UA-XXXXXXXXX-X'
```

### Social Links (Optional)

```toml
[params.social]
  twitter = 'https://twitter.com/yourusername'
  github = 'https://github.com/yourusername'
  email = 'contact@example.com'
```

### Performance Settings

```toml
[params.performance]
  minifyHTML = true
  minifyCSS = true
  minifyJS = true
  enableGzip = true
  lazyLoadImages = true
```

---

## 🌈 Configuring Tailwind CSS

**File:** `tailwind.config.js`

### Custom Colors

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
      }
    }
  }
}
```

### Custom Fonts

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      serif: ['Merriweather', 'serif'],
    }
  }
}
```

### Custom Breakpoints

```javascript
theme: {
  extend: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

---

## 📦 Configuring NPM Scripts

**File:** `package.json`

### Available Scripts

```bash
npm run dev              # Start dev server with CSS watching
npm run build            # Production build
npm run lint             # Run all linters
npm run format           # Auto-format code
npm run test             # Full test suite
npm run clean            # Clean artifacts
```

---

## 🚀 Common Configuration Scenarios

### Scenario 1: Disable Dark Mode

**hugo.toml:**
```toml
[params.darkMode]
  enabled = false
```

### Scenario 2: Enable Stripe Payments

**config/api.json:**
```json
"payments": {
  "enabled": true,
  "provider": "stripe",
  "publicKey": "pk_live_..."
}
```

**.env:**
```env
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Scenario 3: Add Google Analytics

**hugo.toml:**
```toml
[params.analytics]
  enabled = true
  googleAnalyticsId = 'G-XXXXXXXXXX'
```

### Scenario 4: Customize Colors

**config/settings.json:**
```json
"colors": {
  "primary": "#FF6B6B",
  "secondary": "#4ECDC4",
  "accent": "#FFE66D"
}
```

**tailwind.config.js:**
```javascript
colors: {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
}
```

---

## 🔍 Configuration Precedence

Settings are applied in this order (later overrides earlier):

1. **defaults.json** (if created)
2. **config/*.json** files
3. **.env** variables
4. **hugo.toml** params
5. **tailwind.config.js** theme

---

## 🛡️ Security Configuration

### Protect Secrets

```bash
# Never commit .env
echo ".env" >> .gitignore

# Use for local development
cp .env.example .env
nano .env  # Edit with your secrets
```

### Environment-Specific Secrets

```env
# Development
DEV_API_KEY=dev-key-12345

# Production (use in CI/CD)
PROD_API_KEY=prod-key-secure
```

### CI/CD Secrets

In GitHub Actions, GitLab CI, etc.:

```yaml
# Set as secrets in platform
STRIPE_SECRET_KEY
SENDGRID_API_KEY
API_KEY
```

---

## 📝 Configuration Checklist

Before deploying:

- [ ] Copy `.env.example` to `.env`
- [ ] Update SITE_URL in `.env`
- [ ] Update AUTHOR_NAME in `.env`
- [ ] Update `baseURL` in `hugo.toml`
- [ ] Update `title` in `hugo.toml`
- [ ] Review enabled features in `config/features.json`
- [ ] Set analytics ID if using (optional)
- [ ] Configure colors in `config/settings.json`
- [ ] Test build: `npm run test`
- [ ] Test locally: `npm run dev`
- [ ] Never commit `.env` file

---

## 🆘 Troubleshooting Configuration

### Build fails with configuration error

```bash
# Validate TOML syntax
hugo config
```

### Features not showing

1. Check `config/features.json` - is it enabled?
2. Check `hugo.toml` [params.features] - is it enabled?
3. Check layout templates - does it check the feature flag?

### Environment variables not working

```bash
# Verify .env file exists
ls -la .env

# Check .env is in .gitignore
grep ".env" .gitignore

# Reload environment
source .env
```

### Styles not updating

```bash
# Rebuild Tailwind
npm run build:css

# Clean and rebuild
npm run clean && npm run build
```

---

## 📚 Related Documentation

- **[SETUP.md](SETUP.md)** - Development environment setup
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guidelines
- **[hugo.toml](hugo.toml)** - Full Hugo configuration file
- **[config/](config/)** - JSON configuration files
- **.env.example** - Environment variables template

---

## ✨ Summary

The MindFull theme uses a professional, organized configuration system:

- **config/** folder for structured settings
- **.env** file for secrets and environment variables
- **hugo.toml** for Hugo-specific settings
- Feature flags for easy enable/disable
- Multiple environment support (dev, staging, production)

Customize the theme by editing these configuration files without touching code!
