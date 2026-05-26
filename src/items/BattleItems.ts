/**
 * 循迹之境 - 道具系统
 * 包含芳香剂等战斗道具
 */

import { BattleManager } from '../battle/BattleManager';
import { EnemyUnit } from '../battle/EnemyUnit';
import { IntentType } from '../types';

/**
 * 道具效果
 */
export interface ItemEffect {
  type: 'heal' | 'buff' | 'debuff' | 'scramble_intent' | 'cleanse';
  value?: number;
  target?: 'self' | 'single' | 'all';
}

/**
 * 战斗道具基类
 */
export abstract class BattleItem {
  id: string;
  name: string;
  description: string;
  cooldown: number;       // 冷却回合数
  currentCooldown: number; // 当前冷却
  maxUses: number;       // 最大使用次数
  usesRemaining: number; // 剩余使用次数
  
  constructor(
    id: string,
    name: string,
    description: string,
    cooldown: number = 0,
    maxUses: number = 1
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cooldown = cooldown;
    this.currentCooldown = 0;
    this.maxUses = maxUses;
    this.usesRemaining = maxUses;
  }
  
  /**
   * 检查是否可以使用
   */
  canUse(): boolean {
    return this.currentCooldown <= 0 && this.usesRemaining > 0;
  }
  
  /**
   * 使用道具
   */
  use(battle: BattleManager): ItemUseResult {
    if (!this.canUse()) {
      return {
        success: false,
        message: this.getUnavailableReason()
      };
    }
    
    const result = this.executeEffect(battle);
    
    if (result.success) {
      this.usesRemaining--;
      this.currentCooldown = this.cooldown;
    }
    
    return result;
  }
  
  /**
   * 执行道具效果（子类实现）
   */
  protected abstract executeEffect(battle: BattleManager): ItemUseResult;
  
  /**
   * 获取不可用原因
   */
  protected getUnavailableReason(): string {
    if (this.usesRemaining <= 0) {
      return `${this.name} 已用完`;
    }
    if (this.currentCooldown > 0) {
      return `${this.name} 冷却中 (${this.currentCooldown}回合)`;
    }
    return '无法使用';
  }
  
  /**
   * 回合开始时减少冷却
   */
  onTurnStart(): void {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }
  
  /**
   * 重置冷却
   */
  resetCooldown(): void {
    this.currentCooldown = 0;
  }
  
  /**
   * 重置使用次数
   */
  resetUses(): void {
    this.usesRemaining = this.maxUses;
  }
  
  /**
   * 获取道具信息
   */
  getInfo(): ItemInfo {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      cooldown: this.cooldown,
      currentCooldown: this.currentCooldown,
      maxUses: this.maxUses,
      usesRemaining: this.usesRemaining,
      canUse: this.canUse()
    };
  }
}

/**
 * 道具使用结果
 */
export interface ItemUseResult {
  success: boolean;
  message: string;
  effects?: ItemEffect[];
}

/**
 * 道具信息
 */
export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  maxUses: number;
  usesRemaining: number;
  canUse: boolean;
}

/**
 * 芳香剂道具
 * 效果：随机改变一个敌人的意图类型
 */
export class Aromatherapy extends BattleItem {
  private availableIntents: IntentType[];
  private targetAromaResistance: number;
  
  constructor(
    cooldown: number = 5,
    maxUses: number = 3,
    availableIntents?: IntentType[]
  ) {
    super(
      'aromatherapy',
      '芳香剂',
      `随机改变一个敌人的意图。冷却${cooldown}回合。`,
      cooldown,
      maxUses
    );
    this.availableIntents = availableIntents ?? [
      IntentType.ATTACK,
      IntentType.DEFEND,
      IntentType.BUFF,
      IntentType.HEAL
    ];
    this.targetAromaResistance = 0.5; // 被干扰后抗性增加量
  }
  
  protected executeEffect(battle: BattleManager): ItemUseResult {
    const target = battle.randomEnemy();
    
    if (!target) {
      return {
        success: false,
        message: '没有可作为目标的敌人'
      };
    }
    
    // 随机选择一个新意图
    const newIntentType = this.availableIntents[
      Math.floor(Math.random() * this.availableIntents.length)
    ];
    
    // 改变敌人意图
    target.scrambleIntent([newIntentType]);
    
    // 增加抗性
    target.aromaResistance += this.targetAromaResistance;
    
    return {
      success: true,
      message: `${target.name} 的意图被干扰！`,
      effects: [{
        type: 'scramble_intent',
        target: 'single'
      }]
    };
  }
}

/**
 * 全解药道具
 * 效果：清除己方所有异常状态
 */
export class FullCure extends BattleItem {
  constructor(cooldown: number = 3, maxUses: number = 5) {
    super(
      'full_cure',
      '全解药',
      '清除己方所有异常状态。',
      cooldown,
      maxUses
    );
  }
  
  protected executeEffect(battle: BattleManager): ItemUseResult {
    let cleansedCount = 0;
    
    for (const player of battle.players) {
      if (!player.isDead) {
        const debuffCount = player.debuffs.length;
        player.cleanseDebuffs();
        cleansedCount += debuffCount;
      }
    }
    
    return {
      success: true,
      message: `清除了 ${cleansedCount} 个异常状态`,
      effects: [{
        type: 'cleanse',
        target: 'all'
      }]
    };
  }
}

/**
 * 急救喷雾道具
 * 效果：治疗指定单位
 */
export class HealingSpray extends BattleItem {
  private healAmount: number;
  
  constructor(
    healAmount: number = 30,
    cooldown: number = 2,
    maxUses: number = 5
  ) {
    super(
      'healing_spray',
      '急救喷雾',
      `恢复 ${healAmount} HP。冷却${cooldown}回合。`,
      cooldown,
      maxUses
    );
    this.healAmount = healAmount;
  }
  
  protected executeEffect(battle: BattleManager): ItemUseResult {
    const alivePlayers = battle.getAlivePlayers();
    
    if (alivePlayers.length === 0) {
      return {
        success: false,
        message: '没有可治疗的目标'
      };
    }
    
    let totalHeal = 0;
    
    for (const player of alivePlayers) {
      totalHeal += player.heal(this.healAmount);
    }
    
    return {
      success: true,
      message: `恢复了 ${totalHeal} HP`,
      effects: [{
        type: 'heal',
        value: this.healAmount,
        target: 'all'
      }]
    };
  }
}

/**
 * 道具工厂
 */
export class ItemFactory {
  static create(id: string): BattleItem | null {
    switch (id) {
      case 'aromatherapy':
        return new Aromatherapy();
      case 'full_cure':
        return new FullCure();
      case 'healing_spray':
        return new HealingSpray();
      default:
        return null;
    }
  }
  
  static createAll(): BattleItem[] {
    return [
      new Aromatherapy(),
      new FullCure(),
      new HealingSpray()
    ];
  }
}
