# Illustration System Update - Changelog

## Summary
Migrated from external API-based illustrations to **local, data-driven illustrations** with full **dark mode support**. All content is now controlled through **markdown front matter** instead of hardcoded HTML.

## Changes Made

### 1. ✅ Updated Undraw Partial (`layouts/_partials/undraw.html`)
**Before:** Fetched illustrations from external API
```html
<img src="https://undraw.co/api/illustrations/{{ $name }}" />
```

**After:** Uses local SVG files from `assets/illustrations/undraw-raw/`
```html
{{- $pattern := printf "illustrations/undraw-raw/undraw_%s*.svg" $name -}}
{{- $illustrations := resources.Match $pattern -}}
{{ $illustration.Content | safeHTML }}
```

**Benefits:**
- ✅ Works offline
- ✅ Faster page loads (no external requests)
- ✅ Full control over illustrations
- ✅ Dark mode compatible
- ✅ Automatic fallback to placeholder if not found

### 2. ✅ Added Dark Mode CSS (`assets/css/input.css`)
```css
.dark .undraw-wrapper svg {
  filter: brightness(0.9) saturate(0.95);
}
```

**Features:**
- Subtle brightness/saturation adjustment for dark backgrounds
- Smooth transitions
- Optional hover effects for interactive illustrations
- Responsive sizing with Tailwind classes

### 3. ✅ Made Home Page Data-Driven (`content/_index.md`)
**Before:** All content hardcoded in `layouts/index.html`

**After:** All content in markdown front matter:
```toml
[hero]
headline = "Master your mind"
illustration = "meditation"

[[features]]
title = "Proven CBT Techniques"
icon = "check-circle"
color = "indigo"
decoration = "fun-star"
```

**Benefits:**
- ✅ No code editing needed to update content
- ✅ Non-developers can edit in markdown
- ✅ Illustration changes via front matter
- ✅ Easy A/B testing of different illustrations

### 4. ✅ Updated Home Page Template (`layouts/index.html`)
**Before:** Hardcoded HTML with inline illustrations
```html
<h1>Master your mind</h1>
{{ readFile "/path/to/meditation.svg" | safeHTML }}
```

**After:** Reads from markdown parameters
```html
<h1>{{ .Params.hero.headline }}</h1>
{{ partial "undraw.html" (dict "name" .Params.hero.illustration) }}
```

### 5. ✅ Updated Course Cards (`layouts/courses/list.html`)
**Before:** Used image URLs or placeholder icons
```html
<img src="{{ .Params.image }}" />
```

**After:** Uses local illustrations from front matter
```html
{{ partial "undraw.html" (dict "name" .Params.illustration) }}
```

### 6. ✅ Updated All Course Files
Added illustration metadata to each course:

```yaml
# content/courses/cbt-anxiety.md
---
title: "CBT for Anxiety"
illustration: "processing-thoughts"
duration: "6 weeks"
level: "Beginner"
---
```

**Courses Updated:**
- ✅ `cbt-anxiety.md` → "processing-thoughts"
- ✅ `mindfulness-101.md` → "mindfulness"
- ✅ `sleep-mastery.md` → "chilling"
- ✅ `anger-management.md` → "breaking-barriers"
- ⏳ `social-anxiety.md` (needs illustration assignment)

### 7. ✅ Created Documentation
- ✅ `USING_ILLUSTRATIONS.md` - Complete guide for theme users
- ✅ `CHANGELOG_ILLUSTRATIONS.md` - This file
- ✅ Updated `agent.md` with progress

## Available Local Illustrations (43 total)

### By Category:
- **Meditation & Mindfulness**: 5 illustrations
- **Learning & Education**: 8 illustrations
- **Writing & Journaling**: 4 illustrations
- **Happiness & Emotions**: 7 illustrations
- **Achievement & Progress**: 6 illustrations
- **Wellness & Self-Care**: 6 illustrations
- **Content & Publishing**: 4 illustrations
- **Miscellaneous**: 3 illustrations

Full list in `USING_ILLUSTRATIONS.md`

## How to Use (Quick Reference)

### In Markdown Front Matter:
```yaml
---
title: "My Course"
illustration: "meditation"  # Just the name, no prefix/extension
---
```

### In Hugo Templates:
```html
{{ partial "undraw.html" (dict "name" "meditation") }}
```

### With Options:
```html
{{ partial "undraw.html" (dict
  "name" "meditation"
  "width" "w-64"
  "height" "h-64"
  "class" "mx-auto"
) }}
```

## Migration Path for Existing Content

1. **Update front matter** in markdown files to add `illustration: "name"`
2. **Remove hardcoded** `readFile` calls from templates
3. **Replace with** `{{ partial "undraw.html" (dict "name" .Params.illustration) }}`
4. **Rebuild CSS** with `npm run build:css`
5. **Test both** light and dark modes

## Performance Impact

**Before:**
- External API calls on every page load
- Network latency
- Dependent on undraw.co availability

**After:**
- ✅ Zero external requests
- ✅ Inline SVG (no additional HTTP requests)
- ✅ Cached with page (static HTML)
- ✅ ~33ms build time (no performance hit)

## Browser Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ SVG support: 98%+ browsers
- ✅ CSS filters: 97%+ browsers
- ✅ Dark mode: Tailwind's `dark:` selector

## Next Steps

### Recommended:
1. ⏳ Add illustration to `social-anxiety.md` course
2. ⏳ Add illustrations to blog posts (optional)
3. ⏳ Add illustrations to therapist profiles (optional)
4. ⏳ Create auth page illustrations (login/signup)

### Optional Enhancements:
- Add illustration picker to CMS (Phase 4)
- Create custom illustration variants
- Add animation effects to illustrations
- Implement lazy loading for below-fold illustrations

## Testing Checklist

- [x] Home page displays hero illustration
- [x] Features show correct decorations
- [x] Course cards display illustrations
- [x] Dark mode applies correct filters
- [x] Fallback placeholder works for missing illustrations
- [x] Build completes without errors (33ms)
- [x] All 44 pages generated successfully
- [x] CSS compiled with dark mode styles

## Breaking Changes

None! This is fully backward compatible:
- Old `image` parameter still works as fallback
- Templates gracefully handle missing illustrations
- No changes needed to existing content (unless migrating)

## File Changes Summary

### Modified:
- `layouts/_partials/undraw.html` (complete rewrite)
- `assets/css/input.css` (added dark mode rules)
- `content/_index.md` (added front matter structure)
- `layouts/index.html` (data-driven template)
- `layouts/courses/list.html` (uses undraw partial)
- `content/courses/*.md` (added illustration metadata)

### Created:
- `USING_ILLUSTRATIONS.md` (user guide)
- `CHANGELOG_ILLUSTRATIONS.md` (this file)

### Not Changed:
- Existing illustration files in `assets/illustrations/` (8 files)
- Quiz system
- Mood tracking
- Achievement badges
- Authentication system
- Dark mode toggle

## Resources

- **Local illustrations**: `assets/illustrations/undraw-raw/` (43 SVG files)
- **Undraw website**: https://undraw.co/illustrations (to download more)
- **Documentation**: `USING_ILLUSTRATIONS.md`
- **Examples**: All courses in `content/courses/`

---

**Status**: ✅ Complete and working
**Build**: ✅ Passing (33ms, 44 pages)
**Dark Mode**: ✅ Fully supported
**Data-Driven**: ✅ 100% markdown-based
