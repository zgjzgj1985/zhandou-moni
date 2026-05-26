/**
 * 循迹之境 - 超能属性·奥秘流技能库
 * 
 * 基于"超能属性 → 奥秘流/心理博弈"设计
 * 核心机制：延迟触发、心理博弈、信息操控
 * 
 * 技能分类：
 * - 攻击倾向（3种）：迷心刺、精神冲击、虚空预言
 * - 防御倾向（4种）：心智护盾、灵镜反照、迷雾之躯、念动壁垒
 * - 辅助倾向（3种）：气味伪装、心智同步、命运编织
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
  TerrorDebuff
} from '../effects';
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

// ==================== 攻击倾向技能（3种）====================

/**
 * 【攻击倾向1】迷心刺
 * 攻击目标，造成55威力伤害，并使目标陷入「心灵创伤」状态
 * 心灵创伤：攻击命中率50%击中自己（持续1回合）
 */
export const MIND_PIERCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mind_pierce',
    name: '迷心刺',
    description: '攻击单体目标，造成55威力超能伤害，附加「心灵创伤」（攻击命中率50%击中自己，持续1回合）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 55,
        damageType: DamageType.SPECIAL,
        element: ElementType.PSYCHIC
      }
    }],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '软控制']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】精神冲击
 * 攻击目标，造成80威力伤害，无视目标本回合的护盾
 * 混合伤害（特攻计算/物防减免）
 */
export const PSYCHIC_HIT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psychic_hit',
    name: '精神冲击',
    description: '攻击单体目标，造成80威力混合伤害（特攻计算/物防减免），无视目标当前护盾',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.SPECIAL,
        element: ElementType.PSYCHIC
      }
    }],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '无视护盾']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】虚空预言
 * 蓄力1回合后，对目标造成120威力伤害并附加「禁忌」状态
 * 蓄力期间若被攻击则技能取消
 * 禁忌：使目标所有能力等级-2（持续2回合）
 */
export const VOID_PROPECY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'void_prophecy',
    name: '虚空预言',
    description: '蓄力1回合后发动，造成120威力伤害并附加「禁忌」（所有能力等级-2，持续2回合）【蓄力可被打断】',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.SPECIAL,
        element: ElementType.PSYCHIC
      }
    }],
    category: '超能奥秘流·攻击',
    tags: ['超能', '奥秘流', '攻击', '蓄力', '能力下降']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（4种）====================

/**
 * 【防御倾向1】心智护盾
 * 为己方单体生成60点护盾值
 * 护盾存在期间，若敌人攻击此目标则其减少1点能量
 */
export const MIND_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mind_shield_skill',
    name: '心智护盾',
    description: '为己方单体生成60点护盾（持续整场），受攻击时敌人减少1点能量',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 60
      }
    }],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '护盾', '能量削弱']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】灵镜反照
 * 获得「灵镜反照」状态，反弹下一次攻击（伤害×1.5）
 * 若本回合未被攻击则下回合自动保留1次
 */
export const MIRROR_REFLECT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mirror_reflect',
    name: '灵镜反照',
    description: '获得「灵镜反照」状态，反弹下一次攻击（反弹伤害×1.5）【未被攻击时自动保留1次】',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '反射', '反击']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】迷雾之躯
 * 获得「迷雾闪避」状态，持续2回合
 * 每回合有60%概率闪避任意攻击，闪避成功后+1级速度
 */
export const MIST_BODY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mist_body',
    name: '迷雾之躯',
    description: '获得「迷雾闪避」（持续2回合），每回合60%概率闪避攻击，闪避成功后速度+1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '闪避', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向4】念动壁垒
 * 为己方全体生成40点护盾值，持续3回合
 * 护盾存在期间，所有友方对超能属性（精神类）攻击抗性+30%
 */
export const PSYCHIC_BARRIER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'psychic_barrier',
    name: '念动壁垒',
    description: '为己方全体生成40点护盾（持续3回合），期间对精神攻击抗性+30%',
    type: 'action',
    energyCost: EnergyCost.HIGH + 1, // 4能量
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 40
      }
    }],
    category: '超能奥秘流·防御',
    tags: ['超能', '奥秘流', '防御', '群体护盾', '抗性']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】气味伪装
 * 本回合内，我方所有单位的意图图标可信度降低30%
 * 敌人需要额外判断我方真实意图
 */
export const SCENT_MIMIC: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'scent_mimic',
    name: '气味伪装',
    description: '本回合内，我方所有单位意图可信度降低30%（敌人更难判断真实意图）',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '信息干扰', '气味系统']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】心智同步
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
    effects: [],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '状态交换', '净化']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】命运编织
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
    effects: [{
      damage: {
        basePower: 100,
        damageType: DamageType.TRUE,
        element: ElementType.PSYCHIC
      }
    }],
    category: '超能奥秘流·辅助',
    tags: ['超能', '奥秘流', '辅助', '延迟效果', '真实伤害', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 超能奥秘流技能库导出 ====================

/**
 * 超能属性·奥秘流技能库
 */
export const PSYCHIC_MYSTIC_SKILLS = {
  // 攻击倾向（3种）
  ATTACK: {
    MIND_PIERCE,
    PSYCHIC_HIT,
    VOID_PROPECY
  },
  
  // 防御倾向（4种）
  DEFENSE: {
    MIND_SHIELD_SKILL,
    MIRROR_REFLECT,
    MIST_BODY,
    PSYCHIC_BARRIER
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    SCENT_MIMIC,
    MIND_SYNC,
    FATE_WEAVE
  },
  
  // 全部技能
  ALL: [
    MIND_PIERCE,
    PSYCHIC_HIT,
    VOID_PROPECY,
    MIND_SHIELD_SKILL,
    MIRROR_REFLECT,
    MIST_BODY,
    PSYCHIC_BARRIER,
    SCENT_MIMIC,
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
