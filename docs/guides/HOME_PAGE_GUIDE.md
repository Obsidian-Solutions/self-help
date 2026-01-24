# Editing the Home Page

The home page is built from a **single markdown file** with all content in the front-matter (TOML format). This makes it easy to edit everything without touching any HTML or code.

## 📄 Location

**File:** `/content/_index.md`

This is the only file you need to edit to customize your home page.

---

## 🏗️ How It Works

The home page (`layouts/index.html`) reads all its content from the front-matter TOML in `_index.md`:

```
markdown file (_index.md)
    ↓
TOML front-matter (structured data)
    ↓
Hugo template (index.html) reads params
    ↓
HTML page is generated
```

**No HTML editing needed** - everything is data-driven!

---

## 🎨 What You Can Edit

### 1. Hero Section

Controls the top banner with headline, description, and call-to-action buttons.

```toml
[hero]
headline = "Master your mind"              # Big headline
subheadline = "with daily CBT."           # Second line (styled in primary color)
description = "Learn proven..."            # Paragraph text
illustration = "meditation"                # SVG illustration name from assets/illustrations/undraw-raw/
primaryCta = "Browse Courses"              # Main button text
primaryCtaLink = "/courses"                # Main button link
secondaryCta = "Log In"                    # Secondary button text
secondaryCtaLink = "/login"                # Secondary button link
```

**Illustration names available:** meditation, anxiety, sleep, breathing, learning, journal, emotions-happy, celebration, mindfulness, growth, support, thinking, and more (see `assets/illustrations/undraw-raw/`)

---

### 2. Features Section

The 4-column feature grid with icons, descriptions, and decorative elements.

```toml
[[features]]
title = "Proven CBT Techniques"
description = "Designed by licensed therapists..."
icon = "check-circle"                      # Heroicon name: check-circle, chart, lock, users
color = "indigo"                           # Tailwind color: indigo, purple, green, pink
decoration = "fun-star"                    # Handcrafts element: fun-star, heart, check, fun-arrow, etc.

[[features]]
title = "Track Your Progress"
description = "Monitor moods, complete lessons..."
icon = "chart"
color = "purple"
decoration = "heart"

# ... add more features with [[ ]] syntax
```

**Available Colors:** `indigo`, `purple`, `green`, `pink`

**Available Icons:** `check-circle`, `chart`, `lock`, `users` (Heroicons)

**Available Decorations:** `fun-star`, `heart`, `check`, `fun-arrow`, `underline-wavy` (Handcrafts elements)

---

### 3. Section Headings

Text for each major section of the page.

```toml
[sections]
featuresHeading = "Features"
featuresTitle = "A better way to heal"
featuresDescription = "Everything you need to take control..."

testimonialsTitle = "Loved by thousands"
testimonialsDescription = "See how MindFull helps people..."

blogTitle = "Latest from the Blog"
blogDescription = "Expert advice and mental health tips."

faqTitle = "Frequently Asked Questions"

pricingTitle = "Simple, transparent pricing"
pricingDescription = "Start for free, upgrade for more."

ctaHeading = "Ready to dive in?"
ctaSubheading = "Start your free trial today."
ctaButton = "Get started"
ctaLink = "/login"
```

---

### 4. Testimonials

Customer testimonial cards with quotes and author info.

```toml
[[testimonials]]
quote = "I've struggled with anxiety..."
author = "Jane Doe"
initials = "JD"                            # 2-letter initials for avatar
color = "indigo"                           # Avatar background color

[[testimonials]]
quote = "Being able to track my mood..."
author = "Mark Smith"
initials = "MS"
color = "green"

# Add more with [[testimonials]]
```

---

### 5. FAQs

Frequently asked questions and answers.

```toml
[[faqs]]
question = "Is this a replacement for therapy?"
answer = "No, MindFull is a self-help tool. While we use..."

[[faqs]]
question = "Is my journal private?"
answer = "Yes! In this demo version, all your data..."

# Add more with [[faqs]]
```

---

### 6. Page Metadata

Basic page information.

```toml
title = 'MindFull - Your Mental Health Companion'  # Browser tab title
date = 2023-01-01T08:00:00-07:00
draft = false                               # false = published, true = hidden
```

---

## ✏️ How to Make Changes

### Example 1: Change the hero headline

**Before:**

```toml
[hero]
headline = "Master your mind"
```

**After:**

```toml
[hero]
headline = "Take Control of Your Mental Health"
```

→ The home page headline updates automatically when Hugo rebuilds!

---

### Example 2: Add a new feature

**Current:**

```toml
[[features]]
title = "Find Therapists"
...
```

**Add this after:**

```toml
[[features]]
title = "Your New Feature"
description = "Your description here."
icon = "users"
color = "indigo"
decoration = "heart"
```

→ A 5th feature card appears automatically!

---

### Example 3: Update testimonials

**Find:**

```toml
[[testimonials]]
quote = "I've struggled with anxiety..."
author = "Jane Doe"
initials = "JD"
color = "indigo"
```

**Change to:**

```toml
[[testimonials]]
quote = "Your new testimonial text here."
author = "Your Name"
initials = "YN"
color = "purple"
```

→ Testimonial updates on the page!

---

### Example 4: Add FAQ

**Add:**

```toml
[[faqs]]
question = "How much does it cost?"
answer = "We offer a free tier and premium plans starting at $9/month."
```

→ New FAQ appears in the section!

---

## 🎨 Customization Guide

### Change Colors

All 4 feature colors are customizable via Tailwind classes:

- `indigo` → Primary color (#6366f1)
- `purple` → Secondary color (#a855f7)
- `green` → Success color (#16a34a)
- `pink` → Accent color (#ec4899)

To use different colors, update the theme's `tailwind.config.js`.

### Change Icons

Available Heroicons: `check-circle`, `chart`, `lock`, `users`

To add more icons, edit `layouts/index.html` and add `{{ else if eq .icon "new-icon" }}` blocks.

### Change Illustrations

To use different Undraw illustrations:

1. Place SVG file in `assets/illustrations/undraw-raw/`
2. Update `illustration = "your-illustration-name"` in front-matter
3. File should be named: `undraw_your_illustration_name*.svg`

---

## 🔄 Editing Workflow

1. **Edit** `/content/_index.md` with any text editor
2. **Save** the file
3. **View** changes:
   - If running `hugo server -D`: page updates automatically
   - If not running server: rebuild with `hugo -D`
4. **Check** `http://localhost:1313/` in browser

---

## 📋 TOML Syntax Tips

**Arrays** (multiple items):

```toml
[[features]]          # Start a new feature
title = "..."

[[features]]          # Another feature
title = "..."
```

**Strings**:

```toml
title = "Simple string"
description = "Can use 'single' or \"double\" quotes"
```

**Multi-line text**:

```toml
answer = """
First paragraph.

Second paragraph with more detail.
"""
```

**Special characters**:

- Use `&` instead of `&` in text
- Use `"` or `'` to wrap strings with quotes inside
- Escape quotes with `\"`

---

## 🚀 Publishing Changes

When you're ready to deploy:

1. **Build CSS**: `npm run build:css`
2. **Build site**: `hugo --minify`
3. **Deploy** the `public/` folder to your host

The home page will reflect all your changes!

---

## 📖 Learn More

- **Overall theme guide**: Read [README.md](README.md)
- **Quiz system**: See [QUIZ_DOCUMENTATION.md](QUIZ_DOCUMENTATION.md)
- **Illustrations**: See [USING_ILLUSTRATIONS.md](USING_ILLUSTRATIONS.md)
- **Development status**: See [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 💡 Pro Tips

1. **Test before publishing** - Use `hugo server -D` to preview changes
2. **Keep it simple** - Long headlines and descriptions can break layouts
3. **Use real testimonials** - Makes the page more trustworthy
4. **Update FAQs regularly** - Address common user questions
5. **Keep hero illustration relevant** - Should match your site's purpose

---

**That's it!** Edit `_index.md`, save, and your home page updates. No code skills needed! 🎉
