---
version: alpha
name: CCNA Quiz
description: A warm, focused learning interface for CCNA exam preparation. Inspired by Anthropic's editorial warmth — optimized for long study sessions and cognitive retention.
colors:
  primary: "#D97757"
  primary-hover: "#C4623E"
  secondary: "#CC785C"
  background: "#FAF9F5"
  surface: "#FFFFFF"
  surface-alt: "#F3F0EA"
  border: "#E5E0D8"
  text: "#1A1A1A"
  text-muted: "#6B6560"
  text-subtle: "#9C9590"
  correct: "#2D7D46"
  correct-bg: "#EAF5EE"
  correct-border: "#A3D4B0"
  incorrect: "#C0392B"
  incorrect-bg: "#FDECEA"
  incorrect-border: "#F0A8A0"
  option-hover: "#F0EDE6"
  option-selected: "#FDF0EB"
  progress-bg: "#E5E0D8"
  progress-fill: "#D97757"
typography:
  h1:
    fontFamily: "Tiempos Headline, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "Tiempos Headline, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  question:
    fontFamily: "Styrene B, Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.6
  body-md:
    fontFamily: "Styrene B, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Styrene B, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  option:
    fontFamily: "Styrene B, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "'IBM Plex Mono', 'Fira Code', 'Consolas', monospace"
    fontSize: "0.875rem"
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text}"
  option-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  option-card-hover:
    backgroundColor: "{colors.option-hover}"
    textColor: "{colors.text}"
  option-card-selected:
    backgroundColor: "{colors.option-selected}"
    textColor: "{colors.text}"
  option-card-correct:
    backgroundColor: "{colors.correct-bg}"
    textColor: "{colors.correct}"
  option-card-incorrect:
    backgroundColor: "{colors.incorrect-bg}"
    textColor: "{colors.incorrect}"
  progress-bar:
    backgroundColor: "{colors.progress-bg}"
    rounded: "{rounded.full}"
    height: "6px"
  progress-fill:
    backgroundColor: "{colors.progress-fill}"
    rounded: "{rounded.full}"
  question-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "32px"
  badge:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

## Overview

CCNA Quiz is a spaced-repetition flashcard app for Vietnamese IT students preparing for the Cisco CCNA exam. The design prioritizes **cognitive clarity** and **long-session comfort** — students may study for 1–3 hours at a time, so every decision reduces eye strain and mental friction.

The visual language borrows from Anthropic's warm editorial palette: off-white backgrounds instead of stark white, warm orange accents instead of cold blue, and generous whitespace to let content breathe. The result feels closer to a well-designed textbook than a typical quiz app.

**Core principles:**
- One question at a time — no distractions
- Instant feedback with clear color coding (green = correct, red = incorrect)
- Keyboard-first navigation (A/B/C/D to select, Space/Enter to confirm)
- English-first with Vietnamese translation on demand (tap to reveal)
- Spaced repetition — wrong answers resurface sooner

## Colors

- **Primary (#D97757):** Warm terracotta orange — used for CTAs, progress fill, and active states. Energetic without being aggressive.
- **Background (#FAF9F5):** Warm off-white — reduces eye strain vs pure white during long sessions.
- **Surface (#FFFFFF):** Pure white for cards — creates subtle depth against the warm background.
- **Surface-alt (#F3F0EA):** Slightly warmer than background — used for hover states and secondary areas.
- **Correct (#2D7D46 / #EAF5EE):** Forest green — universally understood as "right answer".
- **Incorrect (#C0392B / #FDECEA):** Muted red — clear "wrong answer" signal without being alarming.
- **Text (#1A1A1A):** Near-black — high contrast on warm backgrounds.
- **Text-muted (#6B6560):** Warm gray — for secondary info like question numbers, counters.

## Typography

**Tiempos Headline** for headings — editorial serif that gives the app a studied, trustworthy feel. Falls back to Georgia.

**Styrene B** for body and options — clean grotesque that reads well at small sizes. Falls back to Inter, then system-ui.

**IBM Plex Mono** for CLI/config code blocks — technical content in CCNA questions (router configs, IP tables) must be monospaced and clearly distinguished from prose.

Question text uses 1.125rem at 1.6 line-height — slightly larger than body to reduce re-reading. Option text uses 1rem — consistent with body to avoid visual hierarchy confusion between options.

## Layout

Single-column centered layout, max-width 680px — wide enough for long questions and exhibit images, narrow enough to avoid line lengths that tire the eye.

Vertical rhythm: 24px between major sections, 16px between related elements, 8px for tight groupings.

**Quiz screen anatomy (top to bottom):**
1. Progress bar (6px, full width) — always visible, shows position in session
2. Session stats (question X of Y, streak counter) — 8px below progress bar
3. Question card — dominant element, 32px padding
4. Exhibit image (if present) — full width within card, max-height 320px
5. Option cards — 12px gap between options
6. Translate button — below question text, subtle
7. Next button — appears after answer selected

## Elevation & Depth

Minimal shadow system — the warm background provides natural depth without heavy shadows.

- **Cards:** `box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- **Hover cards:** `box-shadow: 0 4px 12px rgba(0,0,0,0.10)`
- **No elevation on background** — flat, no gradients

## Shapes

Consistent rounded corners throughout:
- Progress bar: full pill (9999px)
- Option cards: 12px — friendly but not childish
- Buttons: 8px — standard interactive element
- Question card: 16px — largest container gets most rounding
- Badges/tags: full pill

## Components

**Option card** is the most critical component — it has 5 states:
1. Default: white bg, subtle border
2. Hover: warm off-white bg, slightly elevated shadow
3. Selected (pre-submit): warm orange tint bg
4. Correct (post-submit): green bg + green border + checkmark icon
5. Incorrect (post-submit): red bg + red border + X icon

The correct answer is always revealed after submission — even if the user got it right — so they reinforce the association.

**Progress bar** uses the primary orange fill on a warm gray track. Animates width on each question advance (300ms ease).

**Translate button** is intentionally subtle — small, text-only, below the question. Tapping reveals Vietnamese translation inline with a smooth expand animation. This prevents over-reliance while keeping it accessible.

## Do's and Don'ts

- ✅ Use warm orange (#D97757) for the single primary action per screen
- ✅ Always show the correct answer after submission, even on correct responses
- ✅ Use monospace font for any CLI output, IP addresses, or config snippets
- ✅ Keep option labels (A, B, C, D) visually distinct from option text
- ❌ Don't use pure blue (#0000FF) or pure red (#FF0000) — too harsh on warm background
- ❌ Don't show more than one question at a time
- ❌ Don't hide the progress bar — students need to feel momentum
- ❌ Don't auto-advance — always require explicit Next action to allow reflection
