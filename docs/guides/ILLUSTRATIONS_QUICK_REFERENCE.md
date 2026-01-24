# Quick Reference: Undraw & Handcrafts Usage

## Handcrafts Decorative Elements

### Basic Usage
```html
{{ partial "handcrafts.html" (dict "element" "NAME" "stroke" "COLOR" "class" "TAILWIND_CLASSES") }}
```

### Available Elements

| Element | Use Case | Example |
|---------|----------|---------|
| `underline` | Simple line under text | Feature headers |
| `underline-wavy` | Wavy decorative underline | **Recommended**: Feature cards (currently used) |
| `underline-dashed` | Dashed underline | Section dividers |
| `arrow` | Right-pointing arrow | Call-to-action highlights |
| `fun-arrow` | Arrow with dot accent | Interactive elements |
| `check` | Checkmark | Completed items, features |
| `heart` | Heart shape | Love/appreciation sections |
| `star` | 5-point star | Ratings, featured items |

### Examples in Code

**Feature Card with Wavy Underline**
```html
<div class="feature-card">
  <h3>Feature Title</h3>
  <div class="mt-4 h-1 w-12">
    {{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#4f46e5") }}
  </div>
  <p>Description here</p>
</div>
```

**Section Divider**
```html
<div class="flex justify-center my-12">
  {{ partial "handcrafts.html" (dict "element" "underline-dashed" "stroke" "#cbd5e1" "class" "w-32") }}
</div>
```

**With Current Color**
```html
<h2>My Heading
  {{ partial "handcrafts.html" (dict "element" "fun-star" "stroke" "currentColor" "class" "w-6 h-6") }}
</h2>
```

---

## Undraw Illustrations

### Basic Usage
```html
{{ partial "undraw.html" (dict "name" "ILLUSTRATION_NAME" "width" "w-64" "height" "h-64" "color" "#6366f1") }}
```

### Popular Mental Health Illustrations

| Name | Best For |
|------|----------|
| `meditation` | Meditation, mindfulness content |
| `anxiety` | Anxiety management content |
| `sleep` | Sleep courses, rest content |
| `breathing` | Breathing exercise pages |
| `learning` | Course pages, educational content |
| `journaling` | Journal section, reflective content |
| `happy` | Celebration, positive mindset |
| `party` | Achievements, milestones |
| `mindfulness` | Mindfulness resources |
| `thinking` | Problem-solving, CBT concepts |

### Browse All
Visit **https://undraw.co/illustrations** to search for more illustrations

### Examples in Code

**Hero Section**
```html
<div class="hero">
  <div class="hero-text">
    <h1>Master Your Mind</h1>
  </div>
  <div class="hero-image w-full md:w-1/2">
    {{ partial "undraw.html" (dict "name" "meditation" "width" "w-full" "height" "h-auto") }}
  </div>
</div>
```

**Course Card**
```html
<div class="course-card">
  <div class="course-image h-32">
    {{ partial "undraw.html" (dict "name" "learning" "width" "w-full" "height" "h-full") }}
  </div>
  <h3>{{ .Title }}</h3>
  <p>{{ .Description }}</p>
</div>
```

**With Custom Color**
```html
{{ partial "undraw.html" (dict 
  "name" "meditation"
  "width" "w-64"
  "height" "h-64"
  "color" "#ec4899"
  "alt" "Person meditating"
  "class" "rounded-lg shadow-lg"
) }}
```

**Responsive Sizing**
```html
{{ partial "undraw.html" (dict 
  "name" "learning"
  "width" "w-full sm:w-96 lg:w-full"
  "height" "h-64 lg:h-96"
) }}
```

---

## Combined Usage: Feature Section

```html
<section class="feature-section">
  <div class="container">
    <h2>Our Approach</h2>
    {{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#6366f1" "class" "h-1 w-24 mx-auto") }}
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      <div class="feature-card bg-indigo-50 rounded-lg p-6">
        <div class="h-32 mb-4">
          {{ partial "undraw.html" (dict "name" "meditation" "width" "w-full" "height" "h-full") }}
        </div>
        <h3>Mindfulness Training</h3>
        <p>Learn proven meditation techniques.</p>
      </div>
      
      <div class="feature-card bg-purple-50 rounded-lg p-6">
        <div class="h-32 mb-4">
          {{ partial "undraw.html" (dict "name" "breathing" "width" "w-full" "height" "h-full") }}
        </div>
        <h3>Breathing Exercises</h3>
        <p>Control anxiety with guided breathing.</p>
      </div>
      
      <div class="feature-card bg-green-50 rounded-lg p-6">
        <div class="h-32 mb-4">
          {{ partial "undraw.html" (dict "name" "learning" "width" "w-full" "height" "h-full") }}
        </div>
        <h3>Learn Anytime</h3>
        <p>Self-paced courses at your speed.</p>
      </div>
    </div>
  </div>
</section>
```

---

## Color Reference

### Tailwind Color Palette (Used in Theme)
- Indigo: `#6366f1`, `#818cf8`
- Purple: `#a855f7`, `#d946ef`
- Green: `#16a34a`, `#4ade80`
- Pink: `#ec4899`, `#f472b6`

### Using CSS Variables
```css
/* In your CSS */
--primary-color: #6366f1;
--secondary-color: #a855f7;
```

### Dark Mode Considerations
Handcrafts and Undraw both support dark themes naturally. Use `currentColor` for automatic dark mode support:
```html
{{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "currentColor") }}
```

---

## Performance Tips

1. **Lazy Load**: Undraw illustrations support lazy loading via `loading="lazy"` attribute (automatic in partial)
2. **Cache**: Illustrations are cached by Undraw's CDN
3. **Handcrafts**: Inline SVGs are minimal (~2KB each)
4. **Total Size**: Minimal impact on page load (cached illustrations + tiny inline SVGs)

---

## Troubleshooting

**Illustration not showing?**
- Check illustration name at https://undraw.co/illustrations
- Ensure name uses hyphens not spaces (e.g., `sleep-tracking` not `sleep tracking`)

**Color not applied?**
- For Undraw: Colors apply to primary illustration elements
- For Handcrafts: Color must be valid hex or CSS color

**Elements appear too small/large?**
- Handcrafts: Adjust with `class` parameter (w-12, h-1, etc.)
- Undraw: Adjust with `width` and `height` parameters

---

## Documentation
- Full guide: [ILLUSTRATIONS.md](ILLUSTRATIONS.md)
- Undraw library: https://undraw.co/illustrations
- Handcrafts tool: https://handcrafts.undraw.co/app
