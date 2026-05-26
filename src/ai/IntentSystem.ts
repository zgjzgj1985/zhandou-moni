/**
 * 循迹之境 - 意图系统
 * 敌人AI决策和意图可视化
 */

import { Intent, IntentType, ElementType } from '../types';
import { EnemyUnit, AIDifficulty } from '../battle/EnemyUnit';

/**
 * 意图生成配置
 */
export interface IntentGeneratorConfig {
  type: IntentType;
  weight: number;
  minHpPercent?: number;
  maxHpPercent?: number;
}

/**
 * 敌人意图生成器
 */
export class IntentGenerator {
  private enemy: EnemyUnit;
  private intentPool: IntentGeneratorConfig[];
  
  constructor(enemy: EnemyUnit) {
    this.enemy = enemy;
    this.intentPool = this.buildIntentPool();
  }
  
  /**
   * 构建意图池
   */
  private buildIntentPool(): IntentGeneratorConfig[] {
    const basePool: IntentGeneratorConfig[] = [
      { type: IntentType.ATTACK, weight: 60, maxHpPercent: 1 },
      { type: IntentType.ATTACK, weight: 40, minHpPercent: 0, maxHpPercent: 1 },
      { type: IntentType.ATTACK_ALL, weight: 20 },
      { type: IntentType.BUFF, weight: 15 },
      { type: IntentType.DEFEND, weight: 15 },
      { type: IntentType.HEAL, weight: 10, maxHpPercent: 0.6 },
    ];
    
    // 根据敌人类型调整权重
    if (this.enemy.aiStrategy === AIDifficulty.BOSS) {
      // BOSS更倾向于使用特殊攻击
      return [
        { type: IntentType.ATTACK, weight: 40 },
        { type: IntentType.ATTACK_ALL, weight: 25 },
        { type: IntentType.BUFF, weight: 15 },
        { type: IntentType.DEFEND, weight: 10 },
        { type: IntentType.HEAL, weight: 10, maxHpPercent: 0.5 },
      ];
    }
    
    return basePool;
  }
  
  /**
   * 生成意图
   */
  generate(): Intent {
    const hpPercent = this.enemy.getHpPercent();
    
    // 过滤符合HP条件的意图
    const validIntents = this.intentPool.filter(intent => {
      if (intent.minHpPercent !== undefined && hpPercent < intent.minHpPercent) {
        return false;
      }
      if (intent.maxHpPercent !== undefined && hpPercent > intent.maxHpPercent) {
        return false;
      }
      return true;
    });
    
    // 按权重随机选择
    const totalWeight = validIntents.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const intentConfig of validIntents) {
      random -= intentConfig.weight;
      if (random <= 0) {
        return this.createIntent(intentConfig.type);
      }
    }
    
    // 默认返回攻击
    return this.createIntent(IntentType.ATTACK);
  }
  
  /**
   * 创建具体意图
   */
  private createIntent(type: IntentType): Intent {
    const basePower = this.calculateBasePower(type);
    
    return {
      type,
      target: this.getTargetType(type),
      power: basePower,
      element: this.getElement()
    };
  }
  
  /**
   * 计算基础威力
   */
  private calculateBasePower(type: IntentType): number {
    const level = this.enemy.level;
    
    switch (type) {
      case IntentType.ATTACK:
        return Math.floor(8 + level * 2 + Math.random() * 5);
      case IntentType.ATTACK_ALL:
        return Math.floor(6 + level * 1.5 + Math.random() * 3);
      case IntentType.HEAL:
        return Math.floor(this.enemy.maxHp * 0.25);
      default:
        return 0;
    }
  }
  
  /**
   * 获取目标类型
   */
  private getTargetType(type: IntentType): 'single' | 'all' | 'self' | 'ally' {
    switch (type) {
      case IntentType.ATTACK:
        return 'single';
      case IntentType.ATTACK_ALL:
        return 'all';
      case IntentType.HEAL:
      case IntentType.DEFEND:
      case IntentType.BUFF:
        return 'self';
      case IntentType.DEBUFF:
        return 'single';
      default:
        return 'single';
    }
  }
  
  /**
   * 获取元素属性
   */
  private getElement(): ElementType | undefined {
    if (this.enemy.elements.length > 0) {
      return this.enemy.elements[0];
    }
    return undefined;
  }
}

/**
 * 意图显示管理器
 */
export class IntentDisplayManager {
  /**
   * 获取意图的显示图标
   */
  static getIcon(type: IntentType): string {
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
   * 获取意图的颜色
   */
  static getColor(type: IntentType): string {
    const colors: Record<IntentType, string> = {
      [IntentType.ATTACK]: '#ff4444',
      [IntentType.ATTACK_ALL]: '#ff6666',
      [IntentType.BUFF]: '#44ff44',
      [IntentType.DEBUFF]: '#ff44ff',
      [IntentType.HEAL]: '#44ff88',
      [IntentType.DEFEND]: '#4488ff',
      [IntentType.SPECIAL]: '#ffaa44'
    };
    return colors[type] ?? '#888888';
  }
  
  /**
   * 获取意图的描述文本
   */
  static getDescription(intent: Intent): string {
    const typeNames: Record<IntentType, string> = {
      [IntentType.ATTACK]: '攻击',
      [IntentType.ATTACK_ALL]: '全体攻击',
      [IntentType.BUFF]: '强化',
      [IntentType.DEBUFF]: '弱化',
      [IntentType.HEAL]: '治疗',
      [IntentType.DEFEND]: '防御',
      [IntentType.SPECIAL]: '特殊'
    };
    
    const targetNames: Record<string, string> = {
      single: '单体',
      all: '全体',
      self: '自身',
      ally: '己方'
    };
    
    const typeName = typeNames[intent.type] || '行动';
    const targetName = targetNames[intent.target] || '';
    
    let desc = `${typeName}`;
    if (intent.target !== 'self') {
      desc += ` ${targetName}`;
    }
    
    if (intent.power && (intent.type === IntentType.ATTACK || intent.type === IntentType.ATTACK_ALL)) {
      desc += ` (威力${intent.power})`;
    }
    
    return desc;
  }
  
  /**
   * 生成意图预览数据
   */
  static createPreview(intent: Intent): IntentPreview {
    return {
      icon: this.getIcon(intent.type),
      color: this.getColor(intent.type),
      description: this.getDescription(intent),
      power: intent.power,
      target: intent.target
    };
  }
}

/**
 * 意图预览数据
 */
export interface IntentPreview {
  icon: string;
  color: string;
  description: string;
  power?: number;
  target: string;
}

/**
 * 敌人AI决策器
 */
export class EnemyAIController {
  /**
   * 更新所有存活敌人的意图
   */
  static updateAllIntents(enemies: EnemyUnit[]): void {
    for (const enemy of enemies) {
      if (!enemy.isDead) {
        const generator = new IntentGenerator(enemy);
        enemy.setIntent(generator.generate());
      }
    }
  }
  
  /**
   * 干扰敌人意图（芳香剂效果）
   */
  static scrambleEnemyIntent(
    enemy: EnemyUnit,
    availableIntents: IntentType[] = [
      IntentType.ATTACK,
      IntentType.DEFEND,
      IntentType.BUFF,
      IntentType.HEAL
    ]
  ): void {
    enemy.scrambleIntent(availableIntents);
  }
  
  /**
   * 根据AI难度调整敌人行动
   */
  static adjustActionForDifficulty(
    enemy: EnemyUnit,
    basePower: number
  ): number {
    switch (enemy.aiStrategy) {
      case AIDifficulty.EASY:
        return Math.floor(basePower * 0.8);
      case AIDifficulty.HARD:
        return Math.floor(basePower * 1.1);
      case AIDifficulty.ELITE:
        return Math.floor(basePower * 1.2);
      case AIDifficulty.BOSS:
        return Math.floor(basePower * 1.15);
      default:
        return basePower;
    }
  }
}
