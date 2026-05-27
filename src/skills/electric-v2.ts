/**
 * 循迹之境 - 电属性·电磁脉冲流技能库 v2.0
 * 
 * 基于"电属性 → 电磁脉冲流/蓄能爆发流"设计
 * 核心机制：电荷积累、脉冲爆发、先手压制
 * 
 * 技能分类：
 * - 攻击倾向（3种）：电光一闪、雷鸣击、电磁脉冲
 * - 防御倾向（2种）：蓄电护体、电磁偏转
 * - 辅助倾向（3种）：充能加速、电场展开、静电标记
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
  BuffType,
  DebuffType
} from '../types';
import {
  Buff,
  Debuff
} from '../effects';

/**
 * ==================== 攻击倾向技能（3种）====================
 */

/**
 * 【攻击倾向1】电光一闪
 * 如闪电般快速的斩击，必定先手攻击，45威力物理伤害
 * 命中后积累1层电荷，配合「静电亲和」特性可+2层/次
 */
export const ZAP_STRIKE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'zap_strike',
    name: '电光一闪',
    description: '如闪电般快速的斩击，必定先手攻击，造成45威力电属性物理伤害，命中后积累1层电荷',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 45,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ELECTRIC
      }
    }, {
      // 先手+1效果
      special: {
        type: 'priority',
        value: 1
      }
    }],
    category: '电属性电磁脉冲流·攻击',
    tags: ['电', '电磁脉冲流', '攻击', '先手+1', '物理', '蓄电']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】雷鸣击
 * 释放强力电击，90威力特殊伤害，命中后积累1层电荷，30%概率使目标麻痹
 */
export const THUNDER_STRIKE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_strike',
    name: '雷鸣击',
    description: '释放强力电击，造成90威力电属性特殊伤害，命中后积累1层电荷，30%概率使目标麻痹',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }, {
      applyDebuff: {
        debuffType: DebuffType.PARALYSIS,
        duration: 2,
        successRate: 0.3
      }
    }],
    category: '电属性电磁脉冲流·攻击',
    tags: ['电', '电磁脉冲流', '攻击', '麻痹', '控场']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】电磁脉冲（核心技能）
 * 释放电磁脉冲，60威力特殊伤害
 * 消耗所有电荷层数，每消耗1层电荷，攻击次数+1
 */
export const ELECTROMAGNETIC_PULSE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electromagnetic_pulse',
    name: '电磁脉冲',
    description: '释放电磁脉冲爆发！消耗所有电荷层数，造成60威力电属性伤害，每消耗1层电荷，攻击次数+1',
    type: 'action',
    energyCost: EnergyCost.ULTRA,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC,
        hitsScaling: 'charge'  // 电荷层数决定连击次数
      }
    }, {
      // 电荷消耗效果
      special: {
        type: 'charge_consume',
        value: 0  // 全部消耗
      }
    }],
    category: '电属性电磁脉冲流·攻击',
    tags: ['电', '电磁脉冲流', '攻击', '终极技能', '爆发', '连击']
  };
  return new Skill(definition);
})();

/**
 * ==================== 防御倾向技能（2种）====================
 */

/**
 * 【防御倾向1】蓄电护体
 * 积蓄电能，获得50点护盾 + 积累2层电荷
 * 本回合受到攻击时，攻击者获得1层静电debuff
 */
export const STATIC_CHARGE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'static_charge',
    name: '蓄电护体',
    description: '积蓄电能，获得50点护盾+积累2层电荷。本回合受到攻击时，攻击者获得1层静电',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 50
      }
    }, {
      applyBuff: {
        buffType: BuffType.STATIC_BODY,
        duration: 1,
        value: 0.5
      }
    }],
    category: '电属性电磁脉冲流·防御',
    tags: ['电', '电磁脉冲流', '防御', '护盾', '蓄电']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】电磁偏转
 * 启动电磁护盾，下一次受到攻击时70%概率闪避并造成40威力反击伤害
 */
export const ELECTRIC_DEFLECT_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electric_deflect',
    name: '电磁偏转',
    description: '启动电磁护盾，下一次受到攻击时70%概率闪避并造成40威力反击伤害',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.ELECTRIC_DEFLECT,
        duration: 2,
        value: 0.7
      }
    }],
    category: '电属性电磁脉冲流·防御',
    tags: ['电', '电磁脉冲流', '防御', '闪避', '反击']
  };
  return new Skill(definition);
})();

/**
 * ==================== 辅助倾向技能（3种）====================
 */

/**
 * 【辅助倾向1】充能加速
 * 为目标积蓄电荷，使其获得2层电荷
 */
export const CHARGE_ACCELERATE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'charge_accelerate',
    name: '充能加速',
    description: '为目标积蓄电荷，使其获得2层电荷',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.CHARGE,
        stacks: 2
      }
    }],
    category: '电属性电磁脉冲流·辅助',
    tags: ['电', '电磁脉冲流', '辅助', '蓄能', '单体辅助']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】电场展开
 * 展开电场（持续2回合），己方全体每次攻击时额外获得1层电荷，电属性技能威力+15%
 */
export const ELECTRIC_FIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electric_field',
    name: '电场展开',
    description: '展开电场（持续2回合），己方全体每次攻击时额外获得1层电荷，电属性技能威力+15%',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.ELECTRIC_FIELD_BUFF,
        duration: 2,
        value: 0.15
      }
    }],
    category: '电属性电磁脉冲流·辅助',
    tags: ['电', '电磁脉冲流', '辅助', '环境', '增伤']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】静电标记
 * 为目标施加静电标记（持续3回合）
 * 带有静电标记的目标受到攻击时，攻击者受到雷电伤害并获得1层电荷
 */
export const STATIC_MARK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'static_mark',
    name: '静电标记',
    description: '为目标施加静电标记（持续3回合），对攻击者造成雷电伤害并使其获得1层电荷',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: DebuffType.STATIC,
        duration: 3,
        stacks: 1,
        reflectDamage: true
      }
    }],
    category: '电属性电磁脉冲流·辅助',
    tags: ['电', '电磁脉冲流', '辅助', '标记', '电荷']
  };
  return new Skill(definition);
})();

// ==================== 电属性电磁脉冲流技能库导出 ====================

/**
 * 电属性·电磁脉冲流技能库 v2.0
 */
export const ELECTRIC_PULSE_SKILLS = {
  // 攻击倾向（3种）
  ATTACK: {
    ZAP_STRIKE,
    THUNDER_STRIKE,
    ELECTROMAGNETIC_PULSE
  },

  // 防御倾向（2种）
  DEFENSE: {
    STATIC_CHARGE,
    ELECTRIC_DEFLECT_SKILL
  },

  // 辅助倾向（3种）
  SUPPORT: {
    CHARGE_ACCELERATE,
    ELECTRIC_FIELD_SKILL,
    STATIC_MARK
  },

  // 全部技能
  ALL: [
    ZAP_STRIKE,
    THUNDER_STRIKE,
    ELECTROMAGNETIC_PULSE,
    STATIC_CHARGE,
    ELECTRIC_DEFLECT_SKILL,
    CHARGE_ACCELERATE,
    ELECTRIC_FIELD_SKILL,
    STATIC_MARK
  ]
};

/**
 * 获取技能倾向标签
 */
export function getElectricSkillTendencyLabel(skill: Skill): string {
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
export function getElectricSkillDescription(skill: Skill): string {
  const tendencyLabel = getElectricSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
