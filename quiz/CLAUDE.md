# CCNA Quiz App

## Project Overview
A spaced-repetition quiz app for Vietnamese IT students preparing for the Cisco CCNA exam. Built with React + Vite, deployed as a static site on GitHub Pages.

## Data Sources
All JSON data is in `/home/dev/CCNA/` (parent directory). The quiz app lives in `/home/dev/CCNA/quiz/`.

Data structure:
- `/home/dev/CCNA/output_pdf/json/{topic}.json` — PDF source, 6 topics: routing, ip_services, security-and-wireless, tcp-udp, automation-virtual-sdn, layer2_technologies
- `/home/dev/CCNA/output_docx/json/{part}.json` — DOCX source, multiple parts
- `/home/dev/CCNA/output_odt/json/{part}.json` — ODT source, Part 11-16

Each JSON file has structure: `{ "count": N, "questions": [...] }`

Each question has:
```json
{
  "id": "12.2",
  "type": "single" | "multiple",
  "question": "English question text",
  "question_vi": "Vietnamese translation",
  "question_images": ["filename.jpeg"],
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "options_vi": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "A" | "AB" | "BC",
  "explanation": "...",
  "answer_images": [],
  "explanation_images": []
}
```

## Image Paths
- PDF images: `../output_pdf/images/{topic}/{filename}`
- ODT images: `../output_odt/images/{part_with_underscore}/{filename}` (e.g. `Part_12`)
- DOCX: no images

## Design System
See `/home/dev/CCNA/DESIGN.md` for full design tokens. Key values:
- Background: `#FAF9F5` (warm off-white)
- Surface: `#FFFFFF`
- Primary: `#D97757` (warm orange)
- Correct: `#2D7D46` / `#EAF5EE`
- Incorrect: `#C0392B` / `#FDECEA`
- Font: "Styrene B", Inter, system-ui for body; "Tiempos Headline", Georgia for headings
- Mono: "IBM Plex Mono", Consolas for CLI/code blocks

## Features Required
1. **Home screen**: Select source (PDF/DOCX/ODT) → select topic/part → select number of questions
2. **Quiz screen**: One question at a time, instant feedback after selection
3. **Answer reveal**: After selecting, highlight correct (green) and incorrect (red). Always show correct answer even if user got it right.
4. **Translate button**: Below question text — tap to reveal Vietnamese translation inline
5. **Spaced repetition (SRS)**: Track correct/incorrect per question in localStorage. Wrong answers resurface sooner using a simple SM-2-like algorithm.
6. **Progress bar**: Always visible, shows position in current session
7. **Keyboard shortcuts**: A/B/C/D to select option, Space/Enter to go to next question
8. **Result screen**: Score, list of wrong answers, "Review wrong answers" button
9. **Exhibit images**: Show question images full-width in the question card
10. **CLI code blocks**: Detect and render CLI/config text in monospace code blocks

## SRS Storage
Use localStorage key `ccna_srs_data`. Structure:
```json
{
  "questionId": {
    "easeFactor": 2.5,
    "interval": 1,
    "repetitions": 0,
    "nextReview": "2026-05-15T00:00:00Z",
    "lastResult": "correct" | "incorrect"
  }
}
```

## Key UX Rules
- English first, Vietnamese on demand (tap to reveal)
- No auto-advance — user must press Next/Space/Enter
- Show correct answer always after submission
- Option labels (A, B, C, D) visually distinct from option text
- Monospace font for CLI output, IP addresses, router configs
- Max width 680px, centered layout
- Progress bar always visible

## Build & Deploy
- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- Deploy to GitHub Pages via `gh-pages` branch
- Base URL for GitHub Pages: `/CCNA/quiz/` (repo is DuongStark/CCNA)

## Code Standards
- Functional components with hooks only
- CSS Modules or plain CSS (no Tailwind, no styled-components)
- No TypeScript — plain JavaScript
- Keep components small and focused
- Use `vite.config.js` base: `/CCNA/quiz/` for GitHub Pages
