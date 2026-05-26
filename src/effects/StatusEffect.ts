/**
 * 循迹之境 - 状态效果基类
 */

import { BuffType, DebuffType } from '../types';

/**
 * 状态效果基类
 */
export abstract class StatusEffect {
  id: string;
  name: string;
  stacks: number;
  duration: number;
  remainingDuration: number;
  
  constructor(name: string, stacks: number = 1, duration: number = 3) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.stacks = stacks;
    this.duration = duration;
    this.remainingDuration = duration;
  }
  
  onTurnStart(_unit: any): void {}
  onTurnEnd(_unit: any): void {}
  onDamaged(_unit: any, _damage: number): void {}
  onDealDamage(_unit: any, _damage: number, _target: any): void {}
  onUseAction(_unit: any): void {}
  onHealed(_unit: any, _amount: number): void {}
  
  isExpired(): boolean {
    return this.remainingDuration <= 0;
  }
  
  abstract clone(): StatusEffect;
}

/**
 * Buff基类
 */
export abstract class Buff extends StatusEffect {
  type: BuffType;
  isVolatile: boolean;
  
  constructor(name: string, type: BuffType, stacks: number = 1, duration: number = 3) {
    super(name, stacks, duration);
    this.type = type;
    this.isVolatile = false;
  }
}

/**
 * Debuff基类
 */
export abstract class Debuff extends StatusEffect {
  type: DebuffType;
  canBeCleansed: boolean;
  
  constructor(name: string, type: DebuffType, stacks: number = 1, duration: number = 3) {
    super(name, stacks, duration);
    this.type = type;
    this.canBeCleansed = true;
  }
}
