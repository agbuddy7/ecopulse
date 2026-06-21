/**
 * @fileoverview Declarative configuration for the Daily Log form's per-category fields.
 *
 * Previously, app.js had two separate if/else chains for transport/energy/diet/waste:
 * one to build the dynamic form fields, and a second to read values back out on submit.
 * Both had to be kept in sync by hand. This file is now the single source of truth —
 * forms.js renders from it and reads from it, so there is exactly one place to edit
 * if a category's fields ever change.
 */

export const LOG_CATEGORIES = {
  transport: {
    selectId: 'log-sub-transport',
    selectLabel: 'Vehicle/Transit Mode',
    options: [
      { value: 'gasoline_car', label: 'Gasoline Car' },
      { value: 'electric_car', label: 'Electric Vehicle (EV)' },
      { value: 'public_transport', label: 'Public Transit (Bus/Train)' },
      { value: 'bicycle', label: 'Bicycle' },
      { value: 'walking', label: 'Walking' },
      { value: 'flight_short', label: 'Short flight (&lt;3 hrs)' },
      { value: 'flight_long', label: 'Long flight (&gt;3 hrs)' }
    ],
    // Numeric value field. For transport, it's conditionally hidden when a flight is selected
    // (flights are logged as a count of 1, not a distance).
    valueField: {
      id: 'log-value-transport',
      label: 'Distance traveled (km)',
      defaultValue: 10,
      isHiddenForSubtype: (subtype) => subtype.startsWith('flight'),
      hiddenValue: 1
    }
  },
  energy: {
    selectId: 'log-sub-energy',
    selectLabel: 'Energy Category',
    options: [
      { value: 'electricity_kwh', label: 'Electricity Usage' },
      { value: 'gas_kwh', label: 'Natural Gas' }
    ],
    valueField: {
      id: 'log-value-energy',
      label: 'Amount (kWh)',
      defaultValue: 5,
      isHiddenForSubtype: () => false,
      hiddenValue: null
    }
  },
  diet: {
    selectId: 'log-sub-diet',
    selectLabel: "Today's Eating Habits",
    options: [
      { value: 'vegan', label: 'Strict Plant-based (Vegan)' },
      { value: 'vegetarian', label: 'Vegetarian (No meat)' },
      { value: 'balanced', label: 'Balanced (Average meat)' },
      { value: 'meat_heavy', label: 'Meat Lover (High beef/lamb)' }
    ],
    // No numeric field: a diet log always represents "1 day" of that diet.
    valueField: null
  },
  waste: {
    selectId: 'log-sub-waste',
    selectLabel: 'Waste Generation',
    options: [
      { value: 'minimal', label: 'Minimal / High Recycling & Composting' },
      { value: 'average', label: 'Average Household Waste' },
      { value: 'high', label: 'High Packaging / Non-recycler' }
    ],
    // No numeric field: a waste log always represents "1 day" of that waste level.
    valueField: null
  }
};
