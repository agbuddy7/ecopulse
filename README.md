# 🌿 EcoPulse — AI Carbon Footprint Tracker

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Tests: 18 Passing](https://img.shields.io/badge/Tests-18%20Passing-brightgreen.svg)](#testing)
[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-purple.svg)](#accessibility)
[![Built With: Vanilla JS](https://img.shields.io/badge/Built%20With-Vanilla%20JS-yellow.svg)](#tech-stack)

> **Google Prompt Wars Submission** — A smart, dynamic, and accessible single-page web application (SPA) that helps individuals understand, track, and reduce their personal carbon footprint through personalized insights, a rule-based NLP chatbot assistant, daily activity logging, and interactive SVG data visualizations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo & Screenshots](#live-demo--screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Running Locally](#installation--running-locally)
- [Emission Factor Reference](#emission-factor-reference)
- [Module Documentation](#module-documentation)
  - [calculator.js](#calculatorjs)
  - [state.js](#statejs)
  - [assistant.js](#assistantjs)
  - [app.js](#appjs)
- [EcoBot Assistant Guide](#ecobot-assistant-guide)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Security](#security)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

EcoPulse is a **zero-dependency, high-performance web application** built entirely from Vanilla HTML5, CSS3, and ES Modules JavaScript. It is designed to outperform heavy framework-based solutions in terms of page load speed, security, and accessibility compliance.

### Problem Statement Alignment
The application directly addresses the challenge of helping individuals:
- **Understand** their carbon footprint through a guided baseline survey and personalized insights
- **Track** daily activities (commutes, meals, energy usage, waste) with precise CO2e calculations
- **Reduce** emissions through a green habits checklist, actionable EcoBot tips, and trend visualizations

### Evaluation Criteria Coverage

| Criterion | How EcoPulse Addresses It |
|---|---|
| **Code Quality** | Modular ES Module architecture; JSDoc-documented public APIs; clean separation of concerns |
| **Security** | XSS prevention via `textContent` / `createElement`; input validation on all store writes |
| **Efficiency** | Zero runtime dependencies; native SVG charts (no Chart.js overhead); LocalStorage for zero-latency data persistence |
| **Testing** | 18 Jest unit tests across 3 suites covering math, state logic, and NLP parsing |
| **Accessibility** | WCAG 2.1 AA compliant; ARIA live regions; skip links; keyboard navigation; focus management |
| **Problem Alignment** | Full carbon calculator + daily logger + NLP assistant + habit tracker + data export |

---

## Live Demo & Screenshots

To run EcoPulse locally, serve the project directory with any static HTTP server (see [Installation](#installation--running-locally)).

The application features a three-column layout:
- **Left sidebar** — Carbon profile survey & daily activity logger
- **Main dashboard** — Real-time metrics, SVG charts, habits checklist, insights panel, and logged activities table
- **Right panel** — EcoBot NLP chat assistant

---

## Features

### 🧮 Carbon Baseline Calculator
- Surveys transport type, annual mileage, flights, household electricity/gas consumption, dietary pattern, and waste habits
- Calculates a detailed **annual carbon footprint breakdown** across 4 categories (Transport, Energy, Diet, Waste)
- Supports a **renewable energy offset slider** (0–100%) that directly reduces electricity emissions

### ⚡ Daily Activity Logger
- Log specific activities for any date to **override baseline assumptions** for that category
- Supports: Transportation (7 modes), Diet (4 options), Energy (2 types), Waste (3 levels)
- Each entry records: date, category, sub-type, value, calculated emissions, and optional user notes

### 🤖 EcoBot Smart Assistant
- A rule-based natural language parser that interprets plain English commands
- Supports **unit conversion** (miles → km automatically)
- Intents supported: greetings, activity logging, tip requests, and status reports
- Example commands:
  - `"I drove 15 km today in a gasoline car"` → Logs transport activity
  - `"I ate a vegan meal"` → Logs diet entry
  - `"Give me energy tips"` → Returns curated home energy tips
  - `"Show my carbon status"` → Displays today's full carbon breakdown

### 🌱 Green Habits Checklist
- 5 daily habits with measurable CO2e savings (ranging from 0.8 to 4.0 kg)
- Checking a habit **directly reduces your net daily footprint**
- Habit completion is tracked per date and persisted in LocalStorage

### 📊 Interactive SVG Visualizations
- **Category Breakdown bar chart** — Horizontal bars showing proportion of emissions by category
- **7-Day Trend line chart** — Line graph of net daily carbon emissions over the past week
- **Carbon Gauge** — Circular SVG dial (0–30 kg scale) with color transitions (green → amber → red)
- All SVG elements include `aria-label` and `<title>` tags for screen reader compatibility

### 📁 Carbon Audit Export
- One-click **CSV export** of all logged activity data for personal records or external analysis
- Exported columns: ID, Date, Category, Subtype, Value, Emissions (kg CO2e), Note

### 🌓 Dark / Light Theme Toggle
- Persistent theme preference stored in LocalStorage
- Full CSS variable swap ensuring WCAG contrast compliance in both modes

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Structure** | HTML5 (Semantic) | Native accessibility, SEO, zero parsing overhead |
| **Styling** | Vanilla CSS3 + CSS Variables | No runtime CSS-in-JS overhead; full control over animations |
| **Logic** | Vanilla ES Modules (JS) | Tree-shakeable, zero-dependency, runs in any modern browser |
| **Testing** | Jest 29 + jest-environment-jsdom | Industry standard; simulates browser APIs in Node.js |
| **Fonts** | Google Fonts (Outfit + Plus Jakarta Sans) | Modern, premium typography; loaded asynchronously |
| **Persistence** | Browser LocalStorage | Client-side only; no PII leaves the device |

---

## Project Structure

```
terratrack/
│
├── index.html              # Semantic HTML5 SPA shell with ARIA regions
├── style.css               # Full CSS design system (variables, animations, layout)
│
├── js/
│   ├── app.js              # Main coordinator: DOM bindings, SVG charts, CSV export
│   ├── calculator.js       # Pure math engine: emission factors + calculation functions
│   ├── state.js            # Reactive pub-sub store with LocalStorage persistence
│   └── assistant.js        # NLP parser: intent detection + command execution
│
├── tests/
│   ├── calculator.test.js  # Unit tests: emission math & tip generation logic
│   ├── state.test.js       # Unit tests: store updates, habits, streak, daily footprint
│   └── assistant.test.js   # Unit tests: NLP parsing, miles conversion, fallback
│
├── package.json            # npm config: Jest test runner with ES Modules support
├── .gitignore              # Excludes node_modules, logs, OS & IDE files
└── README.md               # This file
```

---

## Installation & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (for running tests)
- Any static file server (Python, VS Code Live Server, etc.)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/aryangupta25813/ecopulse.git
cd ecopulse
```

**2. Install test dependencies**
```bash
npm install
```

**3. Run the test suite**
```bash
npm run test
```
Expected output:
```
PASS tests/calculator.test.js
PASS tests/state.test.js
PASS tests/assistant.test.js

Test Suites: 3 passed, 3 total
Tests:       18 passed, 18 total
```

**4. Serve the application locally**

Using Python (recommended):
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

Using VS Code Live Server: Right-click `index.html` → *Open with Live Server*.

---

## Emission Factor Reference

All emission factors are sourced from the **US Environmental Protection Agency (EPA)** and the **UK Department for Environment, Food & Rural Affairs (DEFRA)**.

### Transportation (kg CO2e per km)

| Mode | Factor | Source |
|---|---|---|
| Gasoline / Petrol Car | 0.18 kg/km | DEFRA 2023 |
| Electric Vehicle (EV) | 0.05 kg/km | DEFRA 2023 (UK grid avg) |
| Public Transit (Bus/Rail) | 0.04 kg/km | DEFRA 2023 |
| Bicycle / Walking | 0.00 kg/km | — |
| Short-haul Flight (<3 hrs) | 150 kg / flight | DEFRA 2023 |
| Long-haul Flight (>3 hrs) | 800 kg / flight | DEFRA 2023 |

### Household Energy (kg CO2e per kWh)

| Source | Factor | Source |
|---|---|---|
| Electricity (grid average) | 0.40 kg/kWh | EPA eGRID 2022 |
| Natural Gas | 0.18 kg/kWh | DEFRA 2023 |
| Heating Oil | 0.26 kg/kWh | DEFRA 2023 |

### Diet (kg CO2e per day)

| Dietary Pattern | Factor | Annual Equivalent |
|---|---|---|
| Meat Heavy | 7.2 kg/day | ~2,628 kg/year |
| Balanced (Average) | 4.6 kg/day | ~1,679 kg/year |
| Vegetarian | 3.2 kg/day | ~1,168 kg/year |
| Vegan | 2.3 kg/day | ~840 kg/year |

### Waste & Consumption (kg CO2e per day)

| Level | Factor | Annual Equivalent |
|---|---|---|
| High (Low recycling) | 5.4 kg/day | ~1,971 kg/year |
| Average Household | 2.7 kg/day | ~985 kg/year |
| Minimal (Composter) | 1.1 kg/day | ~401 kg/year |

---

## Module Documentation

### `calculator.js`

**Purpose**: Pure, side-effect-free math engine. Contains no DOM references or state mutations.

#### Exports

```js
EMISSION_FACTORS
```
A frozen constant object containing all emission factors organized by category.

```js
calculateProfileFootprint(profile: UserProfile): FootprintBreakdown
```
Calculates a full annual carbon footprint breakdown from a user survey profile object.

- `profile.transport.type` — Vehicle type key
- `profile.transport.distance` — Annual km driven
- `profile.energy.cleanEnergyRatio` — Renewable offset (0.0–1.0), reduces electricity emissions
- Returns `{ transport, energy, diet, waste, total }` in kg CO2e/year

```js
calculateActivityEmissions(category, value, subtype): number
```
Calculates emissions for a single logged activity. Returns kg CO2e.

- Validates inputs and returns `0` for invalid/negative values
- Supports all categories: `transport`, `energy`, `diet`, `waste`

```js
generatePersonalizedTips(breakdown): Array<Tip>
```
Compares user breakdown against the global per-capita average (~4.7 tonnes/year) and returns an array of targeted tip objects with `category`, `severity`, `title`, and `desc` fields.

---

### `state.js`

**Purpose**: Reactive singleton store implementing the pub-sub observer pattern. All UI state flows through this module.

#### Exports

```js
store  // Singleton StateStore instance
StateStore  // Class (exported for unit testing with fresh instances)
```

#### Key Methods

```js
store.subscribe(callback: (state) => void): () => void
```
Registers a listener that is immediately called with the current state and re-called on every state change. Returns an unsubscribe function.

```js
store.updateProfile(profileUpdate: Object): void
```
Validates and updates the user's baseline profile. Sanitizes all fields to valid ranges before saving.

```js
store.addLog(date, category, value, subtype, note?): LogEntry
```
Validates inputs, calculates emissions via `calculator.js`, appends a new log entry, and updates the usage streak.

- Throws `Error` for invalid date format or unrecognised category
- Returns the created `LogEntry` object

```js
store.deleteLog(logId: string): void
```
Removes a log entry by its unique generated ID.

```js
store.toggleHabit(habitId: string, date: string): void
```
Toggles habit completion for a given date. Automatically updates streak counter.

```js
store.getDailyFootprint(dateStr: string): DailyStats
```
Computes a net daily carbon breakdown for a given date. For categories where explicit logs exist, uses logged values; otherwise falls back to the daily baseline (annual / 365). Subtracts habit savings from the gross total.

```js
store.resetState(): void
```
Resets the entire application state to factory defaults and clears LocalStorage.

---

### `assistant.js`

**Purpose**: Stateless NLP parser. Receives a raw message string and a store reference, performs intent classification, extracts parameters, and executes corresponding actions.

#### Exports

```js
processAssistantMessage(rawMessage: string, store: StateStore): AssistantResponse
```

Returns `{ text: string, success: boolean, action?: Object }`.

#### Intent Classification Order

| Priority | Intent | Trigger Keywords |
|---|---|---|
| 1 | Greeting | `hi`, `hello`, `hey`, `greetings`, `good morning` |
| 2 | Status Report | `status`, `score`, `streak`, `dashboard`, `progress` |
| 3 | Eco Tips | `tip`, `advice`, `reduce`, `save`, `how to`, `offset` |
| 4 | Transport Log | `drive`, `drove`, `car`, `bus`, `train`, `flight`, `rode` |
| 5 | Diet Log | `eat`, `ate`, `vegan`, `vegetarian`, `meat`, `meal` |
| 6 | Energy Log | `electricity`, `kwh`, `power`, `gas`, `heating` |
| 7 | Waste Log | `waste`, `recycle`, `compost`, `trash`, `garbage` |
| 8 | Fallback | (no match) |

#### Unit Conversion
If the message contains the word `mile` or `miles`, any extracted numeric value is automatically converted to kilometres: `km = miles × 1.60934`.

---

### `app.js`

**Purpose**: Main UI coordinator. Subscribes to the store and reactively updates the DOM on every state change.

#### Key Responsibilities

| Function | Description |
|---|---|
| `renderCategoryChart()` | Builds an accessible SVG horizontal bar chart for the 4 emission categories |
| `renderHistoryChart()` | Builds a 7-day SVG line graph with grid lines, axis labels, and circle nodes |
| `renderLogsAndHabits()` | Re-renders the habits checklist, activity log table, insight cards, mini-cards, and the circular gauge |
| `appendChatMessage()` | Safely creates DOM nodes for chat bubbles, sanitizing all text content |
| `sanitizeText()` | Core XSS prevention: wraps raw user input in a temporary div and reads back `.innerHTML` |
| CSV Export | Encodes all log entries to RFC 4180 CSV format and triggers a browser download link |

---

## EcoBot Assistant Guide

EcoBot understands plain English. Here is a full reference of supported command patterns:

### Logging Activities

| You type | What EcoBot does |
|---|---|
| `"I drove 20 km"` | Logs 20 km gasoline car → **3.6 kg CO2e** |
| `"I drove 10 miles"` | Converts to 16.1 km, logs gasoline car → **2.9 kg CO2e** |
| `"I took the bus for 12 km"` | Logs 12 km public transit → **0.5 kg CO2e** |
| `"I rode my bike 5 km"` | Logs 5 km bicycle → **0.0 kg CO2e** |
| `"I took a flight"` | Logs 1 short-haul flight → **150 kg CO2e** |
| `"I ate vegan today"` | Logs 1 day vegan diet → **2.3 kg CO2e** |
| `"I had a vegetarian meal"` | Logs 1 day vegetarian → **3.2 kg CO2e** |
| `"I had beef for dinner"` | Logs 1 day meat heavy → **7.2 kg CO2e** |
| `"I used 10 kWh of electricity"` | Logs 10 kWh electricity → **4.0 kg CO2e** |
| `"I recycled everything today"` | Logs 1 day minimal waste → **1.1 kg CO2e** |

### Querying Information

| You type | What EcoBot returns |
|---|---|
| `"Hello"` | Welcome greeting |
| `"Show my carbon status"` | Full today's breakdown |
| `"What is my streak?"` | Current streak count |
| `"Give me tips"` | 3 random eco tips |
| `"Energy saving tips"` | 3 home energy tips |
| `"How can I reduce food emissions?"` | 3 diet-specific tips |
| `"Transport advice"` | 3 transport tips |

---

## Testing

EcoPulse uses **Jest 29** with `jest-environment-jsdom` to simulate the browser's DOM and LocalStorage APIs.

### Running Tests
```bash
npm run test
```

### Test Coverage

#### `tests/calculator.test.js` — 7 tests
- ✅ Zero emissions for zero-distance, vegan, minimal-waste profile
- ✅ Accurate multi-category footprint with flight combinations
- ✅ Individual activity emission calculations (transport, energy, diet)
- ✅ Returns `0` for invalid inputs (negative values, unknown categories)
- ✅ Warning tip generation for high-footprint profiles
- ✅ Success tip generation for low-footprint profiles

#### `tests/state.test.js` — 6 tests
- ✅ Default state initialization
- ✅ Profile updates with LocalStorage persistence
- ✅ Log creation, emission calculation, and deletion
- ✅ Habit toggle on / off
- ✅ Consecutive-day streak increment and reset on gap
- ✅ Net daily footprint with logged overrides and habit savings subtraction

#### `tests/assistant.test.js` — 5 tests
- ✅ Greeting intent detection
- ✅ Tip queries (general + category-specific)
- ✅ Transport logging with km and miles unit conversion
- ✅ Diet logging with subtype mapping
- ✅ Energy logging with kWh value parsing
- ✅ Graceful fallback for unrecognised input

---

## Accessibility

EcoPulse is built to comply with **WCAG 2.1 Level AA** guidelines.

### Implementation Details

| Feature | Implementation |
|---|---|
| **Skip Navigation** | `<a href="#main-dashboard" class="skip-link">` visible on focus |
| **ARIA Live Region** | `<div id="sr-announcer" aria-live="polite">` announces all dynamic state changes |
| **SVG Accessibility** | All charts include `role="img"` and descriptive `aria-label` attributes |
| **Form Labels** | Every `<input>` and `<select>` has an associated `<label for="...">` |
| **Focus Ring** | `*:focus-visible { outline: 3px solid var(--color-primary); }` — never hidden |
| **Keyboard Navigation** | Tab panel navigation, full form keyboard access, Enter to submit |
| **Color Contrast** | Dark mode: white text (#f8fafc) on dark surface (#0b0f19) → ratio > 15:1 |
| **Light Mode** | Dark text (#0f172a) on white (#ffffff) → ratio > 21:1 |
| **Chat Log** | `role="log" aria-live="polite"` on chat container for screen reader announcements |

---

## Security

### XSS Prevention
All user-provided text (log notes, chat messages) is routed through the `sanitizeText()` function before being inserted into the DOM:
```js
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text; // Encodes all special characters
  return div.innerHTML;   // Returns safely escaped HTML
}
```
This prevents script injection via `innerHTML`. All DOM mutations use safe methods (`createElement`, `textContent`, `setAttribute`).

### Input Validation
The `store.addLog()` method validates:
- Date format must match `YYYY-MM-DD` (regex validated)
- Category must be one of the four allowed values
- Numeric values are clamped to `Math.max(0, ...)` to prevent negative emissions
- Note strings are truncated to 100 characters maximum

### Data Privacy
- **No network requests** are made by the application logic
- All data is stored exclusively in **browser LocalStorage** under the key `ecopulse_state_v1`
- No third-party analytics, trackers, or cookies are used

---

## Design System

EcoPulse uses a CSS custom properties (variables) based design token system defined in `:root` and overridden in `:root.light-theme`.

### Color Palette

| Token | Dark Value | Light Value | Usage |
|---|---|---|---|
| `--bg-app` | `#0b0f19` | `#f1f5f9` | Page background |
| `--bg-glass` | `rgba(17,24,39,0.65)` | `rgba(255,255,255,0.8)` | Card surfaces |
| `--color-primary` | `#10b981` | `#059669` | Actions, accents, gauge |
| `--color-accent` | `#6366f1` | `#4f46e5` | Secondary accents, line chart |
| `--text-main` | `#f8fafc` | `#0f172a` | Primary text |
| `--text-muted` | `#94a3b8` | `#475569` | Labels, secondary text |

### Typography
- **Display / Headings**: `Outfit` (weights 300–800)
- **Body / Labels**: `Plus Jakarta Sans` (weights 300–800)

### Animation
- **`pulse-slow`**: 3s ease-in-out scale animation on the 🌱 logo
- **`streak-glow`**: 2s box-shadow pulsing on the streak counter
- **`pulse-dot`**: 1.5s scale animation on the EcoBot online indicator
- **Gauge fill**: 1s `cubic-bezier(0.4,0,0.2,1)` transition on stroke-dashoffset

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests for new logic
4. Run the test suite: `npm run test`
5. Open a Pull Request with a clear description of your changes

---

## License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with 💚 for Google Prompt Wars · Built to be fast, accessible, and sustainable
</div>
