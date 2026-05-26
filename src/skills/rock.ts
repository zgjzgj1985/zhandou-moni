/**
 * 循迹之境 - 岩石属性·防御流技能库
 * 
 * 基于"岩石属性 → 防御流"设计
 * 核心机制：高防御、固定减伤、护甲积累、反击反弹
 * 
 * 技能分类：
 * - 攻击倾向（4种）：尖石攻击、落石冲击、地震、磐石崩落
 * - 防御倾向（3种）：岩盾、铁壁、反击姿态
 * - 辅助倾向（3种）：沙尘掩体、磐石之躯、山岳守护
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
  BuffType,
  SKILL_TENDENCY_TEXT,
  getEnergyCostText
} from '../types';
import {
  Buff,
  Debuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】尖石攻击
 * 攻击目标，造成75威力伤害，30%概率使目标防御-1级
 * 岩石属性的基础物理攻击技能
 */
export const ROCK_SPIKE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'rock_spike',
    name: '尖石攻击',
    description: '攻击单体目标，造成75威力岩石伤害，30%概率使目标防御-1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 75,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ROCK
      }
    }],
    category: '岩石防御流·攻击',
    tags: ['岩石', '防御流', '攻击', '防御下降']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】落石冲击
 * 攻击目标，造成90威力伤害
 * 高威力单体攻击技能
 */
export const STONE_IMPACT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'stone_impact',
    name: '落石冲击',
    description: '攻击单体目标，造成90威力岩石伤害',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ROCK
      }
    }],
    category: '岩石防御流·攻击',
    tags: ['岩石', '防御流', '攻击', '高威力']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】地震
 * 攻击单体目标，造成85威力伤害，自身+1级防御（持续2回合）
 * 攻击+自保的平衡技能
 */
export const EARTHQUAKE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'earthquake',
    name: '地震',
    description: '攻击单体目标，造成85威力岩石伤害，自身防御+1级（持续2回合）',
    type: 'action',
    energyCost: EnergyCost.ULTRA,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 85,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ROCK
      }
    }, {
      statBoost: {
        stat: 'defense',
        stages: 1,
        duration: 2
      }
    }],
    category: '岩石防御流·攻击',
    tags: ['岩石', '防御流', '攻击', '防御强化']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】崩岩碎
 * 攻击单体目标，造成120威力岩石伤害，使目标防御-2级
 * 高伤害+削防的强力攻击技能
 */
export const BOULDER_CRASH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'boulder_crash',
    name: '崩岩碎',
    description: '攻击单体目标，造成120威力岩石伤害，使目标防御-2级',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ROCK
      }
    }, {
      statBoost: {
        stat: 'defense',
        stages: -2
      }
    }],
    category: '岩石防御流·攻击',
    tags: ['岩石', '防御流', '攻击', '削防', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】岩盾
 * 获得「岩甲护体」状态
 * 岩甲护体：受到伤害降低65%，本回合攻击+防御各+1级
 */
export const ROCK_SHIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'rock_shield',
    name: '岩盾',
    description: '受到伤害降低65%，本回合攻击+防御各+1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.ROCK_ARMOR,
        duration: 1,
        value: 0.65  // 65%减伤
      }
    }, {
      statBoost: {
        stat: 'attack',
        stages: 1,
        duration: 1  // 本回合
      }
    }, {
      statBoost: {
        stat: 'defense',
        stages: 1,
        duration: 1  // 本回合
      }
    }],
    category: '岩石防御流·防御',
    tags: ['岩石', '防御流', '防御', '减伤', '能力强化']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】铁壁防御
 * 获得「铁壁」状态
 * 铁壁：受到伤害降低75%，本回合无法进行攻击
 */
export const IRON_WALL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'iron_wall',
    name: '铁壁防御',
    description: '受到伤害降低75%，本回合无法攻击',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.IRON_WALL,
        duration: 1,
        value: 0.75  // 75%减伤
      }
    }],
    category: '岩石防御流·防御',
    tags: ['岩石', '防御流', '防御', '减伤']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】岩壁护盾
 * 获得「震荡护体」状态
 * 震荡护体：受到伤害降低55%，本回合攻击附带眩晕（30%概率使目标眩晕1回合）
 */
export const ROCK_BARRIER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'rock_barrier',
    name: '岩壁护盾',
    description: '受到伤害降低55%，本回合攻击附带眩晕',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.QUAKE_BODY,
        duration: 1,
        value: 0.55  // 55%减伤
      }
    }],
    category: '岩石防御流·防御',
    tags: ['岩石', '防御流', '防御', '减伤', '眩晕']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】反击姿态
 * 获得「反击」状态
 * 反击：受到攻击时对攻击者造成30点固定伤害，本回合防御+1级
 */
export const COUNTER_STANCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'counter_stance',
    name: '反击姿态',
    description: '本回合受到攻击时反击攻击者30点伤害，防御+1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      statBoost: {
        stat: 'defense',
        stages: 1,
        duration: 1
      }
    }],
    category: '岩石防御流·防御',
    tags: ['岩石', '防御流', '防御', '反击']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】沙尘掩体
 * 本回合闪避率+30%，并清除自身灼烧状态
 * 利用沙尘掩护，短暂提高生存能力
 */
export const SAND_CLOAK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'sand_cloak',
    name: '沙尘掩体',
    description: '本回合闪避率+30%，并清除自身灼烧状态',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '岩石防御流·辅助',
    tags: ['岩石', '防御流', '辅助', '闪避', '驱散']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】磐石之躯
 * 驱散自身所有弱化状态
 * 使自身进入「磐石形态」，持续3回合
 * 磐石形态：受到的所有伤害降低20%，速度-1级
 */
export const STONE_BODY: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'stone_body',
    name: '磐石之躯',
    description: '驱散自身所有弱化状态，进入「磐石形态」（持续3回合）：受到伤害-20%，速度-1级',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '岩石防御流·辅助',
    tags: ['岩石', '防御流', '辅助', '净化', '减伤', '形态']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】山岳守护
 * 为己方全体生成50点护盾（持续3回合）
 * 护盾存在期间，所有友方受到岩石属性攻击时抗性+25%
 * 团队防御核心技能
 */
export const MOUNTAIN_GUARDIAN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mountain_guardian',
    name: '山岳守护',
    description: '为己方全体生成50点护盾（持续3回合），期间对岩石属性攻击抗性+25%',
    type: 'action',
    energyCost: EnergyCost.ULTRA,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      shield: {
        amount: 50
      }
    }],
    category: '岩石防御流·辅助',
    tags: ['岩石', '防御流', '辅助', '群体护盾', '抗性']
  };
  return new Skill(definition);
})();

// ==================== 技能库导出 ====================

/**
 * 岩石属性·防御流技能库
 */
export const ROCK_DEFENSE_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    ROCK_SPIKE,        // 尖石攻击
    STONE_IMPACT,      // 落石冲击
    EARTHQUAKE,        // 地震
    BOULDER_CRASH      // 磐石崩落
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    ROCK_SHIELD,       // 岩盾
    IRON_WALL,         // 铁壁
    COUNTER_STANCE     // 反击姿态
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    SAND_CLOAK,        // 沙尘掩体
    STONE_BODY,        // 磐石之躯
    MOUNTAIN_GUARDIAN  // 山岳守护
  },
  
  // 全部技能
  ALL: [
    ROCK_SPIKE,
    STONE_IMPACT,
    EARTHQUAKE,
    BOULDER_CRASH,
    ROCK_SHIELD,
    IRON_WALL,
    COUNTER_STANCE,
    SAND_CLOAK,
    STONE_BODY,
    MOUNTAIN_GUARDIAN
  ]
};

/**
 * 获取技能倾向标签
 */
export function getRockSkillTendencyLabel(skill: Skill): string {
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
export function getRockSkillFullDescription(skill: Skill): string {
  const tendencyLabel = getRockSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
