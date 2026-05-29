// Source: battle-simple.html lines 790-873
const STATUS_EFFECT_MAP = {
  // === 原生条目 ===
  'burn':             { effect: 'burn',              burnStacks: 5, burnChance: null },
  'burn_mark':        { effect: 'burnMark',          burnMarkPower: 40 },
  'flow':             { flowEffect: true,            speedBoost: 1, duration: 2 },
  'clear_spring':     { clearSpringEffect: true,    clearSpringDuration: 3 },
  'water_soak':       { waterSoakEffect: true,      waterSoakPower: 1, waterSoakDuration: 2, waterSoakMaxStacks: 6 },
  'muddy':            { muddyEffect: true,          muddyMaxStacks: 3 },
  'paralysis':        { effect: 'paralyze' },
  'confusion':        { effect: 'confuse' },
  'frozen':           { effect: 'freeze' },
  'wither':           { wither: true,                witherPower: 10 },
  'fire_shield':      { type: 'shield',              damageReduction: 0.55, fireShield: true, reflectDamage: 0.3 },
  'rainy_day':        { rainyDayEffect: true,        rainyDayDuration: 3, rainyDayPowerBoost: 0.5 },
  'fragrant_environment': { effect: 'fragrantEnvironment' },
  'parasitic_seed':   { parasiticSeed: true,         parasiticSeedDrain: 0.06, parasiticSeedTurns: 4 },
  'counter_stance':   { effect: 'counterStance',     reflectDamage: 0.6 },
  'weakness':         { weaknessEffect: true,        weaknessDuration: 2 },
  'light_gather':     { lightGather: 1 },
  'root_bound':       { effect: 'rootBound' },
  'entangle':         { effect: 'entangle' },
  'slow':             { effect: 'slow' },
  'burn_mark_custom': { effect: 'burnMark',          burnMarkPower: 40 },
  'wall_of_flames':   { damageReduction: 0.7, wallOfFlamesPower: 40 },
  'combustion_mark':  { effect: 'combustionMark' },
  'entangle_on_hit':  { effect: 'entangleOnHit' },
  'drowning':         { effect: 'drowning' },
  'water_guard':      { effect: 'waterGuard' },
  'steam_burn':       { effect: 'steamBurn',         steamBurnPower: 30 },
  'flame_charge':     { effect: 'flameCharge' },
  'freeze_tag':       { effect: 'freezeTag' },
  'wet':              { effect: 'wet',               waterSoakEffect: true, waterSoakPower: 1, waterSoakDuration: 2, waterSoakMaxStacks: 6 },

  // === 火系负面效果 ===
  'overheat_penalty': { effect: 'weaknessEffect',   weaknessEffect: true, weaknessDuration: 2 },

  // === 草系 ===
  'flame_body':       { effect: 'flame_body',       fireBodyEffect: true },
  'fragrant_env':     { effect: 'fragrantEnvironment' },
  'parasite':         { parasiticSeed: true,         parasiticSeedDrain: 0.06, parasiticSeedTurns: 4 },
  'nutrient':         { nutrientEffect: true },
  'defense_up':       { effect: 'defense_up' },
  'blaze_will':       { blazeWillEffect: true, attackBoost: 1, spAtkBoost: 1, fireDamageBoost: 0.25 },
  'vine_body':        { vineBody: true,              vineBodyReduction: 0.5 },

  // === 电系 ===
  'electric_field_buff': { electricFieldEffect: true },
  'static':            { staticMark: true },

  // === 冰系 ===
  'extreme_cold_mark': { extremeColdMark: true },
  'ice_armor':         { effect: 'frost_armor',      frostArmor: true },
  'ice_wall':          { effect: 'ice_wall' },
  'frost_mark':        { effect: 'frost_mark' },
  'frozen_land_env':   { frozenLandEffect: true },

  // === 超能系 ===
  'mind_body':         { effect: 'mind_shield',      mindShield: true },
  'psychic_terrain':   { psychicTerrain: true },
  'psychic_noise':     { psychicNoise: true },

  // === 地系 ===
  'sandstorm':         { sandstormEffect: true },
  'underground':       { undergroundEffect: true },
  'sand_tomb':         { sandTombEffect: true,       sandTombDamage: 0.04 },

  // === 龙系 ===
  'dragon_power_loss': { dragonPowerLoss: true },

  // === 通用/其他 ===
  'overheat_penalty':  { weaknessEffect: true,        weaknessDuration: 2 },

  // === 补漏（映射到已有执行分支） ===
  'static_body':       { effect: 'static_charge' },   // static_charge 执行逻辑已存在于 skill-execution.js
  'charge':            { chargeEffect: true },
  'electric_deflect':  { effect: 'electric_deflect' }, // electric_deflect 执行逻辑已存在
  'frost':            { effect: 'freeze' },
  'dragon_guard':     { effect: 'dragon_guard' }      // dragon_guard 执行逻辑已存在
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

  // 合并状态配置（必须保留 effect / blazeWillEffect / fireBodyEffect 等执行标记）
  Object.assign(result, statusConfig);

  // 确保 statusConfig.effect 被正确传递（如 combustion_mark → effect:combustionMark）
  if (statusConfig.effect !== undefined) {
    result.effect = statusConfig.effect;
  }

  // 基于 statusId 设置执行标志（解决 effect 字段为 null 但需要特殊处理的情况）
  // 这些状态通过执行层的 if (skill.xxx) 分支处理，不依赖 effect 字段
  switch (statusId) {
    case 'combustion_mark': result.combustionMark = true; break;
    case 'burn_mark':       result.effect = 'burn_mark'; break;
    case 'flame_charge':    result.flameCharge = true; break;
    case 'blaze_will':      result.blazeWillEffect = true; break;
    case 'overheat_penalty': result.weaknessEffect = true; result.weaknessDuration = effectData.stacks || 2; break;
  }

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
