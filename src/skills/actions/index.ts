/**
 * 循迹之境 - 主动技能实现
 */

import { Skill, SkillEffect } from '../Skill';
import {
  SkillDefinition,
  SkillTarget,
  DamageType,
  ElementType,
  EnergyCost,
  getEnergyCostText
} from '../../types';

/**
 * 创建攻击技能
 * @param id 技能ID
 * @param name 技能名称
 * @param basePower 基础威力
 * @param target 目标类型
 * @param damageType 伤害类型
 * @param element 元素属性
 * @param energyCost 能量消耗（默认2）
 */
export function createAttackSkill(
  id: string,
  name: string,
  basePower: number,
  target: SkillTarget,
  damageType: DamageType = DamageType.PHYSICAL,
  element?: ElementType,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `造成${basePower}威力伤害（${getEnergyCostText(energyCost)}）`,
    type: 'action',
    energyCost,
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
 * @param id 技能ID
 * @param name 技能名称
 * @param amount 治疗量
 * @param target 目标类型
 * @param percent 百分比治疗
 * @param energyCost 能量消耗（默认2）
 */
export function createHealSkill(
  id: string,
  name: string,
  amount: number,
  target: SkillTarget = SkillTarget.SELF,
  percent?: number,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `恢复${amount}HP${percent ? `(${percent}%)` : ''}（${getEnergyCostText(energyCost)}）`,
    type: 'action',
    energyCost,
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
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `${description}（${getEnergyCostText(energyCost)}）`,
    type: 'action',
    energyCost,
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
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `${description}（${getEnergyCostText(energyCost)}）`,
    type: 'action',
    energyCost,
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
  target: SkillTarget = SkillTarget.SELF,
  energyCost: number = 2
): Skill {
  const definition: SkillDefinition = {
    id,
    name,
    description: `获得${shieldAmount}点护盾值（${getEnergyCostText(energyCost)}）`,
    type: 'action',
    energyCost,
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
 * 能量消耗设计原则：
 * - 威力≤40：0-1能量
 * - 威力40-60：1能量
 * - 威力60-90：2能量
 * - 威力90-120：3能量
 * - 威力120-150：4能量
 * - 威力150+或特殊效果：5-6能量
 */
export const DEFAULT_SKILLS = {
  // 物理攻击技能（低威力，低消耗）
  TACKLE: createAttackSkill('tackle', '撞击', 40, SkillTarget.SINGLE, DamageType.PHYSICAL, undefined, EnergyCost.FREE),
  QUICK_ATTACK: createAttackSkill('quick_attack', '电光一闪', 40, SkillTarget.SINGLE, DamageType.PHYSICAL, undefined, EnergyCost.LOW),
  BODY_SLAM: createAttackSkill('body_slam', '泰山压顶', 85, SkillTarget.SINGLE, DamageType.PHYSICAL, undefined, EnergyCost.HIGH),
  EARTHQUAKE: createAttackSkill('earthquake', '地震', 100, SkillTarget.ALL, DamageType.PHYSICAL, undefined, EnergyCost.ULTRA),
  
  // 特殊攻击技能（按威力分配能量）
  EMBER: createAttackSkill('ember', '火花', 40, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.FIRE, EnergyCost.LOW),
  FLAMETHROWER: createAttackSkill('flamethrower', '大字爆炎', 120, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.FIRE, EnergyCost.ULTRA),
  WATER_GUN: createAttackSkill('water_gun', '水枪', 40, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.WATER, EnergyCost.LOW),
  HYDRO_PUMP: createAttackSkill('hydro_pump', '水炮', 120, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.WATER, EnergyCost.ULTRA),
  RAZOR_LEAF: createAttackSkill('razor_leaf', '飞叶快刀', 55, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.GRASS, EnergyCost.MEDIUM),
  ICE_BEAM: createAttackSkill('ice_beam', '冰冻光线', 90, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.ICE, EnergyCost.HIGH),
  PSYCHIC: createAttackSkill('psychic', '精神光线', 90, SkillTarget.SINGLE, DamageType.SPECIAL, ElementType.PSYCHIC, EnergyCost.HIGH),
  
  // 治疗技能
  RECOVER: createHealSkill('recover', '自我再生', 0, SkillTarget.SELF, 50, EnergyCost.HIGH),
  SOFT_BOILED: createHealSkill('soft_boiled', '生蛋', 0, SkillTarget.ALLY, 50, EnergyCost.ULTRA),
  
  // 护盾技能
  DEFENSE_CURL: createShieldSkill('defense_curl', '缩入壳中', 0, SkillTarget.SELF, EnergyCost.LOW),
  PROTECT: createShieldSkill('protect', '守住', 999, SkillTarget.SELF, EnergyCost.MEDIUM),
};
