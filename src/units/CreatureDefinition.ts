/**
 * 循迹之境 - 统一生物定义系统
 * 
 * 所有生物（伙伴和怪物）的定义都放在这里
 * 伙伴和怪物共享相同的生物定义，区别只是阵营不同
 */

import { Skill } from '../skills';
import { ElementType, Intent, IntentType } from '../types';
import { AIDifficulty } from '../battle/EnemyUnit';

// ==================== 生物基础定义 ====================

/**
 * 统一生物定义接口
 */
export interface CreatureDefinition {
  id: string;                    // 唯一ID
  name: string;                 // 名称
  description: string;           // 描述
  
  // 等级和属性
  level: number;
  maxHp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  
  // 元素属性
  elements: ElementType[];
  
  // 技能组（4个技能）
  skills: Skill[];
  
  // AI相关（用于怪物）
  aiStrategy?: AIDifficulty;
  intentPattern?: IntentPattern[];
  goldReward?: number;
  expReward?: number;
}

/**
 * AI意图模式
 */
export interface IntentPattern {
  turn: number;           // 回合数
  intent: IntentType;     // 意图类型
  power?: number;         // 威力（用于攻击意图）
  element?: ElementType;  // 元素（用于攻击意图）
  target?: 'single' | 'all' | 'self' | 'ally';  // 目标
  probability?: number;    // 概率
}

// ==================== 伙伴和怪物工厂函数 ====================

import { PlayerUnit, PlayerUnitConfig } from '../battle/PlayerUnit';
import { EnemyUnit, EnemyUnitConfig } from '../battle/EnemyUnit';

/**
 * 创建友方单位（伙伴）
 */
export function createCompanion(def: CreatureDefinition): PlayerUnit {
  const config: PlayerUnitConfig = {
    id: def.id,
    name: def.name,
    level: def.level,
    maxHp: def.maxHp,
    attack: def.attack,
    defense: def.defense,
    spAttack: def.spAttack,
    spDefense: def.spDefense,
    speed: {
      baseSpeed: def.speed,
      speedStage: 0,
      speedBonus: 0
    },
    elements: def.elements,
    skills: def.skills,
    maxPp: true
  };
  return new PlayerUnit(config);
}

/**
 * 创建敌方单位（怪物）
 */
export function createEnemy(def: CreatureDefinition): EnemyUnit {
  // 从意图模式中获取第一个意图作为默认意图
  let intent: Intent = {
    type: IntentType.ATTACK,
    target: 'single',
    power: 60,
    element: def.elements[0]
  };
  
  if (def.intentPattern && def.intentPattern.length > 0) {
    const firstPattern = def.intentPattern[0];
    intent = {
      type: firstPattern.intent,
      target: firstPattern.target || 'single',
      power: firstPattern.power,
      element: firstPattern.element || def.elements[0]
    };
  }
  
  const config: EnemyUnitConfig = {
    id: def.id,
    name: def.name,
    level: def.level,
    maxHp: def.maxHp,
    attack: def.attack,
    defense: def.defense,
    spAttack: def.spAttack,
    spDefense: def.spDefense,
    speed: {
      baseSpeed: def.speed,
      speedStage: 0,
      speedBonus: 0
    },
    elements: def.elements,
    intent,
    skills: def.skills,
    aiStrategy: def.aiStrategy || AIDifficulty.NORMAL,
    goldReward: def.goldReward || 10,
    expReward: def.expReward || 10
  };
  return new EnemyUnit(config);
}
