/**
 * @jest-environment jsdom
 * @fileoverview State Management Unit Tests
 */

import { StateStore } from '../js/state.js';

describe('StateStore Module Tests', () => {
  let store;

  beforeEach(() => {
    // Clear localStorage mock between tests
    localStorage.clear();
    // Instantiate a fresh store instance for sandbox testing
    store = new StateStore();
  });

  test('Initializes with default profile data', () => {
    expect(store.state.profile.diet).toBe('balanced');
    expect(store.state.profile.transport.distance).toBe(8000);
    expect(store.state.logs).toEqual([]);
    expect(store.state.streak).toBe(0);
  });

  test('Updates user profile baseline and persists to storage', () => {
    const updatedProfile = {
      transport: { type: 'electric_car', distance: 12000, flightsShort: 4, flightsLong: 1 },
      energy: { electricity: 4000, gas: 1500, cleanEnergyRatio: 0.8 },
      diet: 'vegetarian',
      waste: 'minimal'
    };

    store.updateProfile(updatedProfile);

    // Assert internal state was updated
    expect(store.state.profile.diet).toBe('vegetarian');
    expect(store.state.profile.transport.type).toBe('electric_car');
    expect(store.state.profile.energy.cleanEnergyRatio).toBe(0.8);

    // Verify persistence to localStorage
    const savedData = JSON.parse(localStorage.getItem('ecopulse_state_v1'));
    expect(savedData.profile.diet).toBe('vegetarian');
  });

  test('Adds and deletes log entries', () => {
    const date = '2026-06-21';
    
    // Add travel log
    const log = store.addLog(date, 'transport', 15, 'gasoline_car', 'Work commute');
    
    expect(store.state.logs.length).toBe(1);
    expect(store.state.logs[0].id).toBe(log.id);
    expect(store.state.logs[0].value).toBe(15);
    expect(store.state.logs[0].emissions).toBe(2.7);
    expect(store.state.logs[0].note).toBe('Work commute');

    // Delete log
    store.deleteLog(log.id);
    expect(store.state.logs.length).toBe(0);
  });

  test('Toggles habit checklist and triggers updates', () => {
    const date = '2026-06-21';
    const habitId = 'h1'; // Meat-free day

    expect(store.state.habits[0].completed[date]).toBeUndefined();

    // Toggle on
    store.toggleHabit(habitId, date);
    expect(store.state.habits[0].completed[date]).toBe(true);

    // Toggle off
    store.toggleHabit(habitId, date);
    expect(store.state.habits[0].completed[date]).toBeUndefined();
  });

  test('Increases streak count on consecutive logs', () => {
    // Log on Day 1
    store.addLog('2026-06-20', 'diet', 1, 'vegan');
    expect(store.state.streak).toBe(1);

    // Log on Day 2 (Consecutive)
    store.addLog('2026-06-21', 'diet', 1, 'vegan');
    expect(store.state.streak).toBe(2);

    // Log on Day 4 (Gap in between, streak breaks)
    store.addLog('2026-06-23', 'diet', 1, 'vegan');
    expect(store.state.streak).toBe(1);
  });

  test('Computes net daily footprint with habit savings and overrides', () => {
    // Default baseline values (per day):
    //   transport: (8000 * 0.18 + 2 * 150) / 365 = (1440 + 300) / 365 = 4.76
    //   energy: (3000 * 0.40 + 5000 * 0.18) / 365 = (1200 + 900) / 365 = 5.75
    //   diet: 4.6
    //   waste: 2.7
    //   Gross Daily baseline: 4.76 + 5.75 + 4.6 + 2.7 = 17.81
    
    const date = '2026-06-21';
    
    // Test base footprint before logs
    const baseStats = store.getDailyFootprint(date);
    expect(baseStats.diet).toBe(4.6);
    expect(baseStats.total).toBe(17.8);

    // Override diet with a vegan day (saves emissions)
    store.addLog(date, 'diet', 1, 'vegan');
    
    // Complete meat-free day habit (saves another 4.0 kg CO2e)
    store.toggleHabit('h1', date);

    const updatedStats = store.getDailyFootprint(date);

    // Diet should be overridden to vegan (2.3) instead of baseline (4.6)
    expect(updatedStats.diet).toBe(2.3);
    expect(updatedStats.savings).toBe(4.0);

    // Net Total should be: Transport(4.8) + Energy(5.8) + Diet(2.3) + Waste(2.7) - HabitSavings(4.0)
    // 4.8 + 5.8 + 2.3 + 2.7 - 4.0 = 11.6 kg (with floating point summation precision, rounded to 11.5)
    expect(updatedStats.total).toBe(11.5);
  });
});
