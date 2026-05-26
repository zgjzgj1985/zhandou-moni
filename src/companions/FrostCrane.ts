/**
 * 循迹之境 - 伙伴系统
 * 雪山仙鹤
 */

import { PlayerUnit, PlayerUnitConfig } from '../battle/PlayerUnit';
import { Skill } from '../skills';
import { ElementType } from '../types';
import { createAttackSkill, createDebuffSkill } from '../skills/actions';
import { SkillTarget, DamageType } from '../types';

/**
 * 创建寒冰羽刃技能
 * 单体物理攻击，20%概率使目标冰冻
 */
function createFrostFeatherSkill(): Skill {
  return createAttackSkill(
    'frost_feather',
    '寒冰羽刃',
    50,
    SkillTarget.SINGLE,
    DamageType.PHYSICAL,
    ElementType.ICE
  );
}

/**
 * 创建霜华绽放技能
 * 单体特殊攻击，30%概率降低目标速度1级
 */
function createFrostBloomSkill(): Skill {
  return createDebuffSkill(
    'frost_bloom',
    '霜华绽放',
    '单体攻击，30%概率降低目标速度',
    SkillTarget.SINGLE,
    70,
    10
  );
}

/**
 * 霜羽鹤配置
 */
export const FrostCraneConfig: PlayerUnitConfig = {
  id: 'frost_crane',
  name: '霜羽鹤',
  level: 10,
  maxHp: 80,
  attack: 85,
  defense: 60,
  spAttack: 70,
  spDefense: 85,
  speed: {
    baseSpeed: 115,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [ElementType.ICE],
  skills: [
    createFrostFeatherSkill(),
    createFrostBloomSkill()
  ],
  maxPp: true
};

/**
 * 创建霜羽鹤
 */
export function createFrostCrane(): PlayerUnit {
  return new PlayerUnit(FrostCraneConfig);
}
