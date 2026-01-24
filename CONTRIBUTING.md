# Contributing to MindFull Theme

Thank you for your interest in contributing! This guide explains how to contribute to the MindFull Hugo Theme.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on ideas, not people
- Welcome all experience levels

## Types of Contributions

### 1. Bug Reports

Found a bug? Please report it!

**Good bug report includes:**

- Clear title: "Dark mode toggle not saving" (not "it's broken")
- Steps to reproduce
- Expected behavior vs. actual behavior
- Screenshots if visual
- System info (browser, OS, Node version)

**Example:**

```
Title: Quiz answers not persisting after page refresh

Steps:
1. Start quiz
2. Select an answer
3. Navigate away
4. Return to quiz
5. See answer is lost

Expected: Answer selection should persist
Actual: All answers are cleared
```

### 2. Feature Requests

Have an idea? We'd love to hear it!

**Good feature request includes:**

- Clear title: "Add quiz explanations"
- Problem it solves
- Proposed solution
- Why it's valuable

**Example:**

```
Title: Add explanation text to quiz answers

Problem: Users don't know why an answer is incorrect

Proposal: Add optional 'explanation' field to quiz questions

Value: Increases learning effectiveness
```

### 3. Code Contributions

### Submitting a Pull Request

**Before you start:**

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Set up development environment: `npm run setup`

**While developing:**

1. Follow the code style
2. Keep changes focused
3. Test your changes: `npm run test`
4. Update documentation

**When submitting:**

1. Push to your fork
2. Create a pull request with clear description
3. Link any related issues
4. Ensure all checks pass

**Your PR must:**

- ✅ Pass `npm run test` (linting + format + build)
- ✅ Have clear commit messages
- ✅ Include tests or demo
- ✅ Update documentation
- ✅ Work in light AND dark modes
- ✅ Be responsive on mobile

### Code Style

We use **Prettier** and **ESLint** for consistency.

```bash
# Auto-format your code
npm run format

# Check for issues
npm run lint

# Verify with full test suite
npm run test
```

**Key Rules:**

- 2-space indentation
- Single quotes in JavaScript
- 100-character line limit
- No `var`, use `const`/`let`
- Prefer `===` over `==`
- Descriptive variable names

### Naming Conventions

**HTML/Templates:**

```html
<!-- Use kebab-case for IDs/classes -->
<div id="quiz-container" class="quiz-wrapper">
  <button class="btn-primary">Submit</button>
</div>
```

**JavaScript:**

```js
// Use camelCase for functions/variables
const getUserScore = userId => {
  /* ... */
};
const isComplete = true;
const CACHE_KEY = 'quiz_results'; // CONSTANTS_IN_CAPS
```

**CSS/Tailwind:**

```css
/* Use Tailwind utilities when possible */
.card {
  @apply rounded-lg shadow-md p-6 bg-white;
}
```

**Markdown:**

```markdown
# Use proper heading hierarchy

- Use hyphens for lists
- Keep line width to 120 chars
- Include code examples
```

## Development Workflow

### 1. Set Up Environment

```bash
# Clone repo
git clone https://github.com/yourusername/mindfull-theme.git
cd mindfull-theme

# Install dependencies
npm run setup
```

### 2. Create Feature Branch

```bash
# Good branch names
git checkout -b feature/add-quiz-timer
git checkout -b fix/dark-mode-toggle
git checkout -b docs/improve-setup-guide
git checkout -b refactor/simplify-auth
```

### 3. Make Changes

```bash
# Start development server
npm run dev

# Watch your changes in browser
# Make edits, see updates instantly
```

### 4. Verify Code Quality

```bash
# Format code automatically
npm run format

# Check for issues
npm run lint

# Run full test suite
npm run test
```

### 5. Build Production

```bash
# Build for production
npm run build

# Test production build
npm run serve:prod
```

### 6. Commit Changes

```bash
# Commit with clear message
git add .
git commit -m "feat: add quiz timer feature

- Adds 30-minute timer to quizzes
- Saves remaining time to localStorage
- Shows countdown when < 5 minutes remain

Fixes #123"
```

**Commit Message Format:**

```
<type>: <subject>

<body>

Fixes #<issue>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 7. Push and Create PR

```bash
# Push to your fork
git push origin feature/my-feature

# Create PR via GitHub/GitLab
# Include:
# - Clear title
# - Description of changes
# - Related issue numbers
# - Checklist of what was tested
```

## Documentation

When you add features, update docs:

1. **Code comments** - Explain complex logic
2. **README.md** - Add to feature list
3. **DEVELOPMENT.md** - Document new components
4. **Create guides** - If adding major feature (like QUIZ_DOCUMENTATION.md)

### Example: Adding a New Feature

**Feature:** Quiz timer

**Files to update:**

- `layouts/_partials/quiz/quiz-engine.html` - Implementation
- `assets/js/quiz.js` - JavaScript logic
- `QUIZ_DOCUMENTATION.md` - User documentation
- `README.md` - Feature list
- `DEVELOPMENT.md` - Technical details

## Testing Your Changes

### Test Light and Dark Modes

```bash
# Start dev server
npm run dev

# Toggle dark mode in browser
# Verify styling in both modes
```

### Test on Multiple Devices

```bash
# Get your machine's IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux

# Access from phone/tablet
http://<your-ip>:1313
```

### Test Responsiveness

```bash
# Use Firefox/Chrome DevTools
# Test at breakpoints: 375px, 768px, 1024px, 1440px
```

### Test Interactive Features

- Quiz: Start, answer, submit
- Mood tracking: Save mood
- Dark mode: Toggle and refresh
- localStorage: Check persists after refresh

## Reporting Issues with PRs

Found a problem with a PR?

```markdown
## Issue Title

### Problem

What's wrong?

### Steps to Reproduce

1. Step 1
2. Step 2
3. Expected vs. actual

### Suggestion

How could this be better?
```

## Questions?

- Check existing issues/discussions
- Ask in PR comments
- Review documentation first

## Recognition

Contributors are recognized in:

- Commit history
- Release notes
- README contributors section

## License

By contributing, you agree your code is licensed under MIT license.

---

**Thank you for contributing! Your work makes the theme better for everyone. 🎉**
