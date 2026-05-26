/**
 * 循迹之境 - Buff系统实现
 * 以太术士风格
 */

import { BuffType } from '../../types';

/**
 * 前向引用CombatUnit（避免循环依赖）
 */
export type BuffCombatUnit = {
  maxHp: number;
  heal(amount: number): number;
  takeDamage(amount: number, type?: string): number;
};

/**
 * Buff基类
 */
export abstract class Buff {
  id: string;
  name: string;
  type: BuffType;
  stacks: number;
  duration: number;
  remainingDuration: number;
  isVolatile: boolean;

  constructor(name: string, type: BuffType, stacks: number = 1, duration: number = 3) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.type = type;
    this.stacks = stacks;
    this.duration = duration;
    this.remainingDuration = duration;
    this.isVolatile = false;
  }

  onTurnStart(_unit: BuffCombatUnit): void {}
  onTurnEnd(_unit: BuffCombatUnit): void {}
  onDamaged(_unit: BuffCombatUnit, _damage: number): void {}
  onDealDamage(_unit: BuffCombatUnit, _damage: number, _target: BuffCombatUnit): void {}
  onUseAction(_unit: BuffCombatUnit): void {}
  onHealed(_unit: BuffCombatUnit, _amount: number): void {}

  isExpired(): boolean {
    return this.remainingDuration <= 0;
  }

  abstract clone(): Buff;
}

// ==================== 冰属性·减速流专用Buff ====================

/**
 * 冰霜护甲buff：冰属性·冻结破冰流v3.0
 * 受到伤害降低50%，本回合受伤时使攻击者冻结1回合
 */
export class IceArmorBuff extends Buff {
  damageReduction: number;
  
  constructor(duration: number = 1, damageReduction: number = 0.5) {
    super('冰霜护甲', BuffType.ICE_ARMOR, 1, duration);
    this.damageReduction = damageReduction;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  clone(): IceArmorBuff {
    const cloned = new IceArmorBuff(this.remainingDuration, this.damageReduction);
    return cloned;
  }
}

/**
 * 冰晶反射buff：冰属性减速流
 * 反弹下次冰属性攻击并使攻击者减速
 */
export class IceReflectBuff extends Buff {
  uses: number;
  slowDuration: number;
  slowStages: number;

  constructor(uses: number = 1, slowDuration: number = 2, slowStages: number = 1) {
    super('冰晶反射', BuffType.ICE_REFLECT, 1, 2);
    this.uses = uses;
    this.slowDuration = slowDuration;
    this.slowStages = slowStages;
  }

  tryReflect(): boolean {
    if (this.uses > 0) {
      this.uses--;
      if (this.uses <= 0) {
        this.remainingDuration = 0;
      }
      return true;
    }
    return false;
  }

  getSlowInfo(): { duration: number; stages: number } {
    return { duration: this.slowDuration, stages: this.slowStages };
  }

  clone(): IceReflectBuff {
    const cloned = new IceReflectBuff(this.uses, this.slowDuration, this.slowStages);
    return cloned;
  }
}

/**
 * 极寒抗性buff：冰属性减速流
 * 对减速状态的抗性+50%
 */
export class IceResistBuff extends Buff {
  slowResistBonus: number;

  constructor(duration: number = 2, slowResistBonus: number = 0.5) {
    super('极寒抗性', BuffType.ICE_RESIST, 1, duration);
    this.slowResistBonus = slowResistBonus;
  }

  getSlowResistMultiplier(): number {
    return 1 - this.slowResistBonus;
  }

  clone(): IceResistBuff {
    return new IceResistBuff(this.remainingDuration, this.slowResistBonus);
  }
}

/**
 * 冰墙buff：冰属性·冻结破冰流v3.0
 * 50%闪避+格挡（冰墙存在期间敌方每次攻击有25%概率被格挡）
 */
export class IceWallBuff extends Buff {
  dodgeChance: number;      // 本回合闪避概率
  blockChance: number;       // 持续期间的格挡概率
  
  constructor(
    duration: number = 2,
    dodgeChance: number = 0.5,
    blockChance: number = 0.25
  ) {
    super('冰墙', BuffType.ICE_WALL, 1, duration);
    this.dodgeChance = dodgeChance;
    this.blockChance = blockChance;
  }

  tryDodge(): boolean {
    return Math.random() < this.dodgeChance;
  }

  tryBlock(): boolean {
    return Math.random() < this.blockChance;
  }

  clone(): IceWallBuff {
    const cloned = new IceWallBuff(this.remainingDuration, this.dodgeChance, this.blockChance);
    return cloned;
  }
}

/**
 * 极寒领域buff：冰属性·冻结破冰流v3.0
 * 受到伤害降低60%，敌方全体每次行动前有30%概率被冻结
 */
export class FrostFieldBuff extends Buff {
  damageReduction: number;    // 减伤比例
  freezeChance: number;      // 冻结概率
  
  constructor(
    duration: number = 1,
    damageReduction: number = 0.6,
    freezeChance: number = 0.3
  ) {
    super('极寒领域', BuffType.FROST_FIELD, 1, duration);
    this.damageReduction = damageReduction;
    this.freezeChance = freezeChance;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  tryFreeze(): boolean {
    return Math.random() < this.freezeChance;
  }

  clone(): FrostFieldBuff {
    const cloned = new FrostFieldBuff(this.remainingDuration, this.damageReduction, this.freezeChance);
    return cloned;
  }
}

/**
 * 冰霜印记buff：冰属性·冻结破冰流v3.0
 * 冻结概率+30%（用于显示在己方单位上的buff）
 */
export class FrostMarkBuff extends Buff {
  freezeBonus: number;
  
  constructor(duration: number = 3, freezeBonus: number = 0.3) {
    super('冰霜印记', BuffType.FROST_MARK, 1, duration);
    this.freezeBonus = freezeBonus;
  }

  getFreezeBonus(): number {
    return this.freezeBonus;
  }

  clone(): FrostMarkBuff {
    const cloned = new FrostMarkBuff(this.remainingDuration, this.freezeBonus);
    return cloned;
  }
}

// ==================== 火属性·爆发流专用Buff ====================

/**
 * 火盾buff：火属性爆发流
 * 受攻击时对敌人造成30点火属性反伤
 */
export class FireShieldBuff extends Buff {
  shieldValue: number;
  maxShieldValue: number;
  counterDamage: number;

  constructor(unit: BuffCombatUnit, shieldValue: number = 50, counterDamage: number = 30) {
    super('火盾', BuffType.FIRE_SHIELD, 1, 999);
    this.maxShieldValue = shieldValue;
    this.shieldValue = shieldValue;
    this.counterDamage = counterDamage;
  }

  onTurnStart(_unit: BuffCombatUnit): void {
    // 护盾持续整场
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.shieldValue, damage);
    this.shieldValue -= absorbed;
    if (this.shieldValue <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  getCounterDamage(): number {
    return this.counterDamage;
  }

  clone(): FireShieldBuff {
    const cloned = new FireShieldBuff({ maxHp: this.maxShieldValue * 2 } as BuffCombatUnit, this.maxShieldValue, this.counterDamage);
    cloned.shieldValue = this.shieldValue;
    return cloned;
  }
}

/**
 * 烈焰壁垒buff：火属性爆发流
 * 对草/冰属性伤害抗性+30%
 */
export class WallOfFireBuff extends Buff {
  resistBonus: number;

  constructor(duration: number = 2, resistBonus: number = 0.3) {
    super('烈焰壁垒', BuffType.WALL_OF_FIRE, 1, duration);
    this.resistBonus = resistBonus;
  }

  getResistMultiplier(elementType?: string): number {
    if (elementType === 'grass' || elementType === 'ice') {
      return 1 - this.resistBonus;
    }
    return 1;
  }

  clone(): WallOfFireBuff {
    return new WallOfFireBuff(this.remainingDuration, this.resistBonus);
  }
}

/**
 * 灼热反击buff：火属性爆发流
 * 受攻击时反弹50%伤害的火属性反击
 */
export class HeatCounterBuff extends Buff {
  counterPercent: number;

  constructor(duration: number = 2, counterPercent: number = 0.5) {
    super('灼热反击', BuffType.HEAT_COUNTER, 1, duration);
    this.counterPercent = counterPercent;
  }

  onDamaged(_unit: BuffCombatUnit, damage: number): void {
    // 此方法在战斗管理器中调用，用于触发反击
  }

  getCounterDamage(damage: number): number {
    return Math.floor(damage * this.counterPercent);
  }

  clone(): HeatCounterBuff {
    return new HeatCounterBuff(this.remainingDuration, this.counterPercent);
  }
}

/**
 * 蓄焰buff：火属性爆发流
 * 下次火属性攻击威力+50%
 */
export class FlameChargeBuff extends Buff {
  damageBonus: number;
  consumed: boolean;

  constructor(duration: number = 3, damageBonus: number = 0.5) {
    super('蓄焰', BuffType.FLAME_CHARGE, 1, duration);
    this.damageBonus = damageBonus;
    this.consumed = false;
  }

  consume(): void {
    this.consumed = true;
    this.remainingDuration = 0;
  }

  getDamageMultiplier(): number {
    return 1 + this.damageBonus;
  }

  isActive(): boolean {
    return !this.consumed && this.remainingDuration > 0;
  }

  clone(): FlameChargeBuff {
    const cloned = new FlameChargeBuff(this.remainingDuration, this.damageBonus);
    cloned.consumed = this.consumed;
    return cloned;
  }
}

/**
 * 炎之意志buff：火属性爆发流
 * 攻击+1级，速度+1级，火属性伤害+15%
 */
export class BlazeWillBuff extends Buff {
  attackBonus: number;
  speedBonus: number;
  fireDamageBonus: number;

  constructor(duration: number = 2, attackBonus: number = 1, speedBonus: number = 1, fireDamageBonus: number = 0.15) {
    super('炎之意志', BuffType.BLAZE_WILL, 1, duration);
    this.attackBonus = attackBonus;
    this.speedBonus = speedBonus;
    this.fireDamageBonus = fireDamageBonus;
  }

  getAttackBonus(): number {
    return this.attackBonus;
  }

  getSpeedBonus(): number {
    return this.speedBonus;
  }

  getFireDamageMultiplier(): number {
    return 1 + this.fireDamageBonus;
  }

  clone(): BlazeWillBuff {
    return new BlazeWillBuff(this.remainingDuration, this.attackBonus, this.speedBonus, this.fireDamageBonus);
  }
}

// ==================== 水属性·控制流专用Buff ====================

/**
 * 水之守护buff：水属性控制流
 * 受攻击时使敌人下次技能伤害-20%
 */
export class WaterShieldBuff extends Buff {
  shieldValue: number;
  maxShieldValue: number;
  damageReduction: number;
  targetId?: string;

  constructor(unit: BuffCombatUnit, shieldValue: number = 80, damageReduction: number = 0.2) {
    super('水之守护', BuffType.WATER_SHIELD, 1, 999);
    this.maxShieldValue = shieldValue;
    this.shieldValue = shieldValue;
    this.damageReduction = damageReduction;
  }

  onTurnStart(_unit: BuffCombatUnit): void {
    // 护盾持续整场
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.shieldValue, damage);
    this.shieldValue -= absorbed;
    if (this.shieldValue <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  clone(): WaterShieldBuff {
    const cloned = new WaterShieldBuff({ maxHp: this.maxShieldValue * 2 } as BuffCombatUnit, this.maxShieldValue, this.damageReduction);
    cloned.shieldValue = this.shieldValue;
    return cloned;
  }
}

/**
 * 清泉buff：水属性控制流
 * 每回合恢复10%HP并清除1个负面状态
 */
export class ClearSpringBuff extends Buff {
  healPercent: number;
  cleanseCount: number;

  constructor(duration: number = 3, healPercent: number = 0.1, cleanseCount: number = 1) {
    super('清泉', BuffType.CLEAR_SPRING, 1, duration);
    this.healPercent = healPercent;
    this.cleanseCount = cleanseCount;
  }

  onTurnStart(unit: BuffCombatUnit): void {
    // 回合开始时恢复HP
    const healAmount = Math.floor(unit.maxHp * this.healPercent);
    unit.heal(healAmount);
    // 清除负面状态的逻辑需要在战斗管理器中处理
  }

  getCleanseCount(): number {
    return this.cleanseCount;
  }

  clone(): ClearSpringBuff {
    return new ClearSpringBuff(this.remainingDuration, this.healPercent, this.cleanseCount);
  }
}

/**
 * 流水buff：水属性控制流
 * 速度+1级
 */
export class FlowBuff extends Buff {
  speedBonus: number;

  constructor(duration: number = 2, speedBonus: number = 1) {
    super('流水', BuffType.FLOW, 1, duration);
    this.speedBonus = speedBonus;
  }

  getSpeedBonus(): number {
    return this.speedBonus;
  }

  clone(): FlowBuff {
    return new FlowBuff(this.remainingDuration, this.speedBonus);
  }
}

/**
 * 水属性抗性buff：水属性控制流
 * 对水属性伤害抗性+30%
 */
export class WaterResistBuff extends Buff {
  resistBonus: number;

  constructor(duration: number = 3, resistBonus: number = 0.3) {
    super('水抗', BuffType.WATER_RESIST, 1, duration);
    this.resistBonus = resistBonus;
  }

  getResistMultiplier(): number {
    return 1 - this.resistBonus;
  }

  clone(): WaterResistBuff {
    return new WaterResistBuff(this.remainingDuration, this.resistBonus);
  }
}

// ==================== 电属性·连击流专用Buff ====================

/**
 * 静电护盾buff：电属性连击流
 * 吸收伤害的同时积累静电，下一次攻击附带额外伤害
 */
export class StaticShieldBuff extends Buff {
  value: number;
  maxValue: number;
  staticCharge: number;

  constructor(value: number = 50) {
    super('静电护盾', BuffType.STATIC_SHIELD, 1, 999);
    this.maxValue = value;
    this.value = value;
    this.staticCharge = 0;
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.value, damage);
    this.value -= absorbed;
    this.staticCharge += Math.floor(absorbed / 10);
    if (this.value <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  consumeStaticCharge(): number {
    const charge = this.staticCharge;
    this.staticCharge = 0;
    return charge;
  }

  clone(): StaticShieldBuff {
    const cloned = new StaticShieldBuff(this.maxValue);
    cloned.value = this.value;
    cloned.staticCharge = this.staticCharge;
    return cloned;
  }
}

/**
 * 连击充能buff：电属性连击流
 * 记录连击次数，下次攻击根据连击次数提升威力
 */
export class ComboChargeBuff extends Buff {
  comboCount: number;
  maxComboCount: number;

  constructor(maxComboCount: number = 5, duration: number = 3) {
    super('连击充能', BuffType.COMBO_CHARGE, 1, duration);
    this.comboCount = 0;
    this.maxComboCount = maxComboCount;
  }

  addCombo(): void {
    this.comboCount = Math.min(this.comboCount + 1, this.maxComboCount);
    this.remainingDuration = this.duration;
  }

  resetCombo(): void {
    this.comboCount = 0;
  }

  getComboMultiplier(): number {
    return 1 + (this.comboCount * 0.2);
  }

  clone(): ComboChargeBuff {
    const cloned = new ComboChargeBuff(this.maxComboCount, this.duration);
    cloned.comboCount = this.comboCount;
    return cloned;
  }
}

/**
 * 电场加速buff：电属性连击流
 * 回合结束时积累电场层数，下回合攻击附带额外效果
 */
export class ElectricFieldBuff extends Buff {
  fieldLayers: number;
  maxFieldLayers: number;

  constructor(maxFieldLayers: number = 3) {
    super('电场加速', BuffType.ELECTRIC_FIELD, 1, 999);
    this.fieldLayers = 0;
    this.maxFieldLayers = maxFieldLayers;
  }

  addLayer(): void {
    this.fieldLayers = Math.min(this.fieldLayers + 1, this.maxFieldLayers);
  }

  consumeFieldLayers(): number {
    const layers = this.fieldLayers;
    this.fieldLayers = 0;
    return layers;
  }

  getSpeedBonus(): number {
    return this.fieldLayers * 0.15;
  }

  clone(): ElectricFieldBuff {
    const cloned = new ElectricFieldBuff(this.maxFieldLayers);
    cloned.fieldLayers = this.fieldLayers;
    return cloned;
  }
}

/**
 * 雷霆之势buff：电属性连击流
 * 攻击附带连锁效果，可以弹射到其他目标
 */
export class ThunderFuryBuff extends Buff {
  chainCount: number;
  chainDamageMultiplier: number;

  constructor(chainCount: number = 2, chainDamageMultiplier: number = 0.5) {
    super('雷霆之势', BuffType.THUNDER_FURY, 1, 2);
    this.chainCount = chainCount;
    this.chainDamageMultiplier = chainDamageMultiplier;
  }

  getChainInfo(): { count: number; multiplier: number } {
    return {
      count: this.chainCount,
      multiplier: this.chainDamageMultiplier
    };
  }

  clone(): ThunderFuryBuff {
    return new ThunderFuryBuff(this.chainCount, this.chainDamageMultiplier);
  }
}

/**
 * 力量buff：以太术士风格
 * 每次命中+1伤害
 */
export class PowerBuff extends Buff {
  constructor(stacks: number = 1, duration: number = 3) {
    super('力量', BuffType.POWER, stacks, duration);
  }
  
  clone(): PowerBuff {
    return new PowerBuff(this.stacks, this.duration);
  }
}

/**
 * 强化暴击buff：以太术士风格
 * 每次命中变暴击，伤害+50%
 */
export class ForceBuff extends Buff {
  constructor(stacks: number = 1, duration: number = 3) {
    super('强化暴击', BuffType.FORCE, stacks, duration);
  }
  
  clone(): ForceBuff {
    return new ForceBuff(this.stacks, this.duration);
  }
}

/**
 * 护盾buff：以太术士风格
 * 护盾值=50%最大HP，回合开始时消失
 */
export class ShieldBuff extends Buff {
  value: number;
  maxValue: number;
  
  constructor(unit: BuffCombatUnit, value?: number) {
    super('护盾', BuffType.SHIELD, 1, 999);
    this.maxValue = Math.floor(unit.maxHp * 0.5);
    this.value = value ?? this.maxValue;
  }
  
  onTurnStart(_unit: BuffCombatUnit): void {
    this.value = 0;
    this.remainingDuration = 0;
  }
  
  absorbDamage(damage: number): number {
    const absorbed = Math.min(this.value, damage);
    this.value -= absorbed;
    return absorbed;
  }
  
  clone(): ShieldBuff {
    const mockUnit = { maxHp: this.maxValue * 2 } as BuffCombatUnit;
    const cloned = new ShieldBuff(mockUnit, this.value);
    cloned.maxValue = this.maxValue;
    return cloned;
  }
}

/**
 * 再生buff：以太术士风格
 * 回合开始时治疗，每层+healPerStack HP，然后层数-1
 */
export class RegenerationBuff extends Buff {
  healPerStack: number;
  
  constructor(stacks: number = 1, duration: number = 3, healPerStack: number = 5) {
    super('再生', BuffType.REGENERATION, stacks, duration);
    this.healPerStack = healPerStack;
  }
  
  onTurnStart(unit: BuffCombatUnit): void {
    const healAmount = this.stacks * this.healPerStack;
    unit.heal(healAmount);
    this.stacks = Math.max(0, this.stacks - 1);
    this.remainingDuration = Math.max(0, this.remainingDuration - 1);
  }
  
  clone(): RegenerationBuff {
    return new RegenerationBuff(this.stacks, this.duration, this.healPerStack);
  }
}

/**
 * 荣耀buff
 * 暴击率+10%，暴击伤害+20%，最多1层
 */
export class GloryBuff extends Buff {
  critChanceBonus: number = 0.1;
  critDamageBonus: number = 0.2;
  
  constructor() {
    super('荣耀', BuffType.GLORY, 1, 999);
  }
  
  clone(): GloryBuff {
    return new GloryBuff();
  }
}

/**
 * 闪避buff：以太术士风格
 * 每隔一次攻击闪避，层数耗尽
 */
export class DodgeBuff extends Buff {
  constructor(stacks: number = 1) {
    super('闪避', BuffType.DODGE, stacks, 999);
  }
  
  tryDodge(): boolean {
    if (this.stacks > 0) {
      this.stacks--;
      if (this.stacks <= 0) {
        this.remainingDuration = 0;
      }
      return true;
    }
    return false;
  }
  
  clone(): DodgeBuff {
    return new DodgeBuff(this.stacks);
  }
}

/**
 * 嘲讽buff
 * 获得+1防御，转移下一个敌人单体攻击
 */
export class RedirectBuff extends Buff {
  defenseBonus: number;
  
  constructor(stacks: number = 1) {
    super('嘲讽', BuffType.REDIRECT, stacks, 999);
    this.defenseBonus = stacks;
  }
  
  consume(): void {
    this.stacks--;
    if (this.stacks <= 0) {
      this.remainingDuration = 0;
    }
  }
  
  clone(): RedirectBuff {
    return new RedirectBuff(this.stacks);
  }
}

/**
 * 攻击提升buff（能力等级）
 */
export class AttackUpBuff extends Buff {
  stageBonus: number;
  
  constructor(stacks: number = 1, duration: number = 3) {
    super('攻击提升', BuffType.ATTACK_UP, stacks, duration);
    this.stageBonus = stacks;
  }
  
  clone(): AttackUpBuff {
    return new AttackUpBuff(this.stacks, this.duration);
  }
}

/**
 * 防御提升buff（能力等级）
 */
export class DefendUpBuff extends Buff {
  stageBonus: number;
  
  constructor(stacks: number = 1, duration: number = 3) {
    super('防御提升', BuffType.DEFEND_UP, stacks, duration);
    this.stageBonus = stacks;
  }
  
  clone(): DefendUpBuff {
    return new DefendUpBuff(this.stacks, this.duration);
  }
}

/**
 * 速度提升buff（能力等级）
 */
export class SpeedUpBuff extends Buff {
  stageBonus: number;

  constructor(stacks: number = 1, duration: number = 3) {
    super('速度提升', BuffType.SPEED_UP, stacks, duration);
    this.stageBonus = stacks;
  }

  clone(): SpeedUpBuff {
    return new SpeedUpBuff(this.stacks, this.duration);
  }
}

// ==================== 超能属性·奥秘流专用Buff ====================

/**
 * 心智护盾buff：超能属性奥秘流
 * 护盾存在期间，若敌人使用技能则其PP-1
 */
export class MindShieldBuff extends Buff {
  value: number;
  maxValue: number;
  ppDrainPerHit: number;  // 每次被攻击时减少敌人能量

  constructor(unit: BuffCombatUnit, value: number = 60, ppDrainPerHit: number = 1) {
    super('心智护盾', BuffType.MIND_SHIELD, 1, 999);
    this.maxValue = value;
    this.value = value;
    this.ppDrainPerHit = ppDrainPerHit;
  }

  onTurnStart(_unit: BuffCombatUnit): void {
    // 每回合护盾值不变，不自动消失
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.value, damage);
    this.value -= absorbed;
    if (this.value <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  getPpDrain(): number {
    return this.ppDrainPerHit;
  }

  clone(): MindShieldBuff {
    const mockUnit = { maxHp: this.maxValue * 2 } as BuffCombatUnit;
    const cloned = new MindShieldBuff(mockUnit, this.maxValue, this.ppDrainPerHit);
    cloned.value = this.value;
    return cloned;
  }
}

/**
 * 灵镜反照buff：超能属性奥秘流
 * 反射下一次攻击，伤害×1.5
 */
export class ReflectBuff extends Buff {
  uses: number;           // 反射次数
  damageMultiplier: number; // 反弹伤害倍率

  constructor(uses: number = 1, damageMultiplier: number = 1.5) {
    super('灵镜反照', BuffType.REFLECT, uses, 999);
    this.uses = uses;
    this.damageMultiplier = damageMultiplier;
  }

  tryReflect(): boolean {
    if (this.uses > 0) {
      this.uses--;
      if (this.uses <= 0) {
        this.remainingDuration = 0;
      }
      return true;
    }
    return false;
  }

  getMultiplier(): number {
    return this.damageMultiplier;
  }

  clone(): ReflectBuff {
    return new ReflectBuff(this.uses, this.damageMultiplier);
  }
}

/**
 * 迷雾闪避buff：超能属性奥秘流
 * 每回合有60%概率闪避任意攻击，闪避成功后+1级速度
 */
export class PsychicDodgeBuff extends Buff {
  dodgeChance: number;
  speedUpOnDodge: number;
  remainingDodgeUses: number;

  constructor(
    duration: number = 2,
    dodgeChance: number = 0.6,
    speedUpOnDodge: number = 1
  ) {
    super('迷雾闪避', BuffType.PSYCHIC_DODGE, 1, duration);
    this.dodgeChance = dodgeChance;
    this.speedUpOnDodge = speedUpOnDodge;
    this.remainingDodgeUses = 2; // 默认可闪避2次
  }

  tryDodge(): { success: boolean; speedUp: number } {
    if (this.remainingDodgeUses > 0 && Math.random() < this.dodgeChance) {
      this.remainingDodgeUses--;
      if (this.remainingDodgeUses <= 0) {
        this.remainingDuration = 0;
      }
      return { success: true, speedUp: this.speedUpOnDodge };
    }
    return { success: false, speedUp: 0 };
  }

  clone(): PsychicDodgeBuff {
    const cloned = new PsychicDodgeBuff(
      this.remainingDuration,
      this.dodgeChance,
      this.speedUpOnDodge
    );
    cloned.remainingDodgeUses = this.remainingDodgeUses;
    return cloned;
  }
}

/**
 * 超能抗性buff：超能属性奥秘流
 * 对超能属性（精神类）攻击抗性+30%
 */
export class PsychicResistBuff extends Buff {
  resistBonus: number;

  constructor(duration: number = 3, resistBonus: number = 0.3) {
    super('超能抗性', BuffType.PSYCHIC_RESIST, 1, duration);
    this.resistBonus = resistBonus;
  }

  getResistMultiplier(): number {
    return 1 - this.resistBonus;
  }

  clone(): PsychicResistBuff {
    return new PsychicResistBuff(this.remainingDuration, this.resistBonus);
  }
}

/**
 * 意图模糊buff：超能属性奥秘流
 * 降低己方意图可信度30%
 */
export class IntentBlurBuff extends Buff {
  blurPercent: number;

  constructor(duration: number = 1, blurPercent: number = 0.3) {
    super('意图模糊', BuffType.INTENT_BLUR, 1, duration);
    this.blurPercent = blurPercent;
  }

  getBlurMultiplier(): number {
    return 1 - this.blurPercent;
  }

  clone(): IntentBlurBuff {
    return new IntentBlurBuff(this.remainingDuration, this.blurPercent);
  }
}

/**
 * 藤蔓护体buff：草属性光环流
 * 受到伤害降低50%，受到攻击时缠绕攻击者（速度-2级）
 */
export class VineBodyBuff extends Buff {
  damageReduction: number;
  slowStages: number;
  slowDuration: number;

  constructor(
    damageReduction: number = 0.5,
    slowStages: number = 2,
    slowDuration: number = 2,
    duration: number = 1
  ) {
    super('藤蔓护体', BuffType.VINE_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.slowStages = slowStages;
    this.slowDuration = slowDuration;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  getSlowInfo(): { stages: number; duration: number } {
    return { stages: this.slowStages, duration: this.slowDuration };
  }

  clone(): VineBodyBuff {
    return new VineBodyBuff(
      this.damageReduction,
      this.slowStages,
      this.slowDuration,
      this.remainingDuration
    );
  }
}

/**
 * 生机护体buff：草属性光环流
 * 受到伤害降低70%，本回合受伤时回复最大HP的10%
 */
export class LifeBodyBuff extends Buff {
  damageReduction: number;
  healPercent: number;

  constructor(damageReduction: number = 0.7, healPercent: number = 0.1, duration: number = 1) {
    super('生机护体', BuffType.LIFE_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.healPercent = healPercent;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  getHealPercent(): number {
    return this.healPercent;
  }

  clone(): LifeBodyBuff {
    return new LifeBodyBuff(this.damageReduction, this.healPercent, this.remainingDuration);
  }
}

// ==================== 草属性·光环流专用Buff ====================

/**
 * 藤蔓之力buff：草属性光环流
 * 每层+1级攻击，最多叠加3层
 */
export class VinePowerBuff extends Buff {
  maxStacks: number;

  constructor(duration: number = 3, maxStacks: number = 3) {
    super('藤蔓之力', BuffType.VINE_POWER, 1, duration);
    this.maxStacks = maxStacks;
  }

  getAttackBonus(): number {
    return this.stacks;
  }

  addStack(): void {
    if (this.stacks < this.maxStacks) {
      this.stacks++;
    }
  }

  clone(): VinePowerBuff {
    const cloned = new VinePowerBuff(this.remainingDuration, this.maxStacks);
    cloned.stacks = this.stacks;
    return cloned;
  }
}

/**
 * 成长buff：草属性光环流
 * 每回合攻击+特攻各+1级，最多叠加3层
 */
export class GrowthBuff extends Buff {
  maxStacks: number;

  constructor(duration: number = 3, maxStacks: number = 3) {
    super('成长', BuffType.GROWTH, 1, duration);
    this.maxStacks = maxStacks;
  }

  onTurnStart(_unit: BuffCombatUnit): void {
    this.addStack();
  }

  addStack(): void {
    if (this.stacks < this.maxStacks) {
      this.stacks++;
    }
  }

  getAttackBonus(): number {
    return this.stacks;
  }

  getSpAttackBonus(): number {
    return this.stacks;
  }

  clone(): GrowthBuff {
    const cloned = new GrowthBuff(this.remainingDuration, this.maxStacks);
    cloned.stacks = this.stacks;
    return cloned;
  }
}

/**
 * 扎根buff：草属性光环流
 * 每回合回复最大HP的8%，但速度-1级
 */
export class RootBoundBuff extends Buff {
  healPercent: number;

  constructor(duration: number = 3, healPercent: number = 0.08) {
    super('扎根', BuffType.ROOT_BOUND, 1, duration);
    this.healPercent = healPercent;
  }

  onTurnStart(unit: BuffCombatUnit): void {
    const healAmount = Math.floor(unit.maxHp * this.healPercent);
    unit.heal(healAmount);
  }

  getHealPercent(): number {
    return this.healPercent;
  }

  clone(): RootBoundBuff {
    return new RootBoundBuff(this.remainingDuration, this.healPercent);
  }
}

/**
 * 绿叶屏障buff：草属性光环流
 * 群体护盾40点，对草属性攻击抗性+25%
 */
export class LeafBarrierBuff extends Buff {
  shieldValue: number;
  resistBonus: number;

  constructor(shieldValue: number = 40, resistBonus: number = 0.25, duration: number = 2) {
    super('绿叶屏障', BuffType.LEAF_BARRIER, 1, duration);
    this.shieldValue = shieldValue;
    this.resistBonus = resistBonus;
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.shieldValue, damage);
    this.shieldValue -= absorbed;
    if (this.shieldValue <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  getGrassResistMultiplier(): number {
    return 1 - this.resistBonus;
  }

  clone(): LeafBarrierBuff {
    const cloned = new LeafBarrierBuff(this.shieldValue, this.resistBonus, this.remainingDuration);
    return cloned;
  }
}

// ==================== Buff工厂函数 ====================

/**
 * Buff工厂函数
 */
export function createBuff(type: BuffType, stacks: number = 1, duration: number = 3): Buff {
  switch (type) {
    case BuffType.POWER:
      return new PowerBuff(stacks, duration);
    case BuffType.FORCE:
      return new ForceBuff(stacks, duration);
    case BuffType.SHIELD:
      throw new Error('ShieldBuff需要CombatUnit参数');
    case BuffType.REGENERATION:
      return new RegenerationBuff(stacks, duration);
    case BuffType.GLORY:
      return new GloryBuff();
    case BuffType.DODGE:
      return new DodgeBuff(stacks);
    case BuffType.REDIRECT:
      return new RedirectBuff(stacks);
    case BuffType.ATTACK_UP:
      return new AttackUpBuff(stacks, duration);
    case BuffType.DEFEND_UP:
      return new DefendUpBuff(stacks, duration);
    case BuffType.SPEED_UP:
      return new SpeedUpBuff(stacks, duration);
    // 冰属性减速流专用Buff
    case BuffType.ICE_ARMOR:
      return new IceArmorBuff(duration);
    case BuffType.ICE_REFLECT:
      return new IceReflectBuff();
    case BuffType.ICE_RESIST:
      return new IceResistBuff(duration);
    // 冰属性·冻结破冰流v3.0专用Buff
    case BuffType.ICE_WALL:
      return new IceWallBuff(duration);
    case BuffType.FROST_FIELD:
      return new FrostFieldBuff(duration);
    case BuffType.FROST_MARK:
      return new FrostMarkBuff(duration);
    // 火属性爆发流专用Buff
    case BuffType.FIRE_SHIELD:
      throw new Error('FireShieldBuff需要CombatUnit参数');
    case BuffType.WALL_OF_FIRE:
      return new WallOfFireBuff(duration);
    case BuffType.HEAT_COUNTER:
      return new HeatCounterBuff(duration);
    case BuffType.FLAME_CHARGE:
      return new FlameChargeBuff(duration);
    case BuffType.BLAZE_WILL:
      return new BlazeWillBuff(duration);
    // 水属性控制流专用Buff
    case BuffType.WATER_SHIELD:
      throw new Error('WaterShieldBuff需要CombatUnit参数');
    case BuffType.CLEAR_SPRING:
      return new ClearSpringBuff(duration);
    case BuffType.FLOW:
      return new FlowBuff(duration);
    case BuffType.WATER_RESIST:
      return new WaterResistBuff(duration);
    // 电属性连击流专用Buff
    case BuffType.STATIC_SHIELD:
      return new StaticShieldBuff();
    case BuffType.COMBO_CHARGE:
      return new ComboChargeBuff();
    case BuffType.ELECTRIC_FIELD:
      return new ElectricFieldBuff();
    case BuffType.THUNDER_FURY:
      return new ThunderFuryBuff();
    // 超能属性奥秘流专用Buff
    case BuffType.MIND_SHIELD:
      throw new Error('MindShieldBuff需要CombatUnit参数');
    case BuffType.REFLECT:
      return new ReflectBuff(stacks);
    case BuffType.PSYCHIC_DODGE:
      return new PsychicDodgeBuff(duration);
    case BuffType.PSYCHIC_RESIST:
      return new PsychicResistBuff(duration);
    case BuffType.INTENT_BLUR:
      return new IntentBlurBuff(duration);
    // 草属性光环流专用Buff
    case BuffType.VINE_BODY:
      return new VineBodyBuff(0.5, 2, 2, duration);
    case BuffType.LIFE_BODY:
      return new LifeBodyBuff(0.7, 0.1, duration);
    case BuffType.VINE_POWER:
      return new VinePowerBuff(duration);
    case BuffType.GROWTH:
      return new GrowthBuff(duration);
    case BuffType.ROOT_BOUND:
      return new RootBoundBuff(duration);
    case BuffType.LEAF_BARRIER:
      return new LeafBarrierBuff();
    default:
      throw new Error(`Unknown BuffType: ${type}`);
  }
}
