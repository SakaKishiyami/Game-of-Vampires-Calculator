# Game of Vampires Calculator

Web app for tracking and optimizing Game of Vampires progression data in one place.

## Features

- **Base Attributes**: Track Strength, Allure, Intellect, and Spirit
- **VIP & Lord Level**: Set your VIP level (1-14) and Lord progression
- **Conclave**: Manage seal levels for all attributes
- **Courtyard**: Track current level and points with projected level calculation
- **Books**: Comprehensive book collection tracking with bonuses
- **Wardens**: 
  - Special wardens (Nyx, Dracula)
  - Warden groups (Circus, Bloody Tyrants, Monster Noir, Wild Hunt)
  - Aura management
  - Individual warden stats
- **Scarlet Bond**: Bond management with affinity points and attribute bonuses
- **OCR Warden Import**: Upload screenshots of warden data for automatic parsing
- **Familiars**: Familiar tracking (active work in progress)
- **Data/account-style**: for managing saved profile information

## Tech Stack

- `Next.js 14` + `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Radix UI`
- `Supabase` (auth + data integration)
- `Tesseract.js` (OCR flows)

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Navigate to the project directory:
```bash
cd game-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Environment variables:
If `.env.local.example` is not present yet, create `.env.local` manually with your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Run

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Lint & build

```bash
npm run lint    # ESLint (non-interactive; uses .eslintrc.json)
npm run build   # production build
```

`next.config.js` skips TypeScript/ESLint during `next build` for deployment; run `npm run lint` locally (or in CI) for full checks.

## Technology Stack

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Language**: TypeScript for type safety

## Project Structure

```
game-calculator/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── GameCalculator.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── tabs.tsx
│   └── lib/
│       └── utils.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Game assets (`/Gov/...` images)

Lover and warden portraits are loaded from **`public/Gov/...`** (e.g. `public/Gov/Lovers/BaseLovers/RavenFemale.png`).

If your images live under `src/data/Gov`, copy them into `public` so the dev server can serve them:

```powershell
# Windows PowerShell (from repo root)
xcopy /E /I /Y "src\data\Gov" "public\Gov"
```
Same-name female/male lovers use files like `RavenFemale.png` / `RavenMale.png` (see `src/utils/loverImagePaths.ts`).

**Lover tokens (inventory):** most summonable lovers use **100** of their token (e.g. `HelaToken`). Ember/Ash use **400** combined Heart of War tokens (`HeartOfWarToken` or `HeartOfWar` in save data; asset filenames may change).

## Roadmap / TODO

- **Admin / maintainer tools**: role-gated UI to add lovers (PNG + metadata), wardens, and inventory items without editing code.
- **Google Drive** export/import: wire OAuth + file pickers (steps TBD when you’re ready).
- **Discord / Vercel auth**: re-verify Supabase OAuth redirect URLs and provider settings after deployments.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License. 