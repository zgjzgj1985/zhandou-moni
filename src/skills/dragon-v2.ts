/**
 * 循迹之境 - 龙属性·血脉压制流技能库 v2.0
 * 
 * 基于"龙属性 → 成长爆发流/血脉压制流"设计
 * 核心机制：龙之气息层叠、龙属共鸣、成长爆发
 * 
 * 技能分类：
 * - 血脉成长（3种）：血脉觉醒、龙鳞连击、龙属共鸣（被动）
 * - 高威力攻击（4种）：龙之波动、龙之终焉、流星陨落、龙之碾压
 * - AOE与控制（3种）：龙息灼烧、龙之驱逐、龙威震慑
 * - 防御与共鸣（2种）：龙鳞守护、龙属共鸣·极
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
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 龙属性状态效果类型定义 ====================

/**
 * 龙属性状态效果类型
 */
export enum DragonStateType {
  DRAGON_BLOOD = 'DRAGON_BLOOD',           // 龙之气息
  DRAGON_RESONANCE = 'DRAGON_RESONANCE',   // 龙属共鸣
  DRAGON_GUARD = 'DRAGON_GUARD',           // 龙鳞守护
  DRAGON_AURA = 'DRAGON_AURA'             // 龙威
}

// ==================== 辅助函数 ====================

/**
 * 检查场上龙属性队友数量
 */
function countDragonAllies(unit: CombatUnit, allies: CombatUnit[]): number {
  return allies.filter(ally => 
    ally.elements.includes(ElementType.DRAGON) && 
    !ally.isDead && 
    ally.id !== unit.id
  ).length;
}

/**
 * 获取龙之气息加成文本
 */
function getDragonBloodBonusText(stacks: number): string {
  if (stacks === 0) return '';
  return `（消耗${stacks}层龙之气息：威力+${stacks * 15}）`;
}

// ==================== 血脉成长技能（3种）====================

/**
 * 【血脉成长1】血脉觉醒
 * 获得2层「龙之气息」+ 本回合下次攻击必定暴击
 * 当场上存在龙属性队友时，额外获得1层「龙之气息」
 */
export const DRAGON_BLOOD_AWAKENING: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_blood_awakening',
    name: '血脉觉醒',
    description: '获得2层「龙之气息」+ 本回合下次攻击必定暴击（有龙属性队友时额外+1层）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,  // 2能量
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      // 自定义效果：在战斗管理器中处理
      special: {
        type: 'dragon_blood_awakening' as any,
        value: 2  // 基础+2层
      }
    }],
    category: '龙血脉压制流·血脉成长',
    tags: ['龙', '血脉压制流', '成长', '龙之气息']
  };
  return new Skill(definition);
})();

/**
 * 【血脉成长2】龙鳞连击
 * 对目标造成3次20威力伤害，每次攻击后提升自身速度1级
 * 消耗3层「龙之气息」，每层增加10威力
 */
export const DRAGON_SCALE_SHOT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_scale_shot',
    name: '龙鳞连击',
    description: '对目标造成3次20威力物理伤害，每次攻击后提升自身速度1级（消耗3层龙之气息，每层+10威力）',
    type: 'action',
    energyCost: EnergyCost.LOW,  // 1能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    baseHits: 3,  // 3次攻击
    effects: [{
      damage: {
        basePower: 20,
        damageType: DamageType.PHYSICAL,
        element: ElementType.DRAGON,
        hits: 3
      },
      special: {
        type: 'dragon_scale_shot' as any,
        value: 3  // 消耗3层，每层+10威力
      }
    }],
    category: '龙血脉压制流·血脉成长',
    tags: ['龙', '血脉压制流', '攻击', '多段', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【血脉成长3】龙属共鸣（被动）
 * 每当友方龙属性单位行动时，获得1层「龙之气息」
 * 自身攻击时，消耗所有层数，每层增加15威力
 */
export const DRAGON_RESONANCE_PASSIVE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_resonance_passive',
    name: '龙属共鸣',
    description: '被动：龙队友行动时+1层龙之气息；攻击时消耗层数，每层+15威力',
    type: 'trait',
    energyCost: 0,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      special: {
        type: 'dragon_resonance_passive' as any
      }
    }],
    category: '龙血脉压制流·血脉成长',
    tags: ['龙', '血脉压制流', '被动', '龙之气息']
  };
  return new Skill(definition);
})();

// ==================== 高威力攻击技能（4种）====================

/**
 * 【高威力攻击1】龙之波动
 * 攻击目标，造成80威力特殊伤害
 * 无副作用，稳定高伤害
 */
export const DRAGON_PULSE_V2: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_pulse_v2',
    name: '龙之波动',
    description: '攻击单体目标，造成80威力特殊伤害',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,  // 2能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      }
    }],
    category: '龙血脉压制流·高威力攻击',
    tags: ['龙', '血脉压制流', '攻击', '高威力']
  };
  return new Skill(definition);
})();

/**
 * 【高威力攻击2】龙之终焉
 * 攻击目标，造成100威力特殊伤害
 * 使用后使目标陷入2-3回合「混乱」
 * 消耗「龙之气息」层数，每层+15威力，混乱回合+1（最多3回合）
 * 当层数≥5时，混乱效果被「龙属共鸣」抵消
 */
export const DRAGON_OBLIVION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_oblivion',
    name: '龙之终焉',
    description: '攻击单体，造成100威力物理伤害+2-3回合混乱（层数≥5时混乱被共鸣抵消）',
    type: 'action',
    energyCost: EnergyCost.ULTRA,  // 4能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 100,
        damageType: DamageType.PHYSICAL,
        element: ElementType.DRAGON
      },
      special: {
        type: 'dragon_oblivion' as any,
        value: 15  // 每消耗1层龙之气息，威力+15
      }
    }],
    category: '龙血脉压制流·高威力攻击',
    tags: ['龙', '血脉压制流', '攻击', '高威力', '混乱']
  };
  return new Skill(definition);
})();

/**
 * 【高威力攻击3】流星陨落
 * 对单体造成150威力特殊伤害
 * 使用后自身攻击力下降2级、特攻下降2级
 * 消耗「龙之气息」层数，每2层+30威力
 */
export const METEOR_FALL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'meteor_fall',
    name: '流星陨落',
    description: '对单体造成150威力特殊伤害，使用后自身攻击/特攻-2级（每2层龙之气息+30威力）',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,  // 5能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 150,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      },
      selfDebuff: {
        debuffType: 'dragon_power_loss' as any,
        duration: 999  // 永久
      },
      special: {
        type: 'meteor_fall' as any,
        value: 30  // 每消耗2层龙之气息，威力+30
      }
    }],
    category: '龙血脉压制流·高威力攻击',
    tags: ['龙', '血脉压制流', '攻击', '究极', '自损']
  };
  return new Skill(definition);
})();

/**
 * 【高威力攻击4】龙之碾压
 * 攻击目标，造成60威力特殊伤害
 * 目标每损失10%生命值，威力增加20%
 * 若目标HP低于30%，必定命中且必定暴击
 */
export const DRAGON_CRUSH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_crush',
    name: '龙之碾压',
    description: '攻击单体，60威力物理伤害（目标HP<50%时+50%）；HP<30%时必定暴击',
    type: 'action',
    energyCost: EnergyCost.HIGH,  // 3能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.PHYSICAL,
        element: ElementType.DRAGON
      },
      special: {
        type: 'dragon_crush' as any
      }
    }],
    category: '龙血脉压制流·高威力攻击',
    tags: ['龙', '血脉压制流', '攻击', '斩杀', '低HP增伤']
  };
  return new Skill(definition);
})();

// ==================== AOE与控制技能（3种）====================

/**
 * 【AOE与控制1】龙息灼烧
 * 对所有敌方单位造成50威力特殊伤害
 * 附加2回合「灼烧」状态（每回合受到15%最大生命值的伤害）
 * 消耗「龙之气息」层数，每层增加5%灼烧伤害
 */
export const DRAGON_BREATH_BURN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_breath_burn',
    name: '龙息灼烧',
    description: '攻击敌方全体，50威力特殊伤害+2回合灼烧（每层龙之气息+5%灼烧伤害）',
    type: 'action',
    energyCost: EnergyCost.HIGH,  // 3能量
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 50,
        damageType: DamageType.SPECIAL,
        element: ElementType.DRAGON
      },
      applyDebuffAll: {
        debuffType: 'dragon_burn' as any,
        duration: 2,
        successRate: 1.0
      },
      special: {
        type: 'dragon_breath_burn' as any,
        value: 5  // 每层龙之气息增加5%灼烧伤害
      }
    }],
    category: '龙血脉压制流·AOE与控制',
    tags: ['龙', '血脉压制流', '攻击', 'AOE', 'DOT']
  };
  return new Skill(definition);
})();

/**
 * 【AOE与控制2】龙之驱逐
 * 强制将目标与后排非战斗单位交换位置
 * 若目标无后排可交换，则造成80威力伤害并使其攻击-2级
 * 消耗「龙之气息」层数，每2层增加20威力
 */
export const DRAGON_EXPEL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_expel',
    name: '龙之驱逐',
    description: '强制目标与后排交换（无后排则造成80威力物理伤害+攻击-2级，每2层龙之气息+20威力）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,  // 2能量
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.PHYSICAL,
        element: ElementType.DRAGON
      },
      applyDebuff: {
        debuffType: 'attack' as any,
        stages: 2,
        duration: 3
      },
      special: {
        type: 'dragon_expel' as any,
        value: 20  // 每2层龙之气息增加20威力
      }
    }],
    category: '龙血脉压制流·AOE与控制',
    tags: ['龙', '血脉压制流', '攻击', '换人', '削弱']
  };
  return new Skill(definition);
})();

/**
 * 【AOE与控制3】龙威震慑
 * 使所有敌方单位攻击下降1级、速度下降1级，持续2回合
 * 若自身「龙之气息」层数≥4，效果范围扩大至全体，效果持续时间+1回合
 */
export const DRAGON_INTIMIDATE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_intimidate',
    name: '龙威震慑',
    description: '全体敌人攻击-1级、速度-1级，持续2回合（层数≥4时持续+1回合）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,  // 2能量
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuffAll: {
        debuffType: 'dragon_intimidate' as any,
        duration: 2,
        successRate: 1.0
      },
      special: {
        type: 'dragon_intimidate' as any
      }
    }],
    category: '龙血脉压制流·AOE与控制',
    tags: ['龙', '血脉压制流', '辅助', '控制', '群体弱化']
  };
  return new Skill(definition);
})();

// ==================== 防御与共鸣技能（2种）====================

/**
 * 【防御与共鸣1】龙鳞守护
 * 本回合受到的所有伤害降低75%
 * 获得基于「龙之气息」层数的护盾（每层15点）
 * 护盾存在期间，若受到攻击，反击30威力伤害
 */
export const DRAGON_SCALES_SHIELD_V2: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_scales_shield_v2',
    name: '龙鳞守护',
    description: '本回合受到伤害-75%，获得基于龙之气息层数的护盾（每层15点），护盾期间受击反击30威力',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,  // 2能量
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'dragon_guard' as any,
        duration: 1,
        value: 0.75  // 75%减伤
      },
      special: {
        type: 'dragon_scales_shield' as any,
        value: 30  // 反击伤害30威力
      }
    }],
    category: '龙血脉压制流·防御与共鸣',
    tags: ['龙', '血脉压制流', '防御', '减伤', '护盾', '反击']
  };
  return new Skill(definition);
})();

/**
 * 【防御与共鸣2】龙属共鸣·极（终极技）
 * 场上至少存在2只龙属性友方单位时可用
 * 消耗所有「龙之气息」层数，每层提供：15威力、10护盾、10%伤害减免
 * 若层数≥10，额外使所有敌方单位攻击力下降2级，持续3回合
 */
export const DRAGON_RESONANCE_ULTIMATE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dragon_resonance_ultimate',
    name: '龙属共鸣·极',
    description: '终极技：需2只龙队友在场，消耗所有龙之气息（每层：威力+15、护盾+10、减伤+10%）；层数≥10时全体敌人攻击-2级',
    type: 'action',
    energyCost: EnergyCost.ULTRA,  // 4能量
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      special: {
        type: 'dragon_resonance_ultimate' as any,
        value: 10  // 层数≥10触发终结效果
      }
    }],
    category: '龙血脉压制流·防御与共鸣',
    tags: ['龙', '血脉压制流', '终极', '共鸣', '消耗']
  };
  return new Skill(definition);
})();

// ==================== 龙血脉压制流技能库导出 ====================

/**
 * 龙属性·血脉压制流技能库 v2.0
 */
export const DRAGON_BLOOD_SKILLS = {
  // 血脉成长（3种）
  GROWTH: {
    DRAGON_BLOOD_AWAKENING,
    DRAGON_SCALE_SHOT,
    DRAGON_RESONANCE_PASSIVE
  },
  
  // 高威力攻击（4种）
  ATTACK: {
    DRAGON_PULSE_V2,
    DRAGON_OBLIVION,
    METEOR_FALL,
    DRAGON_CRUSH
  },
  
  // AOE与控制（3种）
  CONTROL: {
    DRAGON_BREATH_BURN,
    DRAGON_EXPEL,
    DRAGON_INTIMIDATE
  },
  
  // 防御与共鸣（2种）
  DEFENSE: {
    DRAGON_SCALES_SHIELD_V2,
    DRAGON_RESONANCE_ULTIMATE
  },
  
  // 全部技能
  ALL: [
    // 血脉成长
    DRAGON_BLOOD_AWAKENING,
    DRAGON_SCALE_SHOT,
    DRAGON_RESONANCE_PASSIVE,
    // 高威力攻击
    DRAGON_PULSE_V2,
    DRAGON_OBLIVION,
    METEOR_FALL,
    DRAGON_CRUSH,
    // AOE与控制
    DRAGON_BREATH_BURN,
    DRAGON_EXPEL,
    DRAGON_INTIMIDATE,
    // 防御与共鸣
    DRAGON_SCALES_SHIELD_V2,
    DRAGON_RESONANCE_ULTIMATE
  ] as Skill[]
};

/**
 * 获取龙属性技能列表（按分类）
 */
export function getDragonSkillsByCategory(category: 'GROWTH' | 'ATTACK' | 'CONTROL' | 'DEFENSE'): Skill[] {
  return DRAGON_BLOOD_SKILLS[category] as unknown as Skill[];
}

/**
 * 获取技能完整描述（含能量消耗和倾向）
 */
export function getFullDragonSkillDescription(skill: Skill): string {
  const tendencyLabel = getSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}

/**
 * 获取技能倾向标签
 */
function getSkillTendencyLabel(skill: Skill): string {
  const tendency = skill.definition.tendency;
  if (!tendency) return '【无倾向】';
  
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
