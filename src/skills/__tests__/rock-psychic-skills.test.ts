/**
 * 岩石/超能属性技能测试
 * 测试岩石属性防御流 (10个) 和 超能属性奥秘流 (10个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 岩石属性技能
  ROCK_DEFENSE_SKILLS,
  ROCK_SPIKE,
  STONE_IMPACT,
  EARTHQUAKE,
  BOULDER_CRASH,
  ROCK_SHIELD,
  IRON_WALL,
  COUNTER_STANCE,
  SAND_CLOAK,
  STONE_BODY,
  MOUNTAIN_GUARDIAN
} from '../rock';
import {
  // 超能属性技能
  PSYCHIC_MYSTIC_SKILLS,
  MIND_PIERCE,
  PSYCHIC_HIT,
  VOID_PROPECY,
  MIND_SHIELD_SKILL,
  MIRROR_REFLECT,
  MIST_BODY,
  PSYCHIC_BARRIER,
  SCENT_MIMIC,
  MIND_SYNC,
  FATE_WEAVE
} from '../psychic';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('岩石属性·防御流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('尖石攻击 (ROCK_SPIKE) - 基础物理攻击', () => {
      SkillTestHelper.validateSkillBase(ROCK_SPIKE, 'rock_spike', '尖石攻击', 2);
      const effects = ROCK_SPIKE.definition.effects;
      expect(effects[0].damage?.damageType).toBe('physical');
      expect(effects[0].damage?.basePower).toBe(75);
    });

    it('落石冲击 (STONE_IMPACT) - 高威力', () => {
      SkillTestHelper.validateSkillBase(STONE_IMPACT, 'stone_impact', '落石冲击', 3);
      SkillTestHelper.validateDamageEffect(STONE_IMPACT, 90, ElementType.ROCK);
    });

    it('地震 (EARTHQUAKE) - 全体攻击', () => {
      SkillTestHelper.validateSkillBase(EARTHQUAKE, 'earthquake', '地震', 4);
      expect(EARTHQUAKE.definition.target).toBe(SkillTarget.ALL);
      SkillTestHelper.validateDamageEffect(EARTHQUAKE, 100, ElementType.ROCK);
    });

    it('磐石崩落 (BOULDER_CRASH) - 蓄力+终极', () => {
      SkillTestHelper.validateSkillBase(BOULDER_CRASH, 'boulder_crash', '磐石崩落', 5);
      SkillTestHelper.validateChargeSkill(BOULDER_CRASH, 1, true);
      SkillTestHelper.validateDamageEffect(BOULDER_CRASH, 130, ElementType.ROCK);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('岩盾 (ROCK_SHIELD) - 护盾+反弹', () => {
      SkillTestHelper.validateSkillBase(ROCK_SHIELD, 'rock_shield', '岩盾', 2);
      SkillTestHelper.validateShieldEffect(ROCK_SHIELD, 80);
    });

    it('铁壁 (IRON_WALL) - 防御提升', () => {
      SkillTestHelper.validateSkillBase(IRON_WALL, 'iron_wall', '铁壁', 2);
      expect(IRON_WALL.definition.target).toBe(SkillTarget.SELF);
    });

    it('反击姿态 (COUNTER_STANCE) - 反击', () => {
      SkillTestHelper.validateSkillBase(COUNTER_STANCE, 'counter_stance', '反击姿态', 3);
      expect(COUNTER_STANCE.definition.target).toBe(SkillTarget.SELF);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('沙尘掩体 (SAND_CLOAK) - 闪避+驱散', () => {
      SkillTestHelper.validateSkillBase(SAND_CLOAK, 'sand_cloak', '沙尘掩体', 1);
      expect(SAND_CLOAK.definition.target).toBe(SkillTarget.SELF);
    });

    it('磐石之躯 (STONE_BODY) - 形态变化', () => {
      SkillTestHelper.validateSkillBase(STONE_BODY, 'stone_body', '磐石之躯', 3);
      expect(STONE_BODY.definition.target).toBe(SkillTarget.SELF);
    });

    it('山岳守护 (MOUNTAIN_GUARDIAN) - 群体护盾', () => {
      SkillTestHelper.validateSkillBase(MOUNTAIN_GUARDIAN, 'mountain_guardian', '山岳守护', 4);
      SkillTestHelper.validateShieldEffect(MOUNTAIN_GUARDIAN, 50);
      expect(MOUNTAIN_GUARDIAN.definition.target).toBe(SkillTarget.ALLY_ALL);
    });
  });

  describe('ROCK_DEFENSE_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(ROCK_DEFENSE_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(ROCK_DEFENSE_SKILLS.ATTACK).toBeDefined();
      expect(ROCK_DEFENSE_SKILLS.DEFENSE).toBeDefined();
      expect(ROCK_DEFENSE_SKILLS.SUPPORT).toBeDefined();
    });
  });
});

describe('超能属性·奥秘流技能测试', () => {
  describe('攻击倾向技能 (3个)', () => {
    it('迷心刺 (MIND_PIERCE) - 软控制', () => {
      SkillTestHelper.validateSkillBase(MIND_PIERCE, 'mind_pierce', '迷心刺', 2);
      SkillTestHelper.validateDamageEffect(MIND_PIERCE, 55, ElementType.PSYCHIC);
    });

    it('精神冲击 (PSYCHIC_HIT) - 高威力', () => {
      SkillTestHelper.validateSkillBase(PSYCHIC_HIT, 'psychic_hit', '精神冲击', 3);
      SkillTestHelper.validateDamageEffect(PSYCHIC_HIT, 80, ElementType.PSYCHIC);
    });

    it('虚空预言 (VOID_PROPECY) - 蓄力+终极', () => {
      SkillTestHelper.validateSkillBase(VOID_PROPECY, 'void_prophecy', '虚空预言', 5);
      SkillTestHelper.validateChargeSkill(VOID_PROPECY, 1, true);
      SkillTestHelper.validateDamageEffect(VOID_PROPECY, 120, ElementType.PSYCHIC);
    });
  });

  describe('防御倾向技能 (4个)', () => {
    it('心智护盾 (MIND_SHIELD_SKILL) - 护盾', () => {
      SkillTestHelper.validateSkillBase(MIND_SHIELD_SKILL, 'mind_shield_skill', '心智护盾', 2);
      SkillTestHelper.validateShieldEffect(MIND_SHIELD_SKILL, 60);
    });

    it('灵镜反照 (MIRROR_REFLECT) - 反射', () => {
      SkillTestHelper.validateSkillBase(MIRROR_REFLECT, 'mirror_reflect', '灵镜反照', 3);
      expect(MIRROR_REFLECT.definition.target).toBe(SkillTarget.SELF);
    });

    it('迷雾之躯 (MIST_BODY) - 闪避', () => {
      SkillTestHelper.validateSkillBase(MIST_BODY, 'mist_body', '迷雾之躯', 2);
      expect(MIST_BODY.definition.target).toBe(SkillTarget.SELF);
    });

    it('念动壁垒 (PSYCHIC_BARRIER) - 群体护盾', () => {
      SkillTestHelper.validateSkillBase(PSYCHIC_BARRIER, 'psychic_barrier', '念动壁垒', 4);
      SkillTestHelper.validateShieldEffect(PSYCHIC_BARRIER, 40);
      expect(PSYCHIC_BARRIER.definition.target).toBe(SkillTarget.ALLY_ALL);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('气味伪装 (SCENT_MIMIC) - 信息干扰', () => {
      SkillTestHelper.validateSkillBase(SCENT_MIMIC, 'scent_mimic', '气味伪装', 1);
      expect(SCENT_MIMIC.definition.target).toBe(SkillTarget.SELF);
    });

    it('心智同步 (MIND_SYNC) - 状态交换', () => {
      SkillTestHelper.validateSkillBase(MIND_SYNC, 'mind_sync', '心智同步', 3);
      expect(MIND_SYNC.definition.target).toBe(SkillTarget.ALLY);
    });

    it('命运编织 (FATE_WEAVE) - 终极技能', () => {
      SkillTestHelper.validateSkillBase(FATE_WEAVE, 'fate_weave', '命运编织', 6);
      const effects = FATE_WEAVE.definition.effects;
      expect(effects[0].damage?.damageType).toBe('true');
      expect(effects[0].damage?.basePower).toBe(100);
    });
  });

  describe('PSYCHIC_MYSTIC_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(PSYCHIC_MYSTIC_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(PSYCHIC_MYSTIC_SKILLS.ATTACK).toBeDefined();
      expect(PSYCHIC_MYSTIC_SKILLS.DEFENSE).toBeDefined();
      expect(PSYCHIC_MYSTIC_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
