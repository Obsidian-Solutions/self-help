---
title: 'Quizzes'
weight: 10
---

MindFull includes a powerful client-side quiz engine. Quizzes are defined directly in the frontmatter of any lesson file.

## 1. Quick Start Checklist

- [ ] Create a new lesson in `content/lessons/`.
- [ ] Define the `quiz` block in frontmatter.
- [ ] Add at least one question with options.
- [ ] Set the `correct` index (0-3).
- [ ] Provide an explanation for the answer.

## 2. Frontmatter Schema

```yaml
quiz:
  title: 'Basics of CBT'
  description: 'Test your knowledge of Cognitive Behavioral Therapy.'
  result_message: "Great work! You've mastered the basics."
  questions:
    - question: "What does the 'C' in CBT stand for?"
      options: ['Care', 'Cognitive', 'Change', 'Center']
      correct: 1
      explanation: 'CBT stands for Cognitive Behavioral Therapy.'
```

## 3. Scoring & Achievements

The quiz engine automatically calculates scores and triggers badges based on performance.

### Score Thresholds

| Score          | Rating           | Action                         |
| :------------- | :--------------- | :----------------------------- |
| **80% - 100%** | 🌟 Excellent     | Unlock "Feelings Expert" Badge |
| **60% - 79%**  | 👏 Good Job      | Update Lesson Progress         |
| **40% - 59%**  | 📚 Keep Learning | Update Lesson Progress         |
| **0% - 39%**   | 💪 Review Needed | No Achievement                 |

### Achievement System

Achievements are persisted in the user's browser `localStorage`.

| Badge ID            | Trigger Condition             |
| :------------------ | :---------------------------- |
| `first-course`      | Started any course            |
| `feelings-explorer` | Completed 3 quizzes with 80%+ |
| `anxiety-warrior`   | Completed the Anxiety course  |
| `meditation-streak` | 7-day mood check-in streak    |

> [!TIP]
> You can customize these thresholds and badges in `data/badges.json` and the `quiz-engine.html` partial.

## 4. How it Works

> [!IMPORTANT]
> The quiz engine is 100% client-side. No data is sent to the server, maintaining total user privacy.

1.  **Extraction**: Hugo extracts the YAML frontmatter and injects it into a JSON object.
2.  **Initialization**: The `quiz-engine.js` loads the data and renders the first question.
3.  **Validation**: When a user selects an option, the engine compares the index and reveals the explanation.
4.  **Persistence**: Final scores are saved to `localStorage.quizHistory`.
