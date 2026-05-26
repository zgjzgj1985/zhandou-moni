/**
 * 战斗Demo - 循迹之境
 * 玩家伙伴在左，敌人在右
 * 点击伙伴显示技能卡牌，拖拽到目标释放技能
 */

import { BattleManager, BattleConfig } from './BattleManager';
import { BattleType } from '../types';
import { createWindSparrow, createThunderStag, createFrostCrane } from '../companions';
import { createFlameSalamander, createVenomSpider, createFrostWolf } from '../monsters';

/**
 * 创建演示战斗配置
 */
export function createDemoBattle(): BattleManager {
  const config: BattleConfig = {
    type: BattleType.NORMAL,
    players: [
      createWindSparrow(),
      createThunderStag(),
      createFrostCrane()
    ],
    enemies: [
      createFlameSalamander(),
      createVenomSpider(),
      createFrostWolf()
    ],
    turnLimit: 50
  };
  
  return new BattleManager(config);
}

/**
 * 创建快速演示（单怪物）
 */
export function createQuickDemo(): BattleManager {
  const config: BattleConfig = {
    type: BattleType.NORMAL,
    players: [
      createWindSparrow(),
      createThunderStag(),
      createFrostCrane()
    ],
    enemies: [
      createFlameSalamander()
    ],
    turnLimit: 30
  };
  
  return new BattleManager(config);
}

/**
 * 演示战斗报告
 */
export function runDemoBattleReport(): string {
  const battle = createDemoBattle();
  const report: string[] = [];
  
  report.push('=== 循迹之境 · 战斗演示 ===\n');
  report.push('【我方阵容】');
  for (const player of battle.players) {
    report.push(`  ${player.name} (Lv.${player.level})`);
    report.push(`    属性: ${player.elements.join('/')}`);
    report.push(`    HP: ${player.maxHp} | 攻击: ${player.attack} | 速度: ${player.speed.baseSpeed}`);
    report.push(`    技能: ${player.skills.map(s => s.name).join(', ')}`);
  }
  
  report.push('\n【敌方阵容】');
  for (const enemy of battle.enemies) {
    report.push(`  ${enemy.name} (Lv.${enemy.level}) - ${enemy.aiStrategy}`);
    report.push(`    属性: ${enemy.elements.join('/')}`);
    report.push(`    HP: ${enemy.maxHp} | 攻击: ${enemy.attack} | 速度: ${enemy.speed.baseSpeed}`);
    report.push(`    掉落: ${enemy.goldReward}金币, ${enemy.expReward}经验`);
  }
  
  report.push('\n【战斗类型】');
  report.push(`  ${BattleType.NORMAL} - 3v3普通战斗`);
  
  return report.join('\n');
}
