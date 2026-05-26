/**
 * 测试工具模块
 * 提供技能测试和效果测试的辅助函数
 */

import { Skill } from '../Skill';
import { SkillDefinition } from '../Skill';
import {
  Buff,
  Debuff,
  BuffType,
  DebuffType
} from '../../effects';

/**
 * 技能测试工具类
 */
export class SkillTestHelper {
  /**
   * 验证技能基础属性
   */
  static validateSkillBase(
    skill: Skill,
    expectedId: string,
    expectedName: string,
    expectedEnergy: number
  ) {
    expect(skill.id).toBe(expectedId);
    expect(skill.name).toBe(expectedName);
    expect(skill.energyCost).toBe(expectedEnergy);
  }

  /**
   * 验证技能定义完整性
   */
  static validateSkillDefinition(skill: Skill, definition: Partial<SkillDefinition>) {
    const def = skill.definition;
    
    if (definition.id !== undefined) {
      expect(def.id).toBe(definition.id);
    }
    if (definition.name !== undefined) {
      expect(def.name).toBe(definition.name);
    }
    if (definition.energyCost !== undefined) {
      expect(def.energyCost).toBe(definition.energyCost);
    }
    if (definition.target !== undefined) {
      expect(def.target).toBe(definition.target);
    }
    if (definition.tendency !== undefined) {
      expect(def.tendency).toBe(definition.tendency);
    }
  }

  /**
   * 验证技能有伤害效果
   */
  static validateDamageEffect(skill: Skill, expectedPower: number, element?: string) {
    const effects = skill.definition.effects;
    const damageEffect = effects.find(e => e.damage);
    expect(damageEffect).toBeDefined();
    expect(damageEffect!.damage!.basePower).toBe(expectedPower);
    if (element) {
      expect(damageEffect!.damage!.element).toBe(element);
    }
  }

  /**
   * 验证技能有护盾效果
   */
  static validateShieldEffect(skill: Skill, expectedAmount: number) {
    const effects = skill.definition.effects;
    const shieldEffect = effects.find(e => e.shield);
    expect(shieldEffect).toBeDefined();
    expect(shieldEffect!.shield!.amount).toBe(expectedAmount);
  }

  /**
   * 验证技能有Buff效果
   */
  static validateBuffEffect(skill: Skill, expectedBuffType: string) {
    const effects = skill.definition.effects;
    const buffEffect = effects.find(e => e.applyBuff);
    expect(buffEffect).toBeDefined();
    expect(buffEffect!.applyBuff!.buffType).toBe(expectedBuffType);
  }

  /**
   * 验证技能有Debuff效果
   */
  static validateDebuffEffect(skill: Skill, expectedDebuffType: string) {
    const effects = skill.definition.effects;
    const debuffEffect = effects.find(e => e.applyDebuff);
    expect(debuffEffect).toBeDefined();
    expect(debuffEffect!.applyDebuff!.debuffType).toBe(expectedDebuffType);
  }

  /**
   * 验证技能有治疗效果
   */
  static validateHealingEffect(skill: Skill) {
    const effects = skill.definition.effects;
    const healEffect = effects.find(e => e.healing);
    expect(healEffect).toBeDefined();
    expect(healEffect!.healing!.percent).toBeDefined();
  }

  /**
   * 验证技能是蓄力技能
   */
  static validateChargeSkill(skill: Skill, expectedTurns: number, canBeInterrupted: boolean) {
    expect(skill.definition.chargeTurns).toBe(expectedTurns);
    expect(skill.definition.canBeInterrupted).toBe(canBeInterrupted);
  }

  /**
   * 验证技能标签
   */
  static validateTags(skill: Skill, expectedTags: string[]) {
    const tags = skill.definition.tags || [];
    expectedTags.forEach(tag => {
      expect(tags).toContain(tag);
    });
  }
}

/**
 * Buff测试工具类
 */
export class BuffTestHelper {
  /**
   * 创建模拟CombatUnit
   */
  static createMockUnit(maxHp: number = 100): any {
    return {
      maxHp,
      currentHp: maxHp,
      heal: (amount: number) => {
        const oldHp = mockUnit.currentHp;
        mockUnit.currentHp = Math.min(maxHp, mockUnit.currentHp + amount);
        return mockUnit.currentHp - oldHp;
      },
      takeDamage: (amount: number) => {
        const actual = Math.min(mockUnit.currentHp, amount);
        mockUnit.currentHp -= actual;
        return actual;
      }
    };
    const mockUnit = BuffTestHelper.createMockUnit(maxHp);
    return mockUnit;
  }

  /**
   * 验证Buff基础属性
   */
  static validateBuffBase(buff: Buff, expectedName: string, expectedType: BuffType) {
    expect(buff.name).toBe(expectedName);
    expect(buff.type).toBe(expectedType);
  }

  /**
   * 验证Buff持续时间
   */
  static validateDuration(buff: Buff, expectedDuration: number) {
    expect(buff.duration).toBe(expectedDuration);
    expect(buff.remainingDuration).toBe(expectedDuration);
  }

  /**
   * 验证Buff过期
   */
  static validateExpiry(buff: Buff) {
    buff.remainingDuration = 0;
    expect(buff.isExpired()).toBe(true);
  }
}

/**
 * Debuff测试工具类
 */
export class DebuffTestHelper {
  /**
   * 创建模拟CombatUnit
   */
  static createMockUnit(maxHp: number = 100): any {
    return {
      maxHp,
      currentHp: maxHp,
      takeDamage: (amount: number) => {
        const actual = Math.min(this.currentHp, amount);
        this.currentHp -= actual;
        return actual;
      }
    };
  }

  /**
   * 验证Debuff基础属性
   */
  static validateDebuffBase(debuff: Debuff, expectedName: string, expectedType: DebuffType) {
    expect(debuff.name).toBe(expectedName);
    expect(debuff.type).toBe(expectedType);
  }

  /**
   * 验证DOT伤害
   */
  static validateDotDamage(debuff: Debuff, unit: any, expectedDamage: number) {
    const initialHp = unit.currentHp;
    debuff.onTurnStart(unit);
    expect(unit.currentHp).toBe(initialHp - expectedDamage);
  }

  /**
   * 验证层数衰减
   */
  static validateStackDecay(debuff: Debuff) {
    const initialStacks = debuff.stacks;
    debuff.onTurnStart(debuff);
    // DOT类Debuff应该在回合开始时减少层数
    if (debuff.stacks !== undefined) {
      expect(debuff.stacks).toBeLessThan(initialStacks);
    }
  }
}

/**
 * 断言辅助函数
 */
export const assert = {
  /**
   * 断言数值在范围内
   */
  inRange: (value: number, min: number, max: number, message?: string) => {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  },

  /**
   * 断言数组包含所有元素
   */
  containsAll: <T>(array: T[], elements: T[], message?: string) => {
    elements.forEach(el => {
      expect(array).toContain(el);
    });
  },

  /**
   * 断言技能效果存在
   */
  hasEffect: (skill: Skill, effectType: string) => {
    const effects = skill.definition.effects;
    return effects.some(e => 
      e.damage !== undefined || 
      e.healing !== undefined || 
      e.shield !== undefined || 
      e.applyBuff !== undefined ||
      e.applyDebuff !== undefined ||
      e.statBoost !== undefined ||
      e.special !== undefined
    );
  }
};
