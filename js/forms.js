/**
 * @fileoverview Theme toggling, tab navigation, the Profile form, and the Daily Log form.
 */

import { store } from './state.js';
import { dom } from './dom.js';
import { announceToScreenReader } from './utils.js';
import { THEME_STORAGE_KEY } from './constants.js';
import { LOG_CATEGORIES } from './log-categories.js';
import { getSelectedDate, setSelectedDate } from './selected-date.js';
import { renderLogsAndHabits } from './render.js';

/**
 * Initializes Theme (Dark Mode by default, restores previous settings).
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  if (savedTheme === 'light') {
    dom.docHtml.classList.add('light-theme');
  } else {
    dom.docHtml.classList.remove('light-theme');
  }

  dom.themeToggle.addEventListener('click', () => {
    dom.docHtml.classList.toggle('light-theme');
    const activeTheme = dom.docHtml.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    announceToScreenReader(`Switched to ${activeTheme} theme`);
  });
}

/**
 * Sets up Tab panel navigation.
 */
export function setupTabs() {
  const tabs = [
    { button: dom.tabProfile, panel: dom.panelProfile },
    { button: dom.tabLog, panel: dom.panelLog }
  ];

  tabs.forEach((tab) => {
    tab.button.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.button.classList.remove('active');
        t.button.setAttribute('aria-selected', 'false');
        t.panel.classList.remove('active');
        t.panel.setAttribute('hidden', '');
      });

      tab.button.classList.add('active');
      tab.button.setAttribute('aria-selected', 'true');
      tab.panel.classList.add('active');
      tab.panel.removeAttribute('hidden');
    });
  });
}

/**
 * Injects input values into the profile survey based on current state.
 * @param {Object} profile - The persisted user profile.
 */
export function populateProfileForm(profile) {
  if (!profile) return;

  dom.profTransportType.value = profile.transport?.type || 'none';
  dom.profTransportDistance.value = profile.transport?.distance ?? 0;
  dom.profFlightsShort.value = profile.transport?.flightsShort ?? 0;
  dom.profFlightsLong.value = profile.transport?.flightsLong ?? 0;

  dom.profEnergyElec.value = profile.energy?.electricity ?? 0;
  dom.profEnergyGas.value = profile.energy?.gas ?? 0;

  const cleanRatio = Math.round((profile.energy?.cleanEnergyRatio || 0) * 100);
  dom.profCleanRatio.value = cleanRatio;
  dom.cleanRatioLabel.textContent = `${cleanRatio}% Clean`;

  dom.profDiet.value = profile.diet || 'balanced';
  dom.profWaste.value = profile.waste || 'average';
}

/**
 * Wires up the Profile form: live clean-energy label updates and submit handling.
 */
export function setupProfileForm() {
  dom.profCleanRatio.addEventListener('input', (e) => {
    dom.cleanRatioLabel.textContent = `${e.target.value}% Clean`;
  });

  dom.profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const cleanEnergyRatio = parseFloat(dom.profCleanRatio.value) / 100;
    const update = {
      transport: {
        type: dom.profTransportType.value,
        distance: parseFloat(dom.profTransportDistance.value) || 0,
        flightsShort: parseInt(dom.profFlightsShort.value, 10) || 0,
        flightsLong: parseInt(dom.profFlightsLong.value, 10) || 0
      },
      energy: {
        electricity: parseFloat(dom.profEnergyElec.value) || 0,
        gas: parseFloat(dom.profEnergyGas.value) || 0,
        cleanEnergyRatio
      },
      diet: dom.profDiet.value,
      waste: dom.profWaste.value
    };

    store.updateProfile(update);
    announceToScreenReader('Baseline profile successfully updated.');
  });
}

/**
 * Builds the <option> markup for a category's select field.
 * @param {Array<{value: string, label: string}>} options
 * @returns {string}
 */
function buildOptionsHtml(options) {
  return options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

/**
 * Renders the dynamic fields for whichever category is currently selected in the
 * Daily Log form. Driven entirely by LOG_CATEGORIES, so adding/changing a category
 * only requires editing log-categories.js.
 * @param {string} category - One of the keys in LOG_CATEGORIES.
 */
function renderDynamicLogFields(category) {
  const config = LOG_CATEGORIES[category];
  dom.dynamicLogFields.innerHTML = '';
  dom.btnSubmitLog.disabled = false;

  if (!config) return;

  let fieldsHtml = `
    <div class="form-group">
      <label for="${config.selectId}">${config.selectLabel}</label>
      <select id="${config.selectId}" required>${buildOptionsHtml(config.options)}</select>
    </div>
  `;

  if (config.valueField) {
    fieldsHtml += `
      <div class="form-group" id="dist-container">
        <label for="${config.valueField.id}" id="dist-label">${config.valueField.label}</label>
        <input type="number" id="${config.valueField.id}" min="0.1" step="any" required value="${config.valueField.defaultValue}">
      </div>
    `;
  }

  dom.dynamicLogFields.innerHTML = fieldsHtml;

  // If this category's value field can be conditionally hidden (currently only
  // transport, when a flight is chosen), wire up that behavior generically.
  if (config.valueField) {
    const subSelect = document.getElementById(config.selectId);
    subSelect.addEventListener('change', () => {
      const distContainer = document.getElementById('dist-container');
      const valInput = document.getElementById(config.valueField.id);
      if (config.valueField.isHiddenForSubtype(subSelect.value)) {
        distContainer.style.display = 'none';
        valInput.removeAttribute('required');
        valInput.value = config.valueField.hiddenValue;
      } else {
        distContainer.style.display = 'flex';
        valInput.setAttribute('required', 'true');
        valInput.value = config.valueField.defaultValue;
      }
    });
  }
}

/**
 * Reads the current Daily Log form fields back into { subtype, value }, using the
 * same LOG_CATEGORIES config that rendered them.
 * @param {string} category - One of the keys in LOG_CATEGORIES.
 * @returns {{subtype: string, value: number}}
 */
function extractLogFormValues(category) {
  const config = LOG_CATEGORIES[category];
  if (!config) return { subtype: '', value: 1 };

  const subtype = document.getElementById(config.selectId).value;

  if (!config.valueField) {
    return { subtype, value: 1 };
  }

  if (config.valueField.isHiddenForSubtype(subtype)) {
    return { subtype, value: config.valueField.hiddenValue };
  }

  const rawValue = document.getElementById(config.valueField.id).value;
  return { subtype, value: parseFloat(rawValue) || 0 };
}

/**
 * Wires up the Daily Log form: category switching, submission, and date selection.
 */
export function setupLogForm() {
  dom.logCategory.addEventListener('change', () => {
    renderDynamicLogFields(dom.logCategory.value);
  });

  dom.logForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const category = dom.logCategory.value;
    const date = dom.logDate.value;
    const note = dom.logNote.value;
    const { subtype, value } = extractLogFormValues(category);

    try {
      store.addLog(date, category, value, subtype, note);
      dom.logForm.reset();
      dom.dynamicLogFields.innerHTML = '';
      dom.btnSubmitLog.disabled = true;

      // Switch active view to date logged, if not matching
      if (date !== getSelectedDate()) {
        setSelectedDate(date);
        renderLogsAndHabits();
      }

      announceToScreenReader(`Successfully logged ${category} activity.`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  dom.logDate.addEventListener('change', (e) => {
    setSelectedDate(e.target.value);
    renderLogsAndHabits();
  });

  dom.logDate.value = getSelectedDate();
}
