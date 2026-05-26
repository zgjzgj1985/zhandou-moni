/**
 * 循迹之境 - 技能基类
 */

import {
  SkillTarget,
  DamageType,
  ElementType,
  EnergyCost,
  SkillTendency
} from '../types';
import { Buff } from '../effects';
import { Debuff } from '../effects';

/**
 * 技能效果
 */
export interface SkillEffect {
  // 伤害效果
  damage?: {
    basePower: number;
    damageType: DamageType;
    element?: ElementType;
    hits?: number;        // 攻击次数
    guaranteed?: boolean; // 是否必定触发（如爆炸烈焰的必定灼伤）
    extraEffect?: 'burn_mark' | 'ice_dot'; // 额外效果类型
    typeBonus?: {         // 属性克制加成
      targetElement: ElementType;
      multiplier: number; // 倍率，如2表示克制时伤害翻倍
    };
  };

  // 治疗效果
  healing?: {
    amount: number;
    percent?: number;     // 百分比治疗
  };

  // 护盾效果
  shield?: {
    amount: number;
    duration?: number;    // 持续回合，默认999（整场）
  };

  // Buff效果
  applyBuff?: {
    buffType: BuffType | string;
    duration?: number;
    stacks?: number;
    value?: number;       // 效果值（如护盾量、增伤比例等）
  };

  // Debuff效果（单体）
  applyDebuff?: {
    debuffType: DebuffType | string;
    duration?: number;
    stacks?: number;
    maxStacks?: number;  // 最大层数（如冰霜3层触发冻结）
    successRate?: number; // 命中率/触发率
    value?: number;       // 效果值（如伤害百分比等）
  };

  // Debuff效果（群体）
  applyDebuffAll?: {
    debuffType: DebuffType | string;
    duration?: number;
    stacks?: number;
    maxStacks?: number;  // 最大层数
    successRate?: number; // 命中率/触发率
    value?: number;
  };

  // 状态提升效果（速度、攻击等）
  statBoost?: {
    stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';
    stages: number;
    duration?: number;
  };

  // 蓄力效果
  charge?: {
    turns: number;
    canBeInterrupted: boolean;
  };

  // 延迟效果
  delay?: {
    turns: number;          // 延迟回合数
    effect: SkillEffect;    // 延迟触发的效果
  };

  // 特殊效果
  special?: {
    type: 'reflect' | 'counter' | 'drain' | 'chain' | 'cleanse' | 'consume_buff_heal' | 'delay_damage' | 'water_shield_counter' | 'counter_slow' | 'static_charge' | 'chain_damage' | 'extra_attack_damage' | 'ice_shatter' | 'shatter_follow_up';
    value?: number;
    targetElement?: ElementType;  // 用于破冰判定
  };

  // 属性抗性效果
  resistance?: {
    element: string;      // 属性名称
    value: number;       // 抗性值（正数=减伤百分比，如0.3=减伤30%）
    duration: number;     // 持续回合
  };
}

/**
 * 技能定义
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'trait';
  
  // 能量消耗系统（替代PP）
  energyCost: number;      // 能量消耗值
  
  // 目标
  target: SkillTarget;
  
  // 效果
  effects: SkillEffect[];
  
  // 元数据
  category?: string;     // 分类
  tags?: string[];       // 标签
  
  // 技能倾向
  tendency?: SkillTendency;
  
  // 蓄力相关
  chargeTurns?: number;   // 蓄力回合数
  canBeInterrupted?: boolean; // 蓄力是否可被打断

  // 延迟效果
  delay?: {
    turns: number;          // 延迟回合数
    effect: SkillEffect;    // 延迟触发的效果
  };
}

/**
 * 技能实例
 */
export class Skill {
  id: string;
  definition: SkillDefinition;
  
  constructor(definition: SkillDefinition) {
    this.id = definition.id;
    this.definition = definition;
  }
  
  /**
   * 获取技能名称
   */
  get name(): string {
    return this.definition.name;
  }
  
  /**
   * 获取技能描述
   */
  get description(): string {
    return this.definition.description;
  }
  
  /**
   * 获取能量消耗
   */
  get energyCost(): number {
    return this.definition.energyCost;
  }
  
  /**
   * 检查能量是否足够
   * @param currentEnergy 当前拥有的能量
   */
  canUse(currentEnergy: number): boolean {
    return currentEnergy >= this.definition.energyCost;
  }
  
  /**
   * 使用技能后消耗能量
   * @returns 消耗的能量值
   */
  getEnergyConsumption(): number {
    return this.definition.energyCost;
  }
}

/**
 * 创建技能工厂函数
 */
export function createSkill(definition: SkillDefinition): Skill {
  return new Skill({ ...definition });
}
