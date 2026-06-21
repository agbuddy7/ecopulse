/**
 * @fileoverview EcoPulse Main Application Coordinator.
 * Binds store state to the DOM, handles form inputs, theme toggling, CSV exports,
 * and renders accessible SVG-based visualizations.
 */

import { store } from './state.js';
import { calculateProfileFootprint, generatePersonalizedTips } from './calculator.js';
import { processAssistantMessage } from './assistant.js';

// DOM Element Selectors
const docHtml = document.documentElement;
const srAnnouncer = document.getElementById('sr-announcer');
const streakCount = document.getElementById('streak-count');
const themeToggle = document.getElementById('theme-toggle');

// Navigation Tabs
const tabProfile = document.getElementById('tab-profile');
const tabLog = document.getElementById('tab-log');
const panelProfile = document.getElementById('panel-profile');
const panelLog = document.getElementById('panel-log');

// Profile Form
const profileForm = document.getElementById('profile-form');
const profCleanRatio = document.getElementById('prof-energy-clean');
const cleanRatioLabel = document.getElementById('clean-ratio-label');

// Daily Log Form
const logForm = document.getElementById('activity-log-form');
const logDate = document.getElementById('log-date');
const logCategory = document.getElementById('log-category');
const dynamicLogFields = document.getElementById('dynamic-log-fields');
const btnSubmitLog = document.getElementById('btn-submit-log');

// Metrics & Dashboard
const metricTodayTotal = document.getElementById('metric-today-total');
const comparisonBadge = document.getElementById('comparison-badge');
const comparisonText = document.getElementById('comparison-text');
const gaugeProgress = document.getElementById('gauge-progress');
const gaugeLabel = document.getElementById('gauge-label');

const miniValTransport = document.getElementById('mini-val-transport');
const miniValEnergy = document.getElementById('mini-val-energy');
const miniValDiet = document.getElementById('mini-val-diet');
const miniValWaste = document.getElementById('mini-val-waste');

// Chart containers
const categoryChartContainer = document.getElementById('category-chart-container');
const historyChartContainer = document.getElementById('history-chart-container');

// Habits & Insights
const habitsContainer = document.getElementById('habits-checklist-container');
const habitsDateLabel = document.getElementById('habit-date-label');
const insightsContainer = document.getElementById('insights-list-container');

// Logs Table
const logsDateLabel = document.getElementById('logs-date-label');
const logsTableBody = document.getElementById('logs-table-body');
const btnExportCsv = document.getElementById('btn-export-csv');

// Assistant Panel
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-input-form');
const chatUserMessage = document.getElementById('chat-user-message');
const btnClearChat = document.getElementById('btn-clear-chat');

// Footer
const btnResetData = document.getElementById('btn-reset-data');

// Global Date Tracking (Defaults to current date YYYY-MM-DD local time)
let selectedDate = new Date().toISOString().split('T')[0];

/**
 * Utility to sanitize text to prevent XSS.
 * @param {string} text - Raw input text
 * @returns {string} Sanitized HTML-safe string
 */
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Announces message to screen readers using ARIA live regions.
 * @param {string} message - Text to announce
 */
function announceToScreenReader(message) {
  if (srAnnouncer) {
    srAnnouncer.textContent = message;
  }
}

/**
 * Initializes Theme (Dark Mode by default, restores previous settings)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('ecopulse_theme') || 'dark';
  if (savedTheme === 'light') {
    docHtml.classList.add('light-theme');
  } else {
    docHtml.classList.remove('light-theme');
  }
}

themeToggle.addEventListener('click', () => {
  docHtml.classList.toggle('light-theme');
  const activeTheme = docHtml.classList.contains('light-theme') ? 'light' : 'dark';
  localStorage.setItem('ecopulse_theme', activeTheme);
  announceToScreenReader(`Switched to ${activeTheme} theme`);
});

/**
 * Sets up Tab panel navigation
 */
function setupTabs() {
  const tabs = [
    { button: tabProfile, panel: panelProfile },
    { button: tabLog, panel: panelLog }
  ];

  tabs.forEach(tab => {
    tab.button.addEventListener('click', () => {
      tabs.forEach(t => {
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
 */
function populateProfileForm(profile) {
  if (!profile) return;
  document.getElementById('prof-transport-type').value = profile.transport?.type || 'none';
  document.getElementById('prof-transport-distance').value = profile.transport?.distance ?? 0;
  document.getElementById('prof-flights-short').value = profile.transport?.flightsShort ?? 0;
  document.getElementById('prof-flights-long').value = profile.transport?.flightsLong ?? 0;
  
  document.getElementById('prof-energy-elec').value = profile.energy?.electricity ?? 0;
  document.getElementById('prof-energy-gas').value = profile.energy?.gas ?? 0;
  
  const cleanRatio = Math.round((profile.energy?.cleanEnergyRatio || 0) * 100);
  profCleanRatio.value = cleanRatio;
  cleanRatioLabel.textContent = `${cleanRatio}% Clean`;
  
  document.getElementById('prof-diet').value = profile.diet || 'balanced';
  document.getElementById('prof-waste').value = profile.waste || 'average';
}

// Live update of renewable energy label
profCleanRatio.addEventListener('input', (e) => {
  cleanRatioLabel.textContent = `${e.target.value}% Clean`;
});

/**
 * Submits Profile updates.
 */
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const cleanEnergyRatio = parseFloat(profCleanRatio.value) / 100;
  const update = {
    transport: {
      type: document.getElementById('prof-transport-type').value,
      distance: parseFloat(document.getElementById('prof-transport-distance').value) || 0,
      flightsShort: parseInt(document.getElementById('prof-flights-short').value, 10) || 0,
      flightsLong: parseInt(document.getElementById('prof-flights-long').value, 10) || 0
    },
    energy: {
      electricity: parseFloat(document.getElementById('prof-energy-elec').value) || 0,
      gas: parseFloat(document.getElementById('prof-energy-gas').value) || 0,
      cleanEnergyRatio
    },
    diet: document.getElementById('prof-diet').value,
    waste: document.getElementById('prof-waste').value
  };

  store.updateProfile(update);
  announceToScreenReader('Baseline profile successfully updated.');
});

/**
 * Handle category change in Daily Log Form to inject dynamic input fields.
 */
logCategory.addEventListener('change', () => {
  const cat = logCategory.value;
  dynamicLogFields.innerHTML = '';
  btnSubmitLog.disabled = false;

  if (cat === 'transport') {
    dynamicLogFields.innerHTML = `
      <div class="form-group">
        <label for="log-sub-transport">Vehicle/Transit Mode</label>
        <select id="log-sub-transport" required>
          <option value="gasoline_car">Gasoline Car</option>
          <option value="electric_car">Electric Vehicle (EV)</option>
          <option value="public_transport">Public Transit (Bus/Train)</option>
          <option value="bicycle">Bicycle</option>
          <option value="walking">Walking</option>
          <option value="flight_short">Short flight (&lt;3 hrs)</option>
          <option value="flight_long">Long flight (&gt;3 hrs)</option>
        </select>
      </div>
      <div class="form-group" id="dist-container">
        <label for="log-value-transport" id="dist-label">Distance traveled (km)</label>
        <input type="number" id="log-value-transport" min="0.1" step="any" required value="10">
      </div>
    `;
    
    // Hide distance box if it is flight short/long
    const subSelect = document.getElementById('log-sub-transport');
    subSelect.addEventListener('change', () => {
      const distContainer = document.getElementById('dist-container');
      const valInput = document.getElementById('log-value-transport');
      if (subSelect.value.startsWith('flight')) {
        distContainer.style.display = 'none';
        valInput.removeAttribute('required');
        valInput.value = 1; // 1 flight
      } else {
        distContainer.style.display = 'flex';
        valInput.setAttribute('required', 'true');
        valInput.value = 10;
      }
    });
  } else if (cat === 'diet') {
    dynamicLogFields.innerHTML = `
      <div class="form-group">
        <label for="log-sub-diet">Today's Eating Habits</label>
        <select id="log-sub-diet" required>
          <option value="vegan">Strict Plant-based (Vegan)</option>
          <option value="vegetarian">Vegetarian (No meat)</option>
          <option value="balanced">Balanced (Average meat)</option>
          <option value="meat_heavy">Meat Lover (High beef/lamb)</option>
        </select>
      </div>
    `;
  } else if (cat === 'energy') {
    dynamicLogFields.innerHTML = `
      <div class="form-group">
        <label for="log-sub-energy">Energy Category</label>
        <select id="log-sub-energy" required>
          <option value="electricity_kwh">Electricity Usage</option>
          <option value="gas_kwh">Natural Gas</option>
        </select>
      </div>
      <div class="form-group">
        <label for="log-value-energy">Amount (kWh)</label>
        <input type="number" id="log-value-energy" min="0.1" step="any" required value="5">
      </div>
    `;
  } else if (cat === 'waste') {
    dynamicLogFields.innerHTML = `
      <div class="form-group">
        <label for="log-sub-waste">Waste Generation</label>
        <select id="log-sub-waste" required>
          <option value="minimal">Minimal / High Recycling & Composting</option>
          <option value="average">Average Household Waste</option>
          <option value="high">High Packaging / Non-recycler</option>
        </select>
      </div>
    `;
  }
});

/**
 * Handle Daily Log Form submission.
 */
logForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const category = logCategory.value;
  const date = logDate.value;
  const note = document.getElementById('log-note').value;

  let subtype = '';
  let value = 1;

  if (category === 'transport') {
    subtype = document.getElementById('log-sub-transport').value;
    if (subtype.startsWith('flight')) {
      value = 1; // flights are logged as count
    } else {
      value = parseFloat(document.getElementById('log-value-transport').value) || 0;
    }
  } else if (category === 'diet') {
    subtype = document.getElementById('log-sub-diet').value;
    value = 1; // 1 day
  } else if (category === 'energy') {
    subtype = document.getElementById('log-sub-energy').value;
    value = parseFloat(document.getElementById('log-value-energy').value) || 0;
  } else if (category === 'waste') {
    subtype = document.getElementById('log-sub-waste').value;
    value = 1; // 1 day
  }

  try {
    store.addLog(date, category, value, subtype, note);
    logForm.reset();
    dynamicLogFields.innerHTML = '';
    btnSubmitLog.disabled = true;
    
    // Switch active view to date logged, if not matching
    if (date !== selectedDate) {
      selectedDate = date;
      renderLogsAndHabits();
    }
    
    announceToScreenReader(`Successfully logged ${category} activity.`);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// Update tables/habits dates on manual selection
logDate.addEventListener('change', (e) => {
  selectedDate = e.target.value;
  renderLogsAndHabits();
});

/**
 * Renders SVG bar chart for Category Breakdown.
 */
function renderCategoryChart(breakdown) {
  categoryChartContainer.innerHTML = '';

  const { transport, energy, diet, waste, total } = breakdown;
  
  if (total === 0) {
    categoryChartContainer.innerHTML = `<p class="text-muted">No data available. Try inputting details.</p>`;
    return;
  }

  const data = [
    { label: 'Transport', val: transport, color: '#6366f1' }, // Indigo
    { label: 'Energy', val: energy, color: '#f59e0b' },    // Yellow
    { label: 'Diet', val: diet, color: '#10b981' },      // Emerald
    { label: 'Waste', val: waste, color: '#ef4444' }       // Red
  ];

  // SVG parameters
  const svgW = 400;
  const svgH = 180;
  const barPadding = 12;
  const rowHeight = 35;
  const labelWidth = 90;
  const maxBarWidth = 260;

  const maxVal = Math.max(...data.map(d => d.val), 1);

  // Generate SVG Elements programmatically for reliability & accessibility
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'chart-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Carbon emissions category breakdown: Transport ${transport} kg, Energy ${energy} kg, Diet ${diet} kg, Waste ${waste} kg.`);

  data.forEach((item, index) => {
    const y = index * (rowHeight + barPadding) + 10;
    const barWidth = (item.val / maxVal) * maxBarWidth;

    // Label text
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', '0');
    textLabel.setAttribute('y', String(y + 20));
    textLabel.setAttribute('fill', 'currentColor');
    textLabel.setAttribute('font-family', 'var(--font-title)');
    textLabel.setAttribute('font-weight', '600');
    textLabel.setAttribute('font-size', '13px');
    textLabel.textContent = item.label;

    // Background track
    const rectTrack = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectTrack.setAttribute('x', String(labelWidth));
    rectTrack.setAttribute('y', String(y));
    rectTrack.setAttribute('width', String(maxBarWidth));
    rectTrack.setAttribute('height', '24');
    rectTrack.setAttribute('rx', '6');
    rectTrack.setAttribute('fill', 'rgba(255, 255, 255, 0.03)');

    // Active Value Bar
    const rectBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectBar.setAttribute('x', String(labelWidth));
    rectBar.setAttribute('y', String(y));
    rectBar.setAttribute('width', String(Math.max(12, barWidth))); // Minimum width for visibility
    rectBar.setAttribute('height', '24');
    rectBar.setAttribute('rx', '6');
    rectBar.setAttribute('fill', item.color);

    // Value label
    const textVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textVal.setAttribute('x', String(labelWidth + Math.max(12, barWidth) + 8));
    textVal.setAttribute('y', String(y + 16));
    textVal.setAttribute('fill', 'currentColor');
    textVal.setAttribute('font-family', 'var(--font-body)');
    textVal.setAttribute('font-size', '12px');
    textVal.setAttribute('font-weight', '700');
    textVal.textContent = `${Math.round(item.val)} kg`;

    svg.appendChild(textLabel);
    svg.appendChild(rectTrack);
    svg.appendChild(rectBar);
    svg.appendChild(textVal);
  });

  categoryChartContainer.appendChild(svg);
}

/**
 * Renders SVG line chart of weekly net carbon totals.
 */
function renderHistoryChart() {
  historyChartContainer.innerHTML = '';

  // Get dates for the last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dataPoints = last7Days.map(date => {
    const stats = store.getDailyFootprint(date);
    return {
      date,
      total: stats.total,
      label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });

  const maxVal = Math.max(...dataPoints.map(d => d.total), 5); // Fallback to 5 to avoid flat graph

  const svgW = 400;
  const svgH = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphW = svgW - paddingLeft - paddingRight;
  const graphH = svgH - paddingTop - paddingBottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'chart-svg');
  svg.setAttribute('role', 'img');
  
  const formattedAriaLabel = dataPoints.map(dp => `${dp.label}: ${dp.total} kg`).join(', ');
  svg.setAttribute('aria-label', `Carbon emissions trend line for past 7 days: ${formattedAriaLabel}`);

  // Draw grid lines
  const gridLinesCount = 3;
  for (let i = 0; i <= gridLinesCount; i++) {
    const yVal = paddingTop + (graphH * i) / gridLinesCount;
    const gridVal = Math.round(maxVal - (maxVal * i) / gridLinesCount);
    
    // Grid Line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(paddingLeft));
    line.setAttribute('y1', String(yVal));
    line.setAttribute('x2', String(svgW - paddingRight));
    line.setAttribute('y2', String(yVal));
    line.setAttribute('class', 'chart-grid-line');
    
    // Axis numeric scale
    const textScale = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textScale.setAttribute('x', String(paddingLeft - 8));
    textScale.setAttribute('y', String(yVal + 4));
    textScale.setAttribute('text-anchor', 'end');
    textScale.setAttribute('fill', 'var(--text-muted)');
    textScale.setAttribute('font-size', '10px');
    textScale.textContent = String(gridVal);

    svg.appendChild(line);
    svg.appendChild(textScale);
  }

  // Draw Line path points
  let pathD = '';
  const points = [];

  dataPoints.forEach((dp, index) => {
    const x = paddingLeft + (index * graphW) / 6;
    const y = paddingTop + graphH - (dp.total / maxVal) * graphH;
    points.push({ x, y, val: dp.total, dateLabel: dp.label });

    if (index === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Render Line Path
  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  linePath.setAttribute('d', pathD);
  linePath.setAttribute('class', 'chart-line');
  svg.appendChild(linePath);

  // Render nodes and text labels
  points.forEach((point, index) => {
    // Circle Node
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(point.x));
    circle.setAttribute('cy', String(point.y));
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'var(--color-primary)');
    circle.setAttribute('stroke', 'var(--bg-app)');
    circle.setAttribute('stroke-width', '1.5');
    
    // Title tag inside node for basic mouse hover description
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${point.dateLabel}: ${point.val} kg CO2e`;
    circle.appendChild(title);

    // X-axis label
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', String(point.x));
    textLabel.setAttribute('y', String(svgH - 8));
    textLabel.setAttribute('class', 'chart-label');
    textLabel.textContent = point.dateLabel;

    svg.appendChild(circle);
    svg.appendChild(textLabel);
  });

  historyChartContainer.appendChild(svg);
}

/**
 * Renders checklist of habits, dynamic insights, table log items, and dashboard metrics.
 */
function renderLogsAndHabits() {
  const state = store.state;
  const stats = store.getDailyFootprint(selectedDate);
  const baseline = calculateProfileFootprint(state.profile);

  // Update date labels
  const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  habitsDateLabel.textContent = formattedDate;
  logsDateLabel.textContent = formattedDate;

  // 1. Render Dashboard Metrics
  metricTodayTotal.textContent = stats.total.toFixed(1);

  // Compare to global per capita average: 4700 kg/year = ~12.9 kg/day
  const dailyGlobalAvg = 12.9;
  const diffPct = Math.round(((stats.total - dailyGlobalAvg) / dailyGlobalAvg) * 100);

  if (stats.total === 0) {
    comparisonBadge.className = 'badge';
    comparisonBadge.textContent = 'Zero Emissions';
    comparisonText.textContent = 'Excellent! Complete daily logs to verify.';
  } else if (diffPct > 0) {
    comparisonBadge.className = 'badge text-danger';
    comparisonBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    comparisonBadge.textContent = `+${diffPct}%`;
    comparisonText.textContent = 'Above global target (12.9 kg/day).';
  } else {
    comparisonBadge.className = 'badge badge-accent';
    comparisonBadge.style.backgroundColor = 'var(--color-primary-glow)';
    comparisonBadge.textContent = `${diffPct}%`;
    comparisonText.textContent = 'Below global average. Excellent job!';
  }

  // Circular Gauge Updates
  // Max scale gauge at 30kg carbon/day
  const maxDialCarbon = 30;
  const gaugePercent = Math.min(100, Math.round((stats.total / maxDialCarbon) * 100));
  gaugeLabel.textContent = `${gaugePercent}%`;

  // SVG Gauge calculations
  // stroke-dasharray = 251.2
  const strokeOffset = 251.2 - (251.2 * gaugePercent) / 100;
  gaugeProgress.style.strokeDashoffset = String(strokeOffset);

  // Update color based on footprint density
  if (gaugePercent > 75) {
    gaugeProgress.style.stroke = 'var(--color-danger)';
  } else if (gaugePercent > 45) {
    gaugeProgress.style.stroke = 'var(--color-warning)';
  } else {
    gaugeProgress.style.stroke = 'var(--color-primary)';
  }

  // Mini Cards
  miniValTransport.textContent = `${stats.transport.toFixed(1)} kg`;
  miniValEnergy.textContent = `${stats.energy.toFixed(1)} kg`;
  miniValDiet.textContent = `${stats.diet.toFixed(1)} kg`;
  miniValWaste.textContent = `${stats.waste.toFixed(1)} kg`;

  // 2. Render Green Habits Checklist
  habitsContainer.innerHTML = '';
  state.habits.forEach(habit => {
    const isCompleted = !!habit.completed[selectedDate];

    const item = document.createElement('div');
    item.className = `habit-item ${isCompleted ? 'completed' : ''}`;
    
    // Unique ID for keyboard controls
    const domId = `chk-${habit.id}`;

    item.innerHTML = `
      <div class="habit-checkbox-wrapper">
        <input type="checkbox" id="${domId}" ${isCompleted ? 'checked' : ''} aria-label="Commit to ${habit.title}">
        <label for="${domId}" class="habit-label">${sanitizeText(habit.title)}</label>
      </div>
      <span class="habit-impact-badge">-${habit.impact} kg</span>
    `;

    // Click behavior
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      store.toggleHabit(habit.id, selectedDate);
      announceToScreenReader(`Toggled habit: ${habit.title}`);
    });

    habitsContainer.appendChild(item);
  });

  // 3. Render Logs Table
  logsTableBody.innerHTML = '';
  const dayLogs = state.logs.filter(l => l.date === selectedDate);

  if (dayLogs.length === 0) {
    logsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No specific activities logged for this date. baseline values applied.</td>
      </tr>
    `;
  } else {
    dayLogs.forEach(log => {
      const tr = document.createElement('tr');
      
      const labelMap = {
        transport: '🚗 Transport',
        energy: '⚡ Energy',
        diet: '🥗 Diet',
        waste: '🗑️ Waste'
      };

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

      logsTableBody.appendChild(tr);
    });
  }

  // 4. Render Insights & Tips
  insightsContainer.innerHTML = '';
  // Generate tips based on annual breakdown values
  const tips = generatePersonalizedTips(baseline);
  if (tips.length === 0) {
    insightsContainer.innerHTML = `<p class="text-muted">Fill out your profile survey to generate insights.</p>`;
  } else {
    tips.forEach(tip => {
      const div = document.createElement('div');
      div.className = `insight-item insight-item-${tip.severity}`;
      
      let badgeIcon = '💡';
      if (tip.severity === 'warning') badgeIcon = '⚠️';
      if (tip.severity === 'success') badgeIcon = '🎉';

      div.innerHTML = `
        <span style="font-size: 1.5rem;" aria-hidden="true">${badgeIcon}</span>
        <div>
          <h4>${sanitizeText(tip.title)}</h4>
          <p>${sanitizeText(tip.desc)}</p>
        </div>
      `;
      insightsContainer.appendChild(div);
    });
  }

  // 5. Render SVG Charts
  // Convert annual breakdown to average daily baseline values
  const dailyBreakdown = {
    transport: baseline.transport / 365,
    energy: baseline.energy / 365,
    diet: baseline.diet / 365,
    waste: baseline.waste / 365,
    total: baseline.total / 365
  };

  // Adjust categories based on selected date's custom overrides
  const categories = ['transport', 'energy', 'diet', 'waste'];
  const overriddenCats = new Set(dayLogs.map(l => l.category));
  
  overriddenCats.forEach(cat => {
    const sum = dayLogs.filter(l => l.category === cat).reduce((s, l) => s + l.emissions, 0);
    dailyBreakdown[cat] = sum;
  });

  // recalculate total
  dailyBreakdown.total = dailyBreakdown.transport + dailyBreakdown.energy + dailyBreakdown.diet + dailyBreakdown.waste;

  renderCategoryChart(dailyBreakdown);
  renderHistoryChart();
}

/**
 * Handles appending a chat message to EcoBot container.
 * @param {string} sender - 'user' | 'assistant'
 * @param {string} text - Message content (supports HTML/markdown styling securely)
 */
function appendChatMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${sender}`;

  // Formatted timestamp
  const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // Safe inner content (allows list item tags that assistant might produce)
  // We sanitize and format newlines as paragraph breaks
  const paragraphText = text
    .split('\n\n')
    .map(p => {
      // If it starts with bullet point formatting, clean it up
      if (p.startsWith('- ') || p.startsWith('* ')) {
        const items = p.split(/\n[-*]\s+/).map(item => {
          // Replace raw markdown bold text (e.g. **text**) with strong tag safely
          const cleanItem = sanitizeText(item.replace(/^[-*]\s+/, ''))
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          return `<li>${cleanItem}</li>`;
        });
        return `<ul>${items.join('')}</ul>`;
      }
      
      const cleanP = sanitizeText(p)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return `<p>${cleanP}</p>`;
    })
    .join('');

  messageDiv.innerHTML = `
    <div class="chat-message-content">${paragraphText}</div>
    <span class="chat-message-time">${time}</span>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Injects initial chatbot instructions
 */
function welcomeEcoBot() {
  appendChatMessage('assistant', `Hello! I am **EcoBot**, your sustainability advisor. 🤖

I can help you understand and track your carbon emissions. Try typing commands like:
- *'I drove 15 km today'*
- *'I ate a vegetarian lunch'*
- *'Give me household energy tips'*

What would you like to log or learn today?`);
}

/**
 * Handles chat submission
 */
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawMsg = chatUserMessage.value;
  if (!rawMsg.trim()) return;

  // Render User Message
  appendChatMessage('user', rawMsg);
  chatUserMessage.value = '';

  // Processing delay to simulate AI responses
  setTimeout(() => {
    const reply = processAssistantMessage(rawMsg, store);
    appendChatMessage('assistant', reply.text);
    announceToScreenReader('EcoBot replied.');
  }, 350);
});

btnClearChat.addEventListener('click', () => {
  chatMessages.innerHTML = '';
  welcomeEcoBot();
});

/**
 * Exports logged actions and stats to a CSV file.
 */
btnExportCsv.addEventListener('click', () => {
  const state = store.state;
  if (state.logs.length === 0) {
    alert("No logged logs to export yet. Please add logs to build your history.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Date,Category,Subtype,Value,Emissions (kg CO2e),Note\n";

  state.logs.forEach(log => {
    const noteField = (log.note || '').replace(/"/g, '""');
    csvContent += `"${log.id}","${log.date}","${log.category}","${log.subtype}",${log.value},${log.emissions},"${noteField}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ecopulse_carbon_audit_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  announceToScreenReader('Carbon audit report downloaded as CSV.');
});

/**
 * Reset application data
 */
btnResetData.addEventListener('click', () => {
  if (confirm("⚠️ WARNING: This will permanently delete all logs, habits, and profile baseline data. Are you sure?")) {
    store.resetState();
    localStorage.removeItem('ecopulse_state_v1');
    selectedDate = new Date().toISOString().split('T')[0];
    logDate.value = selectedDate;
    populateProfileForm(store.state.profile);
    
    // Clear chat
    chatMessages.innerHTML = '';
    welcomeEcoBot();
    
    announceToScreenReader('Application data reset successfully.');
  }
});

// Reactivity pipeline: Bind state changes to automatic UI re-renders
store.subscribe((state) => {
  streakCount.textContent = state.streak;
  populateProfileForm(state.profile);
  renderLogsAndHabits();
});

// Initialize Date Picker defaults
logDate.value = selectedDate;

// Set up UI components on load
initTheme();
setupTabs();
welcomeEcoBot();
