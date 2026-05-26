/**
 * 循迹之境 - Buff系统实现
 * 以太术士风格
 */

import { BuffType } from '../types';

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
    default:
      throw new Error(`Unknown BuffType: ${type}`);
  }
}
