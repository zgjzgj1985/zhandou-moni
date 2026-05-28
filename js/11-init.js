// Source: battle-simple.html lines 6660-6777

// ==================== 战斗结束检查 ====================
function checkBattleEnd() {
  const playersAlive = playerUnits.filter(u => u.currentHp > 0).length;
  const enemiesAlive = enemyUnits.filter(u => u.currentHp > 0).length;
  if (playersAlive === 0) {
    battleEnded = true;
    showBattleEnd(false);
    return true;
  }
  if (enemiesAlive === 0) {
    battleEnded = true;
    showBattleEnd(true);
    return true;
  }
  return false;
}

function showBattleEnd(victory) {
  const overlay = document.getElementById('battleEndOverlay');
  const title = document.getElementById('endTitle');
  title.textContent = victory ? '胜利' : '失败';
  title.className = 'end-title ' + (victory ? 'victory' : 'defeat');
  overlay.classList.add('visible');
}

function restartBattle() {
  // 深拷贝恢复初始状态
  playerUnits.length = 0;
  INITIAL_PLAYER_CONFIG.forEach(u => playerUnits.push(JSON.parse(JSON.stringify(u))));
  enemyUnits.length = 0;
  INITIAL_ENEMY_CONFIG.forEach(u => enemyUnits.push(JSON.parse(JSON.stringify(u))));
  currentRound = 1;
  battleEnded = false;
  selectedPlayer = null;
  playerCommands = [];
  actionQueue = [];
  isRoundExecuting = false;
  isBattleStarted = false;
  isPreparing = false;
  isExecuting = false;
  executedPlayerIds.clear();
  playerActionQueue = [];
  enemyActionQueue = [];
  currentActionIndex = 0;
  currentAction = null;
  document.getElementById('battleEndOverlay').classList.remove('visible');
  document.getElementById('commandList').style.display = 'block';
  document.getElementById('logContent').innerHTML = '';
  hideActionOrder();

  // 重新初始化技能（确保所有单位都有技能）
  initializeCompanionSkills();
  initializeEnemySkills();

  renderPlayerUnits();
  renderEnemyUnits();
  renderSkillPanel(null);
  renderCommandList();
  updateTurnDisplay();

  // 不自动开始战斗，让玩家可以先切换模式
  addLog('===== 战斗模拟 =====');
  addLog('点击伙伴开始行动！');
}

// ==================== 初始化 ====================
function init() {
  // 初始化初始配置（在技能分配之后）
  INITIAL_PLAYER_CONFIG = JSON.parse(JSON.stringify(playerUnits));
  INITIAL_ENEMY_CONFIG = JSON.parse(JSON.stringify(enemyUnits));

  // 调试日志：验证初始化状态
  debugLog('=== 战斗初始化 ===');
  debugLog('当前模式: ' + getModeName(currentBattleMode));
  playerUnits.forEach(unit => {
    debugLog(`${unit.name}: HP=${unit.currentHp}/${unit.maxHp}, energy=${unit.energy}, skills=${unit.skills.length}`);
    if (unit.skills.length === 0) {
      console.warn(`警告: ${unit.name} 没有技能！`);
    }
  });

  // 初始化敌人意图
  for (const enemy of enemyUnits) {
    if (enemy.currentHp > 0) {
      updateEnemyIntent(enemy);
    }
  }

  renderPlayerUnits();
  renderEnemyUnits();
  renderCommandList();
  updateTurnDisplay();

  // 初始化模式2的预备状态
  if (currentBattleMode === 2) {
    isPreparing = true;
    document.getElementById('actionOrderDisplay').classList.add('visible');
  }

  // 不自动开始战斗，让玩家可以先切换模式
  addLog('===== 战斗模拟 =====');
  addLog('点击伙伴开始行动！');

  // 只有当玩家点击伙伴时才检查是否开始战斗
  // 监听玩家点击事件，在第一个玩家行动时自动开始

  document.addEventListener('click', (e) => {
    if (wasDragReleased) {
      wasDragReleased = false;
      return;
    }
    if (!e.target.closest('.unit.player') && !e.target.closest('.skill-panel') && !e.target.closest('.skill-card')) {
      if (!isDragging) deselectPlayer();
    }
  });
}

init();
