/**
 * 电属性·电磁脉冲流技能测试
 * 测试电属性电磁脉冲流 (8个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 电属性技能
  ELECTRIC_PULSE_SKILLS,
  ZAP_STRIKE,
  THUNDER_STRIKE,
  ELECTROMAGNETIC_PULSE,
  STATIC_CHARGE,
  ELECTRIC_DEFLECT_SKILL,
  CHARGE_ACCELERATE,
  ELECTRIC_FIELD_SKILL,
  STATIC_MARK
} from '../electric-v2';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('电属性·电磁脉冲流技能测试', () => {
  describe('攻击倾向技能 (3个)', () => {
    it('电光一闪 (ZAP_STRIKE) - 先手+1物理攻击', () => {
      SkillTestHelper.validateSkillBase(ZAP_STRIKE, 'zap_strike', '电光一闪', 1);
      SkillTestHelper.validateDamageEffect(ZAP_STRIKE, 45, ElementType.ELECTRIC);
      SkillTestHelper.validateTags(ZAP_STRIKE, ['电', '电磁脉冲流', '攻击', '先手+1', '物理', '蓄电']);
    });

    it('雷鸣击 (THUNDER_STRIKE) - 高威力+麻痹', () => {
      SkillTestHelper.validateSkillBase(THUNDER_STRIKE, 'thunder_strike', '雷鸣击', 3);
      SkillTestHelper.validateDamageEffect(THUNDER_STRIKE, 90, ElementType.ELECTRIC);
      const effects = THUNDER_STRIKE.definition.effects;
      expect(effects[1].applyDebuff?.debuffType).toBe('paralysis');
    });

    it('电磁脉冲 (ELECTROMAGNETIC_PULSE) - 核心爆发技能', () => {
      SkillTestHelper.validateSkillBase(ELECTROMAGNETIC_PULSE, 'electromagnetic_pulse', '电磁脉冲', 4);
      SkillTestHelper.validateDamageEffect(ELECTROMAGNETIC_PULSE, 60, ElementType.ELECTRIC);
    });
  });

  describe('防御倾向技能 (2个)', () => {
    it('蓄电护体 (STATIC_CHARGE) - 护盾+蓄电', () => {
      SkillTestHelper.validateSkillBase(STATIC_CHARGE, 'static_charge', '蓄电护体', 2);
      expect(STATIC_CHARGE.definition.target).toBe(SkillTarget.SELF);
      const hasShield = STATIC_CHARGE.definition.effects.some(
        e => e.shield !== undefined
      );
      expect(hasShield).toBe(true);
    });

    it('电磁偏转 (ELECTRIC_DEFLECT_SKILL) - 闪避+反击', () => {
      SkillTestHelper.validateSkillBase(ELECTRIC_DEFLECT_SKILL, 'electric_deflect', '电磁偏转', 3);
      expect(ELECTRIC_DEFLECT_SKILL.definition.target).toBe(SkillTarget.SELF);
      const hasBuff = ELECTRIC_DEFLECT_SKILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'electric_deflect'
      );
      expect(hasBuff).toBe(true);
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('充能加速 (CHARGE_ACCELERATE) - 加速+充能状态', () => {
      SkillTestHelper.validateSkillBase(CHARGE_ACCELERATE, 'charge_accelerate', '充能加速', 2);
      expect(CHARGE_ACCELERATE.definition.target).toBe(SkillTarget.SELF);
      const speedBoost = CHARGE_ACCELERATE.definition.effects.find(
        e => e.statBoost?.stat === 'speed'
      );
      expect(speedBoost).toBeDefined();
      expect(speedBoost?.statBoost?.stages).toBe(2);
      expect(speedBoost?.statBoost?.duration).toBe(3);
    });

    it('电场展开 (ELECTRIC_FIELD_SKILL) - 全队buff', () => {
      SkillTestHelper.validateSkillBase(ELECTRIC_FIELD_SKILL, 'electric_field', '电场展开', 3);
      expect(ELECTRIC_FIELD_SKILL.definition.target).toBe(SkillTarget.ALLY_ALL);
      const hasFieldBuff = ELECTRIC_FIELD_SKILL.definition.effects.some(
        e => e.applyBuff?.buffType === 'electric_field_buff'
      );
      expect(hasFieldBuff).toBe(true);
    });

    it('静电标记 (STATIC_MARK) - 标记敌人', () => {
      SkillTestHelper.validateSkillBase(STATIC_MARK, 'static_mark', '静电标记', 1);
      expect(STATIC_MARK.definition.target).toBe(SkillTarget.SINGLE);
      const hasDebuff = STATIC_MARK.definition.effects.some(
        e => e.applyDebuff?.debuffType === 'static'
      );
      expect(hasDebuff).toBe(true);
    });
  });

  describe('ELECTRIC_PULSE_SKILLS 技能库', () => {
    it('包含所有8个技能', () => {
      expect(ELECTRIC_PULSE_SKILLS.ALL).toHaveLength(8);
    });

    it('按倾向分类正确', () => {
      expect(ELECTRIC_PULSE_SKILLS.ATTACK).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.DEFENSE).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.SUPPORT).toBeDefined();
    });

    it('攻击技能数量正确', () => {
      expect(ELECTRIC_PULSE_SKILLS.ATTACK.ZAP_STRIKE).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.ATTACK.THUNDER_STRIKE).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.ATTACK.ELECTROMAGNETIC_PULSE).toBeDefined();
    });

    it('防御技能数量正确', () => {
      expect(ELECTRIC_PULSE_SKILLS.DEFENSE.STATIC_CHARGE).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.DEFENSE.ELECTRIC_DEFLECT_SKILL).toBeDefined();
    });

    it('辅助技能数量正确', () => {
      expect(ELECTRIC_PULSE_SKILLS.SUPPORT.CHARGE_ACCELERATE).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.SUPPORT.ELECTRIC_FIELD_SKILL).toBeDefined();
      expect(ELECTRIC_PULSE_SKILLS.SUPPORT.STATIC_MARK).toBeDefined();
    });
  });
});

describe('电属性Buff系统测试', () => {
  it('ChargeBuff - 电荷积累', () => {
    const { ChargeBuff } = require('../../effects/buffs/electric-buffs-v2');
    const buff = new ChargeBuff();
    
    expect(buff.getChargeStacks()).toBe(0);
    
    buff.gainCharge(2);
    expect(buff.getChargeStacks()).toBe(2);
    expect(buff.getPowerMultiplier()).toBe(0.2);
    
    buff.gainCharge(5);
    expect(buff.getChargeStacks()).toBe(5); // 不超过上限
    
    expect(buff.isCritical()).toBe(true);
    expect(buff.getPowerMultiplier()).toBe(0.7);
  });

  it('ChargingBuff - 充能状态', () => {
    const { ChargingBuff } = require('../../effects/buffs/electric-buffs-v2');
    const buff = new ChargingBuff(2);
    
    expect(buff.isCharging()).toBe(true);
    expect(buff.getExtraCharge()).toBe(1);
  });

  it('ElectricFieldBuff - 电场', () => {
    const { ElectricFieldBuff } = require('../../effects/buffs/electric-buffs-v2');
    const buff = new ElectricFieldBuff(2);
    
    expect(buff.getDamageBonus()).toBe(0.15);
    expect(buff.getExtraCharge()).toBe(1);
  });
});

describe('电属性Debuff系统测试', () => {
  it('StaticDebuff - 静电', () => {
    const { StaticDebuff } = require('../../effects/debuffs/electric-debuffs-v2');
    const debuff = new StaticDebuff(3);
    
    expect(debuff.name).toBe('静电');
    expect(debuff.getChargeBonus()).toBe(1);
  });
});
