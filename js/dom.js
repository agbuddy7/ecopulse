/**
 * @fileoverview Cached DOM element references.
 * Single source of truth for every element the app reads from or writes to,
 * so no other module needs to call document.getElementById directly.
 */

export const dom = {
  // Global
  docHtml: document.documentElement,
  srAnnouncer: document.getElementById('sr-announcer'),
  streakCount: document.getElementById('streak-count'),
  themeToggle: document.getElementById('theme-toggle'),

  // Navigation Tabs
  tabProfile: document.getElementById('tab-profile'),
  tabLog: document.getElementById('tab-log'),
  panelProfile: document.getElementById('panel-profile'),
  panelLog: document.getElementById('panel-log'),

  // Profile Form
  profileForm: document.getElementById('profile-form'),
  profCleanRatio: document.getElementById('prof-energy-clean'),
  cleanRatioLabel: document.getElementById('clean-ratio-label'),
  profTransportType: document.getElementById('prof-transport-type'),
  profTransportDistance: document.getElementById('prof-transport-distance'),
  profFlightsShort: document.getElementById('prof-flights-short'),
  profFlightsLong: document.getElementById('prof-flights-long'),
  profEnergyElec: document.getElementById('prof-energy-elec'),
  profEnergyGas: document.getElementById('prof-energy-gas'),
  profDiet: document.getElementById('prof-diet'),
  profWaste: document.getElementById('prof-waste'),

  // Daily Log Form
  logForm: document.getElementById('activity-log-form'),
  logDate: document.getElementById('log-date'),
  logCategory: document.getElementById('log-category'),
  logNote: document.getElementById('log-note'),
  dynamicLogFields: document.getElementById('dynamic-log-fields'),
  btnSubmitLog: document.getElementById('btn-submit-log'),

  // Metrics & Dashboard
  metricTodayTotal: document.getElementById('metric-today-total'),
  comparisonBadge: document.getElementById('comparison-badge'),
  comparisonText: document.getElementById('comparison-text'),
  gaugeProgress: document.getElementById('gauge-progress'),
  gaugeLabel: document.getElementById('gauge-label'),

  miniValTransport: document.getElementById('mini-val-transport'),
  miniValEnergy: document.getElementById('mini-val-energy'),
  miniValDiet: document.getElementById('mini-val-diet'),
  miniValWaste: document.getElementById('mini-val-waste'),

  // Chart containers
  categoryChartContainer: document.getElementById('category-chart-container'),
  historyChartContainer: document.getElementById('history-chart-container'),

  // Habits & Insights
  habitsContainer: document.getElementById('habits-checklist-container'),
  habitsDateLabel: document.getElementById('habit-date-label'),
  insightsContainer: document.getElementById('insights-list-container'),

  // Logs Table
  logsDateLabel: document.getElementById('logs-date-label'),
  logsTableBody: document.getElementById('logs-table-body'),
  btnExportCsv: document.getElementById('btn-export-csv'),

  // Assistant Panel
  chatMessages: document.getElementById('chat-messages'),
  chatForm: document.getElementById('chat-input-form'),
  chatUserMessage: document.getElementById('chat-user-message'),
  btnClearChat: document.getElementById('btn-clear-chat'),

  // Footer
  btnResetData: document.getElementById('btn-reset-data')
};
