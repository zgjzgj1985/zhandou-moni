// 状态定义 - 所有状态统一管理
const STATUS = {
  // ========== Buff（增益状态）==========

  // 流水状态 - 速度提升
  flow: {
    id: 'flow',
    name: '流水',
    type: 'buff',
    stats: { speed: 1 },
    duration: 2
  },

  // 清泉护盾 - 持续治疗+净化
  clear_spring: {
    id: 'clear_spring',
    name: '清泉护盾',
    type: 'buff',
    healPercent: 0.1,
    cleanseCount: 1,
    duration: 3
  },

  // 扎根状态 - 持续回复但减速
  root_bound: {
    id: 'root_bound',
    name: '扎根',
    type: 'buff',
    healPercent: 0.08,
    stats: { speed: -1 },
    duration: 3
  },

  // 蓄焰状态 - 下次火属性攻击加成
  flame_charge: {
    id: 'flame_charge',
    name: '蓄焰',
    type: 'buff',
    firePowerBonus: 0,
    duration: 3
  },

  // 光能汇聚 - 草系技能威力加成
  light_gather: {
    id: 'light_gather',
    name: '光能汇聚',
    type: 'buff',
    grassPowerBonus: 60,
    stacks: 1,
    duration: 999
  },

  // 芬芳环境标记
  fragrant_environment: {
    id: 'fragrant_environment',
    name: '芬芳环境',
    type: 'environment',
    grassDamageBoost: 0.25,
    healPercent: 0.05,
    duration: 4
  },

  // 雨天环境标记
  rainy_day: {
    id: 'rainy_day',
    name: '雨天',
    type: 'environment',
    waterPowerBoost: 0.5,
    duration: 3
  },

  // 沙暴环境标记
  sandstorm: {
    id: 'sandstorm',
    name: '沙暴',
    type: 'environment',
    groundSteelDragonDefBoost: 0.5,
    damageNonGround: 0.0625,
    duration: 3
  },

  // 冻土环境标记
  frozen_land: {
    id: 'frozen_land',
    name: '冻土',
    type: 'environment',
    iceEnergyCostReduce: 1,
    duration: 3
  },

  // 精神场地标记
  psychic_terrain: {
    id: 'psychic_terrain',
    name: '精神场地',
    type: 'environment',
    psychicPowerBoost: 0.3,
    priorityProtect: true,
    duration: 5
  },

  // 蓄电护体状态
  static_charge: {
    id: 'static_charge',
    name: '蓄电',
    type: 'buff',
    chargeStacks: 2,
    damageReduction: 0.5,
    duration: 1
  },

  // 电磁偏转状态
  electric_deflect: {
    id: 'electric_deflect',
    name: '电磁偏转',
    type: 'buff',
    dodgeRate: 0.7,
    counterDamage: 20,
    duration: 1
  },

  // 电场状态
  electric_field: {
    id: 'electric_field',
    name: '电场',
    type: 'buff',
    chargeSpeedDouble: true,
    duration: 3
  },

  // 迷雾闪避状态
  mist_body: {
    id: 'mist_body',
    name: '迷雾之躯',
    type: 'buff',
    dodgeRate: 0.7,
    speedBoostOnDodge: 1,
    duration: 2
  },

  // 防反之姿状态
  counter_stance: {
    id: 'counter_stance',
    name: '防反之姿',
    type: 'buff',
    reflectDamage: 0.6,
    priorityBoostOnReflect: 1,
    duration: 1
  },

  // 虚弱状态 - 下回合无法使用技能
  weakness: {
    id: 'weakness',
    name: '虚弱',
    type: 'debuff',
    disableSkill: true,
    duration: 1
  },

  // ========== Debuff（减益状态）==========

  // 灼烧 - 持续伤害
  burn: {
    id: 'burn',
    name: '灼烧',
    type: 'dot',
    damagePercentPerStack: 0.02,
    stackable: true,
    duration: 3
  },

  // 蒸汽灼伤
  steam_burn: {
    id: 'steam_burn',
    name: '蒸汽灼伤',
    type: 'dot',
    damagePercentPerStack: 0.02,
    stackable: true,
    duration: 3
  },

  // 灼伤印记
  burn_mark: {
    id: 'burn_mark',
    name: '灼伤印记',
    type: 'mark',
    delayedDamage: 40,
    triggerTime: 'before_next_action',
    duration: 1
  },

  // 浸透 - 特防降低
  water_soak: {
    id: 'water_soak',
    name: '浸透',
    type: 'debuff',
    stats: { spDef: -1 },
    stackable: true,
    maxStacks: 6,
    duration: 2
  },

  // 浑浊 - 命中率降低
  muddy: {
    id: 'muddy',
    name: '浑浊',
    type: 'debuff',
    stats: { accuracy: -1 },
    stackable: true,
    maxStacks: 3,
    duration: 3
  },

  // 溺水 - 高能耗技能伤害降低
  drowning: {
    id: 'drowning',
    name: '溺水',
    type: 'debuff',
    highCostSkillDamageReduce: 0.3,
    duration: 2
  },

  // 麻痹 - 减速+可能跳过回合
  paralysis: {
    id: 'paralysis',
    name: '麻痹',
    type: 'debuff',
    stats: { speed: -1 },
    skipTurnChance: 0.25,
    duration: 3
  },

  // 冰霜 - 蓄力用
  frost: {
    id: 'frost',
    name: '冰霜',
    type: 'stack',
    stacks: 1,
    maxStacks: 99,
    duration: 999
  },

  // 冻结 - 无法行动
  frozen: {
    id: 'frozen',
    name: '冻结',
    type: 'debuff',
    skipTurn: true,
    duration: 1
  },

  // 极寒印记 - 能耗增加
  frost_mark: {
    id: 'frost_mark',
    name: '极寒印记',
    type: 'debuff',
    energyCostIncrease: 2,
    duration: 2
  },

  // 枯萎 - 每回合受到伤害
  wither: {
    id: 'wither',
    name: '枯萎',
    type: 'dot',
    damageByAttributePower: 10,
    stackable: true,
    duration: 3
  },

  // 心灵创伤 - 超能属性debuff
  psychic_wound: {
    id: 'psychic_wound',
    name: '心灵创伤',
    type: 'debuff',
    duration: 2
  },

  // 禁忌 - 全能力降低
  taboo: {
    id: 'taboo',
    name: '禁忌',
    type: 'debuff',
    stats: { attack: -2, spAtk: -2, defense: -2, spDef: -2, speed: -2 },
    duration: 2
  },

  // 精神噪音 - 禁止恢复HP
  psychic_noise: {
    id: 'psychic_noise',
    name: '精神噪音',
    type: 'debuff',
    healBlock: true,
    duration: 2
  },

  // 混乱 - 可能攻击自己
  confusion: {
    id: 'confusion',
    name: '混乱',
    type: 'debuff',
    selfAttackChance: 0.5,
    duration: 2
  },

  // 燃尽印记 - 延迟伤害
  combustion_mark: {
    id: 'combustion_mark',
    name: '燃尽印记',
    type: 'mark',
    delayedDamagePercent: 0.3,
    triggerTime: 'after_3_turns',
    duration: 3
  },

  // 预言标记 - 蓄力用
  prophecy_mark: {
    id: 'prophecy_mark',
    name: '预言标记',
    type: 'stack',
    stacks: 1,
    maxStacks: 99,
    duration: 999
  },

  // 静电标记
  static_mark: {
    id: 'static_mark',
    name: '静电标记',
    type: 'debuff',
    electricReflect: true,
    chargeOnHit: 1,
    duration: 3
  },

  // 寄生种子
  parasitic_seed: {
    id: 'parasitic_seed',
    name: '寄生种子',
    type: 'dot',
    drainPercent: 0.06,
    duration: 4
  },

  // 流沙地狱
  sand_tomb: {
    id: 'sand_tomb',
    name: '流沙地狱',
    type: 'debuff',
    stats: { speed: -2 },
    sandDamage: 15,
    duration: 3
  },

  // 龙之气息 - 蓄力用
  dragon_aura: {
    id: 'dragon_aura',
    name: '龙之气息',
    type: 'stack',
    stacks: 1,
    maxStacks: 99,
    duration: 999
  },

  // ========== 特殊状态==========

  // 火盾状态
  fire_shield: {
    id: 'fire_shield',
    name: '火盾',
    type: 'special',
    damageReduction: 0.55,
    burnOnHit: true,
    duration: 1
  },

  // 烈火护体状态
  wall_of_flames: {
    id: 'wall_of_flames',
    name: '烈火护体',
    type: 'special',
    damageReduction: 0.7,
    nextFirePowerBoost: 40,
    duration: 1
  },

  // 免疫地面攻击（挖洞）
  underground: {
    id: 'underground',
    name: '地下',
    type: 'special',
    immuneGround: true,
    nextTurnPriority: true,
    duration: 1
  },

  // 灵镜反照状态
  mirror_reflect: {
    id: 'mirror_reflect',
    name: '灵镜反照',
    type: 'special',
    reflectDamage: 1.8,
    preserveOnMiss: true,
    duration: 1
  }
};
