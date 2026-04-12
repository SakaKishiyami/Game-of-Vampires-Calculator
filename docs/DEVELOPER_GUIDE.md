# Game of Vampires Toolkit — Developer’s Guide

This guide is for contributors and operators who build, extend, or deploy the **game-calculator** Next.js application.

## Stack and layout

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS, shared UI in `src/components/ui/` (Radix primitives) |
| Auth / backend | Supabase (`@supabase/supabase-js`, Auth UI) |
| Client OCR | `tesseract.js` (warden screenshot import) |

**Global state**: `GameCalculatorProvider` wraps the app in `src/app/layout.tsx` and supplies calculator state and derived values through `src/context/GameCalculatorContext.tsx`.

**Routing**: `src/app/page.tsx` is the hub. Feature routes include `calculator`, `familiars`, `sinistra`, `events`, `account`, `data`, plus `auth/callback`, `auth/auth-code-error`, and `oauth/consent` for OAuth flows.

## Local development

Prerequisites: **Node.js 18+**, **npm**.

```bash
cd game-calculator
npm install
```

Environment variables (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Run the dev server:

```bash
npm run dev
```

Quality gates:

```bash
npm run lint
npm run build
```

Note: `next.config.js` may skip TypeScript/ESLint during production `build`; rely on `npm run lint` locally or in CI for strict checks (see root **README**).

## Repository map (high level)

```
src/
  app/                 # Next.js routes, layout, globals.css
  components/
    GameCalculator.tsx # Main calculator shell, tabs, save payload assembly
    tabs/              # Tab UIs (Aura, Conclave, Courtyard, Books, Talents, Wardens, Scarlet Bond, Inventory, Data)
    layout/            # MainLayout, navigation, calculator settings hooks
    CloudSaveManager.tsx
  context/
    GameCalculatorContext.tsx  # State, memoized totals, export/import bridge
  data/                # Static game tables (books, auras, wardens, scarlet bonds, courtyard, conclave, …)
  utils/
    calculators/       # Pure(ish) domain math: totals, auras, conclave, courtyard, talents, scarlet bond
    exportImport.ts    # JSON export version, STORAGE_KEY, file import
    ocr/               # Warden / inventory OCR helpers
    helpers.tsx        # Formatting, input helpers, grouping
  lib/
    supabase.ts        # Client + types for `user_saves` etc.
    googleDrive.ts     # Drive API helpers for Data tab
  types/index.ts       # Shared interfaces for save state and UI
public/
  Gov/                 # Served game art (lovers, wardens); copy from src if needed (README)
```

## How calculations flow

1. **Raw state** lives in React state inside `GameCalculatorContext` (books, conclave, courtyard, warden selections/stats, scarlet bond, inventory, auras, talents, familiars, skins, flags for special characters, etc.).
2. **Derived values** (for example `totals`, `auraBonuses`, `optimizedBonuses`) are computed with `useMemo` in the context, calling modules under `src/utils/calculators/`.
3. **`calculateTotals`** in `src/utils/calculators/totalCalculations.ts` is the central composition point: it folds base attributes, books (with conclave multipliers), courtyard, wardens, scarlet bond, inventory hooks, talent scrolls/scripts, and aura-related inputs into per-attribute totals and **total domination**.

When you add a new bonus source, you typically:

1. Extend types in `src/types/index.ts` (and any `src/data/*` source of truth).
2. Thread state through the context provider and `GameCalculator` save/load object.
3. Update the relevant calculator module and **`calculateTotals`** (or the aura pipeline if it is aura-only).

## Persistence and versioning

| Mechanism | Details |
|-----------|---------|
| **localStorage** | Key `gameCalculatorData` (`STORAGE_KEY` in `src/utils/exportImport.ts`). Used for automatic persistence of the in-browser profile (see `GameCalculator` save/load). |
| **Export JSON** | `exportGameData` attaches `version: '1.0.0'` (`CURRENT_VERSION` in `exportImport.ts`). `importGameData` warns on mismatched versions but still parses. |
| **Supabase** | `CloudSaveManager` upserts rows into `user_saves` with `save_data` JSON blobs. Schema is defined in your Supabase project, not in this repo alone. |
| **Google Drive** | `DataTab` uses OAuth provider token + `drive.file` scope; `src/lib/googleDrive.ts` implements folder creation, list, save, load, delete. |

`getExportState` / `importGameData` on the context must stay aligned with the object assembled in `GameCalculator.tsx` for `saveData` so cloud saves and file exports stay consistent.

## Static game data

Tables live under `src/data/` (for example `books.ts`, `wardens.ts`, `scarletBonds.ts`, `courtyard.ts`, `conclave.ts`, `auras.ts`). Prefer **data-driven** changes (add rows, adjust numbers) over hard-coding in components.

**Images**: lover/warden art is expected under `public/Gov/...`. See README for copying from `src/data/Gov` on Windows.

## OCR

- **Wardens**: `WardensTab` runs Tesseract in the browser, parses text into `UploadedWardenData`, keyed by warden name from filenames.
- **Inventory images**: separate path for attaching reference images (`inventoryOCR` utilities exist for related flows—check `src/utils/ocr/` when extending).

OCR is inherently fragile; keep UX tolerant (progress messages, merge strategy, manual edits).

## Adding a new calculator tab

1. Create `src/components/tabs/YourTab.tsx` using existing tabs as patterns (`useGameCalculator`, Cards, `nonNegativeIntInputProps` from helpers).
2. Register a `TabsTrigger` / `TabsContent` in `GameCalculator.tsx`.
3. Extend context state/setters if the tab introduces new persisted fields; mirror fields in `saveData`, export/import, and optionally `validateImportedData`.
4. If the new data affects DOM or attributes, extend `calculateTotals` (or sub-calculators) and types.

## Security and deployment notes

- Never commit `.env.local` or service role keys; the app uses the **anon** key client-side only.
- Re-verify **Supabase Auth redirect URLs** and OAuth providers (Google, Discord, etc.) for each deployment origin.
- Google Drive tokens are stored in `localStorage` (`gov_drive_token` in `DataTab`); document rotation and sign-out behavior for users.

## Related docs

- Root **README.md** — install, scripts, asset copy commands, roadmap.
- **[User Manual](./USER_MANUAL.md)** — end-user workflows and tab descriptions.
