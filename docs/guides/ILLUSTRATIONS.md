# Illustrations & Decorative Elements Guide

This theme integrates **Undraw illustrations** and **Handcrafts decorative elements** to create visually appealing, professional designs.

## Undraw Illustrations

Undraw provides a massive library of beautiful, open-source SVG illustrations perfect for mental health applications.

### Using Undraw Illustrations

**Partial:** `{{ partial "undraw.html" ... }}`

**Parameters:**

- `name` (required): Illustration name from Undraw library
  - Examples: `meditation`, `anxiety`, `sleep`, `learning`, `breathing`, `journaling`, `happy`, `party`
  - Browse all: https://undraw.co/illustrations
- `width` (optional): Tailwind width class (default: `w-full`)
- `height` (optional): Tailwind height class (default: `h-auto`)
- `color` (optional): Hex color for illustration (default: `#6366f1`)
- `alt` (optional): Alt text for accessibility
- `class` (optional): Additional CSS classes

**Example:**

```html
{{ partial "undraw.html" (dict "name" "meditation" "width" "w-64" "height" "h-64") }}
```

### Available Illustrations for Mental Health Themes

**Core Illustrations (Already Used):**

- `meditation` - Person meditating
- `anxiety` - Anxiety-related illustration
- `sleep` - Sleep/rest illustration
- `breathing` - Breathing exercises
- `learning` - Educational content
- `journaling` - Journal/writing
- `happy` - Happiness/celebration
- `party` - Celebration/achievements

**Other Relevant Illustrations:**

- `mindfulness` - Mindfulness practices
- `therapy` - Therapeutic scenarios
- `support` - Support/help themed
- `growth` - Personal growth
- `goals` - Goal setting
- `community` - Community/connection
- `thinking` - Problem-solving/thinking

### Finding More Illustrations

1. Visit https://undraw.co/illustrations
2. Search for relevant keywords
3. Click to download SVG
4. Use the illustration name in the partial

## Handcrafts Decorative Elements

Handcrafts provides beautiful, minimalist decorative SVG elements perfect for accents and visual embellishments.

### Using Handcrafts Elements

**Partial:** `{{ partial "handcrafts.html" ... }}`

**Parameters:**

- `element` (required): Element type
  - `underline` - Simple straight underline
  - `underline-wavy` - Wavy underline
  - `underline-dashed` - Dashed underline
  - `arrow` - Simple arrow
  - `fun-arrow` - Arrow with accent dot
  - `check` - Checkmark
  - `heart` - Heart shape
  - `star` - 5-point star
  - (More can be added)
- `stroke` (optional): Color for the element (default: `currentColor`)
- `class` (optional): Tailwind classes for sizing

**Examples:**

**Decorative underline in feature cards:**

```html
<div class="mt-4 h-1 w-12">
  {{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#4f46e5" "class" "h-1") }}
</div>
```

**As an accent in headers:**

```html
<h2>
  Feature Title {{ partial "handcrafts.html" (dict "element" "fun-star" "stroke" "#f97316") }}
</h2>
```

**As a section divider:**

```html
<div class="flex justify-center my-8">
  {{ partial "handcrafts.html" (dict "element" "underline-dashed" "stroke" "#9ca3af" "class" "w-48")
  }}
</div>
```

## Current Implementation

### Home Page (`/layouts/index.html`)

- **Hero Section:** Meditation illustration from custom SVGs
- **Feature Cards:** 4 cards with Handcrafts decorative underlines and fun-star accents
- **Color Scheme:** Indigo, Purple, Green, Pink with gradient backgrounds

### Dashboard (`/layouts/dashboard/list.html`)

- Mood tracker widget with emoji
- Achievement badges
- Progress visualization
- Today's Learning quiz section

### Course Pages (`/layouts/courses/single.html`)

- Course descriptions
- Lesson listings
- Progress tracking

## Adding Illustrations to Custom Pages

### Example: Course Card with Illustration

```html
<div class="course-card">
  <div class="illustration-wrapper">
    {{ partial "undraw.html" (dict "name" "learning" "width" "w-32" "height" "h-32") }}
  </div>
  <h3>{{ .Title }}</h3>
  <p>{{ .Description }}</p>
</div>
```

### Example: Section with Decorative Elements

```html
<section class="feature-section">
  <h2>
    Our Approach {{ partial "handcrafts.html" (dict "element" "fun-star" "stroke" "currentColor") }}
  </h2>

  <p>{{ .Content }}</p>

  <div class="mt-6">
    {{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#6366f1" "class" "w-24")
    }}
  </div>
</section>
```

## Customizing Colors

### Handcrafts Colors

Use any hex color or Tailwind color value:

```html
{{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#6366f1" /* or "rgb(99, 102,
241)" or "#f97316" */ ) }}
```

### Undraw Colors

Illustrations can be customized via color parameters:

```html
{{ partial "undraw.html" (dict "name" "meditation" "color" "#ec4899" /* Changes primary colors in
illustration */ ) }}
```

## File Sizes & Performance

- **Undraw SVGs:** 15-35KB (but optimized and cached by CDN)
- **Handcrafts Elements:** Inline SVGs, ~2KB per element
- **Total Impact:** Minimal with proper caching

## License

- **Undraw:** Open-source, free to use, no attribution required
  - License: https://undraw.co/license
  - Terms: Can use for commercial and personal projects

- **Handcrafts:** Open-source, free to use, created by same team as Undraw
  - License: https://handcrafts.undraw.co/license
  - Terms: Can customize colors and styles freely

## Best Practices

1. **Use Consistent Colors:** Match illustration colors to your brand/theme
2. **Optimize Performance:** Load illustrations lazily with `loading="lazy"`
3. **Accessibility:** Always include meaningful `alt` text
4. **Responsive Design:** Adjust sizes for mobile/desktop:

   ```html
   {{ partial "undraw.html" (dict "name" "meditation" "width" "w-full sm:w-96 lg:w-full" ) }}
   ```

5. **Decorative Elements:** Use Handcrafts sparingly for accents, not primary content
6. **Color Contrast:** Ensure decorative elements have enough contrast with backgrounds

## Extending the Theme

### Adding New Handcrafts Elements

Edit `/layouts/_partials/handcrafts.html` and add new `{{ if eq $element "element-name" }}` blocks with SVG paths.

### Adding New Undraw Illustrations

Simply reference new illustration names from the Undraw library in your layouts. No code changes needed!

### Custom Illustrations

If you need illustrations not available in Undraw:

1. Search Undraw library thoroughly first
2. Consider creating similar style using Undraw's public design files
3. Or commission custom SVG work that matches Undraw's minimalist aesthetic

## Resources

- **Undraw Library:** https://undraw.co/illustrations
- **Undraw Blog:** https://undraw.co/blog (inspiration, design tips)
- **Handcrafts Tool:** https://handcrafts.undraw.co/app
- **Design Principles:** Undraw uses minimalist, flat design with subtle shadows

---

For questions or to add more elements, refer to the main documentation or Undraw's official resources.
