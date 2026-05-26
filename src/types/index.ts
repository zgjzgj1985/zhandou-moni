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
  SPEED_UP = 'speed_up',     // 速度提升
  // 冰属性·减速流专用Buff
  ICE_ARMOR = 'ice_armor',           // 冰霜护甲：冰属性抗性+30%，受伤时冻结攻击者
  ICE_REFLECT = 'ice_reflect',       // 冰晶反射：反弹冰属性攻击并减速
  ICE_RESIST = 'ice_resist',         // 极寒抗性：减速抗性+50%
  // 冰属性·冻结破冰流v3.0专用Buff
  ICE_WALL = 'ice_wall',             // 冰墙：50%闪避+格挡
  FROST_FIELD = 'frost_field',       // 极寒领域：减伤+群体冻结铺垫
  FROST_MARK = 'frost_mark'          // 冰霜印记：冻结概率+30%
  // 火属性·爆发流专用Buff
  FIRE_SHIELD = 'fire_shield',       // 火盾：受攻击时反伤30点
  FLAME_BODY = 'flame_body',         // 烈焰护体：减伤+受伤时灼烧
  WALL_OF_FIRE = 'wall_of_fire',    // 烈焰壁垒：草/冰属性抗性+30%
  HEAT_COUNTER = 'heat_counter',    // 灼热反击：反弹50%伤害
  FLAME_CHARGE = 'flame_charge',    // 蓄焰：下次火攻+50%
  BLAZE_WILL = 'blaze_will',        // 炎之意志：攻击+速度+火伤提升
  // 水属性·控制流专用Buff
  WATER_SHIELD = 'water_shield',     // 水之守护：敌人下次技能伤害-20%
  CLEAR_SPRING = 'clear_spring',     // 清泉：每回合治疗+净化
  FLOW = 'flow',                    // 流水：速度+1级
  WATER_RESIST = 'water_resist',    // 水属性抗性：对水属性伤害抗性
  // 电属性·连击流专用Buff
  STATIC_SHIELD = 'static_shield',  // 静电护盾：积累静电，下次攻击额外伤害
  STATIC_BODY = 'static_body',       // 蓄电护体：减伤+静电积累
  ELECTRIC_DEFLECT = 'electric_deflect', // 电磁偏转：闪避+反弹
  ELECTROMAGNETIC_INDUCTION = 'electromagnetic_induction', // 电磁感应：追加攻击
  THUNDER_DOMAIN = 'thunder_domain', // 雷霆领域：必定命中+敌方受伤
  COMBO_CHARGE = 'combo_charge',    // 连击充能：连击次数提升伤害
  ELECTRIC_FIELD = 'electric_field', // 电场加速：积累电场提升速度
  THUNDER_FURY = 'thunder_fury',    // 雷霆之势：攻击附带连锁
  // 超能属性奥秘流专用Buff
  MIND_SHIELD = 'mind_shield',       // 心智护盾：受攻击时减少敌人PP
  REFLECT = 'reflect',               // 灵镜反照：反弹攻击
  PSYCHIC_DODGE = 'psychic_dodge',   // 迷雾闪避：概率闪避+加速
  PSYCHIC_RESIST = 'psychic_resist', // 超能抗性：抗精神攻击
  INTENT_BLUR = 'intent_blur',      // 意图模糊：降低己方意图可信度
  // 草属性·光环流专用Buff
  VINE_BODY = 'vine_body',           // 藤蔓护体：受到攻击时缠绕攻击者
  LIFE_BODY = 'life_body',           // 生机护体：受到伤害降低+受击回复
  VINE_POWER = 'vine_power',        // 藤蔓之力：每层+1级攻击，最多3层
  GROWTH = 'growth',                 // 成长：每回合攻击+特攻各+1级，最多3层
  ROOT_BOUND = 'root_bound',         // 扎根：每回合回复最大HP的8%，速度-1级
  LEAF_BARRIER = 'leaf_barrier'     // 绿叶屏障：群体护盾+草属性抗性
}

/**
 * Debuff类型
 */
export enum DebuffType {
  POISON = 'poison',         // 中毒
  BURN = 'burn',             // 灼烧：每回合损失HP
  BLEED = 'bleed',           // 流血
  WEAKNESS = 'weakness',     // 虚弱
  TERROR = 'terror',         // 恐惧
  PARALYSIS = 'paralysis',   // 麻痹
  SLEEP = 'sleep',           // 睡眠
  FREEZE = 'freeze',         // 冰冻：完全无法行动
  CONFUSION = 'confusion',   // 混乱/迷茫
  BIND = 'bind',             // 束缚
  // 冰属性·减速流专用Debuff
  SLOW = 'slow',             // 减速：速度-1级
  ICE_SEAL = 'ice_seal',     // 冰封禁制：封印≥3能量技能
  ICE_DOT = 'ice_dot',       // 冰冻伤害：每回合受到冰系伤害
  // 冰属性·冻结破冰流v3.0专用Debuff
  DEEP_FREEZE = 'deep_freeze',       // 深冻：持续3回合，10%自解
  ABSOLUTE_FREEZE = 'absolute_freeze', // 绝对冻结：持续3回合，0%自解，必须受伤解除
  FROST_MARK = 'frost_mark',         // 冰霜印记：下次冰属性攻击冻结概率+30%
  // 火属性·爆发流专用Debuff
  BURN_MARK = 'burn_mark',    // 灼伤印记：下回合追加伤害
  COMBUSTION_MARK = 'combustion_mark', // 燃尽印记：延迟伤害
  // 水属性·控制流专用Debuff
  WET = 'wet',               // 潮湿：电属性攻击额外30%伤害
  DROWNING = 'drowning',      // 溺亡：每回合损失HP
  TURBULENCE = 'turbulence', // 湍流：技能消耗+1能量
  // 电属性·连击流专用Debuff
  STATIC = 'static',         // 静电：受攻击时反伤
  ELECTRIC_SHOCK = 'electric_shock', // 电疗：回合开始受伤+速度提升
  // 超能属性奥秘流专用Debuff
  MIND_WOUND = 'mind_wound',     // 心灵创伤：攻击命中率下降
  FORBIDDEN = 'forbidden',       // 禁忌：能力等级下降
  // 草属性·光环流专用Debuff
  TANGLE = 'tangle',              // 缠绕：速度降低
  PARASITE = 'parasite',          // 寄生：每回合草伤害+施法者回复
  LEAF_MARK = 'leaf_mark',        // 叶片标记：受到草属性攻击时+20%伤害
  PARASITE_MARK = 'parasite_mark' // 寄生印记：每回合施法者HP的6%伤害+回复
}

// ==================== 能量系统 ====================

/**
 * 战斗能量配置
 */
export interface EnergyConfig {
  maxEnergy: number;     // 最大能量值，默认5点
  currentEnergy: number;  // 当前能量值
  perTurnRegen: number;   // 每回合回复能量
}

/**
 * 默认能量配置
 */
export const DEFAULT_ENERGY: EnergyConfig = {
  maxEnergy: 10,
  currentEnergy: 10,
  perTurnRegen: 10  // 每回合回复至满
};

// ==================== 技能相关 ====================

/**
 * 技能能量消耗等级
 */
export enum EnergyCost {
  FREE = 0,      // 免费技能（如基础攻击）
  LOW = 1,       // 低消耗（1能量）
  MEDIUM = 2,     // 中消耗（2能量）
  HIGH = 3,       // 高消耗（3能量）
  ULTRA = 4,      // 超高消耗（4能量）
  ULTIMATE = 5,   // 终极技能（5能量）
  MEGA = 6        // mega级技能（6能量，通常为特殊效果技能）
}

/**
 * 获取能量消耗的显示文本
 */
export function getEnergyCostText(cost: number): string {
  switch (cost) {
    case 0: return '免费';
    case 1: return '1能量';
    case 2: return '2能量';
    case 3: return '3能量';
    case 4: return '4能量';
    case 5: return '5能量';
    case 6: return '6能量';
    default: return `${cost}能量`;
  }
}

/**
 * 技能伤害类型
 */
export enum DamageType {
  PHYSICAL = 'physical',  // 物理伤害
  SPECIAL = 'special',    // 特殊伤害
  STATUS = 'status',      // 变化技能
  TRUE = 'true'          // 真实伤害
}

/**
 * 技能目标类型
 */
export enum SkillTarget {
  SINGLE = 'single',     // 单体敌人
  ALL = 'all',           // 全体（敌方或己方，根据使用场景）
  SELF = 'self',         // 自身
  ALLY = 'ally',         // 己方单体
  ALLY_ALL = 'ally_all', // 己方全体
  ENEMY_ALL = 'enemy_all' // 敌方全体
}

/**
 * 技能倾向分类
 * 用于区分技能的战术定位
 */
export enum SkillTendency {
  ATTACK = 'attack',     // 攻击倾向
  DEFENSE = 'defense',   // 防御倾向
  SUPPORT = 'support'    // 辅助倾向
}

/**
 * 技能倾向配置
 */
export interface SkillTendencyConfig {
  tendency: SkillTendency;
  description: string;
}

/**
 * 技能倾向描述映射
 */
export const SKILL_TENDENCY_TEXT: Record<SkillTendency, SkillTendencyConfig> = {
  [SkillTendency.ATTACK]: {
    tendency: SkillTendency.ATTACK,
    description: '攻击倾向：造成直接伤害或附加控制效果'
  },
  [SkillTendency.DEFENSE]: {
    tendency: SkillTendency.DEFENSE,
    description: '防御倾向：提供护盾、闪避、反射等生存能力'
  },
  [SkillTendency.SUPPORT]: {
    tendency: SkillTendency.SUPPORT,
    description: '辅助倾向：状态管理、信息操控、团队增益'
  }
};

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
