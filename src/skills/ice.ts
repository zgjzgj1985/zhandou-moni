/**
 * 循迹之境 - 冰属性·冰霜蓄力流技能库 v4.0
 * 
 * 基于"冰霜蓄力+破冰爆发"设计
 * 核心机制：冰霜叠加（3层触发冻结）、冰霜代价（每层+1技能消耗）、破冰双倍伤害
 * 
 * 设计文档：冰属性·冰霜蓄力流 v4.0
 * 
 * 技能分类：
 * - 攻击倾向（4种）：冰晶射击、霜冻之息、破冰斩、绝对零度
 * - 防御倾向（3种）：冰霜护甲、冰墙、极寒领域
 * - 辅助倾向（3种）：寒气凝聚、冰霜印记、永冻领域
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
const FROST_SHATTER_BONUS = 2.0;  // 破冰倍率：冻结目标×2伤害
const FROST_MAX_STACKS = 3;        // 最大冰霜层数
const FREEZE_DURATION = 1;         // 冻结持续回合

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】冰晶射击
 * 技能ID: ice_shot
 * 能量消耗: 1
 * 目标类型: 单体敌人
 * 技能威力: 35
 * 特效: 先手+冰霜+1层
 * 
 * 效果描述：如闪电般快速的射击，造成35威力冰属性伤害，使目标获得1层「冰霜」，先手攻击
 */
export const ICE_SHOT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_shot',
    name: '冰晶射击',
    description: '如闪电般快速的射击，造成35威力冰属性伤害，使目标获得1层「冰霜」，先手攻击',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    priority: 1,  // 先手
    effects: [{
      damage: {
        basePower: 35,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'frost',
        stacks: 1,
        maxStacks: FROST_MAX_STACKS  // 冰霜最大3层
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '先手', '冰霜']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】霜冻之息
 * 技能ID: frost_breath
 * 能量消耗: 2
 * 目标类型: 单体敌人
 * 技能威力: 50
 * 特效: 冰霜+2层
 * 
 * 效果描述：喷吐刺骨寒气，造成50威力冰属性伤害，使目标获得2层「冰霜」
 */
export const FROST_BREATH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_breath',
    name: '霜冻之息',
    description: '喷吐刺骨寒气，造成50威力冰属性伤害，使目标获得2层「冰霜」',
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
        debuffType: 'frost',
        stacks: 2,
        maxStacks: FROST_MAX_STACKS  // 冰霜最大3层
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '冰霜']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】破冰斩
 * 技能ID: ice_shatter
 * 能量消耗: 3
 * 目标类型: 单体敌人
 * 技能威力: 20 × 3（多段）
 * 特效: 多段冻结 + 攻击蓄力
 * 
 * 效果描述：连续三次斩击，共造成60威力冰属性伤害。
 * 每次命中目标有25%概率将其冻结，且有25%概率自身攻击+1级。
 */
export const ICE_SHATTER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_shatter',
    name: '破冰斩',
    description: '连续三次斩击，共造成60威力冰属性伤害。每次命中有25%概率冻结目标，25%概率自身攻击+1级',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 20,
        damageType: DamageType.PHYSICAL,
        element: ElementType.ICE,
        hits: 3  // 3次斩击
      },
      applyDebuff: {
        debuffType: 'freeze',
        duration: FREEZE_DURATION,
        successRate: 0.25  // 25%冻结概率
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '多段', '冻结', '攻击蓄力']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】绝对零度
 * 技能ID: absolute_zero
 * 能量消耗: 5
 * 目标类型: 单体敌人
 * 技能威力: 130
 * 特效: 蓄力+直接冻结
 * 
 * 效果描述：蓄力1回合后发动，造成130威力冰属性伤害，使目标直接进入「冻结」状态（跳过冰霜叠加）
 * 
 * 蓄力机制：
 * - 蓄力期间若被攻击则技能取消
 * - 蓄力成功后必定冻结目标
 */
export const ABSOLUTE_ZERO: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'absolute_zero',
    name: '绝对零度',
    description: '蓄力1回合后发动，造成130威力冰属性伤害，使目标直接进入「冻结」状态（跳过冰霜叠加）【蓄力可被打断】',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    chargeTurns: 1,
    canBeInterrupted: true,
    effects: [{
      damage: {
        basePower: 130,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'freeze',
        duration: FREEZE_DURATION  // 1回合冻结
      }
    }],
    category: '冰·冰霜蓄力流·攻击',
    tags: ['冰', '冰霜蓄力流', '攻击', '蓄力', '直接冻结', '终极']
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
 * 能量消耗: 2
 * 目标类型: 自身
 * 闪避效果: 50%
 * 持续回合: 2回合
 * 
 * 效果描述：创造一道冰墙屏障（持续2回合），本回合获得50%闪避，
 * 冰墙存在期间敌方每次攻击有25%概率被格挡
 */
export const ICE_WALL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_wall',
    name: '冰墙',
    description: '创造一道冰墙屏障（持续2回合），本回合获得50%闪避，冰墙存在期间敌方每次攻击有25%概率被格挡',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'ice_wall',
        duration: 2,
        value: 0.5  // 50%闪避
      }
    }],
    category: '冰·冰霜蓄力流·防御',
    tags: ['冰', '冰霜蓄力流', '防御', '闪避', '格挡']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】极寒领域
 * 技能ID: freezing_field
 * 能量消耗: 3
 * 目标类型: 自身
 * 减伤效果: 60%
 * 特效: 群体冰霜
 * 
 * 效果描述：展开极寒领域，本回合受到伤害降低60%，使敌方全体获得1层「冰霜」
 */
export const FREEZING_FIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'freezing_field',
    name: '极寒领域',
    description: '展开极寒领域，本回合受到伤害降低60%，使敌方全体获得1层「冰霜」',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'frost_field',
        duration: 1,
        value: 0.6  // 60%减伤
      },
      applyDebuffAll: {
        debuffType: 'frost',
        stacks: 1,
        maxStacks: FROST_MAX_STACKS  // 敌方全体+1层冰霜
      }
    }],
    category: '冰·冰霜蓄力流·防御',
    tags: ['冰', '冰霜蓄力流', '防御', '减伤', '群体冰霜', '领域']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】寒气凝聚
 * 技能ID: cold_aura
 * 能量消耗: 1
 * 目标类型: 己方单体
 * 加速效果: 速度+2级
 * 持续回合: 3回合
 * 
 * 效果描述：为己方单体赋予「寒气凝聚」，速度+2级（持续3回合）
 */
export const COLD_AURA: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'cold_aura',
    name: '寒气凝聚',
    description: '为己方单体赋予「寒气凝聚」，速度+2级（持续3回合）',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      statBoost: {
        stat: 'speed',
        stages: 2,
        duration: 3
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】冰霜印记
 * 技能ID: frost_mark
 * 能量消耗: 1
 * 目标类型: 单体敌人
 * 持续回合: 3回合
 * 特效: 下次冰系攻击额外+1层
 * 
 * 效果描述：为目标施加「冰霜印记」（持续3回合），下次受到冰属性攻击时，额外获得1层冰霜
 */
export const FROST_MARK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_mark',
    name: '冰霜印记',
    description: '为目标施加「冰霜印记」（持续3回合），下次受到冰属性攻击时，额外获得1层冰霜',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'frost_mark',
        duration: 3,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '冰霜强化', '印记']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】永冻领域
 * 技能ID: eternal_frost_domain
 * 能量消耗: 5
 * 目标类型: 敌方全体
 * 持续回合: 3回合
 * 特效: 群体冰霜
 * 
 * 效果描述：创造永冻领域（持续3回合），使敌方全体获得2层「冰霜」
 */
export const ETERNAL_FROST_DOMAIN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'eternal_frost_domain',
    name: '永冻领域',
    description: '创造永冻领域（持续3回合），使敌方全体获得2层「冰霜」',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuffAll: {
        debuffType: 'frost',
        stacks: 2,
        maxStacks: FROST_MAX_STACKS  // 全体+2层冰霜
      }
    }],
    category: '冰·冰霜蓄力流·辅助',
    tags: ['冰', '冰霜蓄力流', '辅助', '群体冰霜', '终极领域']
  };
  return new Skill(definition);
})();

// ==================== 冰霜蓄力流技能库导出 ====================

/**
 * 冰属性·冰霜蓄力流技能库 v4.0
 */
export const ICE_SHATTER_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    ICE_SHOT,      // 冰晶射击
    FROST_BREATH,  // 霜冻之息
    ICE_SHATTER,   // 破冰斩
    ABSOLUTE_ZERO  // 绝对零度
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    FROST_ARMOR,      // 冰霜护甲
    ICE_WALL,         // 冰墙
    FREEZING_FIELD    // 极寒领域
  },
  
  // 辅助倾向（3种）
  SUPPORT: {
    COLD_AURA,           // 寒气凝聚
    FROST_MARK,          // 冰霜印记
    ETERNAL_FROST_DOMAIN // 永冻领域
  },
  
  // 全部技能
  ALL: [
    ICE_SHOT,           // 冰晶射击
    FROST_BREATH,       // 霜冻之息
    ICE_SHATTER,        // 破冰斩
    ABSOLUTE_ZERO,      // 绝对零度
    FROST_ARMOR,        // 冰霜护甲
    ICE_WALL,           // 冰墙
    FREEZING_FIELD,     // 极寒领域
    COLD_AURA,          // 寒气凝聚
    FROST_MARK,         // 冰霜印记
    ETERNAL_FROST_DOMAIN // 永冻领域
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
 * 计算破冰斩对冻结目标的伤害
 * @param basePower 基础威力
 * @param isFrozen 目标是否冻结
 * @returns 最终伤害
 */
export function calculateShatterDamage(basePower: number, isFrozen: boolean): number {
  if (isFrozen) {
    return Math.floor(basePower * FROST_SHATTER_BONUS);
  }
  return basePower;
}

/**
 * 计算冰霜代价（技能额外消耗）
 * @param frostStacks 冰霜层数
 * @param baseCost 基础能量消耗
 * @returns 最终能量消耗
 */
export function calculateFrostCost(frostStacks: number, baseCost: number): number {
  return baseCost + frostStacks;
}
