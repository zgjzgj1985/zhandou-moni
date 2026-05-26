/**
 * 循迹之境 - 冰属性·减速流技能库
 * 
 * 基于"冰属性 → 减速流/控制流"设计
 * 核心机制：冻结、减速、限制行动，战场控制
 * 
 * 技能分类：
 * - 攻击倾向（4种）：冰冻之风、绝对零度、冰晶贯穿、凛冬之怒
 * - 防御倾向（3种）：冰霜护甲、冰晶反射、极寒领域
 * - 辅助倾向（3种）：寒气凝聚、冰封禁制、绝对零域
 */

import {
  Skill,
  SkillDefinition,
  SkillEffect
} from './Skill';
import {
  SkillTarget,
  DamageType,
  ElementType,
  EnergyCost,
  SkillTendency,
  SKILL_TENDENCY_TEXT,
  getEnergyCostText
} from '../types';
import {
  Buff,
  Debuff,
  IceArmorBuff,
  IceReflectBuff,
  IceResistBuff,
  FreezeDebuff,
  SlowDebuff,
  IceSealDebuff,
  IceDotDebuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 辅助函数：创建带效果的技能定义 ====================

/**
 * 创建攻击技能（含减速效果）
 */
function createIceAttackWithSlow(
  id: string,
  name: string,
  description: string,
  basePower: number,
  target: SkillTarget,
  energyCost: number,
  slowDuration: number = 2
): SkillDefinition {
  return {
    id,
    name,
    description,
    type: 'action',
    energyCost,
    target,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'slow' as any,
        duration: slowDuration,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰减速流·攻击',
    tags: ['冰', '减速流', '攻击', '软控制']
  };
}

/**
 * 创建攻击技能（含冻结效果）
 */
function createIceAttackWithFreeze(
  id: string,
  name: string,
  description: string,
  basePower: number,
  target: SkillTarget,
  energyCost: number,
  freezeChance: number = 0.2
): SkillDefinition {
  return {
    id,
    name,
    description,
    type: 'action',
    energyCost,
    target,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'freeze' as any,
        duration: 999,
        successRate: freezeChance
      }
    }],
    category: '冰减速流·攻击',
    tags: ['冰', '减速流', '攻击', '硬控制', '冻结']
  };
}

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】冰冻之风
 * 攻击单体目标，造成55威力伤害，并使目标陷入「减速」状态
 * 减速：速度-1级（持续2回合）
 */
export const FREEZE_WIND: Skill = (() => {
  const definition = createIceAttackWithSlow(
    'freeze_wind',
    '冰冻之风',
    '攻击单体目标，造成55威力冰系伤害，使目标「减速」（速度-1级，持续2回合）',
    55,
    SkillTarget.SINGLE,
    2,
    2
  );
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】绝对零度
 * 攻击目标，造成80威力伤害，20%概率冻结目标
 * 冻结：完全无法行动，每回合20%概率自行解除
 */
export const ABSOLUTE_ZERO: Skill = (() => {
  const definition = createIceAttackWithFreeze(
    'absolute_zero',
    '绝对零度',
    '攻击单体目标，造成80威力冰系伤害，20%概率使目标「冻结」（无法行动，每回合20%解冻）',
    80,
    SkillTarget.SINGLE,
    3,
    0.2
  );
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】冰晶贯穿
 * 攻击单体目标，造成100威力伤害
 * 对已被减速的目标，伤害+30%（无视减速效果的抗性减免）
 */
export const ICE_CRYSTAL_PIERCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_crystal_pierce',
    name: '冰晶贯穿',
    description: '攻击单体目标，造成100威力冰系伤害，对已减速目标伤害+30%',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 100,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      }
    }],
    category: '冰减速流·攻击',
    tags: ['冰', '减速流', '攻击', '无视抗性']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】凛冬之怒
 * 对敌方全体造成60威力伤害，使所有敌人「减速」（速度-1级，持续2回合）
 * 蓄力1回合，高风险高回报的终极技能
 */
export const WINTERS_FURY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'winters_fury',
    name: '凛冬之怒',
    description: '蓄力1回合后对敌方全体造成60威力伤害，使所有敌人「减速」（速度-1级，持续2回合）【蓄力可被打断】',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'slow' as any,
        duration: 2,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰减速流·攻击',
    tags: ['冰', '减速流', '攻击', '群体', '蓄力', '减速']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】冰霜护甲
 * 为己方单体生成50点护盾值，持续3回合
 * 护盾存在期间，对冰属性攻击抗性+30%
 */
export const ICE_ARMOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_armor',
    name: '冰霜护甲',
    description: '为己方单体生成50点护盾（持续3回合），期间对冰属性攻击抗性+30%',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 50,
        duration: 3
      },
      applyBuff: {
        buffType: 'ice_armor' as any,
        duration: 3
      }
    }],
    category: '冰减速流·防御',
    tags: ['冰', '减速流', '防御', '护盾', '抗性']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】冰晶反射
 * 获得「冰晶反射」状态，持续2回合
 * 反射下一次冰属性攻击，并对攻击者附加「减速」状态
 */
export const ICE_REFLECT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_reflect',
    name: '冰晶反射',
    description: '获得「冰晶反射」（持续2回合），反弹下次冰属性攻击并使攻击者「减速」',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'ice_reflect' as any,
        duration: 2
      }
    }],
    category: '冰减速流·防御',
    tags: ['冰', '减速流', '防御', '反射', '减速']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】极寒领域
 * 为己方全体生成30点护盾（持续2回合）
 * 护盾存在期间，所有友方对「减速」状态的抗性+50%
 */
export const FREEZING_FIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'freezing_field',
    name: '极寒领域',
    description: '为己方全体生成30点护盾（持续2回合），期间对「减速」抗性+50%',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 30,
        duration: 2
      },
      applyBuff: {
        buffType: 'ice_resist' as any,
        duration: 2
      }
    }],
    category: '冰减速流·防御',
    tags: ['冰', '减速流', '防御', '群体护盾', '减速抗性']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】寒气凝聚
 * 使己方单体速度+2级，持续3回合
 * 加速己方核心单位，抢占先手
 */
export const COLD_AURA: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'cold_aura',
    name: '寒气凝聚',
    description: '为己方单体赋予「寒气凝聚」，速度+2级（持续3回合）',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      statBoost: {
        stat: 'speed',
        stages: 2,
        duration: 3
      }
    }],
    category: '冰减速流·辅助',
    tags: ['冰', '减速流', '辅助', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】冰封禁制
 * 指定1个敌方目标，使其陷入「冰封禁制」状态（持续2回合）
 * 冰封禁制：无法使用能量≥3的技能
 */
export const ICE_SEAL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_seal',
    name: '冰封禁制',
    description: '指定敌人，施加「冰封禁制」（持续2回合）：无法使用能量≥3的技能',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'ice_seal' as any,
        duration: 2,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰减速流·辅助',
    tags: ['冰', '减速流', '辅助', '封印', '能量限制']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】绝对零域
 * 全场敌人速度-2级（持续3回合），每回合受到20点冰系持续伤害
 * 终极减速控制技能，全面压制敌方节奏
 */
export const ABSOLUTE_ZERO_FIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'absolute_zero_field',
    name: '绝对零域',
    description: '全场敌人速度-2级（持续3回合），每回合受到20点冰系持续伤害【终极减速技能】',
    type: 'action',
    energyCost: 6,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      statBoost: {
        stat: 'speed',
        stages: -2,
        duration: 3
      },
      applyDebuff: {
        debuffType: 'ice_dot' as any,
        duration: 3,
        stacks: 1
      }
    }],
    category: '冰减速流·辅助',
    tags: ['冰', '减速流', '辅助', '群体减速', '持续伤害', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 冰减速流技能库导出 ====================

/**
 * 冰属性·减速流技能库
 */
export const ICE_CONTROL_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    FREEZE_WIND,
    ABSOLUTE_ZERO,
    ICE_CRYSTAL_PIERCE,
    WINTERS_FURY
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    ICE_ARMOR,
    ICE_REFLECT,
    FREEZING_FIELD
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    COLD_AURA,
    ICE_SEAL,
    ABSOLUTE_ZERO_FIELD
  },
  
  // 全部技能
  ALL: [
    FREEZE_WIND,
    ABSOLUTE_ZERO,
    ICE_CRYSTAL_PIERCE,
    WINTERS_FURY,
    ICE_ARMOR,
    ICE_REFLECT,
    FREEZING_FIELD,
    COLD_AURA,
    ICE_SEAL,
    ABSOLUTE_ZERO_FIELD
  ]
};

/**
 * 获取技能倾向标签
 */
export function getIceSkillTendencyLabel(skill: Skill): string {
  const tendency = skill.definition.tendency;
  if (!tendency) return '无倾向';
  
  switch (tendency) {
    case SkillTendency.ATTACK:
      return '【攻击】';
    case SkillTendency.DEFENSE:
      return '【防御】';
    case SkillTendency.SUPPORT:
      return '【辅助】';
    default:
      return '【无倾向】';
  }
}

/**
 * 获取技能完整描述（含倾向）
 */
export function getFullIceSkillDescription(skill: Skill): string {
  const tendencyLabel = getIceSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
