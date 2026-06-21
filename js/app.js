/**
 * @fileoverview EcoPulse Main Application Coordinator.
 * Binds store state to the DOM, handles form inputs, theme toggling, CSV exports,
 * and renders accessible SVG-based visualizations.
 */

import { store } from './state.js';
import { calculateProfileFootprint, generatePersonalizedTips } from './calculator.js';
import { processAssistantMessage } from './assistant.js';
import { renderCategoryChart, renderHistoryChart } from './charts.js';

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

// SVG Charts logic has been extracted to charts.js.

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

  renderCategoryChart(categoryChartContainer, dailyBreakdown);
  
  // Prepare data for history chart
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dataPoints = last7Days.map(date => {
    const dailyStats = store.getDailyFootprint(date);
    return {
      date,
      total: dailyStats.total,
      label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });
  renderHistoryChart(historyChartContainer, dataPoints);
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
