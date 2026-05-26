/**
 * 循迹之境 - 伙伴系统
 * 森林灵鸟
 */

import { PlayerUnit, PlayerUnitConfig } from '../battle/PlayerUnit';
import { Skill } from '../skills';
import { ElementType, SpeedStats } from '../types';
import { createAttackSkill, createDebuffSkill } from '../skills/actions';
import { SkillTarget, DamageType } from '../types';

/**
 * 创建疾风种子技能
 */
function createGaleSeedSkill(): Skill {
  return createAttackSkill(
    'gale_seed',
    '疾风种子',
    60,
    SkillTarget.SINGLE,
    DamageType.SPECIAL,
    ElementType.GRASS
  );
}

/**
 * 创建寄生之种技能
 * 目标每回合失去12.5% HP，同时为自身回复等量HP，持续3回合
 */
function createParasiticSeedSkill(): Skill {
  return createDebuffSkill(
    'parasitic_seed',
    '寄生之种',
    '单体目标，附加寄生状态，每回合吸取目标HP',
    SkillTarget.SINGLE,
    100,
    10
  );
}

/**
 * 风语雀配置
 */
export const Wind SparrowConfig: PlayerUnitConfig = {
  id: 'wind_sparrow',
  name: '风语雀',
  level: 10,
  maxHp: 85,
  attack: 70,
  defense: 65,
  spAttack: 95,
  spDefense: 80,
  speed: {
    baseSpeed: 110,
    speedStage: 0,
    speedBonus: 0
  },
  elements: [ElementType.GRASS],
  skills: [
    createGaleSeedSkill(),
    createParasiticSeedSkill()
  ],
  maxPp: true
};

/**
 * 创建风语雀
 */
export function createWindSparrow(): PlayerUnit {
  return new PlayerUnit(Wind SparrowConfig);
}
