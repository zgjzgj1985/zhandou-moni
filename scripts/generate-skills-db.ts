/**
 * generate-skills-db.ts
 *
 * 将 src/skills/ TypeScript 模块转换为旧版 skills-data.js 格式，
 * 输出到 skills-db.js，兼容 js/03-skill-effects.js 的 convertSkillToBattleFormat()。
 *
 * 执行方式: npx tsx scripts/generate-skills-db.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 动态导入 TypeScript 模块需要 tsx
import {
  EMBER, FLAME_PUNCH, FLAME_IMPACT, FLARE_BLITZ, OVERHEAT, EXPLOSION_FLAME,
  FIRE_SHIELD_SKILL, WALL_OF_FLAMES,
  FLAME_CHARGE_SKILL, COMBUSTION, BLAZE_WILL,
  FIRE_BURST_SKILLS
} from '../src/skills/fire';

import {
  WATER_JET, HYDRO_PUMP, WATER_BULLET, ABYSS_VORTEX, SCALD, MUDDY_WATER, SURGE,
  AQUA_SHIELD, CLEAR_SPRING,
  HEALING_WAVE, AQUA_THERAPY, RAINY_DAY,
  WATER_CONTROL_SKILLS
} from '../src/skills/water';

import {
  FIBER_WEAVE, LEAF_BEAM, BLOOM_DANCE, RADIANT_BURST, SPLENDOR, SOLAR_DETONATION,
  ROOT_BOUND, VINE_ARMOR, GRASS_COUNTER_STANCE,
  FRAGRANT_BLOOM, LIGHT_GATHER, PARASITIC_SEED, NUTRIENT_ABSORPTION,
  GRASS_AURA_SKILLS
} from '../src/skills/grass';

import {
  ZAP_STRIKE, THUNDER_STRIKE, ELECTROMAGNETIC_PULSE,
  STATIC_CHARGE, ELECTRIC_DEFLECT_SKILL,
  CHARGE_ACCELERATE, ELECTRIC_FIELD_SKILL, STATIC_MARK,
  ELECTRIC_PULSE_SKILLS
} from '../src/skills/electric-v2';

import {
  ICE_SHOT, FROST_BREATH, ICICLE_SPEAR, ICE_HAMMER, ICE_EXPLOSION,
  FROST_ARMOR, ICE_WALL,
  COLD_AURA, FROST_MARK, FROZEN_LAND,
  ICE_SHARD_SKILLS
} from '../src/skills/ice';

import {
  MIND_PIERCE, PSYCHIC_HIT, STORED_POWER, VOID_PROPECY, FUTURE_SIGHT,
  MIND_SHIELD_SKILL, MIRROR_REFLECT, MIST_BODY,
  PSYCHIC_TERRAIN, PSYCHO_SHIFT, PSYCHIC_NOISE_SKILL, HEAL_PULSE, MIND_SYNC, FATE_WEAVE,
  PSYCHIC_MYSTIC_SKILLS
} from '../src/skills/psychic';

import {
  MAGNITUDE, EARTH_POWER, EARTHQUAKE, DRILL_RUN, BONE_RUSH,
  SANDSTORM, DIG, SAND_TOMB,
  MUD_SPORT, SAND_ATTACK, CULTIVATE,
  GROUND_WEATHER_SKILLS
} from '../src/skills/ground';

import {
  DRAGON_BLOOD_AWAKENING, DRAGON_SCALE_SHOT, DRAGON_RESONANCE_PASSIVE,
  DRAGON_PULSE_V2, DRAGON_OBLIVION, METEOR_FALL, DRAGON_CRUSH,
  DRAGON_BREATH_BURN, DRAGON_EXPEL, DRAGON_INTIMIDATE,
  DRAGON_SCALES_SHIELD_V2, DRAGON_RESONANCE_ULTIMATE,
  DRAGON_BLOOD_SKILLS
} from '../src/skills/dragon-v2';

import { Skill, SkillDefinition } from '../src/skills/Skill';
import { SkillTarget, DamageType, ElementType, SkillTendency, BuffType } from '../src/types';

// ==================== 类型映射 ====================

/** SkillTarget enum → 旧版 t 字段中文值 */
const TARGET_MAP: Record<string, string> = {
  [SkillTarget.SINGLE]: '单体敌人',
  [SkillTarget.ALLY]: '己方单体',
  [SkillTarget.ALLY_ALL]: '己方全体',
  [SkillTarget.ENEMY_ALL]: '全体敌人',
  [SkillTarget.SELF]: '自身',
};

/** SkillTendency → 旧版技能分类 */
const TENDENCY_MAP: Record<string, 'attack' | 'defense' | 'support'> = {
  [SkillTendency.ATTACK]: 'attack',
  [SkillTendency.DEFENSE]: 'defense',
  [SkillTendency.SUPPORT]: 'support',
};

/** DamageType → 旧版 damageType */
const DAMAGE_TYPE_MAP: Record<string, string> = {
  [DamageType.PHYSICAL]: 'physical',
  [DamageType.SPECIAL]: 'special',
  [DamageType.MIXED]: 'special',
  [DamageType.TRUE]: 'special',
};

// ==================== 转换函数 ====================

interface OldEffect {
  type: string;
  [key: string]: unknown;
}

interface OldSkill {
  id: string;
  name: string;
  e: number;
  t: string;
  p: number | string;
  damageType: string;
  eff: string;
  effects: OldEffect[];
  tags: string[];
  cooldown?: number;
}

/**
 * 将单个 SkillDefinition 转换为旧格式对象
 */
function convertSkill(skill: Skill, element: string): OldSkill {
  const def = skill.definition;

  // --- 威力 ---
  let p: number | string = 0;
  let comboHits: number | undefined;
  let comboPower: number | undefined;

  const damageEffect = def.effects.find(e => e.damage);
  if (damageEffect?.damage) {
    const d = damageEffect.damage;
    if (d.hits && d.hits > 1) {
      // 多段攻击 → '25×3'
      comboPower = d.basePower;
      comboHits = d.hits;
      p = `${comboPower}×${comboHits}`;
    } else {
      p = d.basePower;
    }
  }

  // --- 能量消耗 e ---
  const e = def.energyCost;

  // --- 目标 t ---
  const t = TARGET_MAP[def.target] ?? '单体敌人';

  // --- 伤害类型 ---
  const damageType = damageEffect?.damage
    ? (DAMAGE_TYPE_MAP[damageEffect.damage.damageType] ?? 'special')
    : 'special';

  // --- 效果 effects[] ---
  const effects: OldEffect[] = [];

  if (damageEffect?.damage) {
    const d = damageEffect.damage;
    if (d.hits && d.hits > 1) {
      effects.push({ type: 'multi_hit', hits: d.hits, damage: d.basePower });
    } else {
      effects.push({ type: 'damage' });
    }
  }

  for (const effect of def.effects) {
    if (effect.applyDebuff) {
      const debuff = effect.applyDebuff;
      const statusId = debuff.debuffType as string;
      if (statusId === 'burn' || statusId === 'steam_burn' || statusId === 'dragon_burn') {
        effects.push({
          type: 'add_status',
          statusId: statusId === 'steam_burn' ? 'steam_burn' : statusId === 'dragon_burn' ? 'burn' : 'burn',
          stacks: debuff.stacks ?? 1,
          successRate: debuff.successRate ?? 1.0,
        });
      } else if (statusId === 'slow') {
        effects.push({ type: 'debuff', statusId: 'slow', stages: debuff.stages ?? 1 });
      } else if (statusId === 'frost') {
        effects.push({ type: 'add_status', statusId: 'frost', stacks: debuff.stacks ?? 1 });
      } else if (statusId === 'frost_mark') {
        effects.push({ type: 'add_status', statusId: 'frost_mark', stacks: debuff.stacks ?? 1 });
      } else if (statusId === 'sand_tomb_debuff') {
        effects.push({ type: 'add_status', statusId: 'sand_tomb', stacks: debuff.stacks ?? 1 });
      } else if (statusId === 'extreme_cold_mark') {
        effects.push({ type: 'add_status', statusId: 'extreme_cold_mark', stacks: debuff.stacks ?? 1 });
      } else if (statusId === 'burn_mark') {
        effects.push({ type: 'add_status', statusId: 'burn_mark' });
      } else if (statusId === 'drowning_status') {
        effects.push({ type: 'add_status', statusId: 'drowning', stacks: 1 });
      } else if (statusId === 'mind_wound') {
        effects.push({ type: 'add_status', statusId: 'mind_wound', stacks: 1 });
      } else if (statusId === 'psychic_noise') {
        effects.push({ type: 'add_status', statusId: 'psychic_noise', stacks: 1 });
      } else if (statusId === 'confusion') {
        effects.push({ type: 'add_status', statusId: 'confusion', stacks: 1 });
      } else if (statusId === 'terror') {
        effects.push({ type: 'add_status', statusId: 'terror', stacks: 1 });
      } else if (statusId === 'dragon_intimidate') {
        effects.push({ type: 'debuff_all', statusId: 'dragon_intimidate', stages: 1 });
      } else {
        effects.push({ type: 'add_status', statusId, stacks: debuff.stacks ?? 1 });
      }
    }

    if (effect.applyDebuffAll) {
      const d = effect.applyDebuffAll;
      effects.push({
        type: 'debuff_all',
        statusId: d.debuffType as string,
        stages: d.stages ?? 1,
      });
    }

    if (effect.selfDebuff) {
      const sd = effect.selfDebuff;
      effects.push({
        type: 'self_debuff',
        statusId: sd.debuffType as string,
        stacks: sd.stacks ?? 1,
      });
    }

    if (effect.applyBuff) {
      const buff = effect.applyBuff;
      const buffType = buff.buffType as string;
      // 光能汇聚：旧版用 self_buff + grass_power 表示
      if (buffType === 'light_gather' || buffType === BuffType.LIGHT_GATHER) {
        effects.push({ type: 'self_buff', stats: { grass_power: 60 } });
      } else if (buffType === 'flame_charge') {
        effects.push({ type: 'add_status', statusId: 'flame_charge' });
      } else if (buffType === 'fire_shield') {
        effects.push({ type: 'add_status', statusId: 'fire_shield' });
      } else if (buffType === 'wall_of_flames') {
        effects.push({ type: 'add_status', statusId: 'wall_of_flames' });
      } else if (buffType === 'ice_armor' || buffType === 'ice_wall') {
        effects.push({ type: 'add_status', statusId: buffType });
      } else if (buffType === 'water_shield') {
        effects.push({ type: 'add_status', statusId: 'water_shield' });
      } else if (buffType === 'underground') {
        effects.push({ type: 'add_status', statusId: 'underground' });
      } else if (buffType === 'sandstorm') {
        effects.push({ type: 'add_status', statusId: 'sandstorm' });
      } else if (buffType === 'frozen_land_env') {
        effects.push({ type: 'add_status', statusId: 'frozen_land_env' });
      } else if (buffType === 'rain') {
        effects.push({ type: 'add_status', statusId: 'rain' });
      } else if (buffType === 'psychic_terrain') {
        effects.push({ type: 'add_status', statusId: 'psychic_terrain' });
      } else if (buffType === 'dragon_guard') {
        effects.push({ type: 'add_status', statusId: 'dragon_guard' });
      } else if (buffType === 'counter_stance') {
        effects.push({ type: 'add_status', statusId: 'counter_stance' });
      } else if (buffType === BuffType.VINE_BODY) {
        effects.push({ type: 'add_status', statusId: 'vine_body' });
      } else if (buffType === BuffType.COUNTER_STANCE) {
        effects.push({ type: 'add_status', statusId: 'counter_stance' });
      } else if (buffType === BuffType.NUTRIENT) {
        effects.push({ type: 'add_status', statusId: 'nutrient', value: buff.value });
      } else if (buffType === BuffType.ELECTRIC_FIELD_BUFF) {
        effects.push({ type: 'add_status', statusId: 'electric_field_buff', value: buff.value });
      } else {
        effects.push({ type: 'add_status', statusId: buffType });
      }
    }

    if (effect.selfStatBoost) {
      const ssb = effect.selfStatBoost;
      if (ssb.stat === 'spAttack') {
        effects.push({ type: 'self_buff', stats: { grass_power: 60 } }); // 光能汇聚用此格式
      } else if (ssb.stat === 'speed') {
        effects.push({ type: 'buff', stat: 'speed', stages: ssb.stages });
      } else if (ssb.stat === 'attack') {
        effects.push({ type: 'buff', stat: 'attack', stages: ssb.stages });
      } else if (ssb.stat === 'defense') {
        effects.push({ type: 'buff', stat: 'defense', stages: ssb.stages });
      }
    }

    if (effect.statBoost) {
      const sb = effect.statBoost;
      effects.push({ type: 'debuff', stat: sb.stat, stages: sb.stages });
    }

    if (effect.healing) {
      effects.push({ type: 'heal', percent: (effect.healing.percent ?? 0) / 100 });
    }

    if (effect.cleanse) {
      effects.push({ type: 'clear_debuff' });
    }

    if (effect.applyWeather) {
      const w = effect.applyWeather;
      effects.push({ type: 'add_status', statusId: w.weather });
    }

    if (effect.special) {
      const sp = effect.special;
      // 记录 special 类型供后续识别
      effects.push({ type: 'special', specialType: sp.type, value: sp.value });
    }

    if (effect.resistance) {
      const r = effect.resistance;
      effects.push({ type: 'resistance', element: r.element, value: r.value, duration: r.duration });
    }

    if (effect.delay) {
      effects.push({ type: 'delayed_damage' });
    }
  }

  // --- eff 描述（直接用 TypeScript 的 description 字段）---
  const eff = def.description;

  // --- tags ---
  const tags = def.tags ?? [];

  // --- cooldown（从 effects 推断）---
  let cooldown: number | undefined;
  // 有些防御技能有 cooldown，根据 ID 手动标注
  const cooldownIds: Record<string, number> = {
    'fire_shield': 1,
    'wall_of_flames': 1,
    'water_shield': 1,
    'frost_armor': 1,
    'ice_wall': 1,
    'mind_shield_skill': 1,
    'dragon_scales_shield_v2': 1,
  };
  if (cooldownIds[def.id]) {
    cooldown = cooldownIds[def.id];
  }

  return {
    id: def.id,
    name: def.name,
    e,
    t,
    p,
    damageType,
    eff,
    effects,
    tags,
    cooldown,
  };
}

// ==================== 提取 ATTACK/DEFENSE/SUPPORT ====================

function extractByTendency(
  allSkills: Skill[],
  tendency: SkillTendency
): OldSkill[] {
  return allSkills
    .filter(s => s.definition.tendency === tendency)
    .map(s => convertSkill(s, ''));
}

function groupSkills(
  skillLib: Record<string, unknown>,
  _element: string
): { attack: OldSkill[]; defense: OldSkill[]; support: OldSkill[] } {
  const att = skillLib['ATTACK'] as Record<string, Skill> | undefined;
  const def = skillLib['DEFENSE'] as Record<string, Skill> | undefined;
  const sup = skillLib['SUPPORT'] as Record<string, Skill> | undefined;

  const parseGroup = (obj: Record<string, Skill> | undefined): OldSkill[] =>
    obj
      ? Object.values(obj).filter((v): v is Skill => v instanceof Skill).map(s => convertSkill(s, ''))
      : [];

  return {
    attack: parseGroup(att),
    defense: parseGroup(def),
    support: parseGroup(sup),
  };
}

// ==================== 生成输出 ====================

// 元素颜色映射
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff453a',
  water: '#0a84ff',
  grass: '#34c759',
  electric: '#ffd60a',
  psychic: '#bf5af2',
  ice: '#64d2ff',
  ground: '#ac8e68',
  dragon: '#c76231',
};

const ELEMENT_NAMES: Record<string, string> = {
  fire: '火属性',
  water: '水属性',
  grass: '草属性',
  electric: '电属性',
  psychic: '超能属性',
  ice: '冰属性',
  ground: '地属性',
  dragon: '龙属性',
};

const SKILL_LIBS = [
  { key: 'fire', lib: FIRE_BURST_SKILLS },
  { key: 'water', lib: WATER_CONTROL_SKILLS },
  { key: 'grass', lib: GRASS_AURA_SKILLS },
  { key: 'electric', lib: ELECTRIC_PULSE_SKILLS },
  { key: 'ice', lib: ICE_SHARD_SKILLS },
  { key: 'psychic', lib: PSYCHIC_MYSTIC_SKILLS },
  { key: 'ground', lib: GROUND_WEATHER_SKILLS },
  { key: 'dragon', lib: DRAGON_BLOOD_SKILLS },
];

const db: Record<string, unknown> = {};

for (const { key, lib } of SKILL_LIBS) {
  const { attack, defense, support } = groupSkills(lib, key);
  db[key] = {
    name: ELEMENT_NAMES[key],
    color: ELEMENT_COLORS[key],
    attack,
    defense,
    support,
  };
}

// 生成 JS 源码
const lines: string[] = [
  '// ===========================================================',
  '// skills-db.js',
  '// 由 scripts/generate-skills-db.ts 自动生成，请勿手动修改',
  '// 生成时间: ' + new Date().toISOString(),
  '// 数据来源: src/skills/*.ts',
  '// ===========================================================',
  '',
  'const SKILLS_DB = ' + JSON.stringify(db, null, 2) + ';',
  '',
];

const output = lines.join('\n');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, '..', 'skills-db.js');
fs.writeFileSync(outputPath, '\ufeff' + output, 'utf8');

console.log('✓ skills-db.js 生成完成，共写入 ' + lines.length + ' 行');
console.log('  路径: ' + outputPath);

// 统计
let totalSkills = 0;
for (const [key, val] of Object.entries(db)) {
  const group = val as { attack: unknown[]; defense: unknown[]; support: unknown[] };
  const count = group.attack.length + group.defense.length + group.support.length;
  totalSkills += count;
  console.log(`  ${key}: ${count} 技能 (攻:${group.attack.length} 防:${group.defense.length} 辅:${group.support.length})`);
}
console.log(`总计: ${totalSkills} 技能`);
