/**
 * 循迹之境 - 怪物系统
 * 火山蜥蜴
 */

import { EnemyUnit, EnemyUnitConfig } from '../battle/EnemyUnit';
import { Intent, IntentType, ElementType } from '../types';
import { AIDifficulty } from '../battle/EnemyUnit';

/**
 * 焰心蜥配置
 */
export const FlameSalamanderConfig: EnemyUnitConfig = {
  id: 'flame_salamander',
  name: '焰心蜥',
  level: 8,
  maxHp: 100,
  attack: 95,
  defense: 65,
  spAttack: 85,
  spDefense: 60,
  speed: {
    baseSpeed: 75,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [ElementType.FIRE],
  intent: {
    type: IntentType.ATTACK,
    target: 'single',
    power: 80,
    element: ElementType.FIRE
  },
  aiStrategy: AIDifficulty.NORMAL,
  goldReward: 15,
  expReward: 20
};

/**
 * 创建焰心蜥
 */
export function createFlameSalamander(): EnemyUnit {
  return new EnemyUnit(FlameSalamanderConfig);
}

/**
 * 焰心蜥意图模板
 */
export const FlameSalamanderIntentTemplate = {
  name: '焰心蜥意图模板',
  patterns: [
    { turn: 1, intent: IntentType.ATTACK, power: 80, probability: 0.7 },
    { turn: 2, intent: IntentType.ATTACK, power: 80, probability: 0.7 },
    { turn: 3, intent: IntentType.BUFF, probability: 1.0 },
    { turn: 4, intent: IntentType.ATTACK, power: 80, probability: 0.8 },
  ]
};
