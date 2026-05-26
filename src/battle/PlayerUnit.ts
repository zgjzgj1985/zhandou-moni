/**
 * 循迹之境 - 玩家战斗单位
 */

import { CombatUnit, UnitConfig } from './CombatUnit';
import { Skill } from '../skills';
import { ElementType, SpeedStats } from '../types';

/**
 * 玩家单位配置
 */
export interface PlayerUnitConfig extends UnitConfig {
  skills: Skill[];
  maxPp?: boolean; // 是否满PP
}

/**
 * 玩家战斗单位
 */
export class PlayerUnit extends CombatUnit {
  skills: Skill[];
  
  constructor(config: PlayerUnitConfig) {
    super(config);
    this.skills = config.skills;
    
    // 如果需要重置PP
    if (config.maxPp) {
      for (const skill of this.skills) {
        skill.resetPP();
      }
    }
  }
  
  /**
   * 获取可用的技能列表
   */
  getAvailableSkills(): Skill[] {
    return this.skills.filter(s => s.canUse());
  }
  
  /**
   * 使用技能
   */
  useSkill(skillId: string): Skill | null {
    const skill = this.skills.find(s => s.id === skillId);
    if (skill && skill.canUse()) {
      skill.use();
      return skill;
    }
    return null;
  }
  
  /**
   * 恢复所有技能PP
   */
  restoreAllPP(): void {
    for (const skill of this.skills) {
      skill.resetPP();
    }
  }
  
  /**
   * 恢复单个技能PP
   */
  restoreSkillPP(skillId: string, amount: number): void {
    const skill = this.skills.find(s => s.id === skillId);
    if (skill) {
      skill.restorePP(amount);
    }
  }
  
  /**
   * 检查是否可以使用指定技能
   */
  canUseSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId);
    return skill ? skill.canUse() : false;
  }
  
  /**
   * 获取技能PP信息
   */
  getSkillPPInfo(skillId: string): { current: number; max: number } | null {
    const skill = this.skills.find(s => s.id === skillId);
    return skill ? skill.getPPInfo() : null;
  }
}
