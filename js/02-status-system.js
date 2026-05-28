// Source: battle-simple.html lines 790-873
const STATUS_EFFECT_MAP = {
  'burn': { effect: 'burn', burnStacks: 5, burnChance: null },
  'burn_mark': { effect: 'burnMark', burnMarkPower: 40 },
  'flow': { flowEffect: true, speedBoost: 1, duration: 2 },
  'clear_spring': { clearSpringEffect: true, clearSpringDuration: 3 },
  'water_soak': { waterSoakEffect: true, waterSoakPower: 1, waterSoakDuration: 2, waterSoakMaxStacks: 6 },
  'muddy': { muddyEffect: true, muddyMaxStacks: 3 },
  'paralysis': { effect: 'paralyze' },
  'confusion': { effect: 'confuse' },
  'frozen': { effect: 'freeze' },
  'wither': { wither: true, witherPower: 10 },
  'fire_shield': { type: 'shield', damageReduction: 0.55 },
  'rainy_day': { rainyDayEffect: true, rainyDayDuration: 3, rainyDayPowerBoost: 0.5 },
  'fragrant_environment': { effect: 'fragrantEnvironment' },
  'parasitic_seed': { parasiticSeed: true, parasiticSeedDrain: 0.06, parasiticSeedTurns: 4 },
  'counter_stance': { effect: 'counterStance', reflectDamage: 0.6 },
  'weakness': { weaknessEffect: true, weaknessDuration: 2 },
  'light_gather': { lightGather: 1 },
  'root_bound': { effect: 'rootBound' },
  'entangle': { effect: 'entangle' },
  'slow': { effect: 'slow' },
  'burn_mark_custom': { effect: 'burnMark', burnMarkPower: 40 },
  'wall_of_flames': { type: 'shield', damageReduction: 0.5 },
  'combustion_mark': { effect: 'combustionMark' },
  'entangle_on_hit': { effect: 'entangleOnHit' },
  'drowning': { effect: 'drowning' },
  'water_guard': { effect: 'waterGuard' },
  'steam_burn': { effect: 'steamBurn', steamBurnPower: 30 },
  'flame_charge': { effect: 'flameCharge' },
  'freeze_tag': { effect: 'freezeTag' }
};

function getStatusEffectConfig(statusId) {
  return STATUS_EFFECT_MAP[statusId] || null;
}

function applyAddStatusEffect(effectData) {
  const result = {};
  const statusId = effectData.statusId;
  const stacks = effectData.stacks || 1;
  const duration = effectData.duration || 2;
  const chance = effectData.chance || 1;

  const statusConfig = getStatusEffectConfig(statusId);
  if (!statusConfig) {
    console.warn(`未找到状态配置: ${statusId}`);
    return result;
  }

  Object.assign(result, statusConfig);

  if (effectData.stacks !== undefined) {
    if (statusConfig.burnStacks !== undefined) {
      result.burnStacks = effectData.stacks;
    }
    if (statusConfig.waterSoakEffect) {
      result.waterSoakPower = effectData.stacks;
    }
  }

  if (effectData.damage !== undefined) {
    if (statusConfig.burnMarkPower !== undefined) {
      result.burnMarkPower = effectData.damage;
    }
    if (statusConfig.witherPower !== undefined) {
      result.witherPower = effectData.damage;
    }
  }

  if (effectData.percent !== undefined) {
    if (statusConfig.parasiticSeed) {
      result.parasiticSeedDrain = effectData.percent / 100;
    }
    if (statusConfig.clearSpringEffect) {
      result.healPercent = effectData.percent / 100;
    }
  }

  if (effectData.chance !== undefined && effectData.chance < 1) {
    if (statusConfig.burnStacks !== undefined) {
      result.burnChance = effectData.chance;
    }
  }

  return result;
}
