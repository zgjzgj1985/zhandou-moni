/**
 * 草属性技能测试
 * 测试草属性光环流 (10个) 和 龙属性中速流 (10个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 草属性技能
  GRASS_AURA_SKILLS,
  VINE_WHIP_COMBO,
  PARASITIC_SEED,
  LEAF_BLADE,
  SOLAR_BEAM,
  ROOT_BOUND,
  VINE_ARMOR,
  LEAF_BARRIER,
  GROWTH_DANCE,
  PARASITE_MARK,
  PHOTOSYNTHESIS_BURST
} from '../grass';
import { SkillTestHelper } from './helpers';
import { SkillTarget, ElementType } from '../../types';

describe('草属性·光环流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('藤鞭连击 (VINE_WHIP_COMBO) - 55威力+增益', () => {
      SkillTestHelper.validateSkillBase(VINE_WHIP_COMBO, 'vine_whip_combo', '藤鞭连击', 2);
      SkillTestHelper.validateDamageEffect(VINE_WHIP_COMBO, 55, ElementType.GRASS);
    });

    it('寄生种子 (PARASITIC_SEED) - 50威力+寄生', () => {
      SkillTestHelper.validateSkillBase(PARASITIC_SEED, 'parasitic_seed', '寄生种子', 3);
      SkillTestHelper.validateDamageEffect(PARASITIC_SEED, 50, ElementType.GRASS);
    });

    it('飞叶快刀 (LEAF_BLADE) - 70威力+标记', () => {
      SkillTestHelper.validateSkillBase(LEAF_BLADE, 'leaf_blade', '飞叶快刀', 2);
      SkillTestHelper.validateDamageEffect(LEAF_BLADE, 70, ElementType.GRASS);
    });

    it('阳光烈焰 (SOLAR_BEAM) - 蓄力+消耗增益', () => {
      SkillTestHelper.validateSkillBase(SOLAR_BEAM, 'solar_beam', '阳光烈焰', 5);
      SkillTestHelper.validateChargeSkill(SOLAR_BEAM, 1, true);
      SkillTestHelper.validateDamageEffect(SOLAR_BEAM, 130, ElementType.GRASS);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('扎根之躯 (ROOT_BOUND) - 持续回复', () => {
      SkillTestHelper.validateSkillBase(ROOT_BOUND, 'root_bound', '扎根之躯', 2);
      expect(ROOT_BOUND.definition.target).toBe(SkillTarget.SELF);
    });

    it('藤蔓护甲 (VINE_ARMOR) - 减伤+缠绕', () => {
      SkillTestHelper.validateSkillBase(VINE_ARMOR, 'vine_armor', '藤蔓护甲', 2);
      expect(VINE_ARMOR.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = VINE_ARMOR.definition.effects.some(
        e => e.applyBuff?.buffType === 'vine_body'
      );
      expect(hasBuff).toBe(true);
    });

    it('绿叶屏障 (LEAF_BARRIER) - 群体护盾+抗性', () => {
      SkillTestHelper.validateSkillBase(LEAF_BARRIER, 'leaf_barrier', '绿叶屏障', 3);
      expect(LEAF_BARRIER.definition.target).toBe(SkillTarget.ALLY_ALL);
      const hasBuff = LEAF_BARRIER.definition.effects.some(
        e => e.applyBuff?.buffType === 'leaf_barrier'
      );
      expect(hasBuff).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('成长之舞 (GROWTH_DANCE) - 强化技能', () => {
      SkillTestHelper.validateSkillBase(GROWTH_DANCE, 'growth_dance', '成长之舞', 1);
      expect(GROWTH_DANCE.definition.target).toBe(SkillTarget.ALLY);
    });

    it('寄生印记 (PARASITE_MARK) - 持续伤害+吸血', () => {
      SkillTestHelper.validateSkillBase(PARASITE_MARK, 'parasite_mark', '寄生印记', 3);
      expect(PARASITE_MARK.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('光合爆发 (PHOTOSYNTHESIS_BURST) - 消耗增益治疗', () => {
      SkillTestHelper.validateSkillBase(PHOTOSYNTHESIS_BURST, 'photosynthesis_burst', '光合爆发', 6);
      expect(PHOTOSYNTHESIS_BURST.definition.target).toBe(SkillTarget.SELF);
      const hasSpecial = PHOTOSYNTHESIS_BURST.definition.effects.some(
        e => e.special?.type === 'consume_buff_heal'
      );
      expect(hasSpecial).toBe(true);
    });
  });

  describe('GRASS_AURA_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(GRASS_AURA_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(GRASS_AURA_SKILLS.ATTACK).toBeDefined();
      expect(GRASS_AURA_SKILLS.DEFENSE).toBeDefined();
      expect(GRASS_AURA_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
