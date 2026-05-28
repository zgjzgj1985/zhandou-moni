// Source: battle-simple.html lines 597-724 + 1831-1866
const CREATURE_TEMPLATES = [
  { id: 'flame_bear', name: '焰爪熊', element: 'fire', style: '爆发流' },
  { id: 'flame_salamander', name: '焰心蜥', element: 'fire', style: '爆发流' },
  { id: 'blaze_beast', name: '炎爆兽', element: 'fire', style: '爆发流' },
  { id: 'torrent_crab', name: '激流蟹', element: 'water', style: '控制流' },
  { id: 'deep_fish', name: '深海鱼', element: 'water', style: '控制流' },
  { id: 'vine_turtle', name: '藤蔓龟', element: 'grass', style: '光环流' },
  { id: 'poison_vine', name: '毒藤怪', element: 'grass', style: '光环流' },
  { id: 'lightning_marten', name: '闪电貂', element: 'electric', style: '多段伤害流' },
  { id: 'thunder_bat', name: '雷鸣蝠', element: 'electric', style: '多段伤害流' },
  { id: 'frost_wolf', name: '寒霜狼', element: 'ice', style: '冰霜蓄力流' },
  { id: 'ice_crystal', name: '冰晶魔', element: 'ice', style: '冰霜蓄力流' },
  { id: 'rock_ox', name: '磐石牛', element: 'rock', style: '天气流' },
  { id: 'rock_armadillo', name: '岩甲兽', element: 'rock', style: '天气流' },
  { id: 'spirit_fox', name: '灵狐', element: 'psychic', style: '奥秘流' },
  { id: 'dream_butterfly', name: '幻蝶', element: 'psychic', style: '奥秘流' },
  { id: 'mind_master', name: '念力怪', element: 'psychic', style: '奥秘流' },
  { id: 'shadow_panther', name: '暗影豹', element: 'psychic', style: '奥秘流' },
  { id: 'star_dragon', name: '星瞳龙', element: 'dragon', style: '血脉压制流' },
  { id: 'young_dragon', name: '幼龙', element: 'dragon', style: '血脉压制流' },
  { id: 'volcano_dragon', name: '火山龙', element: 'dragon', style: '血脉压制流', isBoss: true }
];

const CREATURE_BASE_STATS = {
  flame_bear: { hp: 110, attack: 100, defense: 85, spAttack: 75, spDefense: 70, speed: 70 },
  flame_salamander: { hp: 100, attack: 95, defense: 65, spAttack: 85, spDefense: 60, speed: 75 },
  blaze_beast: { hp: 100, attack: 110, defense: 75, spAttack: 95, spDefense: 70, speed: 65 },
  torrent_crab: { hp: 100, attack: 80, defense: 95, spAttack: 70, spDefense: 85, speed: 60 },
  deep_fish: { hp: 85, attack: 70, defense: 75, spAttack: 90, spDefense: 80, speed: 85 },
  vine_turtle: { hp: 115, attack: 65, defense: 90, spAttack: 85, spDefense: 80, speed: 55 },
  poison_vine: { hp: 95, attack: 75, defense: 80, spAttack: 85, spDefense: 70, speed: 65 },
  lightning_marten: { hp: 75, attack: 70, defense: 60, spAttack: 110, spDefense: 65, speed: 120 },
  thunder_bat: { hp: 70, attack: 80, defense: 55, spAttack: 95, spDefense: 60, speed: 110 },
  frost_wolf: { hp: 90, attack: 95, defense: 70, spAttack: 60, spDefense: 75, speed: 100 },
  ice_crystal: { hp: 80, attack: 65, defense: 70, spAttack: 100, spDefense: 85, speed: 70 },
  rock_ox: { hp: 130, attack: 90, defense: 110, spAttack: 50, spDefense: 85, speed: 45 },
  rock_armadillo: { hp: 120, attack: 85, defense: 100, spAttack: 50, spDefense: 75, speed: 50 },
  spirit_fox: { hp: 80, attack: 55, defense: 70, spAttack: 115, spDefense: 95, speed: 90 },
  dream_butterfly: { hp: 70, attack: 50, defense: 65, spAttack: 100, spDefense: 85, speed: 110 },
  mind_master: { hp: 85, attack: 55, defense: 70, spAttack: 110, spDefense: 90, speed: 95 },
  shadow_panther: { hp: 75, attack: 100, defense: 60, spAttack: 85, spDefense: 70, speed: 115 },
  star_dragon: { hp: 95, attack: 85, defense: 75, spAttack: 105, spDefense: 80, speed: 80 },
  young_dragon: { hp: 100, attack: 90, defense: 75, spAttack: 95, spDefense: 80, speed: 75 },
  volcano_dragon: { hp: 110, attack: 105, defense: 80, spAttack: 100, spDefense: 75, speed: 60 }
};

function calculateStats(baseStats, level) {
  return {
    maxHp: Math.floor(baseStats.hp * 2 * level / 30) + level + 10,
    attack: Math.floor(baseStats.attack * level / 30) + 5,
    defense: Math.floor(baseStats.defense * level / 30) + 5,
    spAttack: Math.floor(baseStats.spAttack * level / 30) + 5,
    spDefense: Math.floor(baseStats.spDefense * level / 30) + 5,
    speed: baseStats.speed
  };
}

function getCreatureStats(templateId, level) {
  const baseStats = CREATURE_BASE_STATS[templateId];
  if (!baseStats) {
    const defaultBase = { hp: 65, attack: 65, defense: 65, spAttack: 65, spDefense: 65, speed: 65 };
    return calculateStats(defaultBase, level);
  }
  return calculateStats(baseStats, level);
}

const PLAYER_INITIAL_CONFIG = [
  { id: 'flame_bear', name: '焰爪熊', element: 'fire', level: 60 },
  { id: 'torrent_crab', name: '激流蟹', element: 'water', level: 60 },
  { id: 'vine_turtle', name: '藤蔓龟', element: 'grass', level: 60 }
];

function createPlayerUnits() {
  return PLAYER_INITIAL_CONFIG.map(config => {
    const stats = getCreatureStats(config.id, config.level);
    return {
      id: config.id,
      name: config.name,
      element: config.element,
      level: config.level,
      side: 'player',
      maxHp: stats.maxHp,
      currentHp: stats.maxHp,
      attack: stats.attack,
      spAttack: stats.spAttack,
      defense: stats.defense,
      spDefense: stats.spDefense,
      speed: stats.speed,
      energy: MAX_ENERGY,
      debuffs: [],
      buffs: []
    };
  });
}

let playerUnits = createPlayerUnits();

const ENEMY_INITIAL_CONFIG = [
  { id: 'flame_salamander', name: '焰心蜥', element: 'fire', level: 60 },
  { id: 'deep_fish', name: '深海鱼', element: 'water', level: 60 },
  { id: 'poison_vine', name: '毒藤怪', element: 'grass', level: 60 }
];

function createEnemyUnits() {
  return ENEMY_INITIAL_CONFIG.map(config => {
    const stats = getCreatureStats(config.id, config.level);
    return {
      id: config.id + '_enemy',
      templateId: config.id,
      name: config.name,
      element: config.element,
      level: config.level,
      side: 'enemy',
      maxHp: stats.maxHp,
      currentHp: stats.maxHp,
      attack: stats.attack,
      spAttack: stats.spAttack,
      defense: stats.defense,
      spDefense: stats.spDefense,
      speed: stats.speed,
      energy: MAX_ENERGY,
      intent: { type: 'attack', power: 75, targetId: 'flame_bear' },
      debuffs: [],
      buffs: []
    };
  });
}

let enemyUnits = createEnemyUnits();
