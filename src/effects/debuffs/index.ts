/**
 * 循迹之境 - Debuff/DOT系统实现
 * 以太术士风格
 */

import { DebuffType } from '../types';

/**
 * 前向引用CombatUnit（避免循环依赖）
 */
export type DebuffCombatUnit = {
  takeDamage(amount: number, type?: string): number;
};

/**
 * Debuff基类
 */
export abstract class Debuff {
  id: string;
  name: string;
  type: DebuffType;
  stacks: number;
  duration: number;
  remainingDuration: number;
  canBeCleansed: boolean;

  constructor(name: string, type: DebuffType, stacks: number = 1, duration: number = 3) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.type = type;
    this.stacks = stacks;
    this.duration = duration;
    this.remainingDuration = duration;
    this.canBeCleansed = true;
  }

  onTurnStart(_unit: DebuffCombatUnit): void {}
  onTurnEnd(_unit: DebuffCombatUnit): void {}
  onDamaged(_unit: DebuffCombatUnit, _damage: number): void {}

  isExpired(): boolean {
    return this.remainingDuration <= 0;
  }

  abstract clone(): Debuff;
}

/**
 * 中毒DOT：以太术士风格
 * 回合开始时，伤害=层数×每层伤害，然后层数-1
 */
export class PoisonDebuff extends Debuff {
  damagePerStack: number;
  
  constructor(stacks: number = 1, duration: number = 4, damagePerStack: number = 1) {
    super('中毒', DebuffType.POISON, stacks, duration);
    this.damagePerStack = damagePerStack;
  }
  
  onTurnStart(unit: DebuffCombatUnit): void {
    const damage = this.stacks * this.damagePerStack;
    unit.takeDamage(damage, 'poison');
    this.stacks = Math.max(0, this.stacks - 1);
    this.remainingDuration = Math.max(0, this.remainingDuration - 1);
  }
  
  clone(): PoisonDebuff {
    return new PoisonDebuff(this.stacks, this.duration, this.damagePerStack);
  }
}

/**
 * 灼烧DOT：以太术士风格
 * 使用技能时被触发，伤害=层数×每层伤害，层数不变
 */
export class BurnDebuff extends Debuff {
  damagePerStack: number;
  
  constructor(stacks: number = 1, duration: number = 3, damagePerStack: number = 1) {
    super('灼烧', DebuffType.BURN, stacks, duration);
    this.damagePerStack = damagePerStack;
  }
  
  onUseAction(unit: DebuffCombatUnit): void {
    const damage = this.stacks * this.damagePerStack;
    unit.takeDamage(damage, 'burn');
  }
  
  clone(): BurnDebuff {
    return new BurnDebuff(this.stacks, this.duration, this.damagePerStack);
  }
}

/**
 * 流血DOT：以太术士风格
 * 回合开始时，伤害=层数×每层伤害，然后层数÷2(向下取整)
 */
export class BleedDebuff extends Debuff {
  damagePerStack: number;
  
  constructor(stacks: number = 1, duration: number = 3, damagePerStack: number = 2) {
    super('流血', DebuffType.BLEED, stacks, duration);
    this.damagePerStack = damagePerStack;
  }
  
  onTurnStart(unit: DebuffCombatUnit): void {
    const damage = this.stacks * this.damagePerStack;
    unit.takeDamage(damage, 'bleed');
    this.stacks = Math.floor(this.stacks / 2);
    this.remainingDuration = Math.max(0, this.remainingDuration - 1);
  }
  
  clone(): BleedDebuff {
    return new BleedDebuff(this.stacks, this.duration, this.damagePerStack);
  }
}

/**
 * 虚弱debuff：以太术士风格
 * 每次命中-3基础伤害(最低1)，每命中一层
 */
export class WeaknessDebuff extends Debuff {
  reductionPerHit: number;
  
  constructor(stacks: number = 1, duration: number = 3, reductionPerHit: number = 3) {
    super('虚弱', DebuffType.WEAKNESS, stacks, duration);
    this.reductionPerHit = reductionPerHit;
  }
  
  applyDamageReduction(baseDamage: number, hitsConsumed: number = 1): number {
    const reduction = Math.min(this.stacks * this.reductionPerHit * hitsConsumed, baseDamage - 1);
    return Math.max(1, baseDamage - reduction);
  }
  
  consumeHits(hitsConsumed: number): void {
    this.stacks = Math.max(0, this.stacks - hitsConsumed);
    if (this.stacks <= 0) {
      this.remainingDuration = 0;
    }
  }
  
  clone(): WeaknessDebuff {
    return new WeaknessDebuff(this.stacks, this.duration, this.reductionPerHit);
  }
}

/**
 * 恐惧debuff：以太术士风格
 * 第一击伤害+1每层，然后消耗一半层数(向上取整)
 */
export class TerrorDebuff extends Debuff {
  bonusDamagePerStack: number;
  
  constructor(stacks: number = 1, duration: number = 2, bonusDamagePerStack: number = 1) {
    super('恐惧', DebuffType.TERROR, stacks, duration);
    this.bonusDamagePerStack = bonusDamagePerStack;
  }
  
  onFirstHit(damage: number): { finalDamage: number; isWild: boolean } {
    const bonusDamage = this.stacks * this.bonusDamagePerStack;
    const finalDamage = damage + bonusDamage;
    this.stacks = Math.max(0, this.stacks - Math.ceil(this.stacks / 2));
    if (this.stacks <= 0) {
      this.remainingDuration = 0;
    }
    return { finalDamage, isWild: true };
  }
  
  clone(): TerrorDebuff {
    return new TerrorDebuff(this.stacks, this.duration, this.bonusDamagePerStack);
  }
}

/**
 * 麻痹debuff
 * 每回合25%概率无法行动
 */
export class ParalysisDebuff extends Debuff {
  actionBlockChance: number = 0.25;
  
  constructor(duration: number = 3) {
    super('麻痹', DebuffType.PARALYSIS, 1, duration);
  }
  
  tryBlockAction(): boolean {
    return Math.random() < this.actionBlockChance;
  }
  
  clone(): ParalysisDebuff {
    const cloned = new ParalysisDebuff(this.remainingDuration);
    return cloned;
  }
}

/**
 * 睡眠debuff
 * 完全无法行动，受伤时有概率醒来
 */
export class SleepDebuff extends Debuff {
  minDuration: number;
  maxDuration: number;
  
  constructor(minDuration: number = 1, maxDuration: number = 3) {
    const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
    super('睡眠', DebuffType.SLEEP, 1, duration);
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
  }
  
  tryWakeOnDamage(): boolean {
    return Math.random() < 0.5;
  }
  
  wake(): void {
    this.remainingDuration = 0;
    this.stacks = 0;
  }
  
  clone(): SleepDebuff {
    const cloned = new SleepDebuff(this.minDuration, this.maxDuration);
    cloned.remainingDuration = this.remainingDuration;
    cloned.stacks = this.stacks;
    return cloned;
  }
}

/**
 * 冰冻debuff
 * 完全无法行动，每回合25%概率解冻
 */
export class FreezeDebuff extends Debuff {
  thawChance: number = 0.25;
  
  constructor() {
    super('冰冻', DebuffType.FREEZE, 1, 999);
  }
  
  tryThaw(): boolean {
    if (Math.random() < this.thawChance) {
      this.remainingDuration = 0;
      this.stacks = 0;
      return true;
    }
    return false;
  }
  
  forceThaw(): void {
    this.remainingDuration = 0;
    this.stacks = 0;
  }
  
  clone(): FreezeDebuff {
    return new FreezeDebuff();
  }
}

/**
 * 混乱debuff
 * 有概率执行自伤或随机行动
 */
export class ConfusionDebuff extends Debuff {
  selfHitChance: number;
  
  constructor(duration: number = 2, selfHitChance: number = 0.5) {
    super('混乱', DebuffType.CONFUSION, 1, duration);
    this.selfHitChance = selfHitChance;
  }
  
  trySelfHit(): boolean {
    return Math.random() < this.selfHitChance;
  }
  
  clone(): ConfusionDebuff {
    return new ConfusionDebuff(this.remainingDuration, this.selfHitChance);
  }
}

/**
 * 束缚debuff
 * 无法切换，受到持续伤害
 */
export class BindDebuff extends Debuff {
  damagePerTurn: number;
  
  constructor(duration: number = 4, damagePerTurn: number = 8) {
    super('束缚', DebuffType.BIND, 1, duration);
    this.damagePerTurn = damagePerTurn;
  }
  
  onTurnStart(unit: DebuffCombatUnit): void {
    unit.takeDamage(this.damagePerTurn, 'bind');
  }
  
  clone(): BindDebuff {
    return new BindDebuff(this.remainingDuration, this.damagePerTurn);
  }
}

/**
 * Debuff工厂函数
 */
export function createDebuff(
  type: DebuffType,
  stacks: number = 1,
  duration: number = 3
): Debuff {
  switch (type) {
    case DebuffType.POISON:
      return new PoisonDebuff(stacks, duration);
    case DebuffType.BURN:
      return new BurnDebuff(stacks, duration);
    case DebuffType.BLEED:
      return new BleedDebuff(stacks, duration);
    case DebuffType.WEAKNESS:
      return new WeaknessDebuff(stacks, duration);
    case DebuffType.TERROR:
      return new TerrorDebuff(stacks, duration);
    case DebuffType.PARALYSIS:
      return new ParalysisDebuff(duration);
    case DebuffType.SLEEP:
      return new SleepDebuff(1, 3);
    case DebuffType.FREEZE:
      return new FreezeDebuff();
    case DebuffType.CONFUSION:
      return new ConfusionDebuff(duration);
    case DebuffType.BIND:
      return new BindDebuff(duration);
    default:
      throw new Error(`Unknown DebuffType: ${type}`);
  }
}
