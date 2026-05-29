// Source: battle-simple.html lines 1416-1450 (state variables)

// ==================== 状态变量 ====================
let selectedPlayer = null;
let selectedUnitId = null;
let currentRound = 1;           // 当前轮次
let isDragging = false;
let draggedSkill = null;
let wasDragReleased = false;  // 标记拖拽释放（未命中目标）
let battleEnded = false;
let playerCommands = [];       // 玩家指令列表
let actionQueue = [];          // 行动队列
let currentActionIndex = 0;    // 当前行动索引
let isRoundExecuting = false; // 是否正在执行轮次
let isBattleStarted = false;   // 战斗是否已开始

// 模式3异步流程控制
let actionResolve = null;  // 用于解决等待中的 Promise

// ==================== 战斗模式系统 ====================
// 模式1: 经典模式 - 玩家同时下达指令后统一结算
// 模式2: 宝可梦模式 - 玩家选择伙伴后该伙伴立即行动
// 模式3: 以太术士模式 - 准备阶段下达指令，然后按速度顺序执行
let currentBattleMode = 1;  // 默认经典模式
let isPreparing = false;    // 模式3准备阶段
let isExecuting = false;   // 模式3执行阶段
let executedPlayerIds = new Set(); // 已执行过的玩家ID
let playerActionQueue = [];  // 玩家行动队列
let enemyActionQueue = [];  // 敌人行动队列
let currentAction = null;   // 当前正在执行的行动
let phase = 'idle';         // 当前阶段：idle/player_select/player_action/enemy_action
let battleEnvironment = null;  // 战场环境：fragrant（芬芳）等
let battleEnvironmentTurns = 0;  // 战场环境持续回合
let globalWeather = null;  // 全局天气效果：rainy（雨天）等

// 初始配置（用于重置）- 在初始化后填充
let INITIAL_PLAYER_CONFIG = [];
let INITIAL_ENEMY_CONFIG = [];

// ==================== 防御技能冷却系统 ====================
// 追踪单位身上的防御技能冷却状态
// 结构: { 'unitId': { 'skillId': remainingCooldown } }
let defenseSkillCooldowns = {};
