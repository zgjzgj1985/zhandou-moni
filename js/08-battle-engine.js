// Source: battle-simple.html lines 3570-6248
// 核心战斗流程系统
// 模式1（经典模式）：速度制，玩家按队列顺序手动选择技能，敌人立即行动
// 模式2（宝可梦模式）：准备阶段预存指令，全部下达后按速度统一结算（玩家+敌人穿插执行）
// 模式3（以太术士模式）：速度制，玩家选择技能后立即执行，伙伴全行动完后敌人才行动

// ==================== 模式3（以太术士模式）系统 ====================

// 模式3：选择速度最快的未行动伙伴
function selectNextFastestPlayer() {
  const remainingPlayers = playerUnits.filter(p => p.currentHp > 0 && !executedPlayerIds.has(p.id));
  if (remainingPlayers.length === 0) return null;
  // 按速度降序排序，选择速度最快的
  remainingPlayers.sort((a, b) => b.speed - a.speed);
  return remainingPlayers[0];
}

// 模式3：初始化轮次
function startRoundMode3() {
  if (battleEnded) return;

  isBattleStarted = true;
  isRoundExecuting = true;
  isExecuting = true;

  document.getElementById('skillPanel').classList.remove('visible');
  document.getElementById('commandList').style.display = 'none';

  addLog(`===== 第 ${currentRound} 轮开始 =====`);

  // 初始化敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }
  renderEnemyUnits();

  // 重置玩家行动状态
  executedPlayerIds.clear();
  selectedPlayer = null;

  // 构建行动队列
  playerActionQueue = buildPlayerActionQueueMode3();
  enemyActionQueue = buildEnemyActionQueue();

  // 显示行动顺序
  const allActions = [...playerActionQueue.map(a => ({...a, queueType: 'player'})), ...enemyActionQueue.map(a => ({...a, queueType: 'enemy'}))];
  showActionOrder(allActions);

  // 进入玩家选择阶段，并自动选择速度最快的玩家
  phase = 'player_select';
  const fastestPlayer = selectNextFastestPlayer();
  if (fastestPlayer) {
    selectedPlayer = fastestPlayer;
    renderSkillPanel(fastestPlayer);
    addLog(`自动选择 ${fastestPlayer.name}（速度 ${fastestPlayer.speed}）`);
  }
  updateTurnDisplay();
  renderPlayerUnits();
}

// 模式3：构建玩家行动队列（仅包含未执行过的存活伙伴，用于展示行动顺序）
function buildPlayerActionQueueMode3() {
  const actions = [];
  const alivePlayers = playerUnits.filter(p => p.currentHp > 0);

  for (const player of alivePlayers) {
    // 跳过已执行过的玩家
    if (executedPlayerIds.has(player.id)) continue;

    // 找到该玩家的指令
    const cmd = playerCommands.find(c => c.casterId === player.id && c.status === 'pending');
    let skill = null;
    if (cmd) {
      skill = player.skills.find(s => s.id === cmd.skillId);
    }

    actions.push({
      id: player.id,
      type: 'player',
      caster: player,
      skill: skill,
      targetId: cmd ? cmd.targetId : null,
      speed: player.speed,
      hasCommand: !!cmd,
      command: cmd
    });
  }

  return actions;
}

// 模式3：执行选中的玩家行动
async function executeSelectedPlayerActionMode3() {
  if (!selectedPlayer || battleEnded) return;

  const caster = selectedPlayer;

  // 检查是否有预设指令
  const cmd = playerCommands.find(c => c.casterId === caster.id && c.status === 'pending');

  if (cmd) {
    // 有预设指令，直接执行
    const skill = caster.skills.find(s => s.id === cmd.skillId);
    if (skill) {
      await executePlayerActionAndContinueMode3(caster, skill, cmd.targetId, cmd);
    }
  } else {
    // 没有预设指令，等待选择技能
    renderSkillPanel(caster);
  }
}

// 模式3：执行玩家行动并继续
async function executePlayerActionAndContinueMode3(caster, skill, targetId, cmd) {
  if (battleEnded) return;

  // 标记进入玩家行动阶段
  phase = 'player_action';

  // 查找或创建指令
  let playerCmd = cmd || playerCommands.find(c => c.casterId === caster.id && c.status === 'pending');
  if (!playerCmd) {
    playerCmd = {
      casterId: caster.id,
      skillId: skill.id,
      targetId: targetId,
      status: 'pending'
    };
    playerCommands.push(playerCmd);
  }

  // 更新行动顺序显示
  updateActionOrderDisplay();
  const el = document.getElementById(caster.id);
  if (el) el.classList.add('selected');

  // 执行行动
  await delay(200);
  await executePlayerCommand(caster, skill, targetId);

  // 标记指令为已执行
  playerCmd.status = 'executed';

  // 标记该玩家已执行
  executedPlayerIds.add(caster.id);

  // 清除高亮
  if (el) el.classList.remove('selected');

  await delay(200);

  // 检查战斗结束
  if (checkBattleEnd()) {
    phase = 'idle';
    isRoundExecuting = false;
    return;
  }

  // 从玩家行动队列中移除已执行的玩家
  playerActionQueue = playerActionQueue.filter(a => a.caster.id !== caster.id);

  // 重新构建行动队列并更新显示（模式3需要实时更新已执行状态）
  playerActionQueue = buildPlayerActionQueueMode3();
  enemyActionQueue = buildEnemyActionQueue();
  const allActions = [...playerActionQueue.map(a => ({...a, queueType: 'player', type: 'player'})), ...enemyActionQueue.map(a => ({...a, queueType: 'enemy', type: 'enemy'}))];
  showActionOrder(allActions);

  // 检查是否所有玩家都已行动
  const remainingPlayers = playerUnits.filter(p => p.currentHp > 0 && !executedPlayerIds.has(p.id));
  if (remainingPlayers.length === 0) {
    // 所有玩家行动完毕，进入敌人行动阶段
    await startEnemyPhaseMode3();
  } else {
    // 还有玩家未行动，返回玩家选择阶段
    phase = 'player_select';
    // 自动选择速度最快的未行动玩家
    const nextPlayer = selectNextFastestPlayer();
    if (nextPlayer) {
      selectedPlayer = nextPlayer;
      renderSkillPanel(nextPlayer);
      addLog(`自动选择 ${nextPlayer.name}（速度 ${nextPlayer.speed}）`);
    } else {
      selectedPlayer = null;
      renderSkillPanel(null);
    }
    updateTurnDisplay();
    updateActionOrderDisplay();
    renderPlayerUnits();
  }

  // 解决等待中的 Promise（如果有）
  if (actionResolve) {
    actionResolve();
    actionResolve = null;
  }
}

// 模式3：更新行动顺序显示（玩家行动后）
function updateActionOrderAfterPlayerAction() {
  const items = document.querySelectorAll('.action-order-item');
  items.forEach(item => {
    const icon = item.querySelector('.action-order-icon');
    if (icon && icon.classList.contains('player')) {
      const playerIndex = Array.from(items).indexOf(item);
      const playerId = playerActionQueue[playerIndex]?.caster?.id;
      if (playerId && executedPlayerIds.has(playerId)) {
        item.classList.add('executed');
      }
    }
  });
}

// 模式3：检查是否所有玩家都已行动
function checkAllPlayersExecutedMode3() {
  const alivePlayers = playerUnits.filter(p => p.currentHp > 0);
  return alivePlayers.every(p => executedPlayerIds.has(p.id));
}

// 模式3：开始敌人回合
async function startEnemyPhaseMode3() {
  isExecuting = true;
  updateTurnDisplay();

  addLog('===== 敌人回合开始 =====');
  await delay(300);

  // 执行所有敌人行动
  await executeEnemyTurnMode3();
}

// 模式3：执行所有敌人行动（按 enemyActionQueue 顺序）
async function executeEnemyTurnMode3() {
  for (const action of enemyActionQueue) {
    if (battleEnded) break;
    if (action.caster.currentHp <= 0) continue;

    updateTurnDisplay(action);
    await delay(400);
    await executeEnemyAction(action.caster);
    await delay(200);

    if (checkBattleEnd()) break;
  }

  // 敌人回合结束，进入下一轮
  await finishRoundMode3();
}

// 模式3：回合结算（状态效果、能量重置、进入下一轮）
async function finishRoundMode3() {
  // 标记所有指令为已执行
  playerCommands.forEach(cmd => {
    if (cmd.status === 'pending') cmd.status = 'executed';
  });

  hideActionOrder();
  currentActionIndex = 0;

  // 回合结束 - 处理状态效果
  await delay(300);

  // 处理灼烧效果
  for (const unit of [...playerUnits, ...enemyUnits]) {
    if (unit.currentHp <= 0) continue;

    const burnDebuff = unit.debuffs.find(d => d.type === 'burn');
    if (burnDebuff && burnDebuff.stacks > 0) {
      const burnDamage = Math.floor(unit.maxHp * burnDebuff.damagePercentPerStack * burnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - burnDamage);
      showDamageNumber(unit.id, burnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到灼烧伤害 ${burnDamage} HP（${burnDebuff.stacks}层）`, 'damage');

      burnDebuff.stacks = Math.max(1, Math.floor(burnDebuff.stacks / 2));
      burnDebuff.remainingDuration--;

      if (burnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'burn');
        addLog(`${unit.name} 的灼烧状态消失了`);
      }
    }

    // 处理燃尽印记
    if (unit.combustionStacks > 0 && unit.currentHp > 0) {
      unit.combustionTurnsLeft--;
      if (unit.combustionTurnsLeft <= 0) {
        const combustionDamage = Math.floor(unit.currentHp * 0.3);
        unit.currentHp = Math.max(0, unit.currentHp - combustionDamage);
        showDamageNumber(unit.id, combustionDamage, 'damage');
        updateHpBar(unit);
        addLog(`${unit.name} 的「燃尽印记」触发，受到 ${combustionDamage} 真实伤害！`, 'damage');
        unit.combustionStacks = 0;
      } else {
        addLog(`${unit.name} 的「燃尽印记」剩余 ${unit.combustionTurnsLeft} 回合`);
      }
    }

    // 处理减速状态
    if (unit.slowed && unit.currentHp > 0) {
      unit.slowTurns--;
      if (unit.slowTurns <= 0) {
        unit.slowed = false;
        addLog(`${unit.name} 的减速状态消失了`);
      }
    }

    // 处理属性抗性倒计时
    if (unit.resistanceTurns && unit.currentHp > 0) {
      for (const el in unit.resistanceTurns) {
        unit.resistanceTurns[el]--;
        if (unit.resistanceTurns[el] <= 0) {
          unit.resistances[el] = 0;
          delete unit.resistanceTurns[el];
          addLog(`${unit.name} 的 ${el} 属性抗性消失了`);
        }
      }
    }

    // ==================== 水系状态效果回合处理（模式1）====================
    // 处理浸透状态（特防-1级/层）
    const waterSoakDebuff1 = unit.debuffs.find(d => d.type === 'water_soak');
    if (waterSoakDebuff1 && waterSoakDebuff1.remainingDuration > 0) {
      waterSoakDebuff1.remainingDuration--;
      if (waterSoakDebuff1.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'water_soak');
        addLog(`${unit.name} 的「浸透」状态消失了`);
      }
    }

    // 处理溺水状态
    const drowningDebuff1 = unit.debuffs.find(d => d.type === 'drowning');
    if (drowningDebuff1 && drowningDebuff1.remainingDuration > 0) {
      drowningDebuff1.remainingDuration--;
      if (drowningDebuff1.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'drowning');
        addLog(`${unit.name} 的「溺水」状态消失了`);
      }
    }

    // 处理浑浊状态（命中率-1级/层）
    const muddyDebuff1 = unit.debuffs.find(d => d.type === 'muddy');
    if (muddyDebuff1 && muddyDebuff1.remainingDuration > 0) {
      muddyDebuff1.remainingDuration--;
      if (muddyDebuff1.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'muddy');
        addLog(`${unit.name} 的「浑浊」状态消失了`);
      }
    }

    // 处理蒸汽灼伤状态
    const steamBurnDebuff1 = unit.debuffs.find(d => d.type === 'steam_burn');
    if (steamBurnDebuff1 && steamBurnDebuff1.remainingDuration > 0) {
      const steamBurnDamage1 = Math.floor(unit.maxHp * steamBurnDebuff1.damagePercentPerStack * steamBurnDebuff1.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - steamBurnDamage1);
      showDamageNumber(unit.id, steamBurnDamage1, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到蒸汽灼伤 ${steamBurnDamage1} HP`, 'damage');

      steamBurnDebuff1.remainingDuration--;
      if (steamBurnDebuff1.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'steam_burn');
        addLog(`${unit.name} 的「蒸汽灼伤」状态消失了`);
      }
    }

    // 处理虚弱状态
    const weaknessDebuff1 = unit.debuffs.find(d => d.type === 'weakness');
    if (weaknessDebuff1 && weaknessDebuff1.remainingDuration > 0) {
      weaknessDebuff1.remainingDuration--;
      if (weaknessDebuff1.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'weakness');
        addLog(`${unit.name} 的「虚弱」状态消失了`);
      }
    }

    // 处理清泉护盾状态（每回合回复10%HP并清除1个debuff）
    const clearSpringBuff1 = unit.buffs?.find(b => b.type === 'clear_spring');
    if (clearSpringBuff1 && clearSpringBuff1.remainingDuration > 0) {
      const clearSpringHeal1 = Math.floor(unit.maxHp * clearSpringBuff1.healPercent);
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + clearSpringHeal1);
      showDamageNumber(unit.id, clearSpringHeal1, 'heal');
      updateHpBar(unit);
      addLog(`${unit.name} 的「清泉护盾」回复 ${clearSpringHeal1} HP`, 'heal');

      if (unit.debuffs && unit.debuffs.length > 0) {
        const removedDebuff1 = unit.debuffs.shift();
        addLog(`${unit.name} 的「${removedDebuff1.type}」状态被清泉护盾清除`);
      }

      clearSpringBuff1.remainingDuration--;
      if (clearSpringBuff1.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'clear_spring');
        addLog(`${unit.name} 的「清泉护盾」状态消失了`);
      }
    }

    // 处理流水状态（速度+1级）
    const flowBuff1 = unit.buffs?.find(b => b.type === 'flow');
    if (flowBuff1 && flowBuff1.remainingDuration > 0) {
      flowBuff1.remainingDuration--;
      if (flowBuff1.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'flow');
        addLog(`${unit.name} 的「流水」状态消失了`);
      }
    }

    // 处理雨天天气
    if (globalWeather && globalWeather.type === 'rainy' && globalWeather.duration > 0) {
      globalWeather.duration--;
      if (globalWeather.duration <= 0) {
        globalWeather = null;
        addLog(`雨天天气结束了`);
      }
    }
  }

  await delay(500);

  // 检查战斗是否结束
  if (checkBattleEnd()) {
    isExecuting = false;
    return;
  }

  // 更新敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }

  // 清空指令和行动状态
  playerCommands = [];
  executedPlayerIds.clear();
  playerActionQueue = [];
  enemyActionQueue = [];

  // 更新所有单位的buff/debuff回合数
  updateBuffTurns();

  // 重置能量（每轮回复能量）
  playerUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = MAX_ENERGY;
    }
  });
  enemyUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = Math.min(u.energy + 3, u.maxEnergy);
    }
  });

  // 进入下一轮
  currentRound++;
  phase = 'idle';
  isExecuting = false;
  isRoundExecuting = false;

  renderEnemyUnits();
  renderPlayerUnits();
  updateTurnDisplay();

  addLog(`===== 第 ${currentRound} 轮等待开始 =====`);
  addLog('点击伙伴开始行动');

  // 自动开始下一轮（显示行动顺序列表）
  setTimeout(() => startRoundMode3(), 300);
}

// 执行玩家行动并继续下一个
// 模式1/3：执行技能 → 标记指令完成 → currentActionIndex++ → 递归调用 executeNextAction
// 模式2：调用 executePlayerActionMode2
async function executePlayerActionAndContinue(caster, skill, targetId) {
  if (battleEnded) return;

  // 模式2（宝可梦模式）：使用模式2特定的逻辑
  if (currentBattleMode === 2) {
    await executePlayerActionMode2(caster, skill, targetId);
    return;
  }

  // 模式1和模式3的逻辑
  // 查找或创建指令
  let cmd = playerCommands.find(c => c.casterId === caster.id && c.status === 'pending');
  if (!cmd) {
    cmd = {
      casterId: caster.id,
      skillId: skill.id,
      targetId: targetId,
      status: 'pending'
    };
    playerCommands.push(cmd);
  }

  // 更新行动顺序显示
  updateActionOrderDisplay(currentActionIndex, 'current');
  const el = document.getElementById(caster.id);
  if (el) el.classList.add('selected');

  // 执行行动
  await delay(200);
  await executePlayerCommand(caster, skill, targetId);

  // 标记指令为已执行
  cmd.status = 'executed';

  // 清除高亮
  if (el) el.classList.remove('selected');

  await delay(200);

  // 移动到下一个行动
  currentActionIndex++;

  // 继续执行下一个行动
  await executeNextAction();
}

// 模式2（宝可梦模式）：执行玩家行动
async function executePlayerActionMode2(caster, skill, targetId) {
  if (battleEnded) return;

  // 查找或创建指令
  let cmd = playerCommands.find(c => c.casterId === caster.id && c.status === 'pending');
  if (!cmd) {
    cmd = {
      casterId: caster.id,
      skillId: skill.id,
      targetId: targetId,
      status: 'pending'
    };
    playerCommands.push(cmd);
  }

  // 高亮当前行动单位
  const el = document.getElementById(caster.id);
  if (el) el.classList.add('selected');

  // 执行行动
  await delay(200);
  await executePlayerCommand(caster, skill, targetId);

  // 标记指令为已执行
  cmd.status = 'executed';

  // 标记该玩家已执行
  executedPlayerIds.add(caster.id);

  // 清除高亮
  if (el) el.classList.remove('selected');

  await delay(200);

  // 检查战斗结束
  if (checkBattleEnd()) {
    isRoundExecuting = false;
    return;
  }

  // 从玩家行动队列中移除已执行的玩家
  playerActionQueue = playerActionQueue.filter(a => a.caster.id !== caster.id);

  // 检查是否所有玩家都已行动
  const remainingPlayers = playerUnits.filter(p => p.currentHp > 0 && !executedPlayerIds.has(p.id));
  if (remainingPlayers.length === 0) {
    // 所有玩家行动完毕，进入敌人行动阶段
    await startEnemyPhaseMode2();
  } else {
    // 还有玩家未行动，返回玩家选择阶段
    selectedPlayer = null;
    updateTurnDisplay();
    renderPlayerUnits();
    renderCommandList();
    addLog('选择下一个行动的伙伴');
    // 继续选择下一个行动
    await executeNextActionMode2();
  }
}

// 模式2：开始敌人行动阶段
async function startEnemyPhaseMode2() {
  currentActionIndex = 0;
  addLog('===== 敌人回合开始 =====');
  await delay(300);
  await executeEnemyTurnMode2();
}

// 模式2（宝可梦模式）：玩家选择下一个行动的伙伴
// 从预设指令队列中按速度排序，让玩家依次选择并执行
async function executeNextActionMode2() {
  if (battleEnded) return;

  // 按速度排序行动队列
  playerActionQueue.sort((a, b) => b.caster.speed - a.caster.speed);

  if (playerActionQueue.length === 0) {
    // 所有玩家指令都已执行完毕，进入敌人回合
    await startEnemyPhaseMode2();
    return;
  }

  // 获取当前应该行动的伙伴（速度最快的）
  const nextAction = playerActionQueue[0];
  if (!nextAction || nextAction.caster.currentHp <= 0) {
    // 伙伴已死亡，从队列中移除并继续
    playerActionQueue.shift();
    await executeNextActionMode2();
    return;
  }

  // 高亮当前行动者
  updateTurnDisplay(nextAction);
  updateActionOrderDisplay();

  // 检查是否有预设指令
  const cmd = nextAction.command;
  if (cmd && cmd.status === 'pending') {
    const skill = nextAction.skill;
    if (skill) {
      // 有预设指令，执行该伙伴的行动
      await executePlayerActionMode2(nextAction.caster, skill, nextAction.targetId);
      return;
    }
  }

  // 没有预设指令，等待玩家选择技能
  selectedPlayer = nextAction.caster;
  renderSkillPanel(nextAction.caster);
  renderPlayerUnits();
}

// 模式2：执行敌人回合
async function executeEnemyTurnMode2() {
  while (enemyActionQueue.length > 0) {
    if (battleEnded) break;

    const action = enemyActionQueue[0];

    // 检查敌人是否仍然存活
    if (action.caster.currentHp <= 0) {
      enemyActionQueue.shift();
      continue;
    }

    // 更新UI
    updateTurnDisplay(action);
    updateActionOrderDisplay();

    // 执行行动
    await executeAction(action);
    enemyActionQueue.shift();
    updateEnemyIntent(action.caster);
    // 延迟渲染以确保伤害数字动画有时间播放
    setTimeout(() => renderEnemyUnits(), 1000);

    await delay(200);

    if (checkBattleEnd()) {
      return;
    }
  }

  // 敌人回合结束，进入下一轮
  await finishRound();
}

// 模式2（宝可梦模式）：开始战斗结算阶段
// 玩家指令全部下达后，按速度依次执行所有行动，然后敌人行动
async function startCombatPhaseMode2() {
  isExecuting = true;
  updateTurnDisplay();

  // 隐藏技能面板和指令列表
  document.getElementById('skillPanel').classList.remove('visible');
  document.getElementById('commandList').style.display = 'none';

  addLog('===== 战斗结算开始 =====');

  // 构建行动队列（按速度排序）
  const actionQueue = buildActionQueueMode3();
  showActionOrder(actionQueue);

  await delay(800);

  // 依次执行每个行动（玩家 + 敌人，统一按速度排序）
  for (let i = 0; i < actionQueue.length; i++) {
    if (checkBattleEnd()) break;
    await executeActionMode3(actionQueue[i], i, actionQueue.length);
    await delay(200);
  }

  // 标记所有指令为已执行
  playerCommands.forEach(cmd => {
    if (cmd.status === 'pending') cmd.status = 'executed';
  });

  hideActionOrder();

  // 回合结束 - 处理状态效果
  await delay(300);

  // 处理灼烧效果
  for (const unit of [...playerUnits, ...enemyUnits]) {
    if (unit.currentHp <= 0) continue;

    const burnDebuff = unit.debuffs.find(d => d.type === 'burn');
    if (burnDebuff && burnDebuff.stacks > 0) {
      const burnDamage = Math.floor(unit.maxHp * burnDebuff.damagePercentPerStack * burnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - burnDamage);
      showDamageNumber(unit.id, burnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到灼烧伤害 ${burnDamage} HP（${burnDebuff.stacks}层）`, 'damage');

      burnDebuff.stacks = Math.max(1, Math.floor(burnDebuff.stacks / 2));
      burnDebuff.remainingDuration--;

      if (burnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'burn');
        addLog(`${unit.name} 的灼烧状态消失了`);
      }
    }

    // 处理燃尽印记
    if (unit.combustionStacks > 0 && unit.currentHp > 0) {
      unit.combustionTurnsLeft--;
      if (unit.combustionTurnsLeft <= 0) {
        const combustionDamage = Math.floor(unit.currentHp * 0.3);
        unit.currentHp = Math.max(0, unit.currentHp - combustionDamage);
        showDamageNumber(unit.id, combustionDamage, 'damage');
        updateHpBar(unit);
        addLog(`${unit.name} 的「燃尽印记」触发，受到 ${combustionDamage} 真实伤害！`, 'damage');
        unit.combustionStacks = 0;
      } else {
        addLog(`${unit.name} 的「燃尽印记」剩余 ${unit.combustionTurnsLeft} 回合`);
      }
    }

    // 处理减速状态
    if (unit.slowed && unit.currentHp > 0) {
      unit.slowTurns--;
      if (unit.slowTurns <= 0) {
        unit.slowed = false;
        addLog(`${unit.name} 的减速状态消失了`);
      }
    }

    // 处理属性抗性倒计时
    if (unit.resistanceTurns && unit.currentHp > 0) {
      for (const el in unit.resistanceTurns) {
        unit.resistanceTurns[el]--;
        if (unit.resistanceTurns[el] <= 0) {
          unit.resistances[el] = 0;
          delete unit.resistanceTurns[el];
          addLog(`${unit.name} 的 ${el} 属性抗性消失了`);
        }
      }
    }

    // 处理水系状态效果回合处理
    const waterSoakDebuff = unit.debuffs.find(d => d.type === 'water_soak');
    if (waterSoakDebuff && waterSoakDebuff.remainingDuration > 0) {
      waterSoakDebuff.remainingDuration--;
      if (waterSoakDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'water_soak');
        addLog(`${unit.name} 的「浸透」状态消失了`);
      }
    }

    const drowningDebuff = unit.debuffs.find(d => d.type === 'drowning');
    if (drowningDebuff && drowningDebuff.remainingDuration > 0) {
      drowningDebuff.remainingDuration--;
      if (drowningDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'drowning');
        addLog(`${unit.name} 的「溺水」状态消失了`);
      }
    }

    const muddyDebuff = unit.debuffs.find(d => d.type === 'muddy');
    if (muddyDebuff && muddyDebuff.remainingDuration > 0) {
      muddyDebuff.remainingDuration--;
      if (muddyDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'muddy');
        addLog(`${unit.name} 的「浑浊」状态消失了`);
      }
    }

    const steamBurnDebuff = unit.debuffs.find(d => d.type === 'steam_burn');
    if (steamBurnDebuff && steamBurnDebuff.remainingDuration > 0) {
      const steamBurnDamage = Math.floor(unit.maxHp * steamBurnDebuff.damagePercentPerStack * steamBurnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - steamBurnDamage);
      showDamageNumber(unit.id, steamBurnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到蒸汽灼伤 ${steamBurnDamage} HP`, 'damage');

      steamBurnDebuff.remainingDuration--;
      if (steamBurnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'steam_burn');
        addLog(`${unit.name} 的「蒸汽灼伤」状态消失了`);
      }
    }

    const weaknessDebuff = unit.debuffs.find(d => d.type === 'weakness');
    if (weaknessDebuff && weaknessDebuff.remainingDuration > 0) {
      weaknessDebuff.remainingDuration--;
      if (weaknessDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'weakness');
        addLog(`${unit.name} 的「虚弱」状态消失了`);
      }
    }

    const clearSpringBuff = unit.buffs?.find(b => b.type === 'clear_spring');
    if (clearSpringBuff && clearSpringBuff.remainingDuration > 0) {
      const clearSpringHeal = Math.floor(unit.maxHp * clearSpringBuff.healPercent);
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + clearSpringHeal);
      showDamageNumber(unit.id, clearSpringHeal, 'heal');
      updateHpBar(unit);
      addLog(`${unit.name} 的「清泉护盾」回复 ${clearSpringHeal} HP`, 'heal');

      if (unit.debuffs && unit.debuffs.length > 0) {
        const removedDebuff = unit.debuffs.shift();
        addLog(`${unit.name} 的「${removedDebuff.type}」状态被清泉护盾清除`);
      }

      clearSpringBuff.remainingDuration--;
      if (clearSpringBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'clear_spring');
        addLog(`${unit.name} 的「清泉护盾」状态消失了`);
      }
    }

    const flowBuff = unit.buffs?.find(b => b.type === 'flow');
    if (flowBuff && flowBuff.remainingDuration > 0) {
      flowBuff.remainingDuration--;
      if (flowBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'flow');
        addLog(`${unit.name} 的「流水」状态消失了`);
      }
    }
  }

  await delay(500);

  // 检查战斗是否结束
  if (checkBattleEnd()) {
    isExecuting = false;
    return;
  }

  // 更新敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }

  // 清空指令和行动状态
  playerCommands = [];
  executedPlayerIds.clear();
  playerActionQueue = [];
  enemyActionQueue = [];

  // 更新所有单位的buff/debuff回合数
  updateBuffTurns();

  // 重置能量（每轮回复能量）
  playerUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = MAX_ENERGY;
    }
  });
  enemyUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = Math.min(u.energy + 3, u.maxEnergy);
    }
  });

  // 进入下一轮
  currentRound++;
  isExecuting = false;
  isRoundExecuting = false;

  renderEnemyUnits();
  renderPlayerUnits();
  document.getElementById('commandList').style.display = 'block';
  renderCommandList();
  updateTurnDisplay();

  addLog(`===== 第 ${currentRound} 轮开始 =====`);
  addLog('请为所有伙伴下达指令');

  // 开始下一轮
  setTimeout(() => startRound(), 300);
}

// 模式3（以太术士模式）：开始战斗结算阶段
async function startCombatPhase() {
  isPreparing = false;
  isExecuting = true;
  updateTurnDisplay();

  // 隐藏技能面板和指令列表
  document.getElementById('skillPanel').classList.remove('visible');
  document.getElementById('commandList').style.display = 'none';

  addLog('===== 战斗结算开始 =====');

  // 构建行动队列（按速度排序）
  const actionQueue = buildActionQueueMode3();
  showActionOrder(actionQueue);

  await delay(800);

  // 依次执行每个行动
  for (let i = 0; i < actionQueue.length; i++) {
    if (checkBattleEnd()) break;
    await executeActionMode3(actionQueue[i], i, actionQueue.length);
    await delay(200);
  }

  // 标记所有指令为已执行
  playerCommands.forEach(cmd => {
    if (cmd.status === 'pending') cmd.status = 'executed';
  });

  hideActionOrder();

  // 回合结束 - 处理状态效果
  await delay(300);

  // 处理灼烧效果
  for (const unit of [...playerUnits, ...enemyUnits]) {
    if (unit.currentHp <= 0) continue;

    const burnDebuff = unit.debuffs.find(d => d.type === 'burn');
    if (burnDebuff && burnDebuff.stacks > 0) {
      const burnDamage = Math.floor(unit.maxHp * burnDebuff.damagePercentPerStack * burnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - burnDamage);
      showDamageNumber(unit.id, burnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到灼烧伤害 ${burnDamage} HP（${burnDebuff.stacks}层）`, 'damage');

      burnDebuff.stacks = Math.max(1, Math.floor(burnDebuff.stacks / 2));
      burnDebuff.remainingDuration--;

      if (burnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'burn');
        addLog(`${unit.name} 的灼烧状态消失了`);
      }
    }

    // 处理燃尽印记
    if (unit.combustionStacks > 0 && unit.currentHp > 0) {
      unit.combustionTurnsLeft--;
      if (unit.combustionTurnsLeft <= 0) {
        const combustionDamage = Math.floor(unit.currentHp * 0.3);
        unit.currentHp = Math.max(0, unit.currentHp - combustionDamage);
        showDamageNumber(unit.id, combustionDamage, 'damage');
        updateHpBar(unit);
        addLog(`${unit.name} 的「燃尽印记」触发，受到 ${combustionDamage} 真实伤害！`, 'damage');
        unit.combustionStacks = 0;
      } else {
        addLog(`${unit.name} 的「燃尽印记」剩余 ${unit.combustionTurnsLeft} 回合`);
      }
    }

    // 处理减速状态
    if (unit.slowed && unit.currentHp > 0) {
      unit.slowTurns--;
      if (unit.slowTurns <= 0) {
        unit.slowed = false;
        addLog(`${unit.name} 的减速状态消失了`);
      }
    }

    // 处理属性抗性倒计时
    if (unit.resistanceTurns && unit.currentHp > 0) {
      for (const el in unit.resistanceTurns) {
        unit.resistanceTurns[el]--;
        if (unit.resistanceTurns[el] <= 0) {
          unit.resistances[el] = 0;
          delete unit.resistanceTurns[el];
          addLog(`${unit.name} 的 ${el} 属性抗性消失了`);
        }
      }
    }

    // ==================== 水系状态效果回合处理 ====================
    // 处理浸透状态（特防-1级/层）
    const waterSoakDebuff = unit.debuffs.find(d => d.type === 'water_soak');
    if (waterSoakDebuff && waterSoakDebuff.remainingDuration > 0) {
      waterSoakDebuff.remainingDuration--;
      if (waterSoakDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'water_soak');
        addLog(`${unit.name} 的「浸透」状态消失了`);
      }
    }

    // 处理溺水状态
    const drowningDebuff = unit.debuffs.find(d => d.type === 'drowning');
    if (drowningDebuff && drowningDebuff.remainingDuration > 0) {
      drowningDebuff.remainingDuration--;
      if (drowningDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'drowning');
        addLog(`${unit.name} 的「溺水」状态消失了`);
      }
    }

    // 处理浑浊状态（命中率-1级/层）
    const muddyDebuff = unit.debuffs.find(d => d.type === 'muddy');
    if (muddyDebuff && muddyDebuff.remainingDuration > 0) {
      muddyDebuff.remainingDuration--;
      if (muddyDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'muddy');
        addLog(`${unit.name} 的「浑浊」状态消失了`);
      }
    }

    // 处理蒸汽灼伤状态
    const steamBurnDebuff = unit.debuffs.find(d => d.type === 'steam_burn');
    if (steamBurnDebuff && steamBurnDebuff.remainingDuration > 0) {
      const steamBurnDamage = Math.floor(unit.maxHp * steamBurnDebuff.damagePercentPerStack * steamBurnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - steamBurnDamage);
      showDamageNumber(unit.id, steamBurnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到蒸汽灼伤 ${steamBurnDamage} HP（每回合损失2%最大HP）`, 'damage');

      steamBurnDebuff.remainingDuration--;
      if (steamBurnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'steam_burn');
        addLog(`${unit.name} 的「蒸汽灼伤」状态消失了`);
      }
    }

    // 处理虚弱状态（下一回合无法使用技能）
    const weaknessDebuff = unit.debuffs.find(d => d.type === 'weakness');
    if (weaknessDebuff && weaknessDebuff.remainingDuration > 0) {
      weaknessDebuff.remainingDuration--;
      if (weaknessDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'weakness');
        addLog(`${unit.name} 的「虚弱」状态消失了`);
      }
    }

    // 处理清泉护盾状态（每回合回复10%HP并清除1个debuff）
    const clearSpringBuff = unit.buffs?.find(b => b.type === 'clear_spring');
    if (clearSpringBuff && clearSpringBuff.remainingDuration > 0) {
      const clearSpringHeal = Math.floor(unit.maxHp * clearSpringBuff.healPercent);
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + clearSpringHeal);
      showDamageNumber(unit.id, clearSpringHeal, 'heal');
      updateHpBar(unit);
      addLog(`${unit.name} 的「清泉护盾」回复 ${clearSpringHeal} HP（每回合回复10%HP）`, 'heal');

      if (unit.debuffs && unit.debuffs.length > 0) {
        const removedDebuff = unit.debuffs.shift();
        addLog(`${unit.name} 的「${removedDebuff.type}」状态被清泉护盾清除`);
      }

      clearSpringBuff.remainingDuration--;
      if (clearSpringBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'clear_spring');
        addLog(`${unit.name} 的「清泉护盾」状态消失了`);
      }
    }

    // 处理流水状态（速度+1级）
    const flowBuff = unit.buffs?.find(b => b.type === 'flow');
    if (flowBuff && flowBuff.remainingDuration > 0) {
      flowBuff.remainingDuration--;
      if (flowBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'flow');
        addLog(`${unit.name} 的「流水」状态消失了`);
      }
    }

    // 处理雨天天气
    if (globalWeather && globalWeather.type === 'rainy' && globalWeather.duration > 0) {
      globalWeather.duration--;
      if (globalWeather.duration <= 0) {
        globalWeather = null;
        addLog(`雨天天气结束了`);
      }
    }
  }

  await delay(500);

  if (!checkBattleEnd()) {
    // 更新敌人意图
    for (const enemy of enemyUnits) {
      if (enemy.currentHp > 0) {
        updateEnemyIntent(enemy);
      }
    }

    // 进入下一回合
    currentRound++;

    // 更新所有单位的buff/debuff回合数
    updateBuffTurns();

    playerCommands = []; // 清空指令
    isPreparing = true;
    isExecuting = false;

    renderEnemyUnits();
    renderPlayerUnits();
    document.getElementById('commandList').style.display = 'block';
    renderCommandList();
    updateTurnDisplay();
    addLog(`===== 第 ${currentRound} 轮开始 =====`);
  }
}

// 模式3：构建行动队列
function buildActionQueueMode3() {
  const actions = [];

  // 添加玩家指令
  for (const cmd of playerCommands) {
    if (cmd.status !== 'pending') continue;
    const caster = playerUnits.find(p => p.id === cmd.casterId);
    if (!caster || caster.currentHp <= 0) continue;

    const skill = caster.skills.find(s => s.id === cmd.skillId);
    if (!skill) continue;

    actions.push({
      id: cmd.casterId,
      type: 'player',
      caster: caster,
      skill: skill,
      targetId: cmd.targetId,
      speed: caster.speed,
      command: cmd
    });
  }

  // 添加敌人行动
  for (const enemy of enemyUnits) {
    if (enemy.currentHp <= 0) continue;
    actions.push({
      id: enemy.id,
      type: 'enemy',
      caster: enemy,
      speed: enemy.speed,
      intent: enemy.intent
    });
  }

  // 按速度排序，同速随机
  actions.sort((a, b) => {
    if (a.speed !== b.speed) return b.speed - a.speed;
    return Math.random() - 0.5;
  });

  return actions;
}

// 模式3：执行单个行动
async function executeActionMode3(action, actionIndex, totalActions) {
  // 高亮当前行动单位
  updateActionOrderDisplay(actionIndex, 'current');
  const el = document.getElementById(action.id);
  if (el) el.classList.add('selected');

  // 处理灼伤印记：行动前受到伤害
  if (action.caster.burnMark && action.caster.currentHp > 0) {
    await delay(200);
    const burnMarkDamage = Math.floor(action.caster.burnMarkPower * (0.8 + Math.random() * 0.4));
    const damageTypeText = action.caster.burnMarkDamageType === 'physical' ? '物理' : '特殊';
    action.caster.currentHp = Math.max(0, action.caster.currentHp - burnMarkDamage);
    showDamageNumber(action.caster.id, burnMarkDamage, 'damage');
    updateHpBar(action.caster);
    addLog(`${action.caster.name} 的「灼伤印记」触发，受到 ${burnMarkDamage} ${damageTypeText}伤害！`, 'damage');
  }

  await delay(400);

  if (action.type === 'player') {
    // 玩家指令执行
    const targetId = action.targetId;
    const target = [...enemyUnits, ...playerUnits].find(u => u.id === targetId);

    // 检查目标是否有效
    if (!target || target.currentHp <= 0) {
      addLog(`${action.caster.name} 的行动目标无效，跳过`);
      action.command.status = 'skipped';
    }

    if (action.command.status !== 'skipped') {
      await executePlayerCommand(action.caster, action.skill, action.targetId);
    }
  } else {
    // 敌人行动执行
    await executeEnemyAction(action.caster);
  }

  // 清除高亮
  if (el) el.classList.remove('selected');
}

// ==================== 战斗流程 ====================

// 获取当前应该行动的单位
function getCurrentAction() {
  if (actionQueue.length === 0) return null;
  return actionQueue[currentActionIndex];
}

// 获取所有行动单位的行动队列
// 包含：所有存活的伙伴（标记 hasCommand） + 所有存活的敌人
// 按速度从高到低排序，同速随机
// 注意：伙伴即使没有下达指令也会进入队列（hasCommand=false），由 executeNextAction 决定是否等待玩家选择
function buildActionQueue() {
  const actions = [];

  // 添加所有存活的玩家（无论是否有指令）
  for (const player of playerUnits) {
    if (player.currentHp <= 0) continue;

    // 找到该玩家的指令
    const cmd = playerCommands.find(c => c.casterId === player.id && c.status === 'pending');
    let skill = null;
    if (cmd) {
      skill = player.skills.find(s => s.id === cmd.skillId);
    }

    actions.push({
      id: player.id,
      type: 'player',
      caster: player,
      skill: skill,
      targetId: cmd ? cmd.targetId : null,
      speed: player.speed,
      hasCommand: !!cmd,
      command: cmd
    });
  }

  // 添加所有存活的敌人
  for (const enemy of enemyUnits) {
    if (enemy.currentHp <= 0) continue;
    actions.push({
      id: enemy.id,
      type: 'enemy',
      caster: enemy,
      speed: enemy.speed,
      intent: enemy.intent
    });
  }

  // 按速度排序，同速随机
  actions.sort((a, b) => {
    if (a.speed !== b.speed) return b.speed - a.speed;
    return Math.random() - 0.5;
  });

  return actions;
}

// 显示行动顺序预览
function showActionOrder(queue) {
  const display = document.getElementById('actionOrderDisplay');
  const list = document.getElementById('actionOrderList');

  if (!queue || queue.length === 0) return;

  list.innerHTML = queue.map((action, index) => {
    const isPlayer = action.type === 'player';
    const name = action.caster ? action.caster.name : 'unknown';
    const iconClass = isPlayer ? 'player' : 'enemy';
    const icon = isPlayer ? 'P' : 'E';
    const isExecuted = isPlayer && executedPlayerIds.has(action.caster.id);
    const isMode3 = currentBattleMode === 3;

    return `
      <div class="action-order-item ${isExecuted ? 'executed' : ''}" data-index="${index}">
        <span class="action-order-icon ${iconClass}">${icon}</span>
        <span>${name}</span>
        <span class="action-order-speed">(${action.speed})</span>
        ${isMode3 && isExecuted ? '<span class="action-order-executed">已行动</span>' : ''}
      </div>
    `;
  }).join('');

  display.classList.add('visible');
}

// 更新行动顺序显示
function updateActionOrderDisplay(currentIndex, status = 'current') {
  const items = document.querySelectorAll('.action-order-item');
  items.forEach((item, index) => {
    item.classList.remove('current', 'executed', 'skipped');
    if (index < currentIndex) {
      item.classList.add('executed');
    } else if (index === currentIndex) {
      item.classList.add('current');
    }
  });
}

// 隐藏行动顺序显示
function hideActionOrder() {
  document.getElementById('actionOrderDisplay').classList.remove('visible');
}

// 解析目标（根据策略）
function resolveActionTarget(action) {
  if (action.targetId) {
    const target = [...enemyUnits, ...playerUnits].find(u => u.id === action.targetId);
    if (target && target.currentHp > 0) return target;
  }

  // 需要重新解析目标
  const validTargets = action.skill.target === 'single_enemy' ? enemyUnits : playerUnits;
  return resolveTarget(action.skill, validTargets);
}

// 执行单个行动（主要用于敌人）
async function executeAction(action) {
  // 高亮当前行动单位
  updateActionOrderDisplay(currentActionIndex, 'current');
  const el = document.getElementById(action.id);
  if (el) el.classList.add('selected');

  // 处理灼伤印记：行动前受到伤害
  if (action.caster.burnMark && action.caster.currentHp > 0) {
    await delay(200);
    const burnMarkDamage = Math.floor(action.caster.burnMarkPower * (0.8 + Math.random() * 0.4));
    const damageTypeText = action.caster.burnMarkDamageType === 'physical' ? '物理' : '特殊';
    action.caster.currentHp = Math.max(0, action.caster.currentHp - burnMarkDamage);
    showDamageNumber(action.caster.id, burnMarkDamage, 'damage');
    updateHpBar(action.caster);
    addLog(`${action.caster.name} 的「灼伤印记」触发，受到 ${burnMarkDamage} ${damageTypeText}伤害！`, 'damage');
  }

  await delay(400);

  // 敌人行动执行
  await executeEnemyAction(action.caster);

  // 清除高亮
  if (el) el.classList.remove('selected');
}

// 开始新的一轮（模式1/2）
// 模式1：初始化敌人意图 → 构建队列 → 按速度执行（敌人自动，玩家手动）
// 模式2：初始化敌人意图 → 构建玩家/敌人队列 → 等待所有伙伴下达指令后按速度统一结算
function startRound() {
  if (battleEnded) return;

  // 模式3（以太术士模式）：不执行经典模式的startRound
  if (currentBattleMode === 3) {
    return;
  }

  isRoundExecuting = true;
  isBattleStarted = true;
  document.getElementById('skillPanel').classList.remove('visible');
  document.getElementById('commandList').style.display = 'none';

  addLog(`===== 第 ${currentRound} 轮开始 =====`);

  // 初始化敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }
  renderEnemyUnits();

  // 模式2（宝可梦模式）：只初始化队列并显示，等待玩家下达指令
  if (currentBattleMode === 2) {
    executedPlayerIds.clear();
    playerActionQueue = buildPlayerActionQueue();
    enemyActionQueue = buildEnemyActionQueue();
    // 显示行动顺序
    const allActions = [...playerActionQueue.map(a => ({...a, queueType: 'player'})), ...enemyActionQueue.map(a => ({...a, queueType: 'enemy'}))];
    allActions.sort((a, b) => b.caster.speed - a.caster.speed);
    showActionOrder(allActions);
    updateTurnDisplay();
    // 不调用 executeNextAction()，等待玩家下达指令（由 checkAllReady 触发 startCombatPhase）
    return;
  }

  // 开始执行第一个行动
  executeNextAction();
}

// 构建玩家行动队列（模式2：从已下达的指令中构建，按速度排序后由 executeNextActionMode2 执行）
function buildPlayerActionQueue() {
  const queue = [];
  for (const cmd of playerCommands) {
    if (cmd.status !== 'pending') continue;
    const caster = playerUnits.find(p => p.id === cmd.casterId);
    if (!caster || caster.currentHp <= 0) continue;
    const skill = caster.skills.find(s => s.id === cmd.skillId);
    if (!skill) continue;
    queue.push({
      type: 'player',
      caster: caster,
      skill: skill,
      targetId: cmd.targetId,
      command: cmd
    });
  }
  return queue;
}

// 构建敌人行动队列（模式2）
function buildEnemyActionQueue() {
  const queue = [];
  for (const enemy of enemyUnits) {
    if (enemy.currentHp <= 0) continue;
    queue.push({
      type: 'enemy',
      caster: enemy,
      intent: enemy.intent,
      speed: enemy.speed
    });
  }
  return queue;
}

// 更新所有buff/debuff的持续回合数
function updateBuffTurns() {
  // 更新玩家单位的减伤回合
  [...playerUnits, ...enemyUnits].forEach(unit => {
    if (unit.damageReductionTurns && unit.damageReductionTurns > 0) {
      unit.damageReductionTurns--;
      if (unit.damageReductionTurns === 0) {
        unit.damageReduction = 0;
        addLog(`${unit.name} 的减伤效果消失了`, 'buff');
      }
    }
    if (unit.resistanceTurns) {
      for (const element in unit.resistanceTurns) {
        unit.resistanceTurns[element]--;
        if (unit.resistanceTurns[element] <= 0) {
          unit.resistances[element] = 0;
          delete unit.resistanceTurns[element];
          addLog(`${unit.name} 的 ${element} 属性抗性消失了`, 'buff');
        }
      }
    }
    // 更新防反状态回合
    if (unit.counterStance && unit.counterStanceTurns > 0) {
      unit.counterStanceTurns--;
      if (unit.counterStanceTurns === 0) {
        unit.counterStance = false;
        addLog(`${unit.name} 的防反之姿消失了`, 'buff');
      }
    }
  });
}

// ==================== 敌人行动系统 ====================

// 执行敌人行动
async function executeEnemyAction(enemy) {
  // 根据意图找到要使用的技能
  let skill = null;
  if (enemy.intent.skillId && enemy.skills) {
    skill = enemy.skills.find(s => s.id === enemy.intent.skillId);
  }

  // 检查能量是否足够
  if (skill && enemy.energy < skill.energyCost) {
    addLog(`${enemy.name} 能量不足，无法使用 ${skill.name}，跳过`);
    updateEnemyIntent(enemy);
    return;
  }

  // 检查目标是否有效
  let actualTarget = playerUnits.find(p => p.id === enemy.intent.targetId);
  if (!actualTarget || actualTarget.currentHp <= 0) {
    const alivePlayers = playerUnits.filter(p => p.currentHp > 0);
    if (alivePlayers.length > 0) {
      actualTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    } else {
      addLog(`${enemy.name} 无法选择目标，跳过`);
      return;
    }
  }

  // 消耗能量
  if (skill) {
    const energyBefore = enemy.energy;
    enemy.energy -= skill.energyCost;
    addLog(`${enemy.name} 使用 ${skill.name}（消耗${skill.energyCost}能量 ${energyBefore}→${enemy.energy}）`);

    // 使用技能执行逻辑（复用玩家技能执行）
    await executeEnemySkill(enemy, skill, actualTarget);
  } else {
    // 兼容旧代码：没有技能时使用原始的攻击逻辑
    if (enemy.intent.type === 'attack') {
      await executeEnemyBasicAttack(enemy, actualTarget);
    }
  }

  // 更新敌人意图
  updateEnemyIntent(enemy);
}

// 执行敌人技能（复用玩家技能执行逻辑）
async function executeEnemySkill(enemy, skill, target) {
  // 处理休息技能（回复能量）
  if (skill.effect === 'energy_restore') {
    const energyRestore = skill.power || 5;
    const oldEnergy = enemy.energy;
    enemy.energy = Math.min(enemy.energy + energyRestore, MAX_ENERGY);
    const actualRestore = enemy.energy - oldEnergy;
    addLog(`${enemy.name} 使用 ${skill.name}，回复 ${actualRestore} 点能量（${oldEnergy}→${enemy.energy}）`, 'heal');
    return;
  }

  if (skill.target === 'single_enemy' || skill.target === 'all_enemy') {
    // 攻击技能
    let totalDamage = 0;

    // 检查蓄焰增伤buff
    let powerBonus = 0;
    if (enemy.flameCharge && enemy.flameChargeTurns > 0 && skill.element === 'fire') {
      powerBonus = enemy.flameChargePower || (enemy.energy * 10);
      addLog(`${enemy.name} 的蓄焰效果生效，火属性攻击威力+${powerBonus}！`, 'buff');
      enemy.flameCharge = false;
      enemy.flameChargeTurns = 0;
    }

    // 检查烈火护体下次火攻增伤
    if (enemy.wallOfFlamesPower > 0 && skill.element === 'fire') {
      powerBonus += enemy.wallOfFlamesPower;
      addLog(`${enemy.name} 的烈火护体效果生效，火属性攻击威力+${enemy.wallOfFlamesPower}！`, 'buff');
      enemy.wallOfFlamesPower = 0;
    }

    // 检查光能汇聚增伤（草系技能）
    let lightGatherBonus = 0;
    if (enemy.lightGatherStacks && enemy.lightGatherStacks > 0 && skill.element === 'grass') {
      lightGatherBonus = enemy.lightGatherStacks * (skill.powerPerStack || 60);
      addLog(`${enemy.name} 消耗 ${enemy.lightGatherStacks} 层光能汇聚，草系攻击威力+${lightGatherBonus}！`, 'buff');
      enemy.lightGatherStacks = 0;
    }
    powerBonus += lightGatherBonus;

    // 雷霆连击：多段攻击
    if (skill.effect === 'combo') {
      const hits = skill.comboHits || 3;
      const powerPerHit = skill.comboPower || Math.floor(skill.power / hits);

      for (let i = 0; i < hits; i++) {
        const result = calculatePokemonDamage(enemy, target, { ...skill, power: powerPerHit + powerBonus });
        let hitDamage = result.damage;

        if (target.damageReduction && target.damageReduction > 0) {
          hitDamage = Math.floor(hitDamage * (1 - target.damageReduction));
        }
        if (target.shield && target.shield > 0) {
          if (hitDamage > target.shield) {
            hitDamage -= target.shield;
            target.shield = 0;
          } else {
            target.shield -= hitDamage;
            hitDamage = 0;
          }
        }

        totalDamage += hitDamage;
        target.currentHp = Math.max(0, target.currentHp - hitDamage);
        showDamageNumber(target.id, hitDamage, result.isCrit ? 'critical' : 'damage', {
          isStab: result.hasStab,
          isSuperEffective: result.typeMultiplier >= 2,
          isNotEffective: result.typeMultiplier < 1
        });
        
        let logMsg = `${enemy.name} 使用 ${skill.name}，第${i + 1}段攻击造成 ${hitDamage} 伤害`;
        if (result.isCrit) logMsg += '（暴击！）';
        if (result.hasStab) logMsg += '【STAB】';
        if (result.typeMultiplier !== 1) logMsg += `【${result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱'}×${result.typeMultiplier}】`;
        addLog(logMsg, 'damage');
        await delay(200);
      }

      // 必定灼烧
      if (skill.burnStacks && !skill.burnChance) {
        const existingBurn = target.debuffs.find(d => d.type === 'burn');
        if (existingBurn) {
          existingBurn.stacks += skill.burnStacks;
          existingBurn.remainingDuration = 3;
        } else {
          target.debuffs.push({
            type: 'burn',
            stacks: skill.burnStacks,
            damagePercentPerStack: 0.02,
            remainingDuration: 3
          });
        }
        addLog(`${target.name} 陷入灼烧状态！`, 'damage');
      }
    } else {
      // 普通单次攻击 - 使用宝可梦公式
      const result = calculatePokemonDamage(enemy, target, { ...skill, power: skill.power + powerBonus });
      let damage = result.damage;

      if (target.damageReduction && target.damageReduction > 0) {
        damage = Math.floor(damage * (1 - target.damageReduction));
      }
      if (target.shield && target.shield > 0) {
        if (damage > target.shield) {
          damage -= target.shield;
          target.shield = 0;
        } else {
          target.shield -= damage;
          damage = 0;
        }
      }

      totalDamage = damage;
      target.currentHp = Math.max(0, target.currentHp - damage);
      showDamageNumber(target.id, damage, result.isCrit ? 'critical' : 'damage', {
        isStab: result.hasStab,
        isSuperEffective: result.typeMultiplier >= 2,
        isNotEffective: result.typeMultiplier < 1
      });
      
      let logMsg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`;
      if (result.isCrit) logMsg += '（暴击！）';
      if (result.hasStab) logMsg += '【STAB】';
      if (result.typeMultiplier !== 1) logMsg += `【${result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱'}×${result.typeMultiplier}】`;
      addLog(logMsg, 'damage');
    }

    // 灼烧效果
    if (skill.effect === 'burn' || skill.burnStacks) {
      const burnChance = skill.burnChance ?? 1;
      if (Math.random() < burnChance) {
        const stacks = skill.burnStacks || 1;
        const existingBurn = target.debuffs.find(d => d.type === 'burn');
        if (existingBurn) {
          existingBurn.stacks += stacks;
          existingBurn.remainingDuration = 3;
        } else {
          target.debuffs.push({
            type: 'burn',
            stacks: stacks,
            damagePercentPerStack: 0.02,
            remainingDuration: 3
          });
        }
        addLog(`${target.name} 陷入灼烧状态！`, 'damage');
      }
    }

    updateHpBar(target);
    if (target.currentHp <= 0) addLog(`${target.name} 倒下了！`);

    // 火盾反伤
    if (target.fireShield && target.reflectDamage > 0 && target.currentHp > 0) {
      const reflectDmg = Math.floor(target.reflectDamage * (0.8 + Math.random() * 0.4));
      enemy.currentHp = Math.max(0, enemy.currentHp - reflectDmg);
      showDamageNumber(enemy.id, reflectDmg, 'damage', { isSuperEffective: false });
      updateHpBar(enemy);
      addLog(`${target.name} 的火盾反伤触发，对 ${enemy.name} 造成 ${reflectDmg} 火属性伤害！`, 'damage');
      if (enemy.currentHp <= 0) addLog(`${enemy.name} 倒下了！`);
    }
  } else if (skill.target === 'self') {
    // 自身目标技能
    if (skill.type === 'shield') {
      enemy.shield = (enemy.shield || 0) + skill.power;
      addLog(`${enemy.name} 使用 ${skill.name}，为自身施加 ${skill.power} 点护盾`);
    }
    if (skill.type === 'buff' && skill.speedBoost) {
      enemy.speedBoost = (enemy.speedBoost || 0) + skill.speedBoost;
      addLog(`${enemy.name} 使用 ${skill.name}，速度提升 ${skill.speedBoost} 级！`, 'buff');
    }
  }

  // 延迟渲染以确保伤害数字动画有时间播放
  setTimeout(() => {
    renderPlayerUnits();
    renderEnemyUnits();
  }, 1000);
  await delay(300);
}

// 执行敌人基础攻击
async function executeEnemyBasicAttack(enemy, target) {
  const fakeSkill = {
    power: enemy.intent.power,
    element: enemy.element
  };
  const result = calculatePokemonDamage(enemy, target, fakeSkill);
  let damage = result.damage;

  if (target.damageReduction && target.damageReduction > 0) {
    damage = Math.floor(damage * (1 - target.damageReduction));
  }
  if (target.shield && target.shield > 0) {
    if (damage > target.shield) {
      damage -= target.shield;
      target.shield = 0;
    } else {
      target.shield -= damage;
      damage = 0;
    }
  }

  target.currentHp = Math.max(0, target.currentHp - damage);
  showDamageNumber(target.id, damage, result.isCrit ? 'critical' : 'damage', {
    isStab: result.hasStab,
    isSuperEffective: result.typeMultiplier >= 2,
    isNotEffective: result.typeMultiplier < 1
  });
  updateHpBar(target);

  let logMsg = `${enemy.name} 攻击 ${target.name}，造成 ${damage} 伤害`;
  if (result.isCrit) logMsg += '（暴击！）';
  if (result.hasStab) logMsg += '【STAB】';
  if (result.typeMultiplier !== 1) logMsg += `【${result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱'}×${result.typeMultiplier}】`;
  addLog(logMsg, 'damage');

  // 火盾反伤
  if (target.fireShield && target.reflectDamage > 0 && target.currentHp > 0) {
    const reflectDmg = Math.floor(target.reflectDamage * (0.8 + Math.random() * 0.4));
    enemy.currentHp = Math.max(0, enemy.currentHp - reflectDmg);
    showDamageNumber(enemy.id, reflectDmg, 'damage', { isSuperEffective: false });
    updateHpBar(enemy);
    addLog(`${target.name} 的火盾反伤触发，对 ${enemy.name} 造成 ${reflectDmg} 火属性伤害！`, 'damage');
    if (enemy.currentHp <= 0) addLog(`${enemy.name} 倒下了！`);
  }

  if (target.currentHp <= 0) addLog(`${target.name} 倒下了！`);
}

// 使用宝可梦官方伤害计算公式
// 公式: (((Level × 2 / 5 + 2) × Power × A / D / 50 + 2) × STAB × Type × random)
// 其中 random 为 217-255 / 255 (约 0.851 ~ 1.0)
function calculatePokemonDamage(attacker, defender, skill, options = {}) {
  const powerBonus = options.powerBonus || 0;
  const level = attacker.level || 60;
  
  // 根据技能类型选择攻击/防御属性
  // 物理技能使用 attack/defense，特殊技能使用 spAttack/spDefense
  const isPhysical = skill.type === 'physical' || skill.damageType === 'physical';
  const attack = isPhysical ? (attacker.attack || 75) : (attacker.spAttack || 75);
  const defense = isPhysical ? (defender.defense || 75) : (defender.spDefense || 75);

  // 基础伤害 = (((Level × 2 / 5 + 2) × Power × A / D) / 50) + 2
  const power = (skill.power || 40) + powerBonus;
  let damage = Math.floor(((level * 2 / 5 + 2) * power * attack / defense / 50) + 2);

  // 随机系数 217-255 / 255 (约 0.851 ~ 1.0)
  const randomFactor = (217 + Math.random() * 38) / 255;
  damage = Math.floor(damage * randomFactor);

  // STAB 加成（属性一致加成，1.5 倍）
  const hasStab = skill.element && skill.element === attacker.element;
  const stabValue = hasStab ? 1.5 : 1;
  damage = Math.floor(damage * stabValue);

  // 属性克制倍率
  let typeMultiplier = 1;
  if (skill.element) {
    const targetElements = defender.elements || [defender.element];
    typeMultiplier = calculateDamageMultiplier(skill.element, targetElements);
  }
  damage = Math.floor(damage * typeMultiplier);

  // 暴击判定（1/16 概率，1.5 倍伤害）
  const isCrit = Math.random() < 1/16;
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }

  // 最终伤害（最小为1）
  damage = Math.max(1, damage);

  return {
    damage: damage,
    isCrit: isCrit,
    typeMultiplier: typeMultiplier,
    stabBonus: stabValue,
    hasStab: hasStab
  };
}

// ==================== 经典模式（模式1）核心战斗流程 ====================

// 执行下一个行动（模式1/2 入口）
// 模式1（经典模式）：构建队列 → 敌人立即执行 / 玩家等待选择技能 → 行动后切换下一个 → 队列空则回合结算
// 模式2（宝可梦模式）：调用 executeNextActionMode2（准备阶段不下达指令到队列，由 startRound 构建）
// 模式3（以太术士模式）：不使用此函数，使用独立的 startRoundMode3 流程
async function executeNextAction() {
  if (battleEnded) {
    isRoundExecuting = false;
    return;
  }

  // 模式2（宝可梦模式）：使用单独的函数
  if (currentBattleMode === 2) {
    await executeNextActionMode2();
    return;
  }

  // 模式1（经典模式）：构建统一行动队列
  actionQueue = buildActionQueue();
  showActionOrder(actionQueue);

  // 找到当前速度最快的行动者
  while (currentActionIndex < actionQueue.length) {
    const action = actionQueue[currentActionIndex];

    // 检查行动者是否仍然存活
    if (action.caster.currentHp <= 0) {
      currentActionIndex++;
      continue;
    }

    // 更新UI：显示当前行动者
    updateTurnDisplay(action);

    // 根据行动者类型执行
    if (action.type === 'enemy') {
      // 敌人行动：立即执行
      await executeAction(action);
      // 重新计算敌人意图
      updateEnemyIntent(action.caster);
      renderEnemyUnits();
    } else {
      // 玩家行动
      if (action.hasCommand && action.skill) {
        // 有预设指令，立即执行
        await executePlayerActionAndContinue(
          action.caster,
          action.skill,
          action.targetId
        );
        continue;
      } else {
        // 没有指令，等待玩家选择技能
        selectedPlayer = action.caster;
        renderSkillPanel(action.caster);
        renderPlayerUnits();
        return; // 等待玩家选择技能
      }
    }

    currentActionIndex++;
    await delay(200);

    // 检查战斗结束
    if (checkBattleEnd()) {
      isRoundExecuting = false;
      return;
    }
  }

  // 所有行动者都行动完毕，进入下一轮处理
  await finishRound();
}

// 玩家下达指令后继续执行（经典模式）
async function continueBattleAfterCommand() {
  if (currentBattleMode !== 1) return;
  if (battleEnded) return;
  if (!isRoundExecuting) return;

  // 找到当前伙伴的指令
  const currentAction = actionQueue[currentActionIndex];
  if (!currentAction || currentAction.type !== 'player') return;

  // 检查是否有有效指令
  const cmd = playerCommands.find(c => c.casterId === currentAction.caster.id && c.status === 'pending');
  if (!cmd) return;

  const skill = currentAction.caster.skills.find(s => s.id === cmd.skillId);
  if (!skill) return;

  // 执行玩家行动
  await executePlayerActionAndContinue(
    currentAction.caster,
    skill,
    cmd.targetId
  );
}

// 回合结束处理（经典模式）
// 处理所有单位的状态效果（灼烧、燃尽、减速等）→ 更新敌人意图 → 清空指令 → 重置能量 → 下一轮
async function finishRound() {
  // 标记所有指令为已执行
  playerCommands.forEach(cmd => {
    if (cmd.status === 'pending') cmd.status = 'executed';
  });

  hideActionOrder();
  currentActionIndex = 0;

  // 回合结束 - 处理状态效果
  await delay(300);

  // 处理灼烧效果
  for (const unit of [...playerUnits, ...enemyUnits]) {
    if (unit.currentHp <= 0) continue;

    const burnDebuff = unit.debuffs.find(d => d.type === 'burn');
    if (burnDebuff && burnDebuff.stacks > 0) {
      const burnDamage = Math.floor(unit.maxHp * burnDebuff.damagePercentPerStack * burnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - burnDamage);
      showDamageNumber(unit.id, burnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到灼烧伤害 ${burnDamage} HP（${burnDebuff.stacks}层）`, 'damage');

      burnDebuff.stacks = Math.max(1, Math.floor(burnDebuff.stacks / 2));
      burnDebuff.remainingDuration--;

      if (burnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'burn');
        addLog(`${unit.name} 的灼烧状态消失了`);
      }
    }

    // 处理燃尽印记
    if (unit.combustionStacks > 0 && unit.currentHp > 0) {
      unit.combustionTurnsLeft--;
      if (unit.combustionTurnsLeft <= 0) {
        const combustionDamage = Math.floor(unit.currentHp * 0.3);
        unit.currentHp = Math.max(0, unit.currentHp - combustionDamage);
        showDamageNumber(unit.id, combustionDamage, 'damage');
        updateHpBar(unit);
        addLog(`${unit.name} 的「燃尽印记」触发，受到 ${combustionDamage} 真实伤害！`, 'damage');
        unit.combustionStacks = 0;
      } else {
        addLog(`${unit.name} 的「燃尽印记」剩余 ${unit.combustionTurnsLeft} 回合`);
      }
    }

    // 处理减速状态
    if (unit.slowed && unit.currentHp > 0) {
      unit.slowTurns--;
      if (unit.slowTurns <= 0) {
        unit.slowed = false;
        addLog(`${unit.name} 的减速状态消失了`);
      }
    }

    // 处理属性抗性倒计时
    if (unit.resistanceTurns && unit.currentHp > 0) {
      for (const el in unit.resistanceTurns) {
        unit.resistanceTurns[el]--;
        if (unit.resistanceTurns[el] <= 0) {
          unit.resistances[el] = 0;
          delete unit.resistanceTurns[el];
          addLog(`${unit.name} 的 ${el} 属性抗性消失了`);
        }
      }
    }

    // 处理水系状态效果
    const waterSoakDebuff = unit.debuffs.find(d => d.type === 'water_soak');
    if (waterSoakDebuff && waterSoakDebuff.remainingDuration > 0) {
      waterSoakDebuff.remainingDuration--;
      if (waterSoakDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'water_soak');
        addLog(`${unit.name} 的「浸透」状态消失了`);
      }
    }

    const drowningDebuff = unit.debuffs.find(d => d.type === 'drowning');
    if (drowningDebuff && drowningDebuff.remainingDuration > 0) {
      drowningDebuff.remainingDuration--;
      if (drowningDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'drowning');
        addLog(`${unit.name} 的「溺水」状态消失了`);
      }
    }

    const muddyDebuff = unit.debuffs.find(d => d.type === 'muddy');
    if (muddyDebuff && muddyDebuff.remainingDuration > 0) {
      muddyDebuff.remainingDuration--;
      if (muddyDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'muddy');
        addLog(`${unit.name} 的「浑浊」状态消失了`);
      }
    }

    const steamBurnDebuff = unit.debuffs.find(d => d.type === 'steam_burn');
    if (steamBurnDebuff && steamBurnDebuff.remainingDuration > 0) {
      const steamBurnDamage = Math.floor(unit.maxHp * steamBurnDebuff.damagePercentPerStack * steamBurnDebuff.stacks);
      unit.currentHp = Math.max(0, unit.currentHp - steamBurnDamage);
      showDamageNumber(unit.id, steamBurnDamage, 'damage');
      updateHpBar(unit);
      addLog(`${unit.name} 受到蒸汽灼伤 ${steamBurnDamage} HP`, 'damage');

      steamBurnDebuff.remainingDuration--;
      if (steamBurnDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'steam_burn');
        addLog(`${unit.name} 的「蒸汽灼伤」状态消失了`);
      }
    }

    const weaknessDebuff = unit.debuffs.find(d => d.type === 'weakness');
    if (weaknessDebuff && weaknessDebuff.remainingDuration > 0) {
      weaknessDebuff.remainingDuration--;
      if (weaknessDebuff.remainingDuration <= 0) {
        unit.debuffs = unit.debuffs.filter(d => d.type !== 'weakness');
        addLog(`${unit.name} 的「虚弱」状态消失了`);
      }
    }

    // 处理清泉护盾状态
    const clearSpringBuff = unit.buffs?.find(b => b.type === 'clear_spring');
    if (clearSpringBuff && clearSpringBuff.remainingDuration > 0) {
      const clearSpringHeal = Math.floor(unit.maxHp * clearSpringBuff.healPercent);
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + clearSpringHeal);
      showDamageNumber(unit.id, clearSpringHeal, 'heal');
      updateHpBar(unit);
      addLog(`${unit.name} 的「清泉护盾」回复 ${clearSpringHeal} HP`, 'heal');

      if (unit.debuffs && unit.debuffs.length > 0) {
        const removedDebuff = unit.debuffs.shift();
        addLog(`${unit.name} 的「${removedDebuff.type}」状态被清泉护盾清除`);
      }

      clearSpringBuff.remainingDuration--;
      if (clearSpringBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'clear_spring');
        addLog(`${unit.name} 的「清泉护盾」状态消失了`);
      }
    }

    // 处理流水状态
    const flowBuff = unit.buffs?.find(b => b.type === 'flow');
    if (flowBuff && flowBuff.remainingDuration > 0) {
      flowBuff.remainingDuration--;
      if (flowBuff.remainingDuration <= 0) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'flow');
        addLog(`${unit.name} 的「流水」状态消失了`);
      }
    }

    // 处理雨天天气
    if (globalWeather && globalWeather.type === 'rainy' && globalWeather.duration > 0) {
      globalWeather.duration--;
      if (globalWeather.duration <= 0) {
        globalWeather = null;
        addLog(`雨天天气结束了`);
      }
    }
  }

  await delay(500);

  // 检查战斗是否结束
  if (checkBattleEnd()) {
    isExecuting = false;
    return;
  }

  // 更新敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }

  // 清空指令和行动状态
  playerCommands = [];
  executedPlayerIds.clear();
  actionQueue = [];

  // 更新所有单位的buff/debuff回合数
  updateBuffTurns();

  // 重置能量（每轮回复能量）
  playerUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = MAX_ENERGY;
    }
  });
  enemyUnits.forEach(u => {
    if (u.currentHp > 0) {
      u.energy = Math.min(u.energy + 3, u.maxEnergy);
    }
  });

  // 进入下一轮
  currentRound++;
  isRoundExecuting = false;

  renderEnemyUnits();
  renderPlayerUnits();
  document.getElementById('commandList').style.display = 'block';
  renderCommandList();
  updateTurnDisplay();

  addLog(`===== 第 ${currentRound} 轮开始 =====`);

  // 开始下一轮
  setTimeout(() => startRound(), 300);
}
