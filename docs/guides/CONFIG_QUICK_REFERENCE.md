# Configuration Quick Reference

One-page quick lookup for the new configuration system.

## 📁 Configuration Files Location

```
project/
├── config/                    # Configuration folder
│   ├── settings.json          # Theme colors, typography, components
│   ├── features.json          # Feature toggles
│   ├── api.json               # API endpoints & services
│   ├── plugins.json           # Plugin management
│   └── environment.json       # Environment-specific config
│
├── .env.example               # Environment variables template
├── .env                       # (Local, git ignored)
├── hugo.toml                  # Hugo settings + [params.*] sections
├── tailwind.config.js         # CSS framework config
└── package.json               # NPM scripts
```

## 🎨 Customize Colors

**File:** `config/settings.json`

```json
"colors": {
  "primary": "#4F46E5",
  "secondary": "#10B981",
  "accent": "#F59E0B"
}
```

**Then update:** `tailwind.config.js` with same colors

## ✨ Toggle Features

**Option 1:** `config/features.json`
```json
"quizzes": { "enabled": true },
"moodTracking": { "enabled": true }
```

**Option 2:** `hugo.toml`
```toml
[params.features]
  quizzes = true
  moodTracking = true
```

## 🌍 Environment Variables

**Setup:**
```bash
cp .env.example .env
nano .env  # Edit with your values
```

**Key Variables:**
```env
SITE_URL=https://yourdomain.com
SITE_TITLE=Your Site Name
FEATURE_QUIZZES=true
FEATURE_MOOD_TRACKING=true
API_KEY=your-key-here
```

## 🔌 Configure APIs

**File:** `config/api.json`

```json
"api": {
  "external": {
    "illustrations": {
      "enabled": false,
      "endpoint": "https://api.undraw.co"
    }
  },
  "internal": {
    "quiz": {
      "enabled": true,
      "storage": "localStorage"
    }
  }
}
```

## 🎛️ Configure Plugins

**File:** `config/plugins.json`

```json
"available": [
  {
    "name": "analytics",
    "enabled": false
  },
  {
    "name": "seo",
    "enabled": true
  }
]
```

## 📝 Hugo Configuration

**File:** `hugo.toml`

### Features
```toml
[params.features]
  quizzes = true
  moodTracking = true
  achievements = true
  darkMode = true
```

### Colors
```toml
[params.colors]
  primary = '#4F46E5'
  secondary = '#10B981'
```

### Analytics
```toml
[params.analytics]
  enabled = true
  googleAnalyticsId = 'G-XXXXXXXXXX'
```

### Social
```toml
[params.social]
  twitter = 'https://twitter.com/you'
  github = 'https://github.com/you'
```

## 🔄 Configuration Priority

Later layers override earlier ones:

1. Defaults (hardcoded)
2. `config/*.json` files
3. `.env` variables
4. `hugo.toml` params
5. `tailwind.config.js` theme

## 📚 Full Documentation

For complete details, see [CONFIG.md](CONFIG.md)

## ⚡ Quick Tasks

### Change Primary Color
```bash
# 1. Edit config/settings.json
nano config/settings.json
# 2. Edit tailwind.config.js (same color)
nano tailwind.config.js
# 3. Rebuild
npm run build:css
```

### Disable Mood Tracking
```bash
# Edit hugo.toml
nano hugo.toml
# Find [params.features] and set:
# moodTracking = false
```

### Add Google Analytics
```bash
# Edit hugo.toml
nano hugo.toml
# Find [params.analytics] and set:
# enabled = true
# googleAnalyticsId = 'G-XXXXXXXXXX'
```

### Set Environment Variables
```bash
cp .env.example .env
nano .env
# Fill in your values
```

### Build & Test
```bash
npm run build      # Production build
npm run dev        # Dev server
hugo server -D     # Hugo server with drafts
```

## 🔒 Secrets Management

**Never commit .env file!**

```bash
# .env is already in .gitignore ✅

# Add secrets only to:
.env (local development)

# For CI/CD, use platform secrets:
GitHub Actions → Secrets
GitLab CI → CI/CD Variables
```

## 🆘 Common Issues

**Features not showing?**
→ Check config/features.json AND hugo.toml [params.features]

**Colors not changing?**
→ Update both config/settings.json AND tailwind.config.js

**Build fails?**
→ Run `hugo config` to validate hugo.toml syntax

**Styles not updating?**
→ Run `npm run build:css` to rebuild Tailwind

## 📋 Configuration Checklist

- [ ] Copy .env.example → .env
- [ ] Edit .env with your values
- [ ] Update baseURL in hugo.toml
- [ ] Update title in hugo.toml  
- [ ] Customize colors in config/settings.json
- [ ] Toggle unwanted features in config/features.json
- [ ] Set up API keys if needed
- [ ] Build: `npm run build`
- [ ] Test: `npm run dev`
- [ ] Never commit .env file

---

**For details:** Read [CONFIG.md](CONFIG.md)  
**For features:** See [DEVELOPMENT.md](DEVELOPMENT.md)  
**For setup:** See [SETUP.md](SETUP.md)
