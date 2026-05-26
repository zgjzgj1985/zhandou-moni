/**
 * 循迹之境 - 战斗模块导出
 */

export { CombatUnit } from './CombatUnit';
export type { UnitConfig, UnitStatusSummary, StatStages } from './CombatUnit';
export { PlayerUnit } from './PlayerUnit';
export type { PlayerUnitConfig } from './PlayerUnit';
export { EnemyUnit, AIDifficulty } from './EnemyUnit';
export type { EnemyUnitConfig, AIDecision, IntentDisplayInfo } from './EnemyUnit';
export { BattleManager } from './BattleManager';
export type { BattleConfig, BattleEventListener, BattleLogEntry, ActionResult, BattleSummary } from './BattleManager';
export { createDemoBattle, createQuickDemo, runDemoBattleReport } from './BattleDemo';
