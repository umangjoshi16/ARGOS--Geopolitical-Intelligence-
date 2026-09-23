# Argos — Geopolitical-Economic Threat Intelligence Dashboard

## 1. Vision

Argos tracks real-world events — wars, unrest, sanctions, market shocks, cyber incidents —
and translates them into plain-language explanations of how they affect an ordinary
person's daily life (fuel prices, cost of goods, travel safety, savings, etc).

The differentiator is not the data feed. It's the **impact translation layer**: turning
"unrest in the Strait of Hormuz" into "oil prices may rise 3-5% this week, here's what
that means for your fuel costs."

Build order matters: get one thin vertical slice fully working (one data source, end to
end, live on the dashboard) before adding more domains. Agentic tools do much better
extending a working skeleton than building five domains from a blank slate at once.

---

## 2. Architecture

```
Data sources  →  Ingestion & scheduling  →  Database  →  API + impact engine  →  Dashboard
```

- **Data sources**: external APIs (below)
- **Ingestion & scheduling**: cron/scheduled jobs poll sources every 5-15 min, normalize
  into a common event shape, write to DB
- **Database**: Postgres (via Supabase) — stores raw events, market time series, computed
  impact scores
- **API + impact engine**: scores relevance, tags events by domain, generates the
  "what this means for you" summary
- **Dashboard**: Next.js frontend, real-time updates via Supabase subscriptions, map +
  feed + alerts

## 3. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) | Huge ecosystem, well-documented for AI agents, easy real-time UI |
| Backend | Next.js API routes + Node cron jobs | No separate backend service needed for MVP |
| Database | Supabase (Postgres) | Free tier, built-in realtime subscriptions, auth if needed later |
| Scheduling | Supabase Edge Functions or node-cron | Polls sources on a schedule |
| Hosting | Vercel (frontend) + Supabase (data) | Both have generous free tiers |
| LLM (impact summaries) | Gemini API | Generates human-readable "why this matters" text — free tier doesn't expire, unlike a one-time API trial credit |

## 4. Data sources (MVP set)

### Geopolitical events — GDELT
- Free, no API key required
- Updates every 15 minutes
- Endpoint: `https://api.gdeltproject.org/api/v2/doc/doc` (DOC 2.0 API) for article search,
  or the GDELT Event Database (bulk CSV/BigQuery) for structured events
- Fields of interest: event date, actors, event type (CAMEO code), location (lat/long),
  tone/sentiment, source URL
- Rate limit: reasonable use, no hard published cap for the DOC API

### Economic/market data
- **Alpha Vantage** — free tier, 25 requests/day (be careful, low limit) — currencies, indices
- **Twelve Data** — free tier, 800 requests/day — good alternative for FX and commodities
- **Oil/gold benchmarks** — available through both of the above under commodities endpoints
- Poll less frequently than events (e.g. every 15-30 min) to respect free-tier limits

### Cyber threat intelligence
- **NVD CVE feed** — free, official, no key required for basic queries:
  `https://services.nvd.nist.gov/rest/json/cves/2.0`
- **CISA Known Exploited Vulnerabilities (KEV)** — free JSON feed, updated as CISA adds entries:
  `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`

### News/context (optional enrichment)
- **NewsAPI** or **GNews** — free tier, use to attach readable headlines to raw events

### Near-term additions (Phase 2 — cheap to bolt on)
- **Food & agriculture commodities** — wheat, rice, cooking oil. Same market-data
  ingestion path as oil/gold, just add symbols (Alpha Vantage/Twelve Data both cover
  agricultural commodities). Arguably the most directly "felt" price category for users.
- **Supply chain / shipping disruptions** — port strikes, canal blockages, piracy.
  Can be pulled from GDELT the same way as conflict events, just filtered/tagged
  differently (`event_type = 'supply_chain'`). No new integration needed, just a new
  filter and tag on the existing GDELT ingestion.

---

## 5. Database schema (starting point)

```sql
-- Raw normalized events from any source
create table events (
  id uuid primary key default gen_random_uuid(),
  source text not null,              -- 'gdelt', 'cve', 'market', etc
  external_id text,                  -- source's own ID, for dedup
  event_type text,                   -- 'conflict', 'sanction', 'breach', 'price_move', 'supply_chain'
  title text not null,
  description text,
  location_name text,
  latitude double precision,
  longitude double precision,
  severity int,                      -- 1-5, computed or source-provided
  confidence int,                    -- 1-5, how well-corroborated the event is
  source_count int default 1,        -- number of independent sources reporting it
  occurred_at timestamptz not null,
  ingested_at timestamptz default now(),
  raw_payload jsonb                  -- keep the original for debugging/reprocessing
);

-- Per-user personalization (home location + watched regions + alert threshold)
create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,             -- references auth.users if using Supabase auth
  home_location text,
  home_lat double precision,
  home_lng double precision,
  watched_regions text[],            -- e.g. array of country/region names
  alert_severity_threshold int default 4,  -- only alert if severity >= this
  digest_frequency text default 'weekly',  -- 'off', 'weekly', 'daily'
  created_at timestamptz default now()
);

-- Time series for market indicators
create table market_data (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,              -- 'WTI', 'XAU', 'USDINR', etc
  price numeric not null,
  change_pct numeric,
  recorded_at timestamptz not null
);

-- Computed impact scores/tags linking events to domains
create table impact_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  domain text,                       -- 'fuel_prices', 'travel_safety', 'cost_of_living'
  score int,                         -- 1-5 relevance/severity
  summary text,                      -- LLM-generated "what this means for you"
  created_at timestamptz default now()
);
```

## 6. Phased build plan

1. **Vertical slice**: GDELT → scheduled ingestion job → Supabase `events` table →
   simple dashboard listing recent events on a map. Prove the pipeline end to end.
2. **Add real-time**: wire Supabase realtime subscriptions so the dashboard updates
   live without a refresh.
3. **Add second domain**: market data ingestion (oil, gold, one or two currencies) with
   a simple chart component.
4. **Add third domain**: CVE/KEV feed as a cyber threats panel.
5. **Impact engine v1**: rule-based tagging (region → domain mapping) to populate
   `impact_scores` without any LLM calls yet.
6. **Impact engine v2**: call Gemini API on tagged events to generate the human-readable
   "why this matters to you" summary, cached in `impact_scores.summary`.
7. **Polish**: alerts/notifications for high-severity events, filtering by domain/region,
   personal relevance settings (e.g. user's country/interests).

### Phase 2 — near-term additions (build after MVP is solid)
8. **Personalization**: `user_preferences` table (above) — home location + watched
   regions. Feed becomes relevance-ranked instead of a raw firehose.
9. **Trust signals**: populate `confidence` and `source_count` on events (start simple —
   count how many distinct GDELT source URLs mention the same event within a time
   window). Show severity and confidence as two separate indicators in the UI, not one
   blended score.
10. **Weekly digest**: a scheduled job that summarizes the top 3-5 events relevant to a
    user's `watched_regions`, emailed out on their `digest_frequency`.
11. **Threshold alerts**: notify (email to start; push/WhatsApp later) when a new event
    exceeds `alert_severity_threshold` in a watched region.
12. **New domains, reusing existing pipelines**: food/agriculture commodities (market
    ingestion) and supply-chain events (GDELT ingestion, new tag) — see section 4.

### Phase 3 — stretch goals (save for later)
- **Correlation view**: plot an event against the market series it plausibly affected,
  so cause-and-effect is visual rather than asserted.
- **Regional risk score**: aggregate recent severity + trend into a single number per
  region, updating as new events land.
- **Timeline scrubber**: replay how a crisis evolved geographically over days/weeks.
- **Climate & disaster feed**: USGS (earthquakes) / GDACS (multi-hazard) integration —
  a genuinely new data source, more setup than the Phase 2 additions.
- **Elections & political stability indices**: harder to source cleanly (V-Dem, Freedom
  House data isn't as real-time as the other feeds) — worth deferring.
- **Travel-safety mode**: destination + date risk brief — needs the risk-score work
  above as a prerequisite.
- **Public API / B2B angle**: expose normalized event + impact data to other
  developers or supply-chain-conscious businesses — only worth it once the core
  product is proven out.

## 7. Notes for the coding agent

- Respect free-tier rate limits — stagger polling jobs, cache aggressively, don't
  re-fetch unchanged data.
- Dedupe events using `source` + `external_id` before inserting.
- Keep the impact engine decoupled from ingestion — it should run as a separate pass
  over new events, not inline in the scraper, so it can be improved independently.
- Store `raw_payload` for every ingested event — makes debugging and reprocessing much
  easier when a schema assumption turns out wrong.

### Model strategy inside Antigravity

Switch models by task rather than using one for the whole build — all models draw from
a shared weekly quota, and heavier models burn through it faster:
- **Default (most steps)**: latest Gemini Flash tier available (e.g. Gemini 3.8 Flash) —
  fast, cheap on quota, good enough for ingestion scripts, UI components, boilerplate.
- **Hard reasoning step (the GTI computation job, section 9)**: Gemini Pro tier or
  Claude Sonnet (Thinking) — correctness matters most here, worth the extra quota cost.
- **Debugging only**: Claude Opus (Thinking) — most capable, most expensive; save it for
  when a lighter model is stuck, not as a daily driver.
- If you hit rate limits, drop to a lower reasoning-effort Flash tier before switching
  providers entirely.

---

## 8. UI specification — canonical layout

The reference build (`argos_full_dashboard_v3.html`, dark war-room theme) is the target
layout. Build toward this exact structure:

- **Nav bar**: logo, live GTI pill + tension badge ("High tension"), date/time, global/my
  region toggle (new), market instrument selector, alert bell with count badge (new),
  refresh button.
- **KPI row**: GTI, selected market index, Pearson r (correlation window), events in last
  24h, active regions.
- **Main split**: world map (event markers sized/colored by severity, hollow marker ring
  for unconfirmed events) on the left, live event feed + heat legend on the right.
- **Bottom split**: correlation chart (GTI vs. selected market index, dual axis, 7/30/90D
  toggle, tension-spike markers) with a one-line auto-generated explanation of what the
  current correlation means (new) on the left; GTI gauge + regional score bars on the
  right.
- **Status bar**: data source attribution, sync health, last sync time.

New elements to add on top of the reference:
1. **"Why this matters" line** under the correlation chart — one auto-generated sentence
   translating the current GTI/market relationship into plain language.
2. **Confidence indicator** on each event card — hollow vs filled severity dot for
   unconfirmed vs corroborated events.
3. **Global / my region toggle** in the nav, next to the date badge.
4. **Alert bell** with unread count in nav-right, tied to the Phase 2 threshold-alerts
   feature.

---

## 9. GTI methodology — the core algorithm

The Global Tension Index (GTI) is Argos's actual IP — more important than the map or
chart, since everything else displays or reacts to it. It needs to be a real, explainable
formula, not an arbitrary number, since the UI promises to explain it on request.

### Per-event impact score

```
EIS(event) = severity × confidence × region_weight × decay(hours_since_event)
```

- **severity** (0-100): a base value per event type, adjusted by magnitude signals where
  available.
  - Armed conflict escalation: base 80
  - Sanctions imposed: base 55
  - Civil unrest: base 40
  - Trade policy dispute: base 30
  - Cyber breach/CVE: derived from CVSS score × 10 (a CVSS 8.5 → severity 85)
- **confidence** (0-1): `min(1, 0.4 + 0.2 × source_count)` — one source gives 0.6,
  three or more sources saturates at 1.0. This is the same `source_count` field already
  in the `events` table.
- **region_weight** (0.5-2.0): reflects strategic/economic importance — a lookup table
  keyed by region (e.g. major oil chokepoints, nuclear-armed states, top-10 trade
  economies score higher). Start with a simple manually-curated table; refine later.
- **decay(hours_since_event)**: exponential decay, `0.5 ^ (hours_since / 72)` — a
  72-hour half-life. An event's contribution fades but doesn't vanish, matching how
  real tension lingers after the news cycle moves on.

### Aggregating to the 0-100 index

```
raw_score = sum of EIS(event) for all events in the lookback window (e.g. 14 days)
GTI = 100 × (1 − e^(−raw_score / k))
```

The exponential saturation keeps GTI bounded at 0-100 no matter how many events pile up,
while staying roughly linear at low event volume. `k` is a calibration constant chosen
so a "typical high-tension day" (roughly 3-4 major concurrent events) lands around
60-70 — start with an estimated value and tune it once real historical data is flowing
through the pipeline.

Regional scores (the bars in the sidebar) use the same formula, summed over only the
events in that region.

### Correlation (Pearson r)

Standard Pearson correlation between the daily GTI time series and the daily market
index series, computed over the selected window (7/30/90D). This is what the chart and
KPI row already display — no new math needed beyond calculating it from the same
`events`/`market_data` tables.

### Making it explainable

Since the "GTI info" button promises to explain the score, store the computed
breakdown, not just the final number:

```sql
create table gti_daily (
  id uuid primary key default gen_random_uuid(),
  computed_at timestamptz not null,
  gti_score numeric not null,
  top_contributors jsonb,     -- array of {event_id, eis, pct_of_total} for the top 5
  raw_score numeric,
  k_value numeric              -- calibration constant used, for audit/tuning history
);
```

This lets the "why this matters" line and the info button both answer with real
numbers ("driven primarily by the Middle East escalation, contributing 41% of today's
score") instead of a vague explanation.
