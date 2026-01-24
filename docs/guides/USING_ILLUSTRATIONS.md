# Using Illustrations in Your Self-Help Hugo Theme

This theme now uses **local Undraw illustrations** with full **dark mode support**. Everything is **data-driven from markdown** - no hardcoded HTML needed!

## Quick Start

### 1. Home Page Content (Data-Driven)

All home page content lives in `/content/_index.md`:

```toml
+++
[hero]
headline = "Master your mind"
subheadline = "with daily CBT."
description = "Your description here"
illustration = "meditation"  # ← Illustration name (without undraw_ prefix)

[[features]]
title = "Your Feature"
description = "Feature description"
icon = "check-circle"  # check-circle, chart, lock, or users
color = "indigo"  # indigo, purple, green, or pink
decoration = "fun-star"  # See Handcrafts section

[[testimonials]]
quote = "Amazing platform!"
author = "Jane Doe"
initials = "JD"
color = "indigo"

[[faqs]]
question = "Your question?"
answer = "Your answer."
+++
```

### 2. Course Cards (Data-Driven)

Add illustrations to courses in `/content/courses/*.md`:

```yaml
---
title: "CBT for Anxiety"
description: "Master your anxiety..."
illustration: "processing-thoughts"  # ← Local illustration
category: "Anxiety"
duration: "6 weeks"
level: "Beginner"
---
```

The course list page automatically displays these illustrations with dark mode support!

### 3. Available Illustrations

We have **43 local Undraw illustrations** in `assets/illustrations/undraw-raw/`:

#### 🧘 Meditation & Mindfulness
- `meditation` - Meditation scene
- `meditating` - Person meditating
- `mindfulness` - Mindfulness practice
- `yoga` - Yoga pose
- `relaxing-outdoors` - Outdoor relaxation

#### 📚 Learning & Education
- `online-learning` - E-learning
- `learning` - Learning concept
- `learning-to-sketch` - Creative learning
- `continuous-learning` - Growth
- `education` - Education theme
- `knowledge` - Knowledge base
- `taking-notes` - Note-taking
- `homework-research` - Research

#### ✍️ Writing & Journaling
- `blogging` - Blogging
- `book-writer` - Writing
- `writing-down-ideas` - Ideas
- `writing-online` - Online writing

#### 😊 Happiness & Positive Emotions
- `happy-feeling` - Happy mood
- `happy` - General happiness
- `happy-2021` - Celebration
- `happy-announcement` - Good news
- `happy-news` - Positive updates
- `happy-new-year` - New beginnings
- `positive-attitude` - Optimism

#### 🎉 Achievement & Progress
- `accomplishments` - Milestones
- `celebration` - Celebration
- `fireworks` - Major achievement
- `breaking-barriers` - Overcoming challenges
- `growth-curve` - Progress tracking
- `stepping-up` - Personal growth

#### 🌱 Wellness & Self-Care
- `camping` - Outdoor activities
- `beach-day` - Relaxation
- `chilling` - Rest/downtime
- `fitness-influencer-avatar` - Physical wellness
- `watering-plants` - Self-care metaphor
- `processing-thoughts` - Mental processing

#### 📖 Content & Publishing
- `online-articles` - Articles
- `publish-article` - Publishing
- `everyday-design` - Daily activities
- `proud-self` - Self-esteem

#### ⚙️ Miscellaneous
- `forgot-password` - Auth pages
- `five-year-plan` - Goal setting
- `too-many-options` - Decision-making

### 4. Using Illustrations in Custom Templates

In any Hugo template, use the `undraw.html` partial:

```html
{{ partial "undraw.html" (dict "name" "meditation" "class" "w-64 h-64") }}
```

**Parameters:**
- `name` (required): Illustration name without `undraw_` prefix
- `width`: Tailwind width class (default: `w-full`)
- `height`: Tailwind height class (default: `h-auto`)
- `alt`: Alt text for accessibility (default: humanized name)
- `class`: Additional CSS classes

**Example with options:**
```html
{{ partial "undraw.html" (dict
  "name" "happy-feeling"
  "width" "w-96"
  "height" "h-96"
  "alt" "Happy person"
  "class" "mx-auto"
) }}
```

### 5. Dark Mode Support

Dark mode is **automatic**! The CSS applies:
- `filter: brightness(0.9) saturate(0.95)` in dark mode
- Smooth transitions between light/dark
- Works across all illustrations

### 6. Handcrafts Decorative Elements

Use fun decorative accents:

```html
{{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#4f46e5") }}
```

**Available elements:**
- `underline` - Simple line
- `underline-wavy` - Wavy underline
- `underline-dashed` - Dashed line
- `arrow` - Arrow
- `fun-arrow` - Arrow with dot
- `check` - Checkmark
- `heart` - Heart shape
- `star` - 5-point star
- `fun-star` - Decorative star

### 7. Color Palette for Consistency

Use these colors for features, badges, and decorations:

```toml
indigo = "#4f46e5"   # Primary brand color
purple = "#a855f7"   # Secondary
green = "#16a34a"    # Success/positive
pink = "#ec4899"     # Accent
```

## Best Practices

✅ **DO:**
- Store all content in markdown front matter
- Use descriptive illustration names that match content
- Test in both light and dark modes
- Use Tailwind classes for responsive sizing

❌ **DON'T:**
- Hardcode HTML content in templates
- Use illustrations with unclear subjects
- Override dark mode filters (they're optimized)
- Use external image URLs (use local illustrations)

## Example: Complete Course Setup

```yaml
---
title: "Stress Management"
description: "Learn to manage daily stress with proven techniques."
illustration: "meditation"
category: "Mental Health"
duration: "6 weeks"
level: "Beginner"
---

Your course content here in markdown.
```

That's it! The theme automatically:
- Displays the illustration on the course card
- Applies dark mode styling
- Handles responsive sizing
- Provides accessibility alt text

## Troubleshooting

**Illustration not showing?**
1. Check the filename in `assets/illustrations/undraw-raw/`
2. Use the name **without** the `undraw_` prefix
3. Don't include the file extension

**Dark mode looking off?**
- Rebuild CSS: `npm run build:css`
- Clear browser cache
- Check that `dark:` class is on `<html>` element

**Want to add more illustrations?**
1. Download from [undraw.co](https://undraw.co/illustrations)
2. Place in `assets/illustrations/undraw-raw/`
3. Use the filename (without `undraw_` and `.svg`)

---

## Migration from Old System

Old way (hardcoded):
```html
<img src="https://undraw.co/api/illustrations/meditation" />
```

New way (data-driven):
```yaml
illustration: "meditation"
```

The template handles everything automatically!
