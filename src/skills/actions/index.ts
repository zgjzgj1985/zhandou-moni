/**
 * 循迹之境 - 主动技能实现
 */

import { Skill, SkillEffect } from '../Skill';
import {
  SkillDefinition,
  SkillTarget,
  DamageType,
  ElementType
} from '../../types';

/**
 * 创建攻击技能
 */
export function createAttackSkill(
  id: string,
  name: string,
  basePower: number,
  target: SkillTarget,
  damageType: DamageType = DamageType.PHYSICAL,
  element?: ElementType
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `造成${basePower}威力伤害`,
    type: 'action',
    pp: 15,
    ppMax: 15,
    target,
    effects: [{
      damage: {
        basePower,
        damageType,
        element
      }
    }]
  };
  return new Skill(definition);
}

/**
 * 创建治疗技能
 */
export function createHealSkill(
  id: string,
  name: string,
  amount: number,
  target: SkillTarget = SkillTarget.SELF,
  percent?: number
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `恢复${amount}HP${percent ? `(${percent}%)` : ''}`,
    type: 'action',
    pp: 20,
    ppMax: 20,
    target,
    effects: [{
      healing: {
        amount,
        percent
      }
    }]
  };
  return new Skill(definition);
}

/**
 * 创建Buff技能
 */
export function createBuffSkill(
  id: string,
  name: string,
  description: string,
  target: SkillTarget,
  pp: number = 15
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description,
    type: 'action',
    pp,
    ppMax: pp,
    target,
    effects: []
  };
  return new Skill(definition);
}

/**
 * 创建Debuff技能
 */
export function createDebuffSkill(
  id: string,
  name: string,
  description: string,
  target: SkillTarget,
  successRate: number = 100,
  pp: number = 15
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description,
    type: 'action',
    pp,
    ppMax: pp,
    target,
    effects: []
  };
  return new Skill(definition);
}

/**
 * 创建护盾技能
 */
export function createShieldSkill(
  id: string,
  name: string,
  shieldAmount: number,
  target: SkillTarget = SkillTarget.SELF
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `获得${shieldAmount}点护盾值`,
    type: 'action',
    pp: 15,
    ppMax: 15,
    target,
    effects: [{
      shield: {
        amount: shieldAmount
      }
    }]
  };
  return new Skill(definition);
}

/**
 * 默认技能库
 */
export const DEFAULT_SKILLS = {
  // 物理攻击技能
  TACKLE: createAttackSkill('tackle', '撞击', 40, SkillTarget.SINGLE, DamageType.PHYSICAL),
  QUICK_ATTACK: createAttackSkill('quick_attack', '电光一闪', 40, SkillTarget.SINGLE, DamageType.PHYSICAL),
  BODY_SLAM: createAttackSkill('body_slam', '泰山压顶', 85, SkillTarget.SINGLE, DamageType.PHYSICAL),
  EARTHQUAKE: createAttackSkill('earthquake', '地震', 100, SkillTarget.ALL, DamageType.PHYSICAL),
  
  // 特殊攻击技能
  EMBER: createAttackSkill('ember', '火花', 40, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.FIRE),
  FLAMETHROWER: createAttackSkill('flamethrower', '大字爆', 120, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.FIRE),
  WATER_GUN: createAttackSkill('water_gun', '水枪', 40, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.WATER),
  HYDRO_PUMP: createAttackSkill('hydro_pump', '水炮', 120, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.WATER),
  RAZOR_LEAF: createAttackSkill('razor_leaf', '飞叶快刀', 55, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.GRASS),
  THUNDERBOLT: createAttackSkill('thunderbolt', '雷电', 90, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.ELECTRIC),
  ICE_BEAM: createAttackSkill('ice_beam', '冰冻光线', 90, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.ICE),
  PSYCHIC: createAttackSkill('psychic', '精神光线', 90, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.PSYCHIC),
  
  // 治疗技能
  RECOVER: createHealSkill('recover', '自我再生', 0, SkillTarget.SELF, 50),
  SOFT_BOILED: createHealSkill('soft_boiled', '生蛋', 0, SkillTarget.ALLY, 50),
  
  // 护盾技能
  DEFENSE_CURL: createShieldSkill('defense_curl', '缩入壳中', 0),
  PROTECT: createShieldSkill('protect', '守住', 999), // 特殊：护盾值由战斗系统处理
};
