/**
 * @fileoverview Small shared utilities used across multiple UI modules.
 */

import { dom } from './dom.js';

/**
 * Sanitizes text to prevent XSS by routing it through the DOM's text node escaping.
 * @param {string} text - Raw input text
 * @returns {string} Sanitized HTML-safe string
 */
export function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Announces a message to screen readers via the page's ARIA live region.
 * @param {string} message - Text to announce
 */
export function announceToScreenReader(message) {
  if (dom.srAnnouncer) {
    dom.srAnnouncer.textContent = message;
  }
}

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 * @returns {string}
 */
export function todayDateString() {
  return new Date().toISOString().split('T')[0];
}
