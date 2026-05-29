/**
 * 循迹之境 - 超能属性·奥秘流技能库 v2.0
 * 
 * 基于"超能属性 → 奥秘流/心理博弈"设计
 * 核心机制：预言标记、精神场地、延迟触发、心理博弈
 * 
 * 技能分类：
 * - 攻击倾向（5种）：迷心刺、精神冲击、存储力量、虚空预言、预知未来
 * - 防御倾向（3种）：心智护盾、灵镜反照、迷雾之躯
 * - 辅助倾向（6种）：精神场地、精神转移、精神噪音、治愈波动、心智同步、命运编织
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
  MindShieldBuff,
  ReflectBuff,
  PsychicDodgeBuff,
  PsychicResistBuff,
  IntentBlurBuff,
  MindWoundDebuff,
  ForbiddenDebuff,
  ConfusionDebuff,
  TerrorDebuff,
  PsychicTerrainBuff,
  ProphecyMarkBuff
} from '../effects';
import { BuffType, DebuffType } from '../types';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 技能倾向工厂函数 ====================

/**
 * 创建带倾向的攻击技能
 */
export function createPsychicAttackSkill(
  id: string,
  name: string,
  description: string,
  basePower: number,
  target: SkillTarget,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `${description}（${getEnergyCostText(energyCost)}）【${SKILL_TENDENCY_TEXT[SkillTendency.ATTACK].description}】`,
    type: 'action',
    energyCost,
    target,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower,
        damageType: DamageType.SPECIAL,
        element: ElementType.PSYCHIC
      }
    }],
    tags: ['超能', '奥秘流', '攻击']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的防御技能
 */
export function createPsychicDefenseSkill(
  id: string,
  name: string,
  description: string,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `${description}（${getEnergyCostText(energyCost)}）【${SKILL_TENDENCY_TEXT[SkillTendency.DEFENSE].description}】`,
    type: 'action',
    energyCost,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    tags: ['超能', '奥秘流', '防御']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的辅助技能
 */
export function createPsychicSupportSkill(
  id: string,
  name: string,
  description: string,
  target: SkillTarget,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `${description}（${getEnergyCostText(energyCost)}）【${SKILL_TENDENCY_TEXT[SkillTendency.SUPPORT].description}】`,
    type: 'action',
    energyCost,
    target,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    tags: ['超能', '奥秘流', '辅助']
  };
  return new Skill(definition);
}

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】迷心刺
 * 攻击目标，造成60威力物理伤害，获得1层「预言标记」
 * 心灵创伤：攻击命中率50%击中自己（持续2回合）
 */
export const MIND_PIERCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mind_pierce',
    name: '迷心刺',
    description: '攻击单体目标，造成60威力物理伤害，获得1层「预言标记」，附加「心灵创伤」（持续2回合）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [
      {
        damage: {
          basePower: 60,
          damageType: DamageType.PHYSICAL,
          element: ElementType.PSYCHIC
        }
      },
      {
        applyBuff: {
          buffType: BuffType.PROPHECY_MARK,
          stacks: 1,
          duration: 999
        }
      },
      {
        applyDebuff: {
          debuffType: DebuffType.MIND_WOUND,
          duration: 2
        }
      }
    ],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '预言标记']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】精神冲击
 * 攻击目标，造成80威力混合伤害，无视目标本回合的护盾
 * 混合伤害（特攻计算/物防减免），可破坏屏障
 */
export const PSYCHIC_HIT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psychic_hit',
    name: '精神冲击',
    description: '攻击单体目标，造成80威力混合伤害（特攻计算/物防减免），无视当前护盾，可破坏屏障类效果',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [
      {
        damage: {
          basePower: 80,
          damageType: DamageType.MIXED,
          element: ElementType.PSYCHIC
        }
      },
      {
        special: {
          type: 'pierce_shield' as any
        }
      }
    ],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '无视护盾', '破盾']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】存储力量
 * 攻击目标，基础威力20，每有1个预言标记+20威力
 * 预言标记越多，威力越高
 */
export const STORED_POWER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'stored_power',
    name: '存储力量',
    description: '攻击单体目标，基础威力20，每有1个预言标记额外+20威力',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [
      {
        damage: {
          basePower: 20,
          damageType: DamageType.SPECIAL,
          element: ElementType.PSYCHIC
        }
      },
      {
        // 标记为预言标记加成技能，执行层会检查 caster.prop 动态计算威力
        special: {
          type: 'prophecy_mark_bonus' as any,
          value: 20  // 每层+20威力
        }
      }
    ],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '累积强化', '预言标记']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】虚空预言
 * 蓄力1回合后，对目标造成140威力特殊伤害并附加「禁忌」状态
 * 蓄力期间若被攻击则技能取消
 * 禁忌：使目标所有能力等级-2（持续2回合）
 */
export const VOID_PROPECY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'void_prophecy',
    name: '虚空预言',
    description: '对目标造成140威力特殊伤害并附加「禁忌」（所有能力等级-2，持续2回合）',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [
      {
        damage: {
          basePower: 140,
          damageType: DamageType.SPECIAL,
          element: ElementType.PSYCHIC
        }
      },
      {
        applyDebuff: {
          debuffType: DebuffType.FORBIDDEN,
          duration: 2
        }
      }
    ],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '能力下降']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向5】预知未来
 * 3回合后对目标造成120威力特殊伤害
 * 延迟触发的预言技能，给对手施加心理压力
 */
export const FUTURE_SIGHT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'future_sight',
    name: '预知未来',
    description: '指定敌人，3回合后造成120威力特殊伤害并附加「禁忌」',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [
      {
        damage: {
          basePower: 120,
          damageType: DamageType.SPECIAL,
          element: ElementType.PSYCHIC
        }
      },
      {
        applyDebuff: {
          debuffType: DebuffType.FORBIDDEN,
          duration: 2
        }
      },
      {
        special: {
          type: 'future_sight' as any,
          value: 120
        }
      }
    ],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '延迟触发', '禁忌']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】心智护盾
 * 获得「心灵护体」状态
 * 心灵护体：受到伤害降低50%，本回合免疫精神类攻击
 * 精神场地环境下额外+20%减伤（总计70%）
 */
export const MIND_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mind_shield_skill',
    name: '心智护盾',
    description: '受到伤害降低50%，本回合免疫精神类攻击（精神场地环境下额外+20%减伤）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [
      {
        applyBuff: {
          buffType: 'mind_body' as any,
          duration: 1,
          value: 0.5
        }
      },
      {
        shield: {
          amount: 30,
          duration: 1
        }
      },
      {
        resistance: {
          element: 'psychic',
          value: 1.0,
          duration: 1
        }
      }
    ],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '减伤', '精神免疫']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】灵镜反照
 * 获得「灵镜反照」状态，反弹下一次攻击（伤害×1.8）
 * 若本回合未被攻击则下回合自动保留1次
 */
export const MIRROR_REFLECT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mirror_reflect',
    name: '灵镜反照',
    description: '获得「灵镜反照」状态，反弹下一次攻击（反弹伤害×1.8）【未被攻击时自动保留1次】',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [
      {
        special: {
          type: 'mirror_reflect' as any,
          value: 1.8
        }
      }
    ],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '反射', '反击']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】迷雾之躯
 * 获得「迷雾闪避」状态，持续2回合
 * 每回合有70%概率闪避任意攻击，闪避成功后+1级速度
 */
export const MIST_BODY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mist_body',
    name: '迷雾之躯',
    description: '获得「迷雾闪避」（持续2回合），每回合70%概率闪避攻击，闪避成功后速度+1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [
      {
        special: {
          type: 'mist_body' as any,
          value: 0.7
        }
      }
    ],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '闪避', '加速']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（5种）====================

/**
 * 【辅助倾向1】精神场地
 * 召唤精神场地，持续5回合
 * 效果：己方超能技能威力+30%，保护己方免受优先度攻击
 */
export const PSYCHIC_TERRAIN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psychic_terrain',
    name: '精神场地',
    description: '召唤「精神场地」（持续5回合），己方超能技能威力+30%，保护己方免受优先度攻击',
    type: 'action',
    energyCost: EnergyCost.ENVIRONMENT,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'psychic_terrain' as any,
        duration: 5,
        value: 0.3
      }
    }],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '环境', '精神场地']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】精神转移
 * 将自身所有负面状态转移给目标
 * 净化自身同时将负面状态转移给目标
 */
export const PSYCHO_SHIFT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psycho_shift',
    name: '精神转移',
    description: '将自身所有负面状态转移给目标（净化自身+转移负面状态）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [
      {
        special: {
          type: 'psycho_shift' as any
        }
      }
    ],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '状态转移', '净化']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】精神噪音
 * 使目标陷入「精神噪音」状态，持续2回合
 * 效果：目标无法通过任何方式恢复HP
 */
export const PSYCHIC_NOISE_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psychic_noise_skill',
    name: '精神噪音',
    description: '使目标陷入「精神噪音」状态（持续2回合），期间无法通过任何方式恢复HP',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'psychic_noise' as any,
        duration: 2
      }
    }],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '禁止恢复', '控制']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向4】治愈波动
 * 治疗目标最大HP的50%
 * 强大的超能治疗技能
 */
export const HEAL_PULSE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'heal_pulse',
    name: '治愈波动',
    description: '治疗目标最大HP的50%',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      healing: {
        amount: 0,
        percent: 0.5
      }
    }],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '治疗', '恢复']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向5】心智同步
 * 己方两只生物交换所有「强化/弱化」状态
 * 净化自身同时将负面状态转移给队友
 */
export const MIND_SYNC: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mind_sync',
    name: '心智同步',
    description: '指定两个己方单位，交换所有强化/弱化状态（净化自身+转移负面状态）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [
      {
        special: {
          type: 'mind_sync' as any
        }
      }
    ],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '状态交换', '净化']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向6】命运编织
 * 指定1个敌方目标，3回合后触发「预言」效果
 * 预言效果：造成100点真实伤害+使目标所有能力等级-2
 *
 * 高风险高回报的终极布局技能
 */
export const FATE_WEAVE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'fate_weave',
    name: '命运编织',
    description: '指定敌人，3回合后造成100真实伤害并使其所有能力等级-2【终极预言技能】',
    type: 'action',
    energyCost: EnergyCost.MEGA,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [
      {
        damage: {
          basePower: 100,
          damageType: DamageType.TRUE,
          element: ElementType.PSYCHIC
        }
      },
      {
        applyDebuff: {
          debuffType: DebuffType.FORBIDDEN,
          duration: 2
        }
      },
      {
        special: {
          type: 'fate_weave' as any,
          value: 100
        }
      }
    ],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '延迟效果', '真实伤害', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 超能奥秘流技能库导出 ====================

/**
 * 超能属性·奥秘流技能库 v2.0
 */
export const PSYCHIC_MYSTIC_SKILLS = {
  // 攻击倾向（5种）
  ATTACK: {
    MIND_PIERCE,
    PSYCHIC_HIT,
    STORED_POWER,
    VOID_PROPECY,
    FUTURE_SIGHT
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    MIND_SHIELD_SKILL,
    MIRROR_REFLECT,
    MIST_BODY
  },
  
  // 辅助倾向（5种）
  SUPPORT: {
    PSYCHIC_TERRAIN,
    PSYCHO_SHIFT,
    PSYCHIC_NOISE_SKILL,
    HEAL_PULSE,
    MIND_SYNC,
    FATE_WEAVE
  },
  
  // 全部技能（13种）
  ALL: [
    // 攻击（5种）
    MIND_PIERCE,
    PSYCHIC_HIT,
    STORED_POWER,
    VOID_PROPECY,
    FUTURE_SIGHT,
    // 防御（3种）
    MIND_SHIELD_SKILL,
    MIRROR_REFLECT,
    MIST_BODY,
    // 辅助（5种）
    PSYCHIC_TERRAIN,
    PSYCHO_SHIFT,
    PSYCHIC_NOISE_SKILL,
    HEAL_PULSE,
    MIND_SYNC,
    FATE_WEAVE
  ]
};

/**
 * 获取技能倾向标签（超能属性专用）
 */
export function getPsychicSkillTendencyLabel(skill: Skill): string {
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
 * 获取技能完整描述（超能属性专用）
 */
export function getPsychicSkillDescription(skill: Skill): string {
  const tendencyLabel = getPsychicSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
