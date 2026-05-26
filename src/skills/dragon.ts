/**
 * 循迹之境 - 龙属性·中速流技能库
 * 
 * 基于"龙属性 → 中速流/爆发流"设计
 * 核心机制：成长叠加、高伤害、后期霸主
 * 
 * 技能分类：
 * - 攻击倾向（4种）：龙之波动、逆鳞、龙之俯冲、龙息
 * - 防御倾向（3种）：龙鳞守护、龙之威严、龙魂觉醒
 * - 辅助倾向（3种）：龙之舞、祖传之力、古龙之怒
 */

import {
  Skill,
  SkillDefinition
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
  ShieldBuff,
  AttackUpBuff,
  SpeedUpBuff,
  DefendUpBuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 龙属性专属类型定义 ====================

/**
 * 龙属性状态效果类型
 */
export enum DragonBuffType {
  DRAGON_SCALES = 'DRAGON_SCALES',        // 龙鳞护盾
  DRAGON_AURA = 'DRAGON_AURA',            // 龙之威严
  DRAGON_AWAKENING = 'DRAGON_AWAKENING',  // 龙魂觉醒
  DRAGON_DANCE = 'DRAGON_DANCE',          // 龙之舞增益
  ANCESTRAL_POWER = 'ANCESTRAL_POWER',     // 祖传之力
  ANCIENT_FURY = 'ANCIENT_FURY'           // 古龙之怒
}

export enum DragonDebuffType {
  DRAGON_BREATH_BURN = 'DRAGON_BREATH_BURN',  // 龙息灼烧
  DRAGON_CRUSH = 'DRAGON_CRUSH',              // 龙之碾压（防御下降）
  DRAGON_INTIMIDATE = 'DRAGON_INTIMIDATE'     // 龙威震慑（攻击下降）
}

// ==================== 技能倾向工厂函数 ====================

/**
 * 创建带倾向的攻击技能
 */
export function createDragonAttackSkill(
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
        element: ElementType.DRAGON
      }
    }],
    tags: ['龙', '中速流', '攻击']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的防御技能
 */
export function createDragonDefenseSkill(
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
    tags: ['龙', '中速流', '防御']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的辅助技能
 */
export function createDragonSupportSkill(
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
    tags: ['龙', '中速流', '辅助']
  };
  return new Skill(definition);
}

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】龙之波动
 * 攻击目标，造成75威力龙属性伤害
 * 基础高威力技能，体现龙属性的强大火力
 */
export const DRAGON_PULSE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_pulse',
    name: '龙之波动',
    description: '攻击单体目标，造成75威力龙属性伤害',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 75,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      }
    }],
    category: '龙中速流·攻击',
    tags: ['龙', '中速流', '攻击', '高威力']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】逆鳞
 * 攻击目标，造成120威力龙属性伤害
 * 使用后2回合内陷入「逆鳞反噬」状态（攻击有概率击中自己）
 * 体现龙属性的高风险高回报特性
 */
export const DRAGON_RAGE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_rage',
    name: '逆鳞',
    description: '攻击单体目标，造成120威力龙属性伤害，使用后陷入「逆鳞反噬」（2回合内攻击有概率击中自己）',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      }
    }],
    category: '龙中速流·攻击',
    tags: ['龙', '中速流', '攻击', '高威力', '副作用']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】龙之俯冲
 * 攻击目标，造成90威力龙属性伤害
 * 若目标HP低于50%，威力提升50%
 * 体现龙属性的斩杀能力
 */
export const DRAGON_DIVE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_dive',
    name: '龙之俯冲',
    description: '攻击单体目标，造成90威力龙属性伤害（对HP<50%目标威力+50%）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      }
    }],
    category: '龙中速流·攻击',
    tags: ['龙', '中速流', '攻击', '斩杀', '低HP增伤']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】龙息
 * 攻击敌方全体，造成50威力龙属性伤害
 * 附加「龙息灼烧」状态（持续2回合，每回合受到10点伤害）
 * 体现龙属性的AOE能力
 */
export const DRAGON_BREATH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_breath',
    name: '龙息',
    description: '攻击敌方全体，造成50威力龙属性伤害，附加「龙息灼烧」（每回合10点伤害，持续2回合）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALL,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 50,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      }
    }],
    category: '龙中速流·攻击',
    tags: ['龙', '中速流', '攻击', 'AOE', 'DOT']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】龙鳞守护
 * 获得「龙魂护体」状态
 * 龙魂护体：受到伤害降低75%，本回合攻击必定暴击
 */
export const DRAGON_SCALES_SHIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_scales_shield',
    name: '龙鳞守护',
    description: '受到伤害降低75%，本回合攻击必定暴击',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'dragon_body' as any,
        duration: 1,
        value: 0.75  // 75%减伤
      }
    }],
    category: '龙中速流·防御',
    tags: ['龙', '中速流', '防御', '减伤', '必定暴击']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】龙之意志
 * 获得「龙威护体」状态
 * 龙威护体：受到伤害降低60%，本回合攻击时使敌人攻击-1级
 */
export const DRAGON_AURA: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_aura',
    name: '龙之意志',
    description: '受到伤害降低60%，本回合攻击时敌人攻击-1级',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'dragon_aura_body' as any,
        duration: 1,
        value: 0.6  // 60%减伤
      }
    }],
    category: '龙中速流·防御',
    tags: ['龙', '中速流', '防御', '减伤', '削弱']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】龙魂壁垒
 * 获得「龙魂护壁」状态
 * 龙魂护壁：受到伤害降低65%，本回合免疫所有负面状态
 */
export const DRAGON_AWAKENING: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_awakening',
    name: '龙魂壁垒',
    description: '受到伤害降低65%，本回合免疫所有负面状态',
    type: 'action',
    energyCost: EnergyCost.HIGH + 1, // 4能量
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'dragon_soul_barrier' as any,
        duration: 1,
        value: 0.65  // 65%减伤
      }
    }],
    category: '龙中速流·防御',
    tags: ['龙', '中速流', '防御', '减伤', '免疫负面']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】龙之舞
 * 使自身攻击+1级，速度+1级
 * 经典成长技能，体现龙属性的积累期
 */
export const DRAGON_DANCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_dance',
    name: '龙之舞',
    description: '使自身攻击+1级，速度+1级（经典强化技能）',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '龙中速流·辅助',
    tags: ['龙', '中速流', '辅助', '强化', '成长']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】祖传之力
 * 若己方场上有其他龙属性单位，自身获得「祖传之力」
 * 每有1只龙属性队友，攻击力+1级（最多+2级）
 * 体现龙族群体的力量传承
 */
export const ANCESTRAL_POWER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ancestral_power',
    name: '祖传之力',
    description: '己方每有1只龙属性队友，自身攻击力+1级（最多+2级）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '龙中速流·辅助',
    tags: ['龙', '中速流', '辅助', '强化', '阵容联动']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】古龙之怒
 * 消耗已累积的所有「龙之舞」层数
 * 每层使本回合下一次攻击威力+30%
 * 体现龙属性的爆发潜力
 */
export const ANCIENT_FURY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ancient_fury',
    name: '古龙之怒',
    description: '消耗所有「龙之舞」层数，每层使本回合下一次攻击威力+30%',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '龙中速流·辅助',
    tags: ['龙', '中速流', '辅助', '爆发', '消耗层数']
  };
  return new Skill(definition);
})();

// ==================== 龙中速流技能库导出 ====================

/**
 * 龙属性·中速流技能库
 */
export const DRAGON_MIDRANGE_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    DRAGON_PULSE,
    DRAGON_RAGE,
    DRAGON_DIVE,
    DRAGON_BREATH
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    DRAGON_SCALES_SHIELD,
    DRAGON_AURA,
    DRAGON_AWAKENING
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    DRAGON_DANCE,
    ANCESTRAL_POWER,
    ANCIENT_FURY
  },
  
  // 全部技能
  ALL: [
    DRAGON_PULSE,
    DRAGON_RAGE,
    DRAGON_DIVE,
    DRAGON_BREATH,
    DRAGON_SCALES_SHIELD,
    DRAGON_AURA,
    DRAGON_AWAKENING,
    DRAGON_DANCE,
    ANCESTRAL_POWER,
    ANCIENT_FURY
  ]
};

/**
 * 获取技能倾向标签
 */
export function getSkillTendencyLabel(skill: Skill): string {
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
export function getFullSkillDescription(skill: Skill): string {
  const tendencyLabel = getSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
