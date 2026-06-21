/**
 * @fileoverview EcoPulse State Management.
 * Implements a reactive, pub-sub style state store with LocalStorage persistence.
 */

import { calculateProfileFootprint, calculateActivityEmissions } from './calculator.js';

const STORAGE_KEY = 'ecopulse_state_v1';

const DEFAULT_STATE = {
  profile: {
    transport: {
      type: 'gasoline_car',
      distance: 8000,
      flightsShort: 2,
      flightsLong: 0
    },
    energy: {
      electricity: 3000,
      gas: 5000,
      cleanEnergyRatio: 0.0
    },
    diet: 'balanced',
    waste: 'average'
  },
  logs: [], // Array of { id: string, date: string (YYYY-MM-DD), category: string, value: number, subtype: string, emissions: number }
  habits: [
    { id: 'h1', title: 'Meat-Free Day', category: 'diet', impact: 4.0, completed: {} }, // completed: { 'YYYY-MM-DD': true }
    { id: 'h2', title: 'Line-Dry Clothes', category: 'energy', impact: 1.5, completed: {} },
    { id: 'h3', title: 'Commute by Bicycle/Walk', category: 'transport', impact: 3.5, completed: {} },
    { id: 'h4', title: 'Turn Off Standby Power', category: 'energy', impact: 0.8, completed: {} },
    { id: 'h5', title: 'Zero Waste Challenge', category: 'waste', impact: 1.6, completed: {} }
  ],
  streak: 0,
  lastActiveDate: null
};

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  /**
   * Loads state from localStorage or falls back to defaults.
   * @private
   * @returns {Object} State object
   */
  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Deep merge defaults to handle format updates
        return {
          ...DEFAULT_STATE,
          ...parsed,
          profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
          habits: DEFAULT_STATE.habits.map(defaultHabit => {
            const parsedHabit = (parsed.habits || []).find(h => h.id === defaultHabit.id);
            return {
              ...defaultHabit,
              completed: parsedHabit ? (parsedHabit.completed || {}) : {}
            };
          })
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE)); // Deep clone
  }

  /**
   * Persists the current state to LocalStorage.
   * @private
   */
  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to write state to localStorage:', e);
    }
  }

  /**
   * Subscribes a callback function to state changes.
   * @param {Function} callback - Callback function receiving current state
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call callback with current state
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notifies all registered listeners of state changes.
   * @private
   */
  notify() {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    });
  }

  /**
   * Updates user profile survey responses and saves/notifies.
   * @param {Object} profileUpdate - Updated profile fields
   */
  updateProfile(profileUpdate) {
    if (!profileUpdate) return;
    
    // Safely update profile with validation
    this.state.profile = {
      transport: {
        type: String(profileUpdate.transport?.type || 'none'),
        distance: Math.max(0, Number(profileUpdate.transport?.distance) || 0),
        flightsShort: Math.max(0, Number(profileUpdate.transport?.flightsShort) || 0),
        flightsLong: Math.max(0, Number(profileUpdate.transport?.flightsLong) || 0)
      },
      energy: {
        electricity: Math.max(0, Number(profileUpdate.energy?.electricity) || 0),
        gas: Math.max(0, Number(profileUpdate.energy?.gas) || 0),
        cleanEnergyRatio: Math.min(1.0, Math.max(0, Number(profileUpdate.energy?.cleanEnergyRatio) || 0))
      },
      diet: String(profileUpdate.diet || 'balanced'),
      waste: String(profileUpdate.waste || 'average')
    };

    this.saveState();
    this.notify();
  }

  /**
   * Logs a daily activity and calculates carbon emissions.
   * @param {string} date - Date of activity in YYYY-MM-DD format
   * @param {string} category - 'transport' | 'energy' | 'diet' | 'waste'
   * @param {number} value - Input value
   * @param {string} subtype - Sub-type (e.g. 'gasoline_car', 'vegetarian')
   * @param {string} [note] - Optional user notes
   */
  addLog(date, category, value, subtype, note = '') {
    // Basic validations
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }
    if (!['transport', 'energy', 'diet', 'waste'].includes(category)) {
      throw new Error('Invalid category.');
    }
    const amount = Math.max(0, Number(value) || 0);

    const emissions = calculateActivityEmissions(category, amount, subtype);

    const logEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date,
      category,
      value: amount,
      subtype: String(subtype || ''),
      emissions: Math.round(emissions * 10) / 10,
      note: String(note).substring(0, 100) // limit notes to 100 chars
    };

    this.state.logs.push(logEntry);
    this.updateStreak(date);
    this.saveState();
    this.notify();
    return logEntry;
  }

  /**
   * Deletes a log entry by its unique ID.
   * @param {string} logId - ID of log entry to remove
   */
  deleteLog(logId) {
    this.state.logs = this.state.logs.filter(l => l.id !== logId);
    this.saveState();
    this.notify();
  }

  /**
   * Toggles completion status of a green habit for a specific date.
   * @param {string} habitId - Habit identifier
   * @param {string} date - Date in YYYY-MM-DD format
   */
  toggleHabit(habitId, date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    
    const habit = this.state.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.completed[date]) {
      delete habit.completed[date];
    } else {
      habit.completed[date] = true;
      this.updateStreak(date);
    }

    this.saveState();
    this.notify();
  }

  /**
   * Updates user usage streak.
   * @private
   * @param {string} dateStr - Date of activity in YYYY-MM-DD format
   */
  updateStreak(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (this.state.lastActiveDate === dateStr) {
      return; // Already logged today/this date, no streak change
    }

    const lastDate = this.state.lastActiveDate ? new Date(this.state.lastActiveDate) : null;
    const currentDate = new Date(dateStr);

    if (!lastDate) {
      this.state.streak = 1;
    } else {
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        this.state.streak += 1;
      } else if (diffDays > 1) {
        this.state.streak = 1; // Streak broken, reset
      }
    }
    
    this.state.lastActiveDate = dateStr;
  }

  /**
   * Clears state back to default values.
   */
  resetState() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
    this.notify();
  }

  /**
   * Computes actual emissions for a specific date.
   * If a category was logged on that date, it overrides the daily baseline for that category.
   * 
   * @param {string} dateStr - YYYY-MM-DD date
   * @returns {Object} Category emissions and total for that date
   */
  getDailyFootprint(dateStr) {
    const baseline = calculateProfileFootprint(this.state.profile);
    
    // Daily baselines (kg CO2e per day)
    const dailyBase = {
      transport: baseline.transport / 365,
      energy: baseline.energy / 365,
      diet: baseline.diet / 365,
      waste: baseline.waste / 365
    };

    // Filter logs for this specific date
    const dayLogs = this.state.logs.filter(l => l.date === dateStr);
    
    // Check which categories are present in daily logs
    const loggedCategories = new Set(dayLogs.map(l => l.category));
    
    // Total savings from habits completed on this date
    let habitSavings = 0;
    this.state.habits.forEach(habit => {
      if (habit.completed[dateStr]) {
        habitSavings += habit.impact;
      }
    });

    const result = {
      transport: dailyBase.transport,
      energy: dailyBase.energy,
      diet: dailyBase.diet,
      waste: dailyBase.waste,
      savings: habitSavings
    };

    // If there are daily logs for a category, use the sum of logged activities instead of baseline
    loggedCategories.forEach(category => {
      const catSum = dayLogs
        .filter(l => l.category === category)
        .reduce((sum, l) => sum + l.emissions, 0);
      
      result[category] = catSum;
    });

    // Compute net total footprint for the day
    const grossTotal = result.transport + result.energy + result.diet + result.waste;
    result.total = Math.max(0, Math.round((grossTotal - habitSavings) * 10) / 10);

    // Round categories
    result.transport = Math.round(result.transport * 10) / 10;
    result.energy = Math.round(result.energy * 10) / 10;
    result.diet = Math.round(result.diet * 10) / 10;
    result.waste = Math.round(result.waste * 10) / 10;
    result.savings = Math.round(result.savings * 10) / 10;

    return result;
  }
}

// Export single instance of state store (Singleton pattern)
export const store = new StateStore();
export { StateStore };
