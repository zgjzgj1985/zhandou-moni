// Source: battle-simple.html lines 2607-2984
function showDamageNumber(targetId, amount, type) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const num = document.createElement('div');
  num.className = 'damage-number ' + type;
  num.textContent = (type === 'heal' ? '+' : '-') + amount;
  num.style.left = '50%';
  num.style.top = '20%';
  num.style.transform = 'translateX(-50%)';
  el.appendChild(num);
  setTimeout(() => num.remove(), 800);
}

// ==================== 渲染函数 ====================
function renderPlayerUnits() {
  const container = document.getElementById('playerSide');
  container.innerHTML = '';
  playerUnits.forEach(unit => {
    const div = document.createElement('div');
    div.id = unit.id;
    div.className = 'unit player';
    if (selectedPlayer && selectedPlayer.id === unit.id) div.classList.add('selected');
    // 检查是否有指令
    const hasCommand = playerCommands.find(c => c.casterId === unit.id && c.status === 'pending');
    if (hasCommand) div.classList.add('has-command');

    const isDead = unit.currentHp <= 0;
    const isExecuted = currentBattleMode === 3 && executedPlayerIds.has(unit.id);

    // 状态图标
    let statusIcons = '';
    if (unit.shield && unit.shield > 0) {
      statusIcons += `<div class="status-icon shield-icon" title="护盾: ${unit.shield}">盾</div>`;
    }
    if (unit.damageReduction && unit.damageReduction > 0) {
      statusIcons += `<div class="status-icon reduction-icon" title="减伤: ${Math.round(unit.damageReduction * 100)}%">减${Math.round(unit.damageReduction * 100)}%</div>`;
    }

    // Buff/Debuff状态标签
    let debuffTags = '';
    let buffTags = '';

    // Debuff标签
    if (unit.debuffs) {
      unit.debuffs.forEach(d => {
        if (d.type === 'burn' && d.stacks > 0) {
          debuffTags += `<div class="debuff-tag burn" title="灼烧：每层2%最大HP/回合，层数减半">灼烧${d.stacks}层</div>`;
        } else if (d.type === 'freeze') {
          debuffTags += `<div class="debuff-tag freeze" title="冻结：无法行动">冻结${d.remainingDuration}回合</div>`;
        } else if (d.type === 'paralyze') {
          debuffTags += `<div class="debuff-tag paralyze" title="麻痹：速度-1级">麻痹${d.remainingDuration}回合</div>`;
        } else if (d.type === 'poison' && d.stacks > 0) {
          debuffTags += `<div class="debuff-tag poison" title="中毒：每层2%最大HP/回合">中毒${d.stacks}层</div>`;
        } else if (d.type === 'water_soak') {
          debuffTags += `<div class="debuff-tag water_soak" title="浸透：特防-1级/层">浸透${d.remainingDuration}回合</div>`;
        } else if (d.type === 'drowning') {
          debuffTags += `<div class="debuff-tag drowning" title="溺水：每回合流失10%当前HP">溺水${d.remainingDuration}回合</div>`;
        } else if (d.type === 'combustion') {
          debuffTags += `<div class="debuff-tag combustion" title="燃尽：${d.remainingDuration}回合后扣除30%当前HP">燃尽${d.remainingDuration}回合</div>`;
        } else if (d.type === 'burn_mark') {
          const damageTypeText = d.damageType === 'physical' ? '物理' : '特殊';
          debuffTags += `<div class="debuff-tag burn_mark" title="灼伤印记：每次行动前受到自身${d.power || 40}威力${damageTypeText}伤害">灼伤印记</div>`;
        } else if (d.type === 'wither') {
          debuffTags += `<div class="debuff-tag wither" title="枯萎：每回合受到自身属性${d.damagePerStack || 10}点威力伤害">枯萎${d.stacks}层</div>`;
        } else if (d.type === 'muddy') {
          debuffTags += `<div class="debuff-tag muddy" title="浑浊：命中率-1级/层">浑浊${d.stacks}层</div>`;
        } else if (d.type === 'parasitic_seed') {
          debuffTags += `<div class="debuff-tag parasitic" title="寄生种子：每回合流失HP+施法者回复">寄生种子</div>`;
        } else if (d.type === 'steam_burn') {
          debuffTags += `<div class="debuff-tag steam" title="蒸汽灼伤：每回合2%最大HP伤害">蒸汽灼伤</div>`;
        } else if (d.type === 'weakness') {
          debuffTags += `<div class="debuff-tag weakness" title="虚弱：无法使用技能">虚弱${d.remainingDuration}回合</div>`;
        }
      });
    }

    // Buff标签
    if (unit.attackBoost && unit.attackBoost > 0) {
      buffTags += `<div class="buff-tag attack_boost" title="攻击+${unit.attackBoost}级">攻+${unit.attackBoost}</div>`;
    }
    if (unit.spAtkBoost && unit.spAtkBoost > 0) {
      buffTags += `<div class="buff-tag sp_atk_boost" title="特攻+${unit.spAtkBoost}级">特攻+${unit.spAtkBoost}</div>`;
    }
    if (unit.speedBoost && unit.speedBoost > 0) {
      buffTags += `<div class="buff-tag speed_boost" title="速度+${unit.speedBoost}级">速+${unit.speedBoost}</div>`;
    }
    if (unit.defenseBoost && unit.defenseBoost > 0) {
      buffTags += `<div class="buff-tag defense_boost" title="防御+${unit.defenseBoost}级">防+${unit.defenseBoost}</div>`;
    }
    if (unit.fireDamageBoost && unit.fireDamageBoost > 0) {
      buffTags += `<div class="buff-tag fire_damage_boost" title="火属性伤害+${Math.round(unit.fireDamageBoost * 100)}%">火伤+${Math.round(unit.fireDamageBoost * 100)}%</div>`;
    }
    if (unit.flameCharge && unit.flameChargeTurns > 0) {
      buffTags += `<div class="buff-tag flame_charge" title="蓄焰：下次火属性攻击威力+${unit.flameChargePower}">蓄焰${unit.flameChargeTurns}回合</div>`;
    }
    if (unit.wallOfFlamesPower > 0) {
      buffTags += `<div class="buff-tag wall_of_flames" title="烈火护体：下次火属性攻击威力+${unit.wallOfFlamesPower}">烈火${unit.wallOfFlamesPower}</div>`;
    }
    if (unit.aquaShield || (unit.buffs && unit.buffs.some(b => b.type === 'aqua_shield'))) {
      buffTags += `<div class="buff-tag aqua_shield" title="水之守护：受到攻击时反击者获得浸透">水之守护</div>`;
    }
    if (unit.counterStance) {
      buffTags += `<div class="buff-tag counter" title="防反之姿：反弹伤害+先手">防反</div>`;
    }
    if (unit.entangleOnHit) {
      buffTags += `<div class="buff-tag entangle" title="藤蔓护甲：受到攻击时缠绕攻击者">藤蔓</div>`;
    }
    if (unit.rootBound) {
      buffTags += `<div class="buff-tag root" title="扎根之躯：每回合回复8%HP，速度-1级">扎根</div>`;
    }
    if (unit.lightGatherStacks && unit.lightGatherStacks > 0) {
      buffTags += `<div class="buff-tag light_gather" title="光能汇聚：草系技能+${60 * unit.lightGatherStacks}威力">光能×${unit.lightGatherStacks}</div>`;
    }
    if (unit.comboCharge) {
      buffTags += `<div class="buff-tag combo" title="连击充能：下次攻击享受增伤">连击充能</div>`;
    }
    if (unit.fragrantBloom) {
      buffTags += `<div class="buff-tag fragrant" title="芬芳绽放：草系伤害+25%，每回合回复5%HP">芬芳</div>`;
    }
    if (unit.buffs) {
      unit.buffs.forEach(b => {
        if (b.type === 'clear_spring') {
          buffTags += `<div class="buff-tag clear_spring" title="清泉护盾：每回合回复10%HP并清除1个负面状态">清泉${b.remainingDuration}回合</div>`;
        } else if (b.type === 'flow') {
          buffTags += `<div class="buff-tag flow" title="流水：速度+1级">流水${b.remainingDuration}回合</div>`;
        }
      });
    }

    div.innerHTML = `
      <div class="target-indicator"></div>
      <div class="unit-avatar ${isDead ? 'dead' : ''}">
        <div class="player-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
      </div>
      <div class="unit-info">
        <div class="unit-name">${unit.name}${isExecuted ? '<span class="executed-hint">已行动</span>' : ''}</div>
        <div class="unit-level">速:${unit.speed}</div>
        <div class="hp-bar-container"><div class="hp-bar ${isDead ? 'critical' : ''}" style="width:${isDead ? 0 : (unit.currentHp/unit.maxHp)*100}%"></div></div>
        <div class="hp-text">${isDead ? '倒下' : `${unit.currentHp} / ${unit.maxHp}`}</div>
        <div class="status-icons">${statusIcons}</div>
        ${debuffTags ? `<div class="debuff-tags">${debuffTags}</div>` : ''}
        ${buffTags ? `<div class="buff-tags">${buffTags}</div>` : ''}
      </div>
      <div class="energy-bar-container">
        ${Array.from({length: Math.min(unit.energy, 10)}, () => '<div class="energy-orb filled"></div>').join('')}
        ${Array.from({length: Math.max(0, MAX_ENERGY - unit.energy)}, () => '<div class="energy-orb"></div>').join('')}
      </div>
    `;
    div.onclick = () => onPlayerClick(unit);
    if (!isDead) container.appendChild(div);
  });
}

function renderEnemyUnits() {
  const container = document.getElementById('enemySide');
  container.innerHTML = '';
  enemyUnits.forEach(unit => {
    const div = document.createElement('div');
    div.id = unit.id;
    div.className = 'unit enemy';
    const isDead = unit.currentHp <= 0;

    // 意图图标：直接使用 intent.targetId 判断目标
    // 如果 targetId 等于敌人自己的 id，说明是自身技能（如火盾），显示"自"
    // 否则显示 targetId 对应单位的名字首字
    let intentTargetName = '';
    if (unit.intent.targetId === unit.id) {
      // 自身技能：防御/治疗/强化类
      intentTargetName = '自';
    } else {
      // 攻击类：显示目标敌人名称
      let target = playerUnits.find(p => p.id === unit.intent.targetId && p.currentHp > 0);
      if (!target) {
        const alivePlayers = playerUnits.filter(p => p.currentHp > 0);
        if (alivePlayers.length > 0) {
          target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        }
      }
      intentTargetName = target ? target.name.charAt(0) : '?';
    }

    // 状态图标
    let statusIcons = '';
    if (unit.shield && unit.shield > 0) {
      statusIcons += `<div class="status-icon shield-icon" title="护盾: ${unit.shield}">盾</div>`;
    }
    if (unit.damageReduction && unit.damageReduction > 0) {
      statusIcons += `<div class="status-icon reduction-icon" title="减伤: ${Math.round(unit.damageReduction * 100)}%">减${Math.round(unit.damageReduction * 100)}%</div>`;
    }

    // Buff/Debuff状态标签
    let debuffTags = '';
    let buffTags = '';

    // Debuff标签
    if (unit.debuffs) {
      unit.debuffs.forEach(d => {
        if (d.type === 'burn' && d.stacks > 0) {
          debuffTags += `<div class="debuff-tag burn" title="灼烧：每层2%最大HP/回合，层数减半">灼烧${d.stacks}层</div>`;
        } else if (d.type === 'freeze') {
          debuffTags += `<div class="debuff-tag freeze" title="冻结：无法行动">冻结${d.remainingDuration}回合</div>`;
        } else if (d.type === 'paralyze') {
          debuffTags += `<div class="debuff-tag paralyze" title="麻痹：速度-1级">麻痹${d.remainingDuration}回合</div>`;
        } else if (d.type === 'poison' && d.stacks > 0) {
          debuffTags += `<div class="debuff-tag poison" title="中毒：每层2%最大HP/回合">中毒${d.stacks}层</div>`;
        } else if (d.type === 'water_soak') {
          debuffTags += `<div class="debuff-tag water_soak" title="浸透：特防-1级/层">浸透${d.remainingDuration}回合</div>`;
        } else if (d.type === 'drowning') {
          debuffTags += `<div class="debuff-tag drowning" title="溺水：每回合流失10%当前HP">溺水${d.remainingDuration}回合</div>`;
        } else if (d.type === 'combustion') {
          debuffTags += `<div class="debuff-tag combustion" title="燃尽：${d.remainingDuration}回合后扣除30%当前HP">燃尽${d.remainingDuration}回合</div>`;
        } else if (d.type === 'burn_mark') {
          const damageTypeText = d.damageType === 'physical' ? '物理' : '特殊';
          debuffTags += `<div class="debuff-tag burn_mark" title="灼伤印记：每次行动前受到自身${d.power || 40}威力${damageTypeText}伤害">灼伤印记</div>`;
        } else if (d.type === 'wither') {
          debuffTags += `<div class="debuff-tag wither" title="枯萎：每回合受到自身属性${d.damagePerStack || 10}点威力伤害">枯萎${d.stacks}层</div>`;
        } else if (d.type === 'muddy') {
          debuffTags += `<div class="debuff-tag muddy" title="浑浊：命中率-1级/层">浑浊${d.stacks}层</div>`;
        } else if (d.type === 'parasitic_seed') {
          debuffTags += `<div class="debuff-tag parasitic" title="寄生种子：每回合流失HP+施法者回复">寄生种子</div>`;
        } else if (d.type === 'steam_burn') {
          debuffTags += `<div class="debuff-tag steam" title="蒸汽灼伤：每回合2%最大HP伤害">蒸汽灼伤</div>`;
        } else if (d.type === 'weakness') {
          debuffTags += `<div class="debuff-tag weakness" title="虚弱：无法使用技能">虚弱${d.remainingDuration}回合</div>`;
        }
      });
    }

    // Buff标签
    if (unit.attackBoost && unit.attackBoost > 0) {
      buffTags += `<div class="buff-tag attack_boost" title="攻击+${unit.attackBoost}级">攻+${unit.attackBoost}</div>`;
    }
    if (unit.spAtkBoost && unit.spAtkBoost > 0) {
      buffTags += `<div class="buff-tag sp_atk_boost" title="特攻+${unit.spAtkBoost}级">特攻+${unit.spAtkBoost}</div>`;
    }
    if (unit.speedBoost && unit.speedBoost > 0) {
      buffTags += `<div class="buff-tag speed_boost" title="速度+${unit.speedBoost}级">速+${unit.speedBoost}</div>`;
    }
    if (unit.defenseBoost && unit.defenseBoost > 0) {
      buffTags += `<div class="buff-tag defense_boost" title="防御+${unit.defenseBoost}级">防+${unit.defenseBoost}</div>`;
    }
    if (unit.fireDamageBoost && unit.fireDamageBoost > 0) {
      buffTags += `<div class="buff-tag fire_damage_boost" title="火属性伤害+${Math.round(unit.fireDamageBoost * 100)}%">火伤+${Math.round(unit.fireDamageBoost * 100)}%</div>`;
    }
    if (unit.flameCharge && unit.flameChargeTurns > 0) {
      buffTags += `<div class="buff-tag flame_charge" title="蓄焰：下次火属性攻击威力+${unit.flameChargePower}">蓄焰${unit.flameChargeTurns}回合</div>`;
    }
    if (unit.wallOfFlamesPower > 0) {
      buffTags += `<div class="buff-tag wall_of_flames" title="烈火护体：下次火属性攻击威力+${unit.wallOfFlamesPower}">烈火${unit.wallOfFlamesPower}</div>`;
    }
    if (unit.aquaShield || (unit.buffs && unit.buffs.some(b => b.type === 'aqua_shield'))) {
      buffTags += `<div class="buff-tag aqua_shield" title="水之守护：受到攻击时反击者获得浸透">水之守护</div>`;
    }
    if (unit.counterStance) {
      buffTags += `<div class="buff-tag counter" title="防反之姿：反弹伤害+先手">防反</div>`;
    }
    if (unit.entangleOnHit) {
      buffTags += `<div class="buff-tag entangle" title="藤蔓护甲：受到攻击时缠绕攻击者">藤蔓</div>`;
    }
    if (unit.rootBound) {
      buffTags += `<div class="buff-tag root" title="扎根之躯：每回合回复8%HP，速度-1级">扎根</div>`;
    }
    if (unit.lightGatherStacks && unit.lightGatherStacks > 0) {
      buffTags += `<div class="buff-tag light_gather" title="光能汇聚：草系技能+${60 * unit.lightGatherStacks}威力">光能×${unit.lightGatherStacks}</div>`;
    }
    if (unit.comboCharge) {
      buffTags += `<div class="buff-tag combo" title="连击充能：下次攻击享受增伤">连击充能</div>`;
    }
    if (unit.fragrantBloom) {
      buffTags += `<div class="buff-tag fragrant" title="芬芳绽放：草系伤害+25%，每回合回复5%HP">芬芳</div>`;
    }
    if (unit.buffs) {
      unit.buffs.forEach(b => {
        if (b.type === 'clear_spring') {
          buffTags += `<div class="buff-tag clear_spring" title="清泉护盾：每回合回复10%HP并清除1个负面状态">清泉${b.remainingDuration}回合</div>`;
        } else if (b.type === 'flow') {
          buffTags += `<div class="buff-tag flow" title="流水：速度+1级">流水${b.remainingDuration}回合</div>`;
        }
      });
    }

    div.innerHTML = `
      <div class="target-indicator"></div>
      <div class="intent-display intent-${unit.intent.type}" data-intent='${JSON.stringify(unit.intent)}'>
        <span class="intent-char">${intentTargetName}</span>
      </div>
      <div class="unit-avatar enemy-avatar ${isDead ? 'dead' : ''}">
        <div class="enemy-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
      </div>
      <div class="unit-info">
        <div class="unit-name">${unit.name}</div>
        <div class="unit-level">速:${unit.speed}</div>
        <div class="hp-bar-container"><div class="hp-bar ${isDead ? 'critical' : ''}" style="width:${isDead ? 0 : (unit.currentHp/unit.maxHp)*100}%"></div></div>
        <div class="hp-text">${isDead ? '倒下' : `${unit.currentHp} / ${unit.maxHp}`}</div>
        <div class="status-icons">${statusIcons}</div>
        ${debuffTags ? `<div class="debuff-tags">${debuffTags}</div>` : ''}
        ${buffTags ? `<div class="buff-tags">${buffTags}</div>` : ''}
      </div>
      <div class="energy-bar-container">
        ${Array.from({length: Math.min(unit.energy || 0, 10)}, () => '<div class="energy-orb filled"></div>').join('')}
        ${Array.from({length: Math.max(0, MAX_ENERGY - (unit.energy || 0))}, () => '<div class="energy-orb"></div>').join('')}
      </div>
    `;
    if (!isDead) {
      div.onclick = () => onEnemyClick(unit);
      setupIntentTooltip(div, unit);
    }
    container.appendChild(div);
  });
}

function setupIntentTooltip(el, unit) {
  const icon = el.querySelector('.intent-display');
  icon.onmouseenter = (e) => {
    // 1. 显示基本意图信息
    const tooltip = document.createElement('div');
    tooltip.className = 'intent-tooltip';
    // 直接使用 intent.targetId 判断目标
    let targetName = '';
    let targetUnit = null;
    if (unit.intent.targetId === unit.id) {
      // 自身技能：显示施法者自己的名字
      targetName = unit.name;
      targetUnit = unit; // 自身技能的目标是敌人自己
    } else {
      // 攻击类：显示目标敌人名称
      targetUnit = playerUnits.find(p => p.id === unit.intent.targetId && p.currentHp > 0);
      if (!targetUnit) {
        const alivePlayers = playerUnits.filter(p => p.currentHp > 0);
        if (alivePlayers.length > 0) {
          targetUnit = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        }
      }
      targetName = targetUnit ? targetUnit.name : '未知目标';
    }
    // 获取技能名称
    let skillName = '';
    let skill = null;
    if (unit.intent.skillId && unit.skills) {
      skill = unit.skills.find(s => s.id === unit.intent.skillId);
      if (skill) {
        skillName = skill.name;
      }
    }
    // 组合意图显示信息
    let intentHtml = `<strong>${getIntentText(unit.intent.type)}</strong>`;
    if (skillName) {
      intentHtml = `<strong>${skillName}</strong>`;
    }
    if (unit.intent.power && unit.intent.type === 'attack') {
      intentHtml += `<br>威力: ${unit.intent.power}`;
    }
    // 直接使用 targetId 判断：自身技能显示施法者，治疗/防御/强化技能显示自身
    if (unit.intent.targetId === unit.id) {
      intentHtml += `<br>目标: ${unit.name}`;
    } else if (targetName) {
      intentHtml += `<br>目标: ${targetName}`;
    }
    tooltip.innerHTML = intentHtml;
    document.body.appendChild(tooltip);
    const rect = icon.getBoundingClientRect();
    tooltip.style.left = (rect.right + 10) + 'px';
    tooltip.style.top = rect.top + 'px';
    icon._tooltip = tooltip;

    // 2. 显示技能详细信息框（引用技能卡悬停的显示逻辑）
    if (skill) {
      showSkillTooltip(e, skill, icon, targetUnit);
    }
  };
  icon.onmouseleave = () => {
    if (icon._tooltip) { icon._tooltip.remove(); delete icon._tooltip; }
    hideSkillTooltip();
  };
}
