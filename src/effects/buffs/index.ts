/**
 * 循迹之境 - Buff系统实现
 * 以太术士风格
 */

import { BuffType } from '../../types';
import {
  ChargeBuff,
  OverloadBuff,
  ChargingBuff,
  ElectricFieldBuff,
  StaticBodyBuff,
  ElectricDeflectBuff
} from './electric-buffs-v2';

/**
 * 临时属性强化Buff
 * 用于技能产生的有持续时间的属性变化效果
 * 在持续时间结束后自动移除属性加成
 */
export class TempStatModifier extends Buff {
  stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';
  stages: number;
  private modifier: TempStatModifier;

  constructor(
    stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed',
    stages: number,
    duration: number = 2
  ) {
    const statNames: Record<string, string> = {
      'attack': '攻击',
      'defense': '防御',
      'spAttack': '特攻',
      'spDefense': '特防',
      'speed': '速度'
    };
    const direction = stages > 0 ? '提升' : '下降';
    super(`${statNames[stat]}${direction}`, BuffType.TEMP_STAT_MODIFIER, 1, duration);
    this.stat = stat;
    this.stages = stages;
  }

  /**
   * 应用属性变化
   */
  applyTo(unit: any): void {
    if (unit && typeof unit.modifyStat === 'function') {
      unit.modifyStat(this.stat, this.stages);
    }
  }

  /**
   * 移除属性变化（效果结束时调用）
   */
  removeFrom(unit: any): void {
    if (unit && typeof unit.modifyStat === 'function') {
      // 移除效果 = 施加相反的变化
      unit.modifyStat(this.stat, -this.stages);
    }
  }

  /**
   * 回合结束时减少持续时间
   */
  onTurnEnd(_unit: BuffCombatUnit): void {
    this.remainingDuration--;
  }

  clone(): TempStatModifier {
    return new TempStatModifier(this.stat, this.stages, this.duration);
  }
}

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
 * 冰霜护甲buff v4.0：冰属性·冰霜蓄力流
 * 受到伤害降低50%，本回合受伤时使攻击者获得1层冰霜
 */
export class IceArmorBuff extends Buff {
  damageReduction: number;
  counterFrost: boolean;  // 反击冰霜
  
  constructor(duration: number = 1, damageReduction: number = 0.5, counterFrost: boolean = true) {
    super('冰霜护甲', BuffType.ICE_ARMOR, 1, duration);
    this.damageReduction = damageReduction;
    this.counterFrost = counterFrost;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  hasCounterFrost(): boolean {
    return this.counterFrost;
  }

  clone(): IceArmorBuff {
    const cloned = new IceArmorBuff(this.remainingDuration, this.damageReduction, this.counterFrost);
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
 * 50%伤害减免
 */
export class IceWallBuff extends Buff {
  damageReduction: number;      // 伤害减免比例

  constructor(
    duration: number = 2,
    damageReduction: number = 0.5
  ) {
    super('冰墙', BuffType.ICE_WALL, 1, duration);
    this.damageReduction = damageReduction;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  clone(): IceWallBuff {
    const cloned = new IceWallBuff(this.remainingDuration, this.damageReduction);
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

// ==================== 火属性·爆发流专用Buff ====================
export class FlameChargeBuff extends Buff {
  bonusPerEnergy: number;
  consumed: boolean;

  constructor(duration: number = 3, bonusPerEnergy: number = 10) {
    super('蓄焰', BuffType.FLAME_CHARGE, 1, duration);
    this.bonusPerEnergy = bonusPerEnergy;
    this.consumed = false;
  }

  consume(): void {
    this.consumed = true;
    this.remainingDuration = 0;
  }

  /**
   * 根据施法者当前能量计算额外伤害
   */
  getExtraDamage(currentEnergy: number): number {
    return currentEnergy * this.bonusPerEnergy;
  }

  isActive(): boolean {
    return !this.consumed && this.remainingDuration > 0;
  }

  clone(): FlameChargeBuff {
    const cloned = new FlameChargeBuff(this.remainingDuration, this.bonusPerEnergy);
    cloned.consumed = this.consumed;
    return cloned;
  }
}

/**
 * 烈焰护体buff：火属性爆发流
 * 受到伤害降低70%，下次火属性攻击威力+40
 */
export class FlameBodyBuff extends Buff {
  damageReduction: number;
  extraDamage: number;
  consumed: boolean;

  constructor(duration: number = 2, damageReduction: number = 0.7, extraDamage: number = 40) {
    super('烈焰护体', BuffType.FLAME_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.extraDamage = extraDamage;
    this.consumed = false;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  getExtraDamage(): number {
    return this.extraDamage;
  }

  consume(): void {
    this.consumed = true;
    this.remainingDuration = 0;
  }

  isActive(): boolean {
    return !this.consumed && this.remainingDuration > 0;
  }

  clone(): FlameBodyBuff {
    const cloned = new FlameBodyBuff(this.remainingDuration, this.damageReduction, this.extraDamage);
    cloned.consumed = this.consumed;
    return cloned;
  }
}

/**
 * 炎之意志buff：火属性爆发流
 * 攻击+1级，速度+1级，火属性伤害+25%
 */
export class BlazeWillBuff extends Buff {
  attackBonus: number;
  speedBonus: number;
  fireDamageBonus: number;

  constructor(duration: number = 2, attackBonus: number = 1, speedBonus: number = 1, fireDamageBonus: number = 0.25) {
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

/**
 * 浸透buff：水属性控制流
 * 使目标特防-1级，持续2回合
 * 每次叠加刷新持续时间
 */
export class WaterSoakBuff extends Buff {
  defenseReduction: number;
  maxStacks: number;
  baseDuration: number;

  constructor(defenseReduction: number = 1, maxStacks: number = 6, baseDuration: number = 2) {
    super('浸透', BuffType.WATER_SOAK, 1, baseDuration);
    this.defenseReduction = defenseReduction;
    this.maxStacks = maxStacks;
    this.baseDuration = baseDuration;
  }

  addStack(): boolean {
    if (this.stacks < this.maxStacks) {
      this.stacks++;
    }
    this.refreshDuration();
    return true;
  }

  refreshDuration(): void {
    this.remainingDuration = this.baseDuration;
  }

  getDefenseReduction(): number {
    return this.stacks * this.defenseReduction;
  }

  clone(): WaterSoakBuff {
    const cloned = new WaterSoakBuff(this.defenseReduction, this.maxStacks, this.baseDuration);
    cloned.stacks = this.stacks;
    cloned.remainingDuration = this.remainingDuration;
    return cloned;
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
  unitMaxHp: number;

  constructor(unit?: BuffCombatUnit, value?: number) {
    super('护盾', BuffType.SHIELD, 1, 999);
    this.unitMaxHp = unit?.maxHp ?? 100;
    this.maxValue = Math.floor(this.unitMaxHp * 0.5);
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
    const cloned = new ShieldBuff({ maxHp: this.unitMaxHp * 2, heal: () => 0, takeDamage: () => 0 } as BuffCombatUnit, this.value);
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

// ==================== 草属性·光环流专用Buff v2.0 ====================

/**
 * 光能汇聚buff：草属性光环流v2.0
 * 使用其他草系技能后，下次使用的草系输出技能威力永久+60
 */
export class LightGatherBuff extends Buff {
  powerBonus: number;

  constructor(duration: number = 999, powerBonus: number = 60) {
    super('光能汇聚', BuffType.LIGHT_GATHER, 1, duration);
    this.powerBonus = powerBonus;
  }

  addStack(): void {
    this.stacks++;
  }

  getPowerBonus(): number {
    return this.stacks * this.powerBonus;
  }

  clone(): LightGatherBuff {
    const cloned = new LightGatherBuff(this.remainingDuration, this.powerBonus);
    cloned.stacks = this.stacks;
    return cloned;
  }
}

/**
 * 芬芳环境buff：草属性光环流v2.0
 * 己方草系技能伤害+25%，每回合回复5%HP
 */
export class FragrantEnvBuff extends Buff {
  damageBonus: number;
  healPercent: number;

  constructor(duration: number = 4, damageBonus: number = 0.25, healPercent: number = 0.05) {
    super('芬芳环境', BuffType.FRAGRANT_ENV, 1, duration);
    this.damageBonus = damageBonus;
    this.healPercent = healPercent;
  }

  onTurnStart(unit: BuffCombatUnit): void {
    const healAmount = Math.floor(unit.maxHp * this.healPercent);
    unit.heal(healAmount);
  }

  getDamageBonus(): number {
    return this.damageBonus;
  }

  getHealPercent(): number {
    return this.healPercent;
  }

  clone(): FragrantEnvBuff {
    return new FragrantEnvBuff(this.remainingDuration, this.damageBonus, this.healPercent);
  }
}

/**
 * 防反之姿buff：草属性光环流v2.0
 * 反弹60%伤害并获得先手+1
 */
export class CounterStanceBuff extends Buff {
  damageReflection: number;
  priorityBonus: number;
  used: boolean;

  constructor(duration: number = 1, damageReflection: number = 0.6, priorityBonus: number = 1) {
    super('防反之姿', BuffType.COUNTER_STANCE, 1, duration);
    this.damageReflection = damageReflection;
    this.priorityBonus = priorityBonus;
    this.used = false;
  }

  onDamaged(unit: BuffCombatUnit, damage: number): number {
    if (!this.used) {
      this.used = true;
      return Math.floor(damage * this.damageReflection);
    }
    return 0;
  }

  getPriorityBonus(): number {
    return this.priorityBonus;
  }

  isActive(): boolean {
    return !this.used && this.remainingDuration > 0;
  }

  clone(): CounterStanceBuff {
    const cloned = new CounterStanceBuff(this.remainingDuration, this.damageReflection, this.priorityBonus);
    cloned.used = this.used;
    return cloned;
  }
}

/**
 * 养分汲取buff：草属性光环流v2.0
 * 能量回复加成
 */
export class NutrientBuff extends Buff {
  energyRegenBonus: number;

  constructor(duration: number = 999, energyRegenBonus: number = 4) {
    super('养分汲取', BuffType.NUTRIENT, 1, duration);
    this.energyRegenBonus = energyRegenBonus;
  }

  getEnergyRegenBonus(): number {
    return this.energyRegenBonus;
  }

  clone(): NutrientBuff {
    const cloned = new NutrientBuff(this.remainingDuration, this.energyRegenBonus);
    return cloned;
  }
}

// ==================== 岩石属性·防御流专用Buff ====================

/**
 * 岩甲护体buff：岩石属性防御流
 * 受到伤害降低65%，本回合攻击+防御各+1级
 */
export class RockArmorBuff extends Buff {
  damageReduction: number;

  constructor(damageReduction: number = 0.65, duration: number = 1) {
    super('岩甲护体', BuffType.ROCK_ARMOR, 1, duration);
    this.damageReduction = damageReduction;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  clone(): RockArmorBuff {
    return new RockArmorBuff(this.damageReduction, this.remainingDuration);
  }
}

/**
 * 铁壁buff：岩石属性防御流
 * 受到伤害降低75%，本回合无法进行攻击
 */
export class IronWallBuff extends Buff {
  damageReduction: number;
  canAttack: boolean;

  constructor(damageReduction: number = 0.75, duration: number = 1) {
    super('铁壁', BuffType.IRON_WALL, 1, duration);
    this.damageReduction = damageReduction;
    this.canAttack = false;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  isAttackBlocked(): boolean {
    return !this.canAttack;
  }

  clone(): IronWallBuff {
    const cloned = new IronWallBuff(this.damageReduction, this.remainingDuration);
    cloned.canAttack = this.canAttack;
    return cloned;
  }
}

/**
 * 震荡护体buff：岩石属性防御流
 * 受到伤害降低55%，本回合攻击附带眩晕（30%概率使目标眩晕1回合）
 */
export class QuakeBodyBuff extends Buff {
  damageReduction: number;
  stunChance: number;

  constructor(damageReduction: number = 0.55, stunChance: number = 0.3, duration: number = 1) {
    super('震荡护体', BuffType.QUAKE_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.stunChance = stunChance;
  }

  getDamageReduction(): number {
    return this.damageReduction;
  }

  getStunChance(): number {
    return this.stunChance;
  }

  clone(): QuakeBodyBuff {
    return new QuakeBodyBuff(this.damageReduction, this.stunChance, this.remainingDuration);
  }
}

// ==================== Buff工厂函数 ====================

/**
 * Buff工厂函数 - 无参数版本
 * 适用于不需要CombatUnit参数的Buff
 */
export function createBuff(type: BuffType, stacks: number = 1, duration: number = 3): Buff {
  switch (type) {
    case BuffType.POWER:
      return new PowerBuff(stacks, duration);
    case BuffType.FORCE:
      return new ForceBuff(stacks, duration);
    case BuffType.SHIELD:
      // ShieldBuff需要unit参数，使用带参数的版本
      return createShieldBuff({ maxHp: 100, heal: () => 0, takeDamage: () => 0 } as BuffCombatUnit);
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
    case BuffType.FROST_MARK:
      return new FrostMarkBuff(duration);
    // 火属性爆发流专用Buff
    case BuffType.FIRE_SHIELD:
      return createFireShieldBuff({ maxHp: 100, heal: () => 0, takeDamage: () => 0 } as BuffCombatUnit);
    case BuffType.FLAME_BODY:
      return new FlameBodyBuff(duration);
    case BuffType.WALL_OF_FIRE:
      return new WallOfFireBuff(duration);
    case BuffType.FLAME_CHARGE:
      return new FlameChargeBuff(duration);
    case BuffType.BLAZE_WILL:
      return new BlazeWillBuff(duration);
    // 水属性控制流专用Buff
    case BuffType.WATER_SHIELD:
      return createWaterShieldBuff({ maxHp: 100, heal: () => 0, takeDamage: () => 0 } as BuffCombatUnit);
    case BuffType.CLEAR_SPRING:
      return new ClearSpringBuff(duration);
    case BuffType.FLOW:
      return new FlowBuff(duration);
    case BuffType.WATER_RESIST:
      return new WaterResistBuff(duration);
    case BuffType.WATER_SOAK:
      return new WaterSoakBuff();
    // 超能属性奥秘流专用Buff
    case BuffType.MIND_SHIELD:
      return createMindShieldBuff({ maxHp: 100, heal: () => 0, takeDamage: () => 0 } as BuffCombatUnit);
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
    case BuffType.LIGHT_GATHER:
      return new LightGatherBuff();
    case BuffType.FRAGRANT_ENV:
      return new FragrantEnvBuff();
    case BuffType.COUNTER_STANCE:
      return new CounterStanceBuff();
    case BuffType.NUTRIENT:
      return new NutrientBuff();
    case BuffType.ROOT_BOUND:
      return new RootBoundBuff(duration);
    // 岩石属性防御流专用Buff
    case BuffType.ROCK_ARMOR:
      return new RockArmorBuff();
    case BuffType.IRON_WALL:
      return new IronWallBuff();
    case BuffType.QUAKE_BODY:
      return new QuakeBodyBuff();
    // 电属性电磁脉冲流专用Buff
    case BuffType.CHARGE:
      return new ChargeBuff();
    case BuffType.OVERLOAD:
      return new OverloadBuff(duration);
    case BuffType.CHARGING:
      return new ChargingBuff(duration);
    case BuffType.ELECTRIC_FIELD_BUFF:
      return new ElectricFieldBuff(duration);
    case BuffType.STATIC_BODY:
      return new StaticBodyBuff(duration);
    case BuffType.ELECTRIC_DEFLECT:
      return new ElectricDeflectBuff(duration);
    default:
      throw new Error(`Unknown BuffType: ${type}`);
  }
}

/**
 * 创建护盾Buff（带CombatUnit参数）
 */
export function createShieldBuff(unit: BuffCombatUnit, value?: number): ShieldBuff {
  return new ShieldBuff(unit, value);
}

/**
 * 创建火盾Buff（带CombatUnit参数）
 */
export function createFireShieldBuff(unit: BuffCombatUnit, shieldValue: number = 50, counterDamage: number = 30): FireShieldBuff {
  return new FireShieldBuff(unit, shieldValue, counterDamage);
}

/**
 * 创建水盾Buff（带CombatUnit参数）
 */
export function createWaterShieldBuff(unit: BuffCombatUnit, shieldValue: number = 80, damageReduction: number = 0.2): WaterShieldBuff {
  return new WaterShieldBuff(unit, shieldValue, damageReduction);
}

/**
 * 创建心智护盾Buff（带CombatUnit参数）
 */
export function createMindShieldBuff(unit: BuffCombatUnit, value: number = 60, ppDrainPerHit: number = 1): MindShieldBuff {
  return new MindShieldBuff(unit, value, ppDrainPerHit);
}

// ==================== 电属性电磁脉冲流专用Buff导出 ====================

export {
  ChargeBuff,
  OverloadBuff,
  ChargingBuff,
  ElectricFieldBuff,
  StaticBodyBuff,
  ElectricDeflectBuff
};
