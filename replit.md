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
- **Styling**: Dark theme with CSS custom properties. Colors: `--wc-y: #F5C400` (yellow primary), `--wc-gr: #22C55E` (green), `--wc-re: #EF4444` (red), `--wc-am: #F59E0B` (amber). Fonts: Barlow Condensed (headings), Barlow (body), JetBrains Mono (data), Bebas Neue (display/onboarding), Inter (onboarding body)
- **Icons**: Lucide React throughout

### App Flow

1. **Onboarding** (first visit only, stored in `localStorage.wc_onboarded`):
   - Splash → Q1 Trade → Q2 KM Band → Q3 Vehicle Details → Recommendation → Signup → OTP Verify → Vehicle Setup → Tax Settings → Tracking Method → Motion Permission → Location Permission → All Set → Plan Select → Mates Rates
   - Self-contained in `client/src/components/onboarding/` with local state
   - Q2 KM Band uses slider + tap-to-select band tiles, plus a secondary personal km slider. Both business and personal weekly km are passed through to calcLogbook as `effectiveTotal = businessKm + personalAnnualKm`
   - Q3 Vehicle Details has 4 questions: age (6 options), type, finance, purchase price band (4 options)
   - Algorithm uses IAWO-aware depreciation engine with RUNNING segment costs (ute-4x4: $12,900, ute-4x2: $9,700, suv-medium: $9,700, suv-small: $5,900), calcDepreciation (DV method or instant write-off), INT_RATE=8% finance interest, profession-based business use % for logbook calculation
   - UserData includes: trade, kmBand, vehicleAge, vehicleType, finance, priceBand, recommendation

2. **Dashboard** (main hub after onboarding):
   - Quick action tiles: Sort Trips, Driving Reports, Add Trip, Expenses, My Stats, Export, Find My Keys
   - Summary stats: total trips, business km, estimated deduction
   - 12-week logbook progress strip

3. **Logbook Screens** (accessed from dashboard, with bottom nav):
   - Sort, Classify, Review, Odometer, Reports, Export, Input, Expenses, Stats, Find Keys
   - Bottom nav includes Home button to return to dashboard

### Screen Flow

11 screens managed by `currentScreen` state:
1. **Dashboard** -- Main hub with quick action tiles, stats, and 12-week progress
2. **Sort** -- Swipe/tap to classify trips as business or personal. Business button is single-click. Card fly-out animation on classify.
3. **Classify** -- Step through business trips, pick purpose category from 10-option grid
4. **Review** -- List/calendar view of all classified trips, reclassify buttons (including connector trips)
5. **Odometer** -- Verify odometer readings, add photo evidence, audit score tracking
6. **Reports** -- Saved session summaries with List/Calendar/12-Week views, Tax Info modal, Pre-Audit Checklist, PDF/CSV export per report
7. **Export** -- Dedicated export section to select, combine, and export multiple reports as a single combined PDF or CSV
8. **Input** -- Add Trip screen with a choice gate: "Start New Trip" (live tracking with map, start/end trip flow) or "Add Existing Trip" (manual form for past trips). Both paths create trips with `type: null` (unsorted) and send them to the sort queue. The existing form includes from/to addresses, date/time, distance, duration, odometer, stops, and notes. The live trip flow includes starting address entry, driving phase with map + timer, destination entry, and end trip with distance calculation.
9. **Expenses** -- Unified expense section with two tabs (Entries / Report). Entries tab shows saved expense items with category, amount, date, vendor, receipt thumbnail, edit/delete. Report tab shows ATO-ordered category totals (Fuel/Electricity, Oil, Repairs & Maintenance, Registration, Insurance, Lease Payments, Loan Interest, Depreciation), business use %, deductible estimate, CSV export. Fuel auto-estimated from biz km × consumption × avg price; Depreciation auto-calculated via diminishing value method. Add Expense flow includes category picker, amount, date, vendor, receipt photo upload with AI extraction placeholder, verify before save. Data in `localStorage.wc_expenses`.
10. **Stats** -- Trip analytics: business vs personal split, trips by day bar chart, top destinations, averages (km/trip, cost/km), fuel cost integration.
11. **Find My Keys** -- GPS location save ("Mark Location"), vibrate ring, Google Maps navigation, location history.

### Trip Data

- 8 hardcoded sample trips (`client/src/lib/trip-data.ts`) from Melbourne suburbs, Feb 2026
- 10 purpose categories (Tool Run, Job Site, Pickup/Delivery, etc.)
- ATO rate: $0.88/km
- **Connector trips**: Auto-generated personal trips that bridge gaps between logged trips (where destination of one trip doesn't match origin of the next). Generated during `INIT_CLASSIFY`, marked with `autoGenerated: true`. Shown with amber dashed borders and "GAP" tag in review and odometer screens.

### Audit Score

Weighted percentage calculation via `calcAuditScore()` in `app-context.tsx`:
- Classification: 35% -- % of trips sorted
- Odometer verified: 30% -- % of trips with confirmed readings
- Business use ratio: 24% -- deviation from 65% industry average
- Photo evidence: 10% -- % of trips with photos (bonus)
- Capped at 99%. Independent review disclaimer included.

### State Consistency

All reducer actions (`UPDATE_TRIP`, `RECLASSIFY`, `UNDO_LAST`) recalculate `dedTotal`, `bizCount`, `perCount` from scratch (not incremental). Route edits (km/from/to/stops) clear verified odo readings on the edited trip and all subsequent trips, maintaining the odometer accordion effect.

### Backend

- Express 5 (TypeScript), Vite middleware in dev
- Storage interface defined but only MemStorage implemented
- No active API routes
- PostgreSQL/Drizzle ORM scaffolded (users table only)

### Key Files

| File | Purpose |
|---|---|
| `client/src/pages/home.tsx` | Main page with phone frame, onboarding/app routing |
| `client/src/lib/app-context.tsx` | All state management (context + reducer) |
| `client/src/lib/trip-data.ts` | Trip data constants, categories, helper functions |
| `client/src/components/onboarding/index.tsx` | Onboarding flow wrapper with step management |
| `client/src/components/onboarding/splash.tsx` | Splash screen |
| `client/src/components/onboarding/trade-select.tsx` | Q1 trade selection |
| `client/src/components/onboarding/km-band.tsx` | Q2 km band selection |
| `client/src/components/onboarding/vehicle-details.tsx` | Q3 vehicle age/type/finance |
| `client/src/components/onboarding/recommendation.tsx` | Algorithm + recommendation with interactive slider |
| `client/src/components/onboarding/auth-screens.tsx` | Signup, Login, Verify, Forgot, PIN screens |
| `client/src/components/onboarding/setup-screens.tsx` | Vehicle setup, Tax, Tracking, Plans, Mates Rates |
| `client/src/components/dashboard-screen.tsx` | Dashboard main hub |
| `client/src/components/sort-screen.tsx` | Sort screen with card deck, deduction tracker, dial, calendar |
| `client/src/components/trip-card.tsx` | Swipeable trip card with pointer events, fly-out animation |
| `client/src/components/classify-screen.tsx` | Purpose classification grid |
| `client/src/components/review-screen.tsx` | Trip review with list/calendar tabs |
| `client/src/components/odometer-screen.tsx` | Odometer verification with controlled inputs |
| `client/src/components/reports-screen.tsx` | Session reports list, Tax Info modal, PDF/CSV export |
| `client/src/components/export-screen.tsx` | Combined export screen |
| `client/src/components/expenses-screen.tsx` | Unified expenses: Entries/Report tabs + Add Expense flow |
| `client/src/components/stats-screen.tsx` | Trip analytics and stats dashboard |
| `client/src/components/find-keys-screen.tsx` | GPS key location + vibrate + Maps nav |
| `client/src/components/modals.tsx` | EditModal, ATOModal, SummaryModal |
| `client/src/components/bottom-nav.tsx` | Bottom navigation bar (Home, Sort, Classify, Review, Reports) |
| `client/src/index.css` | Theme CSS variables, custom animations, onboarding styles (ob-*) |

### Environment Variables

- `DATABASE_URL` -- PostgreSQL connection string (required at startup)
- `SESSION_SECRET` -- Express session secret

### Deployment

- Autoscale deployment configured
- Build: `npm run build` (Vite frontend + esbuild backend)
- Serve: `npm run start` on port 5000
