/**
 * 循迹之境 - 怪物系统
 * 寒霜狼
 */

import { EnemyUnit, EnemyUnitConfig } from '../battle/EnemyUnit';
import { Intent, IntentType, ElementType } from '../types';
import { AIDifficulty } from '../battle/EnemyUnit';

/**
 * 寒霜狼配置
 */
export const FrostWolfConfig: EnemyUnitConfig = {
  id: 'frost_wolf',
  name: '寒霜狼',
  level: 10,
  maxHp: 110,
  attack: 90,
  defense: 75,
  spAttack: 50,
  spDefense: 70,
  speed: {
    baseSpeed: 80,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [ElementType.ICE],
  intent: {
    type: IntentType.ATTACK,
    target: 'single',
    power: 70,
    element: ElementType.ICE
  },
  aiStrategy: AIDifficulty.HARD,
  goldReward: 20,
  expReward: 25
};

/**
 * 创建寒霜狼
 */
export function createFrostWolf(): EnemyUnit {
  return new EnemyUnit(FrostWolfConfig);
}

/**
 * 寒霜狼意图模板
 */
export const FrostWolfIntentTemplate = {
  name: '寒霜狼意图模板',
  patterns: [
    { turn: 1, intent: IntentType.ATTACK, power: 70, probability: 1.0 },
    { turn: 2, intent: IntentType.ATTACK, power: 70, probability: 1.0 },
    { turn: 3, intent: IntentType.ATTACK_ALL, power: 55, probability: 0.6 },
    { turn: 4, intent: IntentType.ATTACK, probability: 0.7 },
  ]
};
