/**
 * 水/电属性技能测试
 * 测试水属性控制流 (10个) 和 电属性连击流 (10个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 水属性技能
  WATER_CONTROL_SKILLS,
  WATER_JET,
  HYDRO_PUMP,
  TORRENT_CRASH,
  ABYSS_VORTEX,
  AQUA_SHIELD,
  CLEAR_SPRING,
  VORTEX_BARRIER,
  HEALING_WAVE,
  AQUA_THERAPY,
  TIDAL_SURGE
} from '../water';
import {
  // 电属性技能
  ELECTRIC_COMBO_SKILLS,
  ZAP_CUT,
  THUNDER_COMBO,
  ELECTROMAGNETIC_HIT,
  THUNDER_CATASTROPHE,
  STATIC_SHIELD_SKILL,
  ELECTROMAGNETIC_DEFLECT,
  DISCHARGE_BARRIER,
  CHARGE_ACCELERATE,
  ELECTROMAGNETIC_INDUCTION,
  THUNDER_DOMAIN
} from '../electric';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('水属性·控制流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('水流冲击 (WATER_JET) - 伤害+潮湿', () => {
      SkillTestHelper.validateSkillBase(WATER_JET, 'water_jet', '水流冲击', 2);
      SkillTestHelper.validateDamageEffect(WATER_JET, 60, ElementType.WATER);
      const hasWet = WATER_JET.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'wet'
      );
      expect(hasWet).toBe(true);
    });

    it('水炮 (HYDRO_PUMP) - 高威力', () => {
      SkillTestHelper.validateSkillBase(HYDRO_PUMP, 'hydro_pump', '水炮', 3);
      SkillTestHelper.validateDamageEffect(HYDRO_PUMP, 90, ElementType.WATER);
    });

    it('洪流冲击 (TORRENT_CRASH) - 伤害+DOT', () => {
      SkillTestHelper.validateSkillBase(TORRENT_CRASH, 'torrent_crash', '洪流冲击', 3);
      SkillTestHelper.validateDamageEffect(TORRENT_CRASH, 70, ElementType.WATER);
      const hasDrowning = TORRENT_CRASH.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'drowning'
      );
      expect(hasDrowning).toBe(true);
    });

    it('深渊漩涡 (ABYSS_VORTEX) - 蓄力+湍流', () => {
      SkillTestHelper.validateSkillBase(ABYSS_VORTEX, 'abyss_vortex', '深渊漩涡', 5);
      SkillTestHelper.validateChargeSkill(ABYSS_VORTEX, 1, true);
      SkillTestHelper.validateDamageEffect(ABYSS_VORTEX, 120, ElementType.WATER);
      const hasTurbulence = ABYSS_VORTEX.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'turbulence'
      );
      expect(hasTurbulence).toBe(true);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('水之守护 (AQUA_SHIELD) - 高护盾', () => {
      SkillTestHelper.validateSkillBase(AQUA_SHIELD, 'aqua_shield', '水之守护', 2);
      SkillTestHelper.validateShieldEffect(AQUA_SHIELD, 80);
      expect(AQUA_SHIELD.definition.target).toBe(SkillTarget.ALLY);
    });

    it('清泉护盾 (CLEAR_SPRING) - 治疗+净化', () => {
      SkillTestHelper.validateSkillBase(CLEAR_SPRING, 'clear_spring', '清泉护盾', 3);
      expect(CLEAR_SPRING.definition.target).toBe(SkillTarget.SELF);
      const hasClearSpring = CLEAR_SPRING.definition.effects.some(
        e => e.applyBuff?.buffType === 'clear_spring'
      );
      expect(hasClearSpring).toBe(true);
    });

    it('涡流壁垒 (VORTEX_BARRIER) - 60%减伤+减速反击', () => {
      SkillTestHelper.validateSkillBase(VORTEX_BARRIER, 'vortex_barrier', '涡流壁垒', 3);
      expect(VORTEX_BARRIER.definition.target).toBe(SkillTarget.SELF);
      // 验证60%减伤
      const hasVortexBody = VORTEX_BARRIER.definition.effects.some(
        e => e.applyBuff?.buffType === 'vortex_body'
      );
      expect(hasVortexBody).toBe(true);
      const vortexBuff = VORTEX_BARRIER.definition.effects.find(
        e => e.applyBuff?.buffType === 'vortex_body'
      );
      expect(vortexBuff?.applyBuff?.value).toBe(0.6);  // 60%减伤
      // 验证减速反击
      const hasCounterSlow = VORTEX_BARRIER.definition.effects.some(
        e => e.special?.type === 'counter_slow'
      );
      expect(hasCounterSlow).toBe(true);
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

    it('潮汐涌动 (TIDAL_SURGE) - 延迟伤害', () => {
      SkillTestHelper.validateSkillBase(TIDAL_SURGE, 'tidal_surge', '潮汐涌动', 6);
      // 验证延迟效果
      expect(TIDAL_SURGE.definition.delay).toBeDefined();
      expect(TIDAL_SURGE.definition.delay?.turns).toBe(3);
      // 验证延迟伤害效果
      expect(TIDAL_SURGE.definition.delay?.effect.damage).toBeDefined();
      expect(TIDAL_SURGE.definition.delay?.effect.damage?.basePower).toBe(90);
      // 验证延迟潮湿效果
      expect(TIDAL_SURGE.definition.delay?.effect.applyDebuff).toBeDefined();
      expect(TIDAL_SURGE.definition.delay?.effect.applyDebuff?.debuffType).toBe('wet');
    });
  });

  describe('WATER_CONTROL_SKILLS 技能库', () => {
    it('包含所有10个技能', () => {
      expect(WATER_CONTROL_SKILLS.ALL).toHaveLength(10);
    });

    it('按倾向分类正确', () => {
      expect(WATER_CONTROL_SKILLS.ATTACK).toBeDefined();
      expect(WATER_CONTROL_SKILLS.DEFENSE).toBeDefined();
      expect(WATER_CONTROL_SKILLS.SUPPORT).toBeDefined();
    });
  });
});

describe('电属性·连击流技能测试', () => {
  describe('攻击倾向技能 (4个)', () => {
    it('电光斩 (ZAP_CUT) - 高速攻击', () => {
      SkillTestHelper.validateSkillBase(ZAP_CUT, 'zap_cut', '电光斩', 1);
      SkillTestHelper.validateDamageEffect(ZAP_CUT, 45, ElementType.ELECTRIC);
      SkillTestHelper.validateTags(ZAP_CUT, ['电', '连击流', '攻击', '先手', '麻痹']);
    });

    it('雷霆连击 (THUNDER_COMBO) - 多段攻击', () => {
      SkillTestHelper.validateSkillBase(THUNDER_COMBO, 'thunder_combo', '雷霆连击', 2);
      const effects = THUNDER_COMBO.definition.effects;
      expect(effects[0].damage?.hits).toBe(3);
    });

    it('电磁冲击 (ELECTROMAGNETIC_HIT) - 高威力', () => {
      SkillTestHelper.validateSkillBase(ELECTROMAGNETIC_HIT, 'electromagnetic_hit', '电磁冲击', 3);
      SkillTestHelper.validateDamageEffect(ELECTROMAGNETIC_HIT, 85, ElementType.ELECTRIC);
    });

    it('雷霆万钧 (THUNDER_CATASTROPHE) - 终极攻击', () => {
      SkillTestHelper.validateSkillBase(THUNDER_CATASTROPHE, 'thunder_catastrophe', '雷霆万钧', 5);
      SkillTestHelper.validateDamageEffect(THUNDER_CATASTROPHE, 130, ElementType.ELECTRIC);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('静电护盾 (STATIC_SHIELD_SKILL) - 蓄电护体+静电积累', () => {
      SkillTestHelper.validateSkillBase(STATIC_SHIELD_SKILL, 'static_shield_skill', '静电护盾', 2);
      expect(STATIC_SHIELD_SKILL.definition.target).toBe(SkillTarget.SELF);
      // 验证有蓄电护体buff效果
      const hasStaticBody = STATIC_SHIELD_SKILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'static_body'
      );
      expect(hasStaticBody).toBe(true);
      // 验证静电积累效果
      const hasStaticCharge = STATIC_SHIELD_SKILL.definition.effects.some(
        e => e.special?.type === 'static_charge'
      );
      expect(hasStaticCharge).toBe(true);
    });

    it('电磁偏转 (ELECTROMAGNETIC_DEFLECT) - 闪避+反弹', () => {
      SkillTestHelper.validateSkillBase(ELECTROMAGNETIC_DEFLECT, 'electromagnetic_deflect', '电磁偏转', 3);
      expect(ELECTROMAGNETIC_DEFLECT.definition.target).toBe(SkillTarget.SELF);
      // 验证有电磁偏转buff效果
      const hasElectricDeflect = ELECTROMAGNETIC_DEFLECT.definition.effects.some(
        e => e.applyBuff?.buffType === 'electric_deflect'
      );
      expect(hasElectricDeflect).toBe(true);
    });

    it('放电壁垒 (DISCHARGE_BARRIER) - 65%减伤+追加伤害', () => {
      SkillTestHelper.validateSkillBase(DISCHARGE_BARRIER, 'discharge_barrier', '放电壁垒', 4);
      expect(DISCHARGE_BARRIER.definition.target).toBe(SkillTarget.SELF);
      // 验证有减伤效果
      const hasDischargeBarrier = DISCHARGE_BARRIER.definition.effects.some(
        e => e.applyBuff?.buffType === 'discharge_barrier'
      );
      expect(hasDischargeBarrier).toBe(true);
      // 验证有追加伤害效果
      const hasExtraAttack = DISCHARGE_BARRIER.definition.effects.some(
        e => e.special?.type === 'extra_attack_damage'
      );
      expect(hasExtraAttack).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('充能加速 (CHARGE_ACCELERATE) - 加速+连击充能', () => {
      SkillTestHelper.validateSkillBase(CHARGE_ACCELERATE, 'charge_accelerate', '充能加速', 2);
      expect(CHARGE_ACCELERATE.definition.target).toBe(SkillTarget.SELF);
      // 验证有速度提升效果
      const speedBoost = CHARGE_ACCELERATE.definition.effects.find(
        e => e.statBoost?.stat === 'speed'
      );
      expect(speedBoost).toBeDefined();
      expect(speedBoost?.statBoost?.stages).toBe(2);
      expect(speedBoost?.statBoost?.duration).toBe(3);
      // 验证有连击充能buff效果
      const comboBuff = CHARGE_ACCELERATE.definition.effects.find(
        e => e.applyBuff?.buffType === 'combo_charge'
      );
      expect(comboBuff).toBeDefined();
      expect(comboBuff?.applyBuff?.duration).toBe(3);
    });

    it('电磁感应 (ELECTROMAGNETIC_INDUCTION) - 追加攻击', () => {
      SkillTestHelper.validateSkillBase(ELECTROMAGNETIC_INDUCTION, 'electromagnetic_induction', '电磁感应', 3);
      expect(ELECTROMAGNETIC_INDUCTION.definition.target).toBe(SkillTarget.ALLY);
      // 验证有电磁感应buff效果
      const hasInduction = ELECTROMAGNETIC_INDUCTION.definition.effects.some(
        e => e.applyBuff?.buffType === 'electromagnetic_induction'
      );
      expect(hasInduction).toBe(true);
    });

    it('雷霆领域 (THUNDER_DOMAIN) - 必定命中+敌方受伤', () => {
      SkillTestHelper.validateSkillBase(THUNDER_DOMAIN, 'thunder_domain', '雷霆领域', 6);
      expect(THUNDER_DOMAIN.definition.target).toBe(SkillTarget.SELF);
      // 验证有雷霆领域buff效果
      const hasDomain = THUNDER_DOMAIN.definition.effects.some(
        e => e.applyBuff?.buffType === 'thunder_domain'
      );
      expect(hasDomain).toBe(true);
    });
  });

  describe('ELECTRIC_COMBO_SKILLS 技能库', () => {
    it('包含所有技能', () => {
      // 电属性技能：攻击4+防御3+辅助5（包含连锁闪电、伏特切换）
      expect(ELECTRIC_COMBO_SKILLS.ALL.length).toBeGreaterThanOrEqual(10);
    });

    it('按倾向分类正确', () => {
      expect(ELECTRIC_COMBO_SKILLS.ATTACK).toBeDefined();
      expect(ELECTRIC_COMBO_SKILLS.DEFENSE).toBeDefined();
      expect(ELECTRIC_COMBO_SKILLS.SUPPORT).toBeDefined();
    });
  });
});
