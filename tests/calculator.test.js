/**
 * @fileoverview Calculator Unit Tests
 */

import { 
  calculateProfileFootprint, 
  calculateActivityEmissions, 
  generatePersonalizedTips,
  EMISSION_FACTORS 
} from '../js/calculator.js';

describe('Calculator Module Tests', () => {
  
  describe('Profile Footprint Calculations', () => {
    test('Calculates zero emissions for empty profile data', () => {
      const emptyProfile = {
        transport: { type: 'none', distance: 0, flightsShort: 0, flightsLong: 0 },
        energy: { electricity: 0, gas: 0, cleanEnergyRatio: 0 },
        diet: 'vegan',
        waste: 'minimal'
      };

      const result = calculateProfileFootprint(emptyProfile);
      
      // Diet: vegan = 2.3 * 365 = 839.5
      // Waste: minimal = 1.1 * 365 = 401.5
      // Total: 839.5 + 401.5 = 1241
      expect(result.transport).toBe(0);
      expect(result.energy).toBe(0);
      expect(result.diet).toBe(839.5);
      expect(result.waste).toBe(401.5);
      expect(result.total).toBe(1241);
    });

    test('Calculates typical user profile emissions accurately', () => {
      const profile = {
        transport: {
          type: 'gasoline_car',
          distance: 10000,
          flightsShort: 2,
          flightsLong: 1
        },
        energy: {
          electricity: 3000,
          gas: 4000,
          cleanEnergyRatio: 0.5 // 50% renewable offset
        },
        diet: 'balanced',
        waste: 'average'
      };

      const result = calculateProfileFootprint(profile);

      // Calculations:
      // Transport:
      //   car: 10000 * 0.18 = 1800
      //   flightsShort: 2 * 150 = 300
      //   flightsLong: 1 * 800 = 800
      //   Total transport: 2900
      expect(result.transport).toBe(2900);

      // Energy:
      //   elec: 3000 * 0.40 * (1 - 0.5) = 600
      //   gas: 4000 * 0.18 = 720
      //   Total energy: 1320
      expect(result.energy).toBe(1320);

      // Diet:
      //   balanced: 4.6 * 365 = 1679
      expect(result.diet).toBe(1679);

      // Waste:
      //   average: 2.7 * 365 = 985.5
      expect(result.waste).toBe(985.5);

      // Total: 2900 + 1320 + 1679 + 985.5 = 6884.5
      expect(result.total).toBe(6884.5);
    });
  });

  describe('Activity Calculations', () => {
    test('Calculates individual activity emissions correctly', () => {
      // Transport: gasoline car
      const transportGas = calculateActivityEmissions('transport', 100, 'gasoline_car');
      expect(transportGas).toBe(100 * EMISSION_FACTORS.transport.gasoline_car);

      // Transport: electric car
      const transportElec = calculateActivityEmissions('transport', 100, 'electric_car');
      expect(transportElec).toBe(100 * EMISSION_FACTORS.transport.electric_car);

      // Transport: public transit
      const transportTransit = calculateActivityEmissions('transport', 50, 'public_transport');
      expect(transportTransit).toBe(50 * EMISSION_FACTORS.transport.public_transport);

      // Energy: electricity
      const electricity = calculateActivityEmissions('energy', 200, 'electricity_kwh');
      expect(electricity).toBe(200 * EMISSION_FACTORS.energy.electricity_kwh);

      // Diet: vegetarian
      const dietVeg = calculateActivityEmissions('diet', 1, 'vegetarian');
      expect(dietVeg).toBe(1 * EMISSION_FACTORS.diet.vegetarian);
    });

    test('Returns 0 for invalid inputs or negative numbers', () => {
      expect(calculateActivityEmissions('transport', -50, 'gasoline_car')).toBe(0);
      expect(calculateActivityEmissions('energy', 0, 'electricity_kwh')).toBe(0);
      expect(calculateActivityEmissions('unknown', 100)).toBe(0);
    });
  });

  describe('Personalized Tips Generation', () => {
    test('Generates warnings for high footprint profiles', () => {
      const highBreakdown = {
        transport: 3000,
        energy: 2500,
        diet: 1800,
        waste: 1000,
        total: 8300
      };

      const tips = generatePersonalizedTips(highBreakdown);
      
      // Should include high footprint warning
      const generalTip = tips.find(t => t.category === 'general');
      expect(generalTip).toBeDefined();
      expect(generalTip.severity).toBe('warning');

      // Transport is > 30% of total (3000 / 8300 = 36%)
      const transportTip = tips.find(t => t.category === 'transport');
      expect(transportTip).toBeDefined();

      // Energy is > 30% of total (2500 / 8300 = 30.1%)
      const energyTip = tips.find(t => t.category === 'energy');
      expect(energyTip).toBeDefined();
    });

    test('Generates success tip for clean profiles', () => {
      const lowBreakdown = {
        transport: 100,
        energy: 150,
        diet: 840,
        waste: 400,
        total: 1490
      };

      const tips = generatePersonalizedTips(lowBreakdown);
      const generalTip = tips.find(t => t.category === 'general');
      expect(generalTip).toBeDefined();
      expect(generalTip.severity).toBe('success');
    });
  });
});
