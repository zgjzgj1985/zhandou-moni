/**
 * 循迹之境 - 电属性·连击流技能库
 * 
 * 基于"电属性 → 连击流/快攻流"设计
 * 核心机制：多段攻击、高速度、连击触发
 * 
 * 技能分类：
 * - 攻击倾向（4种）：电光斩、雷霆连击、电磁冲击、雷霆万钧
 * - 防御倾向（3种）：静电护盾、电磁偏转、电流过载
 * - 辅助倾向（3种）：充能加速、连锁闪电、伏特切换
 */

import {
  Skill,
  SkillDefinition,
  SkillEffect
} from './Skill';
import {
  SkillTarget,
  DamageType,
  ElementType,
  EnergyCost,
  SkillTendency,
  SKILL_TENDENCY_TEXT,
  getEnergyCostText,
  BuffType,
  DebuffType
} from '../types';
import {
  Buff,
  Debuff,
  ParalysisDebuff
} from '../effects';
import { CombatUnit } from '../battle/CombatUnit';

// ==================== 电属性连击流专用Buff ====================

/**
 * 静电护盾buff：电属性连击流
 * 吸收伤害的同时积累静电，下一次攻击附带额外伤害
 */
export class StaticShieldBuff extends Buff {
  value: number;
  maxValue: number;
  staticCharge: number;  // 积累的静电充能

  constructor(value: number = 50) {
    super('静电护盾', BuffType.STATIC_SHIELD, 1, 999);
    this.maxValue = value;
    this.value = value;
    this.staticCharge = 0;
  }

  absorbDamage(damage: number): { absorbed: number; remaining: number } {
    const absorbed = Math.min(this.value, damage);
    this.value -= absorbed;
    this.staticCharge += Math.floor(absorbed / 10); // 每吸收10点伤害积累1点静电
    if (this.value <= 0) {
      this.remainingDuration = 0;
    }
    return { absorbed, remaining: damage - absorbed };
  }

  consumeStaticCharge(): number {
    const charge = this.staticCharge;
    this.staticCharge = 0;
    return charge;
  }

  clone(): StaticShieldBuff {
    const cloned = new StaticShieldBuff(this.maxValue);
    cloned.value = this.value;
    cloned.staticCharge = this.staticCharge;
    return cloned;
  }
}

/**
 * 连击充能buff：电属性连击流
 * 记录连击次数，下次攻击根据连击次数提升威力
 */
export class ComboChargeBuff extends Buff {
  comboCount: number;
  maxComboCount: number;

  constructor(maxComboCount: number = 5, duration: number = 3) {
    super('连击充能', BuffType.COMBO_CHARGE, 1, duration);
    this.comboCount = 0;
    this.maxComboCount = maxComboCount;
  }

  addCombo(): void {
    this.comboCount = Math.min(this.comboCount + 1, this.maxComboCount);
    this.remainingDuration = this.duration; // 刷新持续时间
  }

  resetCombo(): void {
    this.comboCount = 0;
  }

  getComboMultiplier(): number {
    // 每层连击+20%伤害
    return 1 + (this.comboCount * 0.2);
  }

  clone(): ComboChargeBuff {
    const cloned = new ComboChargeBuff(this.maxComboCount, this.duration);
    cloned.comboCount = this.comboCount;
    return cloned;
  }
}

/**
 * 电场加速buff：电属性连击流
 * 回合结束时积累电场层数，下回合攻击附带额外效果
 */
export class ElectricFieldBuff extends Buff {
  fieldLayers: number;
  maxFieldLayers: number;

  constructor(maxFieldLayers: number = 3) {
    super('电场加速', BuffType.ELECTRIC_FIELD, 1, 999);
    this.fieldLayers = 0;
    this.maxFieldLayers = maxFieldLayers;
  }

  addLayer(): void {
    this.fieldLayers = Math.min(this.fieldLayers + 1, this.maxFieldLayers);
  }

  consumeFieldLayers(): number {
    const layers = this.fieldLayers;
    this.fieldLayers = 0;
    return layers;
  }

  getSpeedBonus(): number {
    // 每层电场+15%速度
    return this.fieldLayers * 0.15;
  }

  clone(): ElectricFieldBuff {
    const cloned = new ElectricFieldBuff(this.maxFieldLayers);
    cloned.fieldLayers = this.fieldLayers;
    return cloned;
  }
}

/**
 * 雷霆之势buff：电属性连击流
 * 攻击附带连锁效果，可以弹射到其他目标
 */
export class ThunderFuryBuff extends Buff {
  chainCount: number;  // 连锁次数
  chainDamageMultiplier: number;

  constructor(chainCount: number = 2, chainDamageMultiplier: number = 0.5) {
    super('雷霆之势', BuffType.THUNDER_FURY, 1, 2);
    this.chainCount = chainCount;
    this.chainDamageMultiplier = chainDamageMultiplier;
  }

  getChainInfo(): { count: number; multiplier: number } {
    return {
      count: this.chainCount,
      multiplier: this.chainDamageMultiplier
    };
  }

  clone(): ThunderFuryBuff {
    const cloned = new ThunderFuryBuff(this.chainCount, this.chainDamageMultiplier);
    return cloned;
  }
}

// ==================== 电属性连击流专用Debuff ====================

/**
 * 静电debuff：电属性连击流
 * 受到攻击时概率释放静电，对攻击者造成反伤
 */
export class StaticDebuff extends Debuff {
  staticBuildup: number;
  damageOnHit: number;

  constructor(duration: number = 3, damageOnHit: number = 15) {
    super('静电', DebuffType.STATIC, 1, duration);
    this.staticBuildup = 0;
    this.damageOnHit = damageOnHit;
  }

  addBuildup(amount: number): void {
    this.staticBuildup += amount;
  }

  discharge(): number {
    const damage = this.staticBuildup + this.damageOnHit;
    this.staticBuildup = 0;
    return damage;
  }

  clone(): StaticDebuff {
    const cloned = new StaticDebuff(this.remainingDuration, this.damageOnHit);
    cloned.staticBuildup = this.staticBuildup;
    return cloned;
  }
}

/**
 * 电疗debuff：电属性连击流
 * 每回合开始时受到电流伤害，但速度提升
 */
export class ElectricShockDebuff extends Debuff {
  damagePerTurn: number;
  speedBonus: number;

  constructor(duration: number = 3, damagePerTurn: number = 10, speedBonus: number = 0.25) {
    super('电疗', DebuffType.ELECTRIC_SHOCK, 1, duration);
    this.damagePerTurn = damagePerTurn;
    this.speedBonus = speedBonus;
  }

  onTurnStart(unit: any): void {
    unit.takeDamage(this.damagePerTurn, 'electric_shock');
  }

  clone(): ElectricShockDebuff {
    const cloned = new ElectricShockDebuff(this.remainingDuration, this.damagePerTurn, this.speedBonus);
    return cloned;
  }
}

// ==================== 攻击倾向技能（4种）====================

/**
 * 【攻击倾向1】电光斩
 * 高速单体攻击，造成45威力伤害，35%概率使目标麻痹
 * 先手优势：速度等级+1
 */
export const ZAP_CUT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'zap_cut',
    name: '电光斩',
    description: '高速单体攻击，造成45威力电属性伤害，35%概率使目标麻痹【先手+1级速度】',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 45,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }],
    category: '电属性连击流·攻击',
    tags: ['电', '连击流', '攻击', '先手', '麻痹']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向2】雷霆连击
 * 对目标连续攻击3次，每次威力25（总计75威力）
 * 每次命中后有25%概率触发额外连击
 */
export const THUNDER_COMBO: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_combo',
    name: '雷霆连击',
    description: '连续攻击目标3次（25×3威力=75），每次命中后25%概率追加1次攻击（追加攻击威力20）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 25,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC,
        hits: 3
      }
    }],
    category: '电属性连击流·攻击',
    tags: ['电', '连击流', '攻击', '多段攻击', '连击触发']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向3】电磁冲击
 * 高威力单体攻击，造成85威力伤害
 * 命中后使目标速度降低1级，并附加「静电」状态
 */
export const ELECTROMAGNETIC_HIT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electromagnetic_hit',
    name: '电磁冲击',
    description: '单体攻击造成85威力电属性伤害，使目标速度-1级并附加「静电」（受攻击时释放反伤）',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 85,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }],
    category: '电属性连击流·攻击',
    tags: ['电', '连击流', '攻击', '降速', '静电']
  };
  return new Skill(definition);
})();

/**
 * 【攻击倾向4】雷霆万钧
 * 终极攻击技能，造成130威力伤害
 * 攻击后获得「雷霆之势」状态，下一次攻击附带连锁效果
 */
export const THUNDER_CATASTROPHE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_catastrophe',
    name: '雷霆万钧',
    description: '终极单体攻击，造成130威力电属性伤害，攻击后获得「雷霆之势」（下次攻击附带连锁）',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 130,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }],
    category: '电属性连击流·攻击',
    tags: ['电', '连击流', '攻击', '终极技能', '连锁攻击']
  };
  return new Skill(definition);
})();

// ==================== 防御倾向技能（3种）====================

/**
 * 【防御倾向1】静电护盾
 * 为己方单体生成50点护盾值
 * 护盾吸收伤害时积累静电，下次攻击附带额外伤害
 */
export const STATIC_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'static_shield_skill',
    name: '静电护盾',
    description: '为己方单体生成50点护盾，吸收伤害时积累静电（下次攻击附带额外伤害）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      shield: {
        amount: 50
      }
    }],
    category: '电属性连击流·防御',
    tags: ['电', '连击流', '防御', '护盾', '静电积累']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向2】电磁偏转
 * 获得「电磁偏转」状态
 * 下一次受到攻击时，有60%概率完全闪避并反弹50%伤害
 */
export const ELECTROMAGNETIC_DEFLECT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electromagnetic_deflect',
    name: '电磁偏转',
    description: '获得「电磁偏转」状态，下一次受攻击时60%概率闪避并反弹50%伤害',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    category: '电属性连击流·防御',
    tags: ['电', '连击流', '防御', '闪避', '反弹']
  };
  return new Skill(definition);
})();

/**
 * 【防御倾向3】电流过载
 * 以消耗自身HP为代价，瞬间恢复能量
 * 每损失10%HP恢复2点能量，最高恢复6点
 */
export const ELECTRIC_OVERLOAD: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electric_overload',
    name: '电流过载',
    description: '消耗自身HP（每损失10%HP恢复2能量，最高6能量）【以血换能】',
    type: 'action',
    energyCost: 0,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [],
    category: '电属性连击流·防御',
    tags: ['电', '连击流', '防御', '能量恢复', '自残']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向1】充能加速
 * 提升自身速度2级，并获得「连击充能」状态
 * 每次攻击命中后连击次数+1
 */
export const CHARGE_ACCELERATE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'charge_accelerate',
    name: '充能加速',
    description: '自身速度+2级，获得「连击充能」（每次攻击命中后连击次数+1，持续3回合）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [
      {
        statBoost: {
          stat: 'speed',
          stages: 2,
          duration: 3
        }
      },
      {
        applyBuff: {
          buffType: BuffType.COMBO_CHARGE,
          duration: 3,
          stacks: 1,
          value: 5
        }
      }
    ],
    category: '电属性连击流·辅助',
    tags: ['电', '连击流', '辅助', '加速', '连击积累']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向2】连锁闪电
 * 对目标造成40威力伤害
 * 伤害的30%连锁弹射给随机敌方单位
 */
export const CHAIN_LIGHTNING: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'chain_lightning',
    name: '连锁闪电',
    description: '单体攻击造成40威力电属性伤害，伤害的30%连锁弹射给随机敌方目标',
    type: 'action',
    energyCost: EnergyCost.LOW,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      damage: {
        basePower: 40,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }],
    category: '电属性连击流·辅助',
    tags: ['电', '连击流', '辅助', '连锁', 'AOE']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】伏特切换
 * 攻击后强制切换到队友
 * 对目标造成60威力伤害后，强制与后备队友交换位置
 * 类似于U-turn/Volt Switch机制
 */
export const VOLT_SWITCH: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'volt_switch',
    name: '伏特切换',
    description: '单体攻击造成60威力电属性伤害后，强制与后备队友交换位置【攻击型换人】',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      damage: {
        basePower: 60,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      }
    }],
    category: '电属性连击流·辅助',
    tags: ['电', '连击流', '辅助', 'Pivot', '强制切换']
  };
  return new Skill(definition);
})();

// ==================== 电属性连击流技能库导出 ====================

/**
 * 电属性·连击流技能库
 */
export const ELECTRIC_COMBO_SKILLS = {
  // 攻击倾向（4种）
  ATTACK: {
    ZAP_CUT,
    THUNDER_COMBO,
    ELECTROMAGNETIC_HIT,
    THUNDER_CATASTROPHE
  },

  // 防御倾向（3种）
  DEFENSE: {
    STATIC_SHIELD_SKILL,
    ELECTROMAGNETIC_DEFLECT,
    ELECTRIC_OVERLOAD
  },

  // 辅助倾向（3种）
  SUPPORT: {
    CHARGE_ACCELERATE,
    CHAIN_LIGHTNING,
    VOLT_SWITCH
  },

  // 全部技能
  ALL: [
    ZAP_CUT,
    THUNDER_COMBO,
    ELECTROMAGNETIC_HIT,
    THUNDER_CATASTROPHE,
    STATIC_SHIELD_SKILL,
    ELECTROMAGNETIC_DEFLECT,
    ELECTRIC_OVERLOAD,
    CHARGE_ACCELERATE,
    CHAIN_LIGHTNING,
    VOLT_SWITCH
  ]
};

/**
 * 获取技能倾向标签
 */
export function getElectricSkillTendencyLabel(skill: Skill): string {
  const tendency = skill.definition.tendency;
  if (!tendency) return '无倾向';

  switch (tendency) {
    case SkillTendency.ATTACK:
      return '【攻击】';
    case SkillTendency.DEFENSE:
      return '【防御】';
    case SkillTendency.SUPPORT:
      return '【辅助】';
    default:
      return '【无倾向】';
  }
}

/**
 * 获取技能完整描述（含倾向）
 */
export function getElectricSkillDescription(skill: Skill): string {
  const tendencyLabel = getElectricSkillTendencyLabel(skill);
  return `${skill.name} ${tendencyLabel}\n${skill.description}`;
}
