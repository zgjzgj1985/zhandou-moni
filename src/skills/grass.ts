/**
 * 循迹之境 - 草属性·光环流技能库 v2.0
 * 
 * 基于洛克王国世界草系技能设计
 * 核心机制：光能汇聚、芬芳环境、养分循环
 * 
 * 技能分类：
 * - 攻击倾向（5种）：纤维化、叶绿光束、光能爆轰、韶光、绽放之舞
 * - 防御倾向（3种）：扎根之躯、藤蔓护甲、防反之姿
 * - 辅助倾向（4种）：芬芳绽放、光能聚集、寄生之种、养分汲取
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
  getEnergyCostText,
  BuffType
} from '../types';
import {
  Buff,
  Debuff,
  VineBodyBuff,
  RootBoundBuff,
  LightGatherBuff,
  FragrantEnvBuff,
  CounterStanceBuff,
  NutrientBuff,
  ParasiteDebuff,
  TangleDebuff,
  WitherDebuff
} from '../effects';

// ==================== 技能倾向工厂函数 ====================

/**
 * 创建带倾向的攻击技能
 */
export function createGrassAttackSkill(
  id: string,
  name: string,
  description: string,
  basePower: number,
  target: SkillTarget,
  energyCost: number = 2,
  damageType: DamageType = DamageType.SPECIAL
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
        damageType,
        element: ElementType.GRASS
      }
    }],
    tags: ['草', '光环流', '攻击']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的防御技能
 */
export function createGrassDefenseSkill(
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
    tags: ['草', '光环流', '防御']
  };
  return new Skill(definition);
}

/**
 * 创建带倾向的辅助技能
 */
export function createGrassSupportSkill(
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
    tags: ['草', '光环流', '辅助']
  };
  return new Skill(definition);
}

// ==================== 攻击倾向技能（5种）====================

/**
 * 【攻击倾向1】纤维化 v2.0
 * 攻击目标，造成40威力伤害，获得1层「光能汇聚」
 * 光能汇聚：下次使用的草系输出技能威力+60
 */
export const FIBER_WEAVE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'fiber_weave',
    name: '纤维化',
    description: '攻击单体目标，造成40威力物理伤害，获得1层光能汇聚（下次草系输出技能+60威力）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 40,
        damageType: DamageType.PHYSICAL,
        element: ElementType.GRASS
      }
    }, {
      applyBuff: {
        buffType: BuffType.LIGHT_GATHER,
        duration: 999,
        stacks: 1
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '光能汇聚', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】叶绿光束 v2.0
 * 攻击目标，造成80威力伤害
 * 若处于芬芳环境中，额外附加「枯萎」状态
 * 枯萎：每回合受到自身属性10点威力特殊伤害/层，持续2回合
 */
export const LEAF_BEAM: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'leaf_beam',
    name: '叶绿光束',
    description: '攻击单体目标，造成80威力物理伤害，若处于芬芳环境则附加1层枯萎（每回合受到自身属性10点威力特殊伤害/层）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.PHYSICAL,
        element: ElementType.GRASS
      }
    }, {
      applyDebuff: {
        debuffType: 'wither' as any,
        duration: 2
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '枯萎', '芬芳联动', '物理']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】绽放之舞 v2.0
 * 攻击目标，造成90威力物理伤害
 * 本次攻击必定暴击（伤害×1.5）
 */
export const BLOOM_DANCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'bloom_dance',
    name: '绽放之舞',
    description: '攻击单体目标，造成90威力物理伤害，本回合必定暴击（×1.5）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.PHYSICAL,
        element: ElementType.GRASS,
        guaranteed: true
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '物理', '必定暴击']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】韶光 v2.0
 * 攻击目标，造成140威力伤害
 * 召唤「芬芳环境」（持续4回合）
 * 若已有芬芳环境，额外提升本次伤害20%
 */
export const SPLENDOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'splendor',
    name: '韶光',
    description: '攻击单体目标，造成140威力特殊伤害，召唤芬芳环境（持续4回合），已有环境时伤害+20%',
    type: 'action',
    energyCost: EnergyCost.ENVIRONMENT,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 140,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }, {
      applyBuff: {
        buffType: BuffType.FRAGRANT_ENV,
        duration: 4
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '芬芳环境', '高威力']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向5】光能爆轰 v2.0
 * 消耗所有「光能汇聚」层数，造成伤害
 * 伤害公式：100 + 60×层数
 * 3层光能时：100 + 180 = 280威力
 */
export const SOLAR_DETONATION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'solar_detonation',
    name: '光能爆轰',
    description: '消耗所有光能汇聚层数，造成（100+60×层数）威力特殊伤害【消耗型终极技能】',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 100,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '消耗光能', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】扎根之躯 v2.0
 * 获得「扎根」状态，持续3回合
 * 扎根：每回合回复最大HP的8%，但速度-1级
 */
export const ROOT_BOUND: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'root_bound',
    name: '扎根之躯',
    description: '获得扎根状态（持续3回合），每回合回复最大HP的8%，但速度-1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.ROOT_BOUND,
        duration: 3
      }
    }, {
      statBoost: {
        stat: 'speed',
        stages: -1,
        duration: 999
      }
    }],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '持续回复', '速度降低']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】藤蔓护甲 v2.0
 * 本回合受到伤害降低50%
 * 受到攻击时缠绕目标（使目标速度-2级）
 */
export const VINE_ARMOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'vine_armor',
    name: '藤蔓护甲',
    description: '本回合受到伤害降低50%，受到攻击时缠绕攻击者（速度-2级）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.VINE_BODY,
        duration: 1,
        value: 0.5
      }
    }],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '减伤', '缠绕']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】防反之姿 v2.0
 * 获得「防反」状态
 * 敌方使用攻击技能时，反弹60%伤害
 * 反弹后获得先手+1效果
 */
export const GRASS_COUNTER_STANCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'grass_counter_stance',
    name: '防反之姿',
    description: '获得防反状态（持续1回合），敌方攻击时反弹60%伤害，反弹后获得先手+1',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.COUNTER_STANCE,
        duration: 1
      }
    }],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '反弹', '先手']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（4种）====================

/**
 * 【辅助倾向1】芬芳绽放 v2.0
 * 召唤「芬芳环境」
 * 芬芳环境效果（持续4回合）：
 * - 己方草系技能伤害+25%
 * - 己方草系单位每回合回复5%HP
 */
export const FRAGRANT_BLOOM: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'fragrant_bloom',
    name: '芬芳绽放',
    description: '召唤芬芳环境（持续4回合）：己方草系技能伤害+25%，每回合回复5%HP',
    type: 'action',
    energyCost: EnergyCost.ENVIRONMENT,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.FRAGRANT_ENV,
        duration: 4
      }
    }],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '芬芳环境', '群体增益']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】光能聚集 v2.0
 * 获得1层「光能汇聚」
 * 光能汇聚：下次使用的草系输出技能威力+60
 */
export const LIGHT_GATHER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'light_gather',
    name: '光能聚集',
    description: '获得1层光能汇聚（下次草系输出技能+60威力）【核心攒层技能】',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.LIGHT_GATHER,
        duration: 999,
        stacks: 1
      }
    }],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '光能汇聚', '核心技能']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】寄生之种 v2.0
 * 对单体敌人施加「寄生种子」
 * 寄生：每回合受到施法者最大HP的6%伤害
 * 施法者回复等量HP（持续4回合）
 */
export const PARASITIC_SEED: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'parasitic_seed',
    name: '寄生之种',
    description: '对单体敌人施加寄生种子（每回合受到施法者HP的6%伤害+施法者回复，持续4回合）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'parasite' as any,
        duration: 4
      }
    }],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '持续伤害', '吸血']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向4】养分汲取 v2.0
 * 为己方单体回复最大HP的20%
 * 使目标获得4点能量
 */
export const NUTRIENT_ABSORPTION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'nutrient_absorption',
    name: '养分汲取',
    description: '为己方单体回复最大HP的20%，并使其获得4点能量',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      healing: {
        amount: 0,
        percent: 0.2
      }
    }, {
      applyBuff: {
        buffType: BuffType.NUTRIENT,
        duration: 999,
        value: 4
      }
    }],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '治疗', '充能']
  };
  return new Skill(definition);
})();

// ==================== 草属性光环流技能库导出 ====================

/**
 * 草属性·光环流技能库 v2.0
 */
export const GRASS_AURA_SKILLS = {
  // 攻击倾向（5种）
  ATTACK: {
    FIBER_WEAVE,           // 纤维化
    LEAF_BEAM,             // 叶绿光束
    BLOOM_DANCE,           // 绽放之舞
    SPLENDOR,              // 韶光
    SOLAR_DETONATION       // 光能爆轰
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    ROOT_BOUND,             // 扎根之躯
    VINE_ARMOR,            // 藤蔓护甲
    GRASS_COUNTER_STANCE   // 防反之姿
  },
  
  // 辅助倾向（4种）
  SUPPORT: {
    FRAGRANT_BLOOM,         // 芬芳绽放
    LIGHT_GATHER,           // 光能聚集
    PARASITIC_SEED,        // 寄生之种
    NUTRIENT_ABSORPTION    // 养分汲取
  },
  
  // 全部技能
  ALL: [
    FIBER_WEAVE,
    LEAF_BEAM,
    BLOOM_DANCE,
    SPLENDOR,
    SOLAR_DETONATION,
    ROOT_BOUND,
    VINE_ARMOR,
    GRASS_COUNTER_STANCE,
    FRAGRANT_BLOOM,
    LIGHT_GATHER,
    PARASITIC_SEED,
    NUTRIENT_ABSORPTION
  ]
};

/**
 * 获取技能倾向标签（草属性专用）
 */
export function getGrassSkillTendencyLabel(skill: Skill): string {
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
 * 获取技能完整描述（草属性专用）
 */
export function getGrassSkillDescription(skill: Skill): string {
  const tendencyLabel = getGrassSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}

/**
 * 计算草属性技能的实际威力（含光能汇聚加成）
 */
export function calculateGrassSkillPower(basePower: number, lightGatherStacks: number, bonusPerStack: number = 60): number {
  return basePower + (lightGatherStacks * bonusPerStack);
}

/**
 * 获取光能汇聚加成威力
 */
export function getLightGatherBonus(stacks: number, bonusPerStack: number = 60): number {
  return stacks * bonusPerStack;
}
