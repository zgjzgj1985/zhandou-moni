/**
 * 循迹之境 - 水属性·控制流技能库
 *
 * 基于"水属性 → 控制流"设计
 * 核心机制：治疗、护盾、威力加成，持久消耗战
 *
 * 技能分类：
 * - 攻击倾向（7种）：水流冲击、水炮、水弹、漩涡、热水、浊流、冲浪
 * - 防御倾向（2种）：水之守护、清泉护盾
 * - 辅助倾向（3种）：治愈波动、水疗之术、雨天
 */

import {
  Skill,
  SkillDefinition
} from './Skill';
import {
  SkillTarget,
  DamageType,
  ElementType,
  SkillTendency
} from '../types';

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】水流冲击
 * 攻击目标，造成60威力伤害，目标获得「浸透」状态
 * 浸透：特防-1级/层，最多6层，持续2回合
 */
export const WATER_JET: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'water_jet',
    name: '水流冲击',
    description: '攻击单体目标，造成60威力特殊伤害，目标获得「浸透」（特防-1级/层，最多6层，持续2回合）',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'water_soak',
        duration: 2,
        stacks: 1,
        maxStacks: 6
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '削弱', '浸透']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】水炮
 * 攻击目标，造成150威力伤害，自身获得虚弱（下一回合无法使用技能）
 * 高威力代价技能
 */
export const HYDRO_PUMP: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'hydro_pump',
    name: '水炮',
    description: '攻击单体目标，造成150威力特殊伤害，自身获得「虚弱」（下一回合无法使用技能）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 150,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER
      },
      selfDebuff: {
        debuffType: 'weakness',
        duration: 2,
        stacks: 1
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '高威力', '虚弱代价']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】水弹
 * 攻击目标，造成35×2威力伤害（多段），先手+1
 * 多段伤害适合触发浸透buff等层数机制
 * 伤害类型：物理伤害（高压水弹的物理冲击）
 */
export const WATER_BULLET: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'water_bullet',
    name: '水弹',
    description: '攻击单体目标，造成35×2威力特殊伤害（多段），先手+1',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    priority: 1, // 先手+1
    effects: [{
      damage: {
        basePower: 35,
        damageType: DamageType.PHYSICAL, // 物理伤害（多段）
        hits: 2,  // 2段攻击
        element: ElementType.WATER
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '多段伤害', '先手', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】漩涡
 * 对目标造成120威力伤害并附加「溺水」状态
 * 溺水：下一次能量消耗高于3的技能，造成伤害-30%
 * 伤害类型：物理伤害（漩涡是旋转的水流冲击）
 */
export const ABYSS_VORTEX: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'abyss_vortex',
    name: '漩涡',
    description: '造成120威力物理伤害，附加「溺水」（下一次能量消耗>3的技能伤害-30%）',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.PHYSICAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'drowning_status',
        duration: 3,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '能量压制', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向5】热水
 * 参考宝可梦热水技能
 * 攻击目标，造成80威力伤害，30%概率使目标陷入灼烧状态
 * 伤害类型：物理伤害（高温液体的物理喷射）
 */
export const SCALD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'scald',
    name: '热水',
    description: '攻击单体目标，造成80威力物理伤害，30%概率使目标陷入「蒸汽灼伤」状态（每回合损失2%最大HP）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.PHYSICAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'steam_burn',
        duration: 3,
        stacks: 1,
        successRate: 0.3  // 30%概率
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '灼烧', '概率触发', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向6】浊流
 * 参考宝可梦浊流技能
 * 攻击目标，造成90威力伤害，30%概率使目标命中率降低
 * 伤害类型：物理伤害（泥水的物理冲击）
 */
export const MUDDY_WATER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'muddy_water',
    name: '浊流',
    description: '攻击单体目标，造成90威力物理伤害，30%概率使目标获得「浑浊」状态（命中率-1级/层，最多3层，持续3回合）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.PHYSICAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'muddy',
        duration: 3,
        stacks: 1,
        maxStacks: 3,
        successRate: 0.3  // 30%概率
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '命中降低', '概率触发', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向7】冲浪
 * 参考宝可梦冲浪技能
 * 攻击敌方全体目标，造成80威力伤害
 * 宝可梦设计亮点：冲浪是水系最具标志性的群体攻击技能
 */
export const SURGE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'surge',
    name: '冲浪',
    description: '攻击敌方全体目标，造成80威力特殊伤害',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '群体伤害']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】水之守护
 * 获得减伤状态（持续1回合），受到伤害时攻击者获得1层浸透
 * 减伤：受到伤害降低70%
 * 反击：每受到1次伤害，使攻击者获得1层浸透（特防-1级/层）
 */
export const AQUA_SHIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'aqua_shield',
    name: '水之守护',
    description: '受到伤害降低70%（持续1回合），如果受到伤害，攻击者获得1层浸透（特防-1级/层，最多6层，持续2回合）',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'defense_up',
        duration: 1,
        stacks: 1,
        value: 0.7  // 减伤70%
      }
    }, {
      // 受击时使攻击者获得浸透
      triggerOnHit: {
        applyDebuff: {
          debuffType: 'water_soak',
          duration: 2,
          stacks: 1,
          maxStacks: 6
        }
      }
    }],
    category: '水属性控制流·防御',
    tags: ['水', '控制流', '防御', '减伤', '浸透']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】清泉护盾
 * 获得「清泉」状态，持续3回合
 * 每回合开始时恢复最大HP的10%，并清除1个负面状态
 */
export const CLEAR_SPRING: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'clear_spring',
    name: '清泉护盾',
    description: '获得「清泉」状态（持续3回合），每回合恢复10%HP并清除1个负面状态',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'clear_spring',
        duration: 3,
        value: 0.1  // 10%治疗
      },
      special: {
        type: 'cleanse',
        value: 1  // 清除1个debuff
      }
    }],
    category: '水属性控制流·防御',
    tags: ['水', '控制流', '防御', '持续治疗', '净化']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】治愈波动
 * 治疗己方单体目标，恢复量相当于最大HP的25%
 */
export const HEALING_WAVE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'healing_wave',
    name: '治愈波动',
    description: '治疗己方单体目标，恢复量相当于最大HP的25%',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      healing: {
        percent: 0.25
      }
    }],
    category: '水属性控制流·辅助',
    tags: ['水', '控制流', '辅助', '治疗']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】水疗之术
 * 治疗己方全体目标，恢复量相当于最大HP的15%
 * 使全体友方获得「流水」状态（速度+1级，持续2回合）
 */
export const AQUA_THERAPY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'aqua_therapy',
    name: '水疗之术',
    description: '治疗己方全体目标（恢复15%HP），并使全体获得「流水」状态（速度+1级，持续2回合）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      healing: {
        percent: 0.15
      },
      applyBuff: {
        buffType: 'flow',
        duration: 2,
        value: 1  // 速度+1级
      }
    }],
    category: '水属性控制流·辅助',
    tags: ['水', '控制流', '辅助', '群体治疗', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】雨天
 * 创造雨天环境，己方所有生物水属性技能威力+50%
 * 持续3回合
 */
export const RAINY_DAY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'rainy_day',
    name: '雨天',
    description: '创造雨天环境，所有生物水属性技能威力+50%（持续3回合）',
    type: 'action',
    energyCost: 8,
    target: SkillTarget.ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyFieldBuff: {
        buffType: 'water_amplify',
        duration: 3,
        value: 0.5
      }
    }],
    category: '水属性控制流·辅助',
    tags: ['水', '控制流', '辅助', '天气', '威力加成']
  };
  return new Skill(definition);
})();

// ==================== 水属性控制流技能库导出 ====================

/**
 * 水属性·控制流技能库
 */
export const WATER_CONTROL_SKILLS = {
  // 攻击倾向（7种）
  ATTACK: {
    WATER_JET,
    HYDRO_PUMP,
    WATER_BULLET,
    ABYSS_VORTEX,
    SCALD,
    MUDDY_WATER,
    SURGE
  },

  // 防御倾向（2种）
  DEFENSE: {
    AQUA_SHIELD,
    CLEAR_SPRING
  },

  // 辅助倾向（3种）
  SUPPORT: {
    HEALING_WAVE,
    AQUA_THERAPY,
    RAINY_DAY
  },

  // 全部技能
  ALL: [
    WATER_JET,
    HYDRO_PUMP,
    WATER_BULLET,
    ABYSS_VORTEX,
    SCALD,
    MUDDY_WATER,
    SURGE,
    AQUA_SHIELD,
    CLEAR_SPRING,
    HEALING_WAVE,
    AQUA_THERAPY,
    RAINY_DAY
  ]
};

/**
 * 获取技能倾向标签（水属性专用）
 */
export function getWaterSkillTendencyLabel(skill: Skill): string {
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
 * 获取技能完整描述（水属性专用）
 */
export function getWaterSkillDescription(skill: Skill): string {
  const tendencyLabel = getWaterSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
