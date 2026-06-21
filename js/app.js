/**
 * @fileoverview EcoPulse Application Entry Point.
 * Wires the store, forms, rendering, and chat modules together and performs
 * one-time setup (theme, tabs, CSV export, data reset).
 */

import { store } from './state.js';
import { dom } from './dom.js';
import { announceToScreenReader } from './utils.js';
import { downloadLogsAsCsv } from './csv-export.js';
import { getSelectedDate, setSelectedDate } from './selected-date.js';
import { initTheme, setupTabs, populateProfileForm, setupProfileForm, setupLogForm } from './forms.js';
import { renderLogsAndHabits } from './render.js';
import { welcomeEcoBot, setupChat } from './chat.js';

/**
 * Exports logged actions to a CSV file.
 */
function setupCsvExport() {
  dom.btnExportCsv.addEventListener('click', () => {
    downloadLogsAsCsv(store.state.logs);
    announceToScreenReader('Carbon audit report downloaded as CSV.');
  });
}

/**
 * Wires up the "reset all data" footer action.
 */
function setupResetData() {
  dom.btnResetData.addEventListener('click', () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete all logs, habits, and profile baseline data. Are you sure?'
    );
    if (!confirmed) return;

    store.resetState();
    setSelectedDate(new Date().toISOString().split('T')[0]);
    dom.logDate.value = getSelectedDate();
    populateProfileForm(store.state.profile);

    dom.chatMessages.innerHTML = '';
    welcomeEcoBot();

    announceToScreenReader('Application data reset successfully.');
  });
}

/**
 * Bootstraps the application.
 */
function init() {
  initTheme();
  setupTabs();
  setupProfileForm();
  setupLogForm();
  setupChat();
  setupCsvExport();
  setupResetData();

  // Reactivity pipeline: bind state changes to automatic UI re-renders.
  store.subscribe((state) => {
    dom.streakCount.textContent = state.streak;
    populateProfileForm(state.profile);
    renderLogsAndHabits();
  });

  welcomeEcoBot();
}

init();
