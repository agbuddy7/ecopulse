/**
 * @jest-environment jsdom
 * @fileoverview EcoBot Assistant Unit Tests
 */

import { StateStore } from '../js/state.js';
import { processAssistantMessage } from '../js/assistant.js';

describe('EcoBot Assistant Module Tests', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = new StateStore();
  });

  test('Replies to greetings', () => {
    const res = processAssistantMessage('Hello EcoBot!', store);
    expect(res.success).toBe(true);
    expect(res.text).toContain('Hi there!');
  });

  test('Processes carbon tips queries', () => {
    // General tips
    const genRes = processAssistantMessage('how can I reduce my footprint?', store);
    expect(genRes.success).toBe(true);
    expect(genRes.text).toContain('Eco Tips');

    // Category specific tips
    const transitRes = processAssistantMessage('give me some transit tips', store);
    expect(transitRes.success).toBe(true);
    expect(transitRes.text).toContain('emissions');
    expect(transitRes.text).toContain('transit');
  });

  test('Parses and logs transport commands (km and miles)', () => {
    // 1. Metric distance
    const resKm = processAssistantMessage('I drove 20 km today in my gasoline car', store);
    expect(resKm.success).toBe(true);
    expect(resKm.action).toEqual(expect.objectContaining({
      category: 'transport',
      value: 20,
      subtype: 'gasoline_car'
    }));
    expect(store.state.logs.length).toBe(1);
    expect(store.state.logs[0].emissions).toBe(3.6);

    // 2. Imperial distance (miles conversion)
    const resMiles = processAssistantMessage('I drove 10 miles today', store);
    expect(resMiles.success).toBe(true);
    // 10 miles = 16.1 km
    expect(resMiles.action.value).toBe(16.1);
    expect(store.state.logs.length).toBe(2);
  });

  test('Parses and logs diet choice commands', () => {
    const resVegan = processAssistantMessage('Ate vegan lunch', store);
    expect(resVegan.success).toBe(true);
    expect(resVegan.action).toEqual(expect.objectContaining({
      category: 'diet',
      value: 1,
      subtype: 'vegan'
    }));
    expect(store.state.logs[0].emissions).toBe(2.3); // vegan factor
  });

  test('Parses and logs energy consumption commands', () => {
    const resEnergy = processAssistantMessage('I used 15 kWh of electricity', store);
    expect(resEnergy.success).toBe(true);
    expect(resEnergy.action).toEqual(expect.objectContaining({
      category: 'energy',
      value: 15,
      subtype: 'electricity_kwh'
    }));
    expect(store.state.logs[0].emissions).toBe(15 * 0.40); // 6 kg CO2e
  });

  test('Responds gracefully to unsupported queries', () => {
    const resUnknown = processAssistantMessage('What is the weather today?', store);
    expect(resUnknown.success).toBe(false);
    expect(resUnknown.text).toContain("I couldn't quite parse that action");
    expect(store.state.logs.length).toBe(0);
  });
});
