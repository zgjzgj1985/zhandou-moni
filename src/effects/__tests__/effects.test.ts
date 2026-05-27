/**
 * Buff/Debuff 效果系统测试
 * 测试所有属性专属的 Buff 和 Debuff 类
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Buff类
  Buff,
  IceArmorBuff,
  IceReflectBuff,
  IceResistBuff,
  FireShieldBuff,
  WallOfFireBuff,
  FlameChargeBuff,
  BlazeWillBuff,
  WaterShieldBuff,
  ClearSpringBuff,
  FlowBuff,
  WaterResistBuff,
  // Debuff类
  Debuff,
  SlowDebuff,
  IceSealDebuff,
  IceDotDebuff,
  BurnDebuff,
  BurnMarkDebuff,
  CombustionMarkDebuff,
  WetDebuff,
  TurbulenceDebuff,
  FreezeDebuff
} from '../index';
import { BuffType, DebuffType } from '../../types';

// Mock CombatUnit
function createMockUnit(maxHp: number = 100): any {
  return {
    maxHp,
    currentHp: maxHp,
    heal(amount: number) {
      const oldHp = this.currentHp;
      this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
      return this.currentHp - oldHp;
    },
    takeDamage(amount: number) {
      const actual = Math.min(this.currentHp, amount);
      this.currentHp -= actual;
      return actual;
    }
  };
}

describe('Buff 效果系统测试', () => {
  describe('冰属性 Buff', () => {
    it('IceArmorBuff - 冰霜护甲', () => {
      const mockUnit = createMockUnit(100);
      const buff = new IceArmorBuff(mockUnit, 50, 0.3);
      
      expect(buff.name).toBe('冰霜护甲');
      expect(buff.type).toBe(BuffType.ICE_ARMOR);
      expect(buff.duration).toBe(999);
      expect(buff.getIceResistMultiplier()).toBe(0.7);
      
      // 测试护盾吸收
      const result = buff.absorbDamage(30);
      expect(result.absorbed).toBe(30);
      expect(result.remaining).toBe(0);
      expect(buff.shieldValue).toBe(20);
    });

    it('IceReflectBuff - 冰晶反射', () => {
      const buff = new IceReflectBuff(1, 2, 1);
      
      expect(buff.name).toBe('冰晶反射');
      expect(buff.type).toBe(BuffType.ICE_REFLECT);
      expect(buff.remainingDuration).toBe(2);
      
      // 测试反射
      expect(buff.tryReflect()).toBe(true);
      expect(buff.tryReflect()).toBe(false);
      
      // 测试减速信息
      const slowInfo = buff.getSlowInfo();
      expect(slowInfo.duration).toBe(2);
      expect(slowInfo.stages).toBe(1);
    });

    it('IceResistBuff - 极寒抗性', () => {
      const buff = new IceResistBuff(2, 0.5);
      
      expect(buff.name).toBe('极寒抗性');
      expect(buff.type).toBe(BuffType.ICE_RESIST);
      expect(buff.getSlowResistMultiplier()).toBe(0.5);
    });
  });

  describe('火属性 Buff', () => {
    it('FireShieldBuff - 火盾', () => {
      const mockUnit = createMockUnit(100);
      const buff = new FireShieldBuff(mockUnit, 50, 30);
      
      expect(buff.name).toBe('火盾');
      expect(buff.type).toBe(BuffType.FIRE_SHIELD);
      expect(buff.getCounterDamage()).toBe(30);
    });

    it('WallOfFireBuff - 烈焰壁垒', () => {
      const buff = new WallOfFireBuff(2, 0.3);
      
      expect(buff.name).toBe('烈焰壁垒');
      expect(buff.type).toBe(BuffType.WALL_OF_FIRE);
      expect(buff.getResistMultiplier('grass')).toBe(0.7);
      expect(buff.getResistMultiplier('ice')).toBe(0.7);
      expect(buff.getResistMultiplier('water')).toBe(1);
    });

    it('FlameChargeBuff - 蓄焰', () => {
      const buff = new FlameChargeBuff(3, 0.5);
      
      expect(buff.name).toBe('蓄焰');
      expect(buff.type).toBe(BuffType.FLAME_CHARGE);
      expect(buff.getDamageMultiplier()).toBe(1.5);
      expect(buff.isActive()).toBe(true);
      
      buff.consume();
      expect(buff.isActive()).toBe(false);
    });

    it('BlazeWillBuff - 炎之意志', () => {
      const buff = new BlazeWillBuff(2, 1, 1, 0.15);
      
      expect(buff.name).toBe('炎之意志');
      expect(buff.type).toBe(BuffType.BLAZE_WILL);
      expect(buff.getAttackBonus()).toBe(1);
      expect(buff.getSpeedBonus()).toBe(1);
      expect(buff.getFireDamageMultiplier()).toBe(1.15);
    });
  });

  describe('水属性 Buff', () => {
    it('WaterShieldBuff - 水之守护', () => {
      const mockUnit = createMockUnit(100);
      const buff = new WaterShieldBuff(mockUnit, 80, 0.2);
      
      expect(buff.name).toBe('水之守护');
      expect(buff.type).toBe(BuffType.WATER_SHIELD);
      expect(buff.getDamageReduction()).toBe(0.2);
    });

    it('ClearSpringBuff - 清泉', () => {
      const mockUnit = createMockUnit(100);
      const buff = new ClearSpringBuff(3, 0.1, 1);
      
      expect(buff.name).toBe('清泉');
      expect(buff.type).toBe(BuffType.CLEAR_SPRING);
      expect(buff.getCleanseCount()).toBe(1);
      
      // 测试回合开始治疗
      mockUnit.currentHp = 50;
      buff.onTurnStart(mockUnit);
      expect(mockUnit.currentHp).toBe(60);
    });

    it('FlowBuff - 流水', () => {
      const buff = new FlowBuff(2, 1);
      
      expect(buff.name).toBe('流水');
      expect(buff.type).toBe(BuffType.FLOW);
      expect(buff.getSpeedBonus()).toBe(1);
    });

    it('WaterResistBuff - 水属性抗性', () => {
      const buff = new WaterResistBuff(3, 0.3);
      
      expect(buff.name).toBe('水抗');
      expect(buff.type).toBe(BuffType.WATER_RESIST);
      expect(buff.getResistMultiplier()).toBe(0.7);
    });
  });
});

describe('Debuff 效果系统测试', () => {
  describe('冰属性 Debuff', () => {
    it('SlowDebuff - 减速', () => {
      const debuff = new SlowDebuff(1, 2);
      
      expect(debuff.name).toBe('减速');
      expect(debuff.type).toBe(DebuffType.SLOW);
      expect(debuff.getSpeedStages()).toBe(1);
    });

    it('IceSealDebuff - 冰封禁制', () => {
      const debuff = new IceSealDebuff(2, 3);
      
      expect(debuff.name).toBe('冰封禁制');
      expect(debuff.type).toBe(DebuffType.ICE_SEAL);
      expect(debuff.canUseSkill(2)).toBe(true);
      expect(debuff.canUseSkill(3)).toBe(false);
      expect(debuff.canUseSkill(4)).toBe(false);
    });

    it('IceDotDebuff - 冰冻伤害', () => {
      const mockUnit = createMockUnit(100);
      const debuff = new IceDotDebuff(3, 20);
      
      expect(debuff.name).toBe('冰冻伤害');
      expect(debuff.type).toBe(DebuffType.ICE_DOT);
      
      debuff.onTurnStart(mockUnit);
      expect(mockUnit.currentHp).toBe(80);
    });

    it('FreezeDebuff - 冻结', () => {
      const debuff = new FreezeDebuff();
      
      expect(debuff.name).toBe('冰冻');
      expect(debuff.type).toBe(DebuffType.FREEZE);
      expect(debuff.thawChance).toBe(0.2); // 20%解冻概率
    });
  });

  describe('火属性 Debuff', () => {
    it('BurnDebuff - 灼烧 (回合结束触发)', () => {
      const mockUnit = createMockUnit(100);
      // stacks=5 (5层), duration=3, damagePercentPerStack=0.02 (每层2%)
      // 伤害 = 100 * 0.02 * 5 = 10
      const debuff = new BurnDebuff(5, 3, 0.02);

      expect(debuff.name).toBe('灼烧');
      expect(debuff.type).toBe(DebuffType.BURN);

      // 回合结束触发：100 - 100*0.02*5 = 100 - 10 = 90
      debuff.onTurnEnd(mockUnit);
      expect(mockUnit.currentHp).toBe(90);
      expect(debuff.stacks).toBe(2); // 5/2 = 2.5 → 2
      expect(debuff.remainingDuration).toBe(2);
    });

    it('BurnMarkDebuff - 灼伤印记', () => {
      const debuff = new BurnMarkDebuff(40);
      
      expect(debuff.name).toBe('灼伤印记');
      expect(debuff.type).toBe(DebuffType.BURN_MARK);
      expect(debuff.getExtraDamage()).toBe(40);
    });

    it('CombustionMarkDebuff - 燃尽印记', () => {
      const mockUnit = createMockUnit(100);
      mockUnit.currentHp = 50;
      const debuff = new CombustionMarkDebuff(3, 0.3);
      
      expect(debuff.name).toBe('燃尽印记');
      expect(debuff.type).toBe(DebuffType.COMBUSTION_MARK);
      
      debuff.trigger(mockUnit);
      expect(mockUnit.currentHp).toBe(35); // 50 - 50*0.3 = 35
    });
  });

  describe('水属性 Debuff', () => {
    it('WetDebuff - 潮湿', () => {
      const debuff = new WetDebuff(3, 0.3);
      
      expect(debuff.name).toBe('潮湿');
      expect(debuff.type).toBe(DebuffType.WET);
      expect(debuff.getElectricDamageMultiplier()).toBe(1.3);
    });

    it('TurbulenceDebuff - 湍流', () => {
      const debuff = new TurbulenceDebuff(2, 1);
      
      expect(debuff.name).toBe('湍流');
      expect(debuff.type).toBe(DebuffType.TURBULENCE);
      expect(debuff.getEnergyIncrease()).toBe(1);
    });
  });
});

describe('Buff/Debuff 工厂函数测试', () => {
  it('createBuff 工厂函数', async () => {
    const { createBuff } = await import('../index');

    // 测试创建火焰蓄焰Buff
    const flameCharge = createBuff(BuffType.FLAME_CHARGE, 1, 3);
    expect(flameCharge.name).toBe('蓄焰');

    // 测试创建速度提升Buff
    const speedUp = createBuff(BuffType.SPEED_UP, 1, 2);
    expect(speedUp.name).toBe('速度提升');
  });

  it('createDebuff 工厂函数', async () => {
    const { createDebuff } = await import('../index');

    // 测试创建灼烧Debuff
    const burn = createDebuff(DebuffType.BURN, 1, 3);
    expect(burn.name).toBe('灼烧');

    // 测试创建减速Debuff
    const slow = createDebuff(DebuffType.SLOW, 1, 2);
    expect(slow.name).toBe('减速');

    // 测试创建潮湿Debuff
    const wet = createDebuff(DebuffType.WET, 1, 3);
    expect(wet.name).toBe('潮湿');
  });
});

describe('属性克制表验证', () => {
  it('冰属性克制关系正确', async () => {
    const { ElementType, TYPE_CHART } = await import('../../types');
    
    // 冰克制草和龙
    expect(TYPE_CHART[ElementType.ICE][ElementType.GRASS]).toBe(2);
    expect(TYPE_CHART[ElementType.ICE][ElementType.DRAGON]).toBe(2);
    
    // 冰被火克制
    expect(TYPE_CHART[ElementType.ICE][ElementType.FIRE]).toBe(0.5);
  });

  it('火属性克制关系正确', async () => {
    const { ElementType, TYPE_CHART } = await import('../../types');
    
    // 火克制草和冰
    expect(TYPE_CHART[ElementType.FIRE][ElementType.GRASS]).toBe(2);
    expect(TYPE_CHART[ElementType.FIRE][ElementType.ICE]).toBe(2);
    
    // 火被水和岩石克制
    expect(TYPE_CHART[ElementType.FIRE][ElementType.WATER]).toBe(0.5);
    expect(TYPE_CHART[ElementType.FIRE][ElementType.ROCK]).toBe(0.5);
  });

  it('水属性克制关系正确', async () => {
    const { ElementType, TYPE_CHART } = await import('../../types');
    
    // 水克制火和岩石
    expect(TYPE_CHART[ElementType.WATER][ElementType.FIRE]).toBe(2);
    expect(TYPE_CHART[ElementType.WATER][ElementType.ROCK]).toBe(2);
    
    // 水被草和电克制
    expect(TYPE_CHART[ElementType.WATER][ElementType.GRASS]).toBe(0.5);
    expect(TYPE_CHART[ElementType.WATER][ElementType.ELECTRIC]).toBe(0.5);
  });

  it('电属性克制关系正确', async () => {
    const { ElementType, TYPE_CHART } = await import('../../types');
    
    // 电克制水
    expect(TYPE_CHART[ElementType.ELECTRIC][ElementType.WATER]).toBe(2);
    
    // 电被草克制
    expect(TYPE_CHART[ElementType.ELECTRIC][ElementType.GRASS]).toBe(0.5);
  });
});
