/**
 * 循迹之境 - 冰属性·冰霜蓄力流技能库 v5.0
 *
 * 基于"冰霜蓄力"设计
 * 核心机制：冰霜叠加（3层触发冻结）、冰霜代价（速度-1级/层）
 *
 * 设计文档：冰属性·冰霜蓄力流 v5.0
 *
 * 技能分类：
 * - 攻击倾向（5种）：冰晶射击、霜冻之息、冰锥、冰锤、冰爆
 * - 防御倾向（2种）：冰霜护甲、冰墙
 * - 辅助倾向（3种）：寒气凝聚、冰霜印记、冻土
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

// ==================== 常量定义 ====================

/** 冰霜蓄力流核心常量 */
const FROST_MAX_STACKS = 3;        // 最大冰霜层数
const FREEZE_DURATION = 1;         // 冻结持续回合

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】冰晶射击
 * 技能ID: ice_shot
 * 能量消耗: 1
 * 目标类型: 单体敌人
 * 技能威力: 35
 * 特效: 冰霜+1层
 * 
 * 效果描述：造成35威力特殊伤害，使目标获得1层「冰霜」
 */
export const ICE_SHOT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_shot',
    name: '冰晶射击',
    description: '造成35威力特殊伤害，使目标获得1层「冰霜」',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    priority: 1,  // 先手技能（参考宝可梦冰砾）
    effects: [{
      damage: {
        basePower: 35,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'frost',
        stacks: 1,
        maxStacks: FROST_MAX_STACKS
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '冰霜']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】霜冻之息
 * 技能ID: frost_breath
 * 能量消耗: 2
 * 目标类型: 单体敌人
 * 技能威力: 50
 * 特效: 极寒印记（下次技能能耗+2）
 * 
 * 效果描述：喷吐刺骨寒气，造成50威力特殊伤害并附加「极寒印记」（下次使用技能能耗+2）
 */
export const FROST_BREATH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_breath',
    name: '霜冻之息',
    description: '喷吐刺骨寒气，造成50威力特殊伤害并附加「极寒印记」（下次使用技能能耗+2）',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 50,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'extreme_cold_mark',
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '冰霜']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】冰锥
 * 技能ID: icicle_spear
 * 能量消耗: 2
 * 目标类型: 单体敌人
 * 技能威力: 25（每次命中）
 * 连击次数: 随机2-5次
 *
 * 效果描述：发射锋利的冰锥进行连击，造成25威力×2-5次物理伤害。
 * 总威力范围：50-125威力（平均约87威力）
 * 参考宝可梦"Icicle Spear"，是该系列标志性随机连击技能。
 */
export const ICICLE_SPEAR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'icicle_spear',
    name: '冰锥',
    description: '发射锋利的冰锥进行连击，造成25威力×2-5次物理伤害',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    minHits: 2,
    maxHits: 5,
    effects: [{
      damage: {
        basePower: 25,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ICE,
        hits: 3  // 默认3次，实际由minHits/maxHits决定
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '多段', '随机连击']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】冰锤
 * 技能ID: ice_hammer
 * 能量消耗: 4
 * 目标类型: 单体敌人
 * 技能威力: 100
 * 特效: 代价机制 - 使用后自身速度-1级
 *
 * 效果描述：挥舞沉重的冰锤砸向敌人，造成100威力物理伤害，
 * 但寒气反噬使自身速度降低1级。
 * 参考宝可梦"Ice Hammer"，高威力但附带代价的典型设计。
 */
export const ICE_HAMMER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_hammer',
    name: '冰锤',
    description: '挥舞沉重的冰锤砸向敌人，造成100威力物理伤害，但寒气反噬使自身速度降低1级',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 100,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ICE
      },
      selfStatBoost: {
        stat: 'speed',
        stages: -1,
        duration: 999  // 永久直到被净化
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '高威力', '代价机制']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】冰爆
 * 技能ID: ice_explosion
 * 能量消耗: 5
 * 目标类型: 单体敌人
 * 技能威力: 130
 * 特效: 冻结增伤
 *
 * 效果描述：造成130威力物理伤害，如果目标处于「冻结」状态则造成3倍伤害
 */
export const ICE_EXPLOSION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_explosion',
    name: '冰爆',
    description: '造成130威力物理伤害，如果目标处于「冻结」状态则造成3倍伤害',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 130,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE,
        conditionMultiplier: {
          condition: 'freeze',
          multiplier: 3
        }
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '冻结增伤', '终极']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】冰霜护甲
 * 技能ID: frost_armor
 * 能量消耗: 2
 * 目标类型: 自身
 * 减伤效果: 50%
 * 特效: 冰霜反击
 * 
 * 效果描述：生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者获得1层「冰霜」
 */
export const FROST_ARMOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_armor',
    name: '冰霜护甲',
    description: '生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者获得1层「冰霜」',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'ice_armor',
        duration: 1,
        value: 0.5  // 50%减伤
      }
    }],
    category: '冰·冰霜蓄力流·防御',
    tags: ['冰', '冰霜蓄力流', '防御', '减伤', '冰霜反击']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】冰墙
 * 技能ID: ice_wall
 * 能量消耗: 3
 * 目标类型: 己方单体
 * 减伤效果: 50%
 * 持续回合: 2回合
 *
 * 效果描述：创造冰墙屏障（持续2回合），获得50%伤害减免
 */
export const ICE_WALL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_wall',
    name: '冰墙',
    description: '创造冰墙屏障（持续2回合），获得50%伤害减免',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'ice_wall',
        duration: 2,
        value: 0.5  // 50%减伤
      }
    }],
    category: '冰·冰霜蓄力流·防御',
    tags: ['冰', '冰霜蓄力流', '防御', '减伤', '护盾']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】寒气凝聚
 * 技能ID: cold_aura
 * 能量消耗: 1
 * 目标类型: 己方单体
 * 强化效果: 防御+1级
 * 持续回合: 2回合
 *
 * 效果描述：为己方单体赋予「寒气凝聚」，防御+1级（持续2回合）
 */
export const COLD_AURA: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'cold_aura',
    name: '寒气凝聚',
    description: '为己方单体赋予「寒气凝聚」，防御+1级（持续2回合）',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      statBoost: {
        stat: 'defense',
        stages: 1,
        duration: 2
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '防御强化']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】冰霜印记
 * 技能ID: frost_mark
 * 能量消耗: 1
 * 目标类型: 单体敌人
 * 持续回合: 2回合
 * 特效: 受到冰属性攻击时，有25%概率附加1层冰霜
 * 
 * 效果描述：为目标施加「冰霜印记」（持续2回合），受到冰属性攻击时，有25%概率附加1层「冰霜」
 */
export const FROST_MARK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_mark',
    name: '冰霜印记',
    description: '为目标施加「冰霜印记」（持续2回合），受到冰属性攻击时，有25%概率附加1层「冰霜」',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'frost_mark',
        duration: 2,
        stacks: 1,
        successRate: 0.25
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '冰霜强化', '印记']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】冻土
 * 技能ID: frozen_land
 * 能量消耗: 5
 * 目标类型: 己方全体
 * 持续回合: 3回合
 * 特效: 冻土环境
 *
 * 效果描述：创造冻土环境，所有生物冰属性技能能量消耗-1（持续3回合）
 */
export const FROZEN_LAND: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frozen_land',
    name: '冻土',
    description: '创造冻土环境，所有生物冰属性技能能量消耗-1（持续3回合）',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: 'frozen_land_env',
        duration: 3,
        value: 1  // 冰属性技能能耗-1
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '环境', '冻土', '终极领域']
  };
  return new Skill(definition);
})();

// ==================== 冰霜蓄力流技能库导出 ====================

/**
 * 冰属性·冰霜蓄力流技能库 v5.0
 */
export const ICE_SHARD_SKILLS = {
  // 攻击倾向（5种）
  ATTACK: {
    ICE_SHOT,         // 冰晶射击
    FROST_BREATH,    // 霜冻之息
    ICICLE_SPEAR,    // 冰锥（随机连击）
    ICE_HAMMER,      // 冰锤（代价机制）
    ICE_EXPLOSION    // 冰爆
  },

  // 防御倾向（2种）
  DEFENSE: {
    FROST_ARMOR,      // 冰霜护甲
    ICE_WALL         // 冰墙
  },

  // 辅助倾向（3种）
  SUPPORT: {
    COLD_AURA,           // 寒气凝聚
    FROST_MARK,          // 冰霜印记
    FROZEN_LAND         // 冻土
  },

  // 全部技能
  ALL: [
    ICE_SHOT,           // 冰晶射击
    FROST_BREATH,      // 霜冻之息
    ICICLE_SPEAR,      // 冰锥（随机连击）
    ICE_HAMMER,        // 冰锤（代价机制）
    ICE_EXPLOSION,     // 冰爆
    FROST_ARMOR,       // 冰霜护甲
    ICE_WALL,          // 冰墙
    COLD_AURA,         // 寒气凝聚
    FROST_MARK,        // 冰霜印记
    FROZEN_LAND        // 冻土
  ]
};

/**
 * 获取技能倾向标签
 */
export function getIceSkillTendencyLabel(skill: Skill): string {
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
export function getFullIceSkillDescription(skill: Skill): string {
  const tendencyLabel = getIceSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}

/**
 * 计算冰锥的随机连击次数（2-5次）
 * @returns 随机连击次数
 */
export function calculateIcicleSpearHits(): number {
  const min = 2;
  const max = 5;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 计算冰锥的实际总威力
 * @param basePower 基础威力（25）
 * @returns 总威力
 */
export function calculateIcicleSpearTotalPower(basePower: number): number {
  const hits = calculateIcicleSpearHits();
  return basePower * hits;
}

/**
 * 计算冰霜代价（速度降低级数）
 * @param frostStacks 冰霜层数
 * @returns 速度降低级数
 */
export function calculateFrostSpeedPenalty(frostStacks: number): number {
  return frostStacks;
}
