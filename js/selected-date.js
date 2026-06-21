/**
 * @fileoverview Holds the single date currently being viewed in the Daily Log tab.
 * This is UI view-state (not persisted app data, which lives in state.js), but it's
 * read and written by multiple modules (forms, rendering), so it lives in its own
 * tiny module rather than being a stray top-level variable in app.js.
 */

import { todayDateString } from './utils.js';

let selectedDate = todayDateString();

/**
 * @returns {string} The currently selected date (YYYY-MM-DD).
 */
export function getSelectedDate() {
  return selectedDate;
}

/**
 * @param {string} date - YYYY-MM-DD date to set as the active view date.
 */
export function setSelectedDate(date) {
  selectedDate = date;
}
