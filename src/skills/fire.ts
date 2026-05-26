/**
 * 循迹之境 - 火属性·爆发流技能库
 * 
 * 基于"火属性 → 爆发流/OTK流"设计
 * 核心机制：蓄力爆发、高伤害单体、灼烧DOT
 * 
 * 技能分类：
 * - 攻击倾向（4种）：火花、烈焰拳、大字爆炎、爆炸烈焰
 * - 防御倾向（3种）：火盾、烈焰壁垒、灼热反击
 * - 辅助倾向（3种）：蓄焰、燃尽、炎之意志
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
  BurnDebuff,
  ChargeBuff,
  FireShieldBuff,
  WallOfFireBuff,
  HeatCounterBuff,
  FlameChargeBuff,
  CombustionBuff,
  BlazeWillBuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】火花
 * 基础火属性攻击，造成40威力伤害
 * 20%概率使目标陷入「灼伤」状态
 */
export const EMBER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ember',
    name: '火花',
    description: '攻击单体目标，造成40威力火属性伤害，20%概率使目标灼伤（每回合损失HP，持续3回合）',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 40,
        damageType: DamageType.SPECIAL,
        element: ElementType.FIRE
      },
      applyDebuff: {
        debuffType: 'burn' as any,
        duration: 3,
        stacks: 1,
        successRate: 0.2
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '灼伤']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】烈焰拳
 * 中高威力火属性攻击，造成75威力伤害（物理伤害类型）
 * 30%概率使目标陷入「灼伤」状态
 */
export const FLAME_PUNCH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'flame_punch',
    name: '烈焰拳',
    description: '攻击单体目标，造成75威力火属性伤害，30%概率使目标灼伤',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 75,
        damageType: DamageType.PHYSICAL,
        element: ElementType.FIRE
      },
      applyDebuff: {
        debuffType: 'burn' as any,
        duration: 3,
        stacks: 1,
        successRate: 0.3
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '灼伤', '物理伤害']
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
        debuffType: 'burn_mark' as any,
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
 * 终极爆发技能，蓄力1回合后造成150威力火属性伤害
 * 蓄力期间脆弱，若被攻击则技能取消
 * 攻击后使目标灼伤（必定生效）
 */
export const EXPLOSION_FLAME: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'explosion_flame',
    name: '爆炸烈焰',
    description: '蓄力1回合后发动，造成150威力火属性伤害，必定使目标灼伤【蓄力可被打断】',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 150,
        damageType: DamageType.SPECIAL,
        element: ElementType.FIRE
      },
      applyDebuff: {
        debuffType: 'burn' as any,
        duration: 3,
        stacks: 1,
        successRate: 1.0  // 必定灼伤
      }
    }],
    category: '火属性爆发流·攻击',
    tags: ['火', '爆发流', '攻击', '终极', '蓄力', '必定灼伤']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】火盾
 * 为己方单体生成50点护盾值
 * 护盾存在期间，若被攻击则对敌人造成30点火属性反伤
 */
export const FIRE_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'fire_shield_skill',
    name: '火盾',
    description: '为己方单体生成50点护盾（持续整场），受攻击时对敌人造成30点火属性反伤',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 50,
        duration: 999
      },
      applyBuff: {
        buffType: 'fire_shield' as any,
        duration: 999
      },
      special: {
        type: 'counter',
        value: 30
      }
    }],
    category: '火属性爆发流·防御',
    tags: ['火', '爆发流', '防御', '护盾', '反伤']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】烈焰壁垒
 * 为己方全体生成35点护盾，持续2回合
 * 护盾存在期间，对草属性和冰属性伤害抗性+30%
 */
export const WALL_OF_FLAMES: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'wall_of_flames',
    name: '烈焰壁垒',
    description: '为己方全体生成35点护盾（持续2回合），期间对草/冰属性抗性+30%',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 35,
        duration: 2
      },
      resistance: {
        element: 'grass',
        value: 0.3,
        duration: 2
      },
      resistance: {
        element: 'ice',
        value: 0.3,
        duration: 2
      }
    }],
    category: '火属性爆发流·防御',
    tags: ['火', '爆发流', '防御', '群体护盾', '属性抗性']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】灼热反击
 * 获得「灼热反击」状态，持续2回合
 * 受到攻击时反弹火属性伤害（伤害值=受到伤害的50%）
 */
export const HEAT_COUNTER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'heat_counter',
    name: '灼热反击',
    description: '获得「灼热反击」状态（持续2回合），受攻击时反弹50%伤害的火属性反击',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'heat_counter' as any,
        duration: 2
      },
      special: {
        type: 'counter',
        value: 0.5  // 50%反弹
      }
    }],
    category: '火属性爆发流·防御',
    tags: ['火', '爆发流', '防御', '反击', '反伤']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】蓄焰
 * 为己方单体施加「蓄焰」状态
 * 蓄焰：下次火属性攻击威力+50%
 * 持续3回合
 */
export const FLAME_CHARGE_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'flame_charge_skill',
    name: '蓄焰',
    description: '为己方单体施加「蓄焰」（持续3回合），下次火属性攻击威力+50%',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'flame_charge' as any,
        duration: 3,
        value: 0.5  // 50%增伤
      }
    }],
    category: '火属性爆发流·辅助',
    tags: ['火', '爆发流', '辅助', '增伤', '爆发准备']
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
        debuffType: 'combustion_mark' as any,
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
 * 持续2回合：攻击力+1级，速度+1级，火属性伤害+15%
 */
export const BLAZE_WILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'blaze_will',
    name: '炎之意志',
    description: '为己方全体施加「炎之意志」（持续2回合）：攻击+1级，速度+1级，火属性伤害+15%',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'blaze_will' as any,
        duration: 2
      },
      statBoost: {
        stat: 'attack',
        stages: 1,
        duration: 2
      },
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
  
  // 防御倾向（3种）
  DEFENSE: {
    FIRE_SHIELD_SKILL,
    WALL_OF_FLAMES,
    HEAT_COUNTER
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
    HEAT_COUNTER,
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
