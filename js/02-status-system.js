// Source: battle-simple.html lines 790-873
const STATUS_EFFECT_MAP = {
  // === 原生条目 ===
  'burn':             { effect: 'burn',              burnStacks: 5, burnChance: null },
  'burn_mark':        { effect: 'burn_mark',         burnMarkPower: 40 },
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
  'water_guard':      { effect: 'water_guard' },
  'steam_burn':       { effect: 'steamBurn',         steamBurnPower: 30 },
  'flame_charge':     { effect: 'flameCharge' },
  'freeze_tag':       { effect: 'freezeTag' },
  'wet':              { effect: 'wet',               waterSoakEffect: true, waterSoakPower: 1, waterSoakDuration: 2, waterSoakMaxStacks: 6 },

  // === 火系负面效果 ===
  'overheat_penalty': { effect: 'weaknessEffect', weaknessEffect: true, weaknessDuration: 2 },

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
  'static_body':       { paralysis: true, effect: 'static_charge' },  // 静电释放
  'charge':            { charge: true },                               // 蓄电
  'electric_deflect':  { electricDeflect: true, effect: 'electric_deflect' }, // 电磁偏转

  // === 冰系 ===
  'extreme_cold_mark': { extremeColdMark: true },
  'ice_armor':         { frostArmor: true, effect: 'frost_armor' },   // 冰霜护甲
  'ice_wall':          { iceWall: true, effect: 'ice_wall' },         // 冰墙
  'frost_mark':        { frostMark: true, effect: 'frost_mark' },     // 霜印
  'frost':             { frost: true, effect: 'freeze' },             // 冰霜
  'frozen_land_env':   { frozenLandEffect: true, effect: 'frozen_land' }, // 冻土环境

  // === 超能系 ===
  'mind_body':         { effect: 'mind_shield',      mindShield: true },
  'psychic_terrain':   { psychicTerrain: true },
  'psychic_noise':     { psychicNoise: true },

  // === 地系 ===
  'sandstorm':         { sandstormEffect: true },
  'underground':       { undergroundEffect: true, immuneGround: true },
  'sand_tomb':         { sandTombEffect: true,       sandTombDamage: 0.04 },

  // === 龙系 ===
  'dragon_power_loss': { dragonPowerLoss: true },

  // === 补漏 ===
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

  // 先执行 switch（设置特定状态的效果类型）
  // 必须放在 Object.assign 之前，确保 switch 设置的值不被覆盖
  switch (statusId) {
    case 'combustion_mark': result.combustionMark = true; break;
    case 'burn_mark':       result.effect = 'burn_mark'; break;
    case 'flame_charge':    result.flameCharge = true; break;
    case 'blaze_will':      result.blazeWillEffect = true; break;
    case 'overheat_penalty': result.weaknessEffect = true; result.weaknessDuration = effectData.stacks || 2; break;
    case 'drowning':        result.drowningEffect = true; break;
    case 'steam_burn':      result.effect = 'steamBurn'; result.steamBurnChance = chance; break;
    case 'water_guard':     result.effect = 'water_guard'; break;
    // 修复：添加被遗漏的状态映射
    case 'grass_power':     result.lightGather = 1; break;            // fiber_weave
    case 'entangle_on_hit': result.effect = 'entangle_on_hit'; result.damageReduction = 0.5; break;  // vine_armor
    case 'rainy_day':      result.rainyDayEffect = true; break;      // rainy_day
  }

  // 合并状态配置（必须保留 effect / blazeWillEffect / fireBodyEffect 等执行标记）
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
