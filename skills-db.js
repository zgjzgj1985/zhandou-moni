// ===========================================================
// skills-db.js
// 由 scripts/generate-skills-db.ts 自动生成，请勿手动修改
// 生成时间: 2026-05-29T06:30:46.403Z
// 数据来源: src/skills/*.ts
// ===========================================================

const SKILLS_DB = {
  "fire": {
    "name": "火属性",
    "color": "#ff453a",
    "attack": [
      {
        "id": "ember",
        "name": "点燃",
        "e": 1,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "对目标施加灼烧（5层）【每层2%最大HP伤害，层数减半】",
        "effects": [
          {
            "type": "add_status",
            "statusId": "burn",
            "stacks": 5,
            "successRate": 1
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "灼烧"
        ]
      },
      {
        "id": "flame_punch",
        "name": "烈焰拳",
        "e": 2,
        "t": "单体敌人",
        "p": "25×3",
        "damageType": "physical",
        "eff": "连续3次物理攻击（共75威力），攻击结束后50%概率灼烧（2层）【每层2%最大HP伤害，层数减半】",
        "effects": [
          {
            "type": "multi_hit",
            "hits": 3,
            "damage": 25
          },
          {
            "type": "add_status",
            "statusId": "burn",
            "stacks": 2,
            "successRate": 0.5
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "灼烧",
          "物理伤害",
          "连击3次"
        ]
      },
      {
        "id": "flare_blitz",
        "name": "大字爆炎",
        "e": 4,
        "t": "单体敌人",
        "p": 120,
        "damageType": "special",
        "eff": "攻击单体目标，造成120威力特殊伤害，并附加「灼伤印记」（下回合追加40威力特殊伤害）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "burn_mark"
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "高威力",
          "灼伤印记"
        ]
      },
      {
        "id": "explosion_flame",
        "name": "爆炸烈焰",
        "e": 5,
        "t": "单体敌人",
        "p": "25×6",
        "damageType": "special",
        "eff": "6段物理攻击（共150威力），每次命中必定灼烧（每次1层）【每层2%最大HP伤害，层数减半】",
        "effects": [
          {
            "type": "multi_hit",
            "hits": 6,
            "damage": 25
          },
          {
            "type": "add_status",
            "statusId": "burn",
            "stacks": 1,
            "successRate": 1
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "终极",
          "多段伤害",
          "必定灼烧"
        ]
      },
      {
        "id": "overheat",
        "name": "过热",
        "e": 4,
        "t": "单体敌人",
        "p": 130,
        "damageType": "special",
        "eff": "释放全身热量，造成130威力特殊伤害。使用后自身特攻-2级（持续3回合）【高代价高回报】",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "overheat_penalty"
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "高威力",
          "代价机制",
          "特攻下降"
        ]
      },
      {
        "id": "flame_impact",
        "name": "火焰冲击",
        "e": 2,
        "t": "单体敌人",
        "p": 40,
        "damageType": "physical",
        "eff": "火焰冲击目标，造成40威力物理伤害，并清除目标1层增益状态【对策技】",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "cleanse_target_buff",
            "value": 1
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "攻击",
          "对策技",
          "清除增益",
          "物理伤害"
        ]
      }
    ],
    "defense": [
      {
        "id": "fire_shield_skill",
        "name": "火盾",
        "e": 1,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "受到伤害降低55%，本回合受伤时攻击者附加灼烧",
        "effects": [
          {
            "type": "add_status",
            "statusId": "fire_shield"
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "防御",
          "减伤",
          "灼烧"
        ]
      },
      {
        "id": "wall_of_flames",
        "name": "烈火护体",
        "e": 3,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "受到伤害降低70%，下次火属性攻击威力+40",
        "effects": [
          {
            "type": "add_status",
            "statusId": "flame_body"
          },
          {
            "type": "special",
            "specialType": "extra_attack_damage",
            "value": 40
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "防御",
          "减伤",
          "火攻强化"
        ],
        "cooldown": 1
      }
    ],
    "support": [
      {
        "id": "flame_charge_skill",
        "name": "蓄焰",
        "e": 2,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "为己方单体施加「蓄焰」（持续3回合），下次火属性攻击威力+（自身能量×10）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "flame_charge"
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "辅助",
          "能量增伤",
          "爆发准备"
        ]
      },
      {
        "id": "combustion",
        "name": "燃尽",
        "e": 4,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "指定敌人施加「燃尽印记」，3回合后扣除30%当前HP【延迟伤害】",
        "effects": [
          {
            "type": "add_status",
            "statusId": "combustion_mark",
            "stacks": 1
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "辅助",
          "延迟伤害",
          "百分比伤害"
        ]
      },
      {
        "id": "blaze_will",
        "name": "炎之意志",
        "e": 5,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "为己方全体施加「炎之意志」（持续2回合）：攻击+1级，速度+1级，火属性伤害+25%",
        "effects": [
          {
            "type": "add_status",
            "statusId": "blaze_will"
          },
          {
            "type": "debuff",
            "stat": "attack",
            "stages": 1
          },
          {
            "type": "debuff",
            "stat": "speed",
            "stages": 1
          }
        ],
        "tags": [
          "火",
          "爆发流",
          "辅助",
          "群体强化",
          "终极技能"
        ]
      }
    ]
  },
  "water": {
    "name": "水属性",
    "color": "#0a84ff",
    "attack": [
      {
        "id": "water_jet",
        "name": "水流冲击",
        "e": 2,
        "t": "单体敌人",
        "p": 60,
        "damageType": "special",
        "eff": "攻击单体目标，造成60威力特殊伤害，目标获得「浸透」（特防-1级/层，最多6层，持续2回合）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "water_soak",
            "stacks": 1
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "削弱",
          "浸透"
        ]
      },
      {
        "id": "hydro_pump",
        "name": "水炮",
        "e": 3,
        "t": "单体敌人",
        "p": 150,
        "damageType": "special",
        "eff": "攻击单体目标，造成150威力特殊伤害，自身获得「虚弱」（下一回合无法使用技能）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "self_debuff",
            "statusId": "weakness",
            "stacks": 1
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "高威力",
          "虚弱代价"
        ]
      },
      {
        "id": "water_bullet",
        "name": "水弹",
        "e": 3,
        "t": "单体敌人",
        "p": "35×2",
        "damageType": "physical",
        "eff": "攻击单体目标，造成35×2威力特殊伤害（多段），先手+1",
        "effects": [
          {
            "type": "multi_hit",
            "hits": 2,
            "damage": 35
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "多段伤害",
          "先手",
          "物理"
        ]
      },
      {
        "id": "abyss_vortex",
        "name": "漩涡",
        "e": 5,
        "t": "单体敌人",
        "p": 120,
        "damageType": "physical",
        "eff": "造成120威力物理伤害，附加「溺水」（下一次能量消耗>3的技能伤害-30%）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "drowning",
            "stacks": 1
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "能量压制",
          "物理"
        ]
      },
      {
        "id": "scald",
        "name": "热水",
        "e": 3,
        "t": "单体敌人",
        "p": 80,
        "damageType": "physical",
        "eff": "攻击单体目标，造成80威力物理伤害，30%概率使目标陷入「蒸汽灼伤」状态（每回合损失2%最大HP）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "steam_burn",
            "stacks": 1,
            "successRate": 0.3
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "灼烧",
          "概率触发",
          "物理"
        ]
      },
      {
        "id": "muddy_water",
        "name": "浊流",
        "e": 3,
        "t": "单体敌人",
        "p": 90,
        "damageType": "physical",
        "eff": "攻击单体目标，造成90威力物理伤害，30%概率使目标获得「浑浊」状态（命中率-1级/层，最多3层，持续3回合）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "muddy",
            "stacks": 1
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "命中降低",
          "概率触发",
          "物理"
        ]
      },
      {
        "id": "surge",
        "name": "冲浪",
        "e": 4,
        "t": "全体敌人",
        "p": 80,
        "damageType": "special",
        "eff": "攻击敌方全体目标，造成80威力特殊伤害",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "水",
          "控制流",
          "攻击",
          "群体伤害"
        ]
      }
    ],
    "defense": [
      {
        "id": "aqua_shield",
        "name": "水之守护",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "受到伤害降低70%（持续1回合），如果受到伤害，攻击者获得1层浸透（特防-1级/层，最多6层，持续2回合）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "defense_up"
          }
        ],
        "tags": [
          "水",
          "控制流",
          "防御",
          "减伤",
          "浸透"
        ]
      },
      {
        "id": "clear_spring",
        "name": "清泉护盾",
        "e": 3,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得「清泉」状态（持续3回合），每回合恢复10%HP并清除1个负面状态",
        "effects": [
          {
            "type": "add_status",
            "statusId": "clear_spring"
          },
          {
            "type": "special",
            "specialType": "cleanse",
            "value": 1
          }
        ],
        "tags": [
          "水",
          "控制流",
          "防御",
          "持续治疗",
          "净化"
        ]
      }
    ],
    "support": [
      {
        "id": "healing_wave",
        "name": "治愈波动",
        "e": 1,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "治疗己方单体目标，恢复量相当于最大HP的25%",
        "effects": [
          {
            "type": "heal",
            "percent": 0.0025
          }
        ],
        "tags": [
          "水",
          "控制流",
          "辅助",
          "治疗"
        ]
      },
      {
        "id": "aqua_therapy",
        "name": "水疗之术",
        "e": 3,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "治疗己方全体目标（恢复15%HP），并使全体获得「流水」状态（速度+1级，持续2回合）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "flow"
          },
          {
            "type": "heal",
            "percent": 0.0015
          }
        ],
        "tags": [
          "水",
          "控制流",
          "辅助",
          "群体治疗",
          "加速"
        ]
      },
      {
        "id": "rainy_day",
        "name": "雨天",
        "e": 8,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "创造雨天环境，所有生物水属性技能威力+50%（持续3回合）",
        "effects": [],
        "tags": [
          "水",
          "控制流",
          "辅助",
          "天气",
          "威力加成"
        ]
      }
    ]
  },
  "grass": {
    "name": "草属性",
    "color": "#34c759",
    "attack": [
      {
        "id": "fiber_weave",
        "name": "纤维化",
        "e": 2,
        "t": "单体敌人",
        "p": 40,
        "damageType": "physical",
        "eff": "攻击单体目标，造成40威力物理伤害，获得1层光能汇聚（下次草系输出技能+60威力）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "self_buff",
            "stats": {
              "grass_power": 60
            }
          }
        ],
        "tags": [
          "草",
          "光环流",
          "攻击",
          "光能汇聚",
          "物理"
        ]
      },
      {
        "id": "leaf_beam",
        "name": "叶绿光束",
        "e": 3,
        "t": "单体敌人",
        "p": 80,
        "damageType": "physical",
        "eff": "攻击单体目标，造成80威力物理伤害，若处于芬芳环境则附加1层枯萎（每回合受到自身属性10点威力特殊伤害/层）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "wither",
            "stacks": 1
          }
        ],
        "tags": [
          "草",
          "光环流",
          "攻击",
          "枯萎",
          "芬芳联动",
          "物理"
        ]
      },
      {
        "id": "bloom_dance",
        "name": "绽放之舞",
        "e": 3,
        "t": "单体敌人",
        "p": 90,
        "damageType": "physical",
        "eff": "攻击单体目标，造成90威力物理伤害，本回合必定暴击（×1.5）",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "攻击",
          "物理",
          "必定暴击"
        ]
      },
      {
        "id": "splendor",
        "name": "韶光",
        "e": 8,
        "t": "单体敌人",
        "p": 140,
        "damageType": "special",
        "eff": "攻击单体目标，造成140威力特殊伤害，召唤芬芳环境（持续4回合），已有环境时伤害+20%",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "fragrant_env"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "攻击",
          "芬芳环境",
          "高威力"
        ]
      },
      {
        "id": "solar_detonation",
        "name": "光能爆轰",
        "e": 2,
        "t": "单体敌人",
        "p": 100,
        "damageType": "special",
        "eff": "消耗所有光能汇聚层数，造成（100+60×层数）威力特殊伤害【消耗型终极技能】",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "攻击",
          "消耗光能",
          "终极技能"
        ]
      }
    ],
    "defense": [
      {
        "id": "root_bound",
        "name": "扎根之躯",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得扎根状态（持续3回合），每回合回复最大HP的8%，但速度-1级",
        "effects": [
          {
            "type": "add_status",
            "statusId": "root_bound"
          },
          {
            "type": "debuff",
            "stat": "speed",
            "stages": -1
          }
        ],
        "tags": [
          "草",
          "光环流",
          "防御",
          "持续回复",
          "速度降低"
        ]
      },
      {
        "id": "vine_armor",
        "name": "藤蔓护甲",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "本回合受到伤害降低50%，受到攻击时缠绕攻击者（速度-2级）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "vine_body"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "防御",
          "减伤",
          "缠绕"
        ]
      },
      {
        "id": "grass_counter_stance",
        "name": "防反之姿",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得防反状态（持续1回合），敌方攻击时反弹60%伤害，反弹后获得先手+1",
        "effects": [
          {
            "type": "add_status",
            "statusId": "counter_stance"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "防御",
          "反弹",
          "先手"
        ]
      }
    ],
    "support": [
      {
        "id": "fragrant_bloom",
        "name": "芬芳绽放",
        "e": 8,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "召唤芬芳环境（持续4回合）：己方草系技能伤害+25%，每回合回复5%HP",
        "effects": [
          {
            "type": "add_status",
            "statusId": "fragrant_env"
          }
        ],
        "tags": [
          "草",
          "光环流",
          "辅助",
          "芬芳环境",
          "群体增益"
        ]
      },
      {
        "id": "light_gather",
        "name": "光能聚集",
        "e": 1,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得1层光能汇聚（下次草系输出技能+60威力）【核心攒层技能】",
        "effects": [
          {
            "type": "self_buff",
            "stats": {
              "grass_power": 60
            }
          }
        ],
        "tags": [
          "草",
          "光环流",
          "辅助",
          "光能汇聚",
          "核心技能"
        ]
      },
      {
        "id": "parasitic_seed",
        "name": "寄生之种",
        "e": 3,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "对单体敌人施加寄生种子（每回合受到施法者HP的6%伤害+施法者回复，持续4回合）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "parasite",
            "stacks": 1
          }
        ],
        "tags": [
          "草",
          "光环流",
          "辅助",
          "持续伤害",
          "吸血"
        ]
      },
      {
        "id": "nutrient_absorption",
        "name": "养分汲取",
        "e": 3,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "为己方单体回复最大HP的20%，并使其获得4点能量",
        "effects": [
          {
            "type": "heal",
            "percent": 0.002
          },
          {
            "type": "add_status",
            "statusId": "nutrient",
            "value": 4
          }
        ],
        "tags": [
          "草",
          "光环流",
          "辅助",
          "治疗",
          "充能"
        ]
      }
    ]
  },
  "electric": {
    "name": "电属性",
    "color": "#ffd60a",
    "attack": [
      {
        "id": "zap_strike",
        "name": "电光一闪",
        "e": 1,
        "t": "单体敌人",
        "p": 45,
        "damageType": "physical",
        "eff": "如闪电般快速的斩击，必定先手攻击，造成45威力物理伤害，命中后积累1层电荷",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "priority",
            "value": 1
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "攻击",
          "先手+1",
          "物理",
          "蓄电"
        ]
      },
      {
        "id": "thunder_strike",
        "name": "雷鸣击",
        "e": 3,
        "t": "单体敌人",
        "p": 90,
        "damageType": "special",
        "eff": "释放强力电击，造成90威力特殊伤害，命中后积累1层电荷，30%概率使目标麻痹",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "paralysis",
            "stacks": 1
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "攻击",
          "麻痹",
          "控场"
        ]
      },
      {
        "id": "electromagnetic_pulse",
        "name": "电磁脉冲",
        "e": 4,
        "t": "单体敌人",
        "p": 60,
        "damageType": "physical",
        "eff": "释放电磁脉冲爆发！消耗所有电荷层数，造成60威力物理伤害，每消耗1层电荷，攻击次数+1",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "charge_consume",
            "value": 0
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "攻击",
          "终极技能",
          "爆发",
          "连击",
          "物理"
        ]
      }
    ],
    "defense": [
      {
        "id": "static_charge",
        "name": "蓄电护体",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "积蓄电能，获得50点护盾+积累2层电荷。本回合受到攻击时，攻击者获得1层静电",
        "effects": [
          {
            "type": "add_status",
            "statusId": "static_body"
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "防御",
          "护盾",
          "蓄电"
        ]
      },
      {
        "id": "electric_deflect",
        "name": "电磁偏转",
        "e": 3,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "启动电磁护盾，下一次受到攻击时70%概率闪避并造成40威力反击伤害",
        "effects": [
          {
            "type": "add_status",
            "statusId": "electric_deflect"
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "防御",
          "闪避",
          "反击"
        ]
      }
    ],
    "support": [
      {
        "id": "charge_accelerate",
        "name": "充能加速",
        "e": 2,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "为目标积蓄电荷，使其获得2层电荷",
        "effects": [
          {
            "type": "add_status",
            "statusId": "charge"
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "辅助",
          "蓄能",
          "单体辅助"
        ]
      },
      {
        "id": "electric_field",
        "name": "电场展开",
        "e": 3,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "展开电场（持续2回合），己方全体每次攻击时额外获得1层电荷，电属性技能威力+15%",
        "effects": [
          {
            "type": "add_status",
            "statusId": "electric_field_buff",
            "value": 0.15
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "辅助",
          "环境",
          "增伤"
        ]
      },
      {
        "id": "static_mark",
        "name": "静电标记",
        "e": 1,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "为目标施加静电标记（持续3回合），对攻击者造成雷电伤害并使其获得1层电荷",
        "effects": [
          {
            "type": "add_status",
            "statusId": "static",
            "stacks": 1
          }
        ],
        "tags": [
          "电",
          "电磁脉冲流",
          "辅助",
          "标记",
          "电荷"
        ]
      }
    ]
  },
  "ice": {
    "name": "冰属性",
    "color": "#64d2ff",
    "attack": [
      {
        "id": "ice_shot",
        "name": "冰晶射击",
        "e": 1,
        "t": "单体敌人",
        "p": 35,
        "damageType": "physical",
        "eff": "造成35威力特殊伤害，使目标获得1层「冰霜」",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "frost",
            "stacks": 1
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "攻击",
          "冰霜"
        ]
      },
      {
        "id": "frost_breath",
        "name": "霜冻之息",
        "e": 2,
        "t": "单体敌人",
        "p": 50,
        "damageType": "special",
        "eff": "喷吐刺骨寒气，造成50威力特殊伤害并附加「极寒印记」（下次使用技能能耗+2）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "add_status",
            "statusId": "extreme_cold_mark",
            "stacks": 1
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "攻击",
          "冰霜"
        ]
      },
      {
        "id": "icicle_spear",
        "name": "冰锥",
        "e": 2,
        "t": "单体敌人",
        "p": "25×3",
        "damageType": "physical",
        "eff": "发射锋利的冰锥进行连击，造成25威力×2-5次物理伤害",
        "effects": [
          {
            "type": "multi_hit",
            "hits": 3,
            "damage": 25
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "攻击",
          "多段",
          "随机连击"
        ]
      },
      {
        "id": "ice_hammer",
        "name": "冰锤",
        "e": 4,
        "t": "单体敌人",
        "p": 100,
        "damageType": "physical",
        "eff": "挥舞沉重的冰锤砸向敌人，造成100威力物理伤害，但寒气反噬使自身速度降低1级",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "buff",
            "stat": "speed",
            "stages": -1
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "攻击",
          "高威力",
          "代价机制"
        ]
      },
      {
        "id": "ice_explosion",
        "name": "冰爆",
        "e": 5,
        "t": "单体敌人",
        "p": 130,
        "damageType": "special",
        "eff": "造成130威力物理伤害，如果目标处于「冻结」状态则造成3倍伤害",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "攻击",
          "冻结增伤",
          "终极"
        ]
      }
    ],
    "defense": [
      {
        "id": "frost_armor",
        "name": "冰霜护甲",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "生成冰霜护甲，本回合受到伤害降低50%，本回合受伤时使攻击者获得1层「冰霜」",
        "effects": [
          {
            "type": "add_status",
            "statusId": "ice_armor"
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "防御",
          "减伤",
          "冰霜反击"
        ],
        "cooldown": 1
      },
      {
        "id": "ice_wall",
        "name": "冰墙",
        "e": 3,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "创造冰墙屏障（持续2回合），获得50%伤害减免",
        "effects": [
          {
            "type": "add_status",
            "statusId": "ice_wall"
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "防御",
          "减伤",
          "护盾"
        ],
        "cooldown": 1
      }
    ],
    "support": [
      {
        "id": "cold_aura",
        "name": "寒气凝聚",
        "e": 1,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "为己方单体赋予「寒气凝聚」，防御+1级（持续2回合）",
        "effects": [
          {
            "type": "debuff",
            "stat": "defense",
            "stages": 1
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "辅助",
          "防御强化"
        ]
      },
      {
        "id": "frost_mark",
        "name": "冰霜印记",
        "e": 1,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "为目标施加「冰霜印记」（持续2回合），受到冰属性攻击时，有25%概率附加1层「冰霜」",
        "effects": [
          {
            "type": "add_status",
            "statusId": "frost_mark",
            "stacks": 1
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "辅助",
          "冰霜强化",
          "印记"
        ]
      },
      {
        "id": "frozen_land",
        "name": "冻土",
        "e": 5,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "创造冻土环境，所有生物冰属性技能能量消耗-1（持续3回合）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "frozen_land_env"
          }
        ],
        "tags": [
          "冰",
          "冰霜蓄力流",
          "辅助",
          "环境",
          "冻土",
          "终极领域"
        ]
      }
    ]
  },
  "psychic": {
    "name": "超能属性",
    "color": "#bf5af2",
    "attack": [
      {
        "id": "mind_pierce",
        "name": "迷心刺",
        "e": 2,
        "t": "单体敌人",
        "p": 60,
        "damageType": "physical",
        "eff": "攻击单体目标，造成60威力物理伤害，获得1层「预言标记」，附加「心灵创伤」（持续2回合）",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "攻击",
          "预言标记"
        ]
      },
      {
        "id": "psychic_hit",
        "name": "精神冲击",
        "e": 3,
        "t": "单体敌人",
        "p": 80,
        "damageType": "special",
        "eff": "攻击单体目标，造成80威力混合伤害（特攻计算/物防减免），无视当前护盾，可破坏屏障类效果",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "攻击",
          "无视护盾",
          "破盾"
        ]
      },
      {
        "id": "stored_power",
        "name": "存储力量",
        "e": 3,
        "t": "单体敌人",
        "p": 20,
        "damageType": "special",
        "eff": "攻击单体目标，基础威力20，每有1个预言标记额外+20威力",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "攻击",
          "累积强化",
          "预言标记"
        ]
      },
      {
        "id": "void_prophecy",
        "name": "虚空预言",
        "e": 5,
        "t": "单体敌人",
        "p": 140,
        "damageType": "special",
        "eff": "蓄力1回合后发动，造成140威力特殊伤害并附加「禁忌」（所有能力等级-2，持续2回合）【蓄力可被打断】",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "攻击",
          "蓄力",
          "能力下降"
        ]
      },
      {
        "id": "future_sight",
        "name": "预知未来",
        "e": 5,
        "t": "单体敌人",
        "p": 120,
        "damageType": "special",
        "eff": "指定敌人，3回合后造成120威力特殊伤害并附加「禁忌」",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "攻击",
          "延迟触发",
          "禁忌"
        ]
      }
    ],
    "defense": [
      {
        "id": "mind_shield_skill",
        "name": "心智护盾",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "受到伤害降低50%，本回合免疫精神类攻击（精神场地环境下额外+20%减伤）",
        "effects": [
          {
            "type": "add_status",
            "statusId": "mind_body"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "防御",
          "减伤",
          "精神免疫"
        ],
        "cooldown": 1
      },
      {
        "id": "mirror_reflect",
        "name": "灵镜反照",
        "e": 3,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得「灵镜反照」状态，反弹下一次攻击（反弹伤害×1.8）【未被攻击时自动保留1次】",
        "effects": [],
        "tags": [
          "超能",
          "奥秘流",
          "防御",
          "反射",
          "反击"
        ]
      },
      {
        "id": "mist_body",
        "name": "迷雾之躯",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "获得「迷雾闪避」（持续2回合），每回合70%概率闪避攻击，闪避成功后速度+1级",
        "effects": [],
        "tags": [
          "超能",
          "奥秘流",
          "防御",
          "闪避",
          "加速"
        ]
      }
    ],
    "support": [
      {
        "id": "psychic_terrain",
        "name": "精神场地",
        "e": 8,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "召唤「精神场地」（持续5回合），己方超能技能威力+30%，保护己方免受优先度攻击",
        "effects": [
          {
            "type": "add_status",
            "statusId": "psychic_terrain"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "环境",
          "精神场地"
        ]
      },
      {
        "id": "psycho_shift",
        "name": "精神转移",
        "e": 2,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "将自身所有负面状态转移给目标（净化自身+转移负面状态）",
        "effects": [],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "状态转移",
          "净化"
        ]
      },
      {
        "id": "psychic_noise_skill",
        "name": "精神噪音",
        "e": 3,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "使目标陷入「精神噪音」状态（持续2回合），期间无法通过任何方式恢复HP",
        "effects": [
          {
            "type": "add_status",
            "statusId": "psychic_noise",
            "stacks": 1
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "禁止恢复",
          "控制"
        ]
      },
      {
        "id": "heal_pulse",
        "name": "治愈波动",
        "e": 3,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "治疗目标最大HP的50%",
        "effects": [
          {
            "type": "heal",
            "percent": 0.005
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "治疗",
          "恢复"
        ]
      },
      {
        "id": "mind_sync",
        "name": "心智同步",
        "e": 3,
        "t": "己方单体",
        "p": 0,
        "damageType": "special",
        "eff": "指定两个己方单位，交换所有强化/弱化状态（净化自身+转移负面状态）",
        "effects": [],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "状态交换",
          "净化"
        ]
      },
      {
        "id": "fate_weave",
        "name": "命运编织",
        "e": 6,
        "t": "单体敌人",
        "p": 100,
        "damageType": "special",
        "eff": "指定敌人，3回合后造成100真实伤害并使其所有能力等级-2【终极预言技能】",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "超能",
          "奥秘流",
          "辅助",
          "延迟效果",
          "真实伤害",
          "终极技能"
        ]
      }
    ]
  },
  "ground": {
    "name": "地属性",
    "color": "#ac8e68",
    "attack": [
      {
        "id": "magnitude",
        "name": "震级",
        "e": 1,
        "t": "全体敌人",
        "p": 75,
        "damageType": "special",
        "eff": "随机决定威力(1-150)，消耗能量越多高威力概率越高",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "variable_power"
          }
        ],
        "tags": [
          "随机威力",
          "全体攻击"
        ]
      },
      {
        "id": "earth_power",
        "name": "大地之力",
        "e": 3,
        "t": "单体敌人",
        "p": 90,
        "damageType": "special",
        "eff": "造成90威力特殊伤害，额外使自身特攻+1级",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "self_buff",
            "stats": {
              "grass_power": 60
            }
          }
        ],
        "tags": [
          "特攻强化",
          "高威力"
        ]
      },
      {
        "id": "earthquake",
        "name": "地震",
        "e": 4,
        "t": "全体敌人",
        "p": 85,
        "damageType": "special",
        "eff": "造成85威力特殊伤害，敌方全体速度-1级",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "debuff_all",
            "statusId": "slow",
            "stages": 1
          }
        ],
        "tags": [
          "全体攻击",
          "减速"
        ]
      },
      {
        "id": "drill_run",
        "name": "直冲钻",
        "e": 3,
        "t": "单体敌人",
        "p": 80,
        "damageType": "physical",
        "eff": "造成80威力物理伤害，必定命中",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "必定命中",
          "物理"
        ]
      },
      {
        "id": "bone_rush",
        "name": "骨棒乱打",
        "e": 2,
        "t": "单体敌人",
        "p": "25×2",
        "damageType": "physical",
        "eff": "发射骨棒进行2次攻击，每次25威力物理伤害",
        "effects": [
          {
            "type": "multi_hit",
            "hits": 2,
            "damage": 25
          }
        ],
        "tags": [
          "多段攻击",
          "两段"
        ]
      }
    ],
    "defense": [
      {
        "id": "sandstorm",
        "name": "沙暴降临",
        "e": 3,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "召唤沙暴天气(3回合)：非岩/地/钢系每回合受损，岩/地/钢系特防+50%",
        "effects": [
          {
            "type": "add_status",
            "statusId": "sandstorm"
          }
        ],
        "tags": [
          "天气",
          "沙暴"
        ]
      },
      {
        "id": "dig",
        "name": "挖洞",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "进入地下(1回合)：免疫地面攻击，下回合必定先手攻击",
        "effects": [
          {
            "type": "add_status",
            "statusId": "underground"
          }
        ],
        "tags": [
          "免疫",
          "先手",
          "蓄力"
        ]
      },
      {
        "id": "sand_tomb",
        "name": "流沙地狱",
        "e": 3,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "使目标陷入流沙，速度-2且每回合受到15威力伤害",
        "effects": [
          {
            "type": "add_status",
            "statusId": "sand_tomb",
            "stacks": 1
          }
        ],
        "tags": [
          "减速",
          "持续伤害",
          "控制"
        ]
      }
    ],
    "support": [
      {
        "id": "mud_sport",
        "name": "玩泥巴",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "自身特攻+1级、特防+1级、速度+1级",
        "effects": [
          {
            "type": "self_buff",
            "stats": {
              "grass_power": 60
            }
          },
          {
            "type": "buff",
            "stat": "defense",
            "stages": 1
          },
          {
            "type": "buff",
            "stat": "speed",
            "stages": 1
          }
        ],
        "tags": [
          "属性强化",
          "综合提升"
        ]
      },
      {
        "id": "sand_attack",
        "name": "泼沙",
        "e": 1,
        "t": "单体敌人",
        "p": 0,
        "damageType": "special",
        "eff": "降低目标命中率-1级",
        "effects": [
          {
            "type": "debuff",
            "stat": "accuracy",
            "stages": -1
          }
        ],
        "tags": [
          "降命中",
          "软控制"
        ]
      },
      {
        "id": "cultivate",
        "name": "耕地",
        "e": 3,
        "t": "己方全体",
        "p": 0,
        "damageType": "special",
        "eff": "治疗己方全体25%HP，清除所有异常状态",
        "effects": [
          {
            "type": "heal",
            "percent": 0.25
          },
          {
            "type": "clear_debuff"
          }
        ],
        "tags": [
          "群体治疗",
          "净化"
        ]
      }
    ]
  },
  "dragon": {
    "name": "龙属性",
    "color": "#c76231",
    "attack": [
      {
        "id": "dragon_pulse_v2",
        "name": "龙之波动",
        "e": 2,
        "t": "单体敌人",
        "p": 80,
        "damageType": "special",
        "eff": "攻击单体目标，造成80威力特殊伤害",
        "effects": [
          {
            "type": "damage"
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "攻击",
          "高威力"
        ]
      },
      {
        "id": "dragon_oblivion",
        "name": "龙之终焉",
        "e": 4,
        "t": "单体敌人",
        "p": 100,
        "damageType": "physical",
        "eff": "攻击单体，造成100威力物理伤害+2-3回合混乱（层数≥5时混乱被共鸣抵消）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "dragon_oblivion",
            "value": 15
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "攻击",
          "高威力",
          "混乱"
        ]
      },
      {
        "id": "meteor_fall",
        "name": "流星陨落",
        "e": 5,
        "t": "单体敌人",
        "p": 150,
        "damageType": "special",
        "eff": "对单体造成150威力特殊伤害，使用后自身攻击/特攻-2级（每2层龙之气息+30威力）",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "self_debuff",
            "statusId": "dragon_power_loss",
            "stacks": 1
          },
          {
            "type": "special",
            "specialType": "meteor_fall",
            "value": 30
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "攻击",
          "究极",
          "自损"
        ]
      },
      {
        "id": "dragon_crush",
        "name": "龙之碾压",
        "e": 3,
        "t": "单体敌人",
        "p": 60,
        "damageType": "physical",
        "eff": "攻击单体，60威力物理伤害（目标HP<50%时+50%）；HP<30%时必定暴击",
        "effects": [
          {
            "type": "damage"
          },
          {
            "type": "special",
            "specialType": "dragon_crush"
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "攻击",
          "斩杀",
          "低HP增伤"
        ]
      }
    ],
    "defense": [
      {
        "id": "dragon_scales_shield_v2",
        "name": "龙鳞守护",
        "e": 2,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "本回合受到伤害-75%，获得基于龙之气息层数的护盾（每层15点），护盾期间受击反击30威力",
        "effects": [
          {
            "type": "add_status",
            "statusId": "dragon_guard"
          },
          {
            "type": "special",
            "specialType": "dragon_scales_shield",
            "value": 30
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "防御",
          "减伤",
          "护盾",
          "反击"
        ],
        "cooldown": 1
      },
      {
        "id": "dragon_resonance_ultimate",
        "name": "龙属共鸣·极",
        "e": 4,
        "t": "自身",
        "p": 0,
        "damageType": "special",
        "eff": "终极技：需2只龙队友在场，消耗所有龙之气息（每层：威力+15、护盾+10、减伤+10%）；层数≥10时全体敌人攻击-2级",
        "effects": [
          {
            "type": "special",
            "specialType": "dragon_resonance_ultimate",
            "value": 10
          }
        ],
        "tags": [
          "龙",
          "血脉压制流",
          "终极",
          "共鸣",
          "消耗"
        ]
      }
    ],
    "support": []
  }
};
