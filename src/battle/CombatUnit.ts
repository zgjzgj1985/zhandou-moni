/**
 * 循迹之境 - 战斗单位基类
 */

import {
  ElementType,
  getTypeMultiplier,
  SpeedStats,
  calculateActualSpeed,
  Intent,
  IntentType,
  BuffType,
  DebuffType
} from '../types';
import { Buff, BlazeWillBuff } from '../effects/buffs';
import { Debuff } from '../effects/debuffs';
import { Trait } from '../skills/traits';

/**
 * 战斗单位能力等级
 */
export interface StatStages {
  attack: number;      // 攻击 -6~+6
  defense: number;     // 防御 -6~+6
  spAttack: number;    // 特攻 -6~+6
  spDefense: number;   // 特防 -6~+6
  speed: number;       // 速度 -6~+6
}

/**
 * 能力等级映射表
 */
export const STAT_STAGES: Record<number, number> = {
  [-6]: 0.5,  [-5]: 0.55, [-4]: 0.6,  [-3]: 0.67, [-2]: 0.75,
  [-1]: 0.8,
  [0]: 1.0,
  [1]: 1.25, [2]: 1.5,  [3]: 1.75, [4]: 2.0,  [5]: 2.25, [6]: 2.5
};

/**
 * 战斗单位基类
 */
export abstract class CombatUnit {
  // 基本属性
  id: string;
  name: string;
  level: number;
  
  // 生命值
  maxHp: number;
  currentHp: number;
  
  // 基础属性
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  
  // 速度
  speed: SpeedStats;
  
  // 元素属性（最多2个）
  elements: ElementType[];
  
  // 能力等级
  stages: StatStages;
  
  // 状态效果
  buffs: Buff[];
  debuffs: Debuff[];
  
  // 护盾
  shield: number;

  // 上次受到的伤害（用于反击类效果计算）
  lastDamageTaken: number;

  // 属性抗性 { fire: 0.3, water: 0, ice: -0.2 } 正数=减伤，负数=增伤
  resistances: Record<string, number>;

  // 技能和特性
  traits: Trait[];
  
  // 战斗状态
  isDead: boolean;
  isStaggered: boolean;  // 踉跄：下次攻击伤害-50%
  
  constructor(config: UnitConfig) {
    this.id = config.id ?? crypto.randomUUID();
    this.name = config.name;
    this.level = config.level ?? 1;
    
    this.maxHp = config.maxHp;
    this.currentHp = config.currentHp ?? config.maxHp;
    
    this.attack = config.attack;
    this.defense = config.defense;
    this.spAttack = config.spAttack ?? config.attack;
    this.spDefense = config.spDefense ?? config.defense;
    
    this.speed = config.speed ?? {
      baseSpeed: 50,
      speedStage: 0,
      speedBonus: 0
    };
    
    this.elements = config.elements ?? [];
    
    this.stages = config.stages ?? {
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0
    };
    
    this.buffs = [];
    this.debuffs = [];
    this.shield = 0;
    this.resistances = config.resistances ?? {};

    this.traits = config.traits ?? [];
    
    this.isDead = false;
    this.isStaggered = false;
  }
  
  // ==================== 属性计算 ====================
  
  /**
   * 获取实际攻击力
   */
  getActualAttack(damageType: 'physical' | 'special'): number {
    const base = damageType === 'physical' ? this.attack : this.spAttack;
    const stage = damageType === 'physical' ? this.stages.attack : this.stages.spAttack;
    const multiplier = STAT_STAGES[stage] ?? 1;
    return Math.floor(base * multiplier);
  }
  
  /**
   * 获取实际防御力
   */
  getActualDefense(damageType: 'physical' | 'special'): number {
    const base = damageType === 'physical' ? this.defense : this.spDefense;
    const stage = damageType === 'physical' ? this.stages.defense : this.stages.spDefense;
    const multiplier = STAT_STAGES[stage] ?? 1;
    return Math.floor(base * multiplier);
  }
  
  /**
   * 获取实际速度
   */
  getActualSpeed(): number {
    const actualSpeed: SpeedStats = {
      ...this.speed,
      speedStage: this.stages.speed
    };
    return calculateActualSpeed(actualSpeed);
  }

  /**
   * 修改能力等级
   * @param stat 属性名称
   * @param amount 变化量（正数提升，负数下降）
   */
  modifyStat(stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed', amount: number): void {
    const oldValue = this.stages[stat];
    const newValue = Math.max(-6, Math.min(6, oldValue + amount));
    this.stages[stat] = newValue;
  }

  // ==================== HP管理 ====================

  /**
   * 受到伤害
   * @returns 实际受到的伤害（扣除护盾和减伤后）
   */
  takeDamage(amount: number, damageType: 'physical' | 'special' = 'physical'): number {
    if (this.isDead) return 0;

    let actualDamage = amount;

    // 先扣护盾
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, actualDamage);
      this.shield -= absorbed;
      actualDamage -= absorbed;
    }

    // 应用防御Buff的减伤效果
    const damageReductionBuff = this.buffs.find(b =>
      b.type === BuffType.VINE_BODY ||
      b.type === BuffType.ICE_ARMOR ||
      b.type === BuffType.ROCK_ARMOR ||
      b.type === BuffType.IRON_WALL ||
      b.type === BuffType.QUAKE_BODY ||
      b.type === BuffType.FLAME_BODY ||
      b.type === BuffType.FIRE_SHIELD
    );
    if (damageReductionBuff) {
      const reduction = (damageReductionBuff as any).getDamageReduction?.() ?? 0;
      if (reduction > 0) {
        actualDamage = Math.floor(actualDamage * (1 - reduction));
      }
    }

    // 护盾吸收不完，直接扣除HP
    if (actualDamage > 0) {
      this.currentHp = Math.max(0, this.currentHp - actualDamage);
    }

    // 记录受到的伤害（用于反击类效果计算）
    this.lastDamageTaken = actualDamage;

    // 检查死亡
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
    }

    return actualDamage;
  }
  
  /**
   * 治疗
   * @returns 实际治疗量
   */
  heal(amount: number): number {
    if (this.isDead) return 0;
    
    const oldHp = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    return this.currentHp - oldHp;
  }
  
  /**
   * 造成真实伤害（无视防御）
   */
  takeTrueDamage(amount: number): number {
    if (this.isDead) return 0;
    
    this.currentHp = Math.max(0, this.currentHp - amount);
    
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
    }
    
    return amount;
  }
  
  // ==================== Buff/Debuff管理 ====================
  
  /**
   * 添加Buff
   * @param buff 要添加的Buff实例
   * @param maxStacks 最大叠加层数（可选，用于可叠加Buff）
   */
  addBuff(buff: Buff, maxStacks?: number): void {
    const existing = this.buffs.find(b => b.type === buff.type);
    if (existing) {
      // 对于可叠加的Buff（如PowerBuff、GrowthBuff等），增加层数
      const effectiveMaxStacks = maxStacks ?? existing.stacks + buff.stacks;
      existing.stacks = Math.min(existing.stacks + buff.stacks, effectiveMaxStacks);
      // 更新持续时间（取较长的持续时间）
      existing.remainingDuration = Math.max(existing.remainingDuration, buff.remainingDuration);
    } else {
      this.buffs.push(buff);
    }
  }
  
  /**
   * 移除Buff
   */
  removeBuff(type: BuffType): void {
    this.buffs = this.buffs.filter(b => b.type !== type);
  }
  
  /**
   * 添加Debuff
   */
  addDebuff(debuff: Debuff): void {
    // 检查是否可叠加
    const existing = this.debuffs.find(d => d.type === debuff.type);
    if (existing) {
      existing.stacks += debuff.stacks;
      existing.remainingDuration = debuff.duration;
    } else {
      this.debuffs.push(debuff);
    }
  }
  
  /**
   * 移除Debuff
   */
  removeDebuff(type: DebuffType): void {
    this.debuffs = this.debuffs.filter(d => d.type !== type);
  }
  
  /**
   * 清除所有可净化的Debuff
   */
  cleanseDebuffs(): void {
    this.debuffs = this.debuffs.filter(d => !d.canBeCleansed);
  }
  
  // ==================== 回合结算 ====================
  
  /**
   * 回合开始时结算
   */
  onTurnStart(): void {
    if (this.isDead) return;
    
    // DOT结算
    for (const debuff of this.debuffs) {
      debuff.onTurnStart(this);
    }
    
    // Buff回合开始
    for (const buff of this.buffs) {
      buff.onTurnStart(this);
    }
    
    // 清除过期效果
    this.buffs = this.buffs.filter(b => !b.isExpired());
    this.debuffs = this.debuffs.filter(d => !d.isExpired());
    
    // 检查死亡
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
    }
  }
  
  /**
   * 回合结束时结算
   */
  onTurnEnd(): void {
    if (this.isDead) return;
    
    // Buff回合结束
    for (const buff of this.buffs) {
      buff.onTurnEnd(this);
    }
    
    // Debuff回合结束
    for (const debuff of this.debuffs) {
      debuff.onTurnEnd(this);
    }
    
    // 清除过期效果
    this.buffs = this.buffs.filter(b => !b.isExpired());
    this.debuffs = this.debuffs.filter(d => !d.isExpired());
  }
  
  // ==================== 伤害计算 ====================
  
  /**
   * 计算伤害（考虑属性克制）
   */
  calculateDamage(
    basePower: number,
    target: CombatUnit,
    damageType: 'physical' | 'special',
    element?: ElementType
  ): number {
    const attack = this.getActualAttack(damageType);
    const defense = target.getActualDefense(damageType);

    // 基础伤害公式（简化版）
    let damage = Math.floor((this.level * 2 / 5 + 2) * basePower * attack / defense / 50) + 2;

    // 属性克制
    if (element && target.elements.length > 0) {
      const multiplier = getTypeMultiplier(element, target.elements);
      damage = Math.floor(damage * multiplier);
    }

    // 属性抗性（抗性为正数时减少伤害）
    if (element && target.resistances[element] > 0) {
      damage = Math.floor(damage * (1 - target.resistances[element]));
    }

    // 火属性伤害加成（炎之意志等Buff）
    if (element === ElementType.FIRE) {
      const blazeWillBuff = this.buffs.find(b => b.type === BuffType.BLAZE_WILL);
      if (blazeWillBuff) {
        const blazeWill = blazeWillBuff as BlazeWillBuff;
        if (blazeWill.getFireDamageMultiplier) {
          const multiplier = blazeWill.getFireDamageMultiplier();
          damage = Math.floor(damage * multiplier);
        }
      }
    }

    // 考虑力量Buff
    const powerBuff = this.buffs.find(b => b.type === BuffType.POWER);
    if (powerBuff) {
      damage += powerBuff.stacks;
    }

    // 考虑虚弱Debuff
    const weaknessDebuff = target.debuffs.find(d => d.type === DebuffType.WEAKNESS);
    if (weaknessDebuff) {
      const reduction = Math.min(weaknessDebuff.stacks * 3, damage - 1);
      damage = Math.max(1, damage - reduction);
    }

    // 考虑踉跄
    if (this.isStaggered) {
      damage = Math.floor(damage * 0.5);
      this.isStaggered = false;
    }

    return Math.max(1, damage);
  }
  
  // ==================== 状态查询 ====================
  
  /**
   * 获取HP百分比
   */
  getHpPercent(): number {
    return this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
  }
  
  /**
   * 是否可以被攻击
   */
  canBeAttacked(): boolean {
    return !this.isDead;
  }

  // ==================== 抗性管理 ====================

  /**
   * 添加属性抗性
   * @param element 属性名称
   * @param value 抗性值（正数=减伤，负数=增伤）
   */
  addResistance(element: string, value: number): void {
    const current = this.resistances[element] ?? 0;
    this.resistances[element] = current + value;
  }

  /**
   * 设置属性抗性（覆盖）
   */
  setResistance(element: string, value: number): void {
    this.resistances[element] = value;
  }

  /**
   * 获取属性抗性
   */
  getResistance(element: string): number {
    return this.resistances[element] ?? 0;
  }
  
  /**
   * 是否无任何状态（Buff和Debuff）
   * 用于"落石"等技能的判定
   */
  hasNoStatus(): boolean {
    return this.buffs.length === 0 && this.debuffs.length === 0;
  }

  /**
   * 获取状态摘要
   */
  getStatusSummary(): UnitStatusSummary {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      hp: this.currentHp,
      maxHp: this.maxHp,
      hpPercent: this.getHpPercent(),
      shield: this.shield,
      isDead: this.isDead,
      buffs: this.buffs.map(b => ({ type: b.type, stacks: b.stacks, remainingDuration: b.remainingDuration })),
      debuffs: this.debuffs.map(d => ({ type: d.type, stacks: d.stacks, remainingDuration: d.remainingDuration }))
    };
  }
}

/**
 * 单位配置
 */
export interface UnitConfig {
  id?: string;
  name: string;
  level?: number;
  maxHp: number;
  currentHp?: number;
  attack: number;
  defense: number;
  spAttack?: number;
  spDefense?: number;
  speed?: SpeedStats;
  elements?: ElementType[];
  stages?: StatStages;
  traits?: Trait[];
  resistances?: Record<string, number>;  // 属性抗性 { fire: 0.3 }
}

/**
 * 单位状态摘要
 */
export interface UnitStatusSummary {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  hpPercent: number;
  shield: number;
  isDead: boolean;
  buffs: Array<{ type: BuffType; stacks: number; remainingDuration: number }>;
  debuffs: Array<{ type: DebuffType; stacks: number; remainingDuration: number }>;
}

// 用于calculateDamage中的level引用已移除
