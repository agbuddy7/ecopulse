/**
 * @fileoverview EcoBot Assistant Engine.
 * Parses natural language input to perform carbon logging, offer green tips, and display status.
 */

import { EMISSION_FACTORS } from './calculator.js';

// Pre-defined conversational tips
const ECO_TIPS = {
  transport: [
    "🚲 Swapping short car trips (under 5 km) for walking or cycling saves 100% of emissions.",
    "🚇 Taking public transit instead of driving a gasoline car reduces travel emissions by up to 75%.",
    "🚗 If driving is necessary, carpooling with coworkers or neighbors cuts emissions in half."
  ],
  energy: [
    "🔌 Turning off electronics at the wall (standby power) saves up to 8% on electricity bills.",
    "🌡️ Lowering your thermostat by just 1°C in winter can reduce heating emissions by 10%.",
    "☀️ Switching to a green electricity plan or installing solar panels offsets electricity carbon to 0."
  ],
  diet: [
    "🥗 Eating a plant-based (vegan) diet for just one day saves ~5 kg of CO2e compared to a meat-heavy day.",
    "🌾 Buy local and seasonal produce to reduce the 'food miles' and transport carbon footprint.",
    "🍎 Plan meals ahead and store food properly to prevent waste; food rotting in landfills produces methane."
  ],
  waste: [
    "🎒 Always carry a reusable water bottle and shopping bag to eliminate single-use plastics.",
    "♻️ Sort waste diligently: recycling paper, glass, and metals uses significantly less energy than manufacturing fresh.",
    "🔧 Repair broken items instead of buying new ones. Extending an electronic device's lifespan by 2 years cuts its lifecycle footprint by 50%."
  ]
};

/**
 * Parses natural language messages and executes corresponding state changes or answers queries.
 * 
 * @param {string} rawMessage - User's input text
 * @param {Object} store - Instance of StateStore to execute actions on
 * @returns {Object} Output response message and metadata
 */
export function processAssistantMessage(rawMessage, store) {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return {
      text: "Hello! I am EcoBot, your sustainability assistant. Ask me how to reduce your footprint, or log activities directly (e.g., 'I drove 15 miles' or 'I ate vegetarian today').",
      success: false
    };
  }

  const message = rawMessage.trim().toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Simple Greetings
  if (/^(hi|hello|hey|greetings|yo|sup|good morning|good afternoon)\b/.test(message)) {
    return {
      text: "Hi there! 👋 I am EcoBot. I can help you log your daily activities and offer green tips. What did you do today? (e.g., 'drove 20 km', 'ate vegan')",
      success: true
    };
  }

  // 2. Status requests
  if (/\b(status|score|streak|progress|dashboard)\b/.test(message) || (/\b(carbon|report)\b/.test(message) && /\b(show|check|get|my|current|what is)\b/.test(message))) {
    const stats = store.getDailyFootprint(todayStr);
    const streak = store.state.streak;
    return {
      text: `📊 **Your Carbon Report for Today:**\n- **Transport:** ${stats.transport} kg CO2e\n- **Energy:** ${stats.energy} kg CO2e\n- **Diet:** ${stats.diet} kg CO2e\n- **Waste:** ${stats.waste} kg CO2e\n- **Habit Savings:** -${stats.savings} kg CO2e\n**Net Total:** ${stats.total} kg CO2e.\n\n🔥 **Active Streak:** ${streak} day${streak === 1 ? '' : 's'}. Keep up the great work!`,
      success: true
    };
  }

  // 3. Tip queries
  if (/\b(tip|tips|suggestion|suggestions|advice|help|how to|reduce|save|offset)\b/.test(message)) {
    let category = 'general';
    if (/\b(car|drive|travel|flight|fly|bus|train|transit|transport)\b/.test(message)) category = 'transport';
    else if (/\b(home|electricity|power|gas|heat|energy|light|ac)\b/.test(message)) category = 'energy';
    else if (/\b(food|diet|eat|meat|vegan|vegetarian|beef|chicken|meal)\b/.test(message)) category = 'diet';
    else if (/\b(waste|trash|garbage|recycle|plastic|paper|compost)\b/.test(message)) category = 'waste';

    if (category === 'general') {
      const allTips = [...ECO_TIPS.transport, ...ECO_TIPS.energy, ...ECO_TIPS.diet, ...ECO_TIPS.waste];
      const randomTips = allTips.sort(() => 0.5 - Math.random()).slice(0, 3);
      return {
        text: `💡 **Eco Tips to reduce your footprint:**\n\n${randomTips.join('\n\n')}\n\n*Try asking for specific advice like 'energy tips' or 'diet tips'!*`,
        success: true
      };
    } else {
      const tips = ECO_TIPS[category];
      return {
        text: `💡 **Tips for reducing ${category} emissions:**\n\n${tips.join('\n\n')}`,
        success: true
      };
    }
  }

  // 4. Activity logging parsing

  // Extract any numerical value in the message
  const numberMatch = message.match(/\b(\d+(?:\.\d+)?)\b/);
  const value = numberMatch ? parseFloat(numberMatch[1]) : null;

  // A. Transport check
  if (/\b(drive|drove|car|commute|ride|rode|bus|train|transit|subway|metro|flight|flew|fly|plane)\b/.test(message)) {
    let subtype = 'gasoline_car';
    let activityValue = value || 0; // Default to 0 if not specified

    // Determine subtype
    if (/\b(electric|ev|tesla)\b/.test(message)) {
      subtype = 'electric_car';
    } else if (/\b(bus|train|transit|subway|metro|rail|public)\b/.test(message)) {
      subtype = 'public_transport';
    } else if (/\b(bike|bicycle|cycle|walk|foot)\b/.test(message)) {
      subtype = 'bicycle';
    } else if (/\b(flight|flew|fly|plane|airplane)\b/.test(message)) {
      // Flights are counted in number of flights
      subtype = activityValue > 4 ? 'flight_long' : 'flight_short';
      if (activityValue === 0) activityValue = 1; // Default to 1 flight
    }

    // Convert miles to km if specified
    if (/\b(mile|miles|mi)\b/.test(message) && subtype !== 'flight_short' && subtype !== 'flight_long') {
      activityValue = Math.round(activityValue * 1.60934 * 10) / 10;
    }

    if (activityValue <= 0 && (subtype === 'flight_short' || subtype === 'flight_long')) {
      activityValue = 1;
    }

    if (activityValue > 0) {
      const log = store.addLog(todayStr, 'transport', activityValue, subtype, `Logged via EcoBot: "${rawMessage.substring(0, 40)}"`);
      const factorText = subtype.replace('_', ' ');
      const unitText = (subtype === 'flight_short' || subtype === 'flight_long') ? 'flight(s)' : 'km';
      return {
        text: `✅ **Logged Transport Activity!**\nAdded **${activityValue} ${unitText}** of **${factorText}**.\nEmissions calculated: **${log.emissions} kg CO2e** for today.`,
        success: true,
        action: { category: 'transport', value: activityValue, subtype, logId: log.id }
      };
    } else {
      return {
        text: "It looks like you're talking about travel, but I couldn't find a distance. Try saying: *'I drove 15 km'* or *'I rode my bike 5 miles'*.",
        success: false
      };
    }
  }

  // B. Diet check
  if (/\b(eat|ate|diet|meal|food|breakfast|lunch|dinner|snack|vegan|vegetarian|veggie|meat|beef|chicken|pork)\b/.test(message)) {
    let subtype = 'balanced';
    if (/\b(vegan|plant-based|plant based)\b/.test(message)) {
      subtype = 'vegan';
    } else if (/\b(vegetarian|veggie)\b/.test(message)) {
      subtype = 'vegetarian';
    } else if (/\b(meat|beef|pork|steak|lamb|mutton)\b/.test(message)) {
      subtype = 'meat_heavy';
    }

    // Value represents 1 day/portion
    const log = store.addLog(todayStr, 'diet', 1, subtype, `Logged via EcoBot: "${rawMessage.substring(0, 40)}"`);
    const dietText = subtype.replace('_', ' ');
    return {
      text: `✅ **Logged Diet Choice!**\nRegistered 1 day of **${dietText}** eating.\nEmissions calculated: **${log.emissions} kg CO2e** for today.`,
      success: true,
      action: { category: 'diet', value: 1, subtype, logId: log.id }
    };
  }

  // C. Energy check
  if (/\b(electric|electricity|power|gas|kwh|meter|heating|oil)\b/.test(message)) {
    let subtype = 'electricity_kwh';
    if (/\b(gas)\b/.test(message)) {
      subtype = 'gas_kwh';
    } else if (/\b(oil|heating oil)\b/.test(message)) {
      subtype = 'heating_oil_kwh';
    }

    if (value && value > 0) {
      const log = store.addLog(todayStr, 'energy', value, subtype, `Logged via EcoBot: "${rawMessage.substring(0, 40)}"`);
      const energyLabel = subtype === 'electricity_kwh' ? 'Electricity' : 'Gas';
      return {
        text: `✅ **Logged Energy Consumption!**\nAdded **${value} kWh** of **${energyLabel}**.\nEmissions calculated: **${log.emissions} kg CO2e** for today.`,
        success: true,
        action: { category: 'energy', value, subtype, logId: log.id }
      };
    } else {
      return {
        text: "It looks like you're talking about energy, but I couldn't find a value in kWh. Try saying: *'I used 12 kWh of electricity today'*.",
        success: false
      };
    }
  }

  // D. Waste check
  if (/\b(waste|recycle|garbage|compost|trash|landfill)\b/.test(message)) {
    let subtype = 'average';
    if (/\b(recycle|compost|minimal|zero waste|no waste)\b/.test(message)) {
      subtype = 'minimal';
    } else if (/\b(heavy|lots|lot of waste|high waste)\b/.test(message)) {
      subtype = 'high';
    }

    const log = store.addLog(todayStr, 'waste', 1, subtype, `Logged via EcoBot: "${rawMessage.substring(0, 40)}"`);
    const wasteLabel = subtype === 'minimal' ? 'minimal waste / recycled' : `${subtype} waste`;
    return {
      text: `✅ **Logged Waste Footprint!**\nRegistered 1 day of **${wasteLabel}**.\nEmissions calculated: **${log.emissions} kg CO2e** for today.`,
      success: true,
      action: { category: 'waste', value: 1, subtype, logId: log.id }
    };
  }

  // 5. Default fallback
  return {
    text: "🔍 **I couldn't quite parse that action.**\n\nI can help you log activities. Try saying:\n- 🚗 *'I drove 25 km today'* (or *'15 miles'*)\n- 🥗 *'I ate a vegan meal'* or *'ate vegetarian'*\n- ⚡ *'I used 10 kWh of electricity'*\n- 💡 *'Give me transit tips'* or *'tips for food'*",
    success: false
  };
}
