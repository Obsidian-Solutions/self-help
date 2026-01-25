# Self-Help Theme: Complete Documentation

A modern, reusable Hugo theme for mental health, self-help, and educational websites. Built with Tailwind CSS, interactive quizzes, mood tracking, and achievements.

## 🎯 Features

### Visual Design

- ✅ **Dark Mode** - Full dark theme support with persistent toggle
- ✅ **Undraw Illustrations** - Access to 1000+ beautiful open-source SVG illustrations
- ✅ **Handcrafts Elements** - Decorative SVG elements for accents and visual interest
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Tailwind CSS** - Modern utility-first CSS framework

### Interactive Features

- ✅ **Quiz Engine** - Multiple choice quizzes with immediate feedback and scoring
- ✅ **Embedded Quizzes** - Add quizzes to lessons via front-matter YAML
- ✅ **Mood Tracking** - Daily mood check-ins with emoji selector
- ✅ **Streak Counter** - Track consecutive days of activity
- ✅ **Achievement Badges** - Unlock badges based on quiz scores and activity
- ✅ **Progress Tracking** - Monitor course and lesson completion

### Data & Privacy

- ✅ **100% Client-Side** - All data stored in browser localStorage
- ✅ **No Server Required** - Completely static site generation
- ✅ **Open Source** - MIT license, free to use and modify
- ✅ **Open Illustrations** - Undraw illustrations under open license

## 📁 Project Structure

```
self-help/                          # Theme root
├── layouts/
│   ├── _default/                  # Default page layouts
│   ├── _partials/
│   │   ├── handcrafts.html        # Decorative SVG elements
│   │   ├── undraw.html            # Undraw illustration component
│   │   ├── quiz/
│   │   │   ├── quiz-engine.html   # Core quiz system
│   │   │   └── course-quiz.html   # Course-specific quiz wrapper
│   │   └── ...
│   ├── courses/
│   ├── dashboard/                 # User dashboard
│   ├── lessons/
│   ├── index.html                 # Home page
│   └── ...
├── content/                       # Example content (demo)
│   ├── courses/                   # Course definitions
│   ├── lessons/                   # Lesson content with optional quizzes
│   ├── dashboard/
│   ├── posts/
│   └── ...
├── assets/
│   ├── css/
│   │   ├── input.css              # Tailwind input
│   │   └── main.css               # Additional styles
│   ├── js/
│   │   ├── auth.js
│   │   ├── dark-mode.js
│   │   └── main.js
│   └── illustrations/             # SVG illustration files
├── static/                        # Static assets
├── public/                        # Generated site output
├── hugo.toml                      # Hugo configuration
├── tailwind.config.js             # Tailwind configuration
└── package.json                   # Node dependencies
```

## 🚀 Quick Start

### Installation

1. **Copy theme to your Hugo project:**

   ```bash
   cp -r self-help your-project/themes/
   ```

2. **Update your site's hugo.toml:**

   ```toml
   theme = "self-help"
   baseURL = "https://yourdomain.com/"
   ```

3. **Install dependencies:**

   ```bash
   cd your-project
   npm install
   npm run build:css
   ```

4. **Start development server:**

   ```bash
   hugo server -D
   ```

### Creating Content

**Create a Course:**

```toml
# content/courses/my-course.md
+++
title = "My Course"
description = "Learn about..."
order = 1
+++

Course content here.
```

**Create a Lesson with Quiz:**

```toml
# content/lessons/lesson-1.md
+++
title = "Lesson 1: Introduction"
course = "My Course"
order = 1
description = "This lesson covers the basics..."

[quiz]
description = "Test your understanding"
resultMessage = "Great job!"

[[quiz.questions]]
question = "What is CBT?"
options = ["Cognitive Behavioral Therapy", "Computer-Based Training", "Other"]
correct = 0
explanation = "CBT is a form of psychotherapy..."

[[quiz.questions]]
question = "Second question?"
options = ["Option A", "Option B", "Option C"]
correct = 1
explanation = "The answer is B because..."
+++

Lesson content here...
```

## 📝 Documentation Files

1. **[ILLUSTRATIONS.md](ILLUSTRATIONS.md)** - Complete guide to Undraw and Handcrafts integration (400+ lines)
   - How to use the `undraw.html` partial
   - How to use the `handcrafts.html` partial
   - Available illustrations
   - Customization options
   - Color and styling examples

2. **[ILLUSTRATIONS_QUICK_REFERENCE.md](ILLUSTRATIONS_QUICK_REFERENCE.md)** - Quick lookup for common usage
   - Element cheat sheet
   - Code examples
   - Popular illustrations
   - Common patterns

3. **[QUIZ_DOCUMENTATION.md](QUIZ_DOCUMENTATION.md)** - Complete quiz system guide (400+ lines)
   - Quiz front-matter YAML structure
   - Quiz engine architecture
   - Achievement system
   - localStorage data schema
   - Best practices

4. **[agent.md](agent.md)** - Development progress and technical notes
   - Phase-by-phase progress
   - Files modified and created
   - Reusable components inventory
   - Integration strategies

## 🎨 Using Illustrations

### Handcrafts (Decorative Elements)

Add decorative SVG accents with customizable colors and styles:

```html
<!-- Wavy underline -->
{{ partial "handcrafts.html" (dict "element" "underline-wavy" "stroke" "#6366f1" "class" "h-1 w-12")
}}

<!-- Fun arrow with dot -->
{{ partial "handcrafts.html" (dict "element" "fun-arrow" "stroke" "currentColor") }}

<!-- Checkmark -->
{{ partial "handcrafts.html" (dict "element" "check" "stroke" "#16a34a") }}
```

**Available Elements:** `underline`, `underline-wavy`, `underline-dashed`, `arrow`, `fun-arrow`, `check`, `heart`, `star`

### Undraw (Full Illustrations)

Access 1000+ beautiful illustrations from Undraw library:

```html
<!-- Simple meditation illustration -->
{{ partial "undraw.html" (dict "name" "meditation") }}

<!-- With custom sizing and color -->
{{ partial "undraw.html" (dict "name" "learning" "width" "w-64" "height" "h-64" "color" "#ec4899" )
}}

<!-- Responsive sizing -->
{{ partial "undraw.html" (dict "name" "breathing" "width" "w-full sm:w-96" "height" "h-32 md:h-64" )
}}
```

**Popular Illustrations for Mental Health:**

- `meditation` - Meditation and mindfulness
- `anxiety` - Anxiety management
- `sleep` - Sleep and rest
- `breathing` - Breathing exercises
- `learning` - Educational content
- `journaling` - Journaling and reflection
- `happy` - Positive emotions
- `party` - Celebration and achievements

Browse all 1000+ at: https://undraw.co/illustrations

## 📊 Interactive Features

### Quiz System

Quizzes are defined in the front-matter of lesson content:

```yaml
[quiz]
description = "What have you learned?"
resultMessage = "Excellent work!"

[[quiz.questions]]
question = "Question text?"
options = ["A", "B", "C", "D"]
correct = 0  # Index of correct answer
explanation = "Explanation of the answer..."
```

Quiz features:

- Immediate feedback after each answer
- Percentage scoring
- Results page with customizable message
- localStorage persistence
- Achievement unlocking (80%+ score)

### Mood Tracking

Daily mood check-ins with localStorage persistence:

- 5 emoji moods: 😢 😕 😐 🙂 😄
- Automatic streak counter
- Visual representation on dashboard
- Private (all client-side)

### Achievement System

Unlock badges based on activity:

- "First Course" - Started first course
- "7-Day Streak" - 7 consecutive days of activity
- "Feelings Expert" - Completed emotion-related quiz
- "Anxiety Master" - Completed anxiety course
- "Sleep Master" - Completed sleep course
- "Journal Pro" - Written 10 journal entries

Trigger badges via quiz scores ≥80%:

```html
{{ if .Params.quiz }} if (score >= 80) { awardBadge('feelings-explorer'); } {{ end }}
```

## 🔧 Configuration

### tailwind.config.js

The theme uses Tailwind CSS with selector-based dark mode:

```js
export default {
  darkMode: ['selector', '[class~="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // Indigo
      },
    },
  },
};
```

### hugo.toml

Essential configuration:

```toml
baseURL = "https://example.com/"
title = "Self-Help Theme"
theme = "self-help"
languageCode = "en-us"

[params]
description = "A modern Hugo theme for mental health and self-help content"
author = "Your Name"

[outputs]
home = ["HTML", "JSON"]
```

## 🛠️ Building & Deployment

### Development

```bash
# Install dependencies
npm install

# Build CSS (watch mode)
npm run build:css

# Start Hugo server
hugo server -D
```

### Production

```bash
# Build CSS (minified)
npm run build:css

# Build site
hugo --minify

# Deploy 'public' directory to your host
# (Netlify, Vercel, GitHub Pages, traditional hosting, etc.)
```

## 📦 Dependencies

- **Hugo** v0.90+
- **Tailwind CSS** v3.4+
- **Node.js** 16+ (for CSS building)

Optional:

- **GitHub/GitLab** for content management
- **Wagtail/Strapi** for future CMS integration (planned)

## 🎓 Use Cases

This theme is perfect for:

- 📚 Online courses and educational content
- 🧠 Mental health and therapy applications
- 🎯 Self-help and personal development
- 💪 Wellness programs
- 🎨 Creative learning platforms
- 🏥 Health and medical education

## 📄 License

- **Theme Code**: MIT License - Free to use and modify
- **Undraw Illustrations**: Open source, free for commercial and personal use
- **Handcrafts Elements**: Open source, free for commercial and personal use

## 🚦 Next Steps

### Phase 1: Visual Polish (80% complete)

- ✅ Dark mode
- ✅ Undraw integration
- ✅ Handcrafts decorations
- ⏳ More illustrations across pages
- ⏳ Additional page templates

### Phase 2-3: Content (Complete)

- ✅ Quiz engine
- ✅ Mood tracking
- ✅ Achievements
- ✅ Embedded quizzes in lessons

### Phase 4: CMS (Planned)

- 🔲 Evaluate Wagtail/Strapi/Payload
- 🔲 Design content models
- 🔲 Plan admin interface
- 🔲 Migration strategy

## 📞 Support & Credits

- **Developer**: Built with ❤️ by [Obsidian Solutions](https://obsidiansolutions.co.uk)
- **Repository**: [GitHub Issues & Source](https://github.com/Obsidian-Solutions/self-help)
- **Undraw Library**: [undraw.co](https://undraw.co/) (1000+ illustrations)
- **Hugo Docs**: [gohugo.io](https://gohugo.io/documentation/)
- **Tailwind Docs**: [tailwindcss.com](https://tailwindcss.com/docs)

---

**MindFull Hugo Theme - Professional Mental Health & Education Platform**  
Maintained by [Obsidian Solutions](https://obsidiansolutions.co.uk)
