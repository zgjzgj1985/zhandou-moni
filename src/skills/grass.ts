/**
 * 循迹之境 - 草属性·光环流技能库
 * 
 * 基于"草属性 → 光环流/增益流"设计
 * 核心机制：层数叠加、持续增益、消耗型爆发
 * 
 * 技能分类：
 * - 攻击倾向（4种）：藤鞭连击、寄生种子、飞叶快刀、阳光烈焰
 * - 防御倾向（3种）：扎根之躯、藤蔓护甲、绿叶屏障
 * - 辅助倾向（3种）：成长之舞、寄生印记、光合爆发
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
  GrassShieldBuff,
  GrassResistBuff,
  GrassRegenBuff,
  VineTangleDebuff,
  ParasiteDebuff,
  LeafMarkDebuff,
  RootBoundDebuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

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

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】藤鞭连击
 * 攻击目标，造成55威力伤害，并获得1层「藤蔓之力」
 * 藤蔓之力：每层+1级攻击，最多叠加3层
 */
export const VINE_WHIP_COMBO: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'vine_whip_combo',
    name: '藤鞭连击',
    description: '攻击单体目标，造成55威力草属性伤害，获得1层「藤蔓之力」（每层+1级攻击，最多叠加3层）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 55,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '层数叠加', '攻击强化']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】寄生种子
 * 攻击目标，造成50威力伤害，并附加「寄生」状态
 * 寄生：每回合受到草属性伤害，同时施法者回复等量HP（持续3回合）
 */
export const PARASITIC_SEED: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'parasitic_seed',
    name: '寄生种子',
    description: '攻击单体目标，造成50威力草属性伤害，附加「寄生」（每回合受到草伤害+施法者回复等量HP，持续3回合）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 50,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '持续伤害', '吸血']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】飞叶快刀
 * 攻击目标，造成70威力伤害，附加「叶片标记」
 * 叶片标记：被标记目标受到草属性攻击时额外承受20%伤害（持续2回合）
 */
export const LEAF_BLADE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'leaf_blade',
    name: '飞叶快刀',
    description: '攻击单体目标，造成70威力草属性伤害，附加「叶片标记」（受到草属性攻击时+20%伤害，持续2回合）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 70,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '标记', '增伤']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】阳光烈焰
 * 蓄力1回合后发动，消耗所有增益层造成伤害
 * 每消耗1层增益，伤害提升30%；最高叠加时威力约169
 */
export const SOLAR_BEAM: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'solar_beam',
    name: '阳光烈焰',
    description: '蓄力1回合后发动，消耗所有增益层（每层+30%伤害）【终极爆发技能】',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 130,
        damageType: DamageType.SPECIAL,
        element: ElementType.GRASS
      }
    }],
    category: '草光环流·攻击',
    tags: ['草', '光环流', '攻击', '蓄力', '消耗增益', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】扎根之躯
 * 获得「扎根」状态，持续3回合
 * 扎根：每回合回复最大HP的8%，但速度永久降低1级
 */
export const ROOT_BOUND: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'root_bound',
    name: '扎根之躯',
    description: '获得「扎根」状态（持续3回合），每回合回复最大HP的8%，但速度永久-1级',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '持续回复', '速度降低']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】藤蔓护甲
 * 为己方单体生成护盾，护盾值受自身「藤蔓之力」层数影响
 * 每层藤蔓之力额外+20点护盾值（最多+60点）
 */
export const VINE_ARMOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'vine_armor',
    name: '藤蔓护甲',
    description: '为己方单体生成50点护盾（持续3回合），每层「藤蔓之力」额外+20点护盾',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 50
      }
    }],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '护盾', '层数联动']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】绿叶屏障
 * 为己方全体生成护盾，并对草属性攻击抗性+25%
 * 持续2回合
 */
export const LEAF_BARRIER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'leaf_barrier',
    name: '绿叶屏障',
    description: '为己方全体生成40点护盾（持续2回合），期间对草属性攻击抗性+25%',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 40
      }
    }],
    category: '草光环流·防御',
    tags: ['草', '光环流', '防御', '群体护盾', '抗性']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】成长之舞
 * 为己方单体施加「成长」状态
 * 成长：每回合获得+1级攻击和+1级特攻，最多叠加3层（持续3回合）
 */
export const GROWTH_DANCE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'growth_dance',
    name: '成长之舞',
    description: '为己方单体施加「成长」（每回合攻击+特攻各+1级，最多叠加3层，持续3回合）',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '持续强化', '层数叠加']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】寄生印记
 * 对单体敌人施加「寄生印记」
 * 寄生印记：每回合受到施法者最大HP的6%伤害，且施法者回复等量HP（持续4回合）
 * 印记叠加：多个寄生印记伤害递增
 */
export const PARASITE_MARK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'parasite_mark',
    name: '寄生印记',
    description: '对单体敌人施加「寄生印记」（每回合受到施法者HP的6%伤害+施法者回复，持续4回合）【印记可叠加】',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '持续伤害', '吸血', '印记']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】光合爆发
 * 消耗所有「藤蔓之力」和「成长」层数
 * 每消耗1层，回复施法者最大HP的15%
 * 同时清除己方全体的「寄生」状态
 */
export const PHOTOSYNTHESIS_BURST: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'photosynthesis_burst',
    name: '光合爆发',
    description: '消耗所有增益层（每层回复最大HP的15%），清除己方全体「寄生」状态【治愈型终极技能】',
    type: 'action',
    energyCost: EnergyCost.MEGA,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [],
    category: '草光环流·辅助',
    tags: ['草', '光环流', '辅助', '消耗增益', '治疗', '净化', '终极技能']
  };
  return new Skill(definition);
})();

// ==================== 草属性光环流技能库导出 ====================

/**
 * 草属性·光环流技能库
 */
export const GRASS_AURA_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    VINE_WHIP_COMBO,      // 藤鞭连击
    PARASITIC_SEED,       // 寄生种子
    LEAF_BLADE,           // 飞叶快刀
    SOLAR_BEAM            // 阳光烈焰
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    ROOT_BOUND,           // 扎根之躯
    VINE_ARMOR,           // 藤蔓护甲
    LEAF_BARRIER          // 绿叶屏障
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    GROWTH_DANCE,         // 成长之舞
    PARASITE_MARK,        // 寄生印记
    PHOTOSYNTHESIS_BURST // 光合爆发
  },
  
  // 全部技能
  ALL: [
    VINE_WHIP_COMBO,
    PARASITIC_SEED,
    LEAF_BLADE,
    SOLAR_BEAM,
    ROOT_BOUND,
    VINE_ARMOR,
    LEAF_BARRIER,
    GROWTH_DANCE,
    PARASITE_MARK,
    PHOTOSYNTHESIS_BURST
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
 * 计算草属性技能的实际威力（含层数加成）
 */
export function calculateGrassSkillPower(basePower: number, stackCount: number, bonusPerStack: number = 0.3): number {
  return Math.floor(basePower * (1 + stackCount * bonusPerStack));
}

/**
 * 检查草属性增益层数
 */
export function getGrassBuffStacks(unit: CombatUnit): number {
  // 返回单位当前的藤蔓之力/成长层数
  // 具体实现需要根据战斗系统中的Buff机制
  return 0;
}
