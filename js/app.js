/**
 * ARGOS — Master Application Coordinator
 */

const App = {
  activePage: 'page-dashboard',
  selectedAsset: 'CL=F',
  selectedWindow: 30,
  refreshCountdown: 900,
  dashboardData: null,
  marketData: null,
  eventsData: null,
  eventsExpanded: false,
  cachedEvents: [],

  init() {
    this.startUTCClock();
    this.startRefreshTimer();
    this.bindNavigation();
    this.bindControls();
    this.refreshAllData();

    // Initialize sub-modules
    AIAnalyst.init();
    DataExplorer.init();
    RiskConfig.init();
  },

  startUTCClock() {
    const clockEl = document.getElementById('header-utc-clock');
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      if (clockEl) clockEl.textContent = `${h}:${m}:${s} UTC`;
    };
    update();
    setInterval(update, 1000);
  },

  startRefreshTimer() {
    const statusEl = document.getElementById('auto-refresh-status');
    setInterval(() => {
      this.refreshCountdown--;
      if (this.refreshCountdown <= 0) {
        this.refreshCountdown = 900;
        this.refreshAllData();
      }
      if (statusEl) {
        const mins = Math.floor(this.refreshCountdown / 60);
        const secs = this.refreshCountdown % 60;
        statusEl.textContent = `Auto Refresh in ${mins}m ${String(secs).padStart(2, '0')}s`;
      }
    }, 1000);
  },

  bindNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.getAttribute('data-target');
        if (targetPage) {
          this.navigateTo(targetPage);
        }
      });
    });
  },

  navigateTo(pageId) {
    this.activePage = pageId;

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-target') === pageId);
    });

    // Update page views
    document.querySelectorAll('.page-view').forEach(p => {
      p.classList.toggle('active', p.id === pageId);
    });

    // Handle view-specific initializations
    if (pageId === 'page-conflict-map' && this.eventsData) {
      setTimeout(() => {
        ArgosMap.initFullConflictMap('full-conflict-map-container', this.eventsData);
      }, 100);
    } else if (pageId === 'page-markets' && this.marketData) {
      setTimeout(() => {
        Charts.renderNormalizedPerformance('normalized-perf-chart', this.marketData.markets);
        Charts.renderCorrelationHeatmap('correlation-matrix-chart', this.marketData.correlation_matrix);
        Charts.updateCircularGauge('stress-gauge-circle', this.marketData.stress_gauge?.stress_score || 55);
      }, 100);
    } else if (pageId === 'page-dashboard' && this.dashboardData) {
      setTimeout(() => {
        this.renderDashboardCharts(this.dashboardData);
      }, 100);
    }
  },

  bindControls() {
    // Force Refresh Button
    const refreshBtn = document.getElementById('header-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('rotating');
        await API.triggerRefresh();
        setTimeout(() => {
          this.refreshAllData();
          refreshBtn.classList.remove('rotating');
        }, 1500);
      });
    }

    // Notification Bell toggle
    const bellBtn = document.getElementById('notification-bell-btn');
    const popover = document.getElementById('notifications-popover');
    if (bellBtn && popover) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popover.classList.toggle('active');
      });
      document.addEventListener('click', () => {
        popover.classList.remove('active');
      });
      popover.addEventListener('click', (e) => e.stopPropagation());
    }

    // Global / My Region Toggle
    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const mode = e.target.getAttribute('data-mode');
        this.filterRegionMode(mode);
      });
    });

    // Dual-Axis Asset Dropdown
    const assetSelect = document.getElementById('dual-axis-asset-select');
    if (assetSelect) {
      assetSelect.addEventListener('change', (e) => {
        this.selectedAsset = e.target.value;
        this.updateDualAxisChart();
      });
    }

    // Time window pills (7D, 30D, 90D, 1Y)
    document.querySelectorAll('.window-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.window-pill-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedWindow = parseInt(e.target.getAttribute('data-days'));
        this.updateDualAxisChart();
      });
    });

    // Conflict Map Filter Buttons
    document.querySelectorAll('.map-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const reg = e.target.getAttribute('data-region');
        if (this.eventsData) {
          ArgosMap.filterByRegion(reg, this.eventsData);
        }
      });
    });

    // Toggle View All Intelligence Cables
    const toggleEventsBtn = document.getElementById('toggle-view-all-events');
    if (toggleEventsBtn) {
      toggleEventsBtn.addEventListener('click', () => {
        this.eventsExpanded = !this.eventsExpanded;
        this.renderSidebarEvents(this.cachedEvents);
      });
    }
  },

  async refreshAllData() {
    try {
      const [dash, mkts, evts] = await Promise.all([
        API.getDashboard(this.selectedAsset, this.selectedWindow),
        API.getMarkets(this.selectedAsset, this.selectedWindow),
        API.getEvents('all', 0)
      ]);

      this.dashboardData = dash;
      this.marketData = mkts;
      this.eventsData = evts.events || [];

      // Render components
      this.renderKPIs(dash.kpis);
      this.renderDashboardCharts(dash);
      this.renderSidebarEvents(dash.live_events);
      this.renderTicker(dash.live_events);
      this.renderRegionalBars(dash.gti_panel.regional_breakdown);
      this.renderMarketStress(dash.kpis.stress_gauge);
      this.renderCommodityTable(mkts.markets);

      // Map initialization
      ArgosMap.initDashboardMap('dashboard-map-container', this.eventsData);

      // AI Context Update
      AIAnalyst.updateLiveContext(dash);

      // Last updated stamp
      const updatedEl = document.getElementById('header-last-updated');
      if (updatedEl) {
        const d = new Date();
        updatedEl.textContent = `Updated ${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')} UTC`;
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    }
  },

  renderKPIs(kpis) {
    if (!kpis) return;

    // 1. GTI KPI
    const gtiScore = kpis.gti?.score || 72.0;
    const gtiChg = kpis.gti?.change || +1.8;
    this.animateNumber('kpi-gti-val', gtiScore, 1);
    const gtiBadge = document.getElementById('kpi-gti-badge');
    if (gtiBadge) {
      gtiBadge.textContent = `${gtiChg >= 0 ? '+' : ''}${gtiChg} pts`;
      gtiBadge.className = `kpi-badge ${gtiChg >= 0 ? 'negative' : 'positive'}`;
    }
    const gtiRiskLabel = document.getElementById('kpi-gti-risk-level');
    if (gtiRiskLabel) gtiRiskLabel.textContent = `${kpis.gti?.risk_level || 'HIGH'} TENSION`;
    Charts.updateCircularGauge('kpi-gti-circle', gtiScore);

    // 2. S&P 500
    const sp = kpis.sp500 || {};
    this.animateNumber('kpi-sp-val', sp.price || 5780.4, 2);
    const spBadge = document.getElementById('kpi-sp-badge');
    if (spBadge) {
      spBadge.textContent = `${sp.change_pct >= 0 ? '+' : ''}${sp.change_pct || 0}%`;
      spBadge.className = `kpi-badge ${sp.change_pct >= 0 ? 'positive' : 'negative'}`;
    }
    const spCloses = (sp.series || []).map(s => s.price);
    Charts.drawSparkline('kpi-sp-sparkline', spCloses, (sp.change_pct || 0) >= 0);

    // 3. NIFTY 50
    const nifty = kpis.nifty50 || {};
    this.animateNumber('kpi-nifty-val', nifty.price || 25145.2, 1);
    const niftyBadge = document.getElementById('kpi-nifty-badge');
    if (niftyBadge) {
      niftyBadge.textContent = `${nifty.change_pct >= 0 ? '+' : ''}${nifty.change_pct || 0}%`;
      niftyBadge.className = `kpi-badge ${nifty.change_pct >= 0 ? 'positive' : 'negative'}`;
    }
    const niftyCloses = (nifty.series || []).map(s => s.price);
    Charts.drawSparkline('kpi-nifty-sparkline', niftyCloses, (nifty.change_pct || 0) >= 0);

    // 4. Commodities (Gold & WTI)
    const gold = kpis.commodities?.gold || {};
    const crude = kpis.commodities?.crude || {};
    const goldEl = document.getElementById('kpi-gold-val');
    const crudeEl = document.getElementById('kpi-crude-val');
    if (goldEl) goldEl.textContent = `$${(gold.price || 2684.5).toLocaleString()}`;
    if (crudeEl) crudeEl.textContent = `$${(crude.price || 76.85).toFixed(2)}`;

    const goldChgEl = document.getElementById('kpi-gold-chg');
    const crudeChgEl = document.getElementById('kpi-crude-chg');
    if (goldChgEl) {
      goldChgEl.textContent = `${gold.change_pct >= 0 ? '+' : ''}${gold.change_pct}%`;
      goldChgEl.className = gold.change_pct >= 0 ? 'text-positive' : 'text-negative';
    }
    if (crudeChgEl) {
      crudeChgEl.textContent = `${crude.change_pct >= 0 ? '+' : ''}${crude.change_pct}%`;
      crudeChgEl.className = crude.change_pct >= 0 ? 'text-positive' : 'text-negative';
    }

    const crudeCloses = (crude.series || []).map(s => s.price);
    Charts.drawSparkline('kpi-commodities-sparkline', crudeCloses, (crude.change_pct || 0) >= 0);
  },

  renderDashboardCharts(dash) {
    if (!dash) return;
    const gtiPanel = dash.gti_panel || {};
    Charts.renderGTITrendChart('gti-trend-plotly-chart', gtiPanel.history_30d);
    Charts.renderDualAxisTensionMarketsChart('dual-axis-plotly-chart', dash.correlation_chart);

    // Ribbon Stats
    const currScore = document.getElementById('ribbon-curr-gti');
    const ev24 = document.getElementById('ribbon-24h-events');
    const kw = document.getElementById('ribbon-keyword-intensity');
    const peak = document.getElementById('ribbon-peak-gti');

    if (currScore) currScore.textContent = gtiPanel.score;
    if (ev24) ev24.textContent = gtiPanel.events_24h || 18;
    if (kw) kw.textContent = gtiPanel.keyword_intensity || "ELEVATED (87%)";
    if (peak) peak.textContent = gtiPanel.peak_30d || 85.0;

    // Right panel circular gauge
    Charts.updateCircularGauge('side-gauge-circle', gtiPanel.score);
    const sideNum = document.getElementById('side-gauge-number');
    if (sideNum) sideNum.textContent = gtiPanel.score;

    // Mini regional bars
    const miniContainer = document.getElementById('side-regional-mini-list');
    if (miniContainer && gtiPanel.regional_breakdown) {
      miniContainer.innerHTML = Object.entries(gtiPanel.regional_breakdown).slice(0, 4).map(([reg, data]) => `
        <div class="mini-bar-item">
          <div class="mini-bar-meta">
            <span class="mini-bar-name">${reg}</span>
            <span class="mini-bar-val">${data.score} (${data.percentage}%)</span>
          </div>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width:${data.percentage}%;"></div>
          </div>
        </div>
      `).join('');
    }

    // Why this matters line
    const bannerText = document.getElementById('why-this-matters-text');
    if (bannerText && dash.correlation_chart) {
      bannerText.textContent = dash.correlation_chart.why_this_matters || "";
    }
  },

  async updateDualAxisChart() {
    try {
      const data = await API.getDashboard(this.selectedAsset, this.selectedWindow);
      Charts.renderDualAxisTensionMarketsChart('dual-axis-plotly-chart', data.correlation_chart);
      const bannerText = document.getElementById('why-this-matters-text');
      if (bannerText) bannerText.textContent = data.correlation_chart.why_this_matters;
    } catch (err) {
      console.error(err);
    }
  },

  renderSidebarEvents(events) {
    const list = document.getElementById('sidebar-events-list');
    const countBadge = document.getElementById('sidebar-events-count');
    const toggleBtn = document.getElementById('toggle-view-all-events');
    const toggleText = document.getElementById('toggle-view-all-text');
    const toggleIcon = document.getElementById('toggle-view-all-icon');
    if (!list || !events) return;

    this.cachedEvents = events;

    if (countBadge) countBadge.textContent = `${events.length} MONITORED`;

    // Limit visible to 3-4 cards when not expanded for clean Bloomberg/Palantir aesthetic
    const displayEvents = this.eventsExpanded ? events.slice(0, 20) : events.slice(0, 4);

    if (toggleText && toggleIcon) {
      if (this.eventsExpanded) {
        toggleText.textContent = 'Show Top 4 Cables';
        toggleIcon.textContent = '↑';
      } else {
        toggleText.textContent = `View All Cables (${events.length})`;
        toggleIcon.textContent = '↓';
      }
    }

    const regionFlags = {
      "Middle East": "🇮🇷 / 🇾🇪",
      "Eastern Europe": "🇺🇦 / 🇷🇺",
      "East Asia": "🇹🇼 / 🇨🇳",
      "South Asia": "🇮🇳 / 🇵🇰",
      "Africa": "🇸🇩 / 🇳🇪",
      "Americas": "🇺🇸 / 🇵🇦"
    };

    list.innerHTML = displayEvents.map(ev => {
      const isCorroborated = (ev.confidence || 0.8) >= 0.75;
      const sev = ev.severity || 50;
      let sevClass = 'moderate';
      let sevLabel = 'MODERATE';
      if (sev >= 80) {
        sevClass = 'critical';
        sevLabel = 'CRITICAL';
      } else if (sev >= 65) {
        sevClass = 'high';
        sevLabel = 'HIGH';
      }

      const flag = regionFlags[ev.region] || "🌐";

      return `
        <div class="event-card-item sev-${sevClass}" onclick="App.showEventDetail('${ev.id}')">
          <div class="event-card-top">
            <span class="event-region-flag">${flag} ${ev.region || 'Global'}</span>
            <span class="card-sev-pill ${sevClass}">${sevLabel} (${sev})</span>
          </div>
          <div class="event-card-headline">${ev.title}</div>
          <div class="event-card-bottom">
            <span class="event-source-tag">
              <span class="confidence-dot ${isCorroborated ? 'filled' : 'hollow'}" title="${isCorroborated ? 'Corroborated by multiple sources' : 'Single source report'}"></span>
              ${ev.source}
            </span>
            <span class="event-time-tag">${this.formatTimeAgo(ev.occurred_at)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTicker(events) {
    const track = document.getElementById('ticker-track');
    if (!track || !events) return;

    // Double for continuous marquee
    const repeated = [...events.slice(0, 15), ...events.slice(0, 15)];
    track.innerHTML = repeated.map(ev => `
      <div class="ticker-item" onclick="App.showEventDetail('${ev.id}')">
        <span class="sev-tag ${ev.severity >= 80 ? 'critical' : (ev.severity >= 65 ? 'high' : 'moderate')}">
          ${ev.region}
        </span>
        <span style="font-weight:600; color:#F5F7FA;">${ev.title}</span>
        <span style="color:#64748B;">•</span>
      </div>
    `).join('');
  },

  renderRegionalBars(regionalBreakdown) {
    const container = document.getElementById('regional-risk-bars-container');
    if (!container || !regionalBreakdown) return;

    container.innerHTML = Object.entries(regionalBreakdown).map(([reg, data]) => {
      const isCritical = data.score >= 80;
      const isHigh = data.score >= 65;
      const barClass = isCritical ? 'critical' : (isHigh ? 'high' : '');

      return `
        <div class="regional-bar-row">
          <div class="bar-row-header">
            <span class="bar-row-title">${reg}</span>
            <div class="bar-row-stats">
              <span class="bar-score-badge">GTI Influence: ${data.percentage}%</span>
              <span class="bar-pct">Score: ${data.score}/100</span>
            </div>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${barClass}" style="width:${data.percentage}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderMarketStress(stress) {
    if (!stress) return;
    const valEl = document.getElementById('stress-gauge-val');
    const labelEl = document.getElementById('stress-gauge-label');
    if (valEl) valEl.textContent = stress.stress_score;
    if (labelEl) {
      labelEl.textContent = `${stress.level.toUpperCase()} STRESS`;
      labelEl.className = `kpi-badge ${stress.stress_score >= 65 ? 'negative' : (stress.stress_score >= 45 ? 'high' : 'positive')}`;
    }
  },

  renderCommodityTable(markets) {
    const tbody = document.getElementById('commodity-table-body');
    if (!tbody || !markets) return;

    const rows = [
      { sym: "CL=F", name: "WTI Crude Oil", exp: "Strait of Hormuz / Persian Gulf" },
      { sym: "GC=F", name: "Gold (XAU/USD)", exp: "Global Sovereign Safe Haven" },
      { sym: "^GSPC", name: "S&P 500 Index", exp: "Transatlantic Industrial Multiple" },
      { sym: "^NSEI", name: "NIFTY 50 Index", exp: "Hydrocarbon Import Sensitivity" },
      { sym: "INR=X", name: "USD / INR", exp: "Energy Trade Deficit Pressure" }
    ];

    tbody.innerHTML = rows.map(r => {
      const data = markets[r.sym] || {};
      const chg = data.change_pct || 0;
      return `
        <tr>
          <td style="font-weight:700; color:#3DD6FF; font-family:'JetBrains Mono';">${r.sym}</td>
          <td style="font-weight:600; color:#F5F7FA;">${data.name || r.name}</td>
          <td style="font-family:'JetBrains Mono'; font-weight:700; color:#FFFFFF;">${data.price ? data.price.toLocaleString() : '-'}</td>
          <td>
            <span class="kpi-badge ${chg >= 0 ? 'positive' : 'negative'}">
              ${chg >= 0 ? '+' : ''}${chg}%
            </span>
          </td>
          <td style="font-size:12px; color:#94A3B8;"><span class="chokepoint-tag">${r.exp}</span></td>
        </tr>
      `;
    }).join('');
  },

  showEventDetail(eventId) {
    const ev = (this.eventsData || []).find(e => e.id === eventId);
    if (!ev) return;

    const modal = document.getElementById('event-detail-modal');
    const content = document.getElementById('event-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #23364D; padding-bottom:10px;">
        <span class="sev-tag ${ev.severity >= 80 ? 'critical' : 'high'}">${ev.severity}/100 SEVERITY</span>
        <span style="font-family:'JetBrains Mono'; font-size:11px; color:#3DD6FF;">${ev.source}</span>
      </div>
      <h3 style="font-size:18px; font-weight:700; color:#F5F7FA; margin-bottom:8px;">${ev.title}</h3>
      <div style="font-size:12px; color:#3DD6FF; margin-bottom:12px; font-family:'JetBrains Mono';">
        📍 ${ev.location_name} (${ev.region})
      </div>
      <p style="font-size:13.5px; color:#CBD5E1; line-height:1.5; margin-bottom:18px;">
        ${ev.description || 'No detailed cable text.'}
      </p>
      <div style="background:rgba(6,17,31,0.8); border:1px solid #23364D; border-radius:10px; padding:12px; font-family:'JetBrains Mono'; font-size:11.5px; margin-bottom:18px;">
        <div style="color:#64748B; margin-bottom:4px;">QUANTITATIVE ATTRIBUTION</div>
        <div>Confidence: <b style="color:#2ECC71;">${((ev.confidence || 0.8) * 100).toFixed(0)}% corroborated</b></div>
        <div>Published: <b style="color:#F5F7FA;">${ev.occurred_at}</b></div>
      </div>
      <div style="display:flex; justify-content:flex-end;">
        <button onclick="document.getElementById('event-detail-modal').classList.remove('active')" class="btn-primary" style="padding:8px 18px; font-size:12px;">Close Cable</button>
      </div>
    `;

    modal.classList.add('active');
  },

  filterRegionMode(mode) {
    if (!this.dashboardData) return;
    if (mode === 'my-region') {
      // Filter for monitored region e.g. Middle East
      const filtered = this.eventsData.filter(e => e.region === 'Middle East' || e.region === 'Eastern Europe');
      this.renderSidebarEvents(filtered);
    } else {
      this.renderSidebarEvents(this.dashboardData.live_events);
    }
  },

  animateNumber(elId, target, decimals = 1) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = parseFloat(el.textContent.replace(/,/g, '')) || (target * 0.95);
    const duration = 800;
    const startTime = performance.now();

    const step = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;
      el.textContent = current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  formatTimeAgo(isoString) {
    if (!isoString) return 'just now';
    try {
      const diffMs = new Date() - new Date(isoString);
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'recently';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'today';
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
