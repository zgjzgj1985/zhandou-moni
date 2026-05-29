// Source: battle-simple.html lines 2067-2408 (excluding duplicate getElementName at 2409-2421)
// ==================== 战斗模式切换系统 ====================

// 切换战斗模式
function switchBattleMode(mode) {
  if (isRoundExecuting || isExecuting) {
    addLog('战斗进行中，无法切换模式');
    return;
  }

  // 更新按钮状态
  document.querySelectorAll('.mode-switch-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('mode' + mode + 'Btn').classList.add('active');

  // 先设置当前模式
  currentBattleMode = mode;

  // 重置战斗状态
  restartBattleForModeSwitch();

  addLog('切换至' + getModeName(mode));

  // 根据模式更新UI
  updateTurnDisplay();
  renderPlayerUnits();
  renderEnemyUnits();
  renderCommandList();

  // 模式2需要进入准备阶段，模式3在点击时初始化
  if (mode === 2) {
    isPreparing = true;
  }

  // 模式2和模式3需要显示行动顺序面板
  if (mode === 2 || mode === 3) {
    document.getElementById('actionOrderDisplay').classList.add('visible');

    // 模式3：预先生成行动顺序内容
    if (mode === 3) {
      const playerQueue = playerUnits.filter(p => p.currentHp > 0).map(player => ({
        id: player.id,
        type: 'player',
        caster: player,
        speed: player.speed
      }));
      const enemyQueue = enemyUnits.filter(e => e.currentHp > 0).map(enemy => ({
        id: enemy.id,
        type: 'enemy',
        caster: enemy,
        speed: enemy.speed
      }));
      const allActions = [...playerQueue, ...enemyQueue].sort((a, b) => b.speed - a.speed);
      if (allActions.length > 0) {
        showActionOrder(allActions);
      }
    }
  }
}

// ==================== 自定义战斗配置系统 ====================

// 等级范围
const MIN_LEVEL = 1;
const MAX_LEVEL = 60;

// 敌人类型配置
const ENEMY_TYPE_CONFIG = {
  normal: { name: '普通', hpMult: 1, atkMult: 1, defMult: 1, spAtkMult: 1, spDefMult: 1, speedMult: 1, cssClass: 'normal' },
  elite: { name: '精英', hpMult: 2.5, atkMult: 1.3, defMult: 1.3, spAtkMult: 1.3, spDefMult: 1.3, speedMult: 1, cssClass: 'elite' },
  boss: { name: '首领', hpMult: 8, atkMult: 1.6, defMult: 1.3, spAtkMult: 1.6, spDefMult: 1.3, speedMult: 1, cssClass: 'boss' }
};

// 可编辑的精英/首领修正系数（用户可自定义）
let editableEliteMultipliers = { hp: 2.5, atk: 1.3, def: 1.3, spAtk: 1.3, spDef: 1.3 };
let editableBossMultipliers = { hp: 8, atk: 1.6, def: 1.3, spAtk: 1.6, spDef: 1.3 };

// 更新ENEMY_TYPE_CONFIG中的精英/首领系数
function updateEnemyTypeConfig() {
  ENEMY_TYPE_CONFIG.elite.hpMult = editableEliteMultipliers.hp;
  ENEMY_TYPE_CONFIG.elite.atkMult = editableEliteMultipliers.atk;
  ENEMY_TYPE_CONFIG.elite.defMult = editableEliteMultipliers.def;
  ENEMY_TYPE_CONFIG.elite.spAtkMult = editableEliteMultipliers.spAtk;
  ENEMY_TYPE_CONFIG.elite.spDefMult = editableEliteMultipliers.spDef;

  ENEMY_TYPE_CONFIG.boss.hpMult = editableBossMultipliers.hp;
  ENEMY_TYPE_CONFIG.boss.atkMult = editableBossMultipliers.atk;
  ENEMY_TYPE_CONFIG.boss.defMult = editableBossMultipliers.def;
  ENEMY_TYPE_CONFIG.boss.spAtkMult = editableBossMultipliers.spAtk;
  ENEMY_TYPE_CONFIG.boss.spDefMult = editableBossMultipliers.spDef;
}

// 自定义配置状态
let customPlayerConfig = [];
let customEnemyConfig = [];

// 打开自定义战斗编辑器
function openCustomBattleEditor() {
  // 同步当前模式到面板
  selectCustomMode(currentBattleMode);

  // 初始化配置（基于当前战斗配置）
  customPlayerConfig = playerUnits.map(p => ({
    templateId: p.id,
    name: p.name,
    element: p.element,
    level: p.level
  }));

  // 从敌人单位反推类型，并更新全局修正系数
  customEnemyConfig = enemyUnits.map(e => {
    // 根据敌人的属性倍率反推敌人类型
    let enemyType = 'normal';
    if (e.enemyType) {
      enemyType = e.enemyType;
    } else {
      // 根据HP判断（精英约2.5倍，首领约8倍）
      const baseStats = CREATURE_BASE_STATS[e.templateId] || { hp: 60 };
      const baseHp = Math.floor(baseStats.hp * 2 * e.level / 30) + e.level + 10;
      if (e.maxHp >= baseHp * 6) {
        enemyType = 'boss';
      } else if (e.maxHp >= baseHp * 2) {
        enemyType = 'elite';
      }
    }
    return {
      templateId: e.templateId,
      name: e.name,
      element: e.element,
      level: e.level,
      enemyType: enemyType
    };
  });

  // 同步全局修正系数到编辑区
  syncMultiplierInputs();

  renderCustomEditor();
  document.getElementById('customBattleOverlay').classList.add('visible');
}

// 同步全局修正系数到输入框
function syncMultiplierInputs() {
  document.getElementById('eliteHpMult').value = editableEliteMultipliers.hp;
  document.getElementById('eliteSpAtkMult').value = editableEliteMultipliers.spAtk;
  document.getElementById('eliteAtkMult').value = editableEliteMultipliers.atk;
  document.getElementById('eliteSpDefMult').value = editableEliteMultipliers.spDef;
  document.getElementById('eliteDefMult').value = editableEliteMultipliers.def;

  document.getElementById('bossHpMult').value = editableBossMultipliers.hp;
  document.getElementById('bossSpAtkMult').value = editableBossMultipliers.spAtk;
  document.getElementById('bossAtkMult').value = editableBossMultipliers.atk;
  document.getElementById('bossSpDefMult').value = editableBossMultipliers.spDef;
  document.getElementById('bossDefMult').value = editableBossMultipliers.def;
}

// 切换全局修正系数面板显示
function toggleGlobalMultiplierPanel() {
  const panel = document.getElementById('globalMultiplierPanel');
  const toggle = document.getElementById('globalMultiplierToggle');
  if (panel.classList.contains('expanded')) {
    panel.classList.remove('expanded');
    toggle.textContent = '展开';
  } else {
    panel.classList.add('expanded');
    toggle.textContent = '收起';
  }
}

// 更新精英修正系数
function updateEliteMultipliers() {
  editableEliteMultipliers.hp = parseFloat(document.getElementById('eliteHpMult').value) || 2.5;
  editableEliteMultipliers.spAtk = parseFloat(document.getElementById('eliteSpAtkMult').value) || 1.3;
  editableEliteMultipliers.atk = parseFloat(document.getElementById('eliteAtkMult').value) || 1.3;
  editableEliteMultipliers.spDef = parseFloat(document.getElementById('eliteSpDefMult').value) || 1.3;
  editableEliteMultipliers.def = parseFloat(document.getElementById('eliteDefMult').value) || 1.3;
  updateEnemyTypeConfig();
  renderEnemyList();
}

// 更新首领修正系数
function updateBossMultipliers() {
  editableBossMultipliers.hp = parseFloat(document.getElementById('bossHpMult').value) || 8;
  editableBossMultipliers.spAtk = parseFloat(document.getElementById('bossSpAtkMult').value) || 1.6;
  editableBossMultipliers.atk = parseFloat(document.getElementById('bossAtkMult').value) || 1.6;
  editableBossMultipliers.spDef = parseFloat(document.getElementById('bossSpDefMult').value) || 1.3;
  editableBossMultipliers.def = parseFloat(document.getElementById('bossDefMult').value) || 1.3;
  updateEnemyTypeConfig();
  renderEnemyList();
}

// 关闭自定义战斗编辑器
function closeCustomBattleEditor() {
  document.getElementById('customBattleOverlay').classList.remove('visible');
}

// 选择自定义战斗模式
function selectCustomMode(mode) {
  currentBattleMode = mode;
  // 更新面板内按钮状态
  document.querySelectorAll('.custom-mode-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === mode);
  });
  // 更新主界面按钮状态
  document.querySelectorAll('.mode-switch-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === mode);
  });
  document.getElementById('customBtn').classList.remove('active');
}

// 渲染自定义编辑器
function renderCustomEditor() {
  renderPlayerList();
  renderEnemyList();
  updateAddButtons();
}

// 渲染伙伴列表
function renderPlayerList() {
  const container = document.getElementById('playerList');
  document.getElementById('playerCount').textContent = customPlayerConfig.length + '/5';

  if (customPlayerConfig.length === 0) {
    container.innerHTML = '<div class="custom-battle-empty">暂无伙伴，请添加</div>';
    return;
  }

  container.innerHTML = customPlayerConfig.map((p, index) => {
    const stats = getCreatureStats(p.templateId, p.level);
    return `
    <div class="custom-battle-row">
      <div class="custom-battle-unit element-${p.element}">
        <div>
          <div class="custom-battle-unit-name">Lv.${p.level} ${p.name}</div>
          <div class="custom-battle-unit-stats">${getElementName(p.element)} | HP ${stats.maxHp} | 攻 ${stats.attack} | 防 ${stats.defense} | 速 ${stats.speed}</div>
        </div>
      </div>
      <select class="custom-battle-type-select" onchange="changePlayerTemplate(${index}, this.value)">
        ${CREATURE_TEMPLATES.map(t => `<option value="${t.id}" ${p.templateId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
      </select>
      <select class="custom-battle-level-select" onchange="changePlayerLevel(${index}, this.value)">
        ${Array.from({length: MAX_LEVEL}, (_, i) => i + 1).map(l => `<option value="${l}" ${p.level === l ? 'selected' : ''}>Lv.${l}</option>`).join('')}
      </select>
      <button class="custom-battle-remove-btn" onclick="removeCustomPlayer(${index})">&times;</button>
    </div>
  `}).join('');
}

// 渲染敌人列表
function renderEnemyList() {
  const container = document.getElementById('enemyList');
  document.getElementById('enemyCount').textContent = customEnemyConfig.length + '/5';

  if (customEnemyConfig.length === 0) {
    container.innerHTML = '<div class="custom-battle-empty">暂无敌人，请添加</div>';
    return;
  }

  container.innerHTML = customEnemyConfig.map((e, index) => {
    const typeConfig = ENEMY_TYPE_CONFIG[e.enemyType || 'normal'];
    // 计算属性（考虑全局敌人类型加成）
    const baseStats = getCreatureStats(e.templateId, e.level);
    const stats = {
      maxHp: Math.floor(baseStats.maxHp * typeConfig.hpMult),
      attack: Math.floor(baseStats.attack * typeConfig.atkMult),
      defense: Math.floor(baseStats.defense * typeConfig.defMult),
      spAttack: Math.floor(baseStats.spAttack * typeConfig.spAtkMult),
      spDefense: Math.floor(baseStats.spDefense * typeConfig.spDefMult)
    };
    return `
    <div class="custom-battle-row">
      <div class="custom-battle-unit element-${e.element}">
        <div>
          <div class="custom-battle-unit-name">Lv.${e.level} ${e.name} <span class="custom-battle-type-badge ${typeConfig.cssClass}" style="margin-left:4px">${typeConfig.name}</span></div>
          <div class="custom-battle-unit-stats">${getElementName(e.element)} | HP ${stats.maxHp} | 攻 ${stats.attack} | 防 ${stats.defense} | 特攻 ${stats.spAttack} | 特防 ${stats.spDefense}</div>
        </div>
      </div>
      <select class="custom-battle-type-select" onchange="changeEnemyTemplate(${index}, this.value)">
        ${CREATURE_TEMPLATES.map(t => `<option value="${t.id}" ${e.templateId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
      </select>
      <select class="custom-battle-level-select" onchange="changeEnemyLevel(${index}, this.value)">
        ${Array.from({length: MAX_LEVEL}, (_, i) => i + 1).map(l => `<option value="${l}" ${e.level === l ? 'selected' : ''}>Lv.${l}</option>`).join('')}
      </select>
      <select class="custom-battle-type-select" onchange="changeEnemyType(${index}, this.value)">
        <option value="normal" ${e.enemyType === 'normal' ? 'selected' : ''}>普通</option>
        <option value="elite" ${e.enemyType === 'elite' ? 'selected' : ''}>精英</option>
        <option value="boss" ${e.enemyType === 'boss' ? 'selected' : ''}>首领</option>
      </select>
      <button class="custom-battle-remove-btn" onclick="removeCustomEnemy(${index})">&times;</button>
    </div>
  `}).join('');
}

// 更新添加按钮状态
function updateAddButtons() {
  document.getElementById('addPlayerBtn').disabled = customPlayerConfig.length >= 5;
  document.getElementById('addEnemyBtn').disabled = customEnemyConfig.length >= 5;
  document.getElementById('addPlayerBtn').style.display = customPlayerConfig.length >= 5 ? 'none' : 'inline-block';
  document.getElementById('addEnemyBtn').style.display = customEnemyConfig.length >= 5 ? 'none' : 'inline-block';
}

// 添加伙伴
function addCustomPlayer() {
  if (customPlayerConfig.length >= 5) return;
  const availableTemplates = CREATURE_TEMPLATES.filter(t => !customPlayerConfig.some(p => p.templateId === t.id));
  if (availableTemplates.length === 0) return;

  const template = availableTemplates[0];
  customPlayerConfig.push({
    templateId: template.id,
    name: template.name,
    element: template.element,
    level: 60
  });
  renderCustomEditor();
}

// 添加敌人
function addCustomEnemy() {
  if (customEnemyConfig.length >= 5) return;
  const availableTemplates = CREATURE_TEMPLATES.filter(t => !customEnemyConfig.some(e => e.templateId === t.id));
  if (availableTemplates.length === 0) {
    // 如果所有模板都用过了，从全部模板中随机选一个
    const template = CREATURE_TEMPLATES[Math.floor(Math.random() * CREATURE_TEMPLATES.length)];
    customEnemyConfig.push({
      templateId: template.id,
      name: template.name,
      element: template.element,
      level: 60,
      enemyType: 'normal'
    });
  } else {
    const template = availableTemplates[0];
    customEnemyConfig.push({
      templateId: template.id,
      name: template.name,
      element: template.element,
      level: 60,
      enemyType: 'normal'
    });
  }
  renderCustomEditor();
}

// 移除伙伴
function removeCustomPlayer(index) {
  customPlayerConfig.splice(index, 1);
  renderCustomEditor();
}

// 移除敌人
function removeCustomEnemy(index) {
  customEnemyConfig.splice(index, 1);
  renderCustomEditor();
}

// 改变伙伴模板
function changePlayerTemplate(index, templateId) {
  const template = CREATURE_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    customPlayerConfig[index] = {
      ...customPlayerConfig[index],
      templateId: template.id,
      name: template.name,
      element: template.element
    };
    renderCustomEditor();
  }
}

// 改变伙伴等级
function changePlayerLevel(index, level) {
  customPlayerConfig[index] = {
    ...customPlayerConfig[index],
    level: parseInt(level)
  };
  renderCustomEditor();
}

// 改变敌人模板
function changeEnemyTemplate(index, templateId) {
  const template = CREATURE_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    customEnemyConfig[index] = {
      ...customEnemyConfig[index],
      templateId: template.id,
      name: template.name,
      element: template.element
    };
    renderCustomEditor();
  }
}

// 改变敌人等级
function changeEnemyLevel(index, level) {
  customEnemyConfig[index] = {
    ...customEnemyConfig[index],
    level: parseInt(level)
  };
  renderCustomEditor();
}

// 改变敌人类型
function changeEnemyType(index, enemyType) {
  customEnemyConfig[index] = {
    ...customEnemyConfig[index],
    enemyType: enemyType
  };
  renderCustomEditor();
}

// 应用自定义战斗配置
function applyCustomBattle() {
  if (customPlayerConfig.length === 0) {
    alert('请至少添加一个伙伴');
    return;
  }
  if (customEnemyConfig.length === 0) {
    alert('请至少添加一个敌人');
    return;
  }

  // 关闭编辑界面
  closeCustomBattleEditor();

  // 更新玩家单位
  playerUnits.length = 0;
  customPlayerConfig.forEach((config, index) => {
    const stats = getCreatureStats(config.templateId, config.level);
    const unit = {
      id: config.templateId + '_custom_' + index,
      name: config.name,
      level: config.level,
      side: 'player',  // 阵营标记：伙伴
      maxHp: stats.maxHp,
      currentHp: stats.maxHp,
      attack: stats.attack,
      spAttack: stats.spAttack,
      defense: stats.defense,
      spDefense: stats.spDefense,
      speed: stats.speed,
      element: config.element,
      energy: MAX_ENERGY,
      debuffs: [],
      buffs: []
    };
    playerUnits.push(unit);
  });

  // 更新敌人单位
  enemyUnits.length = 0;
  customEnemyConfig.forEach((config, index) => {
    const typeConfig = ENEMY_TYPE_CONFIG[config.enemyType || 'normal'];
    const baseStats = getCreatureStats(config.templateId, config.level);
    const unit = {
      id: config.templateId + '_enemy_' + index,
      templateId: config.templateId,  // 存储原始模板ID
      name: config.name,
      level: config.level,
      side: 'enemy',  // 阵营标记：敌人
      maxHp: Math.floor(baseStats.maxHp * typeConfig.hpMult),
      currentHp: Math.floor(baseStats.maxHp * typeConfig.hpMult),
      attack: Math.floor(baseStats.attack * typeConfig.atkMult),
      spAttack: Math.floor(baseStats.spAttack * typeConfig.spAtkMult),
      defense: Math.floor(baseStats.defense * typeConfig.defMult),
      spDefense: Math.floor(baseStats.spDefense * typeConfig.spDefMult),
      speed: baseStats.speed,
      element: config.element,
      energy: MAX_ENERGY,
      intent: { type: 'attack', power: 50, targetId: playerUnits[0]?.id },
      debuffs: [],
      buffs: [],
      enemyType: config.enemyType || 'normal'
    };
    enemyUnits.push(unit);
  });

  // 重新分配技能
  initializeCompanionSkills();
  initializeEnemySkills();

  // 保存初始配置
  INITIAL_PLAYER_CONFIG = playerUnits.map(u => JSON.parse(JSON.stringify(u)));
  INITIAL_ENEMY_CONFIG = enemyUnits.map(u => {
    const config = JSON.parse(JSON.stringify(u));
    delete config.skills;
    return config;
  });

  // 重置战斗状态
  restartBattleForModeSwitch();

  addLog('=== 自定义战斗开始 ===');
  renderPlayerUnits();
  renderEnemyUnits();

  // 模式3需要初始化战斗流程
  if (currentBattleMode === 3) {
    startRoundMode3();
  }
}

// 获取模式名称
function getModeName(mode) {
  const names = { 1: '经典模式', 2: '宝可梦模式', 3: '以太术士模式' };
  return names[mode] || '未知模式';
}

// 重置战斗状态（用于切换模式）
function restartBattleForModeSwitch() {
  // 重置玩家单位
  playerUnits.forEach((unit, index) => {
    const config = INITIAL_PLAYER_CONFIG[index];
    Object.assign(unit, JSON.parse(JSON.stringify(config)));
  });

  // 重置敌人单位
  enemyUnits.forEach((unit, index) => {
    const config = INITIAL_ENEMY_CONFIG[index];
    Object.assign(unit, JSON.parse(JSON.stringify(config)));
    // 重新初始化敌人技能
    unit.skills = assignSkillsByElement(unit.element, unit.id);
  });

  currentRound = 1;
  battleEnded = false;
  selectedPlayer = null;
  playerCommands = [];
  actionQueue = [];
  currentActionIndex = 0;
  isRoundExecuting = false;
  isBattleStarted = false;
  isPreparing = false;
  isExecuting = false;
  executedPlayerIds.clear();
  playerActionQueue = [];
  enemyActionQueue = [];

  document.getElementById('battleEndOverlay').classList.remove('visible');
  // 模式1和模式3不显示指令列表
  document.getElementById('commandList').style.display = currentBattleMode === 2 ? 'block' : 'none';
  document.getElementById('logContent').innerHTML = '';
  document.getElementById('actionOrderDisplay').classList.remove('visible');
  hideActionOrder();
}

// 更新回合显示（支持三种模式）
function updateTurnDisplay(currentAction = null) {
  document.getElementById('turnNumber').textContent = '第 ' + currentRound + ' 轮';
  const phaseText = document.getElementById('phaseText');

  switch (currentBattleMode) {
    case 1: // 经典模式
      if (isRoundExecuting && currentAction) {
        const isPlayer = currentAction.type === 'player';
        phaseText.textContent = isPlayer ? '己方回合' : '敌人回合';
        phaseText.className = 'phase-text ' + (isPlayer ? 'player-turn' : 'enemy-turn');
      } else if (!isBattleStarted) {
        phaseText.textContent = '等待开始';
        phaseText.className = 'phase-text';
      } else {
        phaseText.textContent = '己方回合';
        phaseText.className = 'phase-text player-turn';
      }
      break;

    case 2: // 宝可梦模式
      if (isRoundExecuting && currentAction) {
        const isPlayer = currentAction.type === 'player';
        phaseText.textContent = isPlayer ? '己方回合 - ' + currentAction.caster.name : '敌人回合';
        phaseText.className = 'phase-text ' + (isPlayer ? 'player-turn' : 'enemy-turn');
      } else if (!isBattleStarted) {
        phaseText.textContent = '等待开始';
        phaseText.className = 'phase-text';
      } else if (isRoundExecuting) {
        phaseText.textContent = '己方回合 - 等待选择';
        phaseText.className = 'phase-text player-turn';
      } else {
        phaseText.textContent = '己方回合';
        phaseText.className = 'phase-text player-turn';
      }
      break;

    case 3: // 以太术士模式
      if (phase === 'enemy_action') {
        phaseText.textContent = '敌人回合';
        phaseText.className = 'phase-text enemy-turn';
      } else if (phase === 'player_action') {
        phaseText.textContent = '己方回合 - ' + (selectedPlayer ? selectedPlayer.name + ' 行动中' : '等待');
        phaseText.className = 'phase-text player-turn';
      } else if (!isBattleStarted) {
        phaseText.textContent = '选择行动的伙伴';
        phaseText.className = 'phase-text';
      } else {
        phaseText.textContent = '选择行动的伙伴';
        phaseText.className = 'phase-text';
      }
      break;
  }
}
