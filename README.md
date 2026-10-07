# PMP Daily

A Duolingo-style daily practice app for the **PMP exam (July 2026 Exam Content Outline)**. Take a 15-question quiz every day, keep your streak, and see exactly which exam tasks you need to work on before test day.

**[Download the latest APK](../../releases/latest)** (Android 7+, arm64)

## What it does

- **Daily 15-question quiz** weighted like the real exam: People 33%, Process 41%, Business Environment 26%, about 40% predictive and 60% agile/hybrid.
- **All the new 2026 question formats**: multiple choice, multiple response, matching, fill-in dropdowns, hotspot (tap the chart), graphic-based questions (burndowns, S-curves, Kanban boards, risk matrices, velocity charts), and **linked case-study sets**.
- **Mixed difficulty** (easy, medium, hard), ordered to ramp up through the session.
- **Adaptive**: about a third of each quiz targets your weakest tasks, and missed questions come back on a spaced-repetition schedule.
- **Tracks every test**: full history with answer review, per-task mastery for all 26 ECO tasks, PMI-style performance bands (Above Target, Target, Below Target, Needs Improvement), score trend, and an exam-readiness estimate.
- **Feels like a game**: GSAP animations, combos, XP, streaks, haptics, sound, and confetti on the results screen.

All data stays on your device. Use **Settings → Export backup** to move it. See [Player data and app updates](docs/data-and-updates.md) for how progress is saved and kept across new versions.

## Install on Android

1. Download `PMP-Daily-vX.Y.Z.apk` from the [latest release](../../releases/latest) on your phone.
2. Open it and allow "Install unknown apps" for your browser when prompted.

## Develop

Requires Node 22+ and Rust.

```bash
npm install
npm run dev          # http://localhost:1420 in a browser
npm run validate     # check the question bank and simulate 30 days of quizzes
npm run tauri dev    # desktop window
```

In dev, `/?q=pr6-08,be5-03` opens a quiz with specific question ids.

### Android build

Releases are built by GitHub Actions (`.github/workflows/android-release.yml`) when a `v*` tag is pushed. The workflow generates the Android project, applies release signing from repository secrets, builds an arm64 APK, and attaches it to the GitHub release.

Required secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`.

To build locally you need the Android SDK, NDK, and Java 17:

```bash
npx tauri android init
npx tauri android build --apk --target aarch64
```

## Question bank

`src/lib/questions/` holds 231 original questions, each tagged with domain, ECO task, approach, difficulty, and format. To add questions, append to the domain file and run `npm run validate`.

The questions are original practice items written against the public PMP Examination Content Outline. They are not real exam questions.

---

Not affiliated with or endorsed by PMI. PMP and PMBOK are registered marks of the Project Management Institute, Inc.
