# 🌍 ARGOS — Geopolitical & Economic Intelligence Platform

Live Demo: [Open ARGOS Live] -->  https://argos-geopolitical-intelligence.onrender.com/


<p align="center">
  <b>One space for all geopolitical &amp; economic threat intelligence.</b><br>
  
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python" alt="Python 3.8+" />
  <img src="https://img.shields.io/badge/Dependencies-Zero%20External%20Pip-brightgreen?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/Database-SQLite3-003B57?style=for-the-badge&logo=sqlite" alt="SQLite3" />
  <img src="https://img.shields.io/badge/UI%20Theme-Dark%20Terminal-06111F?style=for-the-badge" alt="Dark Intelligence Terminal" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

---

## 📌 Executive Overview

**ARGOS** tracks real-world kinetic events — wars, naval blockades, sanctions, energy shocks, and cyber incidents — and translates them into actionable macroeconomic briefings and plain-language consumer impacts (fuel prices, cost of living, currency volatility, and supply chains).

Rather than an arbitrary metric, ARGOS features the proprietary **Global Tension Index (GTI)** — a calibrated, mathematically rigorous $0-100$ index operating on exponential saturation, multi-source corroboration, and strategic regional weighting.

---

## 📸 Terminal Interface & Screenshots

### 1. Master Command Center Layout
```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌍 ARGOS  INTELLIGENCE TERMINAL                 [● 19:45:02 UTC]  [Auto-Refresh: 14m]  [🔔 3]│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🚨 BREAKING CABLES: [CRITICAL] Strait of Hormuz Naval Standoff • [HIGH] Red Sea Missile...  │
├──────────────┬──────────────────────────────────────────────────────────────────────────────┤
│ 📊 Dashboard │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│ 🗺️ Map       │  │  GTI SCORE   │  │   S&P 500    │  │   NIFTY 50   │  │ STRATEGIC CRUDE  │  │
│ 📈 Markets   │  │ 72.0 (HIGH)  │  │  5,780.40    │  │  25,145.20   │  │  $76.85 (+2.8%)  │  │
│ 🤖 AI Brief  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘  │
│ 🗄️ Explorer  │ ┌──────────────────────────────────────────────┐ ┌─────────────────────────┐ │
│ ⚙️ Weights   │ │ GTI MULTI-DOMAIN TREND (Plotly Bloomberg)    │ │ GTI DECOMPOSITION GAUGE │ │
│              │ │ ── Amber: GTI  - - Cyan: 7D MA  ◆ Red Spikes  │ │ [ 72.0 / 100 ]          │ │
│ LIVE INTEL:  │ │ -------------------------------------------- │ │ Middle East:    45.0%   │ │
│ 🇮🇷 Hormuz    │ └──────────────────────────────────────────────┘ │ Eastern Europe: 21.5%   │ │
│ 🇾🇪 Red Sea   │ ┌──────────────────────────────────────────────┐ └─────────────────────────┘ │
│ 🇺🇦 Odesa     │ │ GLOBAL TENSION VS MARKETS (Dual-Axis Chart)  │ ┌─────────────────────────┐ │
│ [View All ↓] │ │ Impact: Middle East escalation driving crude │ │ CONFLICT HOTSPOTS MAP   │ │
│ 💬 QuickChat │ └──────────────────────────────────────────────┘ └─────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

### 2. Core Workspaces
- **Flagship Dashboard**: Real-time KPI glass cards, Bloomberg Plotly GTI trend with 7-day MA and spike markers, dual-axis Tension vs. Markets chart, Leaflet CartoDB dark heatmap, and regional risk attribution bars.
- **Global Conflict Map**: Fullscreen interactive command theater featuring maritime chokepoints (*Strait of Hormuz, Bab el-Mandeb, Suez Canal, Malacca, Taiwan Strait, Panama Canal*).
- **Market Intelligence**: Base 100 normalized multi-asset line chart, Pearson correlation heatmap matrix ($r \in [-1.0, +1.0]$), and circular Market Stress Volatility gauge.
- **AI Intelligence Analyst**: Conversational briefing room providing structured situation reports (*Key Drivers, Maritime Logistics, Sector Beta, Consumer Impact, Strategic Outlook*).
- **Data Explorer**: Searchable tabular views across events, GTI history, equities, commodities, and FX with one-click **CSV Dataset Export**.
- **Risk Weight Console**: Interactive sliders for regional multipliers ($0.5x – 2.5x$), half-life decay, and $k$-saturation constant with live real-time simulation preview.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ARGOS CLIENT                              │
│         (HTML5 / CSS3 Dark Intelligence Terminal / ES6 Modules)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST APIs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PYTHON 3 BACKEND SERVER                         │
│                           (server.py :8080)                            │
├────────────────────────────────────────────────────────────────────────┤
│ • Ingestion Engine (15-min background cron scheduler)                  │
│   - Yahoo Finance Live Quotes (S&P 500, NIFTY 50, Gold, WTI, USD/INR)  │
│   - International RSS Feeds (BBC World, NYT World, Al Jazeera)         │
│   - GDELT Project API Fallback & Corroboration Engine                  │
│ • Mathematical Global Tension Index (GTI) Pipeline                     │
│   - Event Impact Score (EIS) computation                               │
│   - Exponential half-life decay (72h half-life)                        │
│   - Exponential saturation function (calibration k = 2850)             │
│   - Pearson correlation coefficient (r) computation                    │
│ • Impact Translation & AI Analyst Briefing Engine                      │
│ • SQLite3 Relational Database Layer (argos.db)                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 GTI Mathematical Formulation

ARGOS implements a formal mathematical specification rather than arbitrary metrics:

### 1. Per-Event Impact Score (EIS)
$$\text{EIS}(\text{event}) = \text{severity} \times \text{confidence} \times \text{region\_weight} \times \text{decay}(\text{hours\_since\_event})$$

- **Severity ($0-100$)**: Base magnitude determined by threat taxonomy (armed conflict $= 80-90$, sanctions $= 55-65$, civil unrest $= 40$, cyber $= \text{CVSS} \times 10$).
- **Corroborated Confidence ($0-1$)**:
  $$\text{confidence} = \min(1.0, 0.4 + 0.2 \times \text{source\_count})$$
  *(Single-source report $= 0.60$; 3+ corroborated international sources $= 1.00$)*.
- **Regional Multiplier ($0.5-2.5$)**: Strategic weight lookup reflecting nuclear capability and energy transit chokepoints (Middle East $= 1.75$, Eastern Europe $= 1.60$, East Asia $= 1.50$, South Asia $= 1.25$).
- **Exponential Half-Life Decay**:
  $$\text{decay}(\text{hours}) = 0.5^{\frac{\text{hours}}{72}}$$
  *(72-hour half-life models how real-world geopolitical tension lingers after news cycles shift).*

### 2. Index Aggregation via Exponential Saturation
$$\text{raw\_score} = \sum_{\text{events} \in 14\text{d}} \text{EIS}(\text{event})$$
$$\text{GTI} = 100 \times \left(1 - e^{-\frac{\text{raw\_score}}{k}}\right)$$

*Where $k = 2850$ is a calibrated constant ensuring that a typical multi-crisis day lands around $65-75$ (High Tension).*

### 3. Pearson Correlation ($r$)
$$r = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i - \bar{x})^2 \sum (y_i - \bar{y})^2}}$$
Measures statistical transmission between daily GTI movement and financial assets across 7D, 30D, and 90D rolling windows.

---

## 📁 Project Directory Structure

```
Argos/
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules for Python, SQLite, and OS files
├── requirements.txt          # Python environment specifications
├── README.md                 # Complete documentation & user guide
├── server.py                 # Self-contained Python backend & ingestion service
├── argos.db                  # Local SQLite database (schema & persistent store)
├── index.html                # Semantic HTML5 terminal layout & workspace shells
├── css/
│   └── styles.css            # Dark Intelligence Terminal design system
├── js/
│   ├── api.js                # REST client & sync state manager
│   ├── charts.js             # Plotly.js charts & canvas sparklines
│   ├── map.js                # Leaflet.js CartoDB Dark Matter mapping
│   ├── analyst.js            # AI Analyst briefing engine & context inspector
│   ├── explorer.js           # Searchable dataset viewer & CSV generator
│   ├── config.js             # Interactive risk weight sliders & simulation
│   └── app.js                # Master coordinator, navigation, & live ticker
└── assets/                   # Static branding & visual assets
```

---

## ⚡ Quickstart & Installation

### 1. Prerequisites
- **Python 3.8+** (installed by default on macOS and Linux)
- Any modern web browser (Chrome, Safari, Firefox, Edge)
- **Zero external packages required** (uses standard library `http.server`, `sqlite3`, `urllib.request`)

### 2. Clone & Run
```bash
# 1. Clone the repository
git clone https://github.com/your-username/argos-intelligence.git
cd argos-intelligence

# 2. (Optional) Configure environment variables
cp .env.example .env

# 3. Start the ARGOS platform
python3 server.py
```

### 3. Access the Terminal
Open your web browser and navigate to:
👉 **`http://localhost:8080`**

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | System health, UTC timestamp, auto-refresh countdown |
| `GET` | `/api/dashboard` | Main dashboard payload (KPIs, GTI trend, markets, live events) |
| `GET` | `/api/events` | Filterable list of normalized geopolitical events & coordinates |
| `GET` | `/api/markets` | Market quotes, normalized performance, correlation matrix |
| `GET` | `/api/gti/history` | 30-day GTI history, 7-day moving averages, spike markers |
| `GET` | `/api/gti/config` | Current mathematical weights and calibration settings |
| `POST` | `/api/gti/config` | Update weights and trigger global recalculation |
| `POST` | `/api/ai/query` | Submit prompt to AI Intelligence Analyst |
| `GET` | `/api/export?dataset=...`| Download dataset as CSV (`events`, `gti_history`, `market_data`) |
| `POST` | `/api/refresh` | Force immediate background sync across all live sources |

---

## 🛠️ GitHub Deployment & Git Commands

To push this project to your GitHub account:

```bash
# 1. Navigate to the project directory
cd /path/to/Argos

# 2. Initialize Git repository
git init

# 3. Add all files to staging
git add .

# 4. Commit the initial build
git commit -m "feat: complete ARGOS geopolitical intelligence platform"

# 5. Set default branch to main
git branch -M main

# 6. Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 7. Push to GitHub
git push -u origin main
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
