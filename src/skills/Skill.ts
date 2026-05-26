/**
 * 循迹之境 - 技能基类
 */

import {
  SkillTarget,
  DamageType,
  ElementType
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
  };
  
  // 治疗效果
  healing?: {
    amount: number;
    percent?: number;     // 百分比治疗
  };
  
  // 护盾效果
  shield?: {
    amount: number;
  };
  
  // Buff效果
  applyBuff?: {
    buff: Buff;
    target: SkillTarget;
  };
  
  // Debuff效果
  applyDebuff?: {
    debuff: Debuff;
    target: SkillTarget;
    successRate?: number; // 命中率
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
  
  // PP系统
  pp: number;            // 当前PP
  ppMax: number;         // PP上限
  
  // 目标
  target: SkillTarget;
  
  // 效果
  effects: SkillEffect[];
  
  // 元数据
  category?: string;     // 分类
  tags?: string[];       // 标签
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
   * 检查PP是否足够
   */
  canUse(): boolean {
    return this.definition.pp > 0;
  }
  
  /**
   * 使用技能
   */
  use(): void {
    if (!this.canUse()) {
      throw new Error(`技能 ${this.name} PP不足`);
    }
    this.definition.pp--;
  }
  
  /**
   * 恢复PP
   */
  restorePP(amount: number): void {
    this.definition.pp = Math.min(this.definition.pp + amount, this.definition.ppMax);
  }
  
  /**
   * 重置PP
   */
  resetPP(): void {
    this.definition.pp = this.definition.ppMax;
  }
  
  /**
   * 获取PP信息
   */
  getPPInfo(): { current: number; max: number } {
    return {
      current: this.definition.pp,
      max: this.definition.ppMax
    };
  }
}

/**
 * 创建技能工厂函数
 */
export function createSkill(definition: SkillDefinition): Skill {
  return new Skill({ ...definition });
}
