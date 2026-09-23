/**
 * ARGOS — Data Explorer Module (Searchable Datasets & CSV Export)
 */

const DataExplorer = {
  currentDataset: 'events',
  dataCache: {},
  searchTerm: '',
  selectedRegion: 'all',
  selectedSeverity: 'all',

  init() {
    this.bindEvents();
    this.loadDataset('events');
  },

  bindEvents() {
    // Dataset tabs
    document.querySelectorAll('.data-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.data-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const ds = e.currentTarget.getAttribute('data-dataset');
        this.currentDataset = ds;
        this.loadDataset(ds);
      });
    });

    // Search input
    const searchInput = document.getElementById('explorer-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTable();
      });
    }

    // Region filter
    const regionSelect = document.getElementById('explorer-region-filter');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        this.selectedRegion = e.target.value;
        this.renderTable();
      });
    }

    // Export CSV button
    const exportBtn = document.getElementById('explorer-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const url = API.getExportUrl(this.currentDataset);
        window.open(url, '_blank');
      });
    }
  },

  async loadDataset(datasetKey) {
    const tableBody = document.getElementById('explorer-table-body');
    const tableHead = document.getElementById('explorer-table-head');
    if (!tableBody || !tableHead) return;

    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748B;">Loading dataset...</td></tr>`;

    try {
      if (datasetKey === 'events' || datasetKey === 'geopolitical_news') {
        const data = await API.getEvents('all', 0);
        this.dataCache['events'] = data.events || [];
      } else if (datasetKey === 'gti_history') {
        const data = await API.getGTIHistory();
        this.dataCache['gti_history'] = data.history_30d || [];
      } else if (datasetKey === 'market_data' || datasetKey === 'commodities' || datasetKey === 'exchange_rates') {
        const data = await API.getMarkets();
        this.dataCache['market_data'] = Object.values(data.markets || {});
      }
      this.renderTable();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#FF5A5F;">Error loading dataset: ${err.message}</td></tr>`;
    }
  },

  renderTable() {
    const tableHead = document.getElementById('explorer-table-head');
    const tableBody = document.getElementById('explorer-table-body');
    if (!tableHead || !tableBody) return;

    const ds = this.currentDataset;
    const items = this.dataCache[ds === 'geopolitical_news' ? 'events' : (ds === 'commodities' || ds === 'exchange_rates' ? 'market_data' : ds)] || [];

    // Filter items
    const filtered = items.filter(item => {
      const matchSearch = !this.searchTerm || JSON.stringify(item).toLowerCase().includes(this.searchTerm);
      const matchRegion = this.selectedRegion === 'all' || item.region === this.selectedRegion;
      return matchSearch && matchRegion;
    });

    if (ds === 'events' || ds === 'geopolitical_news') {
      tableHead.innerHTML = `
        <tr>
          <th>Source</th>
          <th>Title & Incident</th>
          <th>Region</th>
          <th>Location</th>
          <th>Severity</th>
          <th>Confidence</th>
          <th>Occurred</th>
        </tr>
      `;
      tableBody.innerHTML = filtered.map(ev => `
        <tr>
          <td><span style="color:#3DD6FF; font-family:'JetBrains Mono'; font-weight:600;">${ev.source}</span></td>
          <td style="font-weight:600; color:#F5F7FA; max-width:320px;">${ev.title}</td>
          <td><span class="chokepoint-tag">${ev.region}</span></td>
          <td>${ev.location_name}</td>
          <td>
            <span class="sev-tag ${ev.severity >= 80 ? 'critical' : (ev.severity >= 65 ? 'high' : 'moderate')}">
              ${ev.severity}
            </span>
          </td>
          <td>
            <span style="font-family:'JetBrains Mono'; color:${ev.confidence >= 0.75 ? '#2ECC71' : '#F1C40F'};">
              ${(ev.confidence * 100).toFixed(0)}%
            </span>
          </td>
          <td style="font-family:'JetBrains Mono'; color:#64748B;">${ev.occurred_at ? ev.occurred_at.slice(0, 16).replace('T', ' ') : ''}</td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748B;">No matching records found.</td></tr>`;
    } else if (ds === 'gti_history') {
      tableHead.innerHTML = `
        <tr>
          <th>Date</th>
          <th>Global Tension Index (0-100)</th>
          <th>7-Day Moving Average</th>
          <th>Tension Spike Status</th>
          <th>Risk Posture</th>
        </tr>
      `;
      tableBody.innerHTML = filtered.map(row => `
        <tr>
          <td style="font-family:'JetBrains Mono'; font-weight:600; color:#3DD6FF;">${row.date}</td>
          <td>
            <span style="font-family:'JetBrains Mono'; font-weight:700; color:#F5A623; font-size:14px;">${row.gti}</span>
          </td>
          <td style="font-family:'JetBrains Mono'; color:#F5F7FA;">${row.ma_7d || row.gti}</td>
          <td>
            <span class="sev-tag ${row.is_spike ? 'critical' : 'moderate'}">
              ${row.is_spike ? 'SPIKE DETECTED' : 'NOMINAL'}
            </span>
          </td>
          <td>
            <span class="kpi-badge ${row.gti >= 80 ? 'negative' : 'high'}">
              ${row.gti >= 80 ? 'CRITICAL' : 'HIGH'}
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      // Market Data / Commodities / Exchange Rates
      tableHead.innerHTML = `
        <tr>
          <th>Symbol</th>
          <th>Asset Name</th>
          <th>Price</th>
          <th>24h Change</th>
          <th>24h High</th>
          <th>24h Low</th>
        </tr>
      `;
      tableBody.innerHTML = filtered.map(m => `
        <tr>
          <td style="font-family:'JetBrains Mono'; font-weight:700; color:#3DD6FF;">${m.symbol}</td>
          <td style="font-weight:600; color:#F5F7FA;">${m.name}</td>
          <td style="font-family:'JetBrains Mono'; font-weight:700; color:#FFFFFF;">${m.price?.toLocaleString()}</td>
          <td>
            <span class="kpi-badge ${m.change_pct >= 0 ? 'positive' : 'negative'}">
              ${m.change_pct >= 0 ? '+' : ''}${m.change_pct}%
            </span>
          </td>
          <td style="font-family:'JetBrains Mono'; color:#94A3B8;">${m.high_24h}</td>
          <td style="font-family:'JetBrains Mono'; color:#94A3B8;">${m.low_24h}</td>
        </tr>
      `).join('');
    }
  }
};
