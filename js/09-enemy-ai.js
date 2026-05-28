// Source: battle-simple.html lines 6249-6658
// 敌人AI决策系统

// ==================== 敌人AI决策系统 ====================

// 获取单个属性对目标的克制倍率
function getTypeMultiplier(attackerElement, defenderElement) {
  const chart = TYPE_CHART[attackerElement];
  if (!chart) return 1;
  return chart[defenderElement] || 1;
}

// 计算技能对目标的综合克制倍率（支持单属性和双属性）
function calculateDamageMultiplier(skillElement, targetElements) {
  let multiplier = 1;
  const elements = Array.isArray(targetElements) ? targetElements : [targetElements];
  elements.forEach(targetElement => {
    multiplier *= getTypeMultiplier(skillElement, targetElement);
  });
  return multiplier;
}

// 判断属性克制
function isSuperEffective(attackerElement, defenderElement) {
  const chart = TYPE_CHART[attackerElement];
  return chart && chart[defenderElement] === 2;
}

// 获取HP百分比
function getHpPercent(unit) {
  return (unit.currentHp / unit.maxHp) * 100;
}

// 1.1 攻击欲望计算
function calculateAttackDesire(enemy) {
  let score = 30; // 基础分

  // HP因素
  const hpPercent = getHpPercent(enemy);
  if (hpPercent > 50) score += 20;
  else if (hpPercent > 25) score += 0;
  else score -= 20;

  // 有有利buff
  if (enemy.buffs?.some(b => b.type === 'attack_up' || b.type === 'power')) {
    score += 15;
  }

  // 有减益debuff
  if (enemy.debuffs?.some(d => d.type === 'attack_down')) {
    score -= 10;
  }

  // 能量因素
  if (enemy.energy >= 3) score += 15;
  else score -= 15;

  // 敌方有高价值目标(血量低)
  const lowHpTargets = playerUnits.filter(p => p.currentHp > 0 && getHpPercent(p) < 50);
  if (lowHpTargets.length > 0) score += 10;

  // 有可用的攻击技能
  const hasAttackSkill = enemy.skills?.some(s =>
    s.type === 'fire' || s.type === 'special' || s.type === 'physical' ||
    s.type === 'ice' || s.type === 'water' || s.type === 'electric'
  );
  if (hasAttackSkill) score += 10;
  else score -= 50;

  return score;
}

// 1.2 治疗欲望计算
function calculateHealDesire(enemy) {
  let score = 10; // 基础分
  const hpPercent = getHpPercent(enemy);

  // HP因素
  if (hpPercent <= 50) score += 30;
  if (hpPercent <= 25) score += 50;

  // 能量因素
  if (enemy.energy >= 3) score += 10;

  // 有治疗技能
  const hasHealSkill = enemy.skills?.some(s =>
    s.type === 'heal' || s.effect?.includes('heal')
  );
  if (hasHealSkill) score += 20;
  else score -= 100;

  return score;
}

// 1.3 防御欲望计算
function calculateDefendDesire(enemy) {
  let score = 15; // 基础分
  const hpPercent = getHpPercent(enemy);

  // HP因素
  if (hpPercent <= 30) score += 40;

  // 能量因素
  if (enemy.energy <= 2) score += 15;

  // 有嘲讽目标(保护自己)
  if (enemy.buffs?.some(b => b.type === 'taunt')) {
    score += 10;
  }

  // 有护盾技能
  const hasShieldSkill = enemy.skills?.some(s =>
    s.type === 'shield' || s.effect?.includes('shield')
  );
  if (hasShieldSkill) score += 15;
  else score -= 30;

  return score;
}

// 1.4 休息欲望计算
function calculateRestDesire(enemy) {
  let score = 5; // 基础分

  // 能量因素
  if (enemy.energy <= 2) score += 60;
  else if (enemy.energy <= 4) score += 20;

  // HP高时更适合休息
  if (getHpPercent(enemy) >= 80) score += 15;

  // 有高威力技能可用且能量>=2时，降低休息欲望
  const hasStrongSkill = enemy.skills?.some(s =>
    (s.power >= 80) && s.energyCost <= enemy.energy && s.energyCost >= 2
  );
  if (hasStrongSkill) score -= 30;

  return score;
}

// 1.5 辅助欲望计算
function calculateSupportDesire(enemy) {
  let score = 10; // 基础分

  // 队友血量低
  const allies = enemyUnits.filter(e => e.id !== enemy.id && e.currentHp > 0);
  const lowHpAllies = allies.filter(a => getHpPercent(a) < 50);
  if (lowHpAllies.length > 0) score += 25;

  // 己方有增益机会
  const hasBuffSkill = enemy.skills?.some(s => s.type === 'buff');
  if (hasBuffSkill) score += 15;

  // 己方满员满状态
  if (allies.length === 0 || allies.every(a => getHpPercent(a) > 80 && (!a.buffs || a.buffs.length === 0))) {
    score -= 20;
  }

  // 有辅助技能
  const hasSupportSkill = enemy.skills?.some(s =>
    s.type === 'buff' || s.type === 'debuff' || s.effect?.includes('buff')
  );
  if (hasSupportSkill) score += 10;
  else score -= 50;

  return score;
}

// 2.1 主决策函数
function decideActionType(enemy) {
  const desires = {
    attack: calculateAttackDesire(enemy),
    heal: calculateHealDesire(enemy),
    defend: calculateDefendDesire(enemy),
    rest: calculateRestDesire(enemy),
    support: calculateSupportDesire(enemy)
  };

  // 调试日志
  debugLog(`${enemy.name} 欲望评分:`, desires);

  // 选择欲望最高的行动
  const sorted = Object.entries(desires).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// 3.1 根据行动类型筛选可用技能
function getUsableSkills(enemy, actionType) {
  if (!enemy.skills) return [];

  return enemy.skills.filter(skill => {
    // 检查能量是否足够
    if (skill.energyCost > enemy.energy) return false;

    // 根据行动类型匹配技能类型
    switch (actionType) {
      case 'attack':
        return skill.type === 'fire' || skill.type === 'special' ||
          skill.type === 'physical' || skill.type === 'ice' ||
          skill.type === 'water' || skill.type === 'electric';
      case 'heal':
        return skill.type === 'heal' || skill.effect?.includes('heal');
      case 'defend':
        return skill.type === 'shield' || skill.effect?.includes('shield');
      case 'rest':
        return skill.id === 'rest';
      case 'support':
        return skill.type === 'buff' || skill.type === 'debuff';
      default:
        return false;
    }
  });
}

// 3.2 技能评分函数
function scoreSkill(enemy, skill, actionType) {
  let score = 50; // 基础分

  switch (actionType) {
    case 'attack':
      // 威力越高越好
      score += (skill.power || 0) * 0.5;
      // 消耗越低越好
      score -= skill.energyCost * 10;
      // 有额外效果更好
      if (skill.effect) score += 15;
      break;

    case 'heal':
      // 治疗量越高越好
      score += (skill.power || 0) * 0.8;
      break;

    case 'defend':
      // 护盾值越高越好
      score += (skill.power || 0) * 0.6;
      break;

    case 'rest':
      // 能量回复越多越好
      score += (skill.power || 0) * 5;
      break;

    case 'support':
      // 根据效果类型评分
      if (skill.effect?.includes('buff')) score += 20;
      if (skill.effect?.includes('debuff')) score += 15;
      break;
  }

  // 随机性（让AI不那么可预测）
  score += Math.random() * 10;

  return score;
}

// 4.1 攻击目标选择
function selectAttackTarget(enemy, playerUnits) {
  const alivePlayers = playerUnits.filter(p => p.currentHp > 0);
  if (alivePlayers.length === 0) return null;

  // 优先级排序
  const targets = alivePlayers.map(target => {
    let priority = 0;

    // 1. 嘲讽目标最高优先
    if (target.debuffs?.some(d => d.type === 'taunt')) {
      priority += 100;
    }

    // 2. 属性克制（2倍伤害）
    if (isSuperEffective(enemy.element, target.element)) {
      priority += 50;
    }

    // 3. 被敌方克制（先击杀威胁）
    if (isSuperEffective(target.element, enemy.element)) {
      priority += 30;
    }

    // 4. 血量最低目标
    priority += (100 - getHpPercent(target)) * 0.5;

    // 5. 无增益状态目标
    if (!target.buffs || target.buffs.length === 0) {
      priority += 10;
    }

    return { target, priority };
  });

  // 选择优先级最高的
  targets.sort((a, b) => b.priority - a.priority);
  return targets[0].target;
}

// 5.2 技能类型映射到意图类型
function mapSkillTypeToIntentType(skillType) {
  const map = {
    fire: 'attack', special: 'attack', physical: 'attack',
    ice: 'attack', water: 'attack', electric: 'attack',
    heal: 'heal', shield: 'defend', buff: 'buff', debuff: 'debuff',
    energy: 'defend'
  };
  return map[skillType] || 'attack';
}

// 5.3 更新敌人意图（智能AI版本）
function updateEnemyIntent(enemy) {
  // 确保敌人有技能
  if (!enemy.skills || enemy.skills.length === 0) {
    enemy.skills = assignSkillsByElement(enemy.element, enemy.id);
  }

  // 1. 决策行动类型
  let actionType = decideActionType(enemy);
  debugLog(`${enemy.name} 决定行动: ${actionType}`);

  // 2. 选择具体技能
  let usableSkills = getUsableSkills(enemy, actionType);

  // 如果首选类型没有可用技能，尝试降级
  if (usableSkills.length === 0) {
    debugLog(`${enemy.name} 没有可用的${actionType}技能，尝试备用方案`);

    // 能量不足时优先休息
    if (enemy.energy < 3) {
      usableSkills = getUsableSkills(enemy, 'rest');
      if (usableSkills.length > 0) {
        actionType = 'rest';
      }
    }

    // 尝试防御
    if (usableSkills.length === 0) {
      usableSkills = getUsableSkills(enemy, 'defend');
      if (usableSkills.length > 0) {
        actionType = 'defend';
      }
    }

    // 尝试攻击（即使能量不足也可能用低消耗技能）
    if (usableSkills.length === 0) {
      usableSkills = enemy.skills.filter(s => s.type !== 'energy');
      if (usableSkills.length > 0) {
        actionType = 'attack';
      }
    }
  }

  // 如果仍然没有可用技能，默认休息
  if (usableSkills.length === 0) {
    debugLog(`${enemy.name} 没有可用技能，选择休息`);
    enemy.intent = {
      type: 'defend',
      skillId: 'rest',
      power: 5,
      targetId: enemy.id,
      element: null
    };
    renderEnemyUnits();
    return;
  }

  // 评分选择最佳技能
  const scored = usableSkills.map(skill => ({
    skill,
    score: scoreSkill(enemy, skill, actionType)
  }));
  scored.sort((a, b) => b.score - a.score);
  const bestSkill = scored[0].skill;
  debugLog(`${enemy.name} 选择技能: ${bestSkill.name} (评分: ${scored[0].score.toFixed(1)})`);

  // 3. 选择目标
  let targetId;
  // 首先检查技能目标类型
  if (bestSkill.target === 'self') {
    // 自身目标：防御类技能（如火盾）目标为自己
    targetId = enemy.id;
  } else if (actionType === 'rest') {
    // 休息类：目标为自己
    targetId = enemy.id;
  } else if (bestSkill.target === 'ally' || actionType === 'support' || actionType === 'heal') {
    // 治疗/辅助己方，选择血量最低的队友
    const allies = enemyUnits.filter(e => e.id !== enemy.id && e.currentHp > 0);
    if (allies.length > 0) {
      const lowestHpAlly = allies.sort((a, b) =>
        (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp)
      )[0];
      targetId = lowestHpAlly?.id || enemy.id;
    } else {
      targetId = enemy.id;
    }
  } else {
    // 攻击敌方
    const target = selectAttackTarget(enemy, playerUnits);
    targetId = target?.id || playerUnits[0]?.id;
  }

  // 4. 生成意图
  enemy.intent = {
    type: mapSkillTypeToIntentType(bestSkill.type),
    skillId: bestSkill.id,
    power: bestSkill.power || 0,
    targetId: targetId,
    element: bestSkill.element || enemy.element
  };

  debugLog(`${enemy.name} 意图: 技能=${bestSkill.name}(target=${bestSkill.target}), 类型=${enemy.intent.type}, 目标=${targetId}`);
  renderEnemyUnits();
}

// 延迟函数
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
