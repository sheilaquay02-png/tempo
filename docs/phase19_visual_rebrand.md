# Phase 19 — Visual Rebrand

## Objective
Apply Tempo's softer lifestyle visual identity across the app after the core daily rhythm features are stable.

## Direction
Tempo should feel calm, premium, soft, clean, organized, and personal.

The visual system now emphasizes:

- Cream background surfaces
- Blush accents
- White opaque cards
- Softer rounded corners
- Gentle shadows
- Larger page headers
- Softer icon containers
- Calm checklist cards
- Softer progress tracks and rings
- More breathing room across Today, Calendar, Tasks, Rituals, Habits, Journal, Bloom Room, resets, stats, and settings

## Implementation notes

### Theme update
The default `tempo` theme has been changed from the older pink/purple direction to a cream/blush palette:

- Background: cream
- Cards: white / warm white
- Accent: muted blush
- Text: warm brown
- Borders: soft beige/blush

### Global visual tokens
Added shared visual tokens through CSS variables:

- `--cream`
- `--cream-2`
- `--surface`
- `--surface-warm`
- `--surface-soft`
- `--blush`
- `--blush-soft`
- `--shadow-sm`
- `--shadow-lg`
- `--ring`

### App-wide polish
Updated the visual treatment of:

- Sidebar
- Topbar
- Buttons
- Page heroes
- Cards
- Task cards
- Ritual cards
- Habit cards
- Calendar surfaces
- Journal cards
- Bloom Room cards
- Affirmation cards
- Tomorrow Reset
- Weekly Reset
- Rhythm Stats
- Modals
- Login screen

## Acceptance criteria covered

- App feels visually consistent
- Today, Rituals, Habits, Journal, Bloom Room, and Affirmations share the same card language
- Calendar remains functional but softer
- Mobile keeps opaque sticky headers
- Cards are white/cream, rounded, and softly shadowed
- Design is calmer and less productivity-heavy

## Validation

- `npm run build` passed successfully.
- `npm run lint` still reports existing React lint issues from earlier phases. No new Phase 19 build error was introduced.
