/**
 * 循迹之境 - 冰属性·冻结破冰流技能库 v3.0
 * 
 * 基于"冰属性 → 冻结控制+破冰爆发"设计
 * 核心机制：冻结、破冰、碎冰追击，战场控制
 * 
 * 设计文档：冰属性·冻结破冰流 v3.0
 * 
 * 技能分类：
 * - 攻击倾向（4种）：冰晶射击、霜冻之息、破冰斩、绝对零度
 * - 防御倾向（3种）：冰霜护甲、冰墙、极寒领域
 * - 辅助倾向（3种）：寒气凝聚、冰霜印记、永冻领域
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
  SkillTendency
} from '../types';
import {
  Buff,
  Debuff,
  IceArmorBuff,
  IceWallBuff,
  FrostFieldBuff,
  FrostMarkBuff,
  FreezeDebuff,
  DeepFreezeDebuff,
  AbsoluteFreezeDebuff,
  FrostMarkDebuff,
  SlowDebuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 常量定义 ====================

/** 冻结破冰流核心常量 */
const ICE_SHATTER_BONUS = 1.8;      // 破冰倍率：冻结目标+80%伤害
const SHATTER_FOLLOW_UP_POWER = 40;  // 碎冰追击威力

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】冰晶射击
 * 技能ID: ice_shot
 * 能量消耗: 1
 * 目标类型: 单体敌人
 * 技能威力: 40
 * 特效: 先手+冻结铺垫
 * 
 * 效果描述：如闪电般快速的射击，造成40威力冰属性伤害，15%概率冻结目标，先手攻击
 */
export const ICE_SHOT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_shot',
    name: '冰晶射击',
    description: '如闪电般快速的射击，造成40威力冰属性伤害，15%概率冻结目标，先手攻击',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 40,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'freeze' as any,
        duration: 999,
        successRate: 0.15  // 15%冻结概率
      }
    }],
    category: '冰·冻结破冰流·攻击',
    tags: ['冰', '冻结破冰流', '攻击', '先手', '冻结']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】霜冻之息
 * 技能ID: frost_breath
 * 能量消耗: 2
 * 目标类型: 单体敌人
 * 技能威力: 60
 * 冻结概率: 25%
 * 
 * 效果描述：喷吐刺骨寒气，造成60威力冰属性伤害，25%概率使目标冻结
 */
export const FROST_BREATH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_breath',
    name: '霜冻之息',
    description: '喷吐刺骨寒气，造成60威力冰属性伤害，25%概率使目标冻结',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'freeze' as any,
        duration: 999,
        successRate: 0.25  // 25%冻结概率
      }
    }],
    category: '冰·冻结破冰流·攻击',
    tags: ['冰', '冻结破冰流', '攻击', '冻结']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】破冰斩
 * 技能ID: ice_shatter
 * 能量消耗: 3
 * 目标类型: 单体敌人
 * 技能威力: 70（基础）/ 126（破冰）
 * 特效: 破冰倍率+碎冰追击
 * 
 * 效果描述：对目标发动毁灭性斩击。造成70威力冰属性伤害。
 * 若目标已冻结，伤害提升至126（+80%），并触发碎冰追击（追加40威力）
 * 
 * 特殊机制：
 * - 破冰倍率：冻结目标+80%伤害
 * - 碎冰追击：破冰成功后追加40威力追击
 * - 总伤害：70基础 → 126破冰 → 166碎冰
 */
export const ICE_SHATTER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'ice_shatter',
    name: '破冰斩',
    description: '对目标发动毁灭性斩击。造成70威力冰属性伤害。若目标已冻结，伤害提升至126（+80%），并触发碎冰追击（追加40威力）',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 70,
        damageType: DamageType.SPECIAL,
        element: ElementType.ICE
      },
      special: {
        type: 'ice_shatter' as any,
        value: ICE_SHATTER_BONUS,  // +80%破冰倍率
        targetElement: ElementType.ICE
      }
    }],
    category: '冰·冻结破冰流·攻击',
    tags: ['冰', '冻结破冰流', '攻击', '破冰', '碎冰追击']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】绝对零度
 * 技能ID: absolute_zero
 * 能量消耗: 5
 * 目标类型: 单体敌人
 * 技能威力: 150
 * 特效: 蓄力+必定冻结+深冻
 * 
 * 效果描述：蓄力1回合后发动，造成150威力冰属性伤害，100%概率使目标进入「深冻」状态
 * 
 * 蓄力机制：
 * - 蓄力期间若被攻击则技能取消
 * - 蓄力成功后必定冻结目标
 * 
 * 深冻效果：
 * - 持续3回合
 * - 每回合仅10%概率自动解冻
 * - 受伤时解除
 */
export const ABSOLUTE_ZERO: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'absolute_zero',
    name: '绝对零度',
    description: '蓄力1回合后发动，造成150威力冰属性伤害，100%概率使目标进入「深冻」状态【蓄力可被打断】',
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
        element: ElementType.ICE
      },
      applyDebuff: {
        debuffType: 'deep_freeze' as any,
        duration: 3,
        successRate: 1.0  // 100%深冻
      }
    }],
    category: '冰·冻结破冰流·攻击',
    tags: ['冰', '冻结破冰流', '攻击', '蓄力', '深冻', '终极']
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
 * 特效: 冻结反击
 * 
 * 效果描述：生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者冻结1回合
 */
export const FROST_ARMOR: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_armor',
    name: '冰霜护甲',
    description: '生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者冻结1回合',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'ice_armor' as any,
        duration: 1,
        value: 0.5  // 50%减伤
      }
    }],
    category: '冰·冻结破冰流·防御',
    tags: ['冰', '冻结破冰流', '防御', '减伤', '冻结反击']
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
        buffType: 'ice_wall' as any,
        duration: 2,
        value: 0.5  // 50%闪避
      }
    }],
    category: '冰·冻结破冰流·防御',
    tags: ['冰', '冻结破冰流', '防御', '闪避', '格挡']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】极寒领域
 * 技能ID: freezing_field
 * 能量消耗: 3
 * 目标类型: 自身
 * 减伤效果: 60%
 * 特效: 群体减速+冻结铺垫
 * 
 * 效果描述：展开极寒领域，本回合受到伤害降低60%，敌方全体每次行动前有30%概率被冻结
 */
export const FREEZING_FIELD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'freezing_field',
    name: '极寒领域',
    description: '展开极寒领域，本回合受到伤害降低60%，敌方全体每次行动前有30%概率被冻结',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'frost_field' as any,
        duration: 1,
        value: 0.6  // 60%减伤
      }
    }],
    category: '冰·冻结破冰流·防御',
    tags: ['冰', '冻结破冰流', '防御', '减伤', '群体冻结', '领域']
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
    category: '冰·冻结破冰流·辅助',
    tags: ['冰', '冻结破冰流', '辅助', '加速']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】冰霜印记
 * 技能ID: frost_mark
 * 能量消耗: 2
 * 目标类型: 单体敌人
 * 持续回合: 3回合
 * 特效: 下次冻结概率+30%
 * 
 * 效果描述：为目标施加「冰霜印记」（持续3回合），下次受到冰属性攻击时，冻结概率+30%
 */
export const FROST_MARK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'frost_mark',
    name: '冰霜印记',
    description: '为目标施加「冰霜印记」（持续3回合），下次受到冰属性攻击时，冻结概率+30%',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'frost_mark' as any,
        duration: 3,
        stacks: 1,
        successRate: 1.0
      }
    }],
    category: '冰·冻结破冰流·辅助',
    tags: ['冰', '冻结破冰流', '辅助', '冻结强化', '印记']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】永冻领域
 * 技能ID: eternal_frost_domain
 * 能量消耗: 5
 * 目标类型: 敌方全体
 * 持续回合: 3回合
 * 特效: 群体冻结+冻结强化
 * 
 * 效果描述：创造永冻领域（持续3回合），敌方全体每次行动后有40%概率被冻结，
 * 已冻结目标进入「绝对冻结」状态
 * 
 * 绝对冻结效果：
 * - 持续3回合
 * - 0%自动解冻概率
 * - 必须受伤才能解除
 */
export const ETERNAL_FROST_DOMAIN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'eternal_frost_domain',
    name: '永冻领域',
    description: '创造永冻领域（持续3回合），敌方全体每次行动后有40%概率被冻结，已冻结目标进入「绝对冻结」状态',
    type: 'action',
    energyCost: 5,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyDebuff: {
        debuffType: 'freeze' as any,
        duration: 3,
        stacks: 1,
        successRate: 0.4  // 40%冻结概率
      }
    }],
    category: '冰·冻结破冰流·辅助',
    tags: ['冰', '冻结破冰流', '辅助', '群体冻结', '绝对冻结', '终极领域']
  };
  return new Skill(definition);
})();

// ==================== 冰冻结破冰流技能库导出 ====================

/**
 * 冰属性·冻结破冰流技能库 v3.0
 */
export const ICE_SHATTER_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    ICE_SHOT,      // 冰晶射击
    FROST_BREATH,  // 霜冻之息
    ICE_SHATTER,    // 破冰斩
    ABSOLUTE_ZERO  // 绝对零度
  },
  
  // 防御倾向（3种）
  DEFENSE: {
    FROST_ARMOR,    // 冰霜护甲
    ICE_WALL,       // 冰墙
    FREEZING_FIELD   // 极寒领域
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
    return Math.floor(basePower * ICE_SHATTER_BONUS);
  }
  return basePower;
}

/**
 * 计算破冰斩总伤害（含碎冰追击）
 * @param basePower 基础威力
 * @param isFrozen 目标是否冻结
 * @returns [破冰伤害, 碎冰追击伤害, 总伤害]
 */
export function calculateTotalShatterDamage(basePower: number, isFrozen: boolean): { shatter: number; followUp: number; total: number } {
  const shatter = calculateShatterDamage(basePower, isFrozen);
  const followUp = isFrozen ? SHATTER_FOLLOW_UP_POWER : 0;
  return {
    shatter,
    followUp,
    total: shatter + followUp
  };
}
