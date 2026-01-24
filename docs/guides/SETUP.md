# Development Setup Guide

Complete guide to setting up the development environment for the MindFull Hugo Theme.

## Prerequisites

- **Node.js:** v18.0.0 or higher ([download](https://nodejs.org/))
- **npm:** v9.0.0 or higher (included with Node.js)
- **Hugo:** v0.120.0 or higher (extended version required) ([download](https://gohugo.io/installation/))
- **Git:** For version control

### Verify Installation

```bash
node --version    # Should be v18.0.0+
npm --version     # Should be v9.0.0+
hugo version      # Should be v0.120.0+ (extended)
git --version     # Any recent version
```

---

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm run setup
```

This single command:
- Installs all npm dependencies
- Builds CSS from Tailwind
- Confirms setup is complete

### 2. Start Development Server

```bash
npm run dev
```

Opens Hugo server at `http://localhost:1313` with hot reload and CSS watching.

### 3. Make Changes

Edit files in `/content/`, `/layouts/`, or `/assets/` and see changes instantly.

---

## Available Commands

### Development

```bash
npm run start        # Start Hugo server (no CSS watching)
npm run dev          # Start server + watch CSS (recommended for dev)
npm run serve        # Hugo server with fast render disabled
npm run serve:prod   # Production server mode
```

### Building

```bash
npm run build        # Build production site (CSS + minified HTML)
npm run build:css    # Build Tailwind CSS only
npm run watch:css    # Watch CSS files and rebuild on change
npm run clean        # Clean build cache (public/, resources/, _gen/)
```

### Code Quality

```bash
npm run lint         # Run all linters (JavaScript + Markdown)
npm run lint:js      # Lint JavaScript files in assets/js/
npm run lint:md      # Lint Markdown files (.md)

npm run format       # Format all code files
npm run format:check # Check formatting without changes

npm run test         # Run full test suite (lint + format check + build)
npm run test:ci      # CI-mode testing (stricter validation)
```

### Utilities

```bash
npm run setup        # Initialize development environment
npm run validate     # Validate Hugo output
```

---

## Folder Structure

```
self-help/
├── assets/
│   ├── css/              # Tailwind input files
│   │   ├── input.css     # Tailwind directives
│   │   └── main.css      # Additional custom styles
│   └── js/               # JavaScript files (linted)
│       ├── main.js
│       ├── auth.js
│       └── dark-mode.js
├── content/              # Markdown content
│   ├── _index.md         # Home page
│   ├── courses/          # Course pages
│   └── lessons/          # Lesson pages
├── layouts/              # Hugo templates
│   ├── index.html        # Home page template
│   ├── _default/         # Default layouts
│   └── _partials/        # Reusable components
├── static/               # Static assets
└── public/               # Generated site (ignored in git)
```

---

## Code Quality Standards

### Formatting

Code is automatically formatted with **Prettier**:

```bash
# Auto-format your code
npm run format

# Check if formatting is needed
npm run format:check
```

**Prettier Config** (`.prettierrc.json`):
- Line width: 100 characters
- Indentation: 2 spaces
- Quotes: Single quotes (JavaScript)
- Semicolons: Required
- Trailing commas: ES5 style

### Linting

**JavaScript** is validated with **ESLint**:

```bash
npm run lint:js
```

**Linting Rules**:
- ES2021+ features
- `const`/`let` preferred over `var`
- Unused variables: warning
- Strict equality (`===` preferred)
- No floating promises

**Markdown** is validated with **markdownlint**:

```bash
npm run lint:md
```

**Markdown Rules**:
- Consistent header styles
- Line length: 120 characters (warnings only)
- Proper code fence formatting

### Pre-commit Recommendations

Before committing code, run:

```bash
npm run test
```

This runs:
1. Linting (JavaScript + Markdown)
2. Format checking
3. Full production build

---

## Workflows

### Adding a New Feature

```bash
# 1. Start dev server
npm run dev

# 2. Create files/make changes in layouts/ or assets/

# 3. Check code quality
npm run lint
npm run format

# 4. Build and verify
npm run build

# 5. Commit
git add .
git commit -m "feat: add new feature"
```

### Fixing Code Issues

```bash
# Auto-fix formatting
npm run format

# Auto-fix some ESLint issues
npm run lint:js -- --fix

# Manually fix any remaining issues

# Verify all issues resolved
npm run test
```

### Cleaning Up Before Commit

```bash
# Full cleanup and validation
npm run clean        # Remove build artifacts
npm run test         # Run all checks
npm run build        # Final production build
```

---

## Troubleshooting

### "command not found: hugo"

Hugo is not installed or not in PATH. [Install Hugo Extended](https://gohugo.io/installation/).

### "command not found: npm"

Node.js is not installed. [Install Node.js](https://nodejs.org/) (v18+).

### CSS not updating

```bash
# Rebuild CSS
npm run build:css

# If still not working, clean and rebuild
npm run clean
npm run build
```

### Port 1313 already in use

```bash
# Use different port
hugo server -p 1314 -D
```

### Build errors

```bash
# Clean everything and rebuild
npm run clean
npm run build

# Check for errors
npm run lint
```

---

## Environment Variables

No environment variables required for development. The theme is completely static with localStorage persistence.

For production hosting, ensure:
- `baseURL` in `hugo.toml` matches your domain
- Hosting supports HTTPS (for secure localStorage)

---

## Testing in Production Mode

```bash
# Build production bundle
npm run build

# Serve built site (no hot reload)
npm run serve:prod

# Visit http://localhost:1313 to test
```

---

## CI/CD Integration

For automated testing in GitHub Actions, GitLab CI, etc.:

```bash
npm run test:ci
```

This enables stricter validation and prints Hugo path warnings.

---

## Performance Tips

### Fast Development

```bash
# For rapid iteration with hot reload
npm run dev
```

### Fast Building

```bash
# Clean old artifacts first
npm run clean

# Then build
npm run build

# Rebuilding is usually faster after clean
```

### Monitor Build Times

```bash
# Hugo will show build time
npm run build

# Times under 100ms = excellent
# Times 100-500ms = acceptable
# Times over 1s = may need optimization
```

---

## Contributing

When contributing to the theme:

1. Follow all code quality checks: `npm run test`
2. Use proper commit messages
3. Update documentation when changing features
4. Test in both light and dark modes
5. Test on mobile devices

---

## Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [EditorConfig](https://editorconfig.org/)

---

## Need Help?

- Check [README.md](README.md) for feature overview
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Review [HOME_PAGE_GUIDE.md](HOME_PAGE_GUIDE.md) for content editing
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for technical details

---

**Happy developing! 🚀**
