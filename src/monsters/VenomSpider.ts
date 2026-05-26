/**
 * 循迹之境 - 怪物系统
 * 毒液蜘蛛
 */

import { EnemyUnit, EnemyUnitConfig } from '../battle/EnemyUnit';
import { Intent, IntentType } from '../types';
import { AIDifficulty } from '../battle/EnemyUnit';

/**
 * 毒液蛛配置
 */
export const VenomSpiderConfig: EnemyUnitConfig = {
  id: 'venom_spider',
  name: '毒液蛛',
  level: 6,
  maxHp: 70,
  attack: 80,
  defense: 55,
  spAttack: 75,
  spDefense: 70,
  speed: {
    baseSpeed: 95,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [], // 虫属性暂未定义，使用无属性
  intent: {
    type: IntentType.ATTACK,
    target: 'single',
    power: 50
  },
  aiStrategy: AIDifficulty.NORMAL,
  goldReward: 10,
  expReward: 15
};

/**
 * 创建毒液蛛
 */
export function createVenomSpider(): EnemyUnit {
  return new EnemyUnit(VenomSpiderConfig);
}

/**
 * 毒液蛛意图模板
 */
export const VenomSpiderIntentTemplate = {
  name: '毒液蛛意图模板',
  patterns: [
    { turn: 1, intent: IntentType.ATTACK, power: 50, probability: 1.0 },
    { turn: 2, intent: IntentType.DEBUFF, probability: 0.6 },
    { turn: 3, intent: IntentType.ATTACK, probability: 0.7 },
  ]
};
