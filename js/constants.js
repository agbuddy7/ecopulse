/**
 * @fileoverview Centralized application constants.
 * Replaces magic numbers/strings that were previously inlined throughout app.js.
 */

// LocalStorage key for the persisted theme preference.
export const THEME_STORAGE_KEY = 'ecopulse_theme';

// Global per-capita daily average emissions (kg CO2e/day), used for the comparison badge.
export const DAILY_GLOBAL_AVG_KG = 12.9;

// Upper bound of the circular gauge's scale (kg CO2e/day).
export const GAUGE_MAX_DAILY_KG = 30;

// Stroke-dasharray length of the gauge SVG circle (must match the circle's circumference in index.html).
export const GAUGE_CIRCLE_CIRCUMFERENCE = 251.2;

// Gauge fill percentage thresholds that switch the indicator color.
export const GAUGE_DANGER_THRESHOLD_PCT = 75;
export const GAUGE_WARNING_THRESHOLD_PCT = 45;

// Artificial delay (ms) before EcoBot replies, so the chat feels conversational rather than instant.
export const CHAT_REPLY_DELAY_MS = 350;

// Number of days shown in the "last N days" history chart.
export const HISTORY_CHART_DAYS = 7;
