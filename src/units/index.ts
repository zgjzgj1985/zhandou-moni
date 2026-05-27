/**
 * 循迹之境 - 所有生物定义
 * 
 * 统一的生物定义，所有生物既可以作为伙伴（友方）也可以作为怪物（敌方）
 * 伙伴和怪物的区别只是阵营不同，生物属性和技能完全一致
 */

import { Skill } from '../skills';
import { ElementType } from '../types';
import { createCreatureAttackSkill, createCreaturePhysicalSkill, createCreatureShieldSkill, createCreatureBuffSkill, createCreatureHealSkill } from './SkillFactory';
import { AIDifficulty } from '../battle/EnemyUnit';
import { CreatureDefinition } from './CreatureDefinition';

/**
 * 获取能量消耗
 */
function getEnergy(power: number): number {
  if (power <= 45) return 1;
  if (power <= 80) return 2;
  if (power <= 100) return 3;
  return 4;
}

// ==================== 火属性生物 ====================

/**
 * 焰爪熊 - 火属性伙伴/怪物
 * 爆发流：高攻击低速度，前期用护盾过渡，蓄力后收割
 */
export function createFlameBearSkills(): Skill[] {
  return [
    createCreatureAttackSkill('flame_bear_inferno', '烈焰冲击', 75, 1, ElementType.FIRE),
    createCreatureShieldSkill('flame_bear_shield', '火焰护盾', 50),
    createCreatureBuffSkill('flame_bear_burn', '燃尽', '3回合后造成50点伤害'),
    createCreatureAttackSkill('flame_bear_explosion', '爆裂拳', 100, 3, ElementType.FIRE),
  ];
}

export const FlameBearDefinition: CreatureDefinition = {
  id: 'flame_bear',
  name: '焰爪熊',
  description: '浑身燃烧着烈焰的凶猛巨熊，以爆发力著称',
  level: 10,
  maxHp: 110,
  attack: 100,
  defense: 85,
  spAttack: 75,
  spDefense: 70,
  speed: 70,
  elements: [ElementType.FIRE],
  skills: createFlameBearSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 60 },
    { turn: 2, intent: 1, power: 75 },
    { turn: 3, intent: 3, probability: 1.0 },
    { turn: 4, intent: 1, power: 100 },
  ],
  goldReward: 15,
  expReward: 25
};

/**
 * 焰心蜥 - 火属性伙伴/怪物
 * 平衡攻击型
 */
export function createFlameSalamanderSkills(): Skill[] {
  return [
    createCreatureAttackSkill('flame_salamander_spark', '火花', 40, 1, ElementType.FIRE),
    createCreatureAttackSkill('flame_salamander_charge', '烈焰冲击', 75, 2, ElementType.FIRE),
    createCreatureBuffSkill('flame_salamander_charge_up', '蓄焰', '下次攻击威力+50%'),
    createCreatureAttackSkill('flame_salamander_blast', '爆炸烈焰', 120, 4, ElementType.FIRE),
  ];
}

export const FlameSalamanderDefinition: CreatureDefinition = {
  id: 'flame_salamander',
  name: '焰心蜥',
  description: '栖息在火山地带的蜥蜴，尾部燃烧着永恒的火焰',
  level: 8,
  maxHp: 100,
  attack: 95,
  defense: 65,
  spAttack: 85,
  spDefense: 60,
  speed: 75,
  elements: [ElementType.FIRE],
  skills: createFlameSalamanderSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 60 },
    { turn: 2, intent: 1, power: 75 },
    { turn: 3, intent: 3, probability: 1.0 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 15,
  expReward: 20
};

// ==================== 水属性生物 ====================

/**
 * 激流蟹 - 水属性伙伴/怪物
 * 防御流：高防御，泡沫控制
 */
export function createTorrentCrabSkills(): Skill[] {
  return [
    createCreatureAttackSkill('torrent_crab_water_gun', '水炮', 80, 2, ElementType.WATER),
    createCreatureBuffSkill('torrent_crab_armor', '蟹钳加固', '防御+2级'),
    createCreatureAttackSkill('torrent_crab_bubble', '泡沫光线', 50, 1, ElementType.WATER),
    createCreatureShieldSkill('torrent_crab_shield', '潮汐护盾', 60),
  ];
}

export const TorrentCrabDefinition: CreatureDefinition = {
  id: 'torrent_crab',
  name: '激流蟹',
  description: '拥有坚硬蟹壳的甲壳生物，以防守反击著称',
  level: 10,
  maxHp: 100,
  attack: 80,
  defense: 95,
  spAttack: 70,
  spDefense: 85,
  speed: 60,
  elements: [ElementType.WATER],
  skills: createTorrentCrabSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 60 },
    { turn: 2, intent: 1, power: 70 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 14,
  expReward: 22
};

/**
 * 深海鱼 - 水属性伙伴/怪物
 */
export function createDeepFishSkills(): Skill[] {
  return [
    createCreatureAttackSkill('deep_fish_water_gun', '水枪', 40, 1, ElementType.WATER),
    createCreatureAttackSkill('deep_fish_rush', '水流冲击', 65, 2, ElementType.WATER),
    createCreatureShieldSkill('deep_fish_guard', '水之守护', 45),
    createCreatureAttackSkill('deep_fish_vortex', '漩涡', 100, 3, ElementType.WATER),
  ];
}

export const DeepFishDefinition: CreatureDefinition = {
  id: 'deep_fish',
  name: '深海鱼',
  description: '栖息在深海的鱼类，能操控水流',
  level: 7,
  maxHp: 85,
  attack: 70,
  defense: 75,
  spAttack: 90,
  spDefense: 80,
  speed: 85,
  elements: [ElementType.WATER],
  skills: createDeepFishSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 50 },
    { turn: 2, intent: 1, power: 65 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 1, power: 75 },
  ],
  goldReward: 12,
  expReward: 18
};

// ==================== 草属性生物 ====================

/**
 * 藤蔓龟 - 草属性伙伴/怪物
 * 光环流：高HP高防御，寄生消耗
 */
export function createVineTurtleSkills(): Skill[] {
  return [
    createCreatureAttackSkill('vine_turtle_whip', '藤鞭', 65, 1, ElementType.GRASS),
    createCreatureBuffSkill('vine_turtle_parasite', '寄生种子', '每回合吸取15%HP'),
    createCreatureBuffSkill('vine_turtle_root', '扎根', '每回合回复10%HP'),
    createCreatureAttackSkill('vine_turtle_blade', '飞叶快刀', 85, 2, ElementType.GRASS),
  ];
}

export const VineTurtleDefinition: CreatureDefinition = {
  id: 'vine_turtle',
  name: '藤蔓龟',
  description: '背部长满藤蔓的龟类，以持久战著称',
  level: 10,
  maxHp: 115,
  attack: 65,
  defense: 90,
  spAttack: 85,
  spDefense: 80,
  speed: 55,
  elements: [ElementType.GRASS],
  skills: createVineTurtleSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 55 },
    { turn: 2, intent: 3, probability: 1.0 },
    { turn: 3, intent: 1, power: 65 },
    { turn: 4, intent: 1, power: 75 },
  ],
  goldReward: 14,
  expReward: 24
};

/**
 * 毒藤怪 - 草属性伙伴/怪物
 */
export function createPoisonVineSkills(): Skill[] {
  return [
    createCreatureAttackSkill('poison_vine_whip', '藤鞭', 55, 1, ElementType.GRASS),
    createCreatureBuffSkill('poison_vine_seed', '寄生种子', '每回合吸取12%HP'),
    createCreatureBuffSkill('poison_vine_toxic', '毒粉', '目标中毒'),
    createCreatureAttackSkill('poison_vine_blade', '飞叶快刀', 80, 2, ElementType.GRASS),
  ];
}

export const PoisonVineDefinition: CreatureDefinition = {
  id: 'poison_vine',
  name: '毒藤怪',
  description: '有毒的藤蔓生物，擅长持续伤害',
  level: 7,
  maxHp: 95,
  attack: 75,
  defense: 80,
  spAttack: 85,
  spDefense: 70,
  speed: 65,
  elements: [ElementType.GRASS],
  skills: createPoisonVineSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 55 },
    { turn: 2, intent: 3, probability: 1.0 },
    { turn: 3, intent: 3, probability: 0.8 },
    { turn: 4, intent: 1, power: 70 },
  ],
  goldReward: 12,
  expReward: 18
};

// ==================== 冰属性生物 ====================

/**
 * 寒霜狼 - 冰属性伙伴/怪物
 * 减速流：高攻击高速度，减速控制
 */
export function createFrostWolfSkills(): Skill[] {
  return [
    createCreatureAttackSkill('frost_wolf_chill', '冰冻之风', 55, 2, ElementType.ICE),
    createCreatureAttackSkill('frost_wolf_fang', '寒霜之牙', 80, 2, ElementType.ICE),
    createCreatureShieldSkill('frost_wolf_armor', '冰霜护甲', 45),
    createCreatureBuffSkill('frost_wolf_field', '绝对零域', '全体减速'),
  ];
}

export const FrostWolfDefinition: CreatureDefinition = {
  id: 'frost_wolf',
  name: '寒霜狼',
  description: '在极寒地带生存的狼类，能冻结一切',
  level: 10,
  maxHp: 90,
  attack: 95,
  defense: 70,
  spAttack: 60,
  spDefense: 75,
  speed: 100,
  elements: [ElementType.ICE],
  skills: createFrostWolfSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 55 },
    { turn: 2, intent: 1, power: 70 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 15,
  expReward: 26
};

/**
 * 冰晶魔 - 冰属性伙伴/怪物
 */
export function createIceCrystalSkills(): Skill[] {
  return [
    createCreatureAttackSkill('ice_crystal_chill', '冰冻之风', 55, 2, ElementType.ICE),
    createCreatureAttackSkill('ice_crystal_explosion', '冰爆', 130, 5, ElementType.ICE),
    createCreatureShieldSkill('ice_crystal_armor', '冰霜护甲', 50),
    createCreatureBuffSkill('ice_crystal_field', '绝对零域', '全体减速'),
  ];
}

export const IceCrystalDefinition: CreatureDefinition = {
  id: 'ice_crystal',
  name: '冰晶魔',
  description: '由冰晶构成的魔法生物，擅长冰冻控制',
  level: 8,
  maxHp: 80,
  attack: 65,
  defense: 70,
  spAttack: 100,
  spDefense: 85,
  speed: 70,
  elements: [ElementType.ICE],
  skills: createIceCrystalSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 55 },
    { turn: 2, intent: 1, power: 70 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 3, probability: 1.0 },
  ],
  goldReward: 14,
  expReward: 20
};

// ==================== 岩石属性生物 ====================

/**
 * 磐石牛 - 岩石属性伙伴/怪物
 * 防御流：极高HP和防御
 */
export function createRockOxSkills(): Skill[] {
  return [
    createCreatureAttackSkill('rock_ox_spike', '尖石攻击', 75, 2, ElementType.ROCK),
    createCreatureShieldSkill('rock_ox_shield', '岩盾', 70),
    createCreatureBuffSkill('rock_ox_wall', '铁壁', '防御+3级'),
    createCreatureAttackSkill('rock_ox_quake', '地震', 90, 3, ElementType.ROCK),
  ];
}

export const RockOxDefinition: CreatureDefinition = {
  id: 'rock_ox',
  name: '磐石牛',
  description: '如磐石般坚硬的牛类，是移动的堡垒',
  level: 10,
  maxHp: 130,
  attack: 90,
  defense: 110,
  spAttack: 50,
  spDefense: 85,
  speed: 45,
  elements: [ElementType.ROCK],
  skills: createRockOxSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 60 },
    { turn: 2, intent: 2, probability: 1.0 },
    { turn: 3, intent: 3, probability: 1.0 },
    { turn: 4, intent: 1, power: 75 },
  ],
  goldReward: 16,
  expReward: 28
};

/**
 * 岩甲兽 - 岩石属性伙伴/怪物
 */
export function createRockArmadilloSkills(): Skill[] {
  return [
    createCreatureAttackSkill('rock_armadillo_rock', '落石', 70, 2, ElementType.ROCK),
    createCreatureShieldSkill('rock_armadillo_shield', '岩盾', 60),
    createCreatureAttackSkill('rock_armadillo_spike', '尖石攻击', 80, 2, ElementType.ROCK),
    createCreatureAttackSkill('rock_armadillo_quake', '地震', 90, 3, ElementType.ROCK),
  ];
}

export const RockArmadilloDefinition: CreatureDefinition = {
  id: 'rock_armadillo',
  name: '岩甲兽',
  description: '披着岩石铠甲的兽类，防御惊人',
  level: 8,
  maxHp: 120,
  attack: 85,
  defense: 100,
  spAttack: 50,
  spDefense: 75,
  speed: 50,
  elements: [ElementType.ROCK],
  skills: createRockArmadilloSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 2, probability: 1.0 },
    { turn: 2, intent: 1, power: 65 },
    { turn: 3, intent: 1, power: 70 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 15,
  expReward: 18
};

// ==================== 超能属性生物 ====================

/**
 * 灵狐 - 超能属性伙伴/怪物
 * 奥秘流：高特攻高特防
 */
export function createSpiritFoxSkills(): Skill[] {
  return [
    createCreatureAttackSkill('spirit_fox_impact', '精神冲击', 85, 2, ElementType.PSYCHIC),
    createCreatureAttackSkill('spirit_fox_mirror', '幻象光', 60, 2, ElementType.PSYCHIC),
    createCreatureBuffSkill('spirit_fox_reflect', '反射壁', '反弹特殊伤害'),
    createCreatureBuffSkill('spirit_fox_predict', '预知', '下回合必定先手'),
  ];
}

export const SpiritFoxDefinition: CreatureDefinition = {
  id: 'spirit_fox',
  name: '灵狐',
  description: '拥有九条尾巴的狐狸，能操控精神力量',
  level: 10,
  maxHp: 80,
  attack: 55,
  defense: 70,
  spAttack: 115,
  spDefense: 95,
  speed: 90,
  elements: [ElementType.PSYCHIC],
  skills: createSpiritFoxSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 70 },
    { turn: 2, intent: 1, power: 60 },
    { turn: 3, intent: 3, probability: 1.0 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 18,
  expReward: 30
};

/**
 * 幻蝶 - 超能+草双属性伙伴/怪物
 */
export function createDreamButterflySkills(): Skill[] {
  return [
    createCreatureAttackSkill('dream_butterfly_illusion', '幻象攻击', 70, 2, ElementType.PSYCHIC),
    createCreatureBuffSkill('dream_butterfly_seed', '寄生之种', '每回合吸取12%HP'),
    createCreatureBuffSkill('dream_butterfly_sleep', '催眠粉', '目标昏睡'),
    createCreatureBuffSkill('dream_butterfly_power', '精神强化', '特攻+2级'),
  ];
}

export const DreamButterflyDefinition: CreatureDefinition = {
  id: 'dream_butterfly',
  name: '幻蝶',
  description: '能在梦境与现实间穿梭的蝴蝶',
  level: 10,
  maxHp: 70,
  attack: 50,
  defense: 65,
  spAttack: 100,
  spDefense: 85,
  speed: 110,
  elements: [ElementType.PSYCHIC, ElementType.GRASS],
  skills: createDreamButterflySkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 60 },
    { turn: 2, intent: 3, probability: 0.7 },
    { turn: 3, intent: 3, probability: 0.5 },
    { turn: 4, intent: 3, probability: 1.0 },
  ],
  goldReward: 18,
  expReward: 32
};

/**
 * 念力怪 - 超能属性伙伴/怪物
 */
export function createMindMasterSkills(): Skill[] {
  return [
    createCreatureAttackSkill('mind_master_impact', '精神冲击', 85, 2, ElementType.PSYCHIC),
    createCreatureAttackSkill('mind_master_mirror', '幻象光', 60, 2, ElementType.PSYCHIC),
    createCreatureBuffSkill('mind_master_teleport', '瞬间移动', '闪避'),
    createCreatureAttackSkill('mind_master_psycho', '精神强念', 100, 3, ElementType.PSYCHIC),
  ];
}

export const MindMasterDefinition: CreatureDefinition = {
  id: 'mind_master',
  name: '念力怪',
  description: '精通念力的神秘生物',
  level: 9,
  maxHp: 85,
  attack: 55,
  defense: 70,
  spAttack: 110,
  spDefense: 90,
  speed: 95,
  elements: [ElementType.PSYCHIC],
  skills: createMindMasterSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 80 },
    { turn: 2, intent: 1, power: 60 },
    { turn: 3, intent: 2, probability: 0.8 },
    { turn: 4, intent: 1, power: 90 },
  ],
  goldReward: 16,
  expReward: 25
};

/**
 * 暗影豹 - 超能属性伙伴/怪物
 */
export function createShadowPantherSkills(): Skill[] {
  return [
    createCreatureAttackSkill('shadow_panther_claw', '暗影爪', 75, 2, ElementType.PSYCHIC),
    createCreatureAttackSkill('shadow_panther_illusion', '幻象攻击', 70, 2, ElementType.PSYCHIC),
    createCreatureAttackSkill('shadow_panther_assault', '突袭', 90, 3, ElementType.PSYCHIC),
    createCreatureBuffSkill('shadow_panther_power', '精神强化', '攻击+2级'),
  ];
}

export const ShadowPantherDefinition: CreatureDefinition = {
  id: 'shadow_panther',
  name: '暗影豹',
  description: '在暗影中潜伏的猎豹，来去无踪',
  level: 9,
  maxHp: 75,
  attack: 100,
  defense: 60,
  spAttack: 85,
  spDefense: 70,
  speed: 115,
  elements: [ElementType.PSYCHIC],
  skills: createShadowPantherSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 70 },
    { turn: 2, intent: 1, power: 80 },
    { turn: 3, intent: 1, power: 75 },
    { turn: 4, intent: 3, probability: 1.0 },
  ],
  goldReward: 17,
  expReward: 26
};

// ==================== 龙属性生物 ====================

/**
 * 星瞳龙 - 龙属性伙伴/怪物
 * 中速流：攻防兼备
 */
export function createStarDragonSkills(): Skill[] {
  return [
    createCreatureAttackSkill('star_dragon_pulse', '龙之波动', 75, 2, ElementType.DRAGON),
    createCreatureBuffSkill('star_dragon_dance', '龙之舞', '攻击+1级,速度+1级'),
    createCreatureAttackSkill('star_dragon_breath', '龙息', 50, 2, ElementType.DRAGON),
    createCreatureAttackSkill('star_dragon_rage', '逆鳞', 120, 4, ElementType.DRAGON),
  ];
}

export const StarDragonDefinition: CreatureDefinition = {
  id: 'star_dragon',
  name: '星瞳龙',
  description: '拥有星芒眼瞳的龙类，成长后无人能挡',
  level: 10,
  maxHp: 95,
  attack: 85,
  defense: 75,
  spAttack: 105,
  spDefense: 80,
  speed: 80,
  elements: [ElementType.DRAGON],
  skills: createStarDragonSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 65 },
    { turn: 2, intent: 3, probability: 1.0 },
    { turn: 3, intent: 1, power: 75 },
    { turn: 4, intent: 1, power: 100 },
  ],
  goldReward: 20,
  expReward: 35
};

/**
 * 炎爆兽 - 火+龙双属性伙伴/怪物
 */
export function createBlazeBeastSkills(): Skill[] {
  return [
    createCreatureAttackSkill('blaze_beast_punch', '火焰拳', 80, 2, ElementType.FIRE),
    createCreatureAttackSkill('blaze_beast_claw', '龙之爪', 75, 2, ElementType.DRAGON),
    createCreatureAttackSkill('blaze_beast_explosion', '爆炎', 100, 3, ElementType.FIRE),
    createCreatureShieldSkill('blaze_beast_body', '火焰护体', 55),
  ];
}

export const BlazeBeastDefinition: CreatureDefinition = {
  id: 'blaze_beast',
  name: '炎爆兽',
  description: '融合龙族血脉的火焰巨兽',
  level: 10,
  maxHp: 100,
  attack: 110,
  defense: 75,
  spAttack: 95,
  spDefense: 70,
  speed: 65,
  elements: [ElementType.FIRE, ElementType.DRAGON],
  skills: createBlazeBeastSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 70 },
    { turn: 2, intent: 1, power: 75 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 1, power: 90 },
  ],
  goldReward: 20,
  expReward: 36
};

/**
 * 幼龙 - 龙属性伙伴/怪物
 */
export function createYoungDragonSkills(): Skill[] {
  return [
    createCreatureAttackSkill('young_dragon_pulse', '龙之波动', 75, 2, ElementType.DRAGON),
    createCreatureBuffSkill('young_dragon_dance', '龙之舞', '攻击+1级'),
    createCreatureAttackSkill('young_dragon_claw', '龙爪', 80, 2, ElementType.DRAGON),
    createCreatureAttackSkill('young_dragon_breath', '龙息', 50, 2, ElementType.DRAGON),
  ];
}

export const YoungDragonDefinition: CreatureDefinition = {
  id: 'young_dragon',
  name: '幼龙',
  description: '正在成长的幼年龙族',
  level: 9,
  maxHp: 100,
  attack: 90,
  defense: 75,
  spAttack: 95,
  spDefense: 80,
  speed: 75,
  elements: [ElementType.DRAGON],
  skills: createYoungDragonSkills(),
  aiStrategy: AIDifficulty.NORMAL,
  intentPattern: [
    { turn: 1, intent: 1, power: 70 },
    { turn: 2, intent: 3, probability: 1.0 },
    { turn: 3, intent: 1, power: 75 },
    { turn: 4, intent: 1, power: 80 },
  ],
  goldReward: 18,
  expReward: 28
};

/**
 * 火山龙 - 火+龙双属性伙伴/怪物（BOSS级）
 */
export function createVolcanoDragonSkills(): Skill[] {
  return [
    createCreatureAttackSkill('volcano_dragon_flame', '火焰龙息', 90, 3, ElementType.FIRE),
    createCreatureAttackSkill('volcano_dragon_claw', '龙之爪', 80, 2, ElementType.DRAGON),
    createCreatureShieldSkill('volcano_dragon_body', '火焰护体', 60),
    createCreatureAttackSkill('volcano_dragon_explosion', '爆炎', 110, 4, ElementType.FIRE),
  ];
}

export const VolcanoDragonDefinition: CreatureDefinition = {
  id: 'volcano_dragon',
  name: '火山龙',
  description: '栖息在火山的顶级龙族，极为危险',
  level: 10,
  maxHp: 110,
  attack: 105,
  defense: 80,
  spAttack: 100,
  spDefense: 75,
  speed: 60,
  elements: [ElementType.FIRE, ElementType.DRAGON],
  skills: createVolcanoDragonSkills(),
  aiStrategy: AIDifficulty.HARD,
  intentPattern: [
    { turn: 1, intent: 1, power: 80 },
    { turn: 2, intent: 1, power: 75 },
    { turn: 3, intent: 2, probability: 1.0 },
    { turn: 4, intent: 1, power: 100 },
  ],
  goldReward: 25,
  expReward: 35
};

// ==================== 导出所有生物定义 ====================

/**
 * 所有生物定义列表
 */
export const ALL_CREATURES: CreatureDefinition[] = [
  // 火属性
  FlameBearDefinition,
  FlameSalamanderDefinition,
  // 水属性
  TorrentCrabDefinition,
  DeepFishDefinition,
  // 草属性
  VineTurtleDefinition,
  PoisonVineDefinition,
  // 电属性
  LightningMartenDefinition,
  ThunderBatDefinition,
  // 冰属性
  FrostWolfDefinition,
  IceCrystalDefinition,
  // 岩石属性
  RockOxDefinition,
  RockArmadilloDefinition,
  // 超能属性
  SpiritFoxDefinition,
  DreamButterflyDefinition,
  MindMasterDefinition,
  ShadowPantherDefinition,
  // 龙属性
  StarDragonDefinition,
  BlazeBeastDefinition,
  YoungDragonDefinition,
  VolcanoDragonDefinition,
];

/**
 * 根据ID获取生物定义
 */
export function getCreatureById(id: string): CreatureDefinition | undefined {
  return ALL_CREATURES.find(c => c.id === id);
}

/**
 * 根据属性筛选生物
 */
export function getCreaturesByElement(element: ElementType): CreatureDefinition[] {
  return ALL_CREATURES.filter(c => c.elements.includes(element));
}
