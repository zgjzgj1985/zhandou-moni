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
 * 蓄电护体buff：电属性连击流
 * 受到伤害降低50%，受伤时积累静电，下次攻击额外+20威力
 */
export class StaticBodyBuff extends Buff {
  damageReduction: number;
  staticCharge: number;

  constructor(duration: number = 1, damageReduction: number = 0.5) {
    super('蓄电护体', BuffType.STATIC_BODY, 1, duration);
    this.damageReduction = damageReduction;
    this.staticCharge = 0;
  }

  addStaticCharge(amount: number): void {
    this.staticCharge += amount;
  }

  consumeStaticCharge(): number {
    const charge = this.staticCharge;
    this.staticCharge = 0;
    return charge;
  }

  getDamageMultiplier(): number {
    return 1 + (this.staticCharge * 0.2);  // 每层+20%
  }

  clone(): StaticBodyBuff {
    const cloned = new StaticBodyBuff(this.remainingDuration, this.damageReduction);
    cloned.staticCharge = this.staticCharge;
    return cloned;
  }
}

/**
 * 电磁偏转buff：电属性连击流
 * 下一次受到攻击时，60%概率闪避并反弹50%伤害
 */
export class ElectricDeflectBuff extends Buff {
  dodgeChance: number;
  counterDamagePercent: number;
  uses: number;

  constructor(dodgeChance: number = 0.6, counterDamagePercent: number = 0.5) {
    super('电磁偏转', BuffType.ELECTRIC_DEFLECT, 1, 2);
    this.dodgeChance = dodgeChance;
    this.counterDamagePercent = counterDamagePercent;
    this.uses = 1;
  }

  tryDeflect(): { success: boolean; counterDamage: number } {
    if (this.uses > 0 && Math.random() < this.dodgeChance) {
      this.uses--;
      if (this.uses <= 0) {
        this.remainingDuration = 0;
      }
      return {
        success: true,
        counterDamage: this.counterDamagePercent
      };
    }
    return { success: false, counterDamage: 0 };
  }

  clone(): ElectricDeflectBuff {
    const cloned = new ElectricDeflectBuff(this.dodgeChance, this.counterDamagePercent);
    cloned.uses = this.uses;
    return cloned;
  }
}

/**
 * 电磁感应buff：电属性连击流
 * 每次攻击后追加一次30威力电属性攻击
 */
export class ElectromagneticInductionBuff extends Buff {
  extraDamagePower: number;

  constructor(duration: number = 2, extraDamagePower: number = 30) {
    super('电磁感应', BuffType.ELECTROMAGNETIC_INDUCTION, 1, duration);
    this.extraDamagePower = extraDamagePower;
  }

  getExtraDamage(): number {
    return this.extraDamagePower;
  }

  clone(): ElectromagneticInductionBuff {
    return new ElectromagneticInductionBuff(this.remainingDuration, this.extraDamagePower);
  }
}

/**
 * 雷霆领域buff：电属性连击流
 * 我方全体攻击必定命中，敌方每次行动后受到40威力电属性伤害
 */
export class ThunderDomainBuff extends Buff {
  guaranteedHit: boolean;
  counterDamage: number;
  sourceId: string;

  constructor(duration: number = 2, counterDamage: number = 40) {
    super('雷霆领域', BuffType.THUNDER_DOMAIN, 1, duration);
    this.guaranteedHit = true;
    this.counterDamage = counterDamage;
    this.sourceId = '';
  }

  getCounterDamage(): number {
    return this.counterDamage;
  }

  clone(): ThunderDomainBuff {
    const cloned = new ThunderDomainBuff(this.remainingDuration, this.counterDamage);
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
    // 每层连击+10%
    return 1 + (this.comboCount * 0.1);
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
 * 高速单体攻击，造成45威力伤害，35%概率使目标麻痹（持续1回合无法使用攻击技能）
 * 先手优势：速度等级+1
 */
export const ZAP_CUT: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'zap_cut',
    name: '电光斩',
    description: '高速单体攻击，造成45威力电属性伤害，35%概率使目标麻痹（持续1回合无法使用攻击技能）【先手+1级速度】',
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
 */
export const THUNDER_COMBO: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_combo',
    name: '雷霆连击',
    description: '连续攻击目标3次（25×3威力=75）',
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
    description: '单段攻击，造成85威力电属性伤害，使目标速度-1级并附加「静电」（受攻击时对攻击者反伤）',
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
 * 攻击后触发连锁效果：对目标周围敌人造成60威力扩散伤害
 */
export const THUNDER_CATASTROPHE: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_catastrophe',
    name: '雷霆万钧',
    description: '终极单体攻击，造成130威力电属性伤害，触发连锁效果：对周围敌人造成60威力扩散伤害',
    type: 'action',
    energyCost: EnergyCost.ULTIMATE,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      damage: {
        basePower: 130,
        damageType: DamageType.SPECIAL,
        element: ElementType.ELECTRIC
      },
      special: {
        type: 'chain_damage',
        value: 60  // 60威力连锁伤害
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
 * 获得「蓄电护体」状态
 * 蓄电护体：受到伤害降低50%，本回合受伤时积累静电（下次攻击+30威力）
 */
export const STATIC_SHIELD_SKILL: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'static_shield_skill',
    name: '静电护盾',
    description: '获得「蓄电护体」（受到伤害降低50%，受伤时积累静电，下次攻击+30威力）',
    type: 'action',
    energyCost: EnergyCost.MEDIUM,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: BuffType.STATIC_BODY,
        duration: 1,
        value: 0.5  // 50%减伤
      },
      special: {
        type: 'static_charge',
        value: 30  // 积累静电，下次攻击+30威力
      }
    }],
    category: '电属性连击流·防御',
    tags: ['电', '连击流', '防御', '减伤', '静电积累']
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
    effects: [{
      applyBuff: {
        buffType: BuffType.ELECTRIC_DEFLECT,
        duration: 2,
        value: 0.6  // 60%闪避概率
      }
    }],
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

/**
 * 【防御倾向3】放电壁垒
 * 受到伤害降低65%，本回合每次攻击附带30威力追加伤害
 */
export const DISCHARGE_BARRIER: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'discharge_barrier',
    name: '放电壁垒',
    description: '获得「放电壁垒」状态：受到伤害降低65%，本回合每次攻击附带30威力追加伤害',
    type: 'action',
    energyCost: 4,
    target: SkillTarget.SELF,
    tendency: SkillTendency.DEFENSE,
    effects: [{
      applyBuff: {
        buffType: 'discharge_barrier' as any,
        duration: 1,
        value: 0.65  // 65%减伤
      },
      special: {
        type: 'extra_attack_damage',
        value: 30  // 追加30威力
      }
    }],
    category: '电属性连击流·防御',
    tags: ['电', '连击流', '防御', '减伤', '追加伤害']
  };
  return new Skill(definition);
})();

// ==================== 辅助倾向技能（3种）====================

/**
 * 【辅助倾向4】连锁闪电
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
 * 【辅助倾向5】伏特切换
 * 攻击后强制切换到队友
 * 对目标造成60威力伤害后，强制与后备队友交换位置
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
 * 【辅助倾向2】电磁感应
 * 为友方单体施加电磁感应（持续2回合）
 * 每次攻击后追加一次30威力电属性攻击
 */
export const ELECTROMAGNETIC_INDUCTION: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'electromagnetic_induction',
    name: '电磁感应',
    description: '为友方单体施加「电磁感应」（持续2回合）：每次攻击后追加一次30威力电属性攻击',
    type: 'action',
    energyCost: EnergyCost.HIGH,
    target: SkillTarget.ALLY,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.ELECTROMAGNETIC_INDUCTION,
        duration: 2,
        value: 30  // 追加30威力攻击
      }
    }],
    category: '电属性连击流·辅助',
    tags: ['电', '连击流', '辅助', '追加攻击']
  };
  return new Skill(definition);
})();

/**
 * 【辅助倾向3】雷霆领域
 * 释放雷霆领域（持续2回合）
 * 我方全体攻击必定命中，敌方每次行动后受到40威力电属性伤害
 */
export const THUNDER_DOMAIN: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'thunder_domain',
    name: '雷霆领域',
    description: '释放「雷霆领域」（持续2回合）：我方全体攻击必定命中，敌方每次行动后受到40威力电属性伤害',
    type: 'action',
    energyCost: 6,
    target: SkillTarget.SELF,
    tendency: SkillTendency.SUPPORT,
    effects: [{
      applyBuff: {
        buffType: BuffType.THUNDER_DOMAIN,
        duration: 2,
        value: 40  // 敌方每次行动受伤40威力
      }
    }],
    category: '电属性连击流·辅助',
    tags: ['电', '连击流', '辅助', '领域', '必定命中']
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
    DISCHARGE_BARRIER
  },

  // 辅助倾向（3种）
  SUPPORT: {
    CHARGE_ACCELERATE,
    ELECTROMAGNETIC_INDUCTION,
    THUNDER_DOMAIN
  },

  // 全部技能
  ALL: [
    ZAP_CUT,
    THUNDER_COMBO,
    ELECTROMAGNETIC_HIT,
    THUNDER_CATASTROPHE,
    STATIC_SHIELD_SKILL,
    ELECTROMAGNETIC_DEFLECT,
    DISCHARGE_BARRIER,
    CHARGE_ACCELERATE,
    ELECTROMAGNETIC_INDUCTION,
    THUNDER_DOMAIN,
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
