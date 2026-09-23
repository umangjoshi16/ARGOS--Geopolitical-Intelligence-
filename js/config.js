/**
 * ARGOS — Risk Weight Configuration & GTI Methodology Console
 */

const RiskConfig = {
  currentConfig: null,
  simulatedGTI: null,

  async init() {
    try {
      const data = await API.getGTIConfig();
      this.currentConfig = data.config;
      this.renderControls(data);
      this.bindEvents();
    } catch (err) {
      console.error("Failed to load risk config:", err);
    }
  },

  renderControls(data) {
    const cfg = data.config || {};
    const regMults = cfg.regional_multipliers || {};
    const kVal = cfg.k_value || 2850;
    const halfLife = cfg.half_life_hours || 72;

    // 1. Regional Multipliers Sliders
    const regContainer = document.getElementById('regional-sliders-container');
    if (regContainer) {
      regContainer.innerHTML = Object.entries(regMults).map(([reg, val]) => `
        <div class="slider-control-row">
          <div class="slider-info">
            <span class="slider-name">${reg}</span>
            <span class="slider-desc">Geopolitical & oil route multiplier</span>
          </div>
          <div class="slider-track-wrap">
            <input type="range" class="custom-range-slider reg-slider" data-region="${reg}" min="0.5" max="2.5" step="0.05" value="${val}">
            <span class="slider-val-readout" id="val-reg-${reg.replace(/\s+/g, '-')}">${val.toFixed(2)}x</span>
          </div>
        </div>
      `).join('');
    }

    // 2. Calibration & Half Life Sliders
    const kInput = document.getElementById('slider-k-value');
    const kReadout = document.getElementById('val-k-value');
    if (kInput && kReadout) {
      kInput.value = kVal;
      kReadout.textContent = kVal;
    }

    const hlInput = document.getElementById('slider-half-life');
    const hlReadout = document.getElementById('val-half-life');
    if (hlInput && hlReadout) {
      hlInput.value = halfLife;
      hlReadout.textContent = `${halfLife} hrs`;
    }

    // 3. Computed Breakdown Card
    this.updateComputedCard(data);
  },

  bindEvents() {
    // Sliders input listeners for real-time live preview simulation
    document.querySelectorAll('.reg-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const reg = e.target.getAttribute('data-region');
        const val = parseFloat(e.target.value);
        const readout = document.getElementById(`val-reg-${reg.replace(/\s+/g, '-')}`);
        if (readout) readout.textContent = `${val.toFixed(2)}x`;
        if (this.currentConfig) {
          this.currentConfig.regional_multipliers[reg] = val;
        }
        this.simulateGTIPreview();
      });
    });

    const kInput = document.getElementById('slider-k-value');
    if (kInput) {
      kInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('val-k-value').textContent = val;
        if (this.currentConfig) this.currentConfig.k_value = val;
        this.simulateGTIPreview();
      });
    }

    const hlInput = document.getElementById('slider-half-life');
    if (hlInput) {
      hlInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('val-half-life').textContent = `${val} hrs`;
        if (this.currentConfig) this.currentConfig.half_life_hours = val;
        this.simulateGTIPreview();
      });
    }

    // Apply button
    const applyBtn = document.getElementById('btn-apply-weights');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        applyBtn.textContent = 'Recalculating Global Index...';
        try {
          const res = await API.updateGTIConfig(this.currentConfig);
          applyBtn.textContent = '✓ Weights Applied';
          setTimeout(() => { applyBtn.textContent = 'Apply Risk Weights & Recalculate'; }, 2000);
          
          // Re-render dashboard
          App.refreshAllData();
        } catch (err) {
          alert(`Failed to apply weights: ${err.message}`);
          applyBtn.textContent = 'Apply Risk Weights & Recalculate';
        }
      });
    }
  },

  simulateGTIPreview() {
    if (!this.currentConfig) return;
    const k = this.currentConfig.k_value || 2850;
    const raw = 3630.0; // Baseline raw impact
    // Saturation formula: 100 * (1 - e^(-raw / k))
    const simulated = 100.0 * (1.0 - Math.exp(-raw / k));
    const previewEl = document.getElementById('live-gti-preview-val');
    if (previewEl) {
      previewEl.textContent = simulated.toFixed(1);
    }
  },

  updateComputedCard(data) {
    const score = data.current_gti || 72.0;
    const raw = data.raw_score || 3631.0;
    const k = data.k_value || 2850.0;
    const top = data.top_contributors || [];

    const card = document.getElementById('computed-gti-card-content');
    if (!card) return;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">
        <span style="font-family:'Outfit'; font-size:38px; font-weight:800; color:#F5A623;">${score}</span>
        <span class="kpi-badge high">CALIBRATED ACTIVE</span>
      </div>
      <div style="font-family:'JetBrains Mono'; font-size:12px; color:#94A3B8; margin-bottom:16px;">
        <div>Raw EIS Aggregate: <b style="color:#F5F7FA;">${raw}</b></div>
        <div>Calibration Constant (k): <b style="color:#3DD6FF;">${k}</b></div>
        <div>Mathematical Formula: <b style="color:#2ECC71;">100 × (1 − e^(−raw / k))</b></div>
      </div>
      <div style="font-size:11px; text-transform:uppercase; font-family:'JetBrains Mono'; color:#64748B; margin-bottom:8px;">Top 5 Contributing Crisis Vectors</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${top.map(t => `
          <div style="background:rgba(6,17,31,0.8); border:1px solid #23364D; border-radius:8px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:11.5px; font-weight:600; color:#F5F7FA; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${t.title}
            </div>
            <span style="font-family:'JetBrains Mono'; font-size:11px; color:#F5A623; font-weight:700;">
              ${t.pct_of_total}%
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }
};
