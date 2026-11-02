# Sortable — Superhero Intelligence Dashboard

A villain-themed, fully client-side dashboard for browsing, searching, sorting, and inspecting the world's "superheroes". Built from scratch with **vanilla HTML, CSS, and JavaScript** — no React, Vue, Svelte, jQuery, build step, or external UI library.

The app fetches the complete [Superhero API](https://github.com/akabab/superhero-api) dataset at runtime and presents it in a sortable, searchable, paginated table with a full hero dossier view.

> **Project:** Zone01 Kisumu — `sortable`
> **Status:** Complete — all core requirements and all bonus features implemented.
> **Live demo:** <https://ejao-000.github.io/sortable/>

---

## Table of contents

1. [The brief](#the-brief)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [How to run the project](#how-to-run-the-project)
5. [Project structure](#project-structure)
6. [Table columns and data paths](#table-columns-and-data-paths)
7. [How it works](#how-it-works)
8. [URL state reference](#url-state-reference)
9. [Team and workflow distribution](#team-and-workflow-distribution)
10. [Git and collaboration workflow](#git-and-collaboration-workflow)
11. [Testing and QA checklist](#testing-and-qa-checklist)
12. [Data source and credits](#data-source-and-credits)
13. [Known limitations and notes](#known-limitations-and-notes)

---

## The brief

You are a cunning villain who has gained access to confidential superhero records. Your mission is to organise and analyse every target using a single, fast, sortable, and searchable table. This project turns that brief into a working web application.

The app must:

- Fetch `all.json` asynchronously with `fetch`.
- Render only the required fields in a `<table>`.
- Support live search, type-aware sorting, and pagination.
- Be efficient enough to stay responsive with the full dataset.
- Prefer no frameworks or external libraries.

Everything below documents how the team met those requirements and where each piece of work lives.

---

## Features

### Required features

- [x] **Asynchronous data loading** with `fetch` and Promises (with loading and error states).
- [x] **Table rendering** for all required fields:
  - icon, name, full name, all six powerstats, race, gender, height, weight, place of birth, alignment.
- [x] **Live search** by name — filters on every keystroke, no submit button.
- [x] **Sortable columns** — click any header to sort; click again to toggle direction.
- [x] **Type-aware sorting** — text sorts alphabetically, stats sort numerically, height/weight are parsed from strings such as `"78 kg"` and `"100 kg"`.
- [x] **Missing values last** — in both ascending and descending order.
- [x] **Pagination** with page sizes `10`, `20`, `50`, `100`, and `All`; default is `20`.
- [x] **Default sort** — Name, ascending.

### Bonus features

- [x] **Search field selector** — restrict search to Name, Full Name, any of the six powerstats, Place of Birth, Race, Gender, Alignment, Height, Weight, or search all text fields at once.
- [x] **Search operators**:
  - `include` — contains the text.
  - `exclude` — does not contain the text.
  - `fuzzy` — letters appear in order (e.g. `sprmn` matches `Superman`).
  - `= equal`, `!= not equal`, `> greater than`, `< lesser than` — numeric comparisons for stat, height, and weight fields.
- [x] **Adaptive operator list** — text fields offer text operators; numeric fields automatically offer only `=`, `!=`, `>`, and `<`.
- [x] **Advanced multi-condition filters** — combine any number of conditions with AND logic.
- [x] **Hero detail view (dossier)** — click a row to open a full profile with a large image, biography, appearance, powerstats, work, connections, and the raw JSON record.
- [x] **URL state persistence** — search, field, operator, sort, direction, page size, page number, advanced filters, and the open hero are stored in the URL and restored on reload or share.
- [x] **Custom villain-themed UI** — dark neon dashboard, responsive layout, stat meters, alignment pills, loading spinner, empty states, and keyboard support.
- [x] **Accessibility touches** — labelled controls, keyboard-operable sortable headers with `aria-sort`, a table caption, `aria-current` pagination, focus styles, focus moved into and restored from the dossier, `Enter`/`Space` to open a row, and `Escape` to close the dossier.
- [x] **Resilient loading** — malformed or unsupported URL values fall back safely; a failed fetch shows a **Retry** button instead of a dead end.
- [x] **Reset view** — one click restores the default search, sort, page, advanced filters, and page size (`20`).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Markup | Semantic HTML5 |
| Styling | Custom CSS (variables, grid, flexbox, responsive media queries) |
| Behaviour | Vanilla JavaScript (ES2017+, DOM APIs, Fetch API, URLSearchParams) |
| Data | Static JSON from the Superhero API |
| Tooling | None — no npm packages, bundler, or build step |

---

## How to run the project

### Prerequisites

- A modern browser (Chrome, Firefox, Edge, or Safari).
- Python 3 **or** Node.js for a local static server.
- An internet connection — the hero data and Google Fonts are loaded at runtime.

### Option A — Python (recommended)

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option B — Node.js

From the project root:

```bash
npx --yes serve . -l 8000
```

or:

```bash
npx --yes http-server -p 8000
```

Then open `http://localhost:8000`.

### Option C — VS Code Live Server

1. Install the **Live Server** extension.
2. Right-click `index.html`.
3. Choose **Open with Live Server**.

### Important: do not open `index.html` directly

Opening the file with a `file://` URL can block the `fetch` request because of browser CORS rules. Always use a local HTTP server as shown above.

### Installing / building

There is nothing to install and nothing to build. The three source files are the application.

### Troubleshooting

| Problem | Fix |
| --- | --- |
| Port `8000` is already in use | Use another port, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080`. |
| Table stays on "Scanning the multiverse…" | Check the browser console and your internet connection; the JSON is fetched from a remote CDN. |
| Fonts look different | Google Fonts may be blocked; the app falls back to system fonts and still works. |
| Images are missing | The API image CDN may be unavailable; broken icons show `N/A` without breaking the table. |

### Live deployment

The project is published with **GitHub Pages** from the root of the `main` branch:

**<https://ejao-000.github.io/sortable/>**

Any push to `main` automatically republishes the site. To deploy an update:

```bash
git add .
git commit -m "your message"
git push github main
```

No build step or deployment workflow is required.

---

## Project structure

```text
sortable/
├── index.html          # Page shell, toolbar, table skeleton, dossier modal
├── favicon.svg         # Villain shield favicon
├── css/
│   └── style.css       # Complete villain-themed responsive design
├── js/
│   └── uiEngine.js     # Data fetching, state, filtering, sorting, pagination,
│                       # rendering, URL sync, and the detail modal
└── README.md           # This document
```

The final submission consolidates the team's work into `js/uiEngine.js`. Earlier collaboration branches used separate modules (`dataEngine.js`, `pagination.js`, `table.js`, etc.); those ideas and commits are preserved in the Git history, while the submitted build keeps a single dependency-free script for simplicity.

---

## Table columns and data paths

| Column | JSON path | Rendering |
| --- | --- | --- |
| Icon | `images.xs` | Circular `<img>` with lazy loading and alignment-coloured border |
| Name | `name` | Bold text |
| Full Name | `biography.fullName` | Text |
| Intelligence | `powerstats.intelligence` | Numeric meter |
| Strength | `powerstats.strength` | Numeric meter |
| Speed | `powerstats.speed` | Numeric meter |
| Durability | `powerstats.durability` | Numeric meter |
| Power | `powerstats.power` | Numeric meter |
| Combat | `powerstats.combat` | Numeric meter |
| Race | `appearance.race` | Text |
| Gender | `appearance.gender` | Text |
| Height | `appearance.height` | Metric value plus imperial alternative |
| Weight | `appearance.weight` | Metric value plus imperial alternative |
| Place of Birth | `biography.placeOfBirth` | Text |
| Alignment | `biography.alignment` | Coloured pill (good / bad / neutral) |

Missing or invalid values are displayed as `N/A` and are visually muted.

---

## How it works

### 1. Data loading

```js
const response = await fetch(API_URL);
const heroes = await response.json();
```

The full dataset is fetched once and kept in memory. While loading, a spinner is shown; if the request fails, an error message replaces the table.

### 2. Application state

A single state object tracks:

- the full hero list and the filtered list;
- current page and page size;
- sort key and direction;
- search query, field, and operator;
- advanced filter conditions;
- the currently open hero (for URL persistence).

Changing any control recomputes the filtered list, re-renders the current page, and updates the URL — without reloading the page.

### 3. Sorting rules

- Default: **Name ascending**.
- First click on a new column: **ascending**.
- Clicking the active column: toggles **ascending / descending**.
- Text uses `localeCompare` with `numeric: true`, so `"Hero 2"` sorts before `"Hero 10"`.
- Numeric columns compare numbers, not strings.
- Height and weight strings are normalised to **centimetres** and **kilograms** before comparison:
  - `"78 kg"` sorts before `"101 kg"` (numeric order, not lexicographic order).
  - `"61.0 meters"` becomes `6100` cm.
  - `"18 tons"` becomes `18000` kg.
  - `"6'8\""` becomes `203.2` cm.
  - Commas are removed (`"90,000 tons"` → `90000000` kg).
- Missing values (`""`, `"-"`, `"null"`, `"N/A"`, unparseable measures such as `"0 kg"` or `"Shaker Heights, Ohio"`) are **always placed last**, regardless of sort direction.
- Sorting is performed on a copied array (`slice().sort()`), so the master dataset is never mutated.

### 4. Search and filtering

The main search bar is live and case-insensitive. Its behaviour depends on the selected field and operator:

| Operator | Text fields | Numeric fields (stats, height, weight) |
| --- | --- | --- |
| `include` | Contains the query | Not offered |
| `exclude` | Does not contain the query | Not offered |
| `fuzzy` | Letters appear in order | Not offered |
| `=` | Exact text match (falls back when the query is not numeric) | Numeric equality |
| `!=` | Exact text mismatch | Numeric inequality |
| `>` | Not offered | Greater than |
| `<` | Not offered | Less than |

Changing the search field rebuilds the operator dropdown for that field type, so text and numeric fields only show valid choices. Invalid `field`, `operator`, `sort`, `size`, or `page` values in a shared URL are normalised to safe defaults on load.

**Advanced filters** add any number of conditions. Every condition must match (**AND**). Each condition has its own field, operator, and value, and operators adapt automatically to the chosen field type. Empty condition values are ignored. Active advanced filters also appear as removable chips above the table.

### 5. Pagination

- Page sizes: `10`, `20`, `50`, `100`, `All`.
- Default: `20`.
- The page is clamped automatically when filters reduce the number of results.
- Only the rows for the current page are created and inserted into the DOM.
- Pagination shows First / Previous / windowed page numbers with ellipses / Next / Last.

### 6. Detail view

Clicking a row (or focusing it and pressing `Enter` / `Space`) opens a dossier containing:

- large hero image and identity;
- publisher and alignment;
- biography, appearance, powerstats, work, and connections;
- a collapsible raw JSON record.

Close it with the × button, by clicking the backdrop, or by pressing `Escape`. The open hero is stored in the URL as `id`, so the dossier can be shared or bookmarked.

### 7. Performance notes

- Only one network request is made for the dataset.
- Filtering and sorting run against an in-memory array; only the visible page is rendered.
- Images use `loading="lazy"`.
- Event listeners are attached once, and table bodies are cleared and rebuilt per page.
- The app avoids expensive DOM work outside the visible page.

---

## URL state reference

The URL is updated with `history.replaceState`, so sharing or bookmarking a view restores it exactly.

| Parameter | Meaning | Example |
| --- | --- | --- |
| `search` | Search text | `?search=man` |
| `field` | Field the search applies to | `?search=200&field=appearance.height` |
| `operator` | `include`, `exclude`, `fuzzy`, `eq`, `neq`, `gt`, `lt` | `?search=200&field=appearance.height&operator=gt` |
| `sort` | Column key | `?sort=appearance.weight` |
| `dir` | `asc` or `desc` | `?sort=appearance.weight&dir=desc` |
| `size` | Page size (`10`, `20`, `50`, `100`, `all`) | `?size=50` |
| `page` | Page number | `?page=3` |
| `id` | Open hero dossier | `?id=1` |
| `f` | Advanced filter, repeatable (`field\|operator\|value`) | `?f=appearance.gender\|eq\|Female` |

### Example URLs

```text
# Search names containing "man"
?search=man

# Heroes taller than 200 cm
?search=200&field=appearance.height&operator=gt

# Heaviest heroes first, 50 rows per page
?sort=appearance.weight&dir=desc&size=50

# Good-aligned female heroes, with page 2 open
?f=appearance.gender|eq|Female&f=biography.alignment|eq|Good&page=2

# Open Superman's dossier
?id=1
```

The app writes only non-default values to keep URLs short. Query values are URL-encoded automatically by `URLSearchParams`.

---

## Team and workflow distribution

**Group members**

| Member | Zone01 handle | Role | Primary ownership |
| --- | --- | --- | --- |
| Emmaculate Jane Akinyi Odhiambo | `@emmaakinyi` | Project lead, UI & integration engineer | Page shell, table markup/rendering, live name search, final integration, QA, README |
| Bramwel Muriithi | `@mumutugi` | Data & sorting engineer | Data extraction and cleaning, nested-field access, numeric parsing, sorting rules, nulls-last behaviour |
| Moses Milimu | `@mamani` | Interactivity & styling engineer | Fetch pipeline, pagination, advanced search operators, URL state, detail modal, dark neon theme |

### Workstream breakdown

#### 1. Emmaculate — UI shell, rendering, and integration

- Created the repository and initial project structure.
- Built the page shell and semantic table markup.
- Implemented `renderTable` and the row/cell rendering pipeline.
- Implemented live name filtering and wired the UI controls.
- Integrated all team modules into the final `uiEngine.js` build.
- Led final QA against the project checklist, fixed integration issues, and wrote this README.
- Owned the final merge and submission.

**Deliverables:** `index.html`, rendering and search sections of `js/uiEngine.js`, `README.md`.

#### 2. Bramwel — Data engine and sorting

- Implemented data extraction and string-cleaning rules for the API records.
- Built nested-field access (`getNestedValue`) and missing-value detection.
- Implemented type-aware comparison and the **nulls-last** sorting rule.
- Normalised height and weight strings so mixed units (`cm`, `m`, `ft/in`, `kg`, `tons`, `lb`) compare correctly.
- Validated edge cases such as `"78 kg"` vs `"100 kg"`, `"0 kg"`, and malformed API values.

**Deliverables:** data/sorting sections of `js/uiEngine.js`; original work in `js/dataEngine.js` on the `author/mutugi` branch.

#### 3. Moses — Interactivity, search operators, and styling

- Implemented the fetch flow, loading/error states, and numeric parsing.
- Implemented client-side pagination and pagination controls.
- Built the operator-based search engine (`include`, `exclude`, `fuzzy`, `=`, `!=`, `>`, `<`).
- Built advanced multi-condition filters with AND logic.
- Implemented URL state sync and rehydration.
- Built the hero dossier modal and keyboard interactions.
- Designed the dark neon terminal-inspired visual theme and responsive layout.

**Deliverables:** filtering/URL/modal sections of `js/uiEngine.js`, `css/style.css`; original work on `feature/sortable-implementation`.

### Shared responsibilities

- Agreed on the data schema, displayed columns, and acceptance criteria before implementation.
- Reviewed each other's branches and pull requests.
- Tested sorting, filtering, pagination, URL state, and the dossier view together.
- Kept the final build dependency-free and consistent with the vanilla-JS constraint.

### Suggested review ownership

| Change area | Primary reviewer |
| --- | --- |
| Data parsing, sorting, missing values | Bramwel |
| Search, URL state, pagination, modal | Moses |
| Layout, rendering, docs, release | Emmaculate |

---

## Git and collaboration workflow

The team used a branch-per-workstream workflow and merged through pull requests:

```text
main
├── emmaakinyi                     # UI shell, rendering, live search
├── author/mutugi                  # data engine, cleaning, sorting
├── feature/sortable-implementation# fetch, pagination, operators, URL, modal, styling
└── UI-Engine                      # consolidated final dashboard
```

**Process**

1. **Plan** — agree on columns, data paths, and acceptance criteria.
2. **Branch** — each member works on a named feature branch.
3. **Commit** — small, descriptive commits (`feat:`, `fix:`, `style:`, `chore:`).
4. **Pull request** — open a PR into `main` with a short summary.
5. **Review** — at least one teammate reviews logic, edge cases, and styling.
6. **Merge** — merge only when the app runs and the checklist passes.
7. **Release** — final consolidation and submission from `main`.

Pull requests `#1` (data extraction, string cleaning, sorting) and `#2` (sortable implementation) were merged into `main`, followed by the consolidated dashboard integration.

---

## Testing and QA checklist

Use this checklist to verify a fresh clone:

- [ ] Page loads and shows `563` total targets.
- [ ] Default view shows `20` rows, sorted by Name ascending.
- [ ] Page-size selector offers `10`, `20`, `50`, `100`, `All`; default is `20`.
- [ ] Typing `man` in search filters names immediately and shows `48` matches.
- [ ] Searching `200` with field **Height** and operator **>** returns only taller heroes.
- [ ] Selecting a numeric field changes the operator list to `=`, `!=`, `>`, `<` only.
- [ ] Searching `90` with field **Strength** and operator **>** returns only heroes above 90.
- [ ] Sorting by **Weight** ascending places `78 kg` (Clock King) before `99 kg` (Cottonmouth) and `101 kg` (Atlas).
- [ ] Sorting by **Height** descending places `304.8 meters` above `108.0 meters`.
- [ ] Heroes with missing values appear last in both ascending and descending order.
- [ ] Clicking a column header sorts ascending; clicking again reverses it.
- [ ] Pagination First / Prev / Next / Last and page numbers work.
- [ ] Advanced filters combine with AND logic and appear as removable chips.
- [ ] Clicking **Reset** restores the default view, including the `20`-row page size.
- [ ] Clicking a row opens the dossier with a large image and full details.
- [ ] Focus moves to the close button when the dossier opens and returns to the table row when it closes.
- [ ] `Escape` closes the dossier.
- [ ] Reloading a URL with search, sort, filter, page, and `id` restores the same view.
- [ ] A malformed URL (for example `?sort=constructor&field=unknown&size=25&page=-1`) loads safely with defaults.
- [ ] Layout remains usable on a narrow mobile viewport.
- [ ] No console errors.

---

## Data source and credits

- **Dataset:** [akabab/superhero-api](https://github.com/akabab/superhero-api)
- **Endpoint used:** `https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json`
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) and [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via Google Fonts.

The dataset is fetched directly by the browser; no data is bundled, cached on a server, or modified by this project.

---

## Known limitations and notes

- **Internet required.** The dataset and fonts are remote. Offline use would require bundling a local copy of `all.json`.
- **Third-party availability.** If the CDN or image host is down, data or images may not load; the UI shows error/`N/A` states rather than crashing.
- **Inconsistent source records.** A few API entries contain malformed values (for example, a birthplace in the height field, or `0 kg`). These are treated as missing for sorting and placed last.
- **No framework, no build.** This is intentional and required by the project brief.
- **Educational use.** Built as a Zone01 Kisumu project for learning DOM manipulation, asynchronous data fetching, sorting, and client-side state.
