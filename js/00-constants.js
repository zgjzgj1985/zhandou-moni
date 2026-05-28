// Source: battle-simple.html lines 559-596
const MAX_ENERGY = 10;

const DEBUG_MODE = false;
const debugLog = (...args) => { if (DEBUG_MODE) debugLog(...args); };

const TYPE_CHART = {
  grass: { fire: 0.5, water: 2, grass: 0.5, electric: 1, ice: 1, poison: 0.5, rock: 2 },
  fire: { fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 2, rock: 0.5, psychic: 1, dragon: 1 },
  water: { fire: 2, water: 0.5, grass: 0.5, electric: 0.5, ice: 1, rock: 2, dragon: 1 },
  electric: { fire: 1, water: 2, grass: 0.5, electric: 0.5, ice: 1, rock: 0, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 0.5, rock: 1, dragon: 1 },
  rock: { fire: 2, water: 0.5, grass: 0.5, electric: 1, ice: 2, rock: 1, flying: 2 },
  psychic: { fire: 1, water: 1, grass: 1, electric: 1, ice: 1, psychic: 0.5, dragon: 1 },
  dragon: { fire: 1, water: 1, grass: 1, electric: 1, ice: 1, psychic: 2, dragon: 2 }
};

const ENERGY_COST = {
  tackle: 0,
  low: 1,
  medium: 2,
  high: 3,
  ultra: 4,
  ultimate: 5,
  mega: 6
};

function getEnergyText(cost) {
  if (cost === 0) return '免费';
  return cost + '能量';
}
