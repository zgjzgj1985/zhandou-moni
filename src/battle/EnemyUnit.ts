/**
 * 循迹之境 - 敌人战斗单位
 */

import { CombatUnit, UnitConfig } from './CombatUnit';
import { Intent, IntentType, Skill } from '../types';
import { Trait } from '../skills/traits';

/**
 * 敌人单位配置
 */
export interface EnemyUnitConfig extends UnitConfig {
  intent: Intent;
  skills?: Skill[];
  aiStrategy?: AIDifficulty;
  goldReward?: number;
  expReward?: number;
}

/**
 * AI难度等级
 */
export enum AIDifficulty {
  EASY = 'easy',         // 简单：低优先级行动
  NORMAL = 'normal',     // 普通：标准策略
  HARD = 'hard',        // 困难：高优先级行动
  ELITE = 'elite',      // 精英：最优策略
  BOSS = 'boss'         // BOSS：多阶段决策
}

/**
 * 敌人战斗单位
 */
export class EnemyUnit extends CombatUnit {
  intent: Intent;
  skills: Skill[];
  aiStrategy: AIDifficulty;
  goldReward: number;
  expReward: number;
  aromaResistance: number; // 芳香剂抗性
  
  constructor(config: EnemyUnitConfig) {
    super(config);
    this.intent = config.intent;
    this.skills = config.skills ?? [];
    this.aiStrategy = config.aiStrategy ?? AIDifficulty.NORMAL;
    this.goldReward = config.goldReward ?? 10;
    this.expReward = config.expReward ?? 10;
    this.aromaResistance = 0;
  }
  
  /**
   * 设置意图
   */
  setIntent(intent: Intent): void {
    this.intent = intent;
  }
  
  /**
   * 随机改变意图（芳香剂效果）
   * @param availableIntents 可用的意图类型列表
   */
  scrambleIntent(availableIntents: IntentType[]): void {
    // 芳香剂抗性：随机数 < 抗性值时，干扰被抵抗
    if (Math.random() < this.aromaResistance) {
      return;
    }
    
    const randomIntent = availableIntents[Math.floor(Math.random() * availableIntents.length)];
    this.intent = {
      type: randomIntent,
      target: this.intent.target,
      power: this.intent.power,
      element: this.intent.element
    };
  }
  
  /**
   * 获取敌人意图显示信息
   */
  getIntentDisplay(): IntentDisplayInfo {
    return {
      type: this.intent.type,
      target: this.intent.target,
      power: this.intent.power,
      element: this.intent.element,
      icon: getIntentIcon(this.intent.type),
      description: getIntentDescription(this.intent)
    };
  }
  
  /**
   * 执行AI决策
   */
  decideAction(): AIDecision {
    // 简化AI：根据HP和意图决定行动
    const hpPercent = this.getHpPercent();
    
    // 低HP时倾向于治疗或防御
    if (hpPercent < 0.3 && Math.random() < 0.5) {
      if (this.hasHealingSkill()) {
        return { action: 'heal', target: 'self' };
      }
      if (this.hasDefendAction()) {
        return { action: 'defend', target: 'self' };
      }
    }
    
    // 正常情况下按意图执行
    return {
      action: mapIntentToAction(this.intent.type),
      target: this.intent.target,
      power: this.intent.power,
      element: this.intent.element
    };
  }
  
  /**
   * 检查是否有治疗技能
   */
  private hasHealingSkill(): boolean {
    return this.skills.some(s => s.definition.effects.some(e => e.healing));
  }
  
  /**
   * 检查是否有防御行动
   */
  private hasDefendAction(): boolean {
    return this.intent.type === IntentType.DEFEND || 
           this.skills.some(s => s.definition.effects.some(e => e.shield));
  }
  
  /**
   * 获取奖励
   */
  getRewards(): { gold: number; exp: number } {
    return {
      gold: this.goldReward,
      exp: this.expReward * this.level
    };
  }
}

/**
 * AI决策结果
 */
export interface AIDecision {
  action: 'attack' | 'defend' | 'heal' | 'buff' | 'debuff' | 'special';
  target: 'single' | 'all' | 'self' | 'ally';
  power?: number;
  element?: any;
}

/**
 * 意图显示信息
 */
export interface IntentDisplayInfo {
  type: IntentType;
  target: 'single' | 'all' | 'self' | 'ally';
  power?: number;
  element?: any;
  icon: string;
  description: string;
}

/**
 * 获取意图图标
 */
function getIntentIcon(type: IntentType): string {
  const icons: Record<IntentType, string> = {
    [IntentType.ATTACK]: '⚔️',
    [IntentType.ATTACK_ALL]: '💥',
    [IntentType.BUFF]: '⬆️',
    [IntentType.DEBUFF]: '⬇️',
    [IntentType.HEAL]: '💚',
    [IntentType.DEFEND]: '🛡️',
    [IntentType.SPECIAL]: '✨'
  };
  return icons[type] ?? '❓';
}

/**
 * 获取意图描述
 */
function getIntentDescription(intent: Intent): string {
  const targetNames: Record<string, string> = {
    single: '单体',
    all: '全体',
    self: '自身',
    ally: '己方'
  };
  
  const typeNames: Record<IntentType, string> = {
    [IntentType.ATTACK]: '攻击',
    [IntentType.ATTACK_ALL]: '全体攻击',
    [IntentType.BUFF]: '强化',
    [IntentType.DEBUFF]: '弱化',
    [IntentType.HEAL]: '治疗',
    [IntentType.DEFEND]: '防御',
    [IntentType.SPECIAL]: '特殊'
  };
  
  const target = targetNames[intent.target] || '目标';
  const type = typeNames[intent.type] || '行动';
  
  if (intent.power) {
    return `${type}${target} (威力${intent.power})`;
  }
  
  return `${type}${target}`;
}

/**
 * 将意图类型映射到AI行动
 */
function mapIntentToAction(type: IntentType): AIDecision['action'] {
  switch (type) {
    case IntentType.ATTACK:
    case IntentType.ATTACK_ALL:
      return 'attack';
    case IntentType.BUFF:
      return 'buff';
    case IntentType.DEBUFF:
      return 'debuff';
    case IntentType.HEAL:
      return 'heal';
    case IntentType.DEFEND:
      return 'defend';
    case IntentType.SPECIAL:
      return 'special';
    default:
      return 'attack';
  }
}
