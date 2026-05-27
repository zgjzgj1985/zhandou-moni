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
  GROUND = 'ground',     // 地
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
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 2, [ElementType.GROUND]: 1,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.WATER]: {
    [ElementType.FIRE]: 2, [ElementType.WATER]: 0.5, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5, [ElementType.ICE]: 1, [ElementType.GROUND]: 2,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.GRASS]: {
    [ElementType.FIRE]: 0.5, [ElementType.WATER]: 2, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.GROUND]: 2,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.ELECTRIC]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 2, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5, [ElementType.ICE]: 1, [ElementType.GROUND]: 0,
    [ElementType.DRAGON]: 0.5, [ElementType.PSYCHIC]: 1
  },
  [ElementType.ICE]: {
    [ElementType.FIRE]: 0.5, [ElementType.WATER]: 0.5, [ElementType.GRASS]: 2,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 0.5, [ElementType.GROUND]: 2,
    [ElementType.DRAGON]: 2, [ElementType.PSYCHIC]: 1
  },
  [ElementType.GROUND]: {
    [ElementType.FIRE]: 2, [ElementType.WATER]: 1, [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 2, [ElementType.ICE]: 1, [ElementType.GROUND]: 1,
    [ElementType.DRAGON]: 1, [ElementType.PSYCHIC]: 1
  },
  [ElementType.DRAGON]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.GRASS]: 1,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.GROUND]: 1,
    [ElementType.DRAGON]: 2, [ElementType.PSYCHIC]: 1
  },
  [ElementType.PSYCHIC]: {
    [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.GRASS]: 1,
    [ElementType.ELECTRIC]: 1, [ElementType.ICE]: 1, [ElementType.GROUND]: 1,
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
  targetId?: string;        // 具体目标ID（用于UI显示）
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
  TEMP_STAT_MODIFIER = 'temp_stat_modifier', // 临时属性强化（技能效果）
  // 冰属性·减速流专用Buff
  ICE_ARMOR = 'ice_armor',           // 冰霜护甲：冰属性抗性+30%，受伤时冻结攻击者
  ICE_REFLECT = 'ice_reflect',       // 冰晶反射：反弹冰属性攻击并减速
  ICE_RESIST = 'ice_resist',         // 极寒抗性：减速抗性+50%
  // 冰属性·冻结破冰流v3.0专用Buff
  ICE_WALL = 'ice_wall',             // 冰墙：50%减伤
  FROST_MARK = 'frost_mark',         // 冰霜印记：冻结概率+30%
  FROZEN_LAND_ENV = 'frozen_land_env', // 冻土：冰属性技能能耗-1
  // 火属性·爆发流专用Buff
  FIRE_SHIELD = 'fire_shield',       // 火盾：受攻击时反伤30点
  FLAME_BODY = 'flame_body',         // 烈焰护体：减伤+受伤时灼烧
  WALL_OF_FIRE = 'wall_of_fire',    // 烈焰壁垒：草/冰属性抗性+30%
  FLAME_CHARGE = 'flame_charge',    // 蓄焰：下次火攻+50%
  BLAZE_WILL = 'blaze_will',        // 炎之意志：攻击+速度+火伤提升
  OVERHEAT_PENALTY = 'overheat_penalty', // 过热代价：特攻-2级
  // 水属性·控制流专用Buff
  WATER_SHIELD = 'water_shield',     // 水之守护：敌人下次技能伤害-20%
  CLEAR_SPRING = 'clear_spring',     // 清泉：每回合治疗+净化
  FLOW = 'flow',                    // 流水：速度+1级
  WATER_RESIST = 'water_resist',    // 水属性抗性：对水属性伤害抗性
  WATER_SOAK = 'water_soak',        // 浸透：特防-1级/层，最多6层，持续2回合
  // 超能属性奥秘流专用Buff
  MIND_SHIELD = 'mind_shield',       // 心智护盾：受攻击时减少敌人PP
  REFLECT = 'reflect',               // 灵镜反照：反弹攻击
  PSYCHIC_DODGE = 'psychic_dodge',   // 迷雾闪避：概率闪避+加速
  PSYCHIC_RESIST = 'psychic_resist', // 超能抗性：抗精神攻击
  INTENT_BLUR = 'intent_blur',      // 意图模糊：降低己方意图可信度
  // 超能属性奥秘流v2.0新增Buff
  PSYCHIC_TERRAIN = 'psychic_terrain',     // 精神场地：超能威力+30%
  PROPHECY_MARK = 'prophecy_mark',         // 预言标记：累积层数增强技能威力
  // 草属性·光环流专用Buff
  VINE_BODY = 'vine_body',           // 藤蔓护体：受到攻击时缠绕攻击者
  LIGHT_GATHER = 'light_gather',     // 光能汇聚：下次草系输出技能+60威力
  FRAGRANT_ENV = 'fragrant_env',     // 芬芳环境：草系伤害+25%，每回合回复5%HP
  COUNTER_STANCE = 'counter_stance', // 防反之姿：反弹60%伤害+先手+1
  NUTRIENT = 'nutrient',             // 养分汲取：能量回复加成
  ROOT_BOUND = 'root_bound',         // 扎根：每回合回复最大HP的8%，速度-1级
  // 地属性·天气流专用Buff
  SANDSTORM_SHIELD = 'sandstorm_shield', // 沙暴抗性：沙暴天气下减伤
  SAND_FORCE = 'sand_force',           // 沙之力：沙暴天气下地系威力+50%
  UNDERGROUND = 'underground',         // 挖洞状态：免疫地面攻击，下回合先手
  SAND_TOMB_BUFF = 'sand_tomb_buff',  // 流沙地狱状态：陷入流沙
  // 电属性·电磁脉冲流专用Buff
  CHARGE = 'charge',                   // 电荷：电属性核心资源，5层上限
  OVERLOAD = 'overload',               // 超载：下一次攻击附带连锁
  CHARGING = 'charging',               // 充能状态：每次攻击额外+1电荷
  ELECTRIC_FIELD_BUFF = 'electric_field_buff', // 电场：全队电荷加速+威力加成
  STATIC_BODY = 'static_body',         // 蓄电护体：减伤50%+静电反伤
  ELECTRIC_DEFLECT = 'electric_deflect', // 电磁偏转：闪避+反击
  // 龙属性·血脉压制流专用Buff
  DRAGON_BLOOD = 'dragon_blood',               // 龙之气息：核心层叠Buff，15层上限
  DRAGON_BLOOD_RESONANCE = 'dragon_blood_resonance', // 龙属共鸣：增强龙系技能效果
  DRAGON_GUARD = 'dragon_guard',               // 龙鳞守护：减伤75%+护盾+反击
  DRAGON_COUNTER = 'dragon_counter',           // 龙鳞反击：反弹伤害
  DRAGON_AURA_BUFF = 'dragon_aura_buff'       // 龙威：全体敌人debuff
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
  // 地属性·天气流专用Debuff
  GROUND_TRAP = 'ground_trap',       // 地面陷阱：受到地面攻击时受伤增加
  SAND_TOMB_DEBUFF = 'sand_tomb_debuff', // 流沙地狱：速度-2且每回合受伤
  // 冰属性·减速流专用Debuff
  SLOW = 'slow',             // 减速：速度-1级
  ICE_SEAL = 'ice_seal',     // 冰封禁制：封印≥3能量技能
  ICE_DOT = 'ice_dot',       // 冰冻伤害：每回合受到冰系伤害
  // 冰属性·冰霜蓄力流专用Debuff
  FROST = 'frost',           // 冰霜：速度-1级/层，5层触发冻结
  FROST_MARK = 'frost_mark', // 冰霜印记：受到冰属性攻击时，有概率附加1层冰霜
  EXTREME_COLD_MARK = 'extreme_cold_mark', // 极寒印记：下次技能能耗+2
  // 火属性·爆发流专用Debuff
  BURN_MARK = 'burn_mark',    // 灼伤印记：下回合追加伤害
  COMBUSTION_MARK = 'combustion_mark', // 燃尽印记：延迟伤害
  // 水属性·控制流专用Debuff
  WET = 'wet',               // 潮湿：电属性攻击额外30%伤害
  DROWNING_STATUS = 'drowning_status', // 溺水：下一次高能量技能伤害-30%
  TURBULENCE = 'turbulence', // 湍流：技能消耗+1能量
  WATER_SOAK = 'water_soak', // 浸透：特防-1级/层，最多6层，持续2回合
  STEAM_BURN = 'steam_burn', // 蒸汽灼伤：被热水攻击时附加的灼烧状态
  MUDDY = 'muddy',           // 浑浊：命中率-1级/层
  // 电属性·电磁脉冲流专用Debuff
  STATIC = 'static',         // 静电：攻击者额外+1电荷
  // 超能属性奥秘流专用Debuff
  MIND_WOUND = 'mind_wound',     // 心灵创伤：攻击命中率下降
  FORBIDDEN = 'forbidden',       // 禁忌：能力等级下降
  // 超能属性奥秘流v2.0新增Debuff
  PSYCHIC_NOISE = 'psychic_noise',   // 精神噪音：禁止恢复HP
  // 草属性·光环流专用Debuff
  TANGLE = 'tangle',              // 缠绕：速度降低
  PARASITE = 'parasite',          // 寄生：每回合草伤害+施法者回复
  WITHER = 'wither',             // 枯萎：每回合受到自身属性10点威力特殊伤害/层
  // 地属性·天气流专用Debuff
  STUN = 'stun',                  // 眩晕：完全无法行动，持续1回合
  // 龙属性·血脉压制流专用Debuff
  DRAGON_BURN = 'dragon_burn',               // 龙息灼烧：每回合受到15%最大HP伤害
  DRAGON_CONFUSION = 'dragon_confusion',    // 龙之终焉混乱：攻击可能失误
  DRAGON_CRUSH_DEF = 'dragon_crush_def',   // 龙之碾压：防御下降
  DRAGON_INTIMIDATE = 'dragon_intimidate',  // 龙威震慑：攻击-1级、速度-1级
  DRAGON_POWER_LOSS = 'dragon_power_loss'   // 流星陨落衰败：攻击、特攻永久下降
}

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
  MEGA = 6,        // mega级技能（6能量，通常为特殊效果技能）
  ENVIRONMENT = 8  // 环境型技能（8能量，召唤环境的特殊技能）
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
    case 8: return '8能量';
    default: return `${cost}能量`;
  }
}

/**
 * 技能伤害类型
 */
export enum DamageType {
  PHYSICAL = 'physical',  // 物理伤害
  SPECIAL = 'special',    // 特殊伤害
  MIXED = 'mixed',        // 混合伤害（特攻打、物防减免）
  STATUS = 'status',      // 变化技能
  TRUE = 'true',          // 真实伤害
  MULTI_HIT = 'multi_hit' // 多段伤害（多次攻击）
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
 * 天气类型
 */
export enum WeatherType {
  SANDSTORM = 'sandstorm',  // 沙暴
  RAIN = 'rain',            // 下雨
  SUNNY = 'sunny',          // 晴天
  HAIL = 'hail'            // 冰雹
}

/**
 * 地形类型
 */
export enum TerrainType {
  TOXIC_SPIKES = 'toxic_spikes',  // 毒钉
  STEALTH_ROCKS = 'stealth_rocks' // 隐形岩
}

/**
 * 天气效果接口
 */
export interface WeatherEffect {
  weather: WeatherType;
  duration: number;
  sourceId?: string;
}

/**
 * 地形效果接口
 */
export interface TerrainEffect {
  terrainType: TerrainType;
  stacks: number;
  maxStacks: number;
  sourceId?: string;
}

// ==================== 类型映射（用于技能系统） ====================

/**
 * 字符串到BuffType的映射
 * 用于从技能定义中的字符串创建正确的BuffType枚举值
 */
export const STRING_TO_BUFF_TYPE: Record<string, BuffType> = {
  // 基础Buff
  'power': BuffType.POWER,
  'force': BuffType.FORCE,
  'shield': BuffType.SHIELD,
  'regeneration': BuffType.REGENERATION,
  'glory': BuffType.GLORY,
  'dodge': BuffType.DODGE,
  'redirect': BuffType.REDIRECT,
  'heal_up': BuffType.HEAL_UP,
  'defend_up': BuffType.DEFEND_UP,
  'attack_up': BuffType.ATTACK_UP,
  'speed_up': BuffType.SPEED_UP,
  'temp_stat_modifier': BuffType.TEMP_STAT_MODIFIER,
  // 冰属性Buff
  'ice_armor': BuffType.ICE_ARMOR,
  'ice_reflect': BuffType.ICE_REFLECT,
  'ice_resist': BuffType.ICE_RESIST,
  'ice_wall': BuffType.ICE_WALL,
  'frost_field': BuffType.FROST_FIELD,
  'frost_mark': BuffType.FROST_MARK,
  // 火属性Buff
  'fire_shield': BuffType.FIRE_SHIELD,
  'flame_body': BuffType.FLAME_BODY,
  'wall_of_fire': BuffType.WALL_OF_FIRE,
  'flame_charge': BuffType.FLAME_CHARGE,
  'blaze_will': BuffType.BLAZE_WILL,
  'overheat_penalty': BuffType.OVERHEAT_PENALTY,
  // 水属性Buff
  'water_shield': BuffType.WATER_SHIELD,
  'clear_spring': BuffType.CLEAR_SPRING,
  'flow': BuffType.FLOW,
  'water_resist': BuffType.WATER_RESIST,
  'water_soak': BuffType.WATER_SOAK,
  // 超能属性Buff
  'mind_shield': BuffType.MIND_SHIELD,
  'reflect': BuffType.REFLECT,
  'psychic_dodge': BuffType.PSYCHIC_DODGE,
  'psychic_resist': BuffType.PSYCHIC_RESIST,
  'intent_blur': BuffType.INTENT_BLUR,
  'psychic_terrain': BuffType.PSYCHIC_TERRAIN,
  'prophecy_mark': BuffType.PROPHECY_MARK,
  // 草属性Buff
  'vine_body': BuffType.VINE_BODY,
  'light_gather': BuffType.LIGHT_GATHER,
  'fragrant_env': BuffType.FRAGRANT_ENV,
  'counter_stance': BuffType.COUNTER_STANCE,
  'nutrient': BuffType.NUTRIENT,
  'root_bound': BuffType.ROOT_BOUND,
  // 地属性Buff
  'sandstorm_shield': BuffType.SANDSTORM_SHIELD,
  'sand_force': BuffType.SAND_FORCE,
  'underground': BuffType.UNDERGROUND,
  'sand_tomb_buff': BuffType.SAND_TOMB_BUFF,
  // 电属性Buff
  'charge': BuffType.CHARGE,
  'overload': BuffType.OVERLOAD,
  'charging': BuffType.CHARGING,
  'electric_field_buff': BuffType.ELECTRIC_FIELD_BUFF,
  'static_body': BuffType.STATIC_BODY,
  'electric_deflect': BuffType.ELECTRIC_DEFLECT,
  // 龙属性Buff
  'dragon_blood': BuffType.DRAGON_BLOOD,
  'dragon_blood_resonance': BuffType.DRAGON_BLOOD_RESONANCE,
  'dragon_guard': BuffType.DRAGON_GUARD,
  'dragon_counter': BuffType.DRAGON_COUNTER,
  'dragon_aura_buff': BuffType.DRAGON_AURA_BUFF
};

/**
 * 字符串到DebuffType的映射
 * 用于从技能定义中的字符串创建正确的DebuffType枚举值
 */
export const STRING_TO_DEBUFF_TYPE: Record<string, DebuffType> = {
  // 基础Debuff
  'poison': DebuffType.POISON,
  'burn': DebuffType.BURN,
  'bleed': DebuffType.BLEED,
  'weakness': DebuffType.WEAKNESS,
  'terror': DebuffType.TERROR,
  'paralysis': DebuffType.PARALYSIS,
  'sleep': DebuffType.SLEEP,
  'freeze': DebuffType.FREEZE,
  'confusion': DebuffType.CONFUSION,
  'bind': DebuffType.BIND,
  // 冰属性Debuff
  'slow': DebuffType.SLOW,
  'ice_seal': DebuffType.ICE_SEAL,
  'ice_dot': DebuffType.ICE_DOT,
  'frost': DebuffType.FROST,
  'frost_mark': DebuffType.FROST_MARK,
  'extreme_cold_mark': DebuffType.EXTREME_COLD_MARK,
  // 火属性Debuff
  'burn_mark': DebuffType.BURN_MARK,
  'combustion_mark': DebuffType.COMBUSTION_MARK,
  // 水属性Debuff
  'wet': DebuffType.WET,
  'turbulence': DebuffType.TURBULENCE,
  'water_soak': DebuffType.WATER_SOAK,
  'steam_burn': DebuffType.STEAM_BURN,
  'muddy': DebuffType.MUDDY,
  // 电属性Debuff
  'static': DebuffType.STATIC,
  // 超能属性Debuff
  'mind_wound': DebuffType.MIND_WOUND,
  'forbidden': DebuffType.FORBIDDEN,
  'psychic_noise': DebuffType.PSYCHIC_NOISE,
  // 草属性Debuff
  'tangle': DebuffType.TANGLE,
  'parasite': DebuffType.PARASITE,
  'wither': DebuffType.WITHER,
  // 地属性Debuff
  'stun': DebuffType.STUN,
  'ground_trap': DebuffType.GROUND_TRAP,
  'sand_tomb_debuff': DebuffType.SAND_TOMB_DEBUFF,
  // 龙属性Debuff
  'dragon_burn': DebuffType.DRAGON_BURN,
  'dragon_confusion': DebuffType.DRAGON_CONFUSION,
  'dragon_crush_def': DebuffType.DRAGON_CRUSH_DEF,
  'dragon_intimidate': DebuffType.DRAGON_INTIMIDATE,
  'dragon_power_loss': DebuffType.DRAGON_POWER_LOSS
};

/**
 * 将字符串转换为BuffType枚举
 * @param str 字符串值
 * @returns BuffType枚举值，如果未找到则抛出错误
 */
export function stringToBuffType(str: string): BuffType {
  const result = STRING_TO_BUFF_TYPE[str];
  if (!result) {
    throw new Error(`Unknown BuffType string: ${str}`);
  }
  return result;
}

/**
 * 将字符串转换为DebuffType枚举
 * @param str 字符串值
 * @returns DebuffType枚举值，如果未找到则抛出错误
 */
export function stringToDebuffType(str: string): DebuffType {
  const result = STRING_TO_DEBUFF_TYPE[str];
  if (!result) {
    throw new Error(`Unknown DebuffType string: ${str}`);
  }
  return result;
}
