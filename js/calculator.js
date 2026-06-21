/**
 * @fileoverview Carbon calculator engine using standard EPA/DEFRA emission factors.
 * Provides functions to calculate annual profile footprint and daily log footprint.
 */

// Emission Factors (in kg CO2e per unit)
export const EMISSION_FACTORS = {
  transport: {
    gasoline_car: 0.18,      // per km
    electric_car: 0.05,      // per km (assumes national grid average)
    public_transport: 0.04,  // per km (bus or train average)
    bicycle: 0.0,            // per km
    walking: 0.0,            // per km
    flight_short: 150.0,     // per short-haul flight (<3 hours)
    flight_long: 800.0       // per long-haul flight (>3 hours)
  },
  energy: {
    electricity_kwh: 0.40,   // per kWh
    gas_kwh: 0.18,           // per kWh
    heating_oil_kwh: 0.26    // per kWh
  },
  diet: {
    meat_heavy: 7.2,         // per day (2628 kg/year)
    balanced: 4.6,           // per day (1679 kg/year)
    vegetarian: 3.2,         // per day (1168 kg/year)
    vegan: 2.3               // per day (840 kg/year)
  },
  waste: {
    high: 5.4,               // per day (1971 kg/year)
    average: 2.7,            // per day (985.5 kg/year)
    minimal: 1.1             // per day (401.5 kg/year)
  }
};

/**
 * @typedef {Object} TransportProfile
 * @property {string} type - 'gasoline_car' | 'electric_car' | 'public_transport' | 'none'
 * @property {number} distance - Annual distance in km
 * @property {number} flightsShort - Number of short flights per year
 * @property {number} flightsLong - Number of long flights per year
 */

/**
 * @typedef {Object} EnergyProfile
 * @property {number} electricity - Annual electricity consumption in kWh
 * @property {number} gas - Annual gas consumption in kWh
 * @property {number} cleanEnergyRatio - Ratio of energy from renewable sources (0 to 1)
 */

/**
 * @typedef {Object} UserProfile
 * @property {TransportProfile} transport
 * @property {EnergyProfile} energy
 * @property {string} diet - 'meat_heavy' | 'balanced' | 'vegetarian' | 'vegan'
 * @property {string} waste - 'high' | 'average' | 'minimal'
 */

/**
 * Calculates the annual carbon footprint breakdown based on user profile.
 * All outputs are in kg CO2e per year.
 * 
 * @param {UserProfile} profile - The user profile input
 * @returns {Object} Detailed breakdown of yearly emissions
 */
export function calculateProfileFootprint(profile) {
  if (!profile) {
    return { transport: 0, energy: 0, diet: 0, waste: 0, total: 0 };
  }

  // 1. Transport calculations
  let transportEmissions = 0;
  const t = profile.transport || {};
  const tType = t.type || 'none';
  const tDist = Math.max(0, Number(t.distance) || 0);
  const factor = EMISSION_FACTORS.transport[tType] || 0;
  transportEmissions += tDist * factor;

  const fShort = Math.max(0, Number(t.flightsShort) || 0);
  const fLong = Math.max(0, Number(t.flightsLong) || 0);
  transportEmissions += fShort * EMISSION_FACTORS.transport.flight_short;
  transportEmissions += fLong * EMISSION_FACTORS.transport.flight_long;

  // 2. Energy calculations
  let energyEmissions = 0;
  const e = profile.energy || {};
  const elec = Math.max(0, Number(e.electricity) || 0);
  const gas = Math.max(0, Number(e.gas) || 0);
  const cleanRatio = Math.min(1, Math.max(0, Number(e.cleanEnergyRatio) || 0));

  // Clean energy ratio only offsets electricity emissions
  energyEmissions += elec * EMISSION_FACTORS.energy.electricity_kwh * (1 - cleanRatio);
  energyEmissions += gas * EMISSION_FACTORS.energy.gas_kwh;

  // 3. Diet calculations
  const dietType = profile.diet || 'balanced';
  const dietFactor = EMISSION_FACTORS.diet[dietType] || EMISSION_FACTORS.diet.balanced;
  const dietEmissions = dietFactor * 365;

  // 4. Waste/Consumption calculations
  const wasteType = profile.waste || 'average';
  const wasteFactor = EMISSION_FACTORS.waste[wasteType] || EMISSION_FACTORS.waste.average;
  const wasteEmissions = wasteFactor * 365;

  const total = transportEmissions + energyEmissions + dietEmissions + wasteEmissions;

  return {
    transport: Math.round(transportEmissions * 10) / 10,
    energy: Math.round(energyEmissions * 10) / 10,
    diet: Math.round(dietEmissions * 10) / 10,
    waste: Math.round(wasteEmissions * 10) / 10,
    total: Math.round(total * 10) / 10
  };
}

/**
 * Calculates emissions for a specific logged activity.
 * Returns emissions in kg CO2e.
 * 
 * @param {string} category - 'transport' | 'energy' | 'diet' | 'waste'
 * @param {number} value - The input value (km, kWh, or days/portions)
 * @param {string} [subtype] - The specific sub-type (e.g. 'gasoline_car')
 * @returns {number} Emissions in kg CO2e
 */
export function calculateActivityEmissions(category, value, subtype) {
  const amount = Math.max(0, Number(value) || 0);
  if (amount === 0) return 0;

  switch (category) {
    case 'transport': {
      const tType = subtype || 'gasoline_car';
      const factor = EMISSION_FACTORS.transport[tType] || 0;
      return amount * factor;
    }
    case 'energy': {
      const eType = subtype || 'electricity_kwh';
      const factor = EMISSION_FACTORS.energy[eType] || 0;
      return amount * factor;
    }
    case 'diet': {
      const dType = subtype || 'balanced';
      const factor = EMISSION_FACTORS.diet[dType] || 0;
      // If logging daily food, value is usually 1 day
      return amount * factor;
    }
    case 'waste': {
      const wType = subtype || 'average';
      const factor = EMISSION_FACTORS.waste[wType] || 0;
      return amount * factor;
    }
    default:
      return 0;
  }
}

/**
 * Generates personalized reduction tips based on the footprint breakdown.
 * 
 * @param {Object} breakdown - The carbon footprint breakdown
 * @returns {Array<Object>} List of personalized insights & tips
 */
export function generatePersonalizedTips(breakdown) {
  const tips = [];
  const { transport, energy, diet, waste, total } = breakdown;

  if (total === 0) return tips;

  const pctTransport = (transport / total) * 100;
  const pctEnergy = (energy / total) * 100;
  const pctDiet = (diet / total) * 100;
  const pctWaste = (waste / total) * 100;

  // Global thresholds
  const avgTotalGlobal = 4700; // ~4.7 tonnes per capita worldwide

  if (total > avgTotalGlobal) {
    tips.push({
      category: 'general',
      severity: 'warning',
      title: 'Above Average Footprint',
      desc: `Your annual footprint (${(total / 1000).toFixed(1)} tonnes) is higher than the global per-capita average (~4.7 tonnes). Focus on your highest category below to start reducing.`
    });
  } else {
    tips.push({
      category: 'general',
      severity: 'success',
      title: 'Sustainable Path',
      desc: `Great job! Your annual footprint (${(total / 1000).toFixed(1)} tonnes) is below the global average. Let's optimize further to reach the climate-neutral target of <2.0 tonnes.`
    });
  }

  if (pctTransport > 30 && transport > 1000) {
    tips.push({
      category: 'transport',
      severity: 'info',
      title: 'Optimize Daily Travel',
      desc: 'Transport accounts for a major share of your emissions. Consider swapping 1-2 car trips weekly for cycling, walking, or public transit, or look into electric vehicles.'
    });
  }

  if (pctEnergy > 30 && energy > 1000) {
    tips.push({
      category: 'energy',
      severity: 'info',
      title: 'Upgrade Home Efficiency',
      desc: 'Home energy represents a large portion of your footprint. Switching to a 100% renewable energy provider, upgrading to LED bulbs, and installing smart thermostats can yield massive reductions.'
    });
  }

  if (pctDiet > 25 && diet > 1200) {
    tips.push({
      category: 'diet',
      severity: 'info',
      title: 'Transition Diet Choices',
      desc: 'Food is a significant source of emissions. Going vegetarian or vegan just 3 days a week can reduce your food-related emissions by up to 30%.'
    });
  }

  if (pctWaste > 25 && waste > 800) {
    tips.push({
      category: 'waste',
      severity: 'info',
      title: 'Reduce & Reuse',
      desc: 'Consumption and waste emissions are notable. Prioritize purchasing secondhand items, repairing electronics, minimizing single-use packaging, and composting organic waste.'
    });
  }

  return tips;
}
