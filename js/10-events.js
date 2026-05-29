// Source: battle-simple.html lines 3352-3569
// 事件处理系统
// 包含：点击伙伴、点击敌人、下达指令、拖拽释放等事件处理
// 模式1（经典模式）：点击伙伴 → 初始化敌人意图 → 构建行动队列 → 按速度依次行动
// 模式2（宝可梦模式）：伙伴先选技能 → 全部下达指令后统一结算
// 模式3（以太术士模式）：伙伴按速度顺序逐个选择技能并执行

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
// 经典模式：点击伙伴 → 初始化敌人意图 → 构建行动队列 → 展示行动顺序 → 按速度依次行动
// 敌人立即行动，玩家手动选择技能，行动后自动切换到下一个速度最快的未行动伙伴
function onPlayerClickClassic(unit) {
  if (battleEnded) return;

  // 如果战斗还没开始，点击玩家时开始战斗并初始化一切
  if (!isBattleStarted) {
    isBattleStarted = true;
    isRoundExecuting = true;
    currentActionIndex = 0;
    executedPlayerIds.clear();
    playerCommands = [];

    addLog('===== 战斗开始 =====');

    // 1. 初始化敌人意图
    for (const enemy of enemyUnits) {
      if (enemy.currentHp > 0) {
        updateEnemyIntent(enemy);
      }
    }
    renderEnemyUnits();

    // 2. 构建行动队列（所有存活伙伴 + 所有敌人，按速度从高到低排序）
    actionQueue = buildActionQueue();
    showActionOrder(actionQueue);

    // 3. 显示技能面板，交给 executeNextAction 决定当前行动者
    selectedPlayer = null;
    renderPlayerUnits();
    updateTurnDisplay();

    // 4. 启动行动循环（由 executeNextAction 决定是敌人直接行动还是玩家选技能）
    executeNextAction();
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

  // 其他情况：允许自由切换伙伴以查看技能
  // 注意：拖拽使用技能的限制在 renderSkillPanel 的 onmousedown 中检查
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
  // 模式3中，伙伴行动后需要重新自动选择，不清除选择状态
  // 只有玩家手动点击其他地方时才清除
  if (currentBattleMode === 3 && selectedPlayer) {
    return;
  }
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

  // 模式1（经典模式）：下达指令后，继续执行战斗流程
  if (currentBattleMode === 1) {
    // 验证当前行动者是否匹配（经典模式必须严格按照速度顺序行动）
    const currentAction = actionQueue[currentActionIndex];
    if (!currentAction || currentAction.type !== 'player' || currentAction.caster.id !== caster.id) {
      // 恢复消耗的能量
      caster.energy += skill.energyCost;
      addLog(`${caster.name} 当前无法行动（速度顺序限制）`);
      return false;
    }
    deselectPlayer();
    // 异步调用继续执行
    continueBattleAfterCommand();
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

// 检查是否所有存活伙伴都已下达指令（模式2宝可梦模式）
// 所有存活伙伴都下达了指令后，触发 startCombatPhaseMode2 开始结算
function checkAllReady() {
  const alivePlayers = playerUnits.filter(u => u.currentHp > 0);
  const readyCount = playerCommands.filter(c => {
    const unit = playerUnits.find(p => p.id === c.casterId);
    return unit && unit.currentHp > 0;
  }).length;

  if (alivePlayers.length > 0 && readyCount === alivePlayers.length) {
    // 所有存活伙伴都已下达指令，自动开始战斗结算
    setTimeout(() => startCombatPhaseMode2(), 500);
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
  } else if (skill.target === 'ally') {
    // 己方单体技能：高亮所有己方存活单位
    playerUnits.filter(u => u.currentHp > 0).forEach(u => {
      const el = document.getElementById(u.id);
      if (el) {
        el.classList.add('targetable');
      }
    });
  } else if (skill.target === 'all_ally') {
    // 全体队友技能：高亮所有己方存活单位
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
  }
}

// ==================== 全局点击事件监听器 ====================
document.addEventListener('click', (e) => {
  // 如果是拖拽释放（未命中目标），跳过此次点击处理
  if (wasDragReleased) {
    wasDragReleased = false;
    return;
  }
  // 点击空白区域时取消选择
  if (!e.target.closest('.unit.player') && !e.target.closest('.skill-panel') && !e.target.closest('.skill-card')) {
    if (!isDragging) deselectPlayer();
  }
});
