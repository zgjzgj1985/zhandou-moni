// 技能数据 - 结构化定义
const SKILLS_DB = {
  fire: {
    name: '火属性', color: '#ff453a',
    attack: [
      { id: 'ember', name: '点燃', e: 1, t: '单体敌人', eff: '对目标施加灼烧（5层）【每层2%最大HP伤害，层数减半】', effects: [
        { type: 'add_status', statusId: 'burn', stacks: 5 }
      ], tags: ['火', '爆发流', '灼烧']},
      { id: 'flame_punch', name: '烈焰拳', e: 2, t: '单体敌人', p: '25×3', eff: '连续3次火属性攻击（共75威力），每次命中50%概率灼烧（2层）【每层2%最大HP伤害，层数减半】', effects: [
        { type: 'multi_hit', hits: 3, damage: 25, burnChance: 0.5, burnStacks: 2 }
      ], tags: ['火', '爆发流', '灼烧', '多段攻击', '连击3次']},
      { id: 'flame_impact', name: '火焰冲击', e: 2, t: '单体敌人', p: 40, eff: '威力40，清除目标1个增益', effects: [
        { type: 'damage' },
        { type: 'remove_buff', count: 1 }
      ], tags: ['火', '爆发流', '增益清除']},
      { id: 'flare_blitz', name: '大字爆炎', e: 4, t: '单体敌人', p: 120, eff: '攻击单体目标，造成120威力火属性伤害，必定附加「灼伤印记」（每次行动前受到自身20威力火属性伤害）', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'burn_mark' }
      ], tags: ['火', '爆发流', '高威力', '灼伤印记']},
      { id: 'overheat', name: '过热', e: 4, t: '单体敌人', p: 130, eff: '威力130，使用后自身陷入虚弱状态', effects: [
        { type: 'damage' },
        { type: 'self_debuff', statusId: 'weakness' }
      ], tags: ['火', '爆发流', '高威力', '自残']},
      { id: 'explosion_flame', name: '爆炸烈焰', e: 5, t: '单体敌人', p: '25×6', eff: '蓄力1回合后发动，造成150威力火属性伤害，必定灼烧（4层）【每层2%最大HP伤害，层数减半】【蓄力可被打断】', effects: [
        { type: 'multi_hit', hits: 6, damage: 25, alwaysBurn: true, burnStacks: 1 }
      ], tags: ['火', '爆发流', '终极', '蓄力', '必定灼烧']}
    ],
    defense: [
      { id: 'fire_shield', name: '火盾', e: 1, t: '自身', eff: '受到伤害降低55%，本回合受伤时攻击者附加灼烧', effects: [
        { type: 'add_status', statusId: 'fire_shield' }
      ], tags: ['火', '爆发流', '减伤', '灼烧']},
      { id: 'wall_of_flames', name: '烈火护体', e: 3, t: '自身', eff: '受到伤害降低70%，本回合下次火攻必定暴击', effects: [
        { type: 'add_status', statusId: 'wall_of_flames' }
      ], tags: ['火', '爆发流', '减伤', '暴击强化']}
    ],
    support: [
      { id: 'flame_charge', name: '蓄焰', e: 2, t: '己方单体', eff: '为己方单体施加蓄焰（持续3回合），下次火属性攻击威力+50%', effects: [
        { type: 'add_status', statusId: 'flame_charge' }
      ], tags: ['火', '爆发流', '增伤']},
      { id: 'combustion', name: '燃尽', e: 4, t: '单体敌人', eff: '指定敌人施加「燃尽印记」（3回合后扣除30%当前HP）', effects: [
        { type: 'add_status', statusId: 'combustion_mark' }
      ], tags: ['火', '爆发流', '延迟伤害']},
      { id: 'flame_will', name: '炎之意志', e: 5, t: '己方全体', eff: '为己方全体施加炎之意志（持续2回合）：攻击+1级，速度+1级，火属性伤害+15%', effects: [
        { type: 'buff_all', stats: { attack: 1, speed: 1 }, fireDamageBoost: 0.25 }
      ], duration: 2, tags: ['火', '爆发流', '群体强化', '终极']}
    ]
  },
  water: {
    name: '水属性', color: '#0a84ff',
    attack: [
      { id: 'water_jet', name: '水流冲击', e: 2, t: '单体敌人', p: 60, eff: '攻击单体目标，造成60威力水属性伤害，附加「潮湿」（受到电属性攻击时额外承受30%伤害）', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'water_soak', stacks: 1 }
      ], tags: ['水', '控制流', '潮湿']},
      { id: 'hydro_pump', name: '水炮', e: 3, t: '单体敌人', p: 90, eff: '攻击单体目标，造成90威力水属性伤害，使目标减速（速度-1级，持续2回合）', effects: [
        { type: 'damage' },
        { type: 'self_debuff', statusId: 'weakness' }
      ], tags: ['水', '控制流', '减速']},
      { id: 'water_bullet', name: '水弹', e: 3, t: '单体敌人', p: '35×2', priority: 1, eff: '威力35×2，优先度+1', effects: [
        { type: 'multi_hit', hits: 2, damage: 35, priority: 1 }
      ], tags: ['水', '控制流', '先手']},
      { id: 'abyss_vortex', name: '深渊漩涡', e: 5, t: '单体敌人', p: 120, eff: '蓄力1回合后发动，造成120威力水属性伤害并附加湍流（湍流：所有技能消耗+1）【蓄力可被打断】', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'drowning' }
      ], tags: ['水', '控制流', '蓄力']},
      { id: 'scald', name: '热水', e: 3, t: '单体敌人', p: 80, eff: '威力80，30%概率附加蒸汽灼伤', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'steam_burn', chance: 0.3, stacks: 1 }
      ], tags: ['水', '控制流', '灼烧']},
      { id: 'muddy_water', name: '浊流', e: 3, t: '单体敌人', p: 90, eff: '威力90，30%概率给目标附加浑浊', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'muddy', chance: 0.3, stacks: 1 }
      ], tags: ['水', '控制流', '命中率降低']},
      { id: 'surge', name: '冲浪', e: 4, t: '敌方全体', p: 80, eff: '威力80，全体攻击', effects: [
        { type: 'damage_all' }
      ], tags: ['水', '控制流', '全体攻击']}
    ],
    defense: [
      { id: 'water_guard', name: '水之守护', e: 2, t: '自身', eff: '受到伤害降低70%', effects: [
        { type: 'add_status', statusId: 'water_guard' }
      ], tags: ['水', '控制流', '减伤']},
      { id: 'spring_shield', name: '清泉护盾', e: 3, t: '自身', eff: '每回合回复10%HP并清除1个负面状态，持续3回合', effects: [
        { type: 'add_status', statusId: 'clear_spring' }
      ], tags: ['水', '控制流', '持续治疗', '净化']}
    ],
    support: [
      { id: 'heal_wave', name: '治愈波动', e: 1, t: '己方单体', eff: '治疗己方单体目标，恢复量相当于最大HP的25%', effects: [
        { type: 'heal', percent: 25 }
      ], tags: ['水', '控制流', '治疗']},
      { id: 'water_heal', name: '水疗之术', e: 3, t: '己方全体', eff: '治疗己方全体目标（恢复15%HP），并使全体获得流水状态（速度+1级）', effects: [
        { type: 'heal', percent: 15 },
        { type: 'add_status', statusId: 'flow' }
      ], tags: ['水', '控制流', '群体治疗', '加速']},
      { id: 'rainy_day', name: '雨天', e: 8, t: '所有', eff: '创造雨天环境，水属性威力+50%，持续3回合', effects: [
        { type: 'add_status', statusId: 'rainy_day' }
      ], tags: ['水', '控制流', '天气', '终极']}
    ]
  },
  grass: {
    name: '草属性', color: '#34c759',
    attack: [
      { id: 'fiber_weave', name: '纤维化', e: 2, t: '单体敌人', p: 40, eff: '攻击单体目标，造成55威力草属性伤害，获得1层藤蔓之力（每层+1级攻击）', effects: [
        { type: 'damage' },
        { type: 'self_buff', stats: { grass_power: 60 } }
      ], tags: ['草', '光环流', '层数叠加']},
      { id: 'leaf_beam', name: '叶绿光束', e: 3, t: '单体敌人', p: 80, eff: '攻击单体目标，造成70威力草属性伤害，附加叶片标记（受到草属性攻击时+20%伤害）', effects: [
        { type: 'damage', condition: 'fragrant_environment', extraEffect: { type: 'add_status', statusId: 'wither', stacks: 1 } }
      ], tags: ['草', '光环流', '标记', '增伤']},
      { id: 'bloom_dance', name: '绽放之舞', e: 3, t: '单体敌人', p: 90, eff: '威力90，必定暴击', effects: [
        { type: 'damage', guaranteedCrit: true }
      ], tags: ['草', '光环流', '必定暴击']},
      { id: 'splendor', name: '韶光', e: 8, t: '单体敌人', p: 140, eff: '蓄力1回合后发动，消耗所有增益层造成伤害（每层+30%伤害）【终极爆发技能】', effects: [
        { type: 'damage', extraDamageIfEnvironment: 0.2 },
        { type: 'add_status', statusId: 'fragrant_environment', condition: 'no_environment' }
      ], tags: ['草', '光环流', '蓄力', '终极']},
      { id: 'solar_detonation', name: '光能爆轰', e: 2, t: '单体敌人', p: '100+60×层', eff: '威力100+60×光能汇聚层数', effects: [
        { type: 'damage_consume_stacks', statusId: 'light_gather', baseDamage: 100, damagePerStack: 60 }
      ], tags: ['草', '光环流', '层数加成']}
    ],
    defense: [
      { id: 'root_bound', name: '扎根之躯', e: 2, t: '自身', eff: '每回合回复最大HP的8%，但速度-1级，持续3回合', effects: [
        { type: 'add_status', statusId: 'root_bound' }
      ], tags: ['草', '光环流', '持续回复']},
      { id: 'vine_armor', name: '藤蔓护甲', e: 2, t: '自身', eff: '受到伤害降低50%，受到攻击缠绕目标（速度-2级）', effects: [
        { type: 'add_status', statusId: 'entangle_on_hit' }
      ], tags: ['草', '光环流', '减伤', '缠绕']},
      { id: 'grass_counter_stance', name: '防反之姿', e: 2, t: '自身', eff: '获得防反之姿，反弹60%伤害', effects: [
        { type: 'add_status', statusId: 'counter_stance' }
      ], tags: ['草', '光环流', '反击', '反弹']}
    ],
    support: [
      { id: 'fragrant_bloom', name: '芬芳绽放', e: 8, t: '己方全体', eff: '创造芬芳环境，草属性伤害+25%，全体每回合回复5%HP', effects: [
        { type: 'add_status', statusId: 'fragrant_environment' }
      ], tags: ['草', '光环流', '环境', '终极']},
      { id: 'light_gather', name: '光能聚集', e: 1, t: '自身', eff: '获得1层光能汇聚状态', effects: [
        { type: 'add_status', statusId: 'light_gather', stacks: 1 }
      ], tags: ['草', '光环流', '层数叠加']},
      { id: 'parasitic_seed', name: '寄生之种', e: 3, t: '单体敌人', eff: '攻击单体目标，造成50威力草属性伤害，附加寄生（每回合敌人受伤+施法者回复）', effects: [
        { type: 'add_status', statusId: 'parasitic_seed' }
      ], tags: ['草', '光环流', '持续伤害', '吸血']},
      { id: 'nutrient_absorption', name: '养分汲取', e: 3, t: '己方单体', eff: '回复己方单体20%HP，获得4点能量', effects: [
        { type: 'heal', percent: 20 },
        { type: 'energy_gain', amount: 4 }
      ], tags: ['草', '光环流', '治疗', '能量回复']}
    ]
  },
  ice: {
    name: '冰属性', color: '#64d2ff',
    attack: [
      { id: 'ice_shot', name: '冰晶射击', e: 1, t: '单体敌人', p: 35, eff: '如闪电般快速的射击，造成40威力冰属性伤害，15%概率冻结目标，先手攻击', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'frost', stacks: 1 }
      ], tags: ['冰', '冻结破冰流', '先手', '冻结']},
      { id: 'frost_breath', name: '霜冻之息', e: 2, t: '单体敌人', p: 50, eff: '喷吐刺骨寒气，造成60威力冰属性伤害，25%概率使目标冻结', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'frost_mark' }
      ], tags: ['冰', '冻结破冰流', '冻结']},
      { id: 'ice_shard', name: '冰片', e: 3, t: '单体敌人', p: '20×3', eff: '威力20×3连击，获得1层冰霜', effects: [
        { type: 'multi_hit', hits: 3, damage: 20 },
        { type: 'add_status', statusId: 'frost', stacks: 1 }
      ], tags: ['冰', '冻结破冰流', '多段攻击']},
      { id: 'ice_explosion', name: '冰爆', e: 5, t: '单体敌人', p: 130, eff: '毁灭性斩击，威力130，目标冰冻时伤害×3', effects: [
        { type: 'damage', tripleIfFrozen: true }
      ], tags: ['冰', '冻结破冰流', '破冰', '爆发']}
    ],
    defense: [
      { id: 'frost_armor', name: '冰霜护甲', e: 2, t: '自身', eff: '生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者冻结1回合', effects: [
        { type: 'add_status', statusId: 'frost_armor' }
      ], tags: ['冰', '冻结破冰流', '减伤', '反击冻结']},
      { id: 'ice_wall', name: '冰墙', e: 3, t: '己方单体', eff: '创造冰墙屏障（持续2回合），本回合获得50%闪避，存在期间敌方攻击有25%概率被格挡', effects: [
        { type: 'shield', amount: 50 }
      ], tags: ['冰', '冻结破冰流', '闪避', '格挡', '地形']}
    ],
    support: [
      { id: 'cold_aura', name: '寒气凝聚', e: 1, t: '己方单体', eff: '为己方单体赋予寒气凝聚，速度+2级（持续3回合）', effects: [
        { type: 'buff', stats: { defense: 1 } }
      ], duration: 2, tags: ['冰', '冻结破冰流', '加速']},
      { id: 'frost_mark', name: '冰霜印记', e: 1, t: '单体敌人', eff: '为目标施加冰霜印记（持续3回合），下次受到冰属性攻击时冻结概率+30%', effects: [
        { type: 'add_status', statusId: 'frost_mark' }
      ], tags: ['冰', '冻结破冰流', '冻结强化', '印记']},
      { id: 'frozen_land', name: '冻土', e: 5, t: '己方全体', eff: '创造永冻领域（持续3回合）：敌方全体每次行动后40%概率冻结，已冻结目标进入绝对冻结（3回合/0%自解）【终极领域】', effects: [
        { type: 'add_status', statusId: 'frozen_land' }
      ], tags: ['冰', '冻结破冰流', '领域', '群体冻结', '终极']}
    ]
  },
  ground: {
    name: '地属性', color: '#ac8e77',
    attack: [
      { id: 'magnitude', name: '震级', e: '1-5', t: '敌方全体', p: '1-150随机', eff: '威力1-150随机，全体攻击', effects: [
        { type: 'damage_random' }
      ], tags: ['地', '盾反流', '随机伤害']},
      { id: 'earth_power', name: '大地之力', e: 3, t: '单体敌人', p: 90, eff: '攻击单体目标，造成85威力地属性伤害，使目标护盾效果-30%', effects: [
        { type: 'damage' },
        { type: 'self_buff', stats: { spAtk: 1 } }
      ], tags: ['地', '盾反流', '护盾削弱']},
      { id: 'earthquake', name: '地震', e: 4, t: '敌方全体', p: 85, eff: '威力85全体攻击，敌方全体速度-1级', effects: [
        { type: 'damage_all' },
        { type: 'debuff_all', stats: { speed: -1 } }
      ], tags: ['地', '盾反流', '全体攻击', '减速']},
      { id: 'drill_run', name: '直冲钻', e: 3, t: '单体敌人', p: 80, eff: '威力80，必定命中', effects: [
        { type: 'damage', alwaysHit: true }
      ], tags: ['地', '盾反流', '必定命中']},
      { id: 'bone_rush', name: '骨棒乱打', e: 2, t: '单体敌人', p: '25×2', eff: '威力25×2连击', effects: [
        { type: 'multi_hit', hits: 2, damage: 25 }
      ], tags: ['地', '盾反流', '多段攻击']}
    ],
    defense: [
      { id: 'sandstorm', name: '沙暴降临', e: 3, t: '所有', eff: '创造沙暴环境，地面钢龙属性防御+50%，持续3回合', effects: [
        { type: 'add_status', statusId: 'sandstorm' }
      ], tags: ['地', '盾反流', '天气', '天气流']},
      { id: 'dig', name: '挖洞', e: 2, t: '自身', eff: '进入地下状态，免疫地面攻击，下回合优先行动', effects: [
        { type: 'add_status', statusId: 'underground' }
      ], tags: ['地', '盾反流', '免疫', '先手']},
      { id: 'sand_tomb', name: '流沙地狱', e: 3, t: '单体敌人', eff: '给目标附加流沙地狱状态（速度-2级，每回合15威力伤害，持续3回合）', effects: [
        { type: 'add_status', statusId: 'sand_tomb' }
      ], tags: ['地', '盾反流', '减速', '持续伤害']}
    ],
    support: [
      { id: 'mud_sport', name: '玩泥巴', e: 2, t: '自身', eff: '自身特攻+1、防御+1、速度+1', effects: [
        { type: 'buff_self', stats: { spAtk: 1, defense: 1, speed: 1 } }
      ], tags: ['地', '盾反流', '自身强化']},
      { id: 'sand_attack', name: '泼沙', e: 1, t: '单体敌人', eff: '目标命中-1级', effects: [
        { type: 'debuff', stats: { accuracy: -1 } }
      ], tags: ['地', '盾反流', '命中率降低']},
      { id: 'cultivate', name: '耕地', e: 3, t: '己方全体', eff: '全体回复25%HP，清除所有减益', effects: [
        { type: 'heal', percent: 25 },
        { type: 'remove_debuff_all' }
      ], tags: ['地', '盾反流', '群体治疗', '净化']}
    ]
  },
  electric: {
    name: '电属性', color: '#ffd60a',
    attack: [
      { id: 'zap_strike', name: '电光一闪', e: 1, t: '单体敌人', p: 45, priority: 1, eff: '如闪电般快速的斩击，造成45威力伤害，35%概率使目标麻痹（持续1回合无法使用攻击技能），先手攻击', effects: [
        { type: 'damage', priority: 1 }
      ], tags: ['电', '多段伤害流', '先手', '麻痹']},
      { id: 'thunder_strike', name: '雷鸣击', e: 3, t: '单体敌人', p: 90, eff: '威力90，30%概率麻痹', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'paralysis', chance: 0.3 }
      ], tags: ['电', '多段伤害流', '麻痹']},
      { id: 'electromagnetic_pulse', name: '电磁脉冲', e: 4, t: '单体敌人', p: 60, eff: '威力60+20×蓄电层数', effects: [
        { type: 'damage_consume_stacks', statusId: 'charge_stacks', baseDamage: 60, damagePerStack: 20 }
      ], tags: ['电', '多段伤害流', '层数加成']}
    ],
    defense: [
      { id: 'static_charge', name: '蓄电护体', e: 2, t: '自身', eff: '获得蓄电状态，受伤减50%，获得2层蓄电', effects: [
        { type: 'add_status', statusId: 'static_charge' }
      ], tags: ['电', '连击流', '减伤', '蓄电']},
      { id: 'electric_deflect', name: '电磁偏转', e: 3, t: '自身', eff: '获得电磁偏转状态，70%闪避并反击20伤害', effects: [
        { type: 'add_status', statusId: 'electric_deflect' }
      ], tags: ['电', '连击流', '闪避', '反弹']}
    ],
    support: [
      { id: 'charge_accelerate', name: '充能加速', e: 2, t: '己方单体', eff: '为己方单体获得2层蓄电状态', effects: [
        { type: 'add_status', statusId: 'charge_stacks', stacks: 2 }
      ], tags: ['电', '多段伤害流', '加速']},
      { id: 'electric_field', name: '电场展开', e: 3, t: '己方全体', eff: '创造电场环境，蓄电技能充能速度×2', effects: [
        { type: 'add_status', statusId: 'electric_field' }
      ], tags: ['电', '多段伤害流', '环境']},
      { id: 'static_mark', name: '静电标记', e: 1, t: '单体敌人', eff: '给目标附加静电标记，被攻击时给攻击者充能', effects: [
        { type: 'add_status', statusId: 'static_mark' }
      ], tags: ['电', '多段伤害流', '标记']}
    ]
  },
  psychic: {
    name: '超能属性', color: '#ec407a',
    attack: [
      { id: 'mind_pierce', name: '迷心刺', e: 2, t: '单体敌人', p: 60, eff: '威力60，获得1层预言标记，附加心灵创伤', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'prophecy_mark', stacks: 1 },
        { type: 'add_status', statusId: 'psychic_wound' }
      ], tags: ['超能', '奥秘流', '标记']},
      { id: 'psychic_hit', name: '精神冲击', e: 3, t: '单体敌人', p: 80, eff: '威力80，无视护盾', effects: [
        { type: 'damage_ignore_shield' }
      ], tags: ['超能', '奥秘流', '无视护盾']},
      { id: 'stored_power', name: '存储力量', e: 3, t: '单体敌人', p: '20+20×层', eff: '威力20+20×预言标记层数', effects: [
        { type: 'damage_consume_stacks', statusId: 'prophecy_mark', baseDamage: 20, damagePerStack: 20 }
      ], tags: ['超能', '奥秘流', '层数加成']},
      { id: 'void_prophecy', name: '虚空预言', e: 5, t: '单体敌人', p: 140, eff: '威力140，蓄力1回合，附加禁忌状态', effects: [
        { type: 'damage', chargeTurns: 1 },
        { type: 'add_status', statusId: 'taboo' }
      ], tags: ['超能', '奥秘流', '蓄力']},
      { id: 'future_sight', name: '预知未来', e: 5, t: '单体敌人', p: 120, eff: '3回合后造成120威力伤害，附加禁忌状态', effects: [
        { type: 'delayed_damage', turns: 3, damage: 120 },
        { type: 'add_status', statusId: 'taboo' }
      ], tags: ['超能', '奥秘流', '延迟伤害']}
    ],
    defense: [
      { id: 'mind_shield', name: '心智护盾', e: 2, t: '自身', eff: '获得心智护盾状态', effects: [
        { type: 'add_status', statusId: 'mind_shield' }
      ], tags: ['超能', '奥秘流', '护盾']},
      { id: 'mirror_reflect', name: '灵镜反照', e: 3, t: '自身', eff: '获得灵镜状态，反弹180%伤害，即使未命中也保留', effects: [
        { type: 'add_status', statusId: 'mirror_reflect' }
      ], tags: ['超能', '奥秘流', '反弹']},
      { id: 'mist_body', name: '迷雾之躯', e: 2, t: '自身', eff: '获得迷雾之躯状态，70%闪避，闪避后速度+1级', effects: [
        { type: 'add_status', statusId: 'mist_body' }
      ], tags: ['超能', '奥秘流', '闪避']}
    ],
    support: [
      { id: 'psychic_terrain', name: '精神场地', e: 8, t: '己方全体', eff: '创造精神场地，超能属性威力+30%，保护己方免受优先度攻击', effects: [
        { type: 'add_status', statusId: 'psychic_terrain' }
      ], tags: ['超能', '奥秘流', '环境', '终极']},
      { id: 'psycho_shift', name: '精神转移', e: 2, t: '单体敌人', eff: '将自身减益转移给目标', effects: [
        { type: 'transfer_debuff' }
      ], tags: ['超能', '奥秘流', '转移减益']},
      { id: 'psychic_noise', name: '精神噪音', e: 3, t: '单体敌人', eff: '给目标附加精神噪音，禁止回复HP', effects: [
        { type: 'add_status', statusId: 'psychic_noise' }
      ], tags: ['超能', '奥秘流', '禁止治疗']},
      { id: 'heal_pulse', name: '治愈波动', e: 3, t: '己方单体', eff: '回复己方单体50%HP', effects: [
        { type: 'heal', percent: 50 }
      ], tags: ['超能', '奥秘流', '治疗']},
      { id: 'mind_sync', name: '心智同步', e: 3, t: '己方单体', eff: '与己方单体交换增益状态', effects: [
        { type: 'swap_buffs' }
      ], tags: ['超能', '奥秘流', '交换增益']},
      { id: 'fate_weave', name: '命运编织', e: 6, t: '单体敌人', eff: '3回合后造成100威力真实伤害，附加禁忌状态', effects: [
        { type: 'delayed_damage', turns: 3, damage: 100, trueDamage: true },
        { type: 'add_status', statusId: 'taboo' }
      ], tags: ['超能', '奥秘流', '延迟伤害', '终极']}
    ]
  },
  dragon: {
    name: '龙属性', color: '#bf5af2',
    attack: [
      { id: 'dragon_breath_burn', name: '龙息灼烧', e: 3, t: '敌方全体', p: 50, eff: '威力50全体攻击，附加灼烧（2层）', effects: [
        { type: 'damage_all' },
        { type: 'add_status', statusId: 'burn', stacks: 2, duration: 2 }
      ], tags: ['龙', '龙之魂流', '全体攻击', '灼烧']},
      { id: 'dragon_scale_strike', name: '龙鳞连击', e: 1, t: '单体敌人', p: '20×3', eff: '威力20×3连击，自身速度+1级', effects: [
        { type: 'multi_hit', hits: 3, damage: 20, selfSpeedBoost: 1 }
      ], tags: ['龙', '龙之魂流', '多段攻击', '加速']},
      { id: 'dragon_wave', name: '龙之波动', e: 2, t: '单体敌人', p: 80, eff: '攻击单体目标，造成45威力龙属性伤害，无特效', effects: [
        { type: 'damage' }
      ], tags: ['龙', '龙之魂流', '无特效']},
      { id: 'dragon_awe', name: '龙之碾压', e: 3, t: '单体敌人', p: 60, eff: '威力60，根据目标HP提升伤害', effects: [
        { type: 'damage_scale_hp' }
      ], tags: ['龙', '龙之魂流', 'HP相关']},
      { id: 'dragon_end', name: '龙之终焉', e: 4, t: '单体敌人', p: 100, eff: '威力100，附加混乱状态', effects: [
        { type: 'damage' },
        { type: 'add_status', statusId: 'confusion' }
      ], tags: ['龙', '龙之魂流', '混乱']},
      { id: 'meteor_fall', name: '流星陨落', e: 5, t: '单体敌人', p: 150, eff: '威力150，自身攻击-2级、特攻-2级', effects: [
        { type: 'damage' },
        { type: 'self_debuff', stats: { attack: -2, spAtk: -2 } }
      ], tags: ['龙', '龙之魂流', '高威力', '自残']}
    ],
    defense: [
      { id: 'dragon_guard', name: '龙鳞守护', e: 2, t: '自身', eff: '获得龙鳞守护状态', effects: [
        { type: 'add_status', statusId: 'dragon_guard' }
      ], tags: ['龙', '龙之魂流', '护盾']},
      { id: 'dragon_resonance_extreme', name: '龙属共鸣·极', e: 4, t: '自身', eff: '消耗所有龙息层数，每层造成15伤害+10护盾+10%防御', effects: [
        { type: 'consume_all_stacks', statusId: 'dragon_aura', effects: { damage: 15, shield: 10, defense: 0.1 } }
      ], tags: ['龙', '龙之魂流', '消耗共鸣']}
    ],
    support: [
      { id: 'dragon_blood_awaken', name: '血脉觉醒', e: 2, t: '自身', eff: '获得2层龙息状态，下次攻击必定暴击', effects: [
        { type: 'add_status', statusId: 'dragon_aura', stacks: 2 },
        { type: 'self_buff', guaranteedCrit: true }
      ], tags: ['龙', '龙之魂流', '必定暴击']},
      { id: 'dragon_resonance', name: '龙属共鸣', e: 0, t: '被动', eff: '被动：队友使用龙属性技能时获得1层龙息', effects: [
        { type: 'passive', trigger: 'ally_dragon_action', effect: { type: 'add_status', statusId: 'dragon_aura', stacks: 1 } }
      ], tags: ['龙', '龙之魂流', '被动']},
      { id: 'dragon_intimidate', name: '龙威震慑', e: 2, t: '敌方全体', eff: '敌方全体攻击-1级、速度-1级，持续2回合', effects: [
        { type: 'debuff_all', stats: { attack: -1, speed: -1 } }
      ], duration: 2, tags: ['龙', '龙之魂流', '群体弱化']},
      { id: 'dragon_banish', name: '龙之驱逐', e: 2, t: '单体敌人', eff: '与目标交换位置', effects: [
        { type: 'swap_position' }
      ], tags: ['龙', '龙之魂流', '位置交换']}
    ]
  }
};
