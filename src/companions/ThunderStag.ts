/**
 * 循迹之境 - 伙伴系统
 * 山巅云鹿
 */

import { PlayerUnit, PlayerUnitConfig } from '../battle/PlayerUnit';
import { Skill } from '../skills';
import { ElementType } from '../types';
import { createAttackSkill, createShieldSkill } from '../skills/actions';
import { SkillTarget, DamageType } from '../types';

/**
 * 创建雷霆万钧技能
 */
function createThunderStrikeSkill(): Skill {
  return createAttackSkill(
    'thunder_strike',
    '雷霆万钧',
    90,
    SkillTarget.SINGLE,
    DamageType.SPECIAL,
    ElementType.ELECTRIC
  );
}

/**
 * 创建静电护体技能
 * 获得50%最大HP的护盾，持续2回合
 */
function createStaticShieldSkill(): Skill {
  return createShieldSkill(
    'static_shield',
    '静电护体',
    50, // 护盾值百分比（实际值由战斗系统计算）
    SkillTarget.SELF
  );
}

/**
 * 雷角鹿配置
 */
export const ThunderStagConfig: PlayerUnitConfig = {
  id: 'thunder_stag',
  name: '雷角鹿',
  level: 10,
  maxHp: 95,
  attack: 75,
  defense: 70,
  spAttack: 100,
  spDefense: 75,
  speed: {
    baseSpeed: 90,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [ElementType.ELECTRIC],
  skills: [
    createThunderStrikeSkill(),
    createStaticShieldSkill()
  ],
  maxPp: true
};

/**
 * 创建雷角鹿
 */
export function createThunderStag(): PlayerUnit {
  return new PlayerUnit(ThunderStagConfig);
}
