/**
 * 地属性·天气流技能库
 * 基于宝可梦地系技能设计
 * 核心机制：沙暴天气、挖洞状态
 */

import { Skill, SkillDefinition } from './Skill';
import { SkillTarget, SkillTendency, DamageType, ElementType } from '../types';

// ==================== 攻击倾向技能 ====================

/**
 * 震级 (MAGNITUDE)
 * 随机威力，高风险高回报
 */
export const MAGNITUDE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'magnitude',
    name: '震级',
    description: '随机决定威力(1-150)，消耗能量越多高威力概率越高',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 75,
        damageType: DamageType.SPECIAL,
        element: ElementType.GROUND
      },
      special: {
        type: 'variable_power' as any
      }
    }],
    category: '地属性·天气流·攻击',
    tags: ['随机威力', '全体攻击']
  };
  return new Skill(definition);
})();

/**
 * 大地之力 (EARTH_POWER)
 * 高威力特攻+自身特攻提升
 */
export const EARTH_POWER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'earth_power',
    name: '大地之力',
    description: '造成90威力特殊伤害，额外使自身特攻+1级',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 90,
        damageType: DamageType.SPECIAL,
        element: ElementType.GROUND
      }
    }, {
      selfStatBoost: {
        stat: 'spAttack',
        stages: 1
      }
    }],
    category: '地属性·天气流·攻击',
    tags: ['特攻强化', '高威力']
  };
  return new Skill(definition);
})();

/**
 * 地震 (EARTHQUAKE)
 * 稳定全体攻击
 */
export const EARTHQUAKE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'earthquake',
    name: '地震',
    description: '造成85威力特殊伤害，敌方全体速度-1级',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.ENEMY_ALL,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 85,
        damageType: DamageType.SPECIAL,
        element: ElementType.GROUND
      }
    }, {
      applyDebuffAll: {
        debuffType: 'slow' as any,
        duration: 999,
        stages: 1
      }
    }],
    category: '地属性·天气流·攻击',
    tags: ['全体攻击', '减速']
  };
  return new Skill(definition);
})();

/**
 * 直冲钻 (DRILL_RUN)
 * 必定命中的物理攻击
 */
export const DRILL_RUN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'drill_run',
    name: '直冲钻',
    description: '造成80威力物理伤害，必定命中',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 80,
        damageType: DamageType.PHYSICAL,
        element: ElementType.GROUND,
        guaranteed: true
      }
    }],
    category: '地属性·天气流·攻击',
    tags: ['必定命中', '物理']
  };
  return new Skill(definition);
})();

/**
 * 骨棒乱打 (BONE_RUSH)
 * 两段攻击
 */
export const BONE_RUSH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'bone_rush',
    name: '骨棒乱打',
    description: '发射骨棒进行2次攻击，每次25威力物理伤害',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 25,
        damageType: DamageType.PHYSICAL,
        element: ElementType.GROUND,
        hits: 2
      }
    }],
    category: '地属性·天气流·攻击',
    tags: ['多段攻击', '两段']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能 ====================

/**
 * 沙暴降临 (SANDSTORM)
 * 召唤沙暴天气
 */
export const SANDSTORM: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'sandstorm',
    name: '沙暴降临',
    description: '召唤沙暴天气(3回合)：非岩/地/钢系每回合受损，岩/地/钢系特防+50%',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyWeather: {
        weather: 'sandstorm',
        duration: 3
      }
    }],
    category: '地属性·天气流·防御',
    tags: ['天气', '沙暴']
  };
  return new Skill(definition);
})();

/**
 * 挖洞 (DIG)
 * 地下状态+下回合先手
 */
export const DIG: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'dig',
    name: '挖洞',
    description: '进入地下(1回合)：免疫地面攻击，下回合必定先手攻击',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'underground' as any,
        duration: 2
      }
    }, {
      charge: {
        turns: 1,
        canBeInterrupted: false,
        guaranteedPriority: true
      }
    }],
    category: '地属性·天气流·防御',
    tags: ['免疫', '先手', '蓄力']
  };
  return new Skill(definition);
})();

/**
 * 流沙地狱 (SAND_TOMB)
 * 减速+持续伤害
 */
export const SAND_TOMB: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'sand_tomb',
    name: '流沙地狱',
    description: '使目标陷入流沙，速度-2且每回合受到15威力伤害',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyDebuff: {
        debuffType: 'sand_tomb_debuff' as any,
        duration: 3,
        stacks: 1
      }
    }],
    category: '地属性·天气流·防御',
    tags: ['减速', '持续伤害', '控制']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能 ====================

/**
 * 玩泥巴 (MUD_SPORT)
 * 全属性提升
 */
export const MUD_SPORT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'mud_sport',
    name: '玩泥巴',
    description: '自身特攻+1级、特防+1级、速度+1级',
    type: 'action',
    energyCost: 2,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      selfStatBoost: {
        stat: 'spAttack',
        stages: 1
      }
    }, {
      selfStatBoost: {
        stat: 'defense',
        stages: 1
      }
    }, {
      selfStatBoost: {
        stat: 'speed',
        stages: 1
      }
    }],
    category: '地属性·天气流·辅助',
    tags: ['属性强化', '综合提升']
  };
  return new Skill(definition);
})();

/**
 * 泼沙 (SAND_ATTACK)
 * 降低命中率
 */
export const SAND_ATTACK: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'sand_attack',
    name: '泼沙',
    description: '降低目标命中率-1级',
    type: 'action',
    energyCost: 1,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      statBoost: {
        stat: 'accuracy',
        stages: -1,
        target: 'enemy'
      }
    }],
    category: '地属性·天气流·辅助',
    tags: ['降命中', '软控制']
  };
  return new Skill(definition);
})();

/**
 * 耕地 (CULTIVATE)
 * 群体治疗+清异常
 */
export const CULTIVATE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'cultivate',
    name: '耕地',
    description: '治疗己方全体25%HP，清除所有异常状态',
    type: 'action',
    energyCost: 3,
    target: SkillTarget.ALLY_ALL,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      healing: {
        amount: 0,
        percent: 25
      }
    }, {
      cleanse: {
        removeAllDebuffs: true
      }
    }],
    category: '地属性·天气流·辅助',
    tags: ['群体治疗', '净化']
  };
  return new Skill(definition);
})();


// ==================== 技能库导出 ====================

/**
 * 地属性·天气流技能库
 */
export const GROUND_WEATHER_SKILLS = {
  ALL: {
    MAGNITUDE,
    EARTH_POWER,
    EARTHQUAKE,
    DRILL_RUN,
    BONE_RUSH,
    SANDSTORM,
    DIG,
    SAND_TOMB,
    MUD_SPORT,
    SAND_ATTACK,
    CULTIVATE
  },
  ATTACK: {
    MAGNITUDE,
    EARTH_POWER,
    EARTHQUAKE,
    DRILL_RUN,
    BONE_RUSH
  },
  DEFENSE: {
    SANDSTORM,
    DIG,
    SAND_TOMB
  },
  SUPPORT: {
    MUD_SPORT,
    SAND_ATTACK,
    CULTIVATE
  }
};
