/**
 * 草/龙属性技能测试
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
import {
  // 龙属性技能
  DRAGON_MIDRANGE_SKILLS,
  DRAGON_PULSE,
  DRAGON_RAGE,
  DRAGON_DIVE,
  DRAGON_BREATH,
  DRAGON_SCALES_SHIELD,
  DRAGON_AURA,
  DRAGON_AWAKENING,
  DRAGON_DANCE,
  ANCESTRAL_POWER,
  ANCIENT_FURY
} from '../dragon';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('草属性·光环流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('藤鞭连击 (VINE_WHIP_COMBO) - 基础攻击', () => {
      SkillTestHelper.validateSkillBase(VINE_WHIP_COMBO, 'vine_whip_combo', '藤鞭连击', 2);
      SkillTestHelper.validateDamageEffect(VINE_WHIP_COMBO, 55, ElementType.GRASS);
      SkillTestHelper.validateTags(VINE_WHIP_COMBO, ['草', '光环流', '攻击', '层数叠加', '攻击强化']);
    });

    it('寄生种子 (PARASITIC_SEED) - 寄生效果', () => {
      SkillTestHelper.validateSkillBase(PARASITIC_SEED, 'parasitic_seed', '寄生种子', 3);
      SkillTestHelper.validateDamageEffect(PARASITIC_SEED, 50, ElementType.GRASS);
    });

    it('飞叶快刀 (LEAF_BLADE) - 高威力', () => {
      SkillTestHelper.validateSkillBase(LEAF_BLADE, 'leaf_blade', '飞叶快刀', 2);
      SkillTestHelper.validateDamageEffect(LEAF_BLADE, 70, ElementType.GRASS);
    });

    it('阳光烈焰 (SOLAR_BEAM) - 蓄力+终极', () => {
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

    it('藤蔓护甲 (VINE_ARMOR) - 护盾', () => {
      SkillTestHelper.validateSkillBase(VINE_ARMOR, 'vine_armor', '藤蔓护甲', 2);
      SkillTestHelper.validateShieldEffect(VINE_ARMOR, 50);
      expect(VINE_ARMOR.definition.target).toBe(SkillTarget.ALLY);
    });

    it('绿叶屏障 (LEAF_BARRIER) - 群体护盾', () => {
      SkillTestHelper.validateSkillBase(LEAF_BARRIER, 'leaf_barrier', '绿叶屏障', 3);
      SkillTestHelper.validateShieldEffect(LEAF_BARRIER, 40);
      expect(LEAF_BARRIER.definition.target).toBe(SkillTarget.ALLY_ALL);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('成长之舞 (GROWTH_DANCE) - 强化技能', () => {
      SkillTestHelper.validateSkillBase(GROWTH_DANCE, 'growth_dance', '成长之舞', 1);
      expect(GROWTH_DANCE.definition.target).toBe(SkillTarget.ALLY);
    });

    it('寄生印记 (PARASITE_MARK) - 印记效果', () => {
      SkillTestHelper.validateSkillBase(PARASITE_MARK, 'parasite_mark', '寄生印记', 3);
      expect(PARASITE_MARK.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('光合爆发 (PHOTOSYNTHESIS_BURST) - 终极技能', () => {
      SkillTestHelper.validateSkillBase(PHOTOSYNTHESIS_BURST, 'photosynthesis_burst', '光合爆发', 6);
      expect(PHOTOSYNTHESIS_BURST.definition.target).toBe(SkillTarget.SELF);
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

describe('龙属性·中速流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('龙之波动 (DRAGON_PULSE) - 基础高威力', () => {
      SkillTestHelper.validateSkillBase(DRAGON_PULSE, 'dragon_pulse', '龙之波动', 2);
      SkillTestHelper.validateDamageEffect(DRAGON_PULSE, 75, ElementType.DRAGON);
    });

    it('逆鳞 (DRAGON_RAGE) - 终极攻击', () => {
      SkillTestHelper.validateSkillBase(DRAGON_RAGE, 'dragon_rage', '逆鳞', 5);
      SkillTestHelper.validateDamageEffect(DRAGON_RAGE, 120, ElementType.DRAGON);
    });

    it('龙之俯冲 (DRAGON_DIVE) - 斩杀技能', () => {
      SkillTestHelper.validateSkillBase(DRAGON_DIVE, 'dragon_dive', '龙之俯冲', 3);
      SkillTestHelper.validateDamageEffect(DRAGON_DIVE, 90, ElementType.DRAGON);
    });

    it('龙息 (DRAGON_BREATH) - 群体攻击', () => {
      SkillTestHelper.validateSkillBase(DRAGON_BREATH, 'dragon_breath', '龙息', 3);
      expect(DRAGON_BREATH.definition.target).toBe(SkillTarget.ALL);
      SkillTestHelper.validateDamageEffect(DRAGON_BREATH, 50, ElementType.DRAGON);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('龙鳞守护 (DRAGON_SCALES_SHIELD) - 护盾', () => {
      SkillTestHelper.validateSkillBase(DRAGON_SCALES_SHIELD, 'dragon_scales_shield', '龙鳞守护', 2);
      SkillTestHelper.validateShieldEffect(DRAGON_SCALES_SHIELD, 50);
    });

    it('龙之威严 (DRAGON_AURA) - 弱化技能', () => {
      SkillTestHelper.validateSkillBase(DRAGON_AURA, 'dragon_aura', '龙之威严', 2);
      expect(DRAGON_AURA.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('龙魂觉醒 (DRAGON_AWAKENING) - 免疫+反弹', () => {
      SkillTestHelper.validateSkillBase(DRAGON_AWAKENING, 'dragon_awakening', '龙魂觉醒', 3);
      expect(DRAGON_AWAKENING.definition.target).toBe(SkillTarget.SELF);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('龙之舞 (DRAGON_DANCE) - 强化技能', () => {
      SkillTestHelper.validateSkillBase(DRAGON_DANCE, 'dragon_dance', '龙之舞', 1);
      expect(DRAGON_DANCE.definition.target).toBe(SkillTarget.SELF);
    });

    it('祖传之力 (ANCESTRAL_POWER) - 阵容联动', () => {
      SkillTestHelper.validateSkillBase(ANCESTRAL_POWER, 'ancestral_power', '祖传之力', 2);
      expect(ANCESTRAL_POWER.definition.target).toBe(SkillTarget.SELF);
    });

    it('古龙之怒 (ANCIENT_FURY) - 终极爆发', () => {
      SkillTestHelper.validateSkillBase(ANCIENT_FURY, 'ancient_fury', '古龙之怒', 5);
      expect(ANCIENT_FURY.definition.target).toBe(SkillTarget.SELF);
    });
  });

  describe('DRAGON_MIDRANGE_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(DRAGON_MIDRANGE_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(DRAGON_MIDRANGE_SKILLS.ATTACK).toBeDefined();
      expect(DRAGON_MIDRANGE_SKILLS.DEFENSE).toBeDefined();
      expect(DRAGON_MIDRANGE_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
