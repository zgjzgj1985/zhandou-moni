/**
 * 循迹之境 - Debuff/DOT系统实现
 * 以太术士风格
 */

import { DebuffType } from '../../types';

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
 * 每回合开始时触发，伤害=层数×每层伤害，然后层数-1
 */
export class BurnDebuff extends Debuff {
  damagePerStack: number;

  constructor(stacks: number = 1, duration: number = 3, damagePerStack: number = 1) {
    super('灼烧', DebuffType.BURN, stacks, duration);
    this.damagePerStack = damagePerStack;
  }

  onTurnStart(unit: DebuffCombatUnit): void {
    const damage = this.stacks * this.damagePerStack;
    unit.takeDamage(damage, 'burn');
    this.stacks = Math.max(0, this.stacks - 1);
    this.remainingDuration = Math.max(0, this.remainingDuration - 1);
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
  thawChance: number = 0.2;  // 设计文档要求20%解冻概率
  
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

// ==================== 冰属性·减速流专用Debuff ====================

/**
 * 减速debuff：冰属性减速流
 * 速度降低，效果持续期间影响行动顺序
 */
export class SlowDebuff extends Debuff {
  speedStages: number;

  constructor(stages: number = 1, duration: number = 2) {
    super('减速', DebuffType.SLOW, 1, duration);
    this.speedStages = stages;
  }

  getSpeedStages(): number {
    return this.speedStages;
  }

  clone(): SlowDebuff {
    return new SlowDebuff(this.speedStages, this.remainingDuration);
  }
}

/**
 * 冰封禁制debuff：冰属性减速流
 * 限制目标使用能量≥3的技能
 */
export class IceSealDebuff extends Debuff {
  energyThreshold: number;

  constructor(duration: number = 2, energyThreshold: number = 3) {
    super('冰封禁制', DebuffType.ICE_SEAL, 1, duration);
    this.energyThreshold = energyThreshold;
  }

  canUseSkill(energyCost: number): boolean {
    return energyCost < this.energyThreshold;
  }

  clone(): IceSealDebuff {
    return new IceSealDebuff(this.remainingDuration, this.energyThreshold);
  }
}

/**
 * 冰冻DOT debuff：冰属性减速流
 * 每回合受到20点冰系伤害
 */
export class IceDotDebuff extends Debuff {
  damagePerTurn: number;

  constructor(duration: number = 3, damagePerTurn: number = 20) {
    super('冰冻伤害', DebuffType.ICE_DOT, 1, duration);
    this.damagePerTurn = damagePerTurn;
  }

  onTurnStart(unit: DebuffCombatUnit): void {
    unit.takeDamage(this.damagePerTurn, 'ice_dot');
  }

  clone(): IceDotDebuff {
    return new IceDotDebuff(this.remainingDuration, this.damagePerTurn);
  }
}

// ==================== 火属性·爆发流专用Debuff ====================

/**
 * 灼伤印记debuff：火属性爆发流
 * 下回合追加40威力火属性伤害
 */
export class BurnMarkDebuff extends Debuff {
  extraDamagePower: number;

  constructor(extraDamagePower: number = 40) {
    super('灼伤印记', DebuffType.BURN_MARK, 1, 2);
    this.extraDamagePower = extraDamagePower;
  }

  getExtraDamage(): number {
    return this.extraDamagePower;
  }

  consume(): void {
    this.remainingDuration = 0;
    this.stacks = 0;
  }

  clone(): BurnMarkDebuff {
    return new BurnMarkDebuff(this.extraDamagePower);
  }
}

/**
 * 燃尽印记debuff：火属性爆发流
 * 3回合后扣除30%当前HP
 */
export class CombustionMarkDebuff extends Debuff {
  percentDamage: number;
  delayTurns: number;

  constructor(delayTurns: number = 3, percentDamage: number = 0.3) {
    super('燃尽印记', DebuffType.COMBUSTION_MARK, 1, delayTurns);
    this.delayTurns = delayTurns;
    this.percentDamage = percentDamage;
  }

  getDamagePercent(): number {
    return this.percentDamage;
  }

  trigger(unit: any): void {
    const damage = Math.floor(unit.currentHp * this.percentDamage);
    unit.takeDamage(damage, 'combustion');
    this.consume();
  }

  consume(): void {
    this.remainingDuration = 0;
    this.stacks = 0;
  }

  clone(): CombustionMarkDebuff {
    return new CombustionMarkDebuff(this.remainingDuration, this.percentDamage);
  }
}

// ==================== 水属性·控制流专用Debuff ====================

/**
 * 潮湿debuff：水属性控制流
 * 受到电属性攻击时额外承受30%伤害
 */
export class WetDebuff extends Debuff {
  electricDamageBonus: number;

  constructor(duration: number = 3, electricDamageBonus: number = 0.3) {
    super('潮湿', DebuffType.WET, 1, duration);
    this.electricDamageBonus = electricDamageBonus;
  }

  getElectricDamageMultiplier(): number {
    return 1 + this.electricDamageBonus;
  }

  clone(): WetDebuff {
    return new WetDebuff(this.remainingDuration, this.electricDamageBonus);
  }
}

/**
 * 溺亡debuff：水属性控制流
 * 每回合损失最大HP的6%
 */
export class DrowningDebuff extends Debuff {
  damagePercent: number;

  constructor(duration: number = 3, damagePercent: number = 0.06) {
    super('溺亡', DebuffType.DROWNING, 1, duration);
    this.damagePercent = damagePercent;
  }

  onTurnStart(unit: any): void {
    const damage = Math.floor(unit.maxHp * this.damagePercent);
    unit.takeDamage(damage, 'drowning');
  }

  clone(): DrowningDebuff {
    return new DrowningDebuff(this.remainingDuration, this.damagePercent);
  }
}

/**
 * 湍流debuff：水属性控制流
 * 所有技能消耗+1能量
 */
export class TurbulenceDebuff extends Debuff {
  energyIncrease: number;

  constructor(duration: number = 2, energyIncrease: number = 1) {
    super('湍流', DebuffType.TURBULENCE, 1, duration);
    this.energyIncrease = energyIncrease;
  }

  getEnergyIncrease(): number {
    return this.energyIncrease;
  }

  clone(): TurbulenceDebuff {
    return new TurbulenceDebuff(this.remainingDuration, this.energyIncrease);
  }
}

// ==================== 电属性·连击流专用Debuff ====================

/**
 * 静电debuff：电属性连击流
 * 受到攻击时概率释放静电，对攻击者造成反伤
 */
export class StaticDebuff extends Debuff {
  staticBuildup: number;
  damageOnHit: number;

  constructor(duration: number = 3, damageOnHit: number = 15) {
    super('静电', DebuffType.STATIC, 1, duration);
    this.staticBuildup = 0;
    this.damageOnHit = damageOnHit;
  }

  addBuildup(amount: number): void {
    this.staticBuildup += amount;
  }

  discharge(): number {
    const damage = this.staticBuildup + this.damageOnHit;
    this.staticBuildup = 0;
    return damage;
  }

  clone(): StaticDebuff {
    const cloned = new StaticDebuff(this.remainingDuration, this.damageOnHit);
    cloned.staticBuildup = this.staticBuildup;
    return cloned;
  }
}

/**
 * 电疗debuff：电属性连击流
 * 每回合开始时受到电流伤害，但速度提升
 */
export class ElectricShockDebuff extends Debuff {
  damagePerTurn: number;
  speedBonus: number;

  constructor(duration: number = 3, damagePerTurn: number = 10, speedBonus: number = 0.25) {
    super('电疗', DebuffType.ELECTRIC_SHOCK, 1, duration);
    this.damagePerTurn = damagePerTurn;
    this.speedBonus = speedBonus;
  }

  onTurnStart(unit: any): void {
    unit.takeDamage(this.damagePerTurn, 'electric_shock');
  }

  clone(): ElectricShockDebuff {
    const cloned = new ElectricShockDebuff(this.remainingDuration, this.damagePerTurn, this.speedBonus);
    return cloned;
  }
}

// ==================== 超能属性·奥秘流专用Debuff ====================

/**
 * 心灵创伤debuff：超能属性奥秘流
 * 攻击命中率50%击中自己（混乱的变体）
 */
export class MindWoundDebuff extends Debuff {
  selfHitChance: number;

  constructor(duration: number = 2, selfHitChance: number = 0.5) {
    super('心灵创伤', DebuffType.MIND_WOUND, 1, duration);
    this.selfHitChance = selfHitChance;
  }

  trySelfHit(): boolean {
    return Math.random() < this.selfHitChance;
  }

  clone(): MindWoundDebuff {
    return new MindWoundDebuff(this.remainingDuration, this.selfHitChance);
  }
}

/**
 * 禁忌debuff：超能属性奥秘流
 * 使目标所有能力等级-2（强化/弱化）
 */
export class ForbiddenDebuff extends Debuff {
  stageReduction: number;
  affectsAllStats: boolean;

  constructor(duration: number = 2, stageReduction: number = 2) {
    super('禁忌', DebuffType.FORBIDDEN, 1, duration);
    this.stageReduction = stageReduction;
    this.affectsAllStats = true; // 影响所有能力等级
  }

  clone(): ForbiddenDebuff {
    return new ForbiddenDebuff(this.remainingDuration, this.stageReduction);
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
    // 冰属性减速流专用Debuff
    case DebuffType.SLOW:
      return new SlowDebuff(stacks, duration);
    case DebuffType.ICE_SEAL:
      return new IceSealDebuff(duration);
    case DebuffType.ICE_DOT:
      return new IceDotDebuff(duration);
    // 火属性爆发流专用Debuff
    case DebuffType.BURN_MARK:
      return new BurnMarkDebuff();
    case DebuffType.COMBUSTION_MARK:
      return new CombustionMarkDebuff(duration);
    // 水属性控制流专用Debuff
    case DebuffType.WET:
      return new WetDebuff(duration);
    case DebuffType.DROWNING:
      return new DrowningDebuff(duration);
    case DebuffType.TURBULENCE:
      return new TurbulenceDebuff(duration);
    // 电属性连击流专用Debuff
    case DebuffType.STATIC:
      return new StaticDebuff(duration);
    case DebuffType.ELECTRIC_SHOCK:
      return new ElectricShockDebuff(duration);
    // 超能属性奥秘流专用Debuff
    case DebuffType.MIND_WOUND:
      return new MindWoundDebuff(duration);
    case DebuffType.FORBIDDEN:
      return new ForbiddenDebuff(duration);
    default:
      throw new Error(`Unknown DebuffType: ${type}`);
  }
}
