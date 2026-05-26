/**
 * 循迹之境 - 生物技能工厂
 * 
 * 提供创建生物技能的辅助函数
 */

import { Skill } from '../skills';
import { SkillTarget, DamageType, ElementType } from '../types';
import { createAttackSkill, createShieldSkill, createBuffSkill, createDebuffSkill, createHealSkill } from '../skills/actions';

/**
 * 技能能量消耗规则
 * - 威力45左右: 1能量
 * - 威力65-80: 2能量
 * - 威力85-100: 3能量
 * - 威力100+: 4-5能量
 */
export function getEnergyCost(power: number): number {
  if (power <= 45) return 1;
  if (power <= 65) return 1;
  if (power <= 80) return 2;
  if (power <= 100) return 3;
  return 4;
}

/**
 * 创建攻击技能
 */
export function createCreatureAttackSkill(
  id: string,
  name: string,
  power: number,
  target: SkillTarget = SkillTarget.SINGLE,
  element: ElementType = ElementType.NORMAL
): Skill {
  return createAttackSkill(
    id,
    name,
    power,
    target,
    DamageType.SPECIAL,
    element
  );
}

/**
 * 创建物理攻击技能
 */
export function createCreaturePhysicalSkill(
  id: string,
  name: string,
  power: number,
  target: SkillTarget = SkillTarget.SINGLE,
  element: ElementType = ElementType.NORMAL
): Skill {
  return createAttackSkill(
    id,
    name,
    power,
    target,
    DamageType.PHYSICAL,
    element
  );
}

/**
 * 创建防御技能
 */
export function createCreatureShieldSkill(
  id: string,
  name: string,
  shieldAmount: number,
  target: SkillTarget = SkillTarget.SELF
): Skill {
  return createShieldSkill(
    id,
    name,
    shieldAmount,
    target
  );
}

/**
 * 创建强化技能
 */
export function createCreatureBuffSkill(
  id: string,
  name: string,
  description: string
): Skill {
  return createBuffSkill(
    id,
    name,
    description
  );
}

/**
 * 创建治疗技能
 */
export function createCreatureHealSkill(
  id: string,
  name: string,
  healAmount: number,
  target: SkillTarget = SkillTarget.SELF
): Skill {
  return createHealSkill(
    id,
    name,
    healAmount,
    target
  );
}

/**
 * 创建debuff技能
 */
export function createCreatureDebuffSkill(
  id: string,
  name: string,
  description: string,
  power: number,
  target: SkillTarget = SkillTarget.SINGLE
): Skill {
  return createDebuffSkill(
    id,
    name,
    description,
    target,
    power,
    0
  );
}
