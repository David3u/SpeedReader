# Speed Reader

A modern speed reading trainer built with Next.js. Displays text one word at a time with optimal recognition point (ORP) highlighting, helping you read faster while maintaining comprehension.

## Features

- **Progressive WPM Ramping** - Start slow and gradually increase speed over a configurable duration
- **ORP Highlighting** - Center letter highlighted in red for optimal focus
- **Smart Slowdowns** - Configurable pauses for long words and punctuation
- **Session Resume** - Pause anytime and resume from where you left off
- **Keyboard Controls** - Space to pause/resume, Escape to exit
- **Clean UI** - Distraction-free reading with auto-hiding controls

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

| Setting | Description | Range |
|---------|-------------|-------|
| Start Speed | Initial WPM | 30-1000 |
| End Speed | Target WPM after ramp | 30-1500 |
| Ramp Duration | Seconds to reach target speed | 0-60 |
| Long Word Slowdown | Extra time for words >5 chars | 0-100% |
| Punctuation Pause | Extra time at sentence ends | 0-100% |

## Project Structure

```
app/
├── page.tsx           # Main input screen
├── ReadingScreen.tsx  # Reading interface
├── layout.tsx         # Root layout with metadata
├── types.ts           # TypeScript interfaces & constants
├── components/
│   └── SettingItem.tsx
├── hooks/
│   ├── useReadingTimer.ts
│   └── useAutoHideUI.ts
└── utils/
    ├── text.ts        # Word parsing & display
    └── timing.ts      # WPM & delay calculations
```

## Tech Stack

- Next.js 16
- React 19
- Framer Motion
- Tailwind CSS 4
- TypeScript

## License

MIT
