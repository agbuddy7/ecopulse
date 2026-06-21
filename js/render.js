/**
 * @fileoverview All rendering for the Daily Log tab: dashboard metrics, the circular
 * gauge, the habits checklist, the logs table, personalized insights, and the charts.
 *
 * Previously this was a single ~140-line function doing all six jobs at once.
 * It's now one small function per concern, plus renderLogsAndHabits() as a thin
 * orchestrator that calls them in order — each piece can be read, tested, or
 * changed independently.
 */

import { store } from './state.js';
import { dom } from './dom.js';
import { calculateProfileFootprint, generatePersonalizedTips } from './calculator.js';
import { renderCategoryChart, renderHistoryChart } from './charts.js';
import { sanitizeText, announceToScreenReader } from './utils.js';
import { getSelectedDate } from './selected-date.js';
import {
  DAILY_GLOBAL_AVG_KG,
  GAUGE_MAX_DAILY_KG,
  GAUGE_CIRCLE_CIRCUMFERENCE,
  GAUGE_DANGER_THRESHOLD_PCT,
  GAUGE_WARNING_THRESHOLD_PCT,
  HISTORY_CHART_DAYS
} from './constants.js';

/**
 * Updates the "today's total" metric and the comparison-to-global-average badge.
 * @param {Object} stats - Output of store.getDailyFootprint() for the selected date.
 */
function renderDashboardMetrics(stats) {
  dom.metricTodayTotal.textContent = stats.total.toFixed(1);

  const diffPct = Math.round(((stats.total - DAILY_GLOBAL_AVG_KG) / DAILY_GLOBAL_AVG_KG) * 100);

  if (stats.total === 0) {
    dom.comparisonBadge.className = 'badge';
    dom.comparisonBadge.textContent = 'Zero Emissions';
    dom.comparisonText.textContent = 'Excellent! Complete daily logs to verify.';
  } else if (diffPct > 0) {
    dom.comparisonBadge.className = 'badge text-danger';
    dom.comparisonBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    dom.comparisonBadge.textContent = `+${diffPct}%`;
    dom.comparisonText.textContent = `Above global target (${DAILY_GLOBAL_AVG_KG} kg/day).`;
  } else {
    dom.comparisonBadge.className = 'badge badge-accent';
    dom.comparisonBadge.style.backgroundColor = 'var(--color-primary-glow)';
    dom.comparisonBadge.textContent = `${diffPct}%`;
    dom.comparisonText.textContent = 'Below global average. Excellent job!';
  }

  dom.miniValTransport.textContent = `${stats.transport.toFixed(1)} kg`;
  dom.miniValEnergy.textContent = `${stats.energy.toFixed(1)} kg`;
  dom.miniValDiet.textContent = `${stats.diet.toFixed(1)} kg`;
  dom.miniValWaste.textContent = `${stats.waste.toFixed(1)} kg`;
}

/**
 * Updates the circular SVG gauge (fill, label, and color).
 * @param {Object} stats - Output of store.getDailyFootprint() for the selected date.
 */
function renderGauge(stats) {
  const gaugePercent = Math.min(100, Math.round((stats.total / GAUGE_MAX_DAILY_KG) * 100));
  dom.gaugeLabel.textContent = `${gaugePercent}%`;

  const strokeOffset = GAUGE_CIRCLE_CIRCUMFERENCE - (GAUGE_CIRCLE_CIRCUMFERENCE * gaugePercent) / 100;
  dom.gaugeProgress.style.strokeDashoffset = String(strokeOffset);

  if (gaugePercent > GAUGE_DANGER_THRESHOLD_PCT) {
    dom.gaugeProgress.style.stroke = 'var(--color-danger)';
  } else if (gaugePercent > GAUGE_WARNING_THRESHOLD_PCT) {
    dom.gaugeProgress.style.stroke = 'var(--color-warning)';
  } else {
    dom.gaugeProgress.style.stroke = 'var(--color-primary)';
  }
}

/**
 * Renders the green-habits checklist for the selected date.
 * @param {Object} state - Full app state from the store.
 * @param {string} selectedDate - YYYY-MM-DD date currently being viewed.
 */
function renderHabitsChecklist(state, selectedDate) {
  dom.habitsContainer.innerHTML = '';

  state.habits.forEach((habit) => {
    const isCompleted = !!habit.completed[selectedDate];

    const item = document.createElement('div');
    item.className = `habit-item ${isCompleted ? 'completed' : ''}`;

    const domId = `chk-${habit.id}`;
    item.innerHTML = `
      <div class="habit-checkbox-wrapper">
        <input type="checkbox" id="${domId}" ${isCompleted ? 'checked' : ''} aria-label="Commit to ${habit.title}">
        <label for="${domId}" class="habit-label">${sanitizeText(habit.title)}</label>
      </div>
      <span class="habit-impact-badge">-${habit.impact} kg</span>
    `;

    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      store.toggleHabit(habit.id, selectedDate);
      announceToScreenReader(`Toggled habit: ${habit.title}`);
    });

    dom.habitsContainer.appendChild(item);
  });
}

/**
 * Renders the table of individually logged activities for the selected date.
 * @param {Object} state - Full app state from the store.
 * @param {string} selectedDate - YYYY-MM-DD date currently being viewed.
 */
function renderLogsTable(state, selectedDate) {
  dom.logsTableBody.innerHTML = '';
  const dayLogs = state.logs.filter((l) => l.date === selectedDate);

  if (dayLogs.length === 0) {
    dom.logsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No specific activities logged for this date. baseline values applied.</td>
      </tr>
    `;
    return;
  }

  const labelMap = {
    transport: '🚗 Transport',
    energy: '⚡ Energy',
    diet: '🥗 Diet',
    waste: '🗑️ Waste'
  };

  dayLogs.forEach((log) => {
    const tr = document.createElement('tr');
    const cleanSubtype = log.subtype.replace('_', ' ');
    const valText = log.category === 'transport' && !log.subtype.startsWith('flight') ? `${log.value} km` : `${log.value} unit`;

    tr.innerHTML = `
      <td><strong>${labelMap[log.category] || log.category}</strong></td>
      <td>${sanitizeText(cleanSubtype)} (${sanitizeText(valText)})</td>
      <td class="font-bold">${log.emissions} kg CO2e</td>
      <td class="text-muted">${sanitizeText(log.note || '-')}</td>
      <td>
        <button class="btn-delete-log" aria-label="Delete entry for ${cleanSubtype}">
          🗑️ Delete
        </button>
      </td>
    `;

    tr.querySelector('.btn-delete-log').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete the log for ${cleanSubtype}?`)) {
        store.deleteLog(log.id);
        announceToScreenReader('Log entry deleted.');
      }
    });

    dom.logsTableBody.appendChild(tr);
  });
}

/**
 * Renders personalized reduction tips based on the user's annual baseline.
 * @param {Object} baseline - Output of calculateProfileFootprint().
 */
function renderInsights(baseline) {
  dom.insightsContainer.innerHTML = '';
  const tips = generatePersonalizedTips(baseline);

  if (tips.length === 0) {
    dom.insightsContainer.innerHTML = '<p class="text-muted">Fill out your profile survey to generate insights.</p>';
    return;
  }

  const severityIcons = { warning: '⚠️', success: '🎉' };

  tips.forEach((tip) => {
    const div = document.createElement('div');
    div.className = `insight-item insight-item-${tip.severity}`;
    const badgeIcon = severityIcons[tip.severity] || '💡';

    div.innerHTML = `
      <span style="font-size: 1.5rem;" aria-hidden="true">${badgeIcon}</span>
      <div>
        <h4>${sanitizeText(tip.title)}</h4>
        <p>${sanitizeText(tip.desc)}</p>
      </div>
    `;
    dom.insightsContainer.appendChild(div);
  });
}

/**
 * Builds the daily category breakdown (baseline overridden by any logs for the day)
 * and renders the category + 7-day history SVG charts.
 * @param {Object} state - Full app state from the store.
 * @param {Object} baseline - Output of calculateProfileFootprint().
 * @param {string} selectedDate - YYYY-MM-DD date currently being viewed.
 */
function renderCharts(state, baseline, selectedDate) {
  const dailyBreakdown = {
    transport: baseline.transport / 365,
    energy: baseline.energy / 365,
    diet: baseline.diet / 365,
    waste: baseline.waste / 365,
    total: baseline.total / 365
  };

  const dayLogs = state.logs.filter((l) => l.date === selectedDate);
  const overriddenCats = new Set(dayLogs.map((l) => l.category));

  overriddenCats.forEach((cat) => {
    const sum = dayLogs.filter((l) => l.category === cat).reduce((s, l) => s + l.emissions, 0);
    dailyBreakdown[cat] = sum;
  });

  dailyBreakdown.total = dailyBreakdown.transport + dailyBreakdown.energy + dailyBreakdown.diet + dailyBreakdown.waste;

  renderCategoryChart(dom.categoryChartContainer, dailyBreakdown);

  const last7Days = [];
  for (let i = HISTORY_CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dataPoints = last7Days.map((date) => {
    const dailyStats = store.getDailyFootprint(date);
    return {
      date,
      total: dailyStats.total,
      label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });
  renderHistoryChart(dom.historyChartContainer, dataPoints);
}

/**
 * Orchestrates a full re-render of the Daily Log tab for whichever date is selected.
 * Called on store changes, date changes, and after new logs are added.
 */
export function renderLogsAndHabits() {
  const state = store.state;
  const selectedDate = getSelectedDate();
  const stats = store.getDailyFootprint(selectedDate);
  const baseline = calculateProfileFootprint(state.profile);

  const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  dom.habitsDateLabel.textContent = formattedDate;
  dom.logsDateLabel.textContent = formattedDate;

  renderDashboardMetrics(stats);
  renderGauge(stats);
  renderHabitsChecklist(state, selectedDate);
  renderLogsTable(state, selectedDate);
  renderInsights(baseline);
  renderCharts(state, baseline, selectedDate);
}
