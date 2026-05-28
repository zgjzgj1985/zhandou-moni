// Source: battle-simple.html lines 3352-3569
// 事件处理系统

// ==================== 事件处理 ====================

function onPlayerClick(unit) {
  // 模式2（宝可梦模式）有单独的点击逻辑
  if (currentBattleMode === 2) {
    if (battleEnded || isExecuting) return;
    // 如果该伙伴已有指令，允许查看技能状态
    if (playerCommands.find(c => c.casterId === unit.id && c.status === 'pending')) {
      selectedPlayer = unit;
      document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
      document.getElementById(unit.id)?.classList.add('selected');
      return;
    }
    if (selectedPlayer && selectedPlayer.id === unit.id) {
      selectedPlayer = null;
      renderSkillPanel(null);
    } else {
      selectedPlayer = unit;
      renderSkillPanel(unit);
    }
    renderPlayerUnits();
    return;
  }

  // 模式3（以太术士模式）
  if (currentBattleMode === 3) {
    onPlayerClickMode3(unit);
    return;
  }

  // 模式1（经典模式）
  onPlayerClickClassic(unit);
}

// 模式3：以太术士模式 - 玩家逐个选择伙伴行动
function onPlayerClickMode3(unit) {
  if (battleEnded) return;

  // 检查伙伴是否存活
  if (unit.currentHp <= 0) return;

  // 检查伙伴是否已经行动过
  if (executedPlayerIds.has(unit.id)) {
    addLog(`${unit.name} 已经行动过了`);
    return;
  }

  // 如果战斗还没开始或处于idle阶段，点击伙伴时开始战斗并初始化轮次
  if (phase === 'idle' || !isBattleStarted) {
    startRoundMode3();
    // 立即显示行动顺序面板
    document.getElementById('actionOrderDisplay').classList.add('visible');
    return;
  }

  // 检查是否正在执行行动中（玩家行动阶段不允许选择其他伙伴）
  if (phase === 'player_action') {
    // 如果是当前正在等待的伙伴，可以选择
    if (selectedPlayer && selectedPlayer.id === unit.id) {
      selectedPlayer = unit;
      renderSkillPanel(unit);
      renderPlayerUnits();
    } else {
      addLog(`请等待当前伙伴完成行动`);
    }
    return;
  }

  // 玩家选择阶段：手动选择伙伴（优先级高于自动选择）
  selectedPlayer = unit;
  renderSkillPanel(unit);
  renderPlayerUnits();
}

// 模式1（经典模式）
function onPlayerClickClassic(unit) {
  if (battleEnded) return;

  // 如果战斗还没开始，点击玩家时开始战斗并选中该玩家
  if (!isBattleStarted) {
    isBattleStarted = true;
    isRoundExecuting = true;
    document.getElementById('actionOrderDisplay').classList.add('visible');
    addLog('===== 战斗开始 =====');
    addLog('选择技能开始行动！');

    // 选中点击的伙伴并显示技能面板
    selectedPlayer = unit;
    renderSkillPanel(unit);
    renderPlayerUnits();
    updateTurnDisplay();
    return;
  }

  // 检查是否是当前应该行动的伙伴
  const action = getCurrentAction();
  if (action && action.type === 'player' && action.caster.id === unit.id) {
    // 该伙伴是当前应该行动的单位，选中它显示技能
    selectedPlayer = unit;
    renderSkillPanel(unit);
    renderPlayerUnits();
    return;
  }

  // 如果该伙伴已有指令，允许查看
  if (playerCommands.find(c => c.casterId === unit.id && c.status === 'pending')) {
    selectedPlayer = unit;
    document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
    document.getElementById(unit.id)?.classList.add('selected');
    return;
  }

  // 其他情况：选中显示技能面板
  if (selectedPlayer && selectedPlayer.id === unit.id) {
    selectedPlayer = null;
    renderSkillPanel(null);
  } else {
    selectedPlayer = unit;
    renderSkillPanel(unit);
  }
  renderPlayerUnits();
}

function onEnemyClick(unit) {
  // 点击敌人不执行任何操作，拖拽时在dragPreview的mouseup中处理
}

function deselectPlayer() {
  selectedPlayer = null;
  draggedSkill = null;
  document.querySelectorAll('.unit').forEach(el => el.classList.remove('targetable', 'selected', 'matchup-super', 'matchup-weak'));
  // 移除所有克制关系提示
  document.querySelectorAll('.matchup-hint').forEach(el => el.remove());
  renderPlayerUnits();
  renderSkillPanel(null);
}

// 清除拖拽相关的指示器（克制关系边框和提示），保留伙伴选择状态
function clearDragIndicators() {
  document.querySelectorAll('.unit').forEach(el => el.classList.remove('targetable', 'matchup-super', 'matchup-weak'));
  document.querySelectorAll('.matchup-hint').forEach(el => el.remove());
}

// ==================== 指令系统 ====================
async function addCommand(caster, skill, targetId) {
  // 检查能量是否足够
  if (caster.energy < skill.energyCost) {
    addLog(`${caster.name} 能量不足，无法使用 ${skill.name}`);
    return false;
  }

  const energyBefore = caster.energy;

  // 消耗能量
  caster.energy -= skill.energyCost;

  // 添加指令
  const cmd = {
    casterId: caster.id,
    skillId: skill.id,
    targetId: targetId,
    status: 'pending',
    energySpent: skill.energyCost,
    energyBefore: energyBefore,
    energyAfter: caster.energy
  };
  playerCommands.push(cmd);

  addLog(`${caster.name} 下达指令：${skill.name}（消耗${skill.energyCost}能量 ${energyBefore}→${caster.energy}）`);
  renderCommandList();
  renderSkillPanel(caster);
  renderPlayerUnits();
  updateTurnDisplay();

  // 模式2（宝可梦模式）：检查是否所有存活伙伴都已下达指令
  if (currentBattleMode === 2) {
    checkAllReady();
    deselectPlayer();
    return true;
  }

  // 模式3（以太术士模式）：如果选择了该伙伴，立即执行
  if (currentBattleMode === 3) {
    if (phase === 'player_action' && selectedPlayer && selectedPlayer.id === caster.id) {
      await executePlayerActionAndContinueMode3(caster, skill, targetId);
    } else if (phase === 'player_select' && selectedPlayer && selectedPlayer.id === caster.id) {
      await executePlayerActionAndContinueMode3(caster, skill, targetId);
    } else {
      deselectPlayer();
    }
    return true;
  }

  return true;
}

// 检查是否所有存活伙伴都已下达指令（模式2）
function checkAllReady() {
  const alivePlayers = playerUnits.filter(u => u.currentHp > 0);
  const readyCount = playerCommands.filter(c => {
    const unit = playerUnits.find(p => p.id === c.casterId);
    return unit && unit.currentHp > 0;
  }).length;

  if (alivePlayers.length > 0 && readyCount === alivePlayers.length) {
    // 所有存活伙伴都已下达指令，自动开始战斗结算
    setTimeout(() => startCombatPhase(), 500);
  }
}

// 更新目标指示器
function updateTargetIndicators(skill) {
  // 移除所有高亮和克制关系样式
  document.querySelectorAll('.unit').forEach(el => {
    el.classList.remove('targetable', 'matchup-super', 'matchup-weak');
  });
  // 移除所有克制关系提示
  document.querySelectorAll('.matchup-hint').forEach(el => el.remove());

  if (skill.target === 'single_enemy' || skill.target === 'all_enemy') {
    // 对敌人技能：根据克制关系高亮
    enemyUnits.filter(e => e.currentHp > 0).forEach(e => {
      const el = document.getElementById(e.id);
      if (el) {
        el.classList.add('targetable');
        // 计算克制关系
        if (skill.element) {
          const multiplier = calculateDamageMultiplier(skill.element, e.elements || [e.element]);
          if (multiplier >= 2) {
            el.classList.add('matchup-super');
          } else if (multiplier < 1) {
            el.classList.add('matchup-weak');
          }
          // 在敌人信息框右侧显示克制关系
          const hint = document.createElement('div');
          hint.className = 'matchup-hint';
          if (multiplier >= 4) {
            hint.classList.add('super');
            hint.textContent = `效果绝佳 ×${multiplier}`;
          } else if (multiplier >= 2) {
            hint.classList.add('super');
            hint.textContent = `效果拔群 ×${multiplier}`;
          } else if (multiplier < 1) {
            hint.classList.add('weak');
            hint.textContent = `逆属性 ×${multiplier}`;
          } else {
            hint.classList.add('normal');
            hint.textContent = `普通 ×${multiplier}`;
          }
          el.appendChild(hint);
        }
      }
    });
  } else if (skill.target === 'single_ally' || skill.target === 'ally') {
    // 对己方技能
    playerUnits.filter(u => u.currentHp > 0).forEach(u => {
      const el = document.getElementById(u.id);
      if (el) {
        el.classList.add('targetable');
      }
    });
  } else if (skill.target === 'self') {
    // 自身技能：只高亮自己
    const el = document.getElementById(selectedPlayer.id);
    if (el) {
      el.classList.add('targetable');
    }
  } else if (skill.target === 'all_ally') {
    // 全体队友技能：高亮所有己方存活单位
    playerUnits.filter(u => u.currentHp > 0).forEach(u => {
      const el = document.getElementById(u.id);
      if (el) {
        el.classList.add('targetable');
      }
    });
  }
}
