/**
 * 循迹之境 - 龙属性·血脉压制流专属Debuff
 * 基于"龙之气息"层叠系统的Debuff实现
 */

import { DebuffType } from '../../types';
import { Debuff } from './index';

/**
 * 龙息灼烧Debuff：龙属性AOE技能附加的持续伤害
 * 每回合受到15%最大HP伤害，持续2回合
 */
export class DragonBurnDebuff extends Debuff {
  private damagePercent: number = 0.15;  // 每回合15%最大HP伤害
  private damagePerBloodBonus: number = 0.05;  // 每消耗1层龙之气息增加5%

  constructor(duration: number = 2) {
    super('龙息灼烧', DebuffType.DRAGON_BURN, 1, duration);
  }

  /**
   * 回合结束时触发灼烧伤害
   */
  onTurnEnd(unit: any): void {
    const baseDamage = Math.floor(unit.maxHp * this.damagePercent);
    unit.takeDamage(baseDamage, 'dragon_burn');
    this.remainingDuration = Math.max(0, this.remainingDuration - 1);
  }

  /**
   * 获取灼烧伤害百分比
   */
  getDamagePercent(): number {
    return this.damagePercent;
  }

  /**
   * 设置基于龙之气息消耗的额外伤害
   */
  setBloodBonus(consumedBlood: number): void {
    this.damagePercent = 0.15 + (consumedBlood * this.damagePerBloodBonus);
  }

  clone(): DragonBurnDebuff {
    const cloned = new DragonBurnDebuff(this.remainingDuration);
    cloned.damagePercent = this.damagePercent;
    return cloned;
  }
}

/**
 * 龙之终焉混乱Debuff：龙之终焉技能附加的混乱效果
 * 攻击可能失误（50%概率击中自己）
 */
export class DragonConfusionDebuff extends Debuff {
  private selfHitChance: number = 0.5;  // 50%概率自伤

  constructor(duration: number = 2) {
    super('龙之终焉混乱', DebuffType.DRAGON_CONFUSION, 1, duration);
  }

  /**
   * 尝试自伤判定
   * @returns 是否触发自伤
   */
  trySelfHit(): boolean {
    if (Math.random() < this.selfHitChance) {
      return true;
    }
    return false;
  }

  /**
   * 获取自伤概率
   */
  getSelfHitChance(): number {
    return this.selfHitChance;
  }

  /**
   * 设置自伤概率（基于消耗的龙之气息层数）
   */
  setSelfHitChanceFromBlood(bloodConsumed: number): void {
    // 每消耗1层龙之气息，混乱回合+1，自伤概率不变
  }

  clone(): DragonConfusionDebuff {
    const cloned = new DragonConfusionDebuff(this.remainingDuration);
    return cloned;
  }
}

/**
 * 龙之碾压Debuff：龙之碾压技能附加的防御下降效果
 * 防御下降，持续3回合
 */
export class DragonCrushDefDebuff extends Debuff {
  private defensePenalty: number = 2;  // 防御下降2级

  constructor(duration: number = 3) {
    super('龙之碾压', DebuffType.DRAGON_CRUSH_DEF, 1, duration);
  }

  /**
   * 获取防御惩罚等级
   */
  getDefensePenalty(): number {
    return this.defensePenalty;
  }

  clone(): DragonCrushDefDebuff {
    const cloned = new DragonCrushDefDebuff(this.remainingDuration);
    return cloned;
  }
}

/**
 * 龙威震慑Debuff：龙威震慑技能附加的弱化效果
 * 使目标攻击-1级、速度-1级，持续2回合
 */
export class DragonIntimidateDebuff extends Debuff {
  private attackPenalty: number = 1;   // 攻击下降1级
  private speedPenalty: number = 1;      // 速度下降1级
  private isEnhanced: boolean = false;  // 是否为增强版

  constructor(duration: number = 2, isEnhanced: boolean = false) {
    super('龙威震慑', DebuffType.DRAGON_INTIMIDATE, 1, isEnhanced ? duration + 1 : duration);
    this.isEnhanced = isEnhanced;
  }

  /**
   * 获取攻击惩罚等级
   */
  getAttackPenalty(): number {
    return this.isEnhanced ? this.attackPenalty + 1 : this.attackPenalty;
  }

  /**
   * 获取速度惩罚等级
   */
  getSpeedPenalty(): number {
    return this.isEnhanced ? this.speedPenalty + 1 : this.speedPenalty;
  }

  /**
   * 是否为增强版
   */
  isEnhancedDebuff(): boolean {
    return this.isEnhanced;
  }

  clone(): DragonIntimidateDebuff {
    const cloned = new DragonIntimidateDebuff(this.remainingDuration, this.isEnhanced);
    return cloned;
  }
}

/**
 * 流星陨落衰败Debuff：流星陨落技能附加的自我削弱效果
 * 使目标攻击、特攻永久下降（战斗结束），持续整场战斗
 */
export class DragonPowerLossDebuff extends Debuff {
  private attackPenalty: number = 2;   // 攻击下降2级
  private spAttackPenalty: number = 2;   // 特攻下降2级

  constructor() {
    super('流星陨落衰败', DebuffType.DRAGON_POWER_LOSS, 1, 999);  // 永久持续
  }

  /**
   * 获取攻击惩罚等级
   */
  getAttackPenalty(): number {
    return this.attackPenalty;
  }

  /**
   * 获取特攻惩罚等级
   */
  getSpAttackPenalty(): number {
    return this.spAttackPenalty;
  }

  /**
   * 获取所有能力惩罚
   */
  getAllPenalties(): { attack: number; spAttack: number } {
    return {
      attack: this.attackPenalty,
      spAttack: this.spAttackPenalty
    };
  }

  clone(): DragonPowerLossDebuff {
    const cloned = new DragonPowerLossDebuff();
    return cloned;
  }
}

/**
 * 龙之驱逐强制Debuff：龙之驱逐技能的效果状态
 * 记录换人效果的触发
 */
export class DragonExpelDebuff extends Debuff {
  private hasTriggeredSwap: boolean = false;

  constructor() {
    super('龙之驱逐', DebuffType.DRAGON_CONFUSION, 1, 999);  // 使用DRAGON_CONFUSION作为占位
  }

  /**
   * 标记已触发换人效果
   */
  markSwapped(): void {
    this.hasTriggeredSwap = true;
  }

  /**
   * 检查是否已触发换人效果
   */
  hasSwapped(): boolean {
    return this.hasTriggeredSwap;
  }

  clone(): DragonExpelDebuff {
    const cloned = new DragonExpelDebuff();
    cloned.hasTriggeredSwap = this.hasTriggeredSwap;
    return cloned;
  }
}
