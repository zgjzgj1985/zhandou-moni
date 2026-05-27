/**
 * 火/冰属性技能测试
 * 测试火属性爆发流 (11个) 和 冰属性冰霜蓄力流 (10个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 火属性技能
  FIRE_BURST_SKILLS,
  EMBER,
  FLAME_PUNCH,
  FLARE_BLITZ,
  EXPLOSION_FLAME,
  OVERHEAT,
  FLAME_IMPACT,
  FIRE_SHIELD_SKILL,
  WALL_OF_FLAMES,
  FLAME_CHARGE_SKILL,
  COMBUSTION,
  BLAZE_WILL
} from '../fire';
import {
  // 冰属性技能（冰霜蓄力流）
  ICE_SHARD_SKILLS,
  ICE_SHOT,
  FROST_BREATH,
  ICICLE_SPEAR,
  ICE_HAMMER,
  ICE_EXPLOSION,
  FROST_ARMOR,
  ICE_WALL,
  COLD_AURA,
  FROST_MARK,
  FROZEN_LAND
} from '../ice';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('火属性·爆发流技能测试', () => {
  describe('攻击倾向技能 (6个)', () => {
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

    it('火焰冲击 (FLAME_IMPACT) - 清除增益', () => {
      SkillTestHelper.validateSkillBase(FLAME_IMPACT, 'flame_impact', '火焰冲击', 2);
      const effects = FLAME_IMPACT.definition.effects;
      expect(effects[0].damage?.damageType).toBe('physical');
      expect(effects[0].damage?.basePower).toBe(40);
      const hasCleanse = effects.some(
        e => e.special?.type === 'cleanse_target_buff'
      );
      expect(hasCleanse).toBe(true);
    });

    it('大字爆炎 (FLARE_BLITZ) - 高威力+灼伤印记', () => {
      SkillTestHelper.validateSkillBase(FLARE_BLITZ, 'flare_blitz', '大字爆炎', 4);
      SkillTestHelper.validateDamageEffect(FLARE_BLITZ, 120, ElementType.FIRE);
      const hasBurnMark = FLARE_BLITZ.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'burn_mark'
      );
      expect(hasBurnMark).toBe(true);
    });

    it('过热 (OVERHEAT) - 高代价高回报', () => {
      SkillTestHelper.validateSkillBase(OVERHEAT, 'overheat', '过热', 4);
      SkillTestHelper.validateDamageEffect(OVERHEAT, 130, ElementType.FIRE);
      const hasPenalty = OVERHEAT.definition.effects.some(
        e => e.applyBuff?.buffType === 'overheat_penalty'
      );
      expect(hasPenalty).toBe(true);
    });

    it('爆炸烈焰 (EXPLOSION_FLAME) - 6段多段伤害+必定灼伤', () => {
      SkillTestHelper.validateSkillBase(EXPLOSION_FLAME, 'explosion_flame', '爆炸烈焰', 5);
      // 验证多段伤害
      const damageEffect = EXPLOSION_FLAME.definition.effects.find(
        e => e.damage?.hits
      );
      expect(damageEffect?.damage?.hits).toBe(6);
      expect(damageEffect?.damage?.basePower).toBe(25);
      // 必定灼伤
      const burnEffect = EXPLOSION_FLAME.definition.effects.find(
        e => e.applyDebuff?.debuffType === 'burn'
      );
      expect(burnEffect?.applyDebuff?.successRate).toBe(1.0);
      expect(burnEffect?.applyDebuff?.stacks).toBe(1);
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
    it('包含所有11个技能', () => {
      expect(FIRE_BURST_SKILLS.ALL).toHaveLength(11);
    });

    it('按倾向分类正确', () => {
      expect(FIRE_BURST_SKILLS.ATTACK).toBeDefined();
      expect(FIRE_BURST_SKILLS.DEFENSE).toBeDefined();
      expect(FIRE_BURST_SKILLS.SUPPORT).toBeDefined();
    });
  });
});

describe('冰属性·冰霜蓄力流技能测试', () => {
  describe('攻击倾向技能 (5个)', () => {
    it('冰晶射击 (ICE_SHOT) - 伤害+冰霜', () => {
      SkillTestHelper.validateSkillBase(ICE_SHOT, 'ice_shot', '冰晶射击', 1);
      SkillTestHelper.validateDamageEffect(ICE_SHOT, 35, ElementType.ICE);
      const hasFrost = ICE_SHOT.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'frost'
      );
      expect(hasFrost).toBe(true);
      expect(ICE_SHOT.definition.priority).toBe(1);
    });

    it('霜冻之息 (FROST_BREATH) - 伤害+极寒印记', () => {
      SkillTestHelper.validateSkillBase(FROST_BREATH, 'frost_breath', '霜冻之息', 2);
      SkillTestHelper.validateDamageEffect(FROST_BREATH, 50, ElementType.ICE);
      const hasMark = FROST_BREATH.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'extreme_cold_mark'
      );
      expect(hasMark).toBe(true);
    });

    it('冰锥 (ICICLE_SPEAR) - 随机2-5次连击', () => {
      SkillTestHelper.validateSkillBase(ICICLE_SPEAR, 'icicle_spear', '冰锥', 2);
      SkillTestHelper.validateDamageEffect(ICICLE_SPEAR, 25, ElementType.ICE);
      // 验证随机连击范围
      expect(ICICLE_SPEAR.definition.minHits).toBe(2);
      expect(ICICLE_SPEAR.definition.maxHits).toBe(5);
    });

    it('冰锤 (ICE_HAMMER) - 高威力+自降速度', () => {
      SkillTestHelper.validateSkillBase(ICE_HAMMER, 'ice_hammer', '冰锤', 4);
      SkillTestHelper.validateDamageEffect(ICE_HAMMER, 100, ElementType.ICE);
      // 验证代价机制
      const hasSelfDebuff = ICE_HAMMER.definition.effects.some(
        e => e.selfStatBoost?.stat === 'speed' && e.selfStatBoost.stages === -1
      );
      expect(hasSelfDebuff).toBe(true);
    });

    it('冰爆 (ICE_EXPLOSION) - 冻结目标3倍伤害', () => {
      SkillTestHelper.validateSkillBase(ICE_EXPLOSION, 'ice_explosion', '冰爆', 5);
      SkillTestHelper.validateDamageEffect(ICE_EXPLOSION, 130, ElementType.ICE);
      const damageEffect = ICE_EXPLOSION.definition.effects.find(e => e.damage);
      expect(damageEffect?.damage?.conditionMultiplier).toEqual({
        condition: 'freeze',
        multiplier: 3
      });
    });
  });

  describe('防御倾向技能 (2个)', () => {
    it('冰霜护甲 (FROST_ARMOR) - 减伤+冰霜反击', () => {
      SkillTestHelper.validateSkillBase(FROST_ARMOR, 'frost_armor', '冰霜护甲', 2);
      expect(FROST_ARMOR.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = FROST_ARMOR.definition.effects.some(
        e => e.applyBuff?.buffType === 'ice_armor'
      );
      expect(hasBuff).toBe(true);
    });

    it('冰墙 (ICE_WALL) - 减伤', () => {
      SkillTestHelper.validateSkillBase(ICE_WALL, 'ice_wall', '冰墙', 3);
      expect(ICE_WALL.definition.target).toBe(SkillTarget.ALLY);
      const hasBuff = ICE_WALL.definition.effects.some(
        e => e.applyBuff?.buffType === 'ice_wall'
      );
      expect(hasBuff).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('寒气凝聚 (COLD_AURA) - 防御强化', () => {
      SkillTestHelper.validateSkillBase(COLD_AURA, 'cold_aura', '寒气凝聚', 1);
      const hasDefenseBoost = COLD_AURA.definition.effects.some(
        e => e.statBoost?.stat === 'defense'
      );
      expect(hasDefenseBoost).toBe(true);
    });

    it('冰霜印记 (FROST_MARK) - 冰霜强化', () => {
      SkillTestHelper.validateSkillBase(FROST_MARK, 'frost_mark', '冰霜印记', 1);
      const hasMark = FROST_MARK.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'frost_mark'
      );
      expect(hasMark).toBe(true);
    });

    it('冻土 (FROZEN_LAND) - 冻土环境', () => {
      SkillTestHelper.validateSkillBase(FROZEN_LAND, 'frozen_land', '冻土', 5);
      expect(FROZEN_LAND.definition.target).toBe(SkillTarget.ALLY_ALL);
      const hasEnv = FROZEN_LAND.definition.effects.some(
        e => e.applyBuff?.buffType === 'frozen_land_env'
      );
      expect(hasEnv).toBe(true);
    });
  });

  describe('ICE_SHARD_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(ICE_SHARD_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(ICE_SHARD_SKILLS.ATTACK).toBeDefined();
      expect(ICE_SHARD_SKILLS.DEFENSE).toBeDefined();
      expect(ICE_SHARD_SKILLS.SUPPORT).toBeDefined();
    });

    it('攻击倾向包含5个技能', () => {
      expect(Object.keys(ICE_SHARD_SKILLS.ATTACK)).toHaveLength(5);
    });
  });
});
