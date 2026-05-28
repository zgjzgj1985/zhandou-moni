// Source: battle-simple.html lines 1908-2065
// ==================== 工具函数 ====================

// 检查属性克制
function isCounter(attackElement, defenseElement) {
  const multiplier = TYPE_CHART[attackElement]?.[defenseElement];
  return multiplier === 2;
}

// 策略系统
const strategies = {
  // 攻击技能策略：优先克制属性，次选血量最低
  counter_first: (skill, enemies) => {
    const alive = enemies.filter(e => e.currentHp > 0);
    if (alive.length === 0) return null;
    // 1. 优先克制属性
    const counter = alive.filter(e => isCounter(skill.element, e.element));
    if (counter.length > 0) {
      return counter[Math.floor(Math.random() * counter.length)].id;
    }
    // 2. 血量最低
    alive.sort((a, b) => a.currentHp - b.currentHp);
    return alive[0].id;
  },

  // 治疗技能策略：优先血量百分比最低
  lowest_hp: (skill, allies) => {
    const wounded = allies.filter(a => a.currentHp > 0 && a.currentHp < a.maxHp);
    if (wounded.length === 0) wounded = allies.filter(a => a.currentHp > 0);
    if (wounded.length === 0) return null;
    // 优先血量百分比最低
    wounded.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
    return wounded[0].id;
  },

  // 护盾策略：优先低血量百分比友方
  shield_lowest: (skill, allies) => {
    const alive = allies.filter(a => a.currentHp > 0);
    if (alive.length === 0) return null;
    alive.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
    return alive[0].id;
  },

  // 默认策略：随机选择
  random: (skill, targets) => {
    const alive = targets.filter(t => t.currentHp > 0);
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)].id;
  }
};

// 根据策略获取目标
function resolveTarget(skill, validTargets) {
  const strategyName = skill.strategy || 'random';
  const strategyFn = strategies[strategyName] || strategies.random;
  return strategyFn(skill, validTargets);
}

// 渲染指令列表
function renderCommandList() {
  const commandList = document.getElementById('commandList');
  const container = document.getElementById('commandItems');

  // 经典模式（模式1）不显示指令列表
  if (currentBattleMode === 1) {
    commandList.style.display = 'none';
    return;
  }

  // 模式3（以太术士模式）不显示指令列表
  if (currentBattleMode === 3) {
    commandList.style.display = 'none';
    return;
  }

  // 模式2显示指令列表
  commandList.style.display = 'block';

  const alivePlayers = playerUnits.filter(u => u.currentHp > 0);

  if (alivePlayers.length === 0) {
    container.innerHTML = '<div style="font-size: 11px; color: #8e8e93; text-align: center; padding: 8px;">无存活的伙伴</div>';
    return;
  }

  container.innerHTML = alivePlayers.map(unit => {
    const cmd = playerCommands.find(c => c.casterId === unit.id && c.status === 'pending');
    if (cmd) {
      const skill = unit.skills.find(s => s.id === cmd.skillId);
      const target = [...enemyUnits, ...playerUnits].find(u => u.id === cmd.targetId);
      const targetName = target ? target.name : '未知';
      const energyInfo = cmd.energySpent !== undefined ? `（${cmd.energyBefore}→${cmd.energyAfter}）` : '';
      return `
        <div class="command-item">
          <span class="command-status ready">✓</span>
          <span class="command-caster">${unit.name}</span>
          <span class="command-arrow">→</span>
          <span class="command-skill">${skill ? skill.name : cmd.skillId}</span>
          <span class="command-arrow">→</span>
          <span class="command-target">${targetName}</span>
          <span style="font-size: 10px; color: #30d158; margin-left: 4px;">-${cmd.energySpent || 0}</span>
          <button class="command-cancel" onclick="cancelCommand('${unit.id}')">取消</button>
        </div>
      `;
    } else {
      return `
        <div class="command-item">
          <span class="command-status pending">○</span>
          <span class="command-caster">${unit.name}</span>
          <span class="command-arrow">→</span>
          <span style="font-size: 12px; color: #8e8e93;">待选择...</span>
        </div>
      `;
    }
  }).join('');
}

// 取消指令
function cancelCommand(casterId) {
  const cmd = playerCommands.find(c => c.casterId === casterId && c.status === 'pending');
  if (cmd && cmd.energySpent !== undefined) {
    const caster = playerUnits.find(p => p.id === casterId);
    if (caster) {
      caster.energy += cmd.energySpent;
      addLog(`${caster.name} 取消指令：恢复${cmd.energySpent}能量（${caster.energy - cmd.energySpent}→${caster.energy}）`);
    }
  }
  playerCommands = playerCommands.filter(c => c.casterId !== casterId);
  renderPlayerUnits();
  renderCommandList();
  updateTurnDisplay();
}

function getIntentText(type) {
  const map = { attack: '攻击', buff: '强化', heal: '治疗', defend: '防御' };
  return map[type] || type;
}

function addLog(text, type = '') {
  const content = document.getElementById('logContent');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = text;
  content.insertBefore(entry, content.firstChild);
  if (content.children.length > 20) content.removeChild(content.lastChild);
}

function updateHpBar(unit) {
  const el = document.getElementById(unit.id);
  if (!el) return;
  const bar = el.querySelector('.hp-bar');
  const text = el.querySelector('.hp-text');
  const percent = (unit.currentHp / unit.maxHp) * 100;
  bar.style.width = percent + '%';
  text.textContent = unit.currentHp + ' / ' + unit.maxHp;
  bar.classList.remove('low', 'critical');
  if (percent <= 25) bar.classList.add('critical');
  else if (percent <= 50) bar.classList.add('low');
}
