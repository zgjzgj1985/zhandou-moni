/**
 * 循迹之境 - 被动技能(Traits)
 */

/**
 * Trait类型
 */
export enum TraitType {
  TRIGGER = 'trigger',       // 触发型
  PASSIVE = 'passive',       // 被动型
  CONDITIONAL = 'conditional' // 条件型
}

/**
 * 触发时机
 */
export enum TriggerTiming {
  ON_DAMAGED = 'on_damaged',       // 受到伤害时
  ON_ATTACK = 'on_attack',           // 攻击时
  ON_KILL = 'on_kill',               // 击杀时
  ON_DEATH = 'on_death',             // 死亡时
  ON_HEAL = 'on_heal',               // 治疗时
  ON_BUFF = 'on_buff',               // 获得buff时
  ON_DEBUFF = 'on_debuff',           // 获得debuff时
  ON_TURN_START = 'on_turn_start',   // 回合开始时
  ON_TURN_END = 'on_turn_end'        // 回合结束时
}

/**
 * Trait效果
 */
export interface TraitEffect {
  healing?: number;
  damage?: number;
  buff?: {
    type: string;
    stacks: number;
    duration: number;
  };
  debuff?: {
    type: string;
    stacks: number;
    duration: number;
  };
  statChange?: {
    attack?: number;
    defense?: number;
    speed?: number;
  };
}

/**
 * Trait定义
 */
export interface TraitDefinition {
  id: string;
  name: string;
  description: string;
  type: TraitType;
  triggerTiming?: TriggerTiming;
  effect: TraitEffect;
}

/**
 * Trait实例
 */
export class Trait {
  id: string;
  definition: TraitDefinition;
  isActive: boolean = true;
  
  constructor(definition: TraitDefinition) {
    this.id = definition.id;
    this.definition = definition;
  }
  
  get name(): string {
    return this.definition.name;
  }
  
  get description(): string {
    return this.definition.description;
  }
  
  /**
   * 检查是否可以触发
   */
  canTrigger(context: TriggerContext): boolean {
    if (!this.isActive) return false;
    if (this.definition.type === TraitType.PASSIVE) return true;
    return this.definition.triggerTiming === context.timing;
  }
  
  /**
   * 触发效果
   */
  trigger(context: TriggerContext): TraitEffect[] {
    if (!this.canTrigger(context)) return [];
    // 返回效果，由战斗系统执行
    return [this.definition.effect];
  }
  
  /**
   * 禁用
   */
  disable(): void {
    this.isActive = false;
  }
  
  /**
   * 启用
   */
  enable(): void {
    this.isActive = true;
  }
}

/**
 * Trait触发上下文
 */
export interface TriggerContext {
  timing: TriggerTiming;
  source?: any;
  target?: any;
  amount?: number;
  damage?: number;
}

/**
 * 默认Trait库
 */
export const DEFAULT_TRAITS: Record<string, TraitDefinition> = {
  // 受到攻击时反击
  COUNTER: {
    id: 'counter',
    name: '反击',
    description: '受到攻击时，以威力40反击',
    type: TraitType.TRIGGER,
    triggerTiming: TriggerTiming.ON_DAMAGED,
    effect: {
      damage: 40
    }
  },
  
  // 击杀后恢复
  POST_MORTEM: {
    id: 'post_mortem',
    name: '死里逃生',
    description: 'HP低于50%时，攻击力+50%',
    type: TraitType.CONDITIONAL,
    effect: {
      statChange: {
        attack: 1
      }
    }
  },
  
  // 受到火属性攻击时特攻提升
  FLASH_FIRE: {
    id: 'flash_fire',
    name: '引火',
    description: '受到火属性攻击时，特攻+1级',
    type: TraitType.TRIGGER,
    triggerTiming: TriggerTiming.ON_DAMAGED,
    effect: {
      statChange: {
        attack: 1
      }
    }
  },
  
  // 受到水属性攻击时回血
  WATER_ABSORB: {
    id: 'water_absorb',
    name: '储水',
    description: '受到水属性攻击时，回复HP',
    type: TraitType.TRIGGER,
    triggerTiming: TriggerTiming.ON_DAMAGED,
    effect: {
      healing: 20
    }
  }
};
