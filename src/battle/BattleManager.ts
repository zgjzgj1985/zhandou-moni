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
  BuffType
} from '../types';
import { CombatUnit } from './CombatUnit';
import { PlayerUnit } from './PlayerUnit';
import { EnemyUnit } from './EnemyUnit';
import { DamageType } from '../types';

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
