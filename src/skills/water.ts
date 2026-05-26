/**
 * 循迹之境 - 水属性·控制流技能库
 * 
 * 基于"水属性 → 控制流"设计
 * 核心机制：治疗、护盾、软解，持久消耗战
 * 
 * 技能分类：
 * - 攻击倾向（4种）：水流冲击、水炮、洪流冲击、深渊漩涡
 * - 防御倾向（3种）：水之守护、清泉护盾、涡流壁垒
 * - 辅助倾向（3种）：治愈波动、水疗之术、潮汐涌动
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
 * 攻击目标，造成60威力伤害，并使目标陷入「潮湿」状态
 * 潮湿：受到电属性攻击时额外承受30%伤害
 */
export const WATER_JET: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'water_jet',
    name: '水流冲击',
    description: '攻击单体目标，造成60威力水属性伤害，附加「潮湿」（受到电属性攻击时额外承受30%伤害）',
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
        debuffType: 'wet',
        duration: 3,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '软控制', '潮湿']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】水炮
 * 攻击目标，造成90威力伤害，必定使目标减速
 * 减速：目标速度-1级，持续2回合
 */
export const HYDRO_PUMP: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'hydro_pump',
    name: '水炮',
    description: '攻击单体目标，造成90威力水属性伤害，使目标减速（速度-1级，持续2回合）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'slow',
        duration: 2,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '减速']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2.5】洪流冲击
 * 攻击目标，造成70威力伤害，对火属性目标伤害×2
 * 附加「溺亡」DOT效果
 */
export const TORRENT_CRASH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'torrent_crash',
    name: '洪流冲击',
    description: '攻击单体目标，造成70威力水属性伤害，对火属性目标伤害×2，附加「溺亡」（每回合损失6%HP，持续3回合）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 70,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER,
        typeBonus: {
          targetElement: ElementType.FIRE,
          multiplier: 2
        }
      },
      applyDebuff: {
        debuffType: 'drowning',
        duration: 3,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', 'DOT', '克制火']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】水弹
 * 攻击目标，造成70威力伤害，对火属性目标伤害×2
 * 纯粹的克制火属性技能
 */
export const WATER_BULLET: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'water_bullet',
    name: '水弹',
    description: '攻击单体目标，造成70威力水属性伤害，对火属性目标伤害×2',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 70,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER,
        typeBonus: {
          targetElement: ElementType.FIRE,
          multiplier: 2
        }
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '克制火']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】深渊漩涡
 * 蓄力1回合后，对目标造成120威力伤害并附加「湍流」状态
 * 蓄力期间若被攻击则技能取消
 * 湍流：所有技能消耗+1能量
 */
export const ABYSS_VORTEX: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'abyss_vortex',
    name: '深渊漩涡',
    description: '蓄力1回合后发动，造成120威力水属性伤害并附加「湍流」（湍流：所有技能消耗+1）【蓄力可被打断】',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.SPECIAL,
        element: ElementType.WATER
      },
      applyDebuff: {
        debuffType: 'turbulence',
        duration: 2,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '水属性控制流·攻击',
    tags: ['水', '控制流', '攻击', '蓄力', '能量消耗增加']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】水之守护
 * 为己方单体生成80点护盾（持续整场）
 * 护盾存在期间，每次被攻击时敌人下次技能伤害-20%
 * 护盾被打破后，效果消失
 */
export const AQUA_SHIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'aqua_shield',
    name: '水之守护',
    description: '为己方单体生成80点护盾（持续整场），受攻击时使敌人下次技能伤害-20%',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 80,
        duration: 999  // 持续整场
      },
      special: {
        type: 'water_shield_counter',  // 受攻击时使敌人下次技能伤害-20%
        value: 0.2
      }
    }],
    category: '水属性控制流·防御',
    tags: ['水', '控制流', '防御', '护盾', '伤害削减']
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

/**
 * 【防御倾向3】涡流壁垒
 * 获得「涡流护体」状态，持续2回合
 * 涡流护体：受到伤害降低60%，对攻击者附加减速（速度-1级，持续1回合）
 */
export const VORTEX_BARRIER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'vortex_barrier',
    name: '涡流壁垒',
    description: '受到伤害降低60%（持续2回合），对攻击者附加减速（速度-1级，持续1回合）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'vortex_body',
        duration: 2,
        value: 0.6  // 60%减伤
      },
      special: {
        type: 'counter_slow',  // 反击减速
        value: 1  // 速度-1级
      }
    }],
    category: '水属性控制流·防御',
    tags: ['水', '控制流', '防御', '减伤', '减速']
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
 * 【辅助倾向3】潮汐涌动
 * 指定1个敌方目标，3回合后触发「潮汐」效果
 * 潮汐效果：造成90点水属性伤害+使目标陷入「潮湿」状态
 *
 * 高风险高回报的终极布局技能
 */
export const TIDAL_SURGE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'tidal_surge',
    name: '潮汐涌动',
    description: '指定敌人，3回合后造成90水属性伤害并使其陷入「潮湿」状态【终极布局技能】',
    type: 'action',
    energyCost: 6,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    delay: {
      turns: 3,
      effect: {
        damage: {
          basePower: 90,
          damageType: DamageType.SPECIAL,
          element: ElementType.WATER
        },
        applyDebuff: {
          debuffType: 'wet',
          duration: 3,
          stacks: 1,
          successRate: 1.0
        }
      }
    },
    effects: [{
      special: {
        type: 'delay_damage',  // 标记为延迟伤害，用于注册延迟效果
        value: 3  // 延迟3回合
      }
    }],
    category: '水属性控制流·辅助',
    tags: ['水', '控制流', '辅助', '延迟效果', '潮湿', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 水属性控制流技能库导出 ====================

/**
 * 水属性·控制流技能库
 */
export const WATER_CONTROL_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    WATER_JET,
    HYDRO_PUMP,
    TORRENT_CRASH,
    ABYSS_VORTEX
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    AQUA_SHIELD,
    CLEAR_SPRING,
    VORTEX_BARRIER
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    HEALING_WAVE,
    AQUA_THERAPY,
    TIDAL_SURGE
  },
  
  // 全部技能
  ALL: [
    WATER_JET,
    HYDRO_PUMP,
    TORRENT_CRASH,
    ABYSS_VORTEX,
    AQUA_SHIELD,
    CLEAR_SPRING,
    VORTEX_BARRIER,
    HEALING_WAVE,
    AQUA_THERAPY,
    TIDAL_SURGE
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
