/**
 * 循迹之境 - 火属性·爆发流技能库
 * 
 * 基于"火属性 → 爆发流/OTK流"设计
 * 核心机制：蓄力爆发、高伤害单体、灼烧DOT
 * 
 * 技能分类：
 * - 攻击倾向（4种）：火花、烈焰拳、大字爆炎、爆炸烈焰
 * - 防御倾向（2种）：火盾、烈焰壁垒
 * - 辅助倾向（3种）：蓄焰、燃尽、炎之意志
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
 * 【攻击倾向1】点燃
 * 纯DOT技能，必定使目标陷入「灼烧」状态（5层）
 * 每层灼烧回合结束时造成2%最大生命伤害，层数减半
 */
export const EMBER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ember',
    name: '点燃',
    description: '对目标施加灼烧（5层）【每层2%最大HP伤害，层数减半】',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      applyDebuff: {
        debuffType: 'burn',
        duration: 3,
        stacks: 5,
        successRate: 1.0
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '灼烧']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】烈焰拳
 * 连击3次火属性攻击，每次25威力，共75威力（物理伤害类型）
 * 攻击结束后50%概率使目标陷入「灼烧」状态（2层）
 * 每层灼烧回合结束时造成2%最大生命伤害，层数减半
 */
export const FLAME_PUNCH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'flame_punch',
    name: '烈焰拳',
    description: '连续3次火属性攻击（共75威力），攻击结束后50%概率灼烧（2层）【每层2%最大HP伤害，层数减半】',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 25,
        damageType: DamageType.PHYSICAL,
        element: ElementType.FIRE,
        hits: 3
      },
      applyDebuff: {
        debuffType: 'burn',
        duration: 3,
        stacks: 2,
        successRate: 0.5
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '灼烧', '物理伤害', '连击3次']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】大字爆炎
 * 高威力单体火属性攻击，造成120威力伤害
 * 附带「灼伤印记」（下回合追加40威力火属性伤害）
 */
export const FLARE_BLITZ: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'flare_blitz',
    name: '大字爆炎',
    description: '攻击单体目标，造成120威力火属性伤害，并附加「灼伤印记」（下回合追加40威力火属性伤害）',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 120,
        damageType: DamageType.SPECIAL,
        element: ElementType.FIRE
      },
      applyDebuff: {
        debuffType: 'burn_mark',
        duration: 2,
        stacks: 1
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '高威力', '灼伤印记']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】爆炸烈焰
 * 终极爆发技能，6段多段伤害，每段必定灼烧
 * 每次命中必定使目标灼烧
 */
export const EXPLOSION_FLAME: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'explosion_flame',
    name: '爆炸烈焰',
    description: '6段火属性攻击（共150威力），每次命中必定灼烧（每次1层）【每层2%最大HP伤害，层数减半】',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 25,  // 150 / 6 ≈ 25每段
        damageType: DamageType.MULTI_HIT,
        hits: 6,        // 6段攻击
        element: ElementType.FIRE
      },
      applyDebuff: {
        debuffType: 'burn',
        duration: 3,
        stacks: 1,      // 每次命中1层灼烧
        successRate: 1.0  // 必定灼伤
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '终极', '多段伤害', '必定灼烧']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】火盾
 * 获得「烈焰护体」状态
 * 烈焰护体：受到伤害降低55%，本回合受伤时对攻击者附加灼烧（1层）
 */
export const FIRE_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'fire_shield_skill',
    name: '火盾',
    description: '受到伤害降低55%，本回合受伤时攻击者附加灼烧',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'fire_shield',
        duration: 1,
        value: 0.55  // 55%减伤
      }
    }],
    category: '火属性爆发流·防御',
    tags: ['火', '爆发流', '防御', '减伤', '灼烧']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】烈火护体
 * 获得「烈焰护体」状态
 * 烈焰护体：受到伤害降低70%，下次火属性攻击威力+40
 */
export const WALL_OF_FLAMES: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'wall_of_flames',
    name: '烈火护体',
    description: '受到伤害降低70%，下次火属性攻击威力+40',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'flame_body',
        duration: 2,
        value: 0.7  // 70%减伤
      },
      special: {
        type: 'extra_attack_damage',
        value: 40  // 下次火攻+40威力
      }
    }],
    category: '火属性爆发流·防御',
    tags: ['火', '爆发流', '防御', '减伤', '火攻强化']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】蓄焰
 * 为己方单体施加「蓄焰」状态
 * 蓄焰：下次火属性攻击威力+（自身能量×10）
 * 持续3回合
 */
export const FLAME_CHARGE_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'flame_charge_skill',
    name: '蓄焰',
    description: '为己方单体施加「蓄焰」（持续3回合），下次火属性攻击威力+（自身能量×10）',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'flame_charge',
        duration: 3,
        value: 10  // 每点能量+10威力
      }
    }],
    category: '火属性爆发流·辅助',
    tags: ['火', '爆发流', '辅助', '能量增伤', '爆发准备']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】燃尽
 * 指定目标施加「燃尽印记」
 * 3回合后触发，扣除目标30%当前HP的真实伤害
 */
export const COMBUSTION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'combustion',
    name: '燃尽',
    description: '指定敌人施加「燃尽印记」，3回合后扣除30%当前HP【延迟伤害】',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'combustion_mark',
        duration: 3,
        value: 0.3  // 30%当前HP
      }
    }],
    category: '火属性爆发流·辅助',
    tags: ['火', '爆发流', '辅助', '延迟伤害', '百分比伤害']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】炎之意志
 * 为己方全体施加「炎之意志」
 * 持续2回合：攻击力+1级，速度+1级，火属性伤害+25%
 */
export const BLAZE_WILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'blaze_will',
    name: '炎之意志',
    description: '为己方全体施加「炎之意志」（持续2回合）：攻击+1级，速度+1级，火属性伤害+25%',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'blaze_will',
        duration: 2
      }
    }, {
      statBoost: {
        stat: 'attack',
        stages: 1,
        duration: 2
      }
    }, {
      statBoost: {
        stat: 'speed',
        stages: 1,
        duration: 2
      }
    }],
    category: '火属性爆发流·辅助',
    tags: ['火', '爆发流', '辅助', '群体强化', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 火属性爆发流技能库导出 ====================

/**
 * 火属性·爆发流技能库
 */
export const FIRE_BURST_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    EMBER,
    FLAME_PUNCH,
    FLARE_BLITZ,
    EXPLOSION_FLAME
  },
  
  // 防御倾向（2种）
  DEFENSE: {
    FIRE_SHIELD_SKILL,
    WALL_OF_FLAMES
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    FLAME_CHARGE_SKILL,
    COMBUSTION,
    BLAZE_WILL
  },
  
  // 全部技能
  ALL: [
    EMBER,
    FLAME_PUNCH,
    FLARE_BLITZ,
    EXPLOSION_FLAME,
    FIRE_SHIELD_SKILL,
    WALL_OF_FLAMES,
    FLAME_CHARGE_SKILL,
    COMBUSTION,
    BLAZE_WILL
  ]
};

/**
 * 获取技能倾向标签
 */
export function getFireSkillTendencyLabel(skill: Skill): string {
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
export function getFullFireSkillDescription(skill: Skill): string {
  const tendencyLabel = getFireSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
