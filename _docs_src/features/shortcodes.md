---
title: 'Wellness Shortcodes'
weight: 40
---

MindFull includes specialized Hugo shortcodes designed specifically for mental health and educational content. These components are interactive, privacy-hardened, and fully branded.

## 1. Guided Breathing (`{{< breathe >}}`)

Renders an interactive, animated breathing circle to help users center themselves.

### Usage

```markdown
{{< breathe >}}
```

- [x] **Inhale/Exhale Cues**: Smooth 4-second cycles.
- [x] **Visual Feedback**: Expanding circle logic.
- [x] **Interactive**: Simple Start/Stop controls.

---

## 2. Privacy Video (`{{< safevideo >}}`)

A privacy-hardened video embed that blocks third-party trackers (cookies) until the user explicitly consents by clicking play.

### Usage

```markdown
{{< safevideo id="VIDEO_ID" title="Session Name" provider="youtube" >}}
```

| Parameter  | Required | Description                     |
| :--------- | :------- | :------------------------------ |
| `id`       | Yes      | The YouTube or Vimeo video ID.  |
| `title`    | No       | Display name for the session.   |
| `provider` | No       | `youtube` (default) or `vimeo`. |

> [!IMPORTANT]
> The YouTube implementation uses `youtube-nocookie.com` for maximum privacy even after consent.

---

## 3. Branded Audio Player (`{{< audio >}}`)

A custom, minimalist audio player for guided meditations and lectures.

### Usage

```markdown
{{< audio id="meditation-1" title="Morning Zen" duration="10:00" src="/audio/zen.mp3" >}}
```

- [x] **Custom Icons**: Branded play/pause controls.
- [x] **Progress Bar**: Real-time session tracking.
- [x] **Minimalist**: No heavy external library dependencies.
