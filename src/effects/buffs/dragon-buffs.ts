/**
 * 循迹之境 - 龙属性·血脉压制流专属Buff
 * 基于"龙之气息"层叠系统的核心Buff实现
 */

import { BuffType } from '../../types';
import { Buff } from './index';

/**
 * 龙之气息Buff：龙属性血脉压制流核心机制
 * 层叠型Buff，上限15层
 * 每层提供：15威力加成、10护盾、10%伤害减免
 */
export class DragonBloodBuff extends Buff {
  private maxStacks: number = 15;
  private powerPerStack: number = 15;      // 每层增加15威力
  private shieldPerStack: number = 10;      // 每层增加10护盾
  private reductionPerStack: number = 0.10; // 每层增加10%伤害减免

  constructor(stacks: number = 0, duration: number = 999) {
    super('龙之气息', BuffType.DRAGON_BLOOD, Math.min(stacks, 15), duration);
  }

  /**
   * 获取最大层数
   */
  getMaxStacks(): number {
    return this.maxStacks;
  }

  /**
   * 添加龙之气息层数
   */
  addStacks(amount: number = 1): boolean {
    if (this.stacks < this.maxStacks) {
      this.stacks = Math.min(this.stacks + amount, this.maxStacks);
      return true;
    }
    return false;
  }

  /**
   * 消耗指定层数的龙之气息
   * @returns 实际消耗的层数
   */
  consumeStacks(amount: number): number {
    const consumed = Math.min(this.stacks, amount);
    this.stacks -= consumed;
    return consumed;
  }

  /**
   * 消耗所有龙之气息层数
   * @returns 消耗前的层数
   */
  consumeAll(): number {
    const consumed = this.stacks;
    this.stacks = 0;
    return consumed;
  }

  /**
   * 获取层数
   */
  getStacks(): number {
    return this.stacks;
  }

  /**
   * 获取威力加成（每层15威力）
   */
  getPowerBonus(): number {
    return this.stacks * this.powerPerStack;
  }

  /**
   * 获取护盾值（每层10点）
   */
  getShieldValue(): number {
    return this.stacks * this.shieldPerStack;
  }

  /**
   * 获取伤害减免比例（每层10%）
   */
  getDamageReduction(): number {
    return Math.min(this.stacks * this.reductionPerStack, 0.75); // 最高75%减免
  }

  /**
   * 获取所有加成效果
   */
  getAllBonuses(): { damage: number; shield: number; damageReduction: number } {
    return {
      damage: this.getPowerBonus(),
      shield: this.getShieldValue(),
      damageReduction: this.getDamageReduction()
    };
  }

  clone(): DragonBloodBuff {
    const cloned = new DragonBloodBuff(this.stacks, this.remainingDuration);
    return cloned;
  }
}

/**
 * 龙属共鸣Buff：增强龙系技能效果
 * 当场上有其他龙属性友方单位时激活
 */
export class DragonResonanceBuff extends Buff {
  private damageBonusPerStack: number = 0.10;  // 每层龙之气息增加10%伤害
  private shieldBonusPerStack: number = 5;      // 每层龙之气息增加5点护盾
  private dragonAllyBonus: number = 0.15;        // 每只龙属性队友增加15%效果
  private dragonAllyCount: number = 0;          // 当前龙属性队友数量

  constructor(duration: number = 999, dragonAllyCount: number = 0) {
    super('龙属共鸣', BuffType.DRAGON_BLOOD_RESONANCE, 1, duration);
    this.dragonAllyCount = dragonAllyCount;
  }

  /**
   * 获取伤害加成（龙之气息层数 + 龙属性队友）
   */
  getDamageBonus(dragonBloodStacks: number): number {
    const bloodBonus = dragonBloodStacks * this.damageBonusPerStack;
    const allyBonus = this.dragonAllyCount * this.dragonAllyBonus;
    return 1 + bloodBonus + allyBonus;
  }

  /**
   * 获取护盾加成
   */
  getShieldBonus(dragonBloodStacks: number): number {
    return dragonBloodStacks * this.shieldBonusPerStack;
  }

  /**
   * 获取龙属性队友数量
   */
  getDragonAllyCount(): number {
    return this.dragonAllyCount;
  }

  /**
   * 设置龙属性队友数量
   */
  setDragonAllyCount(count: number): void {
    this.dragonAllyCount = count;
  }

  /**
   * 检查是否满足龙属共鸣条件（至少1只龙属性队友）
   */
  isResonanceActive(): boolean {
    return this.dragonAllyCount > 0;
  }

  clone(): DragonResonanceBuff {
    const cloned = new DragonResonanceBuff(this.remainingDuration, this.dragonAllyCount);
    return cloned;
  }
}

/**
 * 龙鳞守护Buff：减伤+护盾+反击
 * 本回合受到的所有伤害降低75%，并获得基于龙之气息层数的护盾
 */
export class DragonGuardBuff extends Buff {
  private damageReduction: number = 0.75;  // 75%减伤
  private shieldPerBlood: number = 15;     // 每层龙之气息增加15点护盾
  private counterDamage: number = 30;       // 反击伤害
  private hasCounterTriggered: boolean = false;

  constructor(duration: number = 1) {
    super('龙鳞守护', BuffType.DRAGON_GUARD, 1, duration);
  }

  /**
   * 获取伤害减免比例
   */
  getDamageReduction(): number {
    return this.damageReduction;
  }

  /**
   * 获取基于龙之气息层数的护盾值
   */
  getShieldValue(dragonBloodStacks: number): number {
    return dragonBloodStacks * this.shieldPerBlood;
  }

  /**
   * 获取反击伤害
   */
  getCounterDamage(): number {
    return this.counterDamage;
  }

  /**
   * 触发反击
   */
  triggerCounter(): number {
    if (!this.hasCounterTriggered) {
      this.hasCounterTriggered = true;
      return this.counterDamage;
    }
    return 0;
  }

  /**
   * 检查反击是否已触发
   */
  isCounterTriggered(): boolean {
    return this.hasCounterTriggered;
  }

  /**
   * 回合结束时重置反击状态
   */
  onTurnEnd(_unit: any): void {
    this.hasCounterTriggered = false;
  }

  clone(): DragonGuardBuff {
    const cloned = new DragonGuardBuff(this.remainingDuration);
    cloned.hasCounterTriggered = this.hasCounterTriggered;
    return cloned;
  }
}

/**
 * 龙鳞反击Buff：反弹伤害
 * 护盾存在期间，若受到攻击，反击伤害
 */
export class DragonCounterBuff extends Buff {
  private baseDamage: number = 30;          // 基础反击伤害
  private bonusPerBlood: number = 10;       // 每层龙之气息增加10点伤害

  constructor(duration: number = 1) {
    super('龙鳞反击', BuffType.DRAGON_COUNTER, 1, duration);
  }

  /**
   * 获取反击伤害
   */
  getCounterDamage(dragonBloodStacks: number = 0): number {
    return this.baseDamage + (dragonBloodStacks * this.bonusPerBlood);
  }

  clone(): DragonCounterBuff {
    const cloned = new DragonCounterBuff(this.remainingDuration);
    return cloned;
  }
}

/**
 * 龙威Buff：全体敌人debuff
 * 使敌人攻击下降1级、速度下降1级
 */
export class DragonAuraBuff extends Buff {
  private attackPenalty: number = 1;    // 攻击下降1级
  private speedPenalty: number = 1;       // 速度下降1级
  private isEnhanced: boolean = false;  // 是否为增强版（龙属共鸣触发）

  constructor(duration: number = 2, isEnhanced: boolean = false) {
    const enhancedDuration = 3;
    super('龙威', BuffType.DRAGON_AURA_BUFF, 1, isEnhanced ? enhancedDuration : duration);
    this.isEnhanced = isEnhanced;
    if (isEnhanced) {
      this.remainingDuration = enhancedDuration;
    }
  }

  /**
   * 获取攻击惩罚
   */
  getAttackPenalty(): number {
    return this.isEnhanced ? this.attackPenalty + 1 : this.attackPenalty;
  }

  /**
   * 获取速度惩罚
   */
  getSpeedPenalty(): number {
    return this.isEnhanced ? this.speedPenalty + 1 : this.speedPenalty;
  }

  /**
   * 是否为增强版
   */
  isEnhancedAura(): boolean {
    return this.isEnhanced;
  }

  /**
   * 升级为增强版
   */
  enhance(): void {
    this.isEnhanced = true;
    this.remainingDuration = 3;  // 增强版持续时间
  }

  clone(): DragonAuraBuff {
    const cloned = new DragonAuraBuff(this.remainingDuration, this.isEnhanced);
    return cloned;
  }
}

/**
 * 龙魂觉醒Buff：免疫控制+反弹伤害
 * 持续期间免疫所有控制效果，并反弹部分伤害
 */
export class DragonAwakeningBuff extends Buff {
  private damageReflection: number = 0.50;  // 反弹50%伤害
  private controlImmune: boolean = true;   // 免疫控制效果

  constructor(duration: number = 2) {
    super('龙魂觉醒', BuffType.DRAGON_BLOOD_RESONANCE, 1, duration);
  }

  /**
   * 获取伤害反弹比例
   */
  getDamageReflection(): number {
    return this.damageReflection;
  }

  /**
   * 计算反弹伤害
   */
  calculateReflectedDamage(damage: number): number {
    return Math.floor(damage * this.damageReflection);
  }

  /**
   * 是否免疫控制效果
   */
  isControlImmune(): boolean {
    return this.controlImmune;
  }

  clone(): DragonAwakeningBuff {
    const cloned = new DragonAwakeningBuff(this.remainingDuration);
    return cloned;
  }
}
