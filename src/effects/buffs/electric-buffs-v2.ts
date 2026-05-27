/**
 * 循迹之境 - 电属性·电磁脉冲流Buff
 * 
 * 核心机制：电荷积累→脉冲爆发的节奏感
 * 电荷上限：5层
 * 
 * Buff类：
 * - ChargeBuff：电荷（核心资源）
 * - OverloadBuff：超载（连锁效果）
 * - ChargingBuff：充能状态（额外+1电荷/次）
 * - ElectricFieldBuff：电场（全队加速）
 * - StaticBodyBuff：蓄电护体（减伤+反伤）
 * - ElectricDeflectBuff：电磁偏转（闪避+反击）
 */

import { Buff } from './index';
import { BuffType } from '../../types';
import type { BuffCombatUnit } from './index';

/**
 * ==================== 电荷系统 ====================
 */

/**
 * 电荷buff：电属性电磁脉冲流核心资源
 * 积累层数，提升技能威力，5层触发临界
 */
export class ChargeBuff extends Buff {
  static readonly MAX_CHARGE: number = 5;
  
  private chargeStacks: number;

  constructor(initialCharge: number = 0) {
    super('电荷', BuffType.CHARGE, 1, 999);
    this.chargeStacks = Math.min(initialCharge, ChargeBuff.MAX_CHARGE);
  }

  /**
   * 积累电荷
   */
  gainCharge(amount: number = 1): void {
    this.chargeStacks = Math.min(this.chargeStacks + amount, ChargeBuff.MAX_CHARGE);
  }

  /**
   * 消耗电荷（用于电磁脉冲）
   */
  consumeCharge(): number {
    const consumed = this.chargeStacks;
    this.chargeStacks = 0;
    return consumed;
  }

  /**
   * 获取当前电荷层数
   */
  getChargeStacks(): number {
    return this.chargeStacks;
  }

  /**
   * 获取电荷上限
   */
  getMaxCharge(): number {
    return ChargeBuff.MAX_CHARGE;
  }

  /**
   * 是否处于临界状态（5层）
   */
  isCritical(): boolean {
    return this.chargeStacks >= ChargeBuff.MAX_CHARGE;
  }

  /**
   * 获取威力加成倍率
   * 0层+0%, 1层+10%, 2层+20%, 3层+35%, 4层+50%, 5层+70%
   */
  getPowerMultiplier(): number {
    const multipliers: Record<number, number> = {
      0: 0,
      1: 0.1,
      2: 0.2,
      3: 0.35,
      4: 0.5,
      5: 0.7
    };
    return multipliers[this.chargeStacks] || 0;
  }

  clone(): ChargeBuff {
    const cloned = new ChargeBuff(this.chargeStacks);
    return cloned;
  }
}

/**
 * 超载buff：下一次攻击附带连锁效果
 * 触发条件：电荷达到4层
 */
export class OverloadBuff extends Buff {
  private chainTargets: number;

  constructor(duration: number = 2, chainTargets: number = 1) {
    super('超载', BuffType.OVERLOAD, 1, duration);
    this.chainTargets = chainTargets;
  }

  /**
   * 获取连锁目标数量
   */
  getChainTargets(): number {
    return this.chainTargets;
  }

  /**
   * 是否处于超载状态
   */
  isOverloaded(): boolean {
    return this.remainingDuration > 0;
  }

  clone(): OverloadBuff {
    return new OverloadBuff(this.remainingDuration, this.chainTargets);
  }
}

/**
 * 充能状态buff：每次攻击时额外获得1层电荷
 * 触发条件：使用充能加速技能
 */
export class ChargingBuff extends Buff {
  private extraChargePerAttack: number;

  constructor(duration: number = 2, extraChargePerAttack: number = 1) {
    super('充能', BuffType.CHARGING, 1, duration);
    this.extraChargePerAttack = extraChargePerAttack;
  }

  /**
   * 获取每次攻击额外获得的电荷数
   */
  getExtraCharge(): number {
    return this.extraChargePerAttack;
  }

  /**
   * 是否处于充能状态
   */
  isCharging(): boolean {
    return this.remainingDuration > 0;
  }

  clone(): ChargingBuff {
    return new ChargingBuff(this.remainingDuration, this.extraChargePerAttack);
  }
}

/**
 * 电场buff：全队电荷加速+威力加成
 * 触发条件：使用电场展开技能
 */
export class ElectricFieldBuff extends Buff {
  private damageBonus: number;
  private extraChargePerAttack: number;

  constructor(duration: number = 2, damageBonus: number = 0.15, extraChargePerAttack: number = 1) {
    super('电场', BuffType.ELECTRIC_FIELD_BUFF, 1, duration);
    this.damageBonus = damageBonus;
    this.extraChargePerAttack = extraChargePerAttack;
  }

  /**
   * 获取电属性技能威力加成
   */
  getDamageBonus(): number {
    return this.damageBonus;
  }

  /**
   * 获取每次攻击额外获得的电荷数
   */
  getExtraCharge(): number {
    return this.extraChargePerAttack;
  }

  /**
   * 获取电场描述
   */
  getDescription(): string {
    return `电属性技能威力+${Math.round(this.damageBonus * 100)}%，每次攻击额外+${this.extraChargePerAttack}层电荷`;
  }

  clone(): ElectricFieldBuff {
    return new ElectricFieldBuff(this.remainingDuration, this.damageBonus, this.extraChargePerAttack);
  }
}

/**
 * ==================== 防御类Buff ====================
 */

/**
 * 蓄电护体buff：减伤50%+静电反伤
 * 触发条件：使用蓄电护体技能
 */
export class StaticBodyBuff extends Buff {
  private damageReduction: number;
  private staticChargePower: number;
  private staticBuildup: number;

  constructor(duration: number = 1, damageReduction: number = 0.5, staticChargePower: number = 40) {
    super('蓄电护体', BuffType.STATIC_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.staticChargePower = staticChargePower;
    this.staticBuildup = 0;
  }

  /**
   * 受到伤害时积累静电
   */
  onDamaged(_unit: BuffCombatUnit, damage: number): void {
    this.staticBuildup += Math.floor(damage / 10);
  }

  /**
   * 获取减伤比例
   */
  getDamageReduction(): number {
    return this.damageReduction;
  }

  /**
   * 获取蓄积的静电伤害
   */
  getStaticBuildup(): number {
    return this.staticBuildup;
  }

  /**
   * 消耗静电伤害
   */
  consumeStatic(): number {
    const damage = this.staticBuildup + this.staticChargePower;
    this.staticBuildup = 0;
    return damage;
  }

  /**
   * 获取蓄电护体描述
   */
  getDescription(): string {
    return `减伤${Math.round(this.damageReduction * 100)}%，受伤时积累静电，下次攻击+${this.staticChargePower + this.staticBuildup}威力`;
  }

  clone(): StaticBodyBuff {
    const cloned = new StaticBodyBuff(this.remainingDuration, this.damageReduction, this.staticChargePower);
    cloned.staticBuildup = this.staticBuildup;
    return cloned;
  }
}

/**
 * 电磁偏转buff：70%闪避+反击伤害
 * 触发条件：使用电磁偏转技能
 */
export class ElectricDeflectBuff extends Buff {
  private dodgeChance: number;
  private counterDamage: number;
  private counterDamagePercent: number;
  private uses: number;

  constructor(duration: number = 2, dodgeChance: number = 0.7, counterDamage: number = 40, counterDamagePercent: number = 0.5) {
    super('电磁偏转', BuffType.ELECTRIC_DEFLECT, 1, duration);
    this.dodgeChance = dodgeChance;
    this.counterDamage = counterDamage;
    this.counterDamagePercent = counterDamagePercent;
    this.uses = 1;
  }

  /**
   * 尝试闪避
   */
  tryDodge(): boolean {
    if (this.uses > 0 && Math.random() < this.dodgeChance) {
      this.uses--;
      return true;
    }
    return false;
  }

  /**
   * 获取反击伤害
   */
  getCounterDamage(baseDamage: number): number {
    return this.counterDamage + Math.floor(baseDamage * this.counterDamagePercent);
  }

  /**
   * 获取闪避概率
   */
  getDodgeChance(): number {
    return this.dodgeChance;
  }

  /**
   * 是否还有使用次数
   */
  hasUses(): boolean {
    return this.uses > 0;
  }

  /**
   * 获取剩余使用次数
   */
  getRemainingUses(): number {
    return this.uses;
  }

  /**
   * 获取电磁偏转描述
   */
  getDescription(): string {
    return `${Math.round(this.dodgeChance * 100)}%闪避并反击${this.counterDamage}威力+${Math.round(this.counterDamagePercent * 100)}%伤害`;
  }

  clone(): ElectricDeflectBuff {
    const cloned = new ElectricDeflectBuff(this.remainingDuration, this.dodgeChance, this.counterDamage, this.counterDamagePercent);
    cloned.uses = this.uses;
    return cloned;
  }
}
