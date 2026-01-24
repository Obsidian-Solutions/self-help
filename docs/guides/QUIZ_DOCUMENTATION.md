# Course Content & Quiz Documentation

## Theme Overview

This Hugo theme is designed as a **reusable, feature-rich template** for mental health and wellness education platforms. The content folder contains demo/example content showing how to build courses with embedded quizzes.

## Lesson Structure with Embedded Quizzes

Lessons are the core building blocks of courses. Each lesson can include an embedded quiz to test knowledge.

### Lesson Front Matter Example

```yaml
---
title: "Understanding Anxiety: The Basics"
course: "CBT for Anxiety"           # Links lesson to a course
description: "Learn the fundamentals of anxiety and how CBT can help manage it."
order: 1                             # Display order in course
draft: false
quiz:                               # Optional - add quiz to lesson
  description: "Test your knowledge about anxiety basics"
  resultMessage: "Excellent! You understand the foundations of anxiety management."
  questions:
    - question: "What does CBT stand for?"
      options:
        - "Cognitive Behavioral Therapy"
        - "Cognitive Biological Theory"
        - "Consistent Behavior Training"
        - "Cognitive Bias Testing"
      correct: 0                     # Index of correct answer
      explanation: "CBT stands for Cognitive Behavioral Therapy..."
    
    # Add more questions...
---
```

## Creating a Lesson with a Quiz

### Step 1: Create the Lesson File
Create a new markdown file in `content/lessons/`:
- File: `content/lessons/my-lesson.md`
- Name it descriptively (e.g., `anxiety-basics.md`, `sleep-hygiene-intro.md`)

### Step 2: Add Front Matter
Include metadata and quiz questions:
```yaml
---
title: "Your Lesson Title"
course: "Course Name That Matches a Course File"
description: "Brief description of what students will learn"
order: 1
quiz:
  description: "Optional description of the quiz"
  resultMessage: "Message shown after quiz completion"
  questions:
    - question: "First question?"
      options: ["Option A", "Option B", "Option C", "Option D"]
      correct: 0
      explanation: "Why this answer is correct"
```

### Step 3: Write Lesson Content
Add your lesson content in markdown:
```markdown
---
[Front matter here]
---

## Welcome to Your Lesson

Your lesson content goes here. You can use:
- Headings (##, ###, etc.)
- **Bold** and *italic* text
- Lists
- Code blocks
- Links
```

The quiz will automatically render at the end of the lesson content.

## How Quizzes Work

### Quiz Features
- **Multiple choice questions** with 4 options
- **Immediate feedback** - explanation shown after each question
- **Scoring system** - calculates percentage
- **Results screen** - personalized message based on score
- **Progress tracking** - saves quiz attempts to localStorage
- **Achievement unlocking** - scores ≥80% can unlock badges

### Quiz Data Flow

1. **Lesson loaded** - Front matter quiz data extracted
2. **Quiz initiated** - JavaScript initializes quiz engine with data
3. **Answer selected** - Feedback and explanation shown immediately
4. **Results calculated** - Score and percentage calculated
5. **Data saved** - Results saved to localStorage
6. **Badges awarded** - If score ≥80%, "Feelings Expert" badge unlocked

### JavaScript Integration

The quiz uses Hugo's templating to convert YAML quiz data to JavaScript:

```javascript
const lessonQuizData = {
  title: "Lesson Title - Knowledge Check",
  description: "Test your understanding",
  resultMessage: "Great work!",
  questions: [
    {
      question: "Question text?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explanation: "Explanation text"
    }
  ]
};

initializeQuiz(lessonQuizData);
```

## Quiz Scoring & Achievements

### Score Thresholds
- **80%+** → 🌟 "Excellent Work!" + Unlock "Feelings Expert" badge
- **60-79%** → 👏 "Good Job!"
- **40-59%** → 📚 "Keep Learning!"
- **<40%** → 💪 "Time to Review"

### Achievement Tracking
Achievements are stored in `localStorage.badges`:
```javascript
{
  "first-course": true,        // Completed first course
  "meditation-streak": true,    // 7-day check-in streak
  "feelings-explorer": true,    // Completed 3 quizzes with 80%+
  "anxiety-warrior": true,      // Completed Anxiety course
  "sleep-wizard": true,         // Completed Sleep course
  "journaling-champ": true      // 10+ journal entries
}
```

## Course Structure

Courses are created as simple markdown files in `content/courses/`:
- File: `content/courses/course-name.md`
- The course automatically pulls in all lessons with matching `course:` value

### Course Front Matter
```yaml
---
title: "Course Title"
description: "What students will learn"
image: "/images/course-image.jpg"
category: "Category Name (e.g., Anxiety, Sleep)"
---
```

## Example: Complete Lesson Workflow

1. **Create** → `content/lessons/anxiety-intro.md`
2. **Add front matter** with title, course, and quiz questions
3. **Write content** - lesson material and explanations
4. **Test** - Visit lesson page, take quiz, check results
5. **Verify** - Check browser console localStorage for saved data

## Customization

### Modify Quiz Styling
Edit `/layouts/_partials/quiz/quiz-engine.html` for:
- Colors and gradients
- Button styles
- Animations
- Result screen layout

### Extend Quiz Features
Add to `quiz-engine.html`:
- Timed quizzes
- Question shuffling
- Passing score requirements
- Certificate generation
- Email results

### Add Quiz Types
Create new partials in `layouts/_partials/quiz/`:
- `true-false-quiz.html` - Simple yes/no questions
- `matching-quiz.html` - Match items together
- `essay-quiz.html` - Open-ended questions with rubrics

## Data Persistence

### Stored in localStorage:
- `moodCheckins` - Daily mood selections
- `courseProgress` - Completed lessons/courses
- `badges` - Unlocked achievements
- `quizHistory` - All quiz attempts and scores
- `lastQuizScore` - Most recent quiz percentage

## Best Practices

1. **Keep questions clear** - 1-2 sentences max
2. **Offer distinct options** - Avoid obviously wrong answers
3. **Provide helpful explanations** - Explain why correct answer is right
4. **Test difficulty** - Quizzes should be challenging but fair
5. **Order by difficulty** - Start easier, increase difficulty
6. **Multiple attempts** - Allow retakes to encourage learning
7. **Positive messaging** - Encourage users at all score levels

## Future Enhancements

This theme is built for eventual CMS integration (Phase 4):
- Admin dashboard for creating quizzes
- Question bank/library
- Quiz analytics and reporting
- Student progress tracking
- Automated grading and feedback
- Spaced repetition scheduling
- Certification system
