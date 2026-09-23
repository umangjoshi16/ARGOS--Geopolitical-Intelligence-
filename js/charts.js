/**
 * ARGOS — Bloomberg & Palantir Chart Styling with Plotly.js
 */

const Charts = {
  theme: {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'JetBrains Mono, Inter, monospace',
      size: 11,
      color: '#94A3B8'
    },
    gridcolor: 'rgba(35, 54, 77, 0.45)',
    zerolinecolor: 'rgba(35, 54, 77, 0.7)'
  },

  /**
   * 1. Flagship GTI Trend Panel Chart
   * Displays GTI Score (amber), 7-day MA (cyan), Tension Spike markers (red),
   * and Critical Threshold Line at 80.
   */
  renderGTITrendChart(elementId, historyData) {
    if (!historyData || historyData.length === 0) return;

    const dates = historyData.map(d => d.date);
    const gtiVals = historyData.map(d => d.gti);
    const maVals = historyData.map(d => d.ma_7d || d.gti);

    // Filter spike markers
    const spikeDates = [];
    const spikeVals = [];
    const spikeTexts = [];
    historyData.forEach(d => {
      if (d.is_spike) {
        spikeDates.push(d.date);
        spikeVals.push(d.gti);
        spikeTexts.push(`⚠️ SPIKE: ${d.gti} pts`);
      }
    });

    const traces = [
      // 1. Raw GTI Score Line (Amber)
      {
        x: dates,
        y: gtiVals,
        name: 'GTI Daily Score',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: '#F5A623',
          width: 2.5,
          shape: 'spline',
          smoothing: 1.1
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(245, 166, 35, 0.08)',
        hovertemplate: '<b>%{x}</b><br>GTI: <b style="color:#F5A623">%{y:.1f}</b><extra></extra>'
      },
      // 2. 7-Day Moving Average Line (Cyan)
      {
        x: dates,
        y: maVals,
        name: '7-Day Moving Avg',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: '#3DD6FF',
          width: 2,
          dash: 'dot'
        },
        hovertemplate: '7D MA: <b style="color:#3DD6FF">%{y:.1f}</b><extra></extra>'
      },
      // 3. Tension Spike Markers (Red)
      {
        x: spikeDates,
        y: spikeVals,
        name: 'Tension Spikes',
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: '#FF5A5F',
          size: 9,
          symbol: 'diamond',
          line: { color: '#FFFFFF', width: 1.5 }
        },
        text: spikeTexts,
        hovertemplate: '<b>%{text}</b><extra></extra>'
      }
    ];

    const layout = {
      ...this.theme,
      margin: { l: 40, r: 20, t: 25, b: 35 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.15,
        font: { size: 10, color: '#94A3B8' }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0B1728',
        bordercolor: '#23364D',
        font: { family: 'JetBrains Mono', color: '#F5F7FA' }
      },
      xaxis: {
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        tickfont: { color: '#64748B', size: 10 },
        tickformat: '%b %d',
        dtick: 86400000 * 5
      },
      yaxis: {
        range: [30, 100],
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        zerolinecolor: this.theme.zerolinecolor,
        tickfont: { color: '#64748B', size: 10 },
        ticksuffix: ' '
      },
      shapes: [
        // Critical Threshold Line (80)
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: 80,
          y1: 80,
          line: {
            color: '#FF5A5F',
            width: 1.5,
            dash: 'dash'
          }
        }
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.98,
          y: 80,
          xanchor: 'right',
          yanchor: 'bottom',
          text: 'CRITICAL ESCALATION THRESHOLD (80)',
          font: { color: '#FF5A5F', size: 9, family: 'JetBrains Mono' },
          showarrow: false
        }
      ]
    };

    const config = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.newPlot(elementId, traces, layout, config);
  },

  /**
   * 2. Global Tension vs Markets Dual-Axis Chart
   */
  renderDualAxisTensionMarketsChart(elementId, correlationData) {
    if (!correlationData || !correlationData.dates) return;

    const dates = correlationData.dates;
    const gtiPoints = correlationData.gti_points;
    const marketPoints = correlationData.market_points;
    const assetName = correlationData.asset_name || "Market Asset";

    const traces = [
      {
        x: dates,
        y: gtiPoints,
        name: 'Global Tension (GTI)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#F5A623', width: 2.5 },
        yaxis: 'y1',
        hovertemplate: 'GTI: <b>%{y:.1f}</b><extra></extra>'
      },
      {
        x: dates,
        y: marketPoints,
        name: assetName,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3DD6FF', width: 2.2 },
        yaxis: 'y2',
        hovertemplate: `${assetName}: <b>%{y:,.2f}</b><extra></extra>`
      }
    ];

    const layout = {
      ...this.theme,
      margin: { l: 45, r: 55, t: 25, b: 35 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.15,
        font: { size: 10, color: '#94A3B8' }
      },
      hovermode: 'x unified',
      xaxis: {
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        tickfont: { color: '#64748B', size: 10 },
        tickformat: '%b %d'
      },
      yaxis: {
        title: { text: 'GTI Score', font: { size: 10, color: '#F5A623' } },
        range: [40, 100],
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        tickfont: { color: '#F5A623', size: 10 }
      },
      yaxis2: {
        title: { text: assetName, font: { size: 10, color: '#3DD6FF' } },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        tickfont: { color: '#3DD6FF', size: 10 }
      }
    };

    const config = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.newPlot(elementId, traces, layout, config);
  },

  /**
   * 3. Normalized Performance Comparison Chart (Market Intelligence Page)
   * Base 100 index comparison across S&P 500, NIFTY 50, Gold, WTI Crude, USD/INR
   */
  renderNormalizedPerformance(elementId, marketsData) {
    if (!marketsData) return;

    const traces = [];
    const colors = {
      "^GSPC": "#2F80ED",
      "^NSEI": "#9B51E0",
      "GC=F": "#F1C40F",
      "CL=F": "#FF5A5F",
      "INR=X": "#2ECC71"
    };

    for (const [sym, data] of Object.entries(marketsData)) {
      const series = data.series || [];
      if (series.length < 2) continue;

      const basePrice = series[0].price || 1.0;
      const dates = series.map(s => s.date);
      const normalizedVals = series.map(s => roundVal((s.price / basePrice - 1.0) * 100.0, 2));

      traces.push({
        x: dates,
        y: normalizedVals,
        name: data.name || sym,
        type: 'scatter',
        mode: 'lines',
        line: { color: colors[sym] || '#3DD6FF', width: 2 },
        hovertemplate: `${data.name}: <b>%{y:+0.2f}%</b><extra></extra>`
      });
    }

    const layout = {
      ...this.theme,
      margin: { l: 45, r: 20, t: 25, b: 35 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.15,
        font: { size: 10, color: '#94A3B8' }
      },
      hovermode: 'x unified',
      xaxis: {
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        tickfont: { color: '#64748B', size: 10 }
      },
      yaxis: {
        showgrid: true,
        gridcolor: this.theme.gridcolor,
        ticksuffix: '%',
        tickfont: { color: '#64748B', size: 10 }
      }
    };

    Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });
  },

  /**
   * 4. Pearson Correlation Matrix Heatmap
   */
  renderCorrelationHeatmap(elementId, matrixData) {
    if (!matrixData || !matrixData.z) return;

    const traces = [
      {
        z: matrixData.z,
        x: matrixData.labels,
        y: matrixData.labels,
        type: 'heatmap',
        colorscale: [
          [0.0, '#FF5A5F'],
          [0.5, '#0B1728'],
          [1.0, '#2ECC71']
        ],
        zmin: -1.0,
        zmax: 1.0,
        showscale: true,
        colorbar: {
          tickfont: { color: '#94A3B8', size: 9 },
          len: 0.8,
          thickness: 12
        },
        hovertemplate: '%{y} vs %{x}: <b>r = %{z:.2f}</b><extra></extra>'
      }
    ];

    const layout = {
      ...this.theme,
      margin: { l: 110, r: 20, t: 20, b: 80 },
      xaxis: {
        tickfont: { color: '#F5F7FA', size: 10 },
        tickangle: -25
      },
      yaxis: {
        tickfont: { color: '#F5F7FA', size: 10 },
        autorange: 'reversed'
      }
    };

    Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });
  },

  /**
   * 5. Mini Canvas Sparkline for KPI Cards
   */
  drawSparkline(canvasId, values, isPositive = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    if (!values || values.length < 2) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    const points = values.map((v, i) => ({
      x: (i / (values.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 8) - 4
    }));

    const strokeColor = isPositive ? '#2ECC71' : '#FF5A5F';
    const fillColor = isPositive ? 'rgba(46, 204, 113, 0.12)' : 'rgba(255, 90, 95, 0.12)';

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End point dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  },

  /**
   * 6. SVG Circular Gauge update
   */
  updateCircularGauge(circleId, score, max = 100) {
    const circle = document.getElementById(circleId);
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;

    const clampedScore = Math.max(0, Math.min(max, score));
    const offset = circumference - (clampedScore / max) * circumference;
    circle.style.strokeDashoffset = offset;
  }
};

function roundVal(num, dec = 1) {
  const factor = Math.pow(10, dec);
  return Math.round(num * factor) / factor;
}
