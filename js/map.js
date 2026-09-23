/**
 * ARGOS — Geospatial Intelligence Map Module (Leaflet.js + CartoDB Dark Matter)
 */

const ArgosMap = {
  dashboardMap: null,
  fullConflictMap: null,
  dashboardMarkersLayer: null,
  fullMarkersLayer: null,
  activeFilter: 'all',

  // Strategic Chokepoints
  chokepoints: [
    { name: "Strait of Hormuz", lat: 26.5667, lng: 56.2500, type: "Crude Oil (21M bpd)", status: "DEFCON AMBER" },
    { name: "Bab el-Mandeb", lat: 12.5833, lng: 43.3333, type: "Maritime Container / Suez", status: "ACTIVE COMBAT ZONE" },
    { name: "Suez Canal", lat: 30.7050, lng: 32.3440, type: "Europe-Asia Trade Route", status: "ELEVATED DELAYS" },
    { name: "Malacca Strait", lat: 1.4300, lng: 102.8900, type: "Energy & Electronics Flow", status: "NORMAL DEFENSE" },
    { name: "Taiwan Strait", lat: 24.0000, lng: 119.5000, type: "Semiconductor Maritime Corridor", status: "LIVE EXERCISE QUARANTINE" },
    { name: "Panama Canal", lat: 8.9824, lng: -79.5199, type: "Bulk Agriculture & LNG", status: "DRAUGHT RESTRICTIONS" }
  ],

  initDashboardMap(elementId, events) {
    if (this.dashboardMap) {
      this.dashboardMap.remove();
    }

    const container = document.getElementById(elementId);
    if (!container) return;

    this.dashboardMap = L.map(elementId, {
      center: [28.0, 42.0],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 9,
      zoomControl: true,
      attributionControl: false
    });

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.dashboardMap);

    this.dashboardMarkersLayer = L.layerGroup().addTo(this.dashboardMap);
    this.renderEvents(this.dashboardMarkersLayer, events);
    this.renderChokepoints(this.dashboardMarkersLayer);
  },

  initFullConflictMap(elementId, events) {
    if (this.fullConflictMap) {
      this.fullConflictMap.remove();
    }

    const container = document.getElementById(elementId);
    if (!container) return;

    this.fullConflictMap = L.map(elementId, {
      center: [25.0, 48.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.fullConflictMap);

    this.fullMarkersLayer = L.layerGroup().addTo(this.fullConflictMap);
    this.renderEvents(this.fullMarkersLayer, events);
    this.renderChokepoints(this.fullMarkersLayer);
  },

  renderEvents(layerGroup, events) {
    if (!layerGroup || !events) return;
    layerGroup.clearLayers();

    events.forEach(ev => {
      if (!ev.latitude || !ev.longitude) return;

      const sev = ev.severity || 50;
      const conf = ev.confidence !== undefined ? ev.confidence : 0.8;
      const isCorroborated = conf >= 0.75;

      // Color based on severity: Red (Critical), Amber (High), Yellow (Moderate)
      let color = '#F1C40F';
      let sevLabel = 'MODERATE';
      if (sev >= 80) {
        color = '#FF5A5F';
        sevLabel = 'CRITICAL';
      } else if (sev >= 65) {
        color = '#F5A623';
        sevLabel = 'HIGH';
      }

      const radius = Math.max(7, Math.min(18, sev * 0.18));

      // Custom pulsing SVG icon
      const customIcon = L.divIcon({
        className: 'argos-map-marker',
        html: `
          <div style="position:relative; width:${radius * 2}px; height:${radius * 2}px;">
            <div style="
              position:absolute;
              width:100%;
              height:100%;
              border-radius:50%;
              background:${color};
              opacity:0.25;
              animation: marker-pulse 2.2s infinite;
            "></div>
            <div style="
              position:absolute;
              top:25%;
              left:25%;
              width:50%;
              height:50%;
              border-radius:50%;
              background:${isCorroborated ? color : 'transparent'};
              border: 2px solid ${color};
              box-shadow: 0 0 10px ${color};
            "></div>
          </div>
        `,
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius]
      });

      const marker = L.marker([ev.latitude, ev.longitude], { icon: customIcon });

      // Rich Intelligence Popup
      const sentimentText = ev.sentiment < -0.6 ? "Strongly Negative" : (ev.sentiment < 0 ? "Bearish / Negative" : "Neutral");
      const popupHtml = `
        <div style="
          background:#0B1728;
          border:1px solid #23364D;
          border-radius:12px;
          padding:14px;
          color:#F5F7FA;
          font-family:Inter, sans-serif;
          min-width:240px;
          max-width:300px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        ">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-family:'JetBrains Mono', monospace; font-size:10px; font-weight:700; color:${color}; border:1px solid ${color}; padding:2px 6px; border-radius:4px;">
              ${sevLabel} (${sev}/100)
            </span>
            <span style="font-family:'JetBrains Mono', monospace; font-size:10.5px; color:#94A3B8;">
              ${ev.region || 'Global'}
            </span>
          </div>
          <h4 style="font-size:13px; font-weight:700; color:#F5F7FA; margin-bottom:6px; line-height:1.35;">
            ${ev.title}
          </h4>
          <p style="font-size:11.5px; color:#94A3B8; margin-bottom:10px; line-height:1.4;">
            ${ev.description ? ev.description.slice(0, 160) + '...' : ''}
          </p>
          <div style="border-top:1px solid rgba(35,54,77,0.8); padding-top:8px; font-size:10.5px; font-family:'JetBrains Mono', monospace; display:flex; flex-direction:column; gap:3px;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">Source:</span>
              <span style="color:#3DD6FF;">${ev.source}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">Sentiment:</span>
              <span style="color:#F5A623;">${sentimentText}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">Confidence:</span>
              <span style="color:${isCorroborated ? '#2ECC71' : '#F1C40F'};">
                ${isCorroborated ? '● Corroborated' : '○ Unconfirmed'}
              </span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'argos-leaflet-popup',
        closeButton: true
      });

      layerGroup.addLayer(marker);
    });
  },

  renderChokepoints(layerGroup) {
    this.chokepoints.forEach(cp => {
      const chokepointIcon = L.divIcon({
        className: 'chokepoint-marker',
        html: `
          <div style="
            background: rgba(61, 214, 255, 0.2);
            border: 1.5px dashed #3DD6FF;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3DD6FF;
            font-size: 11px;
            box-shadow: 0 0 10px rgba(61, 214, 255, 0.4);
          ">⚓</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([cp.lat, cp.lng], { icon: chokepointIcon });
      marker.bindPopup(`
        <div style="background:#0B1728; border:1px solid #3DD6FF; border-radius:10px; padding:12px; color:#F5F7FA; font-family:Inter, sans-serif; font-size:12px;">
          <div style="color:#3DD6FF; font-family:'JetBrains Mono', monospace; font-size:10px; font-weight:700;">STRATEGIC MARITIME CHOKEPOINT</div>
          <h4 style="font-size:13px; font-weight:700; margin:4px 0;">${cp.name}</h4>
          <div style="color:#94A3B8; margin-bottom:4px;">Flow: ${cp.type}</div>
          <div style="color:#FF5A5F; font-family:'JetBrains Mono', monospace; font-size:10.5px; font-weight:600;">Status: ${cp.status}</div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });
  },

  filterByRegion(region, events) {
    this.activeFilter = region;
    const filtered = (region === 'all') 
      ? events 
      : events.filter(e => e.region === region);
    
    if (this.fullMarkersLayer) {
      this.renderEvents(this.fullMarkersLayer, filtered);
      this.renderChokepoints(this.fullMarkersLayer);
    }
  }
};
