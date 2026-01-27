---
title: 'Wellness Shortcodes'
weight: 40
---

MindFull includes specialized Hugo shortcodes designed specifically for mental health and educational content. These components are interactive, high-fidelity, and fully configurable.

## 1. Guided Breathing (`{{< breathe >}}`)

Renders a premium, cinematic breathing guide with custom rhythms, ambient soundscapes, and transition chimes.

### Usage

```markdown
{{< breathe inhale="4" hold="4" exhale="4" >}}
```

### Parameters

| Parameter | Default | Description                             |
| :-------- | :------ | :-------------------------------------- |
| `inhale`  | `4`     | Duration of the inhale phase (seconds). |
| `hold`    | `4`     | Duration of the hold phase (seconds).   |
| `exhale`  | `4`     | Duration of the exhale phase (seconds). |

### Features

- ⏱️ **Live Countdown**: Large, high-fidelity timer synchronized with the visual cycle.
- 🎵 **Soundscape Hub**: Integrated dropdown to select ambient tracks (e.g., "Deep Zen", "Gentle Rain").
- 🔔 **Phase Chimes**: Meditative audio cues play automatically at each transition point.
- ✨ **Hardware Accelerated**: GPU-optimized animations for buttery-smooth circle expansion.

---

## 2. Privacy Video (`{{< safevideo >}}`)

A privacy-hardened video embed that blocks third-party trackers (cookies) until the user explicitly consents.

### Usage

```markdown
{{< safevideo id="VIDEO_ID" title="Session Name" provider="youtube" >}}
```

| Parameter  | Required | Description                     |
| :--------- | :------- | :------------------------------ |
| `id`       | Yes      | The YouTube or Vimeo video ID.  |
| `title`    | No       | Display name for the session.   |
| `provider` | No       | `youtube` (default) or `vimeo`. |

---

## 3. Professional Audio Player (`{{< audio >}}`)

A feature-rich, "VLC-style" audio player designed for immersive guided meditations and lectures.

### Usage

```markdown
{{< audio id="meditation-1" title="Deep Mindset Reset" duration="15:00" src="/audio/reset.mp3" >}}
```

### Features

- 🔄 **Marquee Titles**: Long curriculum names scroll smoothly in a seamless infinite loop.
- ⚡ **Playback Speed**: Adjustable speed selector (1.0x, 1.25x, 1.5x, 2.0x).
- 🔊 **Volume Hub**: Dedicated volume slider and one-click mute/unmute toggle.
- ⏩ **Precision Seeking**: Interactive scrubber and +/- 10s skip buttons.
- 📦 **Aggressive Buffering**: State-aware engine that pre-loads content for instant playback.
- 🌓 **High-Fidelity Rendering**: Mask-faded edges and hardware-accelerated transforms.
