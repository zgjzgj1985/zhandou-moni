// Source: battle-simple.html lines 2985-3351
// ==================== 技能卡悬停提示 ====================
let skillTooltip = null;

// 获取属性名称
function getElementName(element) {
  const map = { fire: '火', water: '水', grass: '草', electric: '电', ice: '冰', rock: '岩', psychic: '超能', dragon: '龙' };
  return map[element] || '无';
}

// 获取技能类型文本
function getSkillTypeName(type) {
  const map = { fire: '攻击', heal: '治疗', shield: '护盾', buff: '强化', special: '特殊', debuff: '弱化', energy: '回复' };
  return map[type] || '特殊';
}

// 获取技能类型样式
function getSkillTypeClass(type) {
  const map = { fire: 'fire', heal: 'heal', shield: 'shield', buff: 'buff', special: 'special', debuff: 'debuff', energy: 'heal' };
  return map[type] || 'special';
}

// 获取目标类型文本
function getTargetText(target) {
  const map = { single_enemy: '单体敌人', ally: '单体队友', all_enemy: '全体敌人', all_ally: '全体队友', self: '自身' };
  return map[target] || target;
}

// 获取能量消耗文本
function getEnergyCostText(cost) {
  if (cost === 0) return '免费';
  return `${cost}能量`;
}

function showSkillTooltip(e, skill, card, target = null) {
  hideSkillTooltip();
  skillTooltip = document.createElement('div');
  skillTooltip.className = 'skill-tooltip';

  // 基础信息行
  let html = `
    <div class="skill-tooltip-name">${skill.name}</div>
    <div class="skill-tooltip-info">
      <span class="skill-type-badge ${getSkillTypeClass(skill.type)}">${getSkillTypeName(skill.type)}</span>
      ${skill.element ? `<span class="skill-element-badge">${getElementName(skill.element)}属性</span>` : ''}
    </div>
  `;

  // 根据技能类型显示不同信息
  // 攻击技能（包括fire、special、water、electric等有威力的攻击技能）显示威力
  if (skill.type === 'fire' || skill.type === 'special' || skill.type === 'water' ||
      skill.type === 'electric' || skill.type === 'debuff' || skill.type === 'ice') {
    // 雷霆连击：多段攻击显示
    if (skill.effect === 'combo' && skill.comboHits && skill.comboPower) {
      const damageTypeText = skill.type === 'physical' ? '物理' : '特殊';
      html += `<div class="skill-tooltip-power">威力: ${skill.comboPower}×${skill.comboHits}（共${skill.comboPower * skill.comboHits}）${damageTypeText}伤害</div>`;
    } else if (skill.power && skill.power > 0) {
      const damageTypeText = skill.type === 'physical' ? '物理' : '特殊';
      html += `<div class="skill-tooltip-power">威力: ${skill.power}（${damageTypeText}伤害）</div>`;
    }
  } else if (skill.type === 'shield') {
    // 护盾技能 - 显示护盾值
    if (skill.power && skill.power > 0) {
      html += `<div class="skill-tooltip-shield">护盾值: ${skill.power}</div>`;
    }
  } else if (skill.type === 'heal') {
    // 治疗技能 - 显示治疗量
    if (skill.power && skill.power > 0) {
      html += `<div class="skill-tooltip-heal">治疗量: ${skill.power}</div>`;
    }
  } else if (skill.type === 'energy') {
    // 能量回复技能 - 显示回复量
    if (skill.effect === 'energy_restore') {
      html += `<div class="skill-tooltip-energy-restore">回复能量: +${skill.power}</div>`;
    }
  } else if (skill.type === 'buff') {
    // 能量回复技能
    if (skill.effect === 'energy_restore') {
      html += `<div class="skill-tooltip-energy-restore">回复能量: +${skill.power}</div>`;
    } else if (skill.power && skill.power > 0) {
      // 强化技能 - 显示效果说明
      html += `<div class="skill-tooltip-power">强化: +${skill.power}</div>`;
    }
  }

  // 目标
  html += `<div class="skill-tooltip-info">目标: ${getTargetText(skill.target)}</div>`;

  // 能量消耗
  html += `<div class="skill-tooltip-energy">消耗: ${getEnergyCostText(skill.energyCost)}</div>`;

  // 灼伤印记特殊描述
  if (skill.effect === 'burnMark') {
    const damageTypeText = skill.damageType === 'physical' ? '物理' : '特殊';
    const power = skill.burnMarkPower || 40;
    html += `<div class="skill-tooltip-effect">灼伤印记：每次行动前受到自身${power}威力${damageTypeText}伤害</div>`;
  }

  // 特殊效果描述（仅对非burnMark类型显示）
  if (skill.effect && skill.effect !== 'burnMark') {
    let effectText = '';
    if (skill.effect === 'burn') {
      // 灼烧：根据层数显示不同描述
      if (skill.burnStacks) {
        effectText = `目标灼烧（${skill.burnStacks}层），每层2%最大HP/回合，层数减半`;
      } else {
        effectText = '目标灼烧，每层2%最大HP/回合，层数减半';
      }
    } else {
      const effectNames = {
        drain: '每回合吸取目标12%HP',
        poison: '目标中毒，每回合受到8%最大HP伤害',
        freeze: '20%概率冻结目标',
        slow: '目标速度-1级',
        stun: '30%概率使目标昏迷1回合',
        reflect: '反射50%受到的特殊伤害',
        barrier: '免疫下一次攻击',
        paralyze: '目标麻痹',
        combo: '多段攻击',
        priority: '先手+1',
        static_body: '蓄电护体：减伤+蓄电',
        chain_damage: '连锁效果：扩散伤害',
        // 水系效果
        water_soak: '目标获得浸透（特防-1级/层）',
        drowning: '目标溺水（下次能量消耗>3的技能伤害-30%）',
        weakness: '自身虚弱（下一回合无法使用技能）'
      };
      effectText = effectNames[skill.effect] || skill.effect;
    }
    if (effectText) {
      html += `<div class="skill-tooltip-effect">效果: ${effectText}</div>`;
    }

    // 水系效果补充描述
    if (skill.waterSoakEffect) {
      html += `<div class="skill-tooltip-effect">附加「浸透」（特防-1级/层，最多${skill.waterSoakMaxStacks || 6}层，持续${skill.waterSoakDuration || 2}回合）</div>`;
    }
    if (skill.drowningEffect) {
      html += `<div class="skill-tooltip-effect">附加「溺水」（下一次能量消耗>3的技能伤害-30%，持续${skill.drowningDuration || 3}回合）</div>`;
    }
    if (skill.muddyEffect) {
      html += `<div class="skill-tooltip-effect">30%概率使目标获得「浑浊」（命中率-1级/层，最多${skill.muddyMaxStacks || 3}层）</div>`;
    }
    if (skill.steamBurnChance > 0) {
      html += `<div class="skill-tooltip-effect">${Math.round(skill.steamBurnChance * 100)}%概率使目标陷入「蒸汽灼伤」（每回合损失2%最大HP）</div>`;
    }
    if (skill.weaknessEffect) {
      html += `<div class="skill-tooltip-effect">使用后自身获得「虚弱」（下一回合无法使用技能）</div>`;
    }
    if (skill.clearSpringEffect) {
      html += `<div class="skill-tooltip-effect">每回合回复10%HP并清除1个负面状态（持续${skill.clearSpringDuration || 3}回合）</div>`;
    }
    if (skill.flowEffect) {
      html += `<div class="skill-tooltip-effect">附加「流水」（速度+1级，持续2回合）</div>`;
    }
    if (skill.rainyDayEffect) {
      html += `<div class="skill-tooltip-effect">创造雨天环境（持续${skill.rainyDayDuration || 3}回合），水属性技能威力+${Math.round((skill.rainyDayPowerBoost || 0.5) * 100)}%</div>`;
    }
  }

  // 属性克制关系提示（仅攻击技能且有目标时显示）
  if (target && skill.element && (skill.type === 'fire' || skill.type === 'special' || skill.type === 'water' ||
      skill.type === 'electric' || skill.type === 'debuff' || skill.type === 'ice')) {
    const skillElement = skill.element;
    const targetElements = target.elements || [target.element];
    const multiplier = calculateDamageMultiplier(skillElement, targetElements);

    // 根据实际倍率显示提示
    if (multiplier >= 4) {
      html += `<div class="skill-tooltip-matchup super-effective">⚠️ 效果绝佳！造成${multiplier}倍伤害</div>`;
    } else if (multiplier >= 2) {
      html += `<div class="skill-tooltip-matchup super-effective">⚠️ 效果拔群！造成${multiplier}倍伤害</div>`;
    } else if (multiplier <= 0.25) {
      html += `<div class="skill-tooltip-matchup not-effective">效果微乎其微...伤害仅${multiplier}倍</div>`;
    } else if (multiplier < 1) {
      html += `<div class="skill-tooltip-matchup not-effective">效果微弱...伤害仅${multiplier}倍</div>`;
    }
  }

  // 技能描述
  if (skill.description) {
    html += `<div class="skill-tooltip-desc">${skill.description}</div>`;
  }

  skillTooltip.innerHTML = html;
  document.body.appendChild(skillTooltip);

  const rect = card.getBoundingClientRect();
  skillTooltip.style.left = (rect.left + rect.width / 2) + 'px';
  skillTooltip.style.top = (rect.top - 10) + 'px';
  skillTooltip.style.transform = 'translate(-50%, -100%)';
}

function hideSkillTooltip() {
  if (skillTooltip) { skillTooltip.remove(); skillTooltip = null; }
}

function renderSkillPanel(unit) {
  const panel = document.getElementById('skillPanel');
  const hint = document.getElementById('actionHint');
  if (!unit) {
    panel.classList.remove('visible');
    panel.innerHTML = '<div class="action-hint" id="actionHint">点击左侧伙伴选择技能</div>';
    return;
  }
  
  // 获取当前能量
  const currentEnergy = unit.energy;
  
  panel.innerHTML = unit.skills.map(skill => `
    <div class="skill-card ${skill.energyCost > currentEnergy ? 'no-energy' : ''}" data-skill-id="${skill.id}">
      <div class="skill-icon ${skill.type}">
        <svg viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
      </div>
      <div class="skill-name">${skill.name}</div>
      <div class="skill-energy">${getEnergyText(skill.energyCost)}</div>
    </div>
  `).join('') + '<div class="action-hint" id="actionHint">拖动技能到目标</div>';
  panel.classList.add('visible');

  let dragPreview = null;

  panel.querySelectorAll('.skill-card').forEach(card => {
    const skillId = card.dataset.skillId;
    const skill = unit.skills.find(s => s.id === skillId);

    // 悬停显示提示
    card.onmouseenter = (e) => { if (skill) showSkillTooltip(e, skill, card); };
    card.onmouseleave = hideSkillTooltip;

    // 拖拽开始
    card.onmousedown = (e) => {
      if (!skill || skill.energyCost > currentEnergy) return;
      e.preventDefault();
      isDragging = true;

      draggedSkill = skillId;
      updateTargetIndicators(skill);

      // 创建拖拽预览
      dragPreview = document.createElement('div');
      dragPreview.className = 'drag-preview';
      dragPreview.innerHTML = card.innerHTML;
      document.body.appendChild(dragPreview);

      const moveHandler = (e) => {
        if (dragPreview) {
          dragPreview.style.left = e.clientX - 30 + 'px';
          dragPreview.style.top = e.clientY - 38 + 'px';
        }
      };

      const upHandler = async (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        isDragging = false;
        if (dragPreview) { dragPreview.remove(); dragPreview = null; }

        // 查找鼠标位置下的单位元素
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const findUnitElement = (selector) => {
          // 先检查元素本身
          if (elementAtPoint && elementAtPoint.matches && elementAtPoint.matches(selector)) {
            return elementAtPoint;
          }
          // 再检查祖先元素
          return elementAtPoint?.closest(selector);
        };

        // 检查是否在有效目标上释放
        let targetUnit = null;
        let cmdSuccess = false;

        if (skill.target === 'self') {
          // 自身目标技能：必须在自身身上释放
          targetUnit = findUnitElement('.unit.player');
          if (targetUnit && targetUnit.id === unit.id) {
            cmdSuccess = await addCommand(unit, skill, unit.id);
          }
        } else if (skill.target === 'all_enemy') {
          // 全体敌人技能：必须在敌人身上释放
          targetUnit = findUnitElement('.unit.enemy');
          if (targetUnit) {
            cmdSuccess = await addCommand(unit, skill, targetUnit.id);
          }
        } else if (skill.target === 'all_ally') {
          // 全体队友技能：必须在队友身上释放
          targetUnit = findUnitElement('.unit.player');
          if (targetUnit) {
            cmdSuccess = await addCommand(unit, skill, targetUnit.id);
          }
        } else {
          // 单体技能：必须在有效目标上释放
          targetUnit = findUnitElement('.unit.enemy.targetable') || findUnitElement('.unit.player.targetable');
          if (targetUnit) {
            cmdSuccess = await addCommand(unit, skill, targetUnit.id);
          }
        }

        draggedSkill = null;
        // 取消抓取时清除克制关系提示
        clearDragIndicators();

        // 只有成功下达指令才完全取消选择，否则保留技能面板
        if (!cmdSuccess) {
          // 技能未成功使用，标记为拖拽释放，跳过 click 事件处理
          wasDragReleased = true;
        } else {
          deselectPlayer();
        }
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    };

    // 点击选择技能
    card.onclick = (e) => {
      if (skill) updateTargetIndicators(skill);
    };
  });
}
