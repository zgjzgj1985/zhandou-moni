/**
 * 龙属性·血脉压制流技能测试
 * 测试龙属性血脉压制流 v2.0 (12个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 龙属性技能
  DRAGON_BLOOD_SKILLS,
  DRAGON_BLOOD_AWAKENING,
  DRAGON_SCALE_SHOT,
  DRAGON_RESONANCE_PASSIVE,
  DRAGON_PULSE_V2,
  DRAGON_OBLIVION,
  METEOR_FALL,
  DRAGON_CRUSH,
  DRAGON_BREATH_BURN,
  DRAGON_EXPEL,
  DRAGON_INTIMIDATE,
  DRAGON_SCALES_SHIELD_V2,
  DRAGON_RESONANCE_ULTIMATE
} from '../dragon-v2';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('龙属性·血脉压制流技能测试', () => {
  describe('血脉成长技能 (3个)', () => {
    it('血脉觉醒 (DRAGON_BLOOD_AWAKENING) - 获得龙之气息', () => {
      const skill = DRAGON_BLOOD_AWAKENING;
      expect(skill.id).toBe('dragon_blood_awakening');
      expect(skill.name).toBe('血脉觉醒');
      expect(skill.definition.target).toBe(SkillTarget.SELF);
      expect(skill.definition.tendency).toBe(SkillTendency.SUPPORT);
      expect(skill.definition.effects[0].special?.type).toBe('dragon_blood_awakening');
    });

    it('龙鳞连击 (DRAGON_SCALE_SHOT) - 多段攻击', () => {
      const skill = DRAGON_SCALE_SHOT;
      expect(skill.id).toBe('dragon_scale_shot');
      expect(skill.name).toBe('龙鳞连击');
      expect(skill.definition.target).toBe(SkillTarget.SINGLE);
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.hits).toBe(3);
      expect(skill.definition.effects[0].damage?.basePower).toBe(20);
    });

    it('龙属共鸣被动 (DRAGON_RESONANCE_PASSIVE) - 被动技能', () => {
      const skill = DRAGON_RESONANCE_PASSIVE;
      expect(skill.id).toBe('dragon_resonance_passive');
      expect(skill.name).toBe('龙属共鸣');
      expect(skill.definition.type).toBe('trait');
      expect(skill.definition.effects[0].special?.type).toBe('dragon_resonance_passive');
    });
  });

  describe('高威力攻击技能 (4个)', () => {
    it('龙之波动 (DRAGON_PULSE_V2) - 稳定高伤害', () => {
      const skill = DRAGON_PULSE_V2;
      expect(skill.id).toBe('dragon_pulse_v2');
      expect(skill.name).toBe('龙之波动');
      expect(skill.definition.target).toBe(SkillTarget.SINGLE);
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(80);
      expect(skill.definition.effects[0].damage?.element).toBe(ElementType.DRAGON);
    });

    it('龙之终焉 (DRAGON_OBLIVION) - 高威力+混乱', () => {
      const skill = DRAGON_OBLIVION;
      expect(skill.id).toBe('dragon_oblivion');
      expect(skill.name).toBe('龙之终焉');
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(100);
      expect(skill.definition.effects[0].special?.type).toBe('dragon_oblivion');
    });

    it('流星陨落 (METEOR_FALL) - 究极技能', () => {
      const skill = METEOR_FALL;
      expect(skill.id).toBe('meteor_fall');
      expect(skill.name).toBe('流星陨落');
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(150);
      expect(skill.definition.effects[0].selfDebuff?.debuffType).toBe('dragon_power_loss');
    });

    it('龙之碾压 (DRAGON_CRUSH) - 低HP增伤', () => {
      const skill = DRAGON_CRUSH;
      expect(skill.id).toBe('dragon_crush');
      expect(skill.name).toBe('龙之碾压');
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(60);
    });
  });

  describe('AOE与控制技能 (3个)', () => {
    it('龙息灼烧 (DRAGON_BREATH_BURN) - AOE+灼烧', () => {
      const skill = DRAGON_BREATH_BURN;
      expect(skill.id).toBe('dragon_breath_burn');
      expect(skill.name).toBe('龙息灼烧');
      expect(skill.definition.target).toBe(SkillTarget.ENEMY_ALL);
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(50);
    });

    it('龙之驱逐 (DRAGON_EXPEL) - 强制换人', () => {
      const skill = DRAGON_EXPEL;
      expect(skill.id).toBe('dragon_expel');
      expect(skill.name).toBe('龙之驱逐');
      expect(skill.definition.target).toBe(SkillTarget.SINGLE);
      expect(skill.definition.tendency).toBe(SkillTendency.ATTACK);
      expect(skill.definition.effects[0].damage?.basePower).toBe(80);
    });

    it('龙威震慑 (DRAGON_INTIMIDATE) - 群体弱化', () => {
      const skill = DRAGON_INTIMIDATE;
      expect(skill.id).toBe('dragon_intimidate');
      expect(skill.name).toBe('龙威震慑');
      expect(skill.definition.target).toBe(SkillTarget.ENEMY_ALL);
      expect(skill.definition.tendency).toBe(SkillTendency.SUPPORT);
    });
  });

  describe('防御与共鸣技能 (2个)', () => {
    it('龙鳞守护 (DRAGON_SCALES_SHIELD_V2) - 减伤+护盾', () => {
      const skill = DRAGON_SCALES_SHIELD_V2;
      expect(skill.id).toBe('dragon_scales_shield_v2');
      expect(skill.name).toBe('龙鳞守护');
      expect(skill.definition.target).toBe(SkillTarget.SELF);
      expect(skill.definition.tendency).toBe(SkillTendency.DEFENSE);
      expect(skill.definition.effects[0].applyBuff?.buffType).toBe('dragon_guard');
    });

    it('龙属共鸣·极 (DRAGON_RESONANCE_ULTIMATE) - 终极技', () => {
      const skill = DRAGON_RESONANCE_ULTIMATE;
      expect(skill.id).toBe('dragon_resonance_ultimate');
      expect(skill.name).toBe('龙属共鸣·极');
      expect(skill.definition.tendency).toBe(SkillTendency.SUPPORT);
      expect(skill.definition.effects[0].special?.type).toBe('dragon_resonance_ultimate');
    });
  });

  describe('DRAGON_BLOOD_SKILLS 技能库', () => {
    it('包含所有12个技能', () => {
      expect(DRAGON_BLOOD_SKILLS.ALL).toHaveLength(12);
    });

    it('按分类正确分组', () => {
      expect(DRAGON_BLOOD_SKILLS.GROWTH).toBeDefined();
      expect(DRAGON_BLOOD_SKILLS.ATTACK).toBeDefined();
      expect(DRAGON_BLOOD_SKILLS.CONTROL).toBeDefined();
      expect(DRAGON_BLOOD_SKILLS.DEFENSE).toBeDefined();
    });

    it('血脉成长技能数量正确', () => {
      expect(Object.keys(DRAGON_BLOOD_SKILLS.GROWTH)).toHaveLength(3);
    });

    it('高威力攻击技能数量正确', () => {
      expect(Object.keys(DRAGON_BLOOD_SKILLS.ATTACK)).toHaveLength(4);
    });

    it('AOE与控制技能数量正确', () => {
      expect(Object.keys(DRAGON_BLOOD_SKILLS.CONTROL)).toHaveLength(3);
    });

    it('防御与共鸣技能数量正确', () => {
      expect(Object.keys(DRAGON_BLOOD_SKILLS.DEFENSE)).toHaveLength(2);
    });
  });
});

describe('龙之气息系统逻辑测试', () => {
  // 创建一个简化的龙属性测试单位（模拟CombatUnit）
  const createTestDragon = () => {
    return {
      name: '测试龙',
      maxHp: 1000,
      elements: [ElementType.DRAGON],
      dragonBloodStacks: 0,
      getDragonBloodStacks() { return this.dragonBloodStacks; },
      addDragonBlood(stacks: number) {
        const oldStacks = this.dragonBloodStacks;
        this.dragonBloodStacks = Math.min(this.dragonBloodStacks + stacks, 15);
        return this.dragonBloodStacks - oldStacks;
      },
      consumeDragonBlood(stacks: number) {
        const consumed = Math.min(this.dragonBloodStacks, stacks);
        this.dragonBloodStacks -= consumed;
        return consumed;
      },
      consumeAllDragonBlood() {
        const consumed = this.dragonBloodStacks;
        this.dragonBloodStacks = 0;
        return consumed;
      },
      getDragonBloodBonus() {
        return {
          damage: this.dragonBloodStacks * 15,
          shield: this.dragonBloodStacks * 10,
          damageReduction: Math.min(this.dragonBloodStacks * 0.10, 0.75)
        };
      },
      countDragonAllies(allies) {
        return allies.filter(ally =>
          ally.elements && ally.elements.includes(ElementType.DRAGON) &&
          ally !== this
        ).length;
      }
    };
  };

  it('龙属性单位自动获得龙之气息', () => {
    const unit = createTestDragon();
    expect(unit.getDragonBloodStacks()).toBe(0);

    unit.addDragonBlood(1);
    expect(unit.getDragonBloodStacks()).toBe(1);

    unit.addDragonBlood(5);
    expect(unit.getDragonBloodStacks()).toBe(6);

    unit.addDragonBlood(20);
    expect(unit.getDragonBloodStacks()).toBe(15);  // 上限15层
  });

  it('龙之气息提供伤害加成', () => {
    const unit = createTestDragon();
    unit.addDragonBlood(10);
    const bonus = unit.getDragonBloodBonus();

    expect(bonus.damage).toBe(150);    // 10层 * 15威力
    expect(bonus.shield).toBe(100);    // 10层 * 10护盾
    expect(bonus.damageReduction).toBe(0.75); // 上限75%
  });

  it('消耗龙之气息', () => {
    const unit = createTestDragon();
    unit.addDragonBlood(10);
    
    const consumed = unit.consumeDragonBlood(3);
    expect(consumed).toBe(3);
    expect(unit.getDragonBloodStacks()).toBe(7);

    const allConsumed = unit.consumeAllDragonBlood();
    expect(allConsumed).toBe(7);
    expect(unit.getDragonBloodStacks()).toBe(0);
  });

  it('龙属性队友计数', () => {
    const dragon1 = createTestDragon();
    dragon1.name = '龙1';

    const dragon2 = createTestDragon();
    dragon2.name = '龙2';

    const nonDragon = {
      name: '非龙',
      elements: [ElementType.FIRE]
    };

    const allies = [dragon1, dragon2, nonDragon];

    expect(dragon1.countDragonAllies(allies)).toBe(1);
    expect(dragon2.countDragonAllies(allies)).toBe(1);
  });

  it('层数上限15层', () => {
    const unit = createTestDragon();
    unit.addDragonBlood(20);
    expect(unit.getDragonBloodStacks()).toBe(15);
  });
});
