/**
 * 水属性技能测试
 * 测试水属性控制流 (9个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 水属性技能
  WATER_CONTROL_SKILLS,
  WATER_JET,
  HYDRO_PUMP,
  ABYSS_VORTEX,
  AQUA_SHIELD,
  CLEAR_SPRING,
  HEALING_WAVE,
  AQUA_THERAPY,
  RAINY_DAY
} from '../water';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('水属性·控制流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('水流冲击 (WATER_JET) - 伤害+浸透', () => {
      SkillTestHelper.validateSkillBase(WATER_JET, 'water_jet', '水流冲击', 2);
      SkillTestHelper.validateDamageEffect(WATER_JET, 60, ElementType.WATER);
      const hasWaterSoak = WATER_JET.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'water_soak'
      );
      expect(hasWaterSoak).toBe(true);
    });

    it('水炮 (HYDRO_PUMP) - 高威力', () => {
      SkillTestHelper.validateSkillBase(HYDRO_PUMP, 'hydro_pump', '水炮', 3);
      SkillTestHelper.validateDamageEffect(HYDRO_PUMP, 90, ElementType.WATER);
    });

    it('漩涡 (ABYSS_VORTEX) - 高威力+溺水', () => {
      SkillTestHelper.validateSkillBase(ABYSS_VORTEX, 'abyss_vortex', '漩涡', 5);
      SkillTestHelper.validateDamageEffect(ABYSS_VORTEX, 120, ElementType.WATER);
      const hasDrowningStatus = ABYSS_VORTEX.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'drowning_status'
      );
      expect(hasDrowningStatus).toBe(true);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('水之守护 (AQUA_SHIELD) - 70%减伤+受击获浸透', () => {
      SkillTestHelper.validateSkillBase(AQUA_SHIELD, 'aqua_shield', '水之守护', 2);
      expect(AQUA_SHIELD.definition.target).toBe(SkillTarget.SELF);
      const hasDefenseUp = AQUA_SHIELD.definition.effects.some(
        e => e.applyBuff?.buffType === 'defense_up'
      );
      expect(hasDefenseUp).toBe(true);
    });

    it('清泉护盾 (CLEAR_SPRING) - 治疗+净化', () => {
      SkillTestHelper.validateSkillBase(CLEAR_SPRING, 'clear_spring', '清泉护盾', 3);
      expect(CLEAR_SPRING.definition.target).toBe(SkillTarget.SELF);
      const hasClearSpring = CLEAR_SPRING.definition.effects.some(
        e => e.applyBuff?.buffType === 'clear_spring'
      );
      expect(hasClearSpring).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('治愈波动 (HEALING_WAVE) - 治疗', () => {
      SkillTestHelper.validateSkillBase(HEALING_WAVE, 'healing_wave', '治愈波动', 1);
      expect(HEALING_WAVE.definition.target).toBe(SkillTarget.ALLY);
      const hasHealing = HEALING_WAVE.definition.effects.some(
        e => e.healing !== undefined
      );
      expect(hasHealing).toBe(true);
    });

    it('水疗之术 (AQUA_THERAPY) - 群体治疗+加速', () => {
      SkillTestHelper.validateSkillBase(AQUA_THERAPY, 'aqua_therapy', '水疗之术', 3);
      expect(AQUA_THERAPY.definition.target).toBe(SkillTarget.ALLY_ALL);
      const hasHealing = AQUA_THERAPY.definition.effects.some(
        e => e.healing !== undefined
      );
      expect(hasHealing).toBe(true);
      const hasFlow = AQUA_THERAPY.definition.effects.some(
        e => e.applyBuff?.buffType === 'flow'
      );
      expect(hasFlow).toBe(true);
    });

    it('雨天 (RAINY_DAY) - 全队水属性威力+50%', () => {
      SkillTestHelper.validateSkillBase(RAINY_DAY, 'rainy_day', '雨天', 8);
      expect(RAINY_DAY.definition.target).toBe(SkillTarget.ALL);
      const hasFieldBuff = RAINY_DAY.definition.effects.some(
        e => e.applyFieldBuff?.buffType === 'water_amplify'
      );
      expect(hasFieldBuff).toBe(true);
    });
  });

  describe('WATER_CONTROL_SKILLS 技能库', () => {
    it('包含所有9个技能', () => {
      expect(WATER_CONTROL_SKILLS.ALL).toHaveLength(9);
    });

    it('按倾向分类正确', () => {
      expect(WATER_CONTROL_SKILLS.ATTACK).toBeDefined();
      expect(WATER_CONTROL_SKILLS.DEFENSE).toBeDefined();
      expect(WATER_CONTROL_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
