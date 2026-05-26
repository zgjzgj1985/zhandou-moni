/**
 * 循迹之境 - 战斗管理器
 * 核心战斗逻辑：回合循环、状态机、胜负判定
 */

import {
  BattleType,
  BattlePhase,
  BattleResult,
  BattleEventType,
  BattleEvent,
  Intent,
  ElementType,
  BuffType,
  DebuffType,
  SkillTarget,
  SkillTendency
} from '../types';
import { CombatUnit } from './CombatUnit';
import { PlayerUnit } from './PlayerUnit';
import { EnemyUnit } from './EnemyUnit';
import { DamageType } from '../types';
import { SkillDefinition } from '../skills/Skill';
import { VineBodyBuff, LifeBodyBuff, IceArmorBuff, IceWallBuff, FrostFieldBuff } from '../effects/buffs';
import { TangleDebuff, ParalysisDebuff, FreezeDebuff, DeepFreezeDebuff, AbsoluteFreezeDebuff, FrostMarkDebuff } from '../effects/debuffs';

/**
 * 战斗配置
 */
export interface BattleConfig {
  type: BattleType;
  players: PlayerUnit[];
  enemies: EnemyUnit[];
  turnLimit?: number; // 回合限制（0表示无限制）
}

/**
 * 战斗事件监听器
 */
export type BattleEventListener = (event: BattleEvent) => void;

/**
 * 延迟效果
 */
export interface DelayedEffect {
  id: string;
  sourceId: string;
  targetId: string;
  remainingTurns: number;
  damage?: {
    basePower: number;
    damageType: DamageType;
    element?: ElementType;
  };
  debuff?: {
    debuffType: DebuffType;
    duration: number;
    stacks: number;
  };
  skillName: string;
}

/**
 * 战斗日志条目
 */
export interface BattleLogEntry {
  turn: number;
  phase: BattlePhase;
  sourceId?: string;
  targetId?: string;
  action: string;
  result?: string;
  timestamp: number;
}

/**
 * 战斗管理器
 */
export class BattleManager {
  // 战斗配置
  config: BattleConfig;
  type: BattleType;
  
  // 参战单位
  players: PlayerUnit[];
  enemies: EnemyUnit[];
  
  // 战斗状态
  phase: BattlePhase;
  currentTurn: number;
  turnLimit: number;
  result: BattleResult | null;
  
  // 事件系统
  private listeners: Map<BattleEventType, BattleEventListener[]>;
  
  // 战斗日志
  log: BattleLogEntry[];

  // 延迟效果追踪
  private delayedEffects: DelayedEffect[];
  
  // 回调函数
  onPhaseChange?: (phase: BattlePhase) => void;
  onTurnStart?: (turn: number) => void;
  onTurnEnd?: (turn: number) => void;
  onBattleEnd?: (result: BattleResult) => void;
  
  constructor(config: BattleConfig) {
    this.config = config;
    this.type = config.type;
    this.players = config.players;
    this.enemies = config.enemies;
    this.turnLimit = config.turnLimit ?? 0;
    
    this.phase = BattlePhase.NOT_STARTED;
    this.currentTurn = 0;
    this.result = null;
    
    this.listeners = new Map();
    this.log = [];
    this.delayedEffects = [];
  }
  
  // ==================== 事件系统 ====================
  
  /**
   * 注册事件监听器
   */
  on(eventType: BattleEventType, listener: BattleEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  off(eventType: BattleEventType, listener: BattleEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   */
  private emit(event: Omit<BattleEvent, 'timestamp'>): void {
    const fullEvent: BattleEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        listener(fullEvent);
      }
    }
  }
  
  // ==================== 战斗流程控制 ====================
  
  /**
   * 开始战斗
   */
  start(): void {
    if (this.phase !== BattlePhase.NOT_STARTED) {
      throw new Error('战斗已经开始');
    }
    
    this.addLog('battle_start', '战斗开始！');
    this.setPhase(BattlePhase.PLAYER_TURN);
    this.startTurn();
  }
  
  /**
   * 设置战斗阶段
   */
  private setPhase(phase: BattlePhase): void {
    this.phase = phase;
    this.onPhaseChange?.(phase);
    this.emit({ type: BattleEventType.TURN_START });
  }
  
  /**
   * 开始回合
   */
  private startTurn(): void {
    this.currentTurn++;
    this.onTurnStart?.(this.currentTurn);
    this.emit({ type: BattleEventType.TURN_START });
    
    this.addLog('turn_start', `第${this.currentTurn}回合开始`);
    
    // 回合开始时结算DOT
    this.processTurnStartEffects();
    
    // 检查是否超时
    if (this.turnLimit > 0 && this.currentTurn > this.turnLimit) {
      this.endBattle(BattleResult.DEFEAT, '超过回合限制');
      return;
    }
    
    // 检查胜负
    if (this.checkBattleEnd()) {
      return;
    }
  }
  
  /**
   * 处理回合开始效果
   */
  private processTurnStartEffects(): void {
    // 玩家单位回合开始
    for (const player of this.players) {
      // 回复能量至满
      player.regenerateEnergy();
      player.onTurnStart();
    }

    // 敌人单位回合开始
    for (const enemy of this.enemies) {
      enemy.onTurnStart();
    }

    // 处理延迟效果
    this.processDelayedEffects();
  }

  /**
   * 处理延迟效果
   */
  private processDelayedEffects(): void {
    const effectsToTrigger: DelayedEffect[] = [];
    const effectsToKeep: DelayedEffect[] = [];

    for (const effect of this.delayedEffects) {
      effect.remainingTurns--;
      if (effect.remainingTurns <= 0) {
        effectsToTrigger.push(effect);
      } else {
        effectsToKeep.push(effect);
      }
    }

    this.delayedEffects = effectsToKeep;

    // 触发到期的延迟效果
    for (const effect of effectsToTrigger) {
      this.triggerDelayedEffect(effect);
    }
  }

  /**
   * 触发延迟效果
   */
  private triggerDelayedEffect(effect: DelayedEffect): void {
    const target = this.enemies.find(e => e.id === effect.targetId)
      || this.players.find(p => p.id === effect.targetId);

    if (!target || target.isDead) {
      this.addLog('delayed_effect', `${effect.skillName} 触发失败`, '目标已阵亡');
      return;
    }

    const results: string[] = [];

    // 触发伤害
    if (effect.damage) {
      const caster = this.players.find(p => p.id === effect.sourceId)
        || this.enemies.find(e => e.id === effect.sourceId);

      if (caster) {
        const damageType = effect.damage.damageType === DamageType.SPECIAL ? 'special' : 'physical';
        const damage = caster.calculateDamage(
          effect.damage.basePower,
          target,
          damageType,
          effect.damage.element
        );
        const actualDamage = target.takeDamage(damage, damageType);
        results.push(`造成 ${actualDamage} 点伤害`);

        this.addLog(
          'delayed_damage',
          `${effect.skillName} 触发`,
          `对 ${target.name} ${results.join('，')}`
        );
      }
    }

    // 触发debuff
    if (effect.debuff) {
      const debuff = this.createDebuffFromType(
        effect.debuff.debuffType,
        effect.debuff.stacks,
        effect.debuff.duration
      );
      if (debuff) {
        target.addDebuff(debuff);
        results.push(`附加${debuff.name}`);
        this.addLog(
          'delayed_debuff',
          `${effect.skillName} 触发`,
          `对 ${target.name} 附加 ${debuff.name}`
        );
      }
    }

    this.emit({
      type: BattleEventType.UNIT_DAMAGED,
      sourceId: effect.sourceId,
      targetId: effect.targetId,
      data: { delayed: true }
    });

    // 检查目标死亡
    if (target.isDead) {
      this.handleUnitDeath(target);
    }
  }

  /**
   * 创建Debuff实例
   */
  private createDebuffFromType(debuffType: DebuffType, stacks: number, duration: number): any {
    switch (debuffType) {
      case DebuffType.WET:
        return new (require('../effects/debuffs').WetDebuff)(duration);
      case DebuffType.SLOW:
        return new (require('../effects/debuffs').SlowDebuff)(stacks, duration);
      case DebuffType.DROWNING:
        return new (require('../effects/debuffs').DrowningDebuff)(duration);
      case DebuffType.TURBULENCE:
        return new (require('../effects/debuffs').TurbulenceDebuff)(duration);
      default:
        return null;
    }
  }

  /**
   * 注册延迟效果
   */
  registerDelayedEffect(
    sourceId: string,
    targetId: string,
    delayTurns: number,
    damage?: { basePower: number; damageType: DamageType; element?: ElementType },
    debuff?: { debuffType: DebuffType; duration: number; stacks: number },
    skillName: string = '延迟效果'
  ): void {
    const effect: DelayedEffect = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      remainingTurns: delayTurns,
      damage,
      debuff,
      skillName
    };

    this.delayedEffects.push(effect);

    this.addLog(
      'register_delayed',
      `${skillName} 已标记`,
      `${delayTurns}回合后对目标生效`
    );
  }
  
  /**
   * 结束回合
   */
  private endTurn(): void {
    // 玩家单位回合结束
    for (const player of this.players) {
      player.onTurnEnd();
    }
    
    // 敌人单位回合结束
    for (const enemy of this.enemies) {
      enemy.onTurnEnd();
    }
    
    this.onTurnEnd?.(this.currentTurn);
    this.emit({ type: BattleEventType.TURN_END });
    this.addLog('turn_end', `第${this.currentTurn}回合结束`);
    
    // 检查胜负
    if (this.checkBattleEnd()) {
      return;
    }
    
    // 进入下一回合
    this.setPhase(BattlePhase.PLAYER_TURN);
    this.startTurn();
  }
  
  // ==================== 玩家行动 ====================
  
  /**
   * 执行玩家攻击
   */
  executePlayerAttack(
    playerId: string,
    targetId: string,
    basePower: number,
    damageType: DamageType = DamageType.PHYSICAL,
    element?: ElementType
  ): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    const target = this.enemies.find(e => e.id === targetId);

    if (!player || !target) {
      return { success: false, message: '单位不存在' };
    }

    if (player.isDead) {
      return { success: false, message: '玩家已阵亡' };
    }

    if (target.isDead) {
      return { success: false, message: '目标已阵亡' };
    }

    // 计算伤害
    const damage = player.calculateDamage(basePower, target, damageType === DamageType.SPECIAL ? 'special' : 'physical', element);

    // 造成伤害
    const actualDamage = target.takeDamage(damage, damageType === DamageType.SPECIAL ? 'special' : 'physical');

    this.addLog(
      'player_attack',
      `${player.name} 攻击 ${target.name}`,
      `造成 ${actualDamage} 点伤害`
    );

    // 检查目标的反制效果（受到攻击时触发）
    this.triggerOnDamagedEffects(target, player);

    this.emit({
      type: BattleEventType.UNIT_DAMAGED,
      sourceId: playerId,
      targetId: targetId,
      data: { damage: actualDamage }
    });

    // 检查目标死亡
    if (target.isDead) {
      this.handleUnitDeath(target);
    }

    return {
      success: true,
      message: `造成 ${actualDamage} 点伤害`,
      damage: actualDamage,
      targetDied: target.isDead
    };
  }

  /**
   * 执行玩家使用技能
   */
  executePlayerSkill(
    playerId: string,
    skillId: string,
    targetId?: string
  ): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isDead) {
      return { success: false, message: '玩家不存在或已阵亡' };
    }

    const skill = player.skills.find(s => s.id === skillId);
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    if (!skill.canUse(player.energy)) {
      return { success: false, message: '能量不足' };
    }

    // 检查麻痹状态 - 攻击技能无法使用
    const isAttackSkill = skill.definition.tendency === SkillTendency.ATTACK;
    const hasParalysis = player.debuffs.some(d => d.type === DebuffType.PARALYSIS);
    if (isAttackSkill && hasParalysis) {
      const paralysisDebuff = player.debuffs.find(d => d.type === DebuffType.PARALYSIS) as any;
      if (paralysisDebuff && paralysisDebuff.canAttack && !paralysisDebuff.canAttack()) {
        return { success: false, message: '麻痹状态下无法使用攻击技能' };
      }
    }

    // 消耗能量
    const energyCost = skill.getEnergyConsumption();
    player.energy -= energyCost;

    // 处理技能效果
    const results: string[] = [];

    for (const effect of skill.definition.effects) {
      // 处理伤害效果
      if (effect.damage) {
        const target = this.enemies.find(e => e.id === targetId);
        if (target) {
          const damageType = effect.damage.damageType === DamageType.SPECIAL ? 'special' : 'physical';
          
          // 检查破冰机制（ice_shatter技能）
          let finalPower = effect.damage.basePower;
          let isShatterHit = false;
          const isTargetFrozen = this.isTargetFrozen(target);
          
          if (effect.special?.type === 'ice_shatter' && isTargetFrozen) {
            // 破冰斩对冻结目标+80%伤害
            finalPower = Math.floor(effect.damage.basePower * (effect.special.value || 1.8));
            isShatterHit = true;
            results.push(`【破冰】伤害提升至${finalPower}`);
          }
          
          const damage = player.calculateDamage(
            finalPower,
            target,
            damageType,
            effect.damage.element
          );
          const actualDamage = target.takeDamage(damage, damageType);
          results.push(`造成 ${actualDamage} 点伤害`);

          // 检查反制效果
          this.triggerOnDamagedEffects(target, player);

          // 冻结相关处理
          if (effect.applyDebuff?.debuffType === 'freeze' || effect.applyDebuff?.debuffType === 'deep_freeze') {
            const freezeChance = this.calculateFreezeChance(effect.applyDebuff.successRate || 0.2, target);
            if (Math.random() < freezeChance) {
              this.applyFreezeDebuff(target, effect.applyDebuff.debuffType === 'deep_freeze' ? 'deep_freeze' : 'freeze');
              results.push('目标被冻结！');
            }
          }

          // 破冰成功后触发碎冰追击
          if (isShatterHit && isTargetFrozen) {
            const shatterFollowUpDamage = 40;
            const followUpActualDamage = target.takeDamage(shatterFollowUpDamage, 'special');
            results.push(`【碎冰追击】追加 ${followUpActualDamage} 点伤害`);
          }

          // 检查目标死亡
          if (target.isDead) {
            this.handleUnitDeath(target);
          }
        }
      }

      // 处理特殊效果
      if (effect.special) {
        // 检查是否是延迟伤害技能（如潮汐涌动）
        if (effect.special.type === 'delay_damage' && targetId && skill.definition.delay) {
          const delayEffect = skill.definition.delay;
          const applyDebuff = delayEffect.effect.applyDebuff;
          this.registerDelayedEffect(
            player.id,
            targetId,
            delayEffect.turns,
            delayEffect.effect.damage,
            applyDebuff ? {
              debuffType: applyDebuff.debuffType as DebuffType,
              duration: applyDebuff.duration ?? 3,
              stacks: applyDebuff.stacks ?? 1
            } : undefined,
            skill.name
          );
          results.push(`标记延迟效果（${delayEffect.turns}回合后触发）`);
        } else {
          const specialResult = this.processSpecialEffect(player, effect.special, targetId);
          results.push(specialResult);
        }
      }

      // 处理治疗效果
      if (effect.healing) {
        const target = this.findSkillTarget(player, skill.definition.target, targetId);
        if (target) {
          const healAmount = effect.healing.percent
            ? Math.floor(target.maxHp * effect.healing.percent)
            : effect.healing.amount;
          const actualHeal = target.heal(healAmount);
          results.push(`回复 ${actualHeal} HP`);
        }
      }
    }

    this.addLog(
      'player_skill',
      `${player.name} 使用 ${skill.name}`,
      results.join('，')
    );

    return {
      success: true,
      message: results.join('，') || '技能使用成功'
    };
  }

  /**
   * 处理技能特殊效果
   */
  private processSpecialEffect(
    caster: CombatUnit,
    special: { type: string; value?: number },
    targetId?: string
  ): string {
    switch (special.type) {
      case 'consume_buff_heal':
        const healPercent = special.value ?? 0.15;
        const result = this.processConsumeBuffHeal(caster, healPercent);
        return `消耗${result.healedLayers}层增益，回复${result.totalHeal}HP，清除负面状态`;

      case 'cleanse':
        // 清除目标负面状态
        const target = targetId
          ? (this.players.find(p => p.id === targetId) || this.enemies.find(e => e.id === targetId))
          : null;
        if (target) {
          const debuffCount = target.debuffs.length;
          target.debuffs = [];
          return `清除${debuffCount}个负面状态`;
        }
        return '净化';

      default:
        return '特殊效果';
    }
  }

  /**
   * 查找技能目标
   */
  private findSkillTarget(caster: CombatUnit, targetType: SkillTarget, targetId?: string): CombatUnit | null {
    switch (targetType) {
      case SkillTarget.SELF:
        return caster;
      case SkillTarget.SINGLE:
        if (targetId) {
          return this.enemies.find(e => e.id === targetId) as CombatUnit | undefined
            || this.players.find(p => p.id === targetId) as CombatUnit | undefined
            || null;
        }
        return null;
      case SkillTarget.ALLY:
        if (targetId) {
          return this.players.find(p => p.id === targetId) as CombatUnit | undefined || null;
        }
        return null;
      case SkillTarget.ALLY_ALL:
      case SkillTarget.ENEMY_ALL:
      case SkillTarget.ALL:
        return caster;
      default:
        return null;
    }
  }

  /**
   * 触发单位受到伤害时的反制效果
   */
  private triggerOnDamagedEffects(target: CombatUnit, attacker: CombatUnit): void {
    // 检查藤蔓护体效果
    const vineBodyBuff = target.buffs.find(b => b.type === BuffType.VINE_BODY);
    if (vineBodyBuff) {
      const vineBuff = vineBodyBuff as VineBodyBuff;
      const slowInfo = vineBuff.getSlowInfo();
      const tangleDebuff = new TangleDebuff(slowInfo.stages, slowInfo.duration);
      attacker.addDebuff(tangleDebuff);
      this.addLog(
        'counter_effect',
        `${target.name} 的藤蔓护体触发`,
        `对 ${attacker.name} 施加缠绕（速度-${slowInfo.stages}级，持续${slowInfo.duration}回合）`
      );
    }

    // 检查生机护体效果
    const lifeBodyBuff = target.buffs.find(b => b.type === BuffType.LIFE_BODY);
    if (lifeBodyBuff) {
      const lifeBuff = lifeBodyBuff as LifeBodyBuff;
      const healPercent = lifeBuff.getHealPercent();
      const healAmount = Math.floor(target.maxHp * healPercent);
      if (healAmount > 0) {
        target.heal(healAmount);
        this.addLog(
          'heal_effect',
          `${target.name} 的生机护体触发`,
          `回复 ${healAmount} HP`
        );
      }
    }

    // 检查冰霜护甲效果 - 受伤时冻结攻击者
    const iceArmorBuff = target.buffs.find(b => b.type === BuffType.ICE_ARMOR);
    if (iceArmorBuff) {
      const iceArmor = iceArmorBuff as IceArmorBuff;
      if (iceArmor.remainingDuration > 0) {
        const freezeDebuff = new FreezeDebuff();
        attacker.addDebuff(freezeDebuff);
        this.addLog(
          'freeze_counter',
          `${target.name} 的冰霜护甲触发`,
          `${attacker.name} 被冻结1回合`
        );
      }
    }

    // 检查冻结状态 - 受伤时解除冻结（绝对冻结除外）
    this.tryThawOnDamage(target);
  }

  /**
   * 检查目标是否被冻结
   */
  isTargetFrozen(target: CombatUnit): boolean {
    return target.debuffs.some(d =>
      d.type === DebuffType.FREEZE ||
      d.type === DebuffType.DEEP_FREEZE ||
      d.type === DebuffType.ABSOLUTE_FREEZE
    );
  }

  /**
   * 计算冻结概率（含冰霜印记加成）
   */
  calculateFreezeChance(baseChance: number, target: CombatUnit): number {
    const frostMarkDebuff = target.debuffs.find(d => d.type === DebuffType.FROST_MARK);
    if (frostMarkDebuff) {
      const frostMark = frostMarkDebuff as FrostMarkDebuff;
      const bonus = frostMark.getFreezeBonus();
      frostMark.consume();
      return Math.min(1.0, baseChance + bonus);
    }
    return baseChance;
  }

  /**
   * 应用冻结debuff
   */
  applyFreezeDebuff(target: CombatUnit, freezeType: 'freeze' | 'deep_freeze' | 'absolute_freeze'): void {
    target.debuffs = target.debuffs.filter(d =>
      d.type !== DebuffType.FREEZE &&
      d.type !== DebuffType.DEEP_FREEZE &&
      d.type !== DebuffType.ABSOLUTE_FREEZE
    );

    let debuff: FreezeDebuff | DeepFreezeDebuff | AbsoluteFreezeDebuff;
    switch (freezeType) {
      case 'deep_freeze':
        debuff = new DeepFreezeDebuff();
        break;
      case 'absolute_freeze':
        debuff = new AbsoluteFreezeDebuff();
        break;
      default:
        debuff = new FreezeDebuff();
    }
    target.addDebuff(debuff);
  }

  /**
   * 受伤时尝试解除冻结（绝对冻结除外）
   */
  private tryThawOnDamage(target: CombatUnit): void {
    const freezeDebuff = target.debuffs.find(d =>
      d.type === DebuffType.FREEZE || d.type === DebuffType.DEEP_FREEZE
    ) as FreezeDebuff | DeepFreezeDebuff | undefined;

    if (freezeDebuff && freezeDebuff.tryThaw) {
      if (freezeDebuff.tryThaw()) {
        target.debuffs = target.debuffs.filter(d => d !== freezeDebuff);
        this.addLog(
          'freeze_thaw',
          `${target.name} 因受伤解冻`,
          ''
        );
      }
    }
  }

  /**
   * 触发敌方受到冰属性攻击时的冻结效果
   */
  triggerEnemyFreezeOnDamage(target: CombatUnit, attacker: CombatUnit, isIceDamage: boolean): void {
    if (!isIceDamage) return;

    const frostMarkDebuff = target.debuffs.find(d => d.type === DebuffType.FROST_MARK);
    if (frostMarkDebuff) {
      const frostMark = frostMarkDebuff as FrostMarkDebuff;
      if (Math.random() < frostMark.getFreezeBonus()) {
        this.applyFreezeDebuff(target, 'freeze');
        this.addLog(
          'frost_mark_freeze',
          `${target.name} 的冰霜印记触发`,
          `${target.name} 被冻结`
        );
      }
      frostMark.consume();
    }
  }

  /**
   * 处理消耗增益治疗效果（光合爆发等技能）
   * 消耗所有增益层，每层回复一定百分比HP，并清除所有负面状态
   */
  private processConsumeBuffHeal(
    target: CombatUnit,
    healPercentPerStack: number
  ): { healedLayers: number; totalHeal: number } {
    // 计算所有增益的层数总和
    let totalLayers = 0;
    for (const buff of target.buffs) {
      totalLayers += buff.stacks;
    }

    // 计算治疗量
    const healPerLayer = Math.floor(target.maxHp * healPercentPerStack);
    const totalHeal = healPerLayer * totalLayers;

    // 执行治疗
    const actualHeal = target.heal(totalHeal);

    // 清除所有负面状态
    const debuffCount = target.debuffs.length;
    target.debuffs = [];

    // 清除所有增益状态（消耗增益）
    target.buffs = [];

    this.addLog(
      'consume_buff_heal',
      `${target.name} 使用光合爆发`,
      `消耗${totalLayers}层增益，回复${actualHeal}HP，清除${debuffCount}个负面状态`
    );

    return { healedLayers: totalLayers, totalHeal: actualHeal };
  }
  
  /**
   * 执行玩家治疗
   */
  executePlayerHeal(playerId: string, targetId: string, amount: number): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    const target = this.players.find(p => p.id === targetId);
    
    if (!player || !target) {
      return { success: false, message: '单位不存在' };
    }
    
    if (player.isDead || target.isDead) {
      return { success: false, message: '单位已阵亡' };
    }
    
    const actualHeal = target.heal(amount);
    
    this.addLog(
      'player_heal',
      `${player.name} 治疗 ${target.name}`,
      `恢复 ${actualHeal} HP`
    );
    
    this.emit({
      type: BattleEventType.UNIT_HEALED,
      sourceId: playerId,
      targetId: targetId,
      data: { amount: actualHeal }
    });
    
    return {
      success: true,
      message: `恢复 ${actualHeal} HP`,
      healing: actualHeal
    };
  }
  
  /**
   * 执行玩家使用道具
   */
  executeUseItem(playerId: string, itemId: string, targetId?: string): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    
    if (!player || player.isDead) {
      return { success: false, message: '单位不存在或已阵亡' };
    }
    
    // 道具效果在具体实现中处理
    this.addLog(
      'use_item',
      `${player.name} 使用道具`,
      itemId
    );
    
    return {
      success: true,
      message: '道具使用成功'
    };
  }
  
  /**
   * 跳过玩家回合
   */
  skipPlayerTurn(playerId: string): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    
    if (!player) {
      return { success: false, message: '单位不存在' };
    }
    
    this.addLog('skip_turn', `${player.name} 跳过回合`);
    
    return { success: true, message: '跳过回合' };
  }
  
  /**
   * 完成玩家回合
   */
  endPlayerTurn(): void {
    this.setPhase(BattlePhase.ENEMY_TURN);
    this.executeEnemyTurn();
  }
  
  // ==================== 敌人行动 ====================
  
  /**
   * 执行敌人回合
   */
  private executeEnemyTurn(): void {
    this.addLog('enemy_turn', '敌人回合开始');
    
    // 按速度排序敌人
    const sortedEnemies = [...this.enemies]
      .filter(e => !e.isDead)
      .sort((a, b) => b.getActualSpeed() - a.getActualSpeed());
    
    // 执行每个敌人的行动
    for (const enemy of sortedEnemies) {
      if (enemy.isDead) continue;
      
      const decision = enemy.decideAction();
      this.executeEnemyAction(enemy, decision);
      
      // 检查玩家是否全灭
      if (this.checkAllPlayersDead()) {
        this.endBattle(BattleResult.DEFEAT, '玩家全灭');
        return;
      }
    }
    
    // 敌人回合结束，进入下一回合
    this.endTurn();
  }
  
  /**
   * 执行敌人行动
   */
  private executeEnemyAction(enemy: EnemyUnit, decision: any): void {
    switch (decision.action) {
      case 'attack':
        this.executeEnemyAttack(enemy, decision);
        break;
      case 'heal':
        this.executeEnemyHeal(enemy);
        break;
      case 'defend':
        this.executeEnemyDefend(enemy);
        break;
      case 'buff':
        this.executeEnemyBuff(enemy);
        break;
      case 'debuff':
        this.executeEnemyDebuff(enemy, decision);
        break;
      default:
        this.executeEnemyAttack(enemy, decision);
    }
  }
  
  /**
   * 执行敌人攻击
   */
  private executeEnemyAttack(enemy: EnemyUnit, decision: any): void {
    const basePower = decision.power ?? enemy.intent.power ?? 10;

    if (decision.target === 'all') {
      // 全体攻击
      for (const player of this.players) {
        if (!player.isDead) {
          const damage = enemy.calculateDamage(basePower, player, 'physical', enemy.intent.element);
          const actualDamage = player.takeDamage(damage);

          // 检查目标的反制效果
          this.triggerOnDamagedEffects(player, enemy);

          this.emit({
            type: BattleEventType.UNIT_DAMAGED,
            sourceId: enemy.id,
            targetId: player.id,
            data: { damage: actualDamage }
          });

          if (player.isDead) {
            this.handleUnitDeath(player);
          }
        }
      }

      this.addLog(
        'enemy_attack_all',
        `${enemy.name} 发动全体攻击`,
        `对所有玩家造成伤害`
      );
    } else {
      // 单体攻击
      const alivePlayers = this.players.filter(p => !p.isDead);
      if (alivePlayers.length === 0) return;

      // 优先攻击嘲讽目标
      const tauntPlayer = alivePlayers.find(p =>
        p.buffs.some(b => b.type === BuffType.REDIRECT)
      );
      const target = tauntPlayer ?? alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

      const damage = enemy.calculateDamage(basePower, target, 'physical', enemy.intent.element);
      const actualDamage = target.takeDamage(damage);

      // 检查目标的反制效果
      this.triggerOnDamagedEffects(target, enemy);

      this.addLog(
        'enemy_attack',
        `${enemy.name} 攻击 ${target.name}`,
        `造成 ${actualDamage} 点伤害`
      );

      this.emit({
        type: BattleEventType.UNIT_DAMAGED,
        sourceId: enemy.id,
        targetId: target.id,
        data: { damage: actualDamage }
      });

      if (target.isDead) {
        this.handleUnitDeath(target);
      }
    }
  }
  
  /**
   * 执行敌人治疗
   */
  private executeEnemyHeal(enemy: EnemyUnit): void {
    const healAmount = Math.floor(enemy.maxHp * 0.25);
    enemy.heal(healAmount);
    
    this.addLog(
      'enemy_heal',
      `${enemy.name} 恢复生命`,
      `恢复 ${healAmount} HP`
    );
  }
  
  /**
   * 执行敌人防御
   */
  private executeEnemyDefend(enemy: EnemyUnit): void {
    // 给自己添加护盾
    const shieldValue = Math.floor(enemy.maxHp * 0.3);
    enemy.shield += shieldValue;
    
    this.addLog(
      'enemy_defend',
      `${enemy.name} 进入防御状态`,
      `获得 ${shieldValue} 护盾值`
    );
  }
  
  /**
   * 执行敌人Buff
   */
  private executeEnemyBuff(enemy: EnemyUnit): void {
    enemy.stages.attack = Math.min(6, enemy.stages.attack + 1);
    
    this.addLog(
      'enemy_buff',
      `${enemy.name} 提升能力`,
      `攻击力提升`
    );
    
    this.emit({
      type: BattleEventType.BUFF_ADDED,
      sourceId: enemy.id
    });
  }
  
  /**
   * 执行敌人Debuff
   */
  private executeEnemyDebuff(enemy: EnemyUnit, decision: any): void {
    const alivePlayers = this.players.filter(p => !p.isDead);
    if (alivePlayers.length === 0) return;
    
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    
    this.addLog(
      'enemy_debuff',
      `${enemy.name} 对 ${target.name} 施加弱化`,
      ''
    );
    
    this.emit({
      type: BattleEventType.DEBUFF_ADDED,
      sourceId: enemy.id,
      targetId: target.id
    });
  }
  
  // ==================== 死亡处理 ====================
  
  /**
   * 处理单位死亡
   */
  private handleUnitDeath(unit: CombatUnit): void {
    this.addLog(
      'unit_died',
      `${unit.name} 阵亡`,
      ''
    );
    
    this.emit({
      type: BattleEventType.UNIT_DIED,
      targetId: unit.id
    });
  }
  
  // ==================== 胜负判定 ====================
  
  /**
   * 检查战斗是否结束
   */
  private checkBattleEnd(): boolean {
    // 检查胜利
    if (this.enemies.every(e => e.isDead)) {
      this.endBattle(BattleResult.VICTORY, '击败所有敌人');
      return true;
    }
    
    // 检查失败
    if (this.checkAllPlayersDead()) {
      this.endBattle(BattleResult.DEFEAT, '玩家全灭');
      return true;
    }
    
    return false;
  }
  
  /**
   * 检查所有玩家是否死亡
   */
  private checkAllPlayersDead(): boolean {
    return this.players.every(p => p.isDead);
  }
  
  /**
   * 结束战斗
   */
  private endBattle(result: BattleResult, reason: string): void {
    this.result = result;
    this.setPhase(result === BattleResult.VICTORY ? BattlePhase.VICTORY : BattlePhase.DEFEAT);
    
    this.addLog(
      'battle_end',
      `战斗结束：${result === BattleResult.VICTORY ? '胜利' : '失败'}`,
      reason
    );
    
    this.onBattleEnd?.(result);
    
    this.emit({
      type: BattleEventType.BATTLE_END,
      data: { result, reason }
    });
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 添加战斗日志
   */
  private addLog(action: string, message: string, result?: string): void {
    this.log.push({
      turn: this.currentTurn,
      phase: this.phase,
      action,
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * 获取所有存活玩家
   */
  getAlivePlayers(): PlayerUnit[] {
    return this.players.filter(p => !p.isDead);
  }
  
  /**
   * 获取所有存活敌人
   */
  getAliveEnemies(): EnemyUnit[] {
    return this.enemies.filter(e => !e.isDead);
  }
  
  /**
   * 获取随机存活敌人
   */
  randomEnemy(): EnemyUnit | null {
    const alive = this.getAliveEnemies();
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  }
  
  /**
   * 获取敌人意图信息
   */
  getEnemyIntents(): Array<{ enemyId: string; intent: Intent }> {
    return this.enemies
      .filter(e => !e.isDead)
      .map(e => ({ enemyId: e.id, intent: e.intent }));
  }
  
  /**
   * 获取战斗摘要
   */
  getBattleSummary(): BattleSummary {
    return {
      type: this.type,
      phase: this.phase,
      currentTurn: this.currentTurn,
      result: this.result,
      players: this.players.map(p => p.getStatusSummary()),
      enemies: this.enemies.map(e => e.getStatusSummary())
    };
  }
}

/**
 * 行动结果
 */
export interface ActionResult {
  success: boolean;
  message: string;
  damage?: number;
  healing?: number;
  targetDied?: boolean;
}

/**
 * 战斗摘要
 */
export interface BattleSummary {
  type: BattleType;
  phase: BattlePhase;
  currentTurn: number;
  result: BattleResult | null;
  players: any[];
  enemies: any[];
}
