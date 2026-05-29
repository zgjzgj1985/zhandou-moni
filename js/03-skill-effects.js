// Source: battle-simple.html lines 726-789 + 1032-1510 + 1512-1830
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const REST_SKILL = {
  id: 'rest',
  name: '休息',
  type: 'energy',
  energyCost: 0,
  target: 'self',
  power: 5,
  element: null,
  strategy: 'self',
  effect: 'energy_restore',
  description: '休息恢复，回复5点能量'
};

function assignSkillsByElement(element, creatureId) {
  const elementMap = { rock: 'ground' };
  const mappedElement = elementMap[element] || element;

  const elementData = SKILLS_DB[mappedElement];
  if (!elementData) return [];

  const skills = [];

  skills.push({ ...REST_SKILL });

  if (elementData.attack && elementData.attack.length > 0) {
    const attackPool = shuffleArray(elementData.attack);
    const numAttack = Math.min(2, attackPool.length);
    for (let i = 0; i < numAttack; i++) {
      skills.push(convertSkillToBattleFormat(attackPool[i], mappedElement));
    }
  }

  if (elementData.defense && elementData.defense.length > 0) {
    const defPool = shuffleArray(elementData.defense);
    skills.push(convertSkillToBattleFormat(defPool[0], mappedElement));
  }

  if (elementData.support && elementData.support.length > 0) {
    const supPool = shuffleArray(elementData.support);
    skills.push(convertSkillToBattleFormat(supPool[0], mappedElement));
  }

  return skills;
}

function parseSingleEffect(effect) {
  const result = {};

  switch (effect.type) {
    case 'damage':
      if (effect.power !== undefined) {
        result.power = effect.power;
        if (effect.damageType === 'physical') {
          result.type = 'physical';
        } else if (effect.damageType === 'special') {
          result.type = 'special';
        }
      }
      if (effect.comboHits !== undefined) {
        result.comboHits = effect.comboHits;
        result.comboPower = effect.power;
        result.power = effect.power * effect.comboHits;
      }
      break;

    case 'heal':
      // 执行层统一规则：percent < 1 时直接使用（表示小数），percent >= 1 时除以 100（表示百分比）
      // 例如：0.5 → 50%，25 → 0.25
      const rawPercent = effect.percent || 0;
      result.healPercent = rawPercent < 1 ? rawPercent : rawPercent / 100;
      result.type = 'heal';
      break;

    case 'shield':
      result.type = 'shield';
      if (effect.reduction !== undefined) {
        result.damageReduction = effect.reduction;
      }
      if (effect.amount !== undefined) {
        result.power = effect.amount;
      }
      break;

    case 'add_status':
      const statusResult = applyAddStatusEffect(effect);
      Object.assign(result, statusResult);
      // 只有当 applyAddStatusEffect 没有返回任何属性时，才用 statusId 作为 effect 兜底
      if (effect.statusId && Object.keys(statusResult).length === 0) {
        result.effect = effect.statusId;
      }
      break;

    case 'buff':
      if (effect.stats) {
        if (effect.stats.attack !== undefined) result.attackBoost = effect.stats.attack;
        if (effect.stats.spAtk !== undefined) result.spAtkBoost = effect.stats.spAtk;
        if (effect.stats.speed !== undefined) result.speedBoost = effect.stats.speed;
        if (effect.stats.defense !== undefined) result.defenseBoost = effect.stats.defense;
        if (effect.stats.dragon_blood !== undefined) result.dragonBlood = effect.stats.dragon_blood;
      }
      if (effect.attack !== undefined) result.attackBoost = effect.attack;
      if (effect.spAtk !== undefined) result.spAtkBoost = effect.spAtk;
      if (effect.speed !== undefined) result.speedBoost = effect.speed;
      if (effect.defense !== undefined) result.defenseBoost = effect.defense;
      break;

    case 'debuff':
      if (effect.stats) {
        if (effect.stats.attack !== undefined) result.enemyAttackDebuff = effect.stats.attack;
        if (effect.stats.speed !== undefined) result.enemySpeedDebuff = effect.stats.speed;
        if (effect.stats.accuracy !== undefined) result.enemyAccuracyDebuff = effect.stats.accuracy;
      }
      // 处理速度降级（扎根之躯：速度-1级）
      if (effect.stat === 'speed' && effect.stages !== undefined) {
        result.speedBoost = effect.stages; // 负值表示降低
      }
      break;

    case 'buff_all':
      if (effect.stats) {
        if (effect.stats.attack !== undefined) result.attackBoost = effect.stats.attack;
        if (effect.stats.spAtk !== undefined) result.spAtkBoost = effect.stats.spAtk;
        if (effect.stats.speed !== undefined) result.speedBoost = effect.stats.speed;
        if (effect.stats.defense !== undefined) result.defenseBoost = effect.stats.defense;
        // blaze_will 等在 stats 里用下划线命名
        if (effect.stats.fire_damage_boost !== undefined) result.fireDamageBoost = effect.stats.fire_damage_boost;
      }
      if (effect.fireDamageBoost !== undefined) result.fireDamageBoost = effect.fireDamageBoost;
      if (effect.grassDamageBoost !== undefined) result.grassDamageBoost = effect.grassDamageBoost;
      if (effect.waterDamageBoost !== undefined) result.waterDamageBoost = effect.waterDamageBoost;
      break;

    case 'add_status':
      // 处理 add_status 效果，映射到对应的执行层字段
      if (effect.statusId === 'vine_body') {
        result.vineBody = true;
        result.damageReduction = 0.5;
      } else if (effect.statusId === 'counter_stance') {
        result.effect = 'counterStance';
        result.reflectDamage = 0.6;
      } else if (effect.statusId === 'root_bound') {
        result.effect = 'rootBound';
      } else if (effect.statusId === 'fragrant_env') {
        result.effect = 'fragrantEnvironment';
      } else if (effect.statusId === 'light_gather') {
        result.lightGather = 1;
      } else if (effect.statusId === 'burn_mark') {
        result.effect = 'burn_mark';
      } else if (effect.statusId === 'water_guard') {
        result.effect = 'water_guard';
      } else if (effect.statusId === 'static_body') {
        result.paralysis = true;
      } else if (effect.statusId === 'paralysis') {
        result.paralysis = true;
      } else if (effect.statusId === 'electric_deflect') {
        result.electricDeflect = true;
      } else if (effect.statusId === 'charge') {
        result.charge = true;
      } else if (effect.statusId === 'electric_field_buff') {
        result.electricFieldEffect = true;
      } else if (effect.statusId === 'static') {
        result.staticMark = true;
      } else if (effect.statusId === 'frost') {
        result.frost = true;
      } else if (effect.statusId === 'extreme_cold_mark') {
        result.extremeColdMark = true;
      } else if (effect.statusId === 'ice_armor') {
        result.effect = 'frost_armor';
      } else if (effect.statusId === 'ice_wall') {
        result.effect = 'ice_wall';
      } else if (effect.statusId === 'frost_mark') {
        result.frostMark = true;
      } else if (effect.statusId === 'frozen_land_env') {
        result.effect = 'frozen_land';
      } else if (effect.statusId === 'prophecy_mark') {
        // 预言标记：累积层数，增强存储力量等技能威力
        result.prophecyMark = true;
        result.prophecyMarkStacks = effect.stacks || 1;
      } else if (effect.statusId === 'mind_wound') {
        // 心灵创伤：攻击命中率下降
        result.mindWound = true;
      } else if (effect.statusId === 'forbidden') {
        // 禁忌：所有能力等级下降
        result.forbidden = true;
      } else if (effect.statusId === 'mind_body') {
        // 心灵护体：减伤+精神免疫
        result.mindShield = true;
      }
      break;

    case 'clear_buff':
      result.clearBuff = true;
      break;

    case 'add_fire_power':
      result.addFirePower = effect.value || 0;
      break;

    case 'light_gather':
      result.lightGather = effect.stacks || 1;
      break;

    case 'wither':
      result.wither = true;
      result.witherPower = effect.power || 10;
      break;

    case 'crit_guarantee':
      result.guaranteedCrit = true;
      break;

    case 'drowning':
      result.drowningEffect = true;
      result.drowningDuration = effect.duration || 3;
      break;

    case 'clear_debuff':
      result.clearDebuff = true;
      result.clearBuff = true;
      break;

    case 'energy_restore':
      result.energyRestore = effect.value || 0;
      break;

    case 'multi_hit':
      result.comboHits = effect.hits || 3;
      result.comboPower = effect.damage || 25;
      result.power = result.comboHits * result.comboPower;
      if (effect.burnChance !== undefined) {
        result.burnChance = effect.burnChance;
      }
      if (effect.burnStacks !== undefined) {
        result.burnStacks = effect.burnStacks;
      }
      if (effect.alwaysBurn) {
        result.burnChance = 1;
        result.burnStacks = effect.burnStacks || 1;
      }
      break;

    case 'self_debuff':
      if (effect.statusId === 'weakness') {
        result.weaknessEffect = true;
      }
      if (effect.statusId === 'dragon_power_loss') {
        result.dragonPowerLoss = true;
      }
      if (effect.stats) {
        if (effect.stats.attack !== undefined) result.attackBoost = -Math.abs(effect.stats.attack);
        if (effect.stats.spAtk !== undefined) result.spAtkBoost = -Math.abs(effect.stats.spAtk);
      }
      break;

    case 'damage_all':
      result.power = effect.power || 0;
      result.type = 'special';
      break;

    case 'self_buff':
      if (effect.stats) {
        if (effect.stats.attack !== undefined) result.attackBoost = effect.stats.attack;
        if (effect.stats.spAtk !== undefined) result.spAtkBoost = effect.stats.spAtk;
        if (effect.stats.speed !== undefined) result.speedBoost = effect.stats.speed;
        if (effect.stats.defense !== undefined) result.defenseBoost = effect.stats.defense;
        if (effect.stats.grass_power !== undefined) result.lightGather = 1;
        if (effect.stats.dragon_blood !== undefined) result.dragonBlood = effect.stats.dragon_blood;
      }
      break;

    case 'energy_gain':
      result.energyRestore = effect.amount || 0;
      break;

    case 'special':
      if (effect.specialType === 'extra_attack_damage') {
        result.addFirePower = effect.value || 0;
        // wall_of_flames / flame_body 都用这个字段
        // 检查是否关联了 flame_body 状态
      }
      if (effect.specialType === 'cleanse_target_buff') {
        result.clearBuff = true;
      }
      if (effect.specialType === 'weakness_debuff') {
        result.weaknessEffect = true;
      }
      if (effect.specialType === 'dragon_crush') {
        result.dragonCrush = true;
      }
      if (effect.specialType === 'dragon_oblivion') {
        result.dragonOblivion = true;
      }
      if (effect.specialType === 'meteor_fall') {
        result.meteorFall = true;
      }
      if (effect.specialType === 'dragon_resonance_ultimate') {
        result.dragonResonanceUltimate = true;
      }
      if (effect.specialType === 'dragon_scales_shield') {
        result.dragonScalesShield = true;
      }
      // 超能系特殊效果
      if (effect.specialType === 'prophecy_mark_bonus') {
        result.prophecyMarkBonus = true;
        result.prophecyMarkBonusValue = effect.value || 20;
      }
      if (effect.specialType === 'pierce_shield') {
        result.pierceShield = true;
      }
      if (effect.specialType === 'mirror_reflect') {
        result.mirrorReflect = true;
        result.mirrorReflectDamage = effect.value || 1.8;
      }
      if (effect.specialType === 'mist_body') {
        result.mistBody = true;
        result.mistBodyChance = effect.value || 0.7;
      }
      if (effect.specialType === 'psycho_shift') {
        result.psychoShift = true;
      }
      if (effect.specialType === 'mind_sync') {
        result.mindSync = true;
      }
      if (effect.specialType === 'future_sight') {
        result.futureSight = true;
        result.futureSightPower = effect.value || 120;
      }
      if (effect.specialType === 'fate_weave') {
        result.fateWeave = true;
        result.fateWeaveDamage = effect.value || 100;
      }
      break;

    case 'resistance':
      result.type = 'resistance';
      if (effect.element) result.element = effect.element;
      if (effect.value !== undefined) result.resistanceValue = effect.value;
      if (effect.duration !== undefined) result.duration = effect.duration;
      break;

    case 'remove_buff':
      result.removeBuff = true;
      break;

    case 'damage_consume_stacks':
      result.damageConsumeStacks = true;
      result.baseDamage = effect.baseDamage || 0;
      result.damagePerStack = effect.damagePerStack || 0;
      result.statusId = effect.statusId || null;
      break;

    // skills-db.js 中 damageType='special' 会产生 type:'special' 字段，静默忽略
    case 'special':
      break;

    default:
      console.warn(`未知的效果类型: ${effect.type}`);
  }

  return result;
}

function convertSkillToBattleFormat(skillData, element) {
  // 确保 element 总是被设置
  const skillElement = element || skillData.element || 'fire';

  let energyCost = ENERGY_COST.medium;
  if (skillData.e !== undefined) {
    if (typeof skillData.e === 'number') {
      if (skillData.e <= 1) energyCost = ENERGY_COST.low;
      else if (skillData.e <= 2) energyCost = ENERGY_COST.medium;
      else if (skillData.e <= 3) energyCost = ENERGY_COST.high;
      else if (skillData.e <= 4) energyCost = ENERGY_COST.ultra;
      else energyCost = ENERGY_COST.ultimate;
    }
  }

  let target = 'single_enemy';
  if (skillData.t) {
    const targetStr = String(skillData.t);
    if (targetStr.includes('self') || targetStr.includes('自身')) target = 'self';
    else if (targetStr.includes('all_ally') || targetStr.includes('己方全体')) target = 'all_ally';
    else if (targetStr.includes('ally') || targetStr.includes('己方单体')) target = 'ally';
    else if (targetStr.includes('all_enemy') || targetStr.includes('敌方全体') || targetStr.includes('全体敌人')) target = 'all_enemy';
    else if (targetStr.includes('all')) target = 'all_enemy';
    else target = 'single_enemy';
  }

  let type = 'special';
  if (skillData.damageType) {
    if (skillData.damageType === 'physical') type = 'physical';
    else if (skillData.damageType === 'special') type = 'special';
    else if (skillData.damageType === '物理') type = 'physical';
    else if (skillData.damageType === '特攻') type = 'special';
  }

  let power = 0;
  let comboHits = 1;
  let comboPower = 0;
  let basePower = 0;
  let powerPerStack = 0;
  if (skillData.p !== undefined) {
    if (typeof skillData.p === 'number') {
      power = skillData.p;
      basePower = skillData.p;
    } else if (typeof skillData.p === 'string') {
      const comboMatch = skillData.p.match(/(\d+)\s*[×x×]\s*(\d+)/);
      if (comboMatch) {
        comboPower = parseInt(comboMatch[1]);
        comboHits = parseInt(comboMatch[2]);
        power = comboPower * comboHits;
        basePower = comboPower;
      } else {
        const dynamicMatch = skillData.p.match(/(\d+)\+(\d+)\s*[×x×]\s*层/);
        if (dynamicMatch) {
          basePower = parseInt(dynamicMatch[1]);
          powerPerStack = parseInt(dynamicMatch[2]);
          power = basePower;
        } else {
          const match = skillData.p.match(/(\d+)/);
          if (match) power = parseInt(match[1]);
          basePower = power;
        }
      }
    }
  }

  let attackBoost = 0;
  let spAtkBoost = 0;
  let speedBoost = 0;
  let defenseBoost = 0;
  let fireDamageBoost = 0;
  let grassDamageBoost = 0;
  let clearBuff = false;
  let addFirePower = 0;
  let lightGather = 0;
  let wither = false;
  let witherPower = 0;
  let guaranteedCrit = false;
  let reflectDamage = 0;
  let parasiticSeed = false;
  let parasiticSeedDrain = 0;
  let parasiticSeedTurns = 0;
  let energyRestore = 0;
  let healPercent = 0;
  let waterSoakEffect = false;
  let waterSoakPower = 0;
  let waterSoakDuration = 2;
  let waterSoakMaxStacks = 6;
  let drowningEffect = false;
  let drowningDuration = 3;
  let weaknessEffect = false;
  let weaknessDuration = 2;
  let muddyEffect = false;
  let muddyMaxStacks = 3;
  let flowEffect = false;
  let clearSpringEffect = false;
  let clearSpringDuration = 3;
  let rainyDayEffect = false;
  let rainyDayDuration = 3;
  let rainyDayPowerBoost = 0.5;
  let steamBurnChance = 0;
  let effect = null;
  let burnStacks = null;
  let burnChance = null;
  let burnMarkPower = null;
  let damageReduction = skillData.damageReduction || 0;
  let combustionMark = false;
  let flameCharge = false;
  let blazeWillEffect = false;
  let fireBodyEffect = false;
  let fireShield = false;
  let vineBody = false;
  let paralysis = false;
  let electricDeflect = false;
  let charge = false;
  let electricFieldEffect = false;
  let staticMark = false;
  let frost = false;
  let extremeColdMark = false;
  let frostArmor = false;
  let iceWall = false;
  let frostMark = false;
  let frozenLandEffect = false;
  let dragonCrush = false;
  let dragonOblivion = false;
  let meteorFall = false;
  let dragonResonanceUltimate = false;
  let dragonScalesShield = false;
  let dragonPowerLoss = false;
  let dragonBlood = 0;
  let resistances = [];  // 收集所有属性抗性效果 [{element, value, duration}]
  // 超能系新字段
  let prophecyMark = false;
  let prophecyMarkBonus = false;
  let prophecyMarkBonusValue = 20;
  let mindWound = false;
  let forbidden = false;
  let mindShield = false;
  let pierceShield = false;
  let mirrorReflect = false;
  let mirrorReflectDamage = 1.8;
  let mistBody = false;
  let mistBodyChance = 0.7;
  let psychoShift = false;
  let mindSync = false;
  let futureSight = false;
  let futureSightPower = 120;
  let fateWeave = false;
  let fateWeaveDamage = 100;

  // 解析冷却时间
  let cooldown = skillData.cooldown || 0;

  // 只有当 effects 数组非空时才进行效果解析
  if (skillData.effects && Array.isArray(skillData.effects) && skillData.effects.length > 0) {
    for (const effectItem of skillData.effects) {
      const parsed = parseSingleEffect(effectItem);
      Object.assign(
        { attackBoost, spAtkBoost, speedBoost, defenseBoost, fireDamageBoost, grassDamageBoost,
          clearBuff, addFirePower, lightGather, wither, witherPower, guaranteedCrit,
          reflectDamage, parasiticSeed, parasiticSeedDrain, parasiticSeedTurns, energyRestore,
          healPercent, waterSoakEffect, waterSoakPower, waterSoakDuration, waterSoakMaxStacks,
          drowningEffect, drowningDuration, weaknessEffect, weaknessDuration, muddyEffect,
          muddyMaxStacks, flowEffect, clearSpringEffect, clearSpringDuration, rainyDayEffect,
          rainyDayDuration, rainyDayPowerBoost, steamBurnChance, effect, burnStacks, burnChance,
          burnMarkPower, type, combustionMark, flameCharge, blazeWillEffect, dragonBlood,
          prophecyMark, prophecyMarkBonus, prophecyMarkBonusValue, mindWound, forbidden,
          mindShield, pierceShield, mirrorReflect, mirrorReflectDamage, mistBody, mistBodyChance,
          psychoShift, mindSync, futureSight, futureSightPower, fateWeave, fateWeaveDamage,
          resistances },
        parsed
      );
      if (parsed.attackBoost !== undefined) attackBoost = parsed.attackBoost;
      if (parsed.spAtkBoost !== undefined) spAtkBoost = parsed.spAtkBoost;
      if (parsed.speedBoost !== undefined) speedBoost = parsed.speedBoost;
      if (parsed.defenseBoost !== undefined) defenseBoost = parsed.defenseBoost;
      if (parsed.fireDamageBoost !== undefined) fireDamageBoost = parsed.fireDamageBoost;
      if (parsed.grassDamageBoost !== undefined) grassDamageBoost = parsed.grassDamageBoost;
      if (parsed.clearBuff !== undefined) clearBuff = parsed.clearBuff;
      if (parsed.addFirePower !== undefined) addFirePower = parsed.addFirePower;
      if (parsed.lightGather !== undefined) lightGather = parsed.lightGather;
      if (parsed.wither !== undefined) wither = parsed.wither;
      if (parsed.witherPower !== undefined) witherPower = parsed.witherPower;
      if (parsed.guaranteedCrit !== undefined) guaranteedCrit = parsed.guaranteedCrit;
      if (parsed.reflectDamage !== undefined) reflectDamage = parsed.reflectDamage;
      if (parsed.parasiticSeed !== undefined) parasiticSeed = parsed.parasiticSeed;
      if (parsed.parasiticSeedDrain !== undefined) parasiticSeedDrain = parsed.parasiticSeedDrain;
      if (parsed.parasiticSeedTurns !== undefined) parasiticSeedTurns = parsed.parasiticSeedTurns;
      if (parsed.energyRestore !== undefined) energyRestore = parsed.energyRestore;
      if (parsed.healPercent !== undefined) healPercent = parsed.healPercent;
      if (parsed.waterSoakEffect !== undefined) waterSoakEffect = parsed.waterSoakEffect;
      if (parsed.waterSoakPower !== undefined) waterSoakPower = parsed.waterSoakPower;
      if (parsed.waterSoakDuration !== undefined) waterSoakDuration = parsed.waterSoakDuration;
      if (parsed.waterSoakMaxStacks !== undefined) waterSoakMaxStacks = parsed.waterSoakMaxStacks;
      if (parsed.drowningEffect !== undefined) drowningEffect = parsed.drowningEffect;
      if (parsed.drowningDuration !== undefined) drowningDuration = parsed.drowningDuration;
      if (parsed.weaknessEffect !== undefined) weaknessEffect = parsed.weaknessEffect;
      if (parsed.weaknessDuration !== undefined) weaknessDuration = parsed.weaknessDuration;
      if (parsed.muddyEffect !== undefined) muddyEffect = parsed.muddyEffect;
      if (parsed.muddyMaxStacks !== undefined) muddyMaxStacks = parsed.muddyMaxStacks;
      if (parsed.flowEffect !== undefined) flowEffect = parsed.flowEffect;
      if (parsed.clearSpringEffect !== undefined) clearSpringEffect = parsed.clearSpringEffect;
      if (parsed.clearSpringDuration !== undefined) clearSpringDuration = parsed.clearSpringDuration;
      if (parsed.rainyDayEffect !== undefined) rainyDayEffect = parsed.rainyDayEffect;
      if (parsed.rainyDayDuration !== undefined) rainyDayDuration = parsed.rainyDayDuration;
      if (parsed.rainyDayPowerBoost !== undefined) rainyDayPowerBoost = parsed.rainyDayPowerBoost;
      if (parsed.steamBurnChance !== undefined) steamBurnChance = parsed.steamBurnChance;
      if (parsed.effect !== undefined) effect = parsed.effect;
      if (parsed.burnStacks !== undefined) burnStacks = parsed.burnStacks;
      if (parsed.burnChance !== undefined) burnChance = parsed.burnChance;
      if (parsed.burnMarkPower !== undefined) burnMarkPower = parsed.burnMarkPower;
      if (parsed.type !== undefined) type = parsed.type;
      if (parsed.damageReduction !== undefined) damageReduction = parsed.damageReduction;
      if (parsed.comboHits !== undefined) comboHits = parsed.comboHits;
      if (parsed.comboPower !== undefined) comboPower = parsed.comboPower;
      if (parsed.power !== undefined) power = parsed.power;
      if (parsed.combustionMark !== undefined) combustionMark = parsed.combustionMark;
      if (parsed.flameCharge !== undefined) flameCharge = parsed.flameCharge;
      if (parsed.blazeWillEffect !== undefined) blazeWillEffect = parsed.blazeWillEffect;
      if (parsed.fireBodyEffect !== undefined) fireBodyEffect = parsed.fireBodyEffect;
      if (parsed.fireShield !== undefined) fireShield = parsed.fireShield;
      if (parsed.vineBody !== undefined) vineBody = parsed.vineBody;
      if (parsed.paralysis !== undefined) paralysis = parsed.paralysis;
      if (parsed.electricDeflect !== undefined) electricDeflect = parsed.electricDeflect;
      if (parsed.charge !== undefined) charge = parsed.charge;
      if (parsed.electricFieldEffect !== undefined) electricFieldEffect = parsed.electricFieldEffect;
      if (parsed.staticMark !== undefined) staticMark = parsed.staticMark;
      if (parsed.frost !== undefined) frost = parsed.frost;
      if (parsed.extremeColdMark !== undefined) extremeColdMark = parsed.extremeColdMark;
      if (parsed.frostArmor !== undefined) frostArmor = parsed.frostArmor;
      if (parsed.iceWall !== undefined) iceWall = parsed.iceWall;
      if (parsed.frostMark !== undefined) frostMark = parsed.frostMark;
      if (parsed.frozenLandEffect !== undefined) frozenLandEffect = parsed.frozenLandEffect;
      if (parsed.dragonCrush !== undefined) dragonCrush = parsed.dragonCrush;
      if (parsed.dragonOblivion !== undefined) dragonOblivion = parsed.dragonOblivion;
      if (parsed.meteorFall !== undefined) meteorFall = parsed.meteorFall;
      if (parsed.dragonResonanceUltimate !== undefined) dragonResonanceUltimate = parsed.dragonResonanceUltimate;
      if (parsed.dragonScalesShield !== undefined) dragonScalesShield = parsed.dragonScalesShield;
      if (parsed.dragonPowerLoss !== undefined) dragonPowerLoss = parsed.dragonPowerLoss;
      if (parsed.dragonBlood !== undefined) dragonBlood = parsed.dragonBlood;
      if (parsed.prophecyMark !== undefined) prophecyMark = parsed.prophecyMark;
      if (parsed.prophecyMarkBonus !== undefined) prophecyMarkBonus = parsed.prophecyMarkBonus;
      if (parsed.prophecyMarkBonusValue !== undefined) prophecyMarkBonusValue = parsed.prophecyMarkBonusValue;
      if (parsed.mindWound !== undefined) mindWound = parsed.mindWound;
      if (parsed.forbidden !== undefined) forbidden = parsed.forbidden;
      if (parsed.mindShield !== undefined) mindShield = parsed.mindShield;
      if (parsed.pierceShield !== undefined) pierceShield = parsed.pierceShield;
      if (parsed.mirrorReflect !== undefined) mirrorReflect = parsed.mirrorReflect;
      if (parsed.mirrorReflectDamage !== undefined) mirrorReflectDamage = parsed.mirrorReflectDamage;
      if (parsed.mistBody !== undefined) mistBody = parsed.mistBody;
      if (parsed.mistBodyChance !== undefined) mistBodyChance = parsed.mistBodyChance;
      if (parsed.psychoShift !== undefined) psychoShift = parsed.psychoShift;
      if (parsed.mindSync !== undefined) mindSync = parsed.mindSync;
      if (parsed.futureSight !== undefined) futureSight = parsed.futureSight;
      if (parsed.futureSightPower !== undefined) futureSightPower = parsed.futureSightPower;
      if (parsed.fateWeave !== undefined) fateWeave = parsed.fateWeave;
      if (parsed.fateWeaveDamage !== undefined) fateWeaveDamage = parsed.fateWeaveDamage;
      if (parsed.resistanceValue !== undefined) {
        // 从 parsed 对象收集抗性（因为 resistance case 可能设置了 element/value/duration）
        resistances.push({
          element: parsed.element || 'unknown',
          value: parsed.resistanceValue,
          duration: parsed.duration || 1
        });
      }
    }
  } else if (skillData.eff) {
    if (skillData.eff.includes('攻击+1级') || skillData.eff.includes('攻击+1')) {
      attackBoost = 1;
    }
    if (skillData.eff.includes('特攻+1级') || skillData.eff.includes('特攻-')) {
      const spMatch = skillData.eff.match(/特攻([+-]\d+)级/);
      if (spMatch) spAtkBoost = parseInt(spMatch[1]);
    }
    if (skillData.eff.includes('速度+1级') || skillData.eff.includes('速度+1')) {
      speedBoost = 1;
    }
    if (skillData.eff.includes('防御+1级') || skillData.eff.includes('防御+1')) {
      defenseBoost = 1;
    }
    const fireDmgMatch = skillData.eff.match(/火属性伤害\+(\d+)%/);
    if (fireDmgMatch) {
      fireDamageBoost = parseInt(fireDmgMatch[1]) / 100;
    }
    const grassDmgMatch = skillData.eff.match(/草系技能伤害\+(\d+)%/);
    if (grassDmgMatch) {
      grassDamageBoost = parseInt(grassDmgMatch[1]) / 100;
    }
    if (skillData.eff.includes('清除') && skillData.eff.includes('增益')) {
      clearBuff = true;
    }
    const firePowerMatch = skillData.eff.match(/火属性攻击威力\+(\d+)/);
    if (firePowerMatch) {
      addFirePower = parseInt(firePowerMatch[1]);
    }
    const lightGatherMatch = skillData.eff.match(/光能汇聚（(\d+)层）/);
    if (lightGatherMatch) {
      lightGather = parseInt(lightGatherMatch[1]);
    } else if (skillData.eff.includes('光能汇聚')) {
      lightGather = 1;
    }
    const grassPowerMatch = skillData.eff.match(/下次草系输出技能\+(\d+)威力/);
    if (grassPowerMatch) {
      lightGather = 1;
    }
    if (skillData.eff.includes('枯萎')) {
      wither = true;
      const witherMatch = skillData.eff.match(/枯萎（.*?自身属性(\d+)点威力/);
      if (witherMatch) {
        witherPower = parseInt(witherMatch[1]);
      } else {
        witherPower = 10;
      }
    }
    if (skillData.eff.includes('必定暴击')) {
      guaranteedCrit = true;
    }
    if (skillData.eff.includes('芬芳环境')) {
      effect = 'fragrantEnvironment';
    }
    if (skillData.eff.includes('扎根状态')) {
      effect = 'rootBound';
    }
    if (skillData.eff.includes('缠绕')) {
      effect = 'entangle';
    }
    if (skillData.eff.includes('防反状态') || skillData.eff.includes('反弹')) {
      effect = 'counterStance';
      const reflectMatch = skillData.eff.match(/反弹(\d+)%伤害/);
      if (reflectMatch) {
        reflectDamage = parseInt(reflectMatch[1]) / 100;
      } else {
        reflectDamage = 0.6;
      }
    }
    if (skillData.eff.includes('寄生种子') || skillData.eff.includes('寄生之种')) {
      parasiticSeed = true;
      const drainMatch = skillData.eff.match(/HP的(\d+)%/);
      if (drainMatch) {
        parasiticSeedDrain = parseInt(drainMatch[1]) / 100;
      } else {
        parasiticSeedDrain = 0.06;
      }
      const turnsMatch = skillData.eff.match(/持续(\d+)回合/);
      if (turnsMatch) {
        parasiticSeedTurns = parseInt(turnsMatch[1]);
      } else {
        parasiticSeedTurns = 4;
      }
    }
    const energyMatch = skillData.eff.match(/获得(\d+)点能量/);
    if (energyMatch) {
      energyRestore = parseInt(energyMatch[1]);
    }
    const healMatch = skillData.eff.match(/回复最大HP的(\d+)%/);
    if (healMatch) {
      healPercent = parseInt(healMatch[1]) / 100;
    }
    if (skillData.eff.includes('灼伤印记')) {
      effect = 'burnMark';
      const markMatch = skillData.eff.match(/灼伤印记.*?(\d+)威力/);
      if (markMatch) {
        burnMarkPower = parseInt(markMatch[1]);
      } else {
        burnMarkPower = 40;
      }
    } else if (skillData.eff.includes('灼烧')) {
      effect = 'burn';
    }
    if (skillData.eff.includes('冻结')) effect = 'freeze';
    if (skillData.eff.includes('减速')) effect = 'slow';
    if (skillData.eff.includes('麻痹')) effect = 'paralyze';
    if (skillData.eff.includes('多段') || skillData.p?.toString().includes('×')) effect = 'combo';
    if (effect === 'burn' && skillData.eff.includes('灼烧')) {
      const burnMatch = skillData.eff.match(/灼烧.*?（(\d+)层）/);
      if (burnMatch) {
        burnStacks = parseInt(burnMatch[1]);
      }
      const chanceMatch = skillData.eff.match(/(\d+)%概率灼烧/);
      if (chanceMatch) {
        burnChance = parseInt(chanceMatch[1]) / 100;
      }
      if (!skillData.eff.includes('%概率') && skillData.eff.includes('必定灼烧')) {
        burnChance = 1;
      }
    }
    if (skillData.eff.includes('浸透')) {
      waterSoakEffect = true;
      const soakPowerMatch = skillData.eff.match(/浸透（.*?(\d+)威力/);
      if (soakPowerMatch) {
        waterSoakPower = parseInt(soakPowerMatch[1]);
      } else {
        waterSoakPower = 1;
      }
      const soakDurationMatch = skillData.eff.match(/浸透.*?持续(\d+)回合/);
      if (soakDurationMatch) {
        waterSoakDuration = parseInt(soakDurationMatch[1]);
      }
      const soakMaxMatch = skillData.eff.match(/浸透.*?最多(\d+)层/);
      if (soakMaxMatch) {
        waterSoakMaxStacks = parseInt(soakMaxMatch[1]);
      }
    }
    if (skillData.eff.includes('溺水')) {
      drowningEffect = true;
      const drowningDurationMatch = skillData.eff.match(/溺水.*?持续(\d+)回合/);
      if (drowningDurationMatch) {
        drowningDuration = parseInt(drowningDurationMatch[1]);
      }
    }
    if (skillData.eff.includes('虚弱')) {
      weaknessEffect = true;
      const weaknessDurationMatch = skillData.eff.match(/虚弱.*?持续(\d+)回合/);
      if (weaknessDurationMatch) {
        weaknessDuration = parseInt(weaknessDurationMatch[1]);
      }
    }
    if (skillData.eff.includes('浑浊')) {
      muddyEffect = true;
      const muddyMaxMatch = skillData.eff.match(/浑浊.*?最多(\d+)层/);
      if (muddyMaxMatch) {
        muddyMaxStacks = parseInt(muddyMaxMatch[1]);
      }
    }
    if (skillData.eff.includes('流水状态')) {
      flowEffect = true;
    }
    if (skillData.eff.includes('清泉')) {
      clearSpringEffect = true;
      const clearSpringDurationMatch = skillData.eff.match(/清泉.*?持续(\d+)回合/);
      if (clearSpringDurationMatch) {
        clearSpringDuration = parseInt(clearSpringDurationMatch[1]);
      }
    }
    if (skillData.eff.includes('雨天')) {
      rainyDayEffect = true;
      const rainyDurationMatch = skillData.eff.match(/雨天.*?持续(\d+)回合/);
      if (rainyDurationMatch) {
        rainyDayDuration = parseInt(rainyDurationMatch[1]);
      }
      const rainyPowerMatch = skillData.eff.match(/雨天.*?(\d+)%/);
      if (rainyPowerMatch) {
        rainyDayPowerBoost = parseInt(rainyPowerMatch[1]) / 100;
      }
    }
    if (skillData.eff.includes('蒸汽灼伤') || skillData.eff.includes('灼烧')) {
      const steamBurnMatch = skillData.eff.match(/(\d+)%概率.*灼伤/);
      if (steamBurnMatch) {
        steamBurnChance = parseInt(steamBurnMatch[1]) / 100;
      } else if (skillData.eff.includes('蒸汽灼伤')) {
        steamBurnChance = 0.3;
      }
    }
    if (skillData.eff.includes('每回合回复')) {
      const healPercentMatch = skillData.eff.match(/每回合回复(\d+)%/);
      if (healPercentMatch) {
        healPercent = parseInt(healPercentMatch[1]) / 100;
      }
    }
    if (skillData.eff.includes('最大HP的')) {
      const hpHealMatch = skillData.eff.match(/最大HP的(\d+)%/);
      if (hpHealMatch) {
        healPercent = parseInt(hpHealMatch[1]) / 100;
      }
    } else if (skillData.eff.includes('恢复') && skillData.eff.includes('%HP')) {
      const restoreMatch = skillData.eff.match(/恢复(\d+)%HP/);
      if (restoreMatch) {
        healPercent = parseInt(restoreMatch[1]) / 100;
      }
    }
    if (skillData.eff.includes('护盾') || skillData.eff.includes('减伤')) {
      type = 'shield';
    }
    if (skillData.eff.includes('治疗') || skillData.eff.includes('回复')) {
      type = 'heal';
    }
    if (skillData.eff.includes('混乱')) {
      effect = 'confusion';
    }
    if (skillData.eff.includes('龙之气息')) {
      const dragonBloodMatch = skillData.eff.match(/获得(\d+)层.*龙之气息/);
      if (dragonBloodMatch) {
        dragonBlood = parseInt(dragonBloodMatch[1]);
      } else {
        dragonBlood = 2; // default
      }
    }
    if (skillData.eff.includes('龙之终焉')) {
      dragonOblivion = true;
    }
    if (skillData.eff.includes('流星陨落')) {
      meteorFall = true;
    }
    if (skillData.eff.includes('龙之碾压')) {
      dragonCrush = true;
    }
    if (skillData.eff.includes('龙属共鸣') && skillData.eff.includes('极')) {
      dragonResonanceUltimate = true;
    }
    if (skillData.eff.includes('龙鳞守护')) {
      dragonScalesShield = true;
    }
    if (skillData.eff.includes('龙威减退') || skillData.eff.includes('攻击/特攻-2级')) {
      dragonPowerLoss = true;
    }
  }

  return {
    id: skillData.id,
    name: skillData.name,
    type: type,
    energyCost: energyCost,
    target: target,
    power: power,
    basePower: basePower,
    powerPerStack: powerPerStack,
    comboHits: comboHits > 1 ? comboHits : undefined,
    comboPower: comboPower > 0 ? comboPower : undefined,
    element: skillElement,
    strategy: 'counter_first',
    effect: effect,
    burnStacks: burnStacks,
    burnChance: burnChance,
    burnMarkPower: burnMarkPower,
    damageReduction: damageReduction,
    attackBoost: attackBoost,
    spAtkBoost: spAtkBoost,
    speedBoost: speedBoost,
    defenseBoost: defenseBoost,
    fireDamageBoost: fireDamageBoost,
    grassDamageBoost: grassDamageBoost,
    clearBuff: clearBuff,
    addFirePower: addFirePower,
    lightGather: lightGather,
    wither: wither,
    witherPower: witherPower,
    guaranteedCrit: guaranteedCrit,
    reflectDamage: reflectDamage,
    parasiticSeed: parasiticSeed,
    parasiticSeedDrain: parasiticSeedDrain,
    parasiticSeedTurns: parasiticSeedTurns,
    energyRestore: energyRestore,
    healPercent: healPercent,
    waterSoakEffect: waterSoakEffect,
    waterSoakPower: waterSoakPower,
    waterSoakDuration: waterSoakDuration,
    waterSoakMaxStacks: waterSoakMaxStacks,
    drowningEffect: drowningEffect,
    drowningDuration: drowningDuration,
    weaknessEffect: weaknessEffect,
    weaknessDuration: weaknessDuration,
    muddyEffect: muddyEffect,
    muddyMaxStacks: muddyMaxStacks,
    flowEffect: flowEffect,
    clearSpringEffect: clearSpringEffect,
    clearSpringDuration: clearSpringDuration,
    rainyDayEffect: rainyDayEffect,
    rainyDayDuration: rainyDayDuration,
    rainyDayPowerBoost: rainyDayPowerBoost,
    steamBurnChance: steamBurnChance,
    combustionMark: combustionMark,
    flameCharge: flameCharge,
    blazeWillEffect: blazeWillEffect,
    fireBodyEffect: fireBodyEffect,
    fireShield: fireShield,
    vineBody: vineBody,
    paralysis: paralysis,
    electricDeflect: electricDeflect,
    charge: charge,
    electricFieldEffect: electricFieldEffect,
    staticMark: staticMark,
    frost: frost,
    extremeColdMark: extremeColdMark,
    frostArmor: frostArmor,
    iceWall: iceWall,
    frostMark: frostMark,
    frozenLandEffect: frozenLandEffect,
    dragonCrush: dragonCrush,
    dragonOblivion: dragonOblivion,
    meteorFall: meteorFall,
    dragonResonanceUltimate: dragonResonanceUltimate,
    dragonScalesShield: dragonScalesShield,
    dragonPowerLoss: dragonPowerLoss,
    dragonBlood: dragonBlood,
    // 超能系新字段
    prophecyMark: prophecyMark,
    prophecyMarkBonus: prophecyMarkBonus,
    prophecyMarkBonusValue: prophecyMarkBonusValue,
    mindWound: mindWound,
    forbidden: forbidden,
    mindShield: mindShield,
    pierceShield: pierceShield,
    mirrorReflect: mirrorReflect,
    mirrorReflectDamage: mirrorReflectDamage,
    mistBody: mistBody,
    mistBodyChance: mistBodyChance,
    psychoShift: psychoShift,
    mindSync: mindSync,
    futureSight: futureSight,
    futureSightPower: futureSightPower,
    fateWeave: fateWeave,
    fateWeaveDamage: fateWeaveDamage,
    resistances: resistances,
    cooldown: cooldown,
    description: skillData.eff || generateSkillDescription(skillData.effects, skillData)
  };
}

function addStatusToUnit(unit, statusId, stacks, duration) {
  unit.buffs = unit.buffs || [];
  const statusDef = STATUS[statusId];
  if (!statusDef) {
    console.warn(`未知状态: ${statusId}`);
    return null;
  }

  let existingBuff = unit.buffs.find(b => b.type === statusId);

  if (existingBuff) {
    if (statusDef.stackable) {
      existingBuff.stacks = Math.min(existingBuff.stacks + (stacks || 1), statusDef.maxStacks || 99);
    }
    existingBuff.remainingDuration = duration || statusDef.duration || 2;
    // 灼伤印记特殊处理：刷新时也更新属性
    if (statusId === 'burn_mark') {
      unit.burnMark = true;
      unit.burnMarkPower = statusDef.delayedDamage || 40;
      unit.burnMarkDamageType = 'special';
    }
  } else {
    const buff = {
      type: statusId,
      name: statusDef.name || statusId,
      remainingDuration: duration || statusDef.duration || 2,
      stacks: (statusDef.stackable) ? (stacks || 1) : 1
    };

    if (statusDef.stats) {
      if (statusDef.stats.attack) buff.attackBoost = statusDef.stats.attack;
      if (statusDef.stats.spAtk) buff.spAtkBoost = statusDef.stats.spAtk;
      if (statusDef.stats.speed) buff.speedBoost = statusDef.stats.speed;
      if (statusDef.stats.defense) buff.defenseBoost = statusDef.stats.defense;
    }
    if (statusDef.healPercent) buff.healPercent = statusDef.healPercent;
    if (statusDef.damageReduction) buff.damageReduction = statusDef.damageReduction;
    if (statusDef.reflectDamage) buff.reflectDamage = statusDef.reflectDamage;
    if (statusDef.skipTurn) buff.skipTurn = true;
    if (statusDef.skipTurnChance) buff.skipTurnChance = statusDef.skipTurnChance;
    if (statusDef.selfAttackChance) buff.selfAttackChance = statusDef.selfAttackChance;
    if (statusDef.healBlock) buff.healBlock = true;

    // 灼伤印记特殊处理：设置战斗引擎检查所需的属性
    if (statusId === 'burn_mark') {
      unit.burnMark = true;
      unit.burnMarkPower = statusDef.delayedDamage || 40;
      unit.burnMarkDamageType = 'special';
    }

    // 寄生种子特殊处理：存储吸血属性
    if (statusId === 'parasitic_seed') {
      buff.drainPercent = statusDef.drainPercent || 0.06;
      buff.sourceId = buff.sourceId; // 释放者ID稍后在技能执行时设置
    }

    unit.buffs.push(buff);
  }

  return existingBuff || unit.buffs[unit.buffs.length - 1];
}

function addBuffToUnit(unit, stat, value, duration) {
  unit.buffs = unit.buffs || [];

  const buff = {
    type: 'buff',
    stat: stat,
    value: value,
    remainingDuration: duration || 2
  };

  unit.buffs.push(buff);
  return buff;
}

function executeSkillEffects(skill, caster, targets) {
  if (!skill.effects || !Array.isArray(skill.effects)) return;

  const results = [];

  skill.effects.forEach(effect => {
    switch(effect.type) {
      case 'add_status':
        const statusId = effect.statusId;
        targets.forEach(target => {
          if (target.currentHp <= 0) return;
          const duration = effect.duration || STATUS[statusId]?.duration || 2;
          const stacks = effect.stacks || 1;
          const buff = addStatusToUnit(target, statusId, stacks, duration);

          // 寄生种子特殊处理：存储释放者ID用于回合结算
          if (statusId === 'parasitic_seed' && buff) {
            buff.sourceId = caster.id;
          }

          addLog(`${target.name} 获得「${STATUS[statusId]?.name || statusId}」状态！`, 'buff');
        });
        break;

      case 'buff':
      case 'buff_all':
        const buffDuration = skill.duration || 2;
        targets.forEach(target => {
          if (target.currentHp <= 0) return;
          if (effect.stats) {
            if (effect.stats.attack) addBuffToUnit(target, 'attack', effect.stats.attack, buffDuration);
            if (effect.stats.spAtk) addBuffToUnit(target, 'spAtk', effect.stats.spAtk, buffDuration);
            if (effect.stats.speed) addBuffToUnit(target, 'speed', effect.stats.speed, buffDuration);
            if (effect.stats.defense) addBuffToUnit(target, 'defense', effect.stats.defense, buffDuration);
          }
        });
        if (effect.fireDamageBoost) caster.fireDamageBoost = (caster.fireDamageBoost || 0) + effect.fireDamageBoost;
        if (effect.grassDamageBoost) caster.grassDamageBoost = (caster.grassDamageBoost || 0) + effect.grassDamageBoost;
        break;

      case 'debuff':
        targets.forEach(target => {
          if (target.currentHp <= 0) return;
          if (effect.stats) {
            if (effect.stats.attack) addBuffToUnit(target, 'attack', effect.stats.attack, skill.duration || 2);
            if (effect.stats.speed) addBuffToUnit(target, 'speed', effect.stats.speed, skill.duration || 2);
            if (effect.stats.accuracy) addBuffToUnit(target, 'accuracy', effect.stats.accuracy, skill.duration || 2);
          }
        });
        break;

      case 'self_debuff':
        if (effect.statusId === 'weakness') {
          addStatusToUnit(caster, 'weakness', 1, 1);
          addLog(`${caster.name} 陷入「虚弱」状态！`, 'debuff');
        }
        break;

      case 'energy_gain':
        targets.forEach(target => {
          const oldEnergy = target.energy;
          target.energy = Math.min(target.energy + effect.amount, MAX_ENERGY);
          const actual = target.energy - oldEnergy;
          if (actual > 0) {
            addLog(`${target.name} 回复 ${actual} 点能量`, 'buff');
          }
        });
        break;

      case 'remove_buff':
        targets.forEach(target => {
          if (target.buffs && target.buffs.length > 0) {
            const removed = target.buffs.pop();
            addLog(`${target.name} 的「${removed.name || removed.type}」被清除！`, 'info');
          }
        });
        break;

      case 'remove_debuff_all':
        targets.forEach(target => {
          if (target.debuffs && target.debuffs.length > 0) {
            target.debuffs = [];
            addLog(`${target.name} 的所有负面状态被清除！`, 'buff');
          }
        });
        break;
    }
  });

  return results;
}

function getTargets(caster, skill, allPlayerUnits, allEnemyUnits) {
  let targets = [];

  switch(skill.target) {
    case 'single_enemy':
      return null;
    case 'ally':
      targets = allPlayerUnits.filter(u => u.currentHp > 0);
      if (targets.length > 0) {
        targets = [targets[Math.floor(Math.random() * targets.length)]];
      }
      break;
    case 'all_ally':
      targets = allPlayerUnits.filter(u => u.currentHp > 0);
      break;
    case 'all_enemy':
      targets = allEnemyUnits.filter(u => u.currentHp > 0);
      break;
    case 'self':
      targets = [caster];
      break;
  }

  return targets;
}

function initializeCompanionSkills() {
  playerUnits.forEach((unit, index) => {
    unit.skills = assignSkillsByElement(unit.element, unit.id);
    // 测试技能注入：替换第一个伙伴的第1个技能
    // customPlayerConfig 在 applyCustomBattle 时已设置 testSkill 字段
    if (index === 0 && typeof customPlayerConfig !== 'undefined' && customPlayerConfig[0]?.testSkill) {
      const testSkillId = customPlayerConfig[0].testSkill;
      let rawSkill = null;
      for (const elementKey in SKILLS_DB) {
        const allSkills = [
          ...(SKILLS_DB[elementKey].attack || []),
          ...(SKILLS_DB[elementKey].defense || []),
          ...(SKILLS_DB[elementKey].support || []),
        ];
        rawSkill = allSkills.find(s => s.id === testSkillId);
        if (rawSkill) break;
      }
      if (rawSkill) {
        const converted = convertSkillToBattleFormat(rawSkill, unit.element);
        converted.energyCost = 0;
        unit.skills[0] = converted;
        console.log(`[注入] 测试技能 ${converted.name} 已替换 ${unit.name} 第1个技能`);
      }
    }
  });
}

function initializeEnemySkills() {
  enemyUnits.forEach(unit => {
    unit.skills = assignSkillsByElement(unit.element, unit.id);
  });
  debugLog('=== 敌人技能分配 ===');
  enemyUnits.forEach(unit => {
    debugLog(`${unit.name} (${unit.element}):`, unit.skills.map(s => `${s.name}[${s.energyCost}能量]`).join(', '));
  });
  enemyUnits.forEach(unit => {
    if (!unit.intent.skillId) {
      updateEnemyIntent(unit);
    }
  });
}

initializeCompanionSkills();

debugLog('=== 技能分配调试 ===');
playerUnits.forEach(unit => {
  debugLog(`${unit.name} (${unit.element}):`, unit.skills.map(s => `${s.name}[${s.energyCost}能量]`).join(', '));
});

/**
 * 状态效果中文名映射（用于生成描述）
 */
const STATUS_NAMES = {
  burn:              '灼烧',
  burn_mark:         '灼伤印记',
  flame_charge:      '蓄焰',
  fire_shield:       '火盾',
  wall_of_flames:    '烈火护体',
  blaze_will:        '炎之意志',
  flame_body:        '烈焰护体',
  combustion_mark:   '燃尽印记',
  overheat_penalty:  '过热代价',
  water_soak:        '浸透',
  weakness:          '虚弱',
  drowning:         '溺水',
  steam_burn:       '蒸汽灼伤',
  muddy:             '浑浊',
  flow:              '流水',
  clear_spring:      '清泉',
  rainy_day:         '雨天',
  light_gather:      '光能汇聚',
  wither:            '枯萎',
  fragrant_env:       '芬芳环境',
  root_bound:        '扎根',
  vine_body:         '藤蔓护体',
  counter_stance:    '防反之姿',
  parasite:          '寄生种子',
  nutrient:          '养分',
  static_body:       '蓄电护体',
  static_charge:     '蓄电护体',
  electric_deflect:  '电磁偏转',
  charge:            '蓄电',
  electric_field_buff: '电场',
  static:            '静电标记',
  frost:             '冰霜',
  extreme_cold_mark: '极寒印记',
  ice_armor:         '冰霜护甲',
  frost_armor:       '冰霜护甲',
  ice_wall:          '冰墙',
  frost_mark:        '冰霜印记',
  frozen_land_env:   '冻土',
  mind_body:         '心灵护体',
  psychic_terrain:   '精神场地',
  psychic_noise:     '精神噪音',
  sandstorm:         '沙暴',
  underground:       '挖洞',
  sand_tomb:         '流沙地狱',
  dragon_guard:      '龙鳞守护',
  dragon_power_loss: '龙威减退',
  slow:              '减速',
  paralysis:         '麻痹',
  defense_up:        '防御强化',
};

function generateSkillDescription(effects, skillData) {
  if (!effects || effects.length === 0) return '';

  const parts = [];

  effects.forEach(effect => {
    switch(effect.type) {
      case 'damage':
        if (effect.power) parts.push(`威力${effect.power}`);
        if (effect.physical) parts.push('物理');
        break;
      case 'damage_all':
        parts.push(`全体威力${effect.power || '?'}`);
        break;
      case 'multi_hit':
        parts.push(`${effect.damage || '?'}×${effect.hits || '?'}`);
        if (effect.burnChance) parts.push(`${Math.round(effect.burnChance * 100)}%灼烧`);
        break;
      case 'heal':
        parts.push(`回复${effect.percent}%HP`);
        break;
      case 'shield':
        parts.push(`减伤${Math.round((1 - (effect.reduction || 0)) * 100)}%`);
        break;
      case 'add_status':
        const statusName = STATUS_NAMES[effect.statusId] || effect.statusId;
        if (effect.stacks) parts.push(`+${statusName}(${effect.stacks}层)`);
        else parts.push(`+${statusName}`);
        break;
      case 'buff':
      case 'buff_all':
        if (effect.stats) {
          const boosts = [];
          if (effect.stats.attack > 0) boosts.push(`攻击+${effect.stats.attack}`);
          if (effect.stats.spAtk > 0) boosts.push(`特攻+${effect.stats.spAtk}`);
          if (effect.stats.speed > 0) boosts.push(`速度+${effect.stats.speed}`);
          if (effect.stats.defense > 0) boosts.push(`防御+${effect.stats.defense}`);
          if (boosts.length) parts.push(boosts.join(','));
        }
        if (effect.fireDamageBoost) parts.push(`火属性伤害+${Math.round(effect.fireDamageBoost * 100)}%`);
        if (effect.grassDamageBoost) parts.push(`草属性伤害+${Math.round(effect.grassDamageBoost * 100)}%`);
        break;
      case 'debuff':
        if (effect.stats) {
          if (effect.stats.accuracy) parts.push(`命中-${effect.stats.accuracy}`);
          if (effect.stats.speed) parts.push(`速度-${effect.stats.speed}`);
        }
        break;
      case 'self_debuff':
        parts.push('使用后自身弱化');
        break;
      case 'energy_gain':
        parts.push(`+${effect.amount}能量`);
        break;
      case 'clear_buff':
        parts.push('清除增益');
        break;
      case 'clear_debuff':
        parts.push('清除减益');
        break;
      case 'delayed_damage':
        parts.push(`${effect.turns}回合后${effect.damage}威力伤害`);
        break;
    }
  });

  if (skillData.duration) {
    parts.push(`持续${skillData.duration}回合`);
  }

  return parts.join(' | ');
}

function syncSkillDescriptions() {
  for (const element in SKILLS_DB) {
    const elementData = SKILLS_DB[element];
    ['attack', 'defense', 'support'].forEach(category => {
      const skills = elementData[category] || [];
      skills.forEach(skillData => {
        playerUnits.forEach(unit => {
          if (unit.element === element) {
            const skill = unit.skills.find(s => s.id === skillData.id);
            if (skill) {
              if (skillData.eff) {
                skill.description = skillData.eff;
              } else if (skillData.effects) {
                skill.description = generateSkillDescription(skillData.effects, skillData);
              }
            }
          }
        });
      });
    });
  }
}

syncSkillDescriptions();
