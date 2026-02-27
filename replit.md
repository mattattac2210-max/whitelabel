# WorkCar -- Sort it at Smoko

## Overview

WorkCar is a mobile-first web app designed to help Australian tradespeople classify their car trips for ATO tax deduction purposes. Users sort trips as "business" or "personal," classify business trips by purpose category, review/verify odometer readings, and generate session reports. The app renders inside a phone frame (390x844px) centered on screen, mimicking a native mobile experience.

All application logic runs client-side using React state (via useReducer + Context). The backend serves as a scaffold with no active API routes.

## User Preferences

- Simple, everyday language
- Dark theme only (no light mode toggle)
- No emoji in UI -- use Lucide icons instead
- Australian English conventions (ATO, km, VIC, etc.)

## System Architecture

### Frontend Architecture

- **Framework**: React (TypeScript), bundled via Vite
- **Routing**: `wouter` -- only `/` route and 404 fallback
- **State Management**: React Context + useReducer (`client/src/lib/app-context.tsx`)
- **UI Library**: shadcn/ui components, Tailwind CSS
- **Styling**: Dark theme with CSS custom properties. Colors: `--wc-y: #F5C400` (yellow primary), `--wc-gr: #22C55E` (green), `--wc-re: #EF4444` (red), `--wc-am: #F59E0B` (amber). Fonts: Barlow Condensed (headings), Barlow (body), JetBrains Mono (data)
- **Icons**: Lucide React throughout

### Screen Flow

5 screens managed by `currentScreen` state:
1. **Sort** -- Swipe/tap to classify trips as business or personal. Business button is single-click. Card fly-out animation on classify.
2. **Classify** -- Step through business trips, pick purpose category from 10-option grid
3. **Review** -- List/calendar view of all classified trips, reclassify buttons
4. **Odometer** -- Verify odometer readings, add photo evidence, audit score tracking
5. **Reports** -- Saved session summaries

### Trip Data

- 8 hardcoded sample trips (`client/src/lib/trip-data.ts`) from Melbourne suburbs, Feb 2026
- 10 purpose categories (Tool Run, Job Site, Pickup/Delivery, etc.)
- ATO rate: $0.88/km

### Backend

- Express 5 (TypeScript), Vite middleware in dev
- Storage interface defined but only MemStorage implemented
- No active API routes
- PostgreSQL/Drizzle ORM scaffolded (users table only)

### Key Files

| File | Purpose |
|---|---|
| `client/src/pages/home.tsx` | Main page with phone frame, status bar, screen container |
| `client/src/lib/app-context.tsx` | All state management (context + reducer) |
| `client/src/lib/trip-data.ts` | Trip data constants, categories, helper functions |
| `client/src/components/sort-screen.tsx` | Sort screen with card deck, deduction tracker, dial, calendar |
| `client/src/components/trip-card.tsx` | Swipeable trip card with pointer events, fly-out animation |
| `client/src/components/classify-screen.tsx` | Purpose classification grid |
| `client/src/components/review-screen.tsx` | Trip review with list/calendar tabs |
| `client/src/components/odometer-screen.tsx` | Odometer verification with controlled inputs |
| `client/src/components/reports-screen.tsx` | Session reports list |
| `client/src/components/modals.tsx` | EditModal, ATOModal, SummaryModal |
| `client/src/components/bottom-nav.tsx` | Bottom navigation bar |
| `client/src/index.css` | Theme CSS variables, custom animations |

### Environment Variables

- `DATABASE_URL` -- PostgreSQL connection string (required at startup)
- `SESSION_SECRET` -- Express session secret

### Deployment

- Autoscale deployment configured
- Build: `npm run build` (Vite frontend + esbuild backend)
- Serve: `npm run start` on port 5000
