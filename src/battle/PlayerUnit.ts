/**
 * 循迹之境 - 玩家战斗单位
 */

import { CombatUnit, UnitConfig } from './CombatUnit';
import { Skill } from '../skills';
import { ElementType, SpeedStats, DEFAULT_ENERGY, EnergyConfig } from '../types';

/**
 * 玩家单位配置
 */
export interface PlayerUnitConfig extends UnitConfig {
  skills: Skill[];
  energyConfig?: EnergyConfig; // 能量配置
}

/**
 * 玩家战斗单位
 */
export class PlayerUnit extends CombatUnit {
  skills: Skill[];
  
  // 能量系统
  private _energy: number;
  readonly maxEnergy: number;
  
  constructor(config: PlayerUnitConfig) {
    super(config);
    this.skills = config.skills;
    this.maxEnergy = config.energyConfig?.maxEnergy ?? DEFAULT_ENERGY.maxEnergy;
    this._energy = config.energyConfig?.currentEnergy ?? DEFAULT_ENERGY.currentEnergy;
    
    // 如果需要重置能量
    if (config.energyConfig === undefined || config.energyConfig.currentEnergy === DEFAULT_ENERGY.maxEnergy) {
      this._energy = this.maxEnergy;
    }
  }
  
  /**
   * 获取当前能量
   */
  get energy(): number {
    return this._energy;
  }
  
  /**
   * 设置能量
   */
  set energy(value: number) {
    this._energy = Math.max(0, Math.min(value, this.maxEnergy));
  }
  
  /**
   * 获取能量信息
   */
  getEnergyInfo(): { current: number; max: number } {
    return {
      current: this._energy,
      max: this.maxEnergy
    };
  }
  
  /**
   * 获取可用的技能列表（基于当前能量）
   */
  getAvailableSkills(): Skill[] {
    return this.skills.filter(s => s.canUse(this._energy));
  }
  
  /**
   * 检查是否可以使用指定技能
   */
  canUseSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId);
    return skill ? skill.canUse(this._energy) : false;
  }
  
  /**
   * 使用技能并消耗能量
   * @returns 是否使用成功
   */
  useSkill(skillId: string): { skill: Skill | null; energySpent: number } {
    const skill = this.skills.find(s => s.id === skillId);
    if (skill && skill.canUse(this._energy)) {
      const energySpent = skill.getEnergyConsumption();
      this._energy -= energySpent;
      return { skill, energySpent };
    }
    return { skill: null, energySpent: 0 };
  }
  
  /**
   * 每回合开始时回复能量
   */
  regenerateEnergy(): void {
    this._energy = this.maxEnergy;
  }
  
  /**
   * 恢复能量（道具等）
   */
  restoreEnergy(amount: number): number {
    const oldEnergy = this._energy;
    this._energy = Math.min(this._energy + amount, this.maxEnergy);
    return this._energy - oldEnergy;
  }
  
  /**
   * 恢复所有技能能量（切换下场时）
   */
  resetEnergy(): void {
    this._energy = this.maxEnergy;
  }
  
  /**
   * 获取技能能量消耗信息
   */
  getSkillEnergyCost(skillId: string): number {
    const skill = this.skills.find(s => s.id === skillId);
    return skill ? skill.energyCost : 0;
  }
}
