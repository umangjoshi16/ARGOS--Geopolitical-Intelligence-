/**
 * ARGOS — API Client & State Manager
 * Handles REST calls, background sync triggers, and polling.
 */

const API = {
  baseUrl: window.location.origin,

  async getStatus() {
    const res = await fetch(`${this.baseUrl}/api/status`);
    if (!res.ok) throw new Error("Failed to fetch system status");
    return await res.json();
  },

  async getDashboard(symbol = "CL=F", days = 30) {
    const res = await fetch(`${this.baseUrl}/api/dashboard?symbol=${encodeURIComponent(symbol)}&days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  },

  async getEvents(region = "all", minSeverity = 0) {
    let url = `${this.baseUrl}/api/events?limit=100&min_severity=${minSeverity}`;
    if (region && region !== "all") {
      url += `&region=${encodeURIComponent(region)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch events");
    return await res.json();
  },

  async getMarkets(symbol = "CL=F", days = 30) {
    const res = await fetch(`${this.baseUrl}/api/markets?symbol=${encodeURIComponent(symbol)}&days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch market data");
    return await res.json();
  },

  async getGTIHistory() {
    const res = await fetch(`${this.baseUrl}/api/gti/history`);
    if (!res.ok) throw new Error("Failed to fetch GTI history");
    return await res.json();
  },

  async getGTIConfig() {
    const res = await fetch(`${this.baseUrl}/api/gti/config`);
    if (!res.ok) throw new Error("Failed to fetch GTI config");
    return await res.json();
  },

  async updateGTIConfig(configUpdate) {
    const res = await fetch(`${this.baseUrl}/api/gti/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configUpdate)
    });
    if (!res.ok) throw new Error("Failed to update GTI config");
    return await res.json();
  },

  async queryAIAnalyst(prompt) {
    const res = await fetch(`${this.baseUrl}/api/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error("Failed to query AI analyst");
    return await res.json();
  },

  async triggerRefresh() {
    const res = await fetch(`${this.baseUrl}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  },

  getExportUrl(dataset = "events") {
    return `${this.baseUrl}/api/export?dataset=${encodeURIComponent(dataset)}`;
  }
};
