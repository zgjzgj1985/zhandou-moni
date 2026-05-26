/**
 * 火/冰属性技能测试
 * 测试火属性爆发流 (10个) 和 冰属性减速流 (10个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 火属性技能
  FIRE_BURST_SKILLS,
  EMBER,
  FLAME_PUNCH,
  FLARE_BLITZ,
  EXPLOSION_FLAME,
  FIRE_SHIELD_SKILL,
  WALL_OF_FLAMES,
  HEAT_COUNTER,
  FLAME_CHARGE_SKILL,
  COMBUSTION,
  BLAZE_WILL
} from '../fire';
import {
  // 冰属性技能
  ICE_CONTROL_SKILLS,
  FREEZE_WIND,
  ABSOLUTE_ZERO,
  ICE_CRYSTAL_PIERCE,
  WINTERS_FURY,
  ICE_ARMOR,
  ICE_REFLECT,
  FREEZING_FIELD,
  COLD_AURA,
  ICE_SEAL,
  ABSOLUTE_ZERO_FIELD
} from '../ice';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('火属性·爆发流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('点燃 (EMBER) - 纯DOT技能', () => {
      SkillTestHelper.validateSkillBase(EMBER, 'ember', '点燃', 1);
      SkillTestHelper.validateTags(EMBER, ['火', '爆发流', '攻击', '灼烧']);
    });

    it('烈焰拳 (FLAME_PUNCH) - 物理伤害+连击', () => {
      SkillTestHelper.validateSkillBase(FLAME_PUNCH, 'flame_punch', '烈焰拳', 2);
      const effects = FLAME_PUNCH.definition.effects;
      expect(effects[0].damage?.damageType).toBe('physical');
      expect(effects[0].damage?.basePower).toBe(25);
      expect(effects[0].damage?.hits).toBe(3);
    });

    it('大字爆炎 (FLARE_BLITZ) - 高威力+灼伤印记', () => {
      SkillTestHelper.validateSkillBase(FLARE_BLITZ, 'flare_blitz', '大字爆炎', 4);
      SkillTestHelper.validateDamageEffect(FLARE_BLITZ, 120, ElementType.FIRE);
      const hasBurnMark = FLARE_BLITZ.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'burn_mark'
      );
      expect(hasBurnMark).toBe(true);
    });

    it('爆炸烈焰 (EXPLOSION_FLAME) - 蓄力+必定灼伤', () => {
      SkillTestHelper.validateSkillBase(EXPLOSION_FLAME, 'explosion_flame', '爆炸烈焰', 5);
      SkillTestHelper.validateChargeSkill(EXPLOSION_FLAME, 1, true);
      SkillTestHelper.validateDamageEffect(EXPLOSION_FLAME, 150, ElementType.FIRE);
      // 必定灼伤
      const freezeEffect = EXPLOSION_FLAME.definition.effects.find(
        e => e.applyDebuff?.debuffType === 'burn'
      );
      expect(freezeEffect?.applyDebuff?.successRate).toBe(1.0);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('火盾 (FIRE_SHIELD_SKILL) - 减伤+灼烧', () => {
      SkillTestHelper.validateSkillBase(FIRE_SHIELD_SKILL, 'fire_shield_skill', '火盾', 1);
      expect(FIRE_SHIELD_SKILL.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = FIRE_SHIELD_SKILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'fire_shield'
      );
      expect(hasBuff).toBe(true);
    });

    it('烈焰壁垒 (WALL_OF_FLAMES) - 属性抗性', () => {
      SkillTestHelper.validateSkillBase(WALL_OF_FLAMES, 'wall_of_flames', '烈焰壁垒', 3);
      expect(WALL_OF_FLAMES.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = WALL_OF_FLAMES.definition.effects.some(
        e => e.applyBuff?.buffType === 'wall_of_fire'
      );
      expect(hasBuff).toBe(true);
    });

    it('灼热反击 (HEAT_COUNTER) - 反弹效果', () => {
      SkillTestHelper.validateSkillBase(HEAT_COUNTER, 'heat_counter', '灼热反击', 3);
      expect(HEAT_COUNTER.definition.target).toBe(SkillTarget.SELF);
      const hasCounter = HEAT_COUNTER.definition.effects.some(
        e => e.special?.type === 'counter'
      );
      expect(hasCounter).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('蓄焰 (FLAME_CHARGE_SKILL) - 下次火攻+50%', () => {
      SkillTestHelper.validateSkillBase(FLAME_CHARGE_SKILL, 'flame_charge_skill', '蓄焰', 2);
      const hasBuff = FLAME_CHARGE_SKILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'flame_charge'
      );
      expect(hasBuff).toBe(true);
    });

    it('燃尽 (COMBUSTION) - 延迟伤害', () => {
      SkillTestHelper.validateSkillBase(COMBUSTION, 'combustion', '燃尽', 4);
      const hasCombustionMark = COMBUSTION.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'combustion_mark'
      );
      expect(hasCombustionMark).toBe(true);
    });

    it('炎之意志 (BLAZE_WILL) - 群体强化', () => {
      SkillTestHelper.validateSkillBase(BLAZE_WILL, 'blaze_will', '炎之意志', 5);
      expect(BLAZE_WILL.definition.target).toBe(SkillTarget.ALLY_ALL);
      const hasBuff = BLAZE_WILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'blaze_will'
      );
      expect(hasBuff).toBe(true);
    });
  });

  describe('FIRE_BURST_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(FIRE_BURST_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(FIRE_BURST_SKILLS.ATTACK).toBeDefined();
      expect(FIRE_BURST_SKILLS.DEFENSE).toBeDefined();
      expect(FIRE_BURST_SKILLS.SUPPORT).toBeDefined();
    });
  });
});

describe('冰属性·减速流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('冰冻之风 (FREEZE_WIND) - 伤害+减速', () => {
      SkillTestHelper.validateSkillBase(FREEZE_WIND, 'freeze_wind', '冰冻之风', 2);
      SkillTestHelper.validateDamageEffect(FREEZE_WIND, 55, ElementType.ICE);
      const hasSlow = FREEZE_WIND.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'slow'
      );
      expect(hasSlow).toBe(true);
    });

    it('绝对零度 (ABSOLUTE_ZERO) - 伤害+冻结', () => {
      SkillTestHelper.validateSkillBase(ABSOLUTE_ZERO, 'absolute_zero', '绝对零度', 3);
      SkillTestHelper.validateDamageEffect(ABSOLUTE_ZERO, 80, ElementType.ICE);
      const hasFreeze = ABSOLUTE_ZERO.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'freeze'
      );
      expect(hasFreeze).toBe(true);
    });

    it('冰晶贯穿 (ICE_CRYSTAL_PIERCE) - 高威力', () => {
      SkillTestHelper.validateSkillBase(ICE_CRYSTAL_PIERCE, 'ice_crystal_pierce', '冰晶贯穿', 4);
      SkillTestHelper.validateDamageEffect(ICE_CRYSTAL_PIERCE, 100, ElementType.ICE);
    });

    it('凛冬之怒 (WINTERS_FURY) - 群体攻击+蓄力', () => {
      SkillTestHelper.validateSkillBase(WINTERS_FURY, 'winters_fury', '凛冬之怒', 5);
      SkillTestHelper.validateChargeSkill(WINTERS_FURY, 1, true);
      expect(WINTERS_FURY.definition.target).toBe(SkillTarget.ENEMY_ALL);
      SkillTestHelper.validateDamageEffect(WINTERS_FURY, 60, ElementType.ICE);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('冰霜护甲 (ICE_ARMOR) - 减伤+冻结', () => {
      SkillTestHelper.validateSkillBase(ICE_ARMOR, 'ice_armor', '冰霜护甲', 1);
      expect(ICE_ARMOR.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = ICE_ARMOR.definition.effects.some(
        e => e.applyBuff?.buffType === 'ice_armor'
      );
      expect(hasBuff).toBe(true);
    });

    it('冰晶反射 (ICE_REFLECT) - 反射效果', () => {
      SkillTestHelper.validateSkillBase(ICE_REFLECT, 'ice_reflect', '冰晶反射', 3);
      expect(ICE_REFLECT.definition.target).toBe(SkillTarget.SELF);
      const hasReflect = ICE_REFLECT.definition.effects.some(
        e => e.applyBuff?.buffType === 'ice_reflect'
      );
      expect(hasReflect).toBe(true);
    });

    it('极寒领域 (FREEZING_FIELD) - 减伤+减速', () => {
      SkillTestHelper.validateSkillBase(FREEZING_FIELD, 'freezing_field', '极寒领域', 3);
      expect(FREEZING_FIELD.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = FREEZING_FIELD.definition.effects.some(
        e => e.applyBuff
      );
      expect(hasBuff).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('寒气凝聚 (COLD_AURA) - 加速', () => {
      SkillTestHelper.validateSkillBase(COLD_AURA, 'cold_aura', '寒气凝聚', 1);
      const hasSpeedBoost = COLD_AURA.definition.effects.some(
        e => e.statBoost?.stat === 'speed'
      );
      expect(hasSpeedBoost).toBe(true);
    });

    it('冰封禁制 (ICE_SEAL) - 封印技能', () => {
      SkillTestHelper.validateSkillBase(ICE_SEAL, 'ice_seal', '冰封禁制', 3);
      const hasSeal = ICE_SEAL.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'ice_seal'
      );
      expect(hasSeal).toBe(true);
    });

    it('绝对零域 (ABSOLUTE_ZERO_FIELD) - 群体减速+DOT', () => {
      SkillTestHelper.validateSkillBase(ABSOLUTE_ZERO_FIELD, 'absolute_zero_field', '绝对零域', 6);
      expect(ABSOLUTE_ZERO_FIELD.definition.target).toBe(SkillTarget.ENEMY_ALL);
      const hasSlow = ABSOLUTE_ZERO_FIELD.definition.effects.some(
        e => e.statBoost?.stat === 'speed' && e.statBoost.stages < 0
      );
      expect(hasSlow).toBe(true);
      const hasDot = ABSOLUTE_ZERO_FIELD.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'ice_dot'
      );
      expect(hasDot).toBe(true);
    });
  });

  describe('ICE_CONTROL_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(ICE_CONTROL_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(ICE_CONTROL_SKILLS.ATTACK).toBeDefined();
      expect(ICE_CONTROL_SKILLS.DEFENSE).toBeDefined();
      expect(ICE_CONTROL_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
