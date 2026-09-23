/**
 * ARGOS — AI Intelligence Analyst & Live Context Inspector
 */

const AIAnalyst = {
  chatHistory: [],
  isThinking: false,

  init() {
    this.bindEvents();
    // Render initial welcoming briefing
    this.renderWelcomeBriefing();
  },

  bindEvents() {
    // Suggested prompt chips
    document.querySelectorAll('.prompt-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.currentTarget.getAttribute('data-prompt');
        if (prompt) {
          this.submitQuery(prompt);
        }
      });
    });

    // Chat submit button & input
    const sendBtn = document.getElementById('ai-send-btn');
    const inputEl = document.getElementById('ai-query-input');

    if (sendBtn && inputEl) {
      sendBtn.addEventListener('click', () => {
        const text = inputEl.value.trim();
        if (text) {
          this.submitQuery(text);
          inputEl.value = '';
        }
      });

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = inputEl.value.trim();
          if (text) {
            this.submitQuery(text);
            inputEl.value = '';
          }
        }
      });
    }

    // Sidebar Quick Chat input
    const quickChatBtn = document.getElementById('quickchat-send-btn');
    const quickChatInput = document.getElementById('quickchat-input');
    if (quickChatBtn && quickChatInput) {
      quickChatBtn.addEventListener('click', () => {
        const text = quickChatInput.value.trim();
        if (text) {
          // Switch to AI Analyst page and submit
          App.navigateTo('page-ai-analyst');
          this.submitQuery(text);
          quickChatInput.value = '';
        }
      });
    }
  },

  async submitQuery(promptText) {
    if (this.isThinking) return;
    this.isThinking = true;

    const scrollContainer = document.getElementById('ai-messages-scroll');
    if (!scrollContainer) return;

    // Render User Query Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'user-query-bubble';
    userBubble.style.cssText = `
      align-self: flex-end;
      background: #2F80ED;
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 18px 18px 4px 18px;
      font-size: 13.5px;
      font-weight: 500;
      max-width: 75%;
      box-shadow: 0 4px 14px rgba(47, 128, 237, 0.4);
    `;
    userBubble.textContent = promptText;
    scrollContainer.appendChild(userBubble);

    // Render Thinking Indicator
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'ai-thinking-indicator';
    thinkingBubble.style.cssText = `
      align-self: flex-start;
      background: rgba(17, 32, 51, 0.8);
      border: 1px solid rgba(61, 214, 255, 0.25);
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 12px;
      color: #3DD6FF;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    thinkingBubble.innerHTML = `<span class="ai-pulse"></span> Synthesizing live GTI indices, order books, and intelligence cables...`;
    scrollContainer.appendChild(thinkingBubble);
    scrollContainer.scrollTop = scrollContainer.scrollHeight;

    try {
      const response = await API.queryAIAnalyst(promptText);
      thinkingBubble.remove();
      this.renderBriefingCard(response, scrollContainer);
    } catch (err) {
      thinkingBubble.remove();
      const errBubble = document.createElement('div');
      errBubble.className = 'ai-error-bubble';
      errBubble.style.cssText = `color:#FF5A5F; font-size:12px; padding:10px;`;
      errBubble.textContent = `Analyst query failed: ${err.message}`;
      scrollContainer.appendChild(errBubble);
    } finally {
      this.isThinking = false;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  },

  renderBriefingCard(briefing, container) {
    const card = document.createElement('div');
    card.className = 'briefing-bubble';

    let sectionsHtml = '';
    if (briefing.sections) {
      sectionsHtml = briefing.sections.map(s => `
        <div class="briefing-section">
          <h5>${s.heading}</h5>
          <p>${s.content.replace(/\n/g, '<br>')}</p>
        </div>
      `).join('');
    }

    let metricsHtml = '';
    if (briefing.key_metrics) {
      metricsHtml = Object.entries(briefing.key_metrics).map(([k, v]) => `
        <div class="briefing-metric-pill">
          <span class="briefing-metric-label">${k}</span>
          <span class="briefing-metric-val">${v}</span>
        </div>
      `).join('');
    }

    card.innerHTML = `
      <div class="briefing-header">
        <span class="briefing-classification">🔒 ${briefing.classification || 'ARGOS // SITUATION BRIEF'}</span>
        <span class="briefing-time">${briefing.timestamp || 'LIVE'}</span>
      </div>
      <div class="briefing-exec-summary">
        ${briefing.executive_summary}
      </div>
      <div class="briefing-sections-body">
        ${sectionsHtml}
      </div>
      ${metricsHtml ? `<div class="briefing-metrics-row">${metricsHtml}</div>` : ''}
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button onclick="AIAnalyst.copyBriefing(this)" style="
          background: rgba(17, 32, 51, 0.8);
          border: 1px solid #23364D;
          color: #94A3B8;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
        ">📋 Copy Briefing</button>
      </div>
    `;

    container.appendChild(card);
  },

  renderWelcomeBriefing() {
    const scrollContainer = document.getElementById('ai-messages-scroll');
    if (!scrollContainer) return;

    const initial = {
      classification: "ARGOS // STRATEGIC SITUATION BRIEF",
      timestamp: new Date().toUTCString().replace("GMT", "UTC"),
      executive_summary: "Welcome to the ARGOS AI Intelligence Analyst. Our engine combines live conflict data feeds, real-time commodities/equity pricing, and proprietary mathematical Global Tension Index (GTI) modeling to formulate defense-grade assessments.",
      sections: [
        {
          heading: "Operational Capabilities",
          content: "• Quantify kinetic conflict transmission onto crude oil, gold, and regional currencies.\n• Deconstruct today's GTI score and inspect regional risk weight contributions.\n• Identify maritime shipping choke point vulnerabilities (Hormuz, Bab el-Mandeb, Malacca, Taiwan Strait)."
        },
        {
          heading: "Recommended Inquiries",
          content: "Select any suggested prompt from the left panel or type a custom geopolitical inquiry in the terminal input below."
        }
      ]
    };
    this.renderBriefingCard(initial, scrollContainer);
  },

  copyBriefing(btn) {
    const card = btn.closest('.briefing-bubble');
    if (!card) return;
    const text = card.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  },

  updateLiveContext(dashboardData) {
    const panel = document.getElementById('live-context-panel-content');
    if (!panel || !dashboardData) return;

    const gti = dashboardData.gti_panel || {};
    const kpis = dashboardData.kpis || {};
    const top = (gti.top_contributors || []).slice(0, 3);

    panel.innerHTML = `
      <div class="glass-card" style="padding:14px; margin-bottom:12px;">
        <div style="font-size:11px; font-family:'JetBrains Mono'; color:#64748B; text-transform:uppercase;">Current Tension Index</div>
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
          <span style="font-family:'Outfit'; font-size:26px; font-weight:800; color:#F5A623;">${gti.score || 72.0}</span>
          <span class="kpi-badge high">${kpis.gti?.risk_level || 'HIGH'}</span>
        </div>
      </div>

      <div class="glass-card" style="padding:14px; margin-bottom:12px;">
        <div style="font-size:11px; font-family:'JetBrains Mono'; color:#64748B; text-transform:uppercase; margin-bottom:8px;">Active Market Indicators</div>
        <div style="display:flex; flex-direction:column; gap:6px; font-family:'JetBrains Mono'; font-size:12px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#94A3B8;">WTI Crude:</span>
            <span style="color:#F5F7FA; font-weight:600;">$${kpis.commodities?.crude?.price || '76.85'} (${kpis.commodities?.crude?.change_pct || '+2.8'}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#94A3B8;">Gold:</span>
            <span style="color:#F5F7FA; font-weight:600;">$${kpis.commodities?.gold?.price || '2,684'} (${kpis.commodities?.gold?.change_pct || '+1.25'}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#94A3B8;">S&P 500:</span>
            <span style="color:#F5F7FA; font-weight:600;">${kpis.sp500?.price || '5,780'} (${kpis.sp500?.change_pct || '-0.32'}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#94A3B8;">USD/INR:</span>
            <span style="color:#F5F7FA; font-weight:600;">${kpis.currency?.price || '83.95'}</span>
          </div>
        </div>
      </div>

      <div class="glass-card" style="padding:14px;">
        <div style="font-size:11px; font-family:'JetBrains Mono'; color:#64748B; text-transform:uppercase; margin-bottom:8px;">Leading Tension Contributors</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${top.map(item => `
            <div style="border-left:2px solid #F5A623; padding-left:8px;">
              <div style="font-size:12px; font-weight:600; color:#F5F7FA; line-height:1.3;">${item.title}</div>
              <div style="font-size:10.5px; font-family:'JetBrains Mono'; color:#3DD6FF;">${item.region} • ${item.pct_of_total}% influence</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
