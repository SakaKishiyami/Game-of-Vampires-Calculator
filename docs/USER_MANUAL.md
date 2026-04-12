# Game of Vampires Toolkit — User Manual

This manual describes how to use the **Game of Vampires Toolkit**: a web app for tracking progression and estimating **domination** and attribute totals for *Game of Vampires*.

## Getting started

1. Open the site in a modern browser (Chrome, Edge, Firefox, or Safari).
2. From the **home** page, choose a section (each opens as its own page):
   - **Main Calculator** (`/calculator`) — full progression calculator.
   - **Familiar Tracker** (`/familiars`) — familiar levels and related bonuses.
   - **Sinistra Tools** (`/sinistra`) — event-style tools and map overview.
   - **Event Tracker & Stats** (`/events`) — log events and compare runs.
   - **Accounts** (`/account`) — sign-in and account-related options.
   - **Data & Import / Export** (`/data`) — saves, import/export, and cloud-style workflows.

Use the **menu icon** in the layout to open or close the sidebar navigation anytime.

## Main Calculator (`/calculator`)

The calculator is organized into **tabs**. Your last selected tab is remembered in the browser (`localStorage`).

### Aura Bonuses (default tab)

- Enter **VIP level** (1–14), **Lord** progression, and **base attributes** (Strength, Allure, Intellect, Spirit) at the top of the calculator when shown there or in related sections.
- This tab summarizes **aura-related percentage bonuses** (for example talent aura contributions and VIP-related effects) so you can see how auras stack toward your totals.
- Toggle **special wardens** and **lovers** you own where checkboxes appear; these feed aura logic used elsewhere.

### Conclave

- Set **seal levels** for each attribute seal.
- Configure **saved seals** and **upgrade** toggles where applicable so conclave multipliers match your in-game state.

### Courtyard

- Enter your **current courtyard level** and **points**.
- The app uses courtyard data to estimate **courtyard domination** contributions and projections consistent with the built-in level tables.

### Books

- For each book category, set **counts** (how many you own / have read, per the UI).
- Bonuses combine with **conclave book multipliers** in the total math (encyclopedia-style books may use the maximum seal multiplier across attributes—see in-app totals for the final numbers).

### Talents

- Adjust **domination increase per talent star** and related talent inputs so scripted / scroll outcomes match your build.

### Wardens

- Set **group counts** (Circus, Bloody Tyrants, Monster Noir, Wild Hunt) and **select** which wardens are active in each group.
- Enter **per-warden levels** and attribute stats where the detailed grid is shown.
- **Special wardens** (for example Nyx, Dracula) have dedicated toggles or fields.
- **Skins**: mark owned skins and pick the **active** skin when the UI offers it; stats may follow the selected skin.
- **Detailed (OCR) sub-tab**: upload **screenshots** (PNG/JPG) or text files **named after the warden** (for example `Diana.png`) to parse attribute breakdowns with **Tesseract.js** in the browser. OCR is best-effort: verify numbers after import and correct any misread digits.

### Scarlet Bond

- Set **bond levels** and **affinity** per the in-game systems modeled in the tab.
- Use any **optimizer / suggestions** the tab exposes to compare “current” vs “optimized” bond level plans against your goals.

### Inventory

- Enter **item quantities** where listed.
- You can **attach images** of inventory rows for visual reference (stored for use on that tab as described in the UI).

### Data

- **Export** your profile to a **JSON** file (dated filename) for backup or moving to another device.
- **Import** a previously exported JSON file; the app validates basic structure before applying.
- **Local storage**: the calculator can persist to the browser under the key documented for developers (`gameCalculatorData`); behavior is described on the Data tab and in the developer guide.
- **Sign in** (when configured): **Supabase** cloud saves let you name and store multiple profiles server-side.
- **Google Drive** (when signed in with Google and the right OAuth scopes): connect, list saves in the app folder, **save**, **save as**, **load**, and **delete** JSON backups. If the Drive session expires, sign in with Google again.

## Other pages (brief)

| Page | Purpose |
|------|--------|
| **Familiars** | Track familiar progression and how it ties into broader bonuses. |
| **Sinistra** | Planning tools and map-style views for Sinistra content. |
| **Events** | Track events and stats across runs. |
| **Account** | Authentication and per-account settings. |
| **Data** | Standalone hub for import/export and save management (overlaps with the calculator **Data** tab). |

## Tips and limitations

- **Accuracy**: totals depend on the data files and formulas shipped with the app. After game patches, numbers may drift until the project is updated.
- **Privacy**: exports contain your full save payload; treat JSON files like sensitive game/account progress data.
- **OCR**: lighting, font, and UI scale affect recognition; always double-check imported warden rows against the game.

## Getting help

For bugs or feature ideas, use the project’s issue tracker or contact the maintainers as described in the repository **README**.

---

*See also: [Developer’s Guide](./DEVELOPER_GUIDE.md)*
