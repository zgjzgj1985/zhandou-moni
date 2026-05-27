/**
 * 地/超能属性技能测试
 * 测试地属性天气流 (11个) 和 超能属性奥秘流 (13个) 的技能定义
 */

import { describe, it, expect } from 'vitest';
import {
  // 地属性技能
  GROUND_WEATHER_SKILLS,
  MAGNITUDE,
  EARTH_POWER,
  EARTHQUAKE,
  DRILL_RUN,
  BONE_RUSH,
  SANDSTORM,
  DIG,
  SAND_TOMB,
  MUD_SPORT,
  SAND_ATTACK,
  CULTIVATE
} from '../ground';
import {
  // 超能属性技能 v2.0
  PSYCHIC_MYSTIC_SKILLS,
  MIND_PIERCE,
  PSYCHIC_HIT,
  STORED_POWER,
  VOID_PROPECY,
  FUTURE_SIGHT,
  MIND_SHIELD_SKILL,
  MIRROR_REFLECT,
  MIST_BODY,
  PSYCHIC_TERRAIN,
  PSYCHO_SHIFT,
  PSYCHIC_NOISE_SKILL,
  HEAL_PULSE,
  MIND_SYNC,
  FATE_WEAVE
} from '../psychic';
import { SkillTestHelper } from './helpers';
import { SkillTarget, SkillTendency, ElementType } from '../../types';

describe('地属性·天气流技能测试', () => {
  describe('攻击倾向技能 (6个)', () => {
    it('震级 (MAGNITUDE) - 随机威力', () => {
      SkillTestHelper.validateSkillBase(MAGNITUDE, 'magnitude', '震级', 1);
      expect(MAGNITUDE.definition.target).toBe(SkillTarget.ENEMY_ALL);
      expect(MAGNITUDE.definition.element).toBe(ElementType.GROUND);
    });

    it('大地之力 (EARTH_POWER) - 高威力+特攻提升', () => {
      SkillTestHelper.validateSkillBase(EARTH_POWER, 'earth_power', '大地之力', 3);
      SkillTestHelper.validateDamageEffect(EARTH_POWER, 90, ElementType.GROUND);
      expect(EARTH_POWER.definition.effects[1]?.selfStatBoost?.stat).toBe('specialAttack');
    });

    it('地震 (EARTHQUAKE) - 全体攻击', () => {
      SkillTestHelper.validateSkillBase(EARTHQUAKE, 'earthquake', '地震', 4);
      expect(EARTHQUAKE.definition.target).toBe(SkillTarget.ENEMY_ALL);
      SkillTestHelper.validateDamageEffect(EARTHQUAKE, 85, ElementType.GROUND);
    });

    it('直冲钻 (DRILL_RUN) - 必定命中', () => {
      SkillTestHelper.validateSkillBase(DRILL_RUN, 'drill_run', '直冲钻', 3);
      SkillTestHelper.validateDamageEffect(DRILL_RUN, 80, ElementType.GROUND);
    });

    it('骨棒乱打 (BONE_RUSH) - 两段攻击', () => {
      SkillTestHelper.validateSkillBase(BONE_RUSH, 'bone_rush', '骨棒乱打', 2);
      expect(BONE_RUSH.definition.target).toBe(SkillTarget.SINGLE);
      expect(BONE_RUSH.definition.effects[0]?.damage?.hits).toBe(2);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('沙暴降临 (SANDSTORM) - 召唤天气', () => {
      SkillTestHelper.validateSkillBase(SANDSTORM, 'sandstorm', '沙暴降临', 3);
      expect(SANDSTORM.definition.target).toBe(SkillTarget.SELF);
      expect(SANDSTORM.definition.effects[0]?.applyWeather?.weather).toBe('sandstorm');
    });

    it('挖洞 (DIG) - 地下状态+先手', () => {
      SkillTestHelper.validateSkillBase(DIG, 'dig', '挖洞', 2);
      expect(DIG.definition.target).toBe(SkillTarget.SELF);
      expect(DIG.definition.effects[0]?.applyBuff?.buffType).toBe('underground');
    });

    it('流沙地狱 (SAND_TOMB) - 减速+持续伤害', () => {
      SkillTestHelper.validateSkillBase(SAND_TOMB, 'sand_tomb', '流沙地狱', 3);
      expect(SAND_TOMB.definition.target).toBe(SkillTarget.SINGLE);
      expect(SAND_TOMB.definition.effects[0]?.applyDebuff?.debuffType).toBe('sand_tomb_debuff');
    });
  });

  describe('辅助倾向技能 (3个)', () => {
    it('玩泥巴 (MUD_SPORT) - 全属性提升', () => {
      SkillTestHelper.validateSkillBase(MUD_SPORT, 'mud_sport', '玩泥巴', 2);
      expect(MUD_SPORT.definition.target).toBe(SkillTarget.SELF);
    });

    it('泼沙 (SAND_ATTACK) - 降命中', () => {
      SkillTestHelper.validateSkillBase(SAND_ATTACK, 'sand_attack', '泼沙', 1);
      expect(SAND_ATTACK.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('耕地 (CULTIVATE) - 群体治疗+清异常', () => {
      SkillTestHelper.validateSkillBase(CULTIVATE, 'cultivate', '耕地', 3);
      expect(CULTIVATE.definition.target).toBe(SkillTarget.ALLY_ALL);
    });
  });

  describe('GROUND_WEATHER_SKILLS 技能库', () => {
    it('包含所有11个技能', () => {
      expect(Object.keys(GROUND_WEATHER_SKILLS.ALL)).toHaveLength(11);
    });

    it('按倾向分类正确', () => {
      expect(GROUND_WEATHER_SKILLS.ATTACK).toBeDefined();
      expect(GROUND_WEATHER_SKILLS.DEFENSE).toBeDefined();
      expect(GROUND_WEATHER_SKILLS.SUPPORT).toBeDefined();
    });

    it('攻击技能5个', () => {
      expect(Object.keys(GROUND_WEATHER_SKILLS.ATTACK)).toHaveLength(5);
    });

    it('防御技能3个', () => {
      expect(Object.keys(GROUND_WEATHER_SKILLS.DEFENSE)).toHaveLength(3);
    });

    it('辅助技能3个', () => {
      expect(Object.keys(GROUND_WEATHER_SKILLS.SUPPORT)).toHaveLength(3);
    });
  });
});

describe('超能属性·奥秘流技能测试 v2.0', () => {
  describe('攻击倾向技能 (5个)', () => {
    it('迷心刺 (MIND_PIERCE) - 60威力+预言标记', () => {
      SkillTestHelper.validateSkillBase(MIND_PIERCE, 'mind_pierce', '迷心刺', 2);
      SkillTestHelper.validateDamageEffect(MIND_PIERCE, 60, ElementType.PSYCHIC);
    });

    it('精神冲击 (PSYCHIC_HIT) - 80威力+无视护盾', () => {
      SkillTestHelper.validateSkillBase(PSYCHIC_HIT, 'psychic_hit', '精神冲击', 3);
      SkillTestHelper.validateDamageEffect(PSYCHIC_HIT, 80, ElementType.PSYCHIC);
    });

    it('存储力量 (STORED_POWER) - 累积威力技能', () => {
      SkillTestHelper.validateSkillBase(STORED_POWER, 'stored_power', '存储力量', 3);
      SkillTestHelper.validateDamageEffect(STORED_POWER, 20, ElementType.PSYCHIC);
    });

    it('虚空预言 (VOID_PROPECY) - 蓄力+终极', () => {
      SkillTestHelper.validateSkillBase(VOID_PROPECY, 'void_prophecy', '虚空预言', 5);
      SkillTestHelper.validateChargeSkill(VOID_PROPECY, 1, true);
      SkillTestHelper.validateDamageEffect(VOID_PROPECY, 140, ElementType.PSYCHIC);
    });

    it('预知未来 (FUTURE_SIGHT) - 延迟触发', () => {
      SkillTestHelper.validateSkillBase(FUTURE_SIGHT, 'future_sight', '预知未来', 5);
      SkillTestHelper.validateDamageEffect(FUTURE_SIGHT, 120, ElementType.PSYCHIC);
    });
  });

  describe('防御倾向技能 (3个)', () => {
    it('心智护盾 (MIND_SHIELD_SKILL) - 50%减伤+精神免疫', () => {
      SkillTestHelper.validateSkillBase(MIND_SHIELD_SKILL, 'mind_shield_skill', '心智护盾', 2);
      expect(MIND_SHIELD_SKILL.definition.target).toBe(SkillTarget.SELF);
    });

    it('灵镜反照 (MIRROR_REFLECT) - 反射1.8倍', () => {
      SkillTestHelper.validateSkillBase(MIRROR_REFLECT, 'mirror_reflect', '灵镜反照', 3);
      expect(MIRROR_REFLECT.definition.target).toBe(SkillTarget.SELF);
    });

    it('迷雾之躯 (MIST_BODY) - 70%闪避', () => {
      SkillTestHelper.validateSkillBase(MIST_BODY, 'mist_body', '迷雾之躯', 2);
      expect(MIST_BODY.definition.target).toBe(SkillTarget.SELF);
    });
  });

  describe('辅助倾向技能 (6个)', () => {
    it('精神场地 (PSYCHIC_TERRAIN) - 环境增益', () => {
      SkillTestHelper.validateSkillBase(PSYCHIC_TERRAIN, 'psychic_terrain', '精神场地', 8);
      expect(PSYCHIC_TERRAIN.definition.target).toBe(SkillTarget.ALLY_ALL);
    });

    it('精神转移 (PSYCHO_SHIFT) - 状态转移', () => {
      SkillTestHelper.validateSkillBase(PSYCHO_SHIFT, 'psycho_shift', '精神转移', 2);
      expect(PSYCHO_SHIFT.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('精神噪音 (PSYCHIC_NOISE_SKILL) - 禁止恢复', () => {
      SkillTestHelper.validateSkillBase(PSYCHIC_NOISE_SKILL, 'psychic_noise_skill', '精神噪音', 3);
      expect(PSYCHIC_NOISE_SKILL.definition.target).toBe(SkillTarget.SINGLE);
    });

    it('治愈波动 (HEAL_PULSE) - 治疗50%HP', () => {
      SkillTestHelper.validateSkillBase(HEAL_PULSE, 'heal_pulse', '治愈波动', 3);
      expect(HEAL_PULSE.definition.target).toBe(SkillTarget.ALLY);
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

  describe('PSYCHIC_MYSTIC_SKILLS 技能库 v2.0', () => {
    it('包含所有13个技能', () => {
      expect(PSYCHIC_MYSTIC_SKILLS.ALL).toHaveLength(13);
    });

    it('按倾向分类正确', () => {
      expect(PSYCHIC_MYSTIC_SKILLS.ATTACK).toBeDefined();
      expect(PSYCHIC_MYSTIC_SKILLS.DEFENSE).toBeDefined();
      expect(PSYCHIC_MYSTIC_SKILLS.SUPPORT).toBeDefined();
    });

    it('攻击技能5个', () => {
      expect(Object.keys(PSYCHIC_MYSTIC_SKILLS.ATTACK)).toHaveLength(5);
    });

    it('防御技能3个', () => {
      expect(Object.keys(PSYCHIC_MYSTIC_SKILLS.DEFENSE)).toHaveLength(3);
    });

    it('辅助技能6个', () => {
      expect(Object.keys(PSYCHIC_MYSTIC_SKILLS.SUPPORT)).toHaveLength(6);
    });
  });
});
