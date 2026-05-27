/**
 * 循迹之境 - 电属性·电磁脉冲流特性系统
 * 
 * 特性列表：
 * - 静电亲和：攻击时额外+1电荷
 * - 电磁感应：电荷≥3层时速度+15%
 * - 放电体质：受攻击时攻击者获得静电debuff
 * - 绝缘体质：免疫麻痹状态
 */

import { Trait, TraitDefinition, TraitType, TriggerTiming } from './index';

/**
 * 电属性特性库
 */
export const ELECTRIC_TRAITS_V2: Record<string, TraitDefinition> = {
  /**
   * 静电亲和：攻击时额外+1电荷
   * 效果：电系技能命中时，额外积累1层电荷
   */
  STATIC_AFFINITY: {
    id: 'static_affinity',
    name: '静电亲和',
    description: '攻击时额外+1层电荷',
    type: TraitType.TRIGGER,
    triggerTiming: TriggerTiming.ON_ATTACK,
    effect: {
      buff: {
        type: 'charge_bonus',
        stacks: 1,
        duration: 0  // 一次性效果
      }
    }
  },

  /**
   * 电磁感应：电荷≥3层时速度+15%
   * 效果：被动提升速度
   */
  ELECTROMAGNETIC_INDUCTION: {
    id: 'electromagnetic_induction',
    name: '电磁感应',
    description: '电荷≥3层时速度+15%',
    type: TraitType.CONDITIONAL,
    effect: {
      statChange: {
        speed: 1  // +15%速度
      }
    }
  },

  /**
   * 放电体质：受到攻击时，攻击者获得静电debuff
   * 效果：反击式积累电荷
   */
  DISCHARGE_CONSTITUTION: {
    id: 'discharge_constitution',
    name: '放电体质',
    description: '受到攻击时，攻击者获得1层静电',
    type: TraitType.TRIGGER,
    triggerTiming: TriggerTiming.ON_DAMAGED,
    effect: {
      debuff: {
        type: 'static',
        stacks: 1,
        duration: 3
      }
    }
  },

  /**
   * 绝缘体质：免疫麻痹状态
   * 效果：对麻痹状态免疫
   */
  INSULATION_CONSTITUTION: {
    id: 'insulation_constitution',
    name: '绝缘体质',
    description: '免疫麻痹状态',
    type: TraitType.PASSIVE,
    effect: {
      statChange: {
        defense: 0  // 特殊效果标记
      }
    }
  }
};

/**
 * 获取电属性特性定义
 */
export function getElectricTrait(id: string): TraitDefinition | undefined {
  return ELECTRIC_TRAITS_V2[id];
}

/**
 * 创建电属性特性实例
 */
export function createElectricTrait(id: string): Trait | undefined {
  const definition = getElectricTrait(id);
  if (!definition) return undefined;
  return new Trait(definition);
}

/**
 * 检查特性是否提供电荷加成
 */
export function hasChargeBonusTrait(traits: string[]): boolean {
  return traits.includes('static_affinity');
}

/**
 * 检查特性是否提供静电debuff
 */
export function hasStaticDebuffTrait(traits: string[]): boolean {
  return traits.includes('discharge_constitution');
}

/**
 * 检查特性是否免疫麻痹
 */
export function isImmuneToParalysis(traits: string[]): boolean {
  return traits.includes('insulation_constitution');
}
