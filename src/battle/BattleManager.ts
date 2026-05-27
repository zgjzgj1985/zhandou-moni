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
import {
  VineBodyBuff,
  IceArmorBuff,
  IceWallBuff,
  FrostFieldBuff,
  DragonBloodBuff,
  DragonResonanceBuff,
  DragonGuardBuff,
  DragonAuraBuff
} from '../effects/buffs';
import {
  TangleDebuff,
  ParalysisDebuff,
  FreezeDebuff,
  FrostMarkDebuff,
  WetDebuff,
  SlowDebuff,
  DrowningStatusDebuff,
  TurbulenceDebuff,
  StunDebuff,
  BurnDebuff,
  PoisonDebuff,
  BleedDebuff,
  WeaknessDebuff,
  TerrorDebuff,
  SleepDebuff,
  ConfusionDebuff,
  BindDebuff,
  IceSealDebuff,
  IceDotDebuff,
  FrostDebuff,
  BurnMarkDebuff,
  CombustionMarkDebuff,
  StaticDebuff,
  ElectricShockDebuff,
  MindWoundDebuff,
  ForbiddenDebuff,
  ParasiteDebuff,
  DragonBurnDebuff,
  DragonIntimidateDebuff,
  DragonPowerLossDebuff,
  DragonCrushDefDebuff,
  Debuff
} from '../effects/debuffs';

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
 * 临时属性效果（带持续时间）
 */
export interface TempStatEffect {
  id: string;
  targetId: string;
  stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';
  stages: number;
  remainingTurns: number;
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

  // 临时属性效果追踪（带持续时间）
  private tempStatEffects: TempStatEffect[];
  
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
    this.tempStatEffects = [];
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

      // 龙之气息自动积累：每回合开始时龙属性单位+1层
      if (player.elements.includes(ElementType.DRAGON) && !player.isDead) {
        const added = player.addDragonBlood(1);
        if (added > 0) {
          this.addLog(
            'dragon_blood_gain',
            `${player.name} 的龙之气息`,
            `+${added}层（当前${player.getDragonBloodStacks()}层）`
          );
        }
      }
    }

    // 敌人单位回合开始
    for (const enemy of this.enemies) {
      enemy.onTurnStart();

      // 龙之气息自动积累：敌方龙属性单位也获得龙之气息
      if (enemy.elements.includes(ElementType.DRAGON) && !enemy.isDead) {
        const added = enemy.addDragonBlood(1);
        if (added > 0) {
          this.addLog(
            'dragon_blood_gain',
            `${enemy.name} 的龙之气息`,
            `+${added}层（当前${enemy.getDragonBloodStacks()}层）`
          );
        }
      }
    }

    // 处理灼伤印记 - 在行动前追加火属性伤害
    this.processBurnMarkEffects();

    // 处理燃尽印记 - 回合结束时触发，但检查是否到期
    this.processCombustionMarkEffects();

    // 处理延迟效果
    this.processDelayedEffects();
  }

  /**
   * 处理灼伤印记效果 - 下回合行动前追加伤害
   */
  private processBurnMarkEffects(): void {
    for (const player of this.players) {
      for (const debuff of player.debuffs) {
        if (debuff.type === DebuffType.BURN_MARK) {
          const burnMark = debuff as BurnMarkDebuff;
          // 灼伤印记在回合开始时触发，对随机敌人造成伤害
          const aliveEnemies = this.enemies.filter(e => !e.isDead);
          if (aliveEnemies.length > 0) {
            const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            const damage = player.calculateDamage(burnMark.getExtraDamage(), target, 'special', ElementType.FIRE);
            const actualDamage = target.takeDamage(damage, 'special');
            this.addLog(
              'burn_mark',
              `${player.name} 的灼伤印记触发`,
              `对 ${target.name} 造成 ${actualDamage} 点火属性伤害`
            );
            // 消耗灼伤印记
            burnMark.consume();
            // 移除已消耗的debuff
            player.debuffs = player.debuffs.filter(d => d !== debuff);
          }
        }
      }
    }
  }

  /**
   * 处理燃尽印记效果 - 延迟触发
   */
  private processCombustionMarkEffects(): void {
    for (const enemy of this.enemies) {
      for (const debuff of enemy.debuffs) {
        if (debuff.type === DebuffType.COMBUSTION_MARK) {
          const combustionMark = debuff as CombustionMarkDebuff;
          // 燃尽印记在持续回合结束时触发
          if (combustionMark.remainingDuration <= 1) {
            const damage = Math.floor(enemy.currentHp * combustionMark.getDamagePercent());
            const actualDamage = enemy.takeDamage(damage, 'special');
            this.addLog(
              'combustion_mark',
              `${enemy.name} 的燃尽印记触发`,
              `扣除 ${actualDamage} 点HP（30%当前HP）`
            );
            combustionMark.consume();
            enemy.debuffs = enemy.debuffs.filter(d => d !== debuff);
          }
        }
      }
    }
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
  private createDebuffFromType(debuffType: DebuffType, stacks: number = 1, duration: number = 3): Debuff | null {
    switch (debuffType) {
      // 基础Debuff
      case DebuffType.POISON:
        return new PoisonDebuff(stacks, duration);
      case DebuffType.BURN:
        return new BurnDebuff(stacks, duration);
      case DebuffType.BLEED:
        return new BleedDebuff(stacks, duration);
      case DebuffType.WEAKNESS:
        return new WeaknessDebuff(stacks, duration);
      case DebuffType.TERROR:
        return new TerrorDebuff(stacks, duration);
      case DebuffType.PARALYSIS:
        return new ParalysisDebuff(duration);
      case DebuffType.SLEEP:
        return new SleepDebuff(1, 3);
      case DebuffType.FREEZE:
        return new FreezeDebuff();
      case DebuffType.CONFUSION:
        return new ConfusionDebuff(duration);
      case DebuffType.BIND:
        return new BindDebuff(duration);
      case DebuffType.STUN:
        return new StunDebuff(duration);

      // 冰属性Debuff
      case DebuffType.SLOW:
        return new SlowDebuff(stacks, duration);
      case DebuffType.ICE_SEAL:
        return new IceSealDebuff(duration);
      case DebuffType.ICE_DOT:
        return new IceDotDebuff(duration);
      case DebuffType.FROST:
        return new FrostDebuff(stacks, duration);
      case DebuffType.FROST_MARK:
        return new FrostMarkDebuff(duration);

      // 火属性Debuff
      case DebuffType.BURN_MARK:
        return new BurnMarkDebuff();
      case DebuffType.COMBUSTION_MARK:
        return new CombustionMarkDebuff(duration);

      // 水属性Debuff
      case DebuffType.WET:
        return new WetDebuff(duration);
      case DebuffType.DROWNING_STATUS:
        return new DrowningStatusDebuff(duration);
      case DebuffType.TURBULENCE:
        return new TurbulenceDebuff(duration);

      // 超能属性Debuff
      case DebuffType.MIND_WOUND:
        return new MindWoundDebuff(duration);
      case DebuffType.FORBIDDEN:
        return new ForbiddenDebuff(duration);

      // 草属性Debuff
      case DebuffType.TANGLE:
        return new TangleDebuff(stacks, duration);
      case DebuffType.PARASITE:
        return new ParasiteDebuff(duration);

      // 龙属性Debuff
      case DebuffType.DRAGON_BURN:
        return new DragonBurnDebuff(duration);
      case DebuffType.DRAGON_CONFUSION:
        return new DragonConfusionDebuff(duration);
      case DebuffType.DRAGON_CRUSH_DEF:
        return new DragonCrushDefDebuff(duration);
      case DebuffType.DRAGON_INTIMIDATE:
        return new DragonIntimidateDebuff(duration);
      case DebuffType.DRAGON_POWER_LOSS:
        return new DragonPowerLossDebuff();

      default:
        console.warn(`未处理的DebuffType: ${debuffType}`);
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
    // 处理临时属性效果的持续时间
    this.processTempStatEffects();

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

  /**
   * 处理临时属性效果的持续时间
   */
  private processTempStatEffects(): void {
    const expiredEffects: TempStatEffect[] = [];

    for (const effect of this.tempStatEffects) {
      effect.remainingTurns--;

      if (effect.remainingTurns <= 0) {
        expiredEffects.push(effect);
      }
    }

    // 移除过期效果的属性变化
    for (const effect of expiredEffects) {
      this.tempStatEffects = this.tempStatEffects.filter(e => e.id !== effect.id);

      // 找到目标单位并移除属性效果
      const target = [...this.players, ...this.enemies].find(u => u.id === effect.targetId);
      if (target) {
        target.modifyStat(effect.stat, -effect.stages);

        const statNames: Record<string, string> = {
          'attack': '攻击',
          'defense': '防御',
          'spAttack': '特攻',
          'spDefense': '特防',
          'speed': '速度'
        };
        const direction = effect.stages > 0 ? '提升' : '下降';

        this.addLog(
          'buff_expired',
          `${target.name} 的 ${statNames[effect.stat]}${direction} 效果结束`,
          `${statNames[effect.stat]}恢复`
        );
      }
    }
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

    // 检查虚弱状态 - 虚弱状态下无法使用技能
    const hasWeakness = player.debuffs.some(d => d.type === DebuffType.WEAKNESS);
    if (hasWeakness) {
      return { success: false, message: '虚弱状态下无法使用技能' };
    }

    // 检查铁壁状态 - 铁壁状态下无法使用攻击技能
    if (isAttackSkill) {
      const ironWallBuff = player.buffs.find(b => b.type === BuffType.IRON_WALL);
      if (ironWallBuff) {
        const ironWall = ironWallBuff as any;
        if (ironWall.isAttackBlocked && ironWall.isAttackBlocked()) {
          return { success: false, message: '铁壁状态下无法使用攻击技能' };
        }
      }
    }

    // 获取当前能量（用于蓄焰等效果计算，在消耗能量之前）
    const currentEnergy = player.energy;

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
          const hitCount = effect.damage.hits || 1;  // 多段伤害次数，默认1次

          // 条件增伤判定：目标无状态时增加20威力（落石技能）
          let actualPower = effect.damage.basePower;
          if (target.hasNoStatus()) {
            actualPower += 20;
            results.push(`【纯净目标】威力+20`);
          }

          // 蓄焰buff检查：火属性攻击时，根据当前能量增加威力
          if (effect.damage.element === ElementType.FIRE) {
            const flameChargeBuff = player.buffs.find(b => b.type === BuffType.FLAME_CHARGE);
            if (flameChargeBuff) {
              const flameCharge = flameChargeBuff as any;
              const extraDamage = flameCharge.getExtraDamage ? flameCharge.getExtraDamage(currentEnergy) : 0;
              if (extraDamage > 0) {
                actualPower += extraDamage;
                results.push(`【蓄焰】威力+${extraDamage}`);
                // 消耗蓄焰效果
                if (flameCharge.consume) {
                  flameCharge.consume();
                }
              }
            }

            // 烈焰护体buff检查：下次火属性攻击威力+40
            const flameBodyBuff = player.buffs.find(b => b.type === BuffType.FLAME_BODY);
            if (flameBodyBuff) {
              const flameBody = flameBodyBuff as any;
              if (flameBody.isActive && flameBody.isActive() && flameBody.getExtraDamage) {
                const extraDamage = flameBody.getExtraDamage();
                if (extraDamage > 0) {
                  actualPower += extraDamage;
                  results.push(`【烈焰护体】威力+${extraDamage}`);
                  // 消耗烈焰护体效果
                  flameBody.consume();
                }
              }
            }
          }

          let totalDamage = 0;

          // 多段伤害处理
          for (let hit = 1; hit <= hitCount; hit++) {
            const damage = player.calculateDamage(
              actualPower,
              target,
              damageType,
              effect.damage.element
            );
            const actualDamage = target.takeDamage(damage, damageType);
            totalDamage += actualDamage;
            
            // 只有多段伤害才显示次数，单段不显示
            if (hitCount > 1) {
              results.push(`第${hit}击: ${actualDamage}伤害`);
            }
            
            // 每次命中判定冻结效果
            if (effect.applyDebuff?.debuffType === 'freeze') {
              const freezeChance = this.calculateFreezeChance(effect.applyDebuff.successRate || 0.2, target);
              if (Math.random() < freezeChance) {
                this.applyFreezeDebuff(target);
                results.push('目标被冻结！');
                break;  // 冻结后停止后续攻击判定
              }
            }
            
            // 每次命中25%概率攻击+1级
            if (hitCount > 1 && Math.random() < 0.25) {
              player.modifyStat('attack', 1);
              results.push(`【攻击蓄力】攻击+1级`);
            }
            
            // 检查反制效果
            this.triggerOnDamagedEffects(target, player);

            // 检查震荡护体的眩晕效果
            const quakeBodyBuff = player.buffs.find(b => b.type === BuffType.QUAKE_BODY);
            if (quakeBodyBuff) {
              const quakeBody = quakeBodyBuff as any;
              if (quakeBody.getStunChance && Math.random() < quakeBody.getStunChance()) {
                const stunDebuff = new StunDebuff(1);
                target.addDebuff(stunDebuff);
                results.push('目标被眩晕！');
              }
            }

            // 检查目标死亡
            if (target.isDead) {
              this.handleUnitDeath(target);
              break;
            }
          }

          // 多段伤害灼烧判定：在所有攻击命中后判定一次灼烧（烈焰拳等技能效果）
          if (effect.applyDebuff?.debuffType === 'burn') {
            const burnDebuff = effect.applyDebuff;
            const successRate = burnDebuff.successRate ?? 0.5;
            const stacks = burnDebuff.stacks ?? 1;
            const duration = burnDebuff.duration ?? 3;

            if (Math.random() < successRate) {
              const newBurnDebuff = new BurnDebuff(duration, stacks);
              target.addDebuff(newBurnDebuff);
              results.push(`目标陷入灼烧（${stacks}层）`);
            }
          }

          // 单段伤害显示总伤害
          if (hitCount === 1) {
            results.push(`造成 ${totalDamage} 点伤害`);
          } else {
            results.push(`累计造成 ${totalDamage} 点伤害`);
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

      // 处理自身Debuff效果（施法者获得）
      if (effect.selfDebuff) {
        const debuff = this.createDebuffFromType(
          effect.selfDebuff.debuffType as DebuffType,
          effect.selfDebuff.stacks ?? 1,
          effect.selfDebuff.duration ?? 2
        );
        if (debuff) {
          player.addDebuff(debuff);
          results.push(`自身获得「${debuff.name}」`);
        }
      }

      // 处理属性强化效果
      // stages > 0：对自身施放强化；stages < 0：对目标施放削弱
      if (effect.statBoost) {
        const isDebuff = effect.statBoost.stages < 0;
        const statTarget = isDebuff
          ? this.findSkillTarget(player, skill.definition.target, targetId)
          : player;
        if (statTarget) {
          const statResult = this.applyStatBoost(statTarget, effect.statBoost);
          results.push(statResult);
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

    // 检查火盾效果 - 受伤时对攻击者附加灼烧（1层）
    const fireShieldBuff = target.buffs.find(b => b.type === BuffType.FIRE_SHIELD);
    if (fireShieldBuff) {
      const fireShield = fireShieldBuff as any;
      if (fireShield.remainingDuration > 0) {
        const burnDebuff = new BurnDebuff(1, 1);
        attacker.addDebuff(burnDebuff);
        this.addLog(
          'counter_effect',
          `${target.name} 的火盾触发`,
          `对 ${attacker.name} 附加灼烧（1层）`
        );
      }
    }

    // 检查龙鳞守护效果 - 受伤时反击伤害
    const dragonGuardBuff = target.buffs.find(b => b.type === BuffType.DRAGON_GUARD);
    if (dragonGuardBuff) {
      const dragonGuard = dragonGuardBuff as DragonGuardBuff;
      if (!dragonGuard.isCounterTriggered()) {
        const counterDamage = dragonGuard.getCounterDamage();
        if (counterDamage > 0) {
          const damage = attacker.calculateDamage(counterDamage, target, 'special', ElementType.DRAGON);
          const actualDamage = target.takeDamage(damage, 'special');
          dragonGuard.triggerCounter();
          this.addLog(
            'dragon_counter',
            `${target.name} 的龙鳞守护触发`,
            `对 ${attacker.name} 反击 ${actualDamage} 伤害`
          );
        }
      }
    }

    // 检查龙属共鸣效果 - 触发时给攻击者附加龙威debuff
    const dragonResonanceBuff = target.buffs.find(b => b.type === BuffType.DRAGON_BLOOD_RESONANCE);
    if (dragonResonanceBuff) {
      const resonance = dragonResonanceBuff as DragonResonanceBuff;
      if (resonance.isResonanceActive()) {
        const dragonIntimidateDebuff = new DragonIntimidateDebuff(1, true);  // 增强版
        attacker.addDebuff(dragonIntimidateDebuff);
        this.addLog(
          'dragon_resonance_counter',
          `${target.name} 的龙属共鸣触发`,
          `对 ${attacker.name} 施加龙威震慑（增强版）`
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
      d.type === DebuffType.FREEZE
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
   * 当前只支持普通冻结(freeze)
   */
  applyFreezeDebuff(target: CombatUnit, freezeType: 'freeze' | 'deep_freeze' | 'absolute_freeze' = 'freeze'): void {
    // 移除已有的冻结状态
    target.debuffs = target.debuffs.filter(d =>
      d.type !== DebuffType.FREEZE
    );

    // 应用普通冻结
    const debuff = new FreezeDebuff();
    target.addDebuff(debuff);
  }

  /**
   * 受伤时尝试解除冻结（绝对冻结除外）
   */
  private tryThawOnDamage(target: CombatUnit): void {
    const freezeDebuff = target.debuffs.find(d =>
      d.type === DebuffType.FREEZE
    );

    if (freezeDebuff && 'tryThaw' in freezeDebuff && typeof freezeDebuff.tryThaw === 'function') {
      const result = (freezeDebuff as any).tryThaw();
      if (result) {
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

    // 按先手值+速度排序敌人
    const sortedEnemies = [...this.enemies]
      .filter(e => !e.isDead)
      .sort((a, b) => this.compareActionOrder(a, b));

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
   * 比较两个单位的行动顺序
   * 先手值高的优先出手，先手值相同时速度高的优先
   */
  private compareActionOrder(a: CombatUnit, b: CombatUnit): number {
    const priorityA = this.getUnitPriority(a);
    const priorityB = this.getUnitPriority(b);

    // 先比较先手值
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // 先手值高的在前
    }

    // 先手值相同时，按速度排序
    return b.getActualSpeed() - a.getActualSpeed();
  }

  /**
   * 获取单位的先手值
   * 考虑技能和Buff的先手加成
   */
  private getUnitPriority(unit: CombatUnit): number {
    let priority = 0;

    // 检查是否有先手相关的Buff效果
    for (const buff of unit.buffs) {
      if (buff.type === BuffType.FLOW) {
        // 流水状态：速度+1级间接提升先手
        priority += 1;
      }
    }

    return priority;
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

  // ==================== 属性强化处理 ====================

  /**
   * 应用属性强化效果
   */
  private applyStatBoost(
    target: CombatUnit,
    statBoost: { stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed'; stages: number; duration?: number }
  ): string {
    const statNames: Record<string, string> = {
      'attack': '攻击',
      'defense': '防御',
      'spAttack': '特攻',
      'spDefense': '特防',
      'speed': '速度'
    };

    const statKey = statBoost.stat;
    const stages = statBoost.stages;
    const duration = statBoost.duration ?? 0;
    const statName = statNames[statKey] || statKey;

    if (duration > 0) {
      // 临时效果：带持续时间
      const effect: TempStatEffect = {
        id: crypto.randomUUID(),
        targetId: target.id,
        stat: statKey,
        stages: stages,
        remainingTurns: duration
      };
      this.tempStatEffects.push(effect);
      target.modifyStat(statKey, stages);

      const direction = stages > 0 ? '提升' : '下降';
      const result = `${target.name} ${statName}${direction} ${Math.abs(stages)}级（持续${duration}回合）`;

      this.emit({
        type: BattleEventType.BUFF_ADDED,
        targetId: target.id
      });

      return result;
    } else {
      // 永久效果（无持续时间）
      target.modifyStat(statKey, stages);

      const direction = stages > 0 ? '提升' : '下降';
      const result = `${target.name} ${statName}${direction} ${Math.abs(stages)}级`;

      this.emit({
        type: BattleEventType.BUFF_ADDED,
        targetId: target.id
      });

      return result;
    }
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
