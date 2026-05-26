/**
 * 循迹之境 - 战斗模块类型定义
 */

// ==================== 属性系统 ====================

/**
 * 宝可梦8属性克制体系
 * 用于PVP战斗
 */
export enum ElementType {
  FIRE = 'fire',         // 火
  WATER = 'water',       // 水
  GRASS = 'grass',       // 草
  ELECTRIC = 'electric',  // 电
  ICE = 'ice',           // 冰
  ROCK = 'rock',         // 岩
  DRAGON = 'dragon',     // 龙
  PSYCHIC = 'psychic'    // 超能
}

/**
 * 属性克制表
 * 克制×2，抵抗×0.5，免疫×0
 */
export const TYPE_CHART: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.FIRE]: {
    [ElementType.FIRE]: 0.5, [ElementType.WATER]: 0.5, [ElementType.GRASS]: 2,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 2, [ElementType.ROCK]: 0.5,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.WATER]: {
    [ElementType.FIRE]: 2, [ElementType.WATER]: 0.5, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5, [ElementType.ICE]: 1, [ElementType.ROCK]: 2,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.GRASS]: {
    [ElementType.FIRE]: 0.5, [ElementType.WATER]: 2, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.ROCK]: 2,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.ELECTRIC]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 2, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5, [ElementType.ICE]: 1, [ElementType.ROCK]: 1,
    [ElementType.DRAGON]: 0.5, [ElementType.PSYCHIC]: 1
  },
  [ElementType.ICE]: {
    [ElementType.FIRE]: 0.5, [ElementType.WATER]: 0.5, [ElementType.GRASS]: 2,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 0.5, [ElementType.ROCK]: 1,
    [ElementType.DRAGON]: 2, [ElementType.PSYCHIC]: 1
  },
  [ElementType.ROCK]: {
    [ElementType.FIRE]: 2, [ElementType.WATER]: 1, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 2, [ElementType.ROCK]: 1,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.DRAGON]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.GRASS]: 1,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.ROCK]: 1,
    [ElementType.DRAGON]: 2, [ElementType.PSYCHIC]: 1
  },
  [ElementType.PSYCHIC]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.GRASS]: 1,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.ROCK]: 1,
    [ElementType.DRAGON]: 0, [ElementType.PSYCHIC]: 0.5
  }
};

/**
 * 计算属性克制倍率
 * @param attackElement 攻击属性
 * @param defenseElements 防御方属性数组
 */
export function getTypeMultiplier(attackElement: ElementType, defenseElements: ElementType[]): number {
  let multiplier = 1;
  for (const def of defenseElements) {
    multiplier *= TYPE_CHART[attackElement][def];
  }
  return multiplier;
}

// ==================== 速度系统 ====================

/**
 * 速度属性
 */
export interface SpeedStats {
  baseSpeed: number;     // 基础速度 30-150
  speedStage: number;    // 速度等级 -6~+6
  speedBonus: number;    // 固定修正值
}

/**
 * 速度等级映射表（参考宝可梦）
 */
export const SPEED_STAGES: Record<number, number> = {
  [-6]: 0.5, [-5]: 0.55, [-4]: 0.6, [-3]: 0.66, [-2]: 0.73, [-1]: 0.81,
  [0]: 1.0, [1]: 1.25, [2]: 1.5, [3]: 1.75, [4]: 2.0, [5]: 2.25, [6]: 2.5
};

/**
 * 计算实际速度
 */
export function calculateActualSpeed(stats: SpeedStats): number {
  const stageMultiplier = SPEED_STAGES[stats.speedStage] ?? 1;
  return Math.floor(stats.baseSpeed * stageMultiplier + stats.speedBonus);
}

// ==================== 战斗类型 ====================

/**
 * 战斗类型
 * 3Vn框架：所有战斗N=1-3
 */
export enum BattleType {
  NORMAL = 'normal',    // 普通战斗 N=1-3
  ELITE = 'elite',       // 精英战斗 N=1-3
  BOSS = 'boss',         // 首领战斗 N=1-3 多阶段
  PVP = 'pvp'           // PVP 3v3
}

/**
 * 战斗配置
 */
export interface BattleConfig {
  type: BattleType;
  enemyCount: number;    // N的值
  playerTeamSize: number; // 固定3
}

// ==================== 意图系统 ====================

/**
 * 意图类型
 */
export enum IntentType {
  ATTACK = 'attack',       // 攻击
  ATTACK_ALL = 'attack_all', // 全体攻击
  BUFF = 'buff',           // 强化
  DEBUFF = 'debuff',       // 弱化
  HEAL = 'heal',           // 治疗
  DEFEND = 'defend',       // 防御
  SPECIAL = 'special'       // 特殊
}

/**
 * 意图定义
 */
export interface Intent {
  type: IntentType;
  target: 'single' | 'all' | 'self' | 'ally';
  power?: number;           // 威力/治疗量
  element?: ElementType;    // 元素属性
  skillId?: string;         // 使用的技能ID
}

// ==================== 状态效果 ====================

/**
 * Buff类型
 */
export enum BuffType {
  POWER = 'power',           // 力量：每次命中+1伤害
  FORCE = 'force',           // 强化暴击
  SHIELD = 'shield',         // 护盾
  REGENERATION = 'regeneration', // 再生
  GLORY = 'glory',           // 荣耀
  DODGE = 'dodge',           // 闪避
  REDIRECT = 'redirect',      // 嘲讽
  HEAL_UP = 'heal_up',       // 治疗提升
  DEFEND_UP = 'defend_up',   // 防御提升
  ATTACK_UP = 'attack_up',   // 攻击提升
  SPEED_UP = 'speed_up'      // 速度提升
}

/**
 * Debuff类型
 */
export enum DebuffType {
  POISON = 'poison',         // 中毒
  BURN = 'burn',             // 灼烧
  BLEED = 'bleed',           // 流血
  WEAKNESS = 'weakness',     // 虚弱
  TERROR = 'terror',         // 恐惧
  PARALYSIS = 'paralysis',   // 麻痹
  SLEEP = 'sleep',           // 睡眠
  FREEZE = 'freeze',         // 冰冻
  CONFUSION = 'confusion',   // 混乱
  BIND = 'bind'              // 束缚
}

// ==================== 技能相关 ====================

/**
 * 技能伤害类型
 */
export enum DamageType {
  PHYSICAL = 'physical',  // 物理伤害
  SPECIAL = 'special',    // 特殊伤害
  STATUS = 'status',     // 变化技能
  TRUE = 'true'          // 真实伤害
}

/**
 * 技能目标类型
 */
export enum SkillTarget {
  SINGLE = 'single',     // 单体
  ALL = 'all',           // 全体
  SELF = 'self',         // 自身
  ALLY = 'ally',         // 己方单体
  ALLY_ALL = 'ally_all'  // 己方全体
}

// ==================== 战斗状态 ====================

/**
 * 战斗阶段
 */
export enum BattlePhase {
  NOT_STARTED = 'not_started',
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  TURN_END = 'turn_end',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  RETREAT = 'retreat'
}

/**
 * 战斗结果
 */
export enum BattleResult {
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  RETREAT = 'retreat'
}

// ==================== 战斗事件 ====================

/**
 * 战斗事件类型
 */
export enum BattleEventType {
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',
  UNIT_ACTION = 'unit_action',
  UNIT_DAMAGED = 'unit_damaged',
  UNIT_HEALED = 'unit_healed',
  UNIT_DIED = 'unit_died',
  BUFF_ADDED = 'buff_added',
  DEBUFF_ADDED = 'debuff_added',
  BUFF_REMOVED = 'buff_removed',
  DEBUFF_REMOVED = 'debuff_removed',
  INTENT_CHANGED = 'intent_changed',
  BATTLE_END = 'battle_end'
}

/**
 * 战斗事件
 */
export interface BattleEvent {
  type: BattleEventType;
  sourceId?: string;
  targetId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}
