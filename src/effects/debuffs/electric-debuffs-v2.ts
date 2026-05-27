/**
 * 循迹之境 - 电属性·电磁脉冲流Debuff
 * 
 * Debuff类：
 * - StaticDebuff：静电（攻击者额外+1电荷）
 */

import { Debuff } from './index';
import { DebuffType } from '../../types';
import type { DebuffCombatUnit } from './index';

/**
 * ==================== 电属性Debuff ====================
 */

/**
 * 静电debuff：攻击者额外获得1层电荷
 * 触发条件：蓄电护体反击/静电标记
 */
export class StaticDebuff extends Debuff {
  private chargeBonus: number;

  constructor(duration: number = 3, chargeBonus: number = 1) {
    super('静电', DebuffType.STATIC, 1, duration);
    this.chargeBonus = chargeBonus;
  }

  /**
   * 获取静电提供的额外电荷数
   */
  getChargeBonus(): number {
    return this.chargeBonus;
  }

  /**
   * 获取静电描述
   */
  getDescription(): string {
    return `受到攻击时，攻击者额外+${this.chargeBonus}层电荷`;
  }

  clone(): StaticDebuff {
    return new StaticDebuff(this.remainingDuration, this.chargeBonus);
  }
}
