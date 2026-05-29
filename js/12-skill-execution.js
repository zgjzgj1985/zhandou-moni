// 玩家技能执行系统
// 从 battle-simple.html 行 4151-4945 提取

// 执行玩家命令
async function executePlayerCommand(caster, skill, targetId) {
  // 冻结状态检查
  if (caster.frozen) {
    addLog(`${caster.name} 被冻结了，无法行动！`);
    caster.frozenTurns = Math.max(0, caster.frozenTurns - 1);
    if (caster.frozenTurns <= 0) {
      caster.frozen = false;
      addLog(`${caster.name} 的冻结解除了！`);
    }
    return;
  }

  const target = [...enemyUnits, ...playerUnits].find(u => u.id === targetId);
  if (!target || target.currentHp <= 0) return;

  // 检查防御技能冷却
  if (skill.cooldown && skill.cooldown > 0) {
    const unitCooldowns = defenseSkillCooldowns[caster.id] || {};
    if (unitCooldowns[skill.id] && unitCooldowns[skill.id] > 0) {
      addLog(`${caster.name} 的 ${skill.name} 处于冷却中（剩余${unitCooldowns[skill.id]}回合）`);
      return;
    }
  }

  // 处理休息技能（回复能量）
  if (skill.effect === 'energy_restore') {
    const energyRestore = skill.power || 5;
    const oldEnergy = caster.energy;
    caster.energy = Math.min(caster.energy + energyRestore, MAX_ENERGY);
    const actualRestore = caster.energy - oldEnergy;
    addLog(`${caster.name} 使用 ${skill.name}，回复 ${actualRestore} 点能量（${oldEnergy}→${caster.energy}）`, 'heal');
    return;
  }

  if (skill.target === 'single_enemy') {
    // 攻击技能
    // 挖洞免疫：目标在地下时免疫地面攻击
    if (target.immuneGround && skill.element === 'ground') {
      addLog(`${target.name} 正在地下，免疫了地面攻击！`, 'buff');
      return;
    }
    // 精神免疫：目标免疫精神类攻击
    if (target.psychicResist && skill.element === 'psychic') {
      addLog(`${target.name} 的「精神免疫」效果发动，免疫了超能属性攻击！`, 'buff');
      return;
    }
    // 迷雾之躯：闪避判定（70%概率闪避任意攻击）
    if (target.mistBody && target.mistBodyTurns > 0) {
      const dodgeChance = target.mistBodyChance || 0.7;
      if (Math.random() < dodgeChance) {
        addLog(`${target.name} 的「迷雾之躯」效果发动，闪避了这次攻击！`, 'buff');
        target.speedBoost = (target.speedBoost || 0) + 1;
        target.speedBoostTurns = 3;
        addLog(`${target.name} 闪避成功后速度提升1级！`, 'buff');
        return;
      }
    }
    // 冰霜印记加成：消耗所有层数，每层+15%威力
    let frostMarkBonus = 0;
    if (skill.element === 'ice' && caster.frostMarkStacks && caster.frostMarkStacks > 0) {
      frostMarkBonus = Math.floor((skill.power || 0) * 0.15 * caster.frostMarkStacks);
      addLog(`${caster.name} 消耗 ${caster.frostMarkStacks} 层冰霜印记，冰系技能威力+${frostMarkBonus}！`, 'buff');
      caster.frostMarkStacks = 0;
    }
    // 命中率检定：基础95%，目标命中率降低（accuracyBoost为负值时降低命中率）
    const baseAccuracy = 0.95;
    const accuracyStage = 1 + (target.accuracyBoost || 0) * 0.1;
    const finalAccuracy = Math.max(0.3, Math.min(1.0, baseAccuracy * accuracyStage));
    if (Math.random() > finalAccuracy) {
      addLog(`${target.name} 躲开了 ${caster.name} 的 ${skill.name}！`, 'miss');
      return;
    }
    let totalDamage = 0;

    // 检查蓄焰增伤buff（蓄焰是给队友的buff，所以检查target）
    let powerBonus = 0;
    powerBonus += frostMarkBonus;
    if (target.flameCharge && target.flameChargeTurns > 0 && skill.element === 'fire') {
      powerBonus = target.flameChargePower || (target.energy * 10);
      addLog(`${target.name} 的蓄焰效果生效，火属性攻击威力+${powerBonus}！`, 'buff');
      target.flameCharge = false;
      target.flameChargeTurns = 0;
    }

    // 检查烈火护体下次火攻增伤
    if (target.wallOfFlamesPower > 0 && skill.element === 'fire') {
      powerBonus += target.wallOfFlamesPower;
      addLog(`${target.name} 的烈火护体效果生效，火属性攻击威力+${target.wallOfFlamesPower}！`, 'buff');
      target.wallOfFlamesPower = 0;
    }

    // 检查光能汇聚增伤（草系技能）
    let lightGatherBonus = 0;
    if (caster.lightGatherStacks && caster.lightGatherStacks > 0 && skill.element === 'grass') {
      // 光能爆轰：消耗所有光能汇聚层数
      if (skill.powerPerStack && skill.powerPerStack > 0) {
        lightGatherBonus = caster.lightGatherStacks * skill.powerPerStack;
        addLog(`${caster.name} 消耗 ${caster.lightGatherStacks} 层光能汇聚，草系攻击威力+${lightGatherBonus}！`, 'buff');
        caster.lightGatherStacks = 0;
      } else {
        // 其他草系技能：每次消耗1层光能汇聚
        lightGatherBonus = 60; // 每次草系输出技能+60威力
        addLog(`${caster.name} 的光能汇聚效果生效，草系攻击威力+${lightGatherBonus}！`, 'buff');
        caster.lightGatherStacks -= 1;
      }
    }
    powerBonus += lightGatherBonus;

    // 检查龙之气息增伤（龙系技能：每层+15威力，流星陨落每2层+30）
    let dragonBloodBonus = 0;
    if (caster.dragonBloodStacks && caster.dragonBloodStacks > 0 && skill.element === 'dragon') {
      if (skill.meteorFall) {
        // 流星陨落：每2层龙之气息+30威力
        const bonusStacks = Math.floor(caster.dragonBloodStacks / 2);
        dragonBloodBonus = bonusStacks * 30;
        addLog(`${caster.name} 消耗 ${caster.dragonBloodStacks} 层龙之气息（流星陨落加成），龙系攻击威力+${dragonBloodBonus}！`, 'buff');
        caster.dragonBloodStacks = 0;
      } else {
        // 其他龙系技能：每层+15威力
        dragonBloodBonus = caster.dragonBloodStacks * 15;
        addLog(`${caster.name} 消耗 ${caster.dragonBloodStacks} 层龙之气息，龙系攻击威力+${dragonBloodBonus}！`, 'buff');
        caster.dragonBloodStacks = 0;
      }
    }
    powerBonus += dragonBloodBonus;

    // 检查芬芳环境增伤（草系技能）
    if (battleEnvironment === 'fragrant' && skill.element === 'grass') {
      powerBonus += Math.floor(skill.power * 0.25);
      addLog(`芬芳环境影响，草系技能威力+25%！`, 'buff');
    }

    // 检查预言标记加成（超能系：存储力量等技能）
    if (skill.prophecyMarkBonus && caster.prophecyMarkStacks && caster.prophecyMarkStacks > 0) {
      const prophecyBonus = caster.prophecyMarkStacks * (skill.prophecyMarkBonusValue || 20);
      powerBonus += prophecyBonus;
      addLog(`${caster.name} 的预言标记效果生效！共${caster.prophecyMarkStacks}层，威力+${prophecyBonus}！`, 'buff');
      // 存储力量消耗预言标记
      if (skill.id === 'stored_power') {
        caster.prophecyMarkStacks = 0;
      }
    }

    // 精神场地环境：超能系技能威力+30%
    if (battleEnvironment === 'psychic' && skill.element === 'psychic') {
      const terrainBonus = Math.floor((skill.power || 0) * 0.3);
      powerBonus += terrainBonus;
      addLog(`精神场地环境影响，超能技能威力+30%（+${terrainBonus}）！`, 'buff');
    }

    // 雷霆连击：多段攻击
    if (skill.effect === 'combo') {
      // 命中率检定（多段攻击只判定一次）
      const baseAccuracy = 0.95;
      const accuracyStage = 1 + (target.accuracyBoost || 0) * 0.1;
      const finalAccuracy = Math.max(0.3, Math.min(1.0, baseAccuracy * accuracyStage));
      if (Math.random() > finalAccuracy) {
        addLog(`${target.name} 躲开了 ${caster.name} 的 ${skill.name}！`, 'miss');
        return;
      }
      const hits = skill.comboHits || 3;
      const powerPerHit = skill.comboPower || Math.floor(skill.power / hits);
      let comboCount = caster.comboCount || 0;

      for (let i = 0; i < hits; i++) {
        // 使用宝可梦公式计算伤害
        const result = calculatePokemonDamage(caster, target, { ...skill, power: powerPerHit + powerBonus });
        let hitDamage = result.damage;

        // 检查目标的减伤效果
        if (target.damageReduction && target.damageReduction > 0) {
          hitDamage = Math.floor(hitDamage * (1 - target.damageReduction));
        }

        // 检查目标的护盾
        if (target.shield && target.shield > 0) {
          if (hitDamage > target.shield) {
            hitDamage -= target.shield;
            target.shield = 0;
          } else {
            target.shield -= hitDamage;
            hitDamage = 0;
          }
        }

        totalDamage += hitDamage;
        target.currentHp = Math.max(0, target.currentHp - hitDamage);
        showDamageNumber(target.id, hitDamage, result.isCrit ? 'critical' : 'damage', {
          isStab: result.hasStab,
          isSuperEffective: result.typeMultiplier >= 2,
          isNotEffective: result.typeMultiplier < 1
        });

        // 水之守护：受到伤害时，攻击者获得1层浸透（多段攻击）
        if (target.buffs?.some(b => b.type === 'aqua_shield')) {
          const aquaShieldBuff = target.buffs.find(b => b.type === 'aqua_shield');
          if (aquaShieldBuff && hitDamage > 0) {
            const existingSoak = caster.debuffs.find(d => d.type === 'water_soak');
            if (existingSoak) {
              if (existingSoak.stacks < 6) {
                existingSoak.stacks += 1;
                existingSoak.remainingDuration = 2;
              }
            } else {
              caster.debuffs.push({
                type: 'water_soak',
                stacks: 1,
                power: 1,
                remainingDuration: 2,
                maxStacks: 6
              });
            }
            addLog(`${target.name} 受到「水之守护」反击，${caster.name} 获得1层「浸透」！`, 'debuff');
          }
        }

        // 冰霜护甲：受到伤害时使攻击者冻结1回合（多段攻击）
        if (target.frostArmor && hitDamage > 0) {
          const existingFrost = caster.debuffs.find(d => d.type === 'frost' || d.type === 'frozen');
          if (existingFrost) {
            existingFrost.remainingDuration = 1;
          } else {
            caster.debuffs = caster.debuffs || [];
            caster.debuffs.push({ type: 'frozen', remainingDuration: 1 });
          }
          addLog(`${target.name} 受到「冰霜护甲」反击，${caster.name} 被冻结1回合！`, 'debuff');
        }

        // 冰霜印记：受到冰属性攻击时25%概率附加冰霜（多段攻击）
        if (target.buffs?.some(b => b.type === 'frost_mark') && skill.element === 'ice' && hitDamage > 0) {
          if (Math.random() < 0.25) {
            target.frostMarkStacks = (target.frostMarkStacks || 0) + 1;
            addLog(`${target.name} 的「冰霜印记」被触发，获得1层「冰霜」！`, 'buff');
          }
        }

        // 多段攻击灼烧判定：每次命中独立判定概率灼烧
        if (skill.burnChance && skill.burnChance < 1) {
          // 概率灼烧（如烈焰拳50%概率）
          if (Math.random() < skill.burnChance) {
            const existingBurn = target.debuffs.find(d => d.type === 'burn');
            const burnStacks = skill.burnStacks || 1;
            if (existingBurn) {
              existingBurn.stacks += burnStacks;
              existingBurn.remainingDuration = 3;
            } else {
              target.debuffs.push({
                type: 'burn',
                stacks: burnStacks,
                damagePercentPerStack: 0.02,
                remainingDuration: 3
              });
            }
            addLog(`第${i + 1}段攻击命中，${target.name} 陷入灼烧状态！`, 'damage');
          }
        } else if (skill.burnStacks && !skill.burnChance) {
          // 必定灼烧：每段攻击必定附加灼烧层数（如爆炸烈焰每次1层）
          const existingBurn = target.debuffs.find(d => d.type === 'burn');
          if (existingBurn) {
            existingBurn.stacks += skill.burnStacks;
            existingBurn.remainingDuration = 3;
          } else {
            target.debuffs.push({
              type: 'burn',
              stacks: skill.burnStacks,
              damagePercentPerStack: 0.02,
              remainingDuration: 3
            });
          }
        }

        addLog(`${caster.name} 使用 ${skill.name}，第${i + 1}段攻击造成 ${hitDamage} 伤害${result.isCrit ? '（暴击！）' : ''}${result.hasStab ? '【STAB】' : ''}${result.typeMultiplier !== 1 ? '【' + (result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱') + '×' + result.typeMultiplier + '】' : ''}`, 'damage');
        await delay(200);
      }

      // 多段攻击结束后的必定灼烧日志（爆炸烈焰等）
      if (skill.burnStacks && !skill.burnChance) {
        const existingBurn = target.debuffs.find(d => d.type === 'burn');
        addLog(`${target.name} 陷入灼烧状态！（${existingBurn ? existingBurn.stacks : skill.burnStacks}层，每层2%最大HP/回合，层数减半）`, 'damage');
      }

      // 25%概率追加额外攻击
      if (Math.random() < (skill.comboChance || 0.25)) {
        const result = calculatePokemonDamage(caster, target, { ...skill, power: powerPerHit + powerBonus });
        let extraDamage = result.damage;

        // 检查目标的减伤和护盾
        if (target.damageReduction && target.damageReduction > 0) {
          extraDamage = Math.floor(extraDamage * (1 - target.damageReduction));
        }
        if (target.shield && target.shield > 0) {
          if (extraDamage > target.shield) {
            extraDamage -= target.shield;
            target.shield = 0;
          } else {
            target.shield -= extraDamage;
            extraDamage = 0;
          }
        }

        totalDamage += extraDamage;
        target.currentHp = Math.max(0, target.currentHp - extraDamage);
        showDamageNumber(target.id, extraDamage, result.isCrit ? 'critical' : 'damage', {
          isStab: result.hasStab,
          isSuperEffective: result.typeMultiplier >= 2,
          isNotEffective: result.typeMultiplier < 1
        });
        addLog(`雷霆连击追加攻击！造成 ${extraDamage} 额外伤害${result.isCrit ? '（暴击！）' : ''}`, 'damage');
      }

      // 连击充能
      comboCount += hits;
      caster.comboCount = comboCount;
      addLog(`${caster.name} 积累 ${hits} 层连击（总共 ${comboCount} 层）`);

      // 多段攻击总威力统计
      if (skill.comboHits && skill.comboPower) {
        const totalPower = skill.comboHits * skill.comboPower;
        addLog(`${skill.name} 总威力 ${skill.comboPower}×${skill.comboHits} = ${totalPower}，命中率${(skill.burnChance ? skill.burnChance * 100 : 100).toFixed(0)}%`, 'info');
      }

    } else {
      // 普通单次攻击 - 使用宝可梦公式
      // 震级：随机威力（等级1-8对应威力10-150）
      let actualPower = skill.power;
      if (skill.id === 'magnitude') {
        const magnitudes = [10, 30, 50, 70, 90, 110, 130, 150];
        const magLevel = Math.floor(Math.random() * 8) + 1;
        actualPower = magnitudes[magLevel - 1];
        addLog(`震级变化！当前等级 ${magLevel}，威力 ${actualPower}！`, 'info');
      }
      const result = calculatePokemonDamage(caster, target, { ...skill, power: actualPower + powerBonus });
      let damage = result.damage;

      // 冰爆：目标冻结时3倍伤害
      if (skill.id === 'ice_explosion' && target.frozen) {
        damage = Math.floor(damage * 3);
        addLog(`${target.name} 处于冻结状态！冰爆造成3倍伤害！`, 'damage');
      }

      // 检查目标的减伤效果
      if (target.damageReduction && target.damageReduction > 0) {
        const originalDamage = damage;
        damage = Math.floor(damage * (1 - target.damageReduction));
        addLog(`${target.name} 的减伤效果生效，伤害从 ${originalDamage} 降低至 ${damage}`, 'buff');
      }

      // 检查目标的护盾
      if (target.shield && target.shield > 0) {
        if (damage > target.shield) {
          damage -= target.shield;
          addLog(`${target.name} 的护盾吸收了 ${target.shield} 点伤害`);
          target.shield = 0;
        } else {
          target.shield -= damage;
          addLog(`${target.name} 的护盾完全吸收了 ${damage} 点伤害`);
          damage = 0;
        }
      }

      totalDamage = damage;
      target.currentHp = Math.max(0, target.currentHp - damage);
      showDamageNumber(target.id, damage, result.isCrit ? 'critical' : 'damage', {
        isStab: result.hasStab,
        isSuperEffective: result.typeMultiplier >= 2,
        isNotEffective: result.typeMultiplier < 1
      });

      // 水之守护：受到伤害时，攻击者获得1层浸透
      if (target.buffs?.some(b => b.type === 'aqua_shield')) {
        const aquaShieldBuff = target.buffs.find(b => b.type === 'aqua_shield');
        if (aquaShieldBuff && damage > 0) {
          const existingSoak = caster.debuffs.find(d => d.type === 'water_soak');
          if (existingSoak) {
            if (existingSoak.stacks < 6) {
              existingSoak.stacks += 1;
              existingSoak.remainingDuration = 2;
            }
          } else {
            caster.debuffs.push({
              type: 'water_soak',
              stacks: 1,
              power: 1,
              remainingDuration: 2,
              maxStacks: 6
            });
          }
          addLog(`${caster.name} 受到「水之守护」反击，获得1层「浸透」！`, 'debuff');
        }
      }

      // 冰霜护甲：受到伤害时使攻击者冻结1回合
      if (target.frostArmor && damage > 0) {
        const existingFrost = caster.debuffs.find(d => d.type === 'frost' || d.type === 'frozen');
        if (existingFrost) {
          existingFrost.remainingDuration = 1;
        } else {
          caster.debuffs = caster.debuffs || [];
          caster.debuffs.push({ type: 'frozen', remainingDuration: 1 });
        }
        addLog(`${caster.name} 受到「冰霜护甲」反击，被冻结1回合！`, 'debuff');
      }

      // 冰霜印记：受到冰属性攻击时25%概率附加冰霜（给被攻击者）
      if (target.buffs?.some(b => b.type === 'frost_mark') && skill.element === 'ice' && damage > 0) {
        if (Math.random() < 0.25) {
          target.frostMarkStacks = (target.frostMarkStacks || 0) + 1;
          addLog(`${target.name} 的「冰霜印记」被触发，获得1层「冰霜」！`, 'buff');
        }
      }

      // 绽放之舞：必定暴击效果（×1.5）
      if (skill.guaranteedCrit) {
        addLog(`${skill.name} 本回合必定暴击！`);
      }

      let logMsg = `${caster.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`;
      if (result.isCrit) logMsg += '（暴击！）';
      if (result.hasStab) logMsg += '【STAB】';
      if (result.typeMultiplier !== 1) logMsg += `【${result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱'}×${result.typeMultiplier}】`;
      addLog(logMsg, 'damage');

      // 大地之力：伤害后自特攻+1级
      if (skill.id === 'earth_power') {
        caster.spAtkBoost = (caster.spAtkBoost || 0) + 1;
        caster.spAtkBoostTurns = 3;
        addLog(`${caster.name} 的大地之力涌动，特攻提升1级！`, 'buff');
      }

      // 地震：全体敌人速度-1级
      if (skill.id === 'earthquake') {
        enemyUnits.forEach(e => {
          if (e.currentHp <= 0) return;
          e.speedBoost = (e.speedBoost || 0) - 1;
          e.speedBoostTurns = 3;
        });
        addLog(`地震波动影响了所有敌人，敌方全体速度降低1级！`, 'debuff');
      }

      // 冰锤：伤害后自降速度1级
      if (skill.id === 'ice_hammer') {
        caster.speedBoost = (caster.speedBoost || 0) - 1;
        addLog(`${caster.name} 被冰锤的寒气反噬，速度降低1级！`, 'debuff');
      }

      // 龙之终焉：混乱效果（2-3回合，层数≥5时共鸣抵消）
      if (skill.dragonOblivion) {
        const confusionTurns = 2 + Math.floor(Math.random() * 2);
        const casterDragonBlood = caster.dragonBloodStacks || 0;
        if (casterDragonBlood >= 5) {
          addLog(`${caster.name} 的龙属共鸣激活，「龙之终焉」的混乱被抵消！`, 'buff');
        } else {
          target.debuffs = target.debuffs || [];
          target.debuffs = target.debuffs.filter(d => d.type !== 'confusion');
          target.debuffs.push({
            type: 'confusion',
            remainingDuration: confusionTurns,
            selfAttackChance: 0.5
          });
          addLog(`${target.name} 陷入混乱状态！（${confusionTurns}回合，50%概率攻击自身）`, 'debuff');
        }
      }

      // 龙之碾压：HP条件增伤（HP<50%时+50%威力，HP<30%时必定暴击）
      if (skill.dragonCrush) {
        const targetHpPercent = target.currentHp / target.maxHp;
        if (targetHpPercent < 0.5) {
          // 追伤：额外造成50%威力的追加伤害
          const bonusDamage = Math.floor(result.damage * 0.5);
          target.currentHp = Math.max(0, target.currentHp - bonusDamage);
          showDamageNumber(target.id, bonusDamage, 'damage', { isSuperEffective: false });
          updateHpBar(target);
          addLog(`${target.name} HP<50%！龙之碾压追加+50%伤害（+${bonusDamage}）！`, 'damage');
        }
        if (targetHpPercent < 0.3 && !result.isCrit) {
          // 必定暴击：实际补上1.5倍暴击伤害
          const critBonusDamage = Math.floor(result.damage * 0.5);
          target.currentHp = Math.max(0, target.currentHp - critBonusDamage);
          showDamageNumber(target.id, critBonusDamage, 'critical', { isSuperEffective: false });
          updateHpBar(target);
          totalDamage += critBonusDamage;
          addLog(`${target.name} HP<30%！龙之碾压必定暴击！（追加+50%暴击伤害 +${critBonusDamage}）`, 'damage');
        }
      }

      // 流星陨落：使用后自身攻击/特攻-2级
      if (skill.meteorFall) {
        caster.attackBoost = (caster.attackBoost || 0) - 2;
        caster.spAtkBoost = (caster.spAtkBoost || 0) - 2;
        addLog(`${caster.name} 使用流星陨落，自身攻击/特攻-2级！`, 'debuff');
      }

      // === 超能系技能效果 ===
      // 迷心刺：附加预言标记和心灵创伤
      if (skill.prophecyMark) {
        // 给自身添加预言标记
        caster.prophecyMarkStacks = (caster.prophecyMarkStacks || 0) + 1;
        addLog(`${caster.name} 获得1层「预言标记」！（共${caster.prophecyMarkStacks}层，增强存储力量等技能威力）`, 'buff');
      }
      if (skill.mindWound) {
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'mind_wound');
        target.debuffs.push({ type: 'mind_wound', remainingDuration: 2 });
        addLog(`${target.name} 陷入「心灵创伤」状态！（攻击命中率50%击中自己，持续2回合）`, 'debuff');
      }

      // 精神冲击：无视护盾（穿透效果已通过 pierceShield 标记，这里额外破坏护盾）
      if (skill.pierceShield && target.shield && target.shield > 0) {
        addLog(`${target.name} 的护盾被「精神冲击」穿透！`);
        target.shield = 0;
      }

      // 虚空预言：附加禁忌
      if (skill.id === 'void_prophecy' || skill.voidProphecy || skill.forbidden) {
        const statReduction = skill.forbidden ? 2 : 2;
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'forbidden');
        target.debuffs.push({ type: 'forbidden', remainingDuration: 2, statReduction: 2 });
        // 立即应用能力下降
        target.attackBoost = (target.attackBoost || 0) - 2;
        target.spAtkBoost = (target.spAtkBoost || 0) - 2;
        target.defenseBoost = (target.defenseBoost || 0) - 2;
        target.spDefenseBoost = (target.spDefenseBoost || 0) - 2;
        target.speedBoost = (target.speedBoost || 0) - 2;
        addLog(`${target.name} 陷入「禁忌」状态！（所有能力等级-2，持续2回合）`, 'debuff');
      }

      // 预知未来：3回合后触发伤害（记录到目标身上）
      if (skill.futureSight) {
        target.debuffs = target.debuffs || [];
        target.debuffs.push({
          type: 'future_sight_pending',
          remainingDuration: 3,
          damage: skill.futureSightPower || 120,
          damageType: 'special',
          casterId: caster.id,
          name: skill.name
        });
        addLog(`${caster.name} 施展「预知未来」！3回合后将对 ${target.name} 造成 ${skill.futureSightPower || 120} 威力特殊伤害并附加「禁忌」！`, 'debuff');
      }

      // 命运编织：3回合后触发真伤（记录到目标身上）
      if (skill.fateWeave) {
        target.debuffs = target.debuffs || [];
        target.debuffs.push({
          type: 'fate_weave_pending',
          remainingDuration: 3,
          damage: skill.fateWeaveDamage || 100,
          damageType: 'true',
          casterId: caster.id,
          name: skill.name
        });
        addLog(`${caster.name} 施展「命运编织」！3回合后将对 ${target.name} 造成 ${skill.fateWeaveDamage || 100} 点真实伤害并使其所有能力等级-2！`, 'debuff');
      }

      // 枯萎效果（叶绿光束）
      if (skill.wither) {
        const existingWither = target.debuffs.find(d => d.type === 'wither');
        if (existingWither) {
          existingWither.stacks += 1;
          existingWither.remainingDuration = 3;
        } else {
          target.debuffs.push({
            type: 'wither',
            stacks: 1,
            damagePerStack: skill.witherPower || 10, // 每层10点威力伤害
            remainingDuration: 3
          });
        }
        const witherStacks = existingWither ? existingWither.stacks + 1 : 1;
        addLog(`${target.name} 陷入枯萎状态！（+1层，每层每回合受到自身属性${skill.witherPower || 10}点威力伤害）`, 'debuff');
      }

      // 麻痹效果（雷击）
      if (skill.paralysis || skill.effect === 'paralyze') {
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'paralysis');
        target.debuffs.push({ type: 'paralysis', remainingDuration: 2 });
        addLog(`${target.name} 陷入麻痹状态！（速度-50%）`, 'debuff');
      }

      // 静电标记（静电释放）
      if (skill.staticMark) {
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'static');
        target.debuffs.push({ type: 'static', remainingDuration: 3 });
        addLog(`${target.name} 被标记静电！`, 'debuff');
      }

      // 冰霜效果（冰射击）
      if (skill.frost || skill.effect === 'freeze') {
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'frost');
        target.debuffs.push({ type: 'frost', remainingDuration: 2 });
        addLog(`${target.name} 陷入冰霜状态！`, 'debuff');
      }

      // 极端寒冷印记（霜冻吐息）
      if (skill.extremeColdMark) {
        target.debuffs = target.debuffs || [];
        target.debuffs = target.debuffs.filter(d => d.type !== 'extreme_cold_mark');
        target.debuffs.push({ type: 'extreme_cold_mark', remainingDuration: 2 });
        addLog(`${target.name} 陷入极端寒冷！`, 'debuff');
      }

      // 霜印（frost_mark）
      if (skill.frostMark) {
        target.debuffs = target.debuffs || [];
        target.debuffs.push({ type: 'frost_mark', remainingDuration: 3 });
        addLog(`${target.name} 获得「霜印」！（下次使用冰系技能威力+30%）`, 'debuff');
      }

      // 静电释放/蓄电护体
      if (skill.effect === 'static_charge') {
        target.debuffs = target.debuffs || [];
        target.debuffs.push({ type: 'static_charge', remainingDuration: 2 });
        addLog(`${target.name} 被蓄电！`, 'debuff');
      }
    }

    // 燃尽：延迟伤害（3回合后扣除30%当前HP）
    if (skill.effect === 'combustion' || skill.combustionMark) {
      target.combustionStacks = (target.combustionStacks || 0) + 1;
      target.combustionTurnsLeft = 3;
      target.debuffs = target.debuffs || [];
      target.debuffs = target.debuffs.filter(d => d.type !== 'combustion');
      target.debuffs.push({ type: 'combustion', remainingDuration: 3 });
      addLog(`${target.name} 被施加「燃尽印记」（3回合后扣除30%当前HP）`, 'debuff');
    }

    // 韶光（splendor）：攻击后召唤芬芳环境
    if (skill.effect === 'fragrantEnvironment' || skill.grassDamageBoost) {
      battleEnvironment = 'fragrant';
      battleEnvironmentTurns = 4;
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        unit.fragrantBloom = true;
        unit.fragrantBloomTurns = 4;
      });
      addLog(`${caster.name} 使用 ${skill.name}，召唤芬芳环境！（持续4回合：草系技能威力+25%）`, 'buff');
    }

    // 烈火护体（攻击附带）：下次火属性攻击威力+40
    if (skill.effect === 'wall_of_flames' || skill.wallOfFlamesPower > 0) {
      caster.wallOfFlamesPower = skill.wallOfFlamesPower || 40;
      caster.wallOfFlamesTurns = 1;
      addLog(`${caster.name} 的烈火护体效果激活，下次火属性攻击威力+${caster.wallOfFlamesPower}！`, 'buff');
    }

    // 炎之意志（攻击附带）：给目标加 buff）
    if (skill.effect === 'blaze_will' || skill.blazeWillEffect) {
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'blaze_will', remainingDuration: skill.duration || 3 });
      target.attackBoost = (target.attackBoost || 0) + 1;
      target.spAtkBoost = (target.spAtkBoost || 0) + 1;
      target.fireDamageBoost = (target.fireDamageBoost || 0) + 0.25;
      addLog(`${target.name} 获得「炎之意志」！（攻击+1、特攻+1、火伤+25%）`, 'buff');
    }

    // 灼伤印记：每次行动前受到自身威力计算的物理/特殊伤害
    if (skill.effect === 'burn_mark') {
      target.burnMark = true;
      target.burnMarkPower = skill.burnMarkPower || 20;
      target.burnMarkDamageType = skill.damageType || 'special';
      const damageTypeText = target.burnMarkDamageType === 'physical' ? '物理' : '特殊';
      // 添加debuff用于显示标签
      target.debuffs = target.debuffs || [];
      target.debuffs = target.debuffs.filter(d => d.type !== 'burn_mark');
      target.debuffs.push({
        type: 'burn_mark',
        power: skill.burnMarkPower || 20,
        damageType: skill.damageType || 'special',
        remainingDuration: 3
      });
      addLog(`${target.name} 被施加「灼伤印记」（自身${target.burnMarkPower}威力${damageTypeText}伤害）`, 'debuff');
    }

    // 灼烧效果（层数系统）
    if (skill.effect === 'burn' || skill.burnStacks) {
      const burnChance = skill.burnChance ?? 1; // 默认100%成功
      if (Math.random() < burnChance) {
        const stacks = skill.burnStacks || 1;
        // 检查是否已有灼烧，有则叠加层数
        const existingBurn = target.debuffs.find(d => d.type === 'burn');
        if (existingBurn) {
          existingBurn.stacks += stacks;
          existingBurn.remainingDuration = 3; // 重置持续时间
          addLog(`${target.name} 的灼烧层数+${stacks}（共${existingBurn.stacks}层）`, 'damage');
        } else {
          target.debuffs.push({
            type: 'burn',
            stacks: stacks,
            damagePercentPerStack: 0.02, // 每层2%
            remainingDuration: 3
          });
          addLog(`${target.name} 陷入灼烧状态！（${stacks}层，每层2%最大HP/回合，层数减半）`, 'damage');
        }
      }
    }

    // 麻痹效果
    if (skill.paralyzeChance > 0) {
      if (Math.random() < skill.paralyzeChance) {
        target.paralyzed = true;
        target.paralyzeTurns = 2;
        addLog(`${target.name} 被麻痹了！（速度-1级，持续2回合）`, 'debuff');
      }
    }

    // 冰冻效果（freeze）
    if (skill.effect === 'freeze' || skill.frostEffect) {
      if (Math.random() < 0.2) {
        target.frozen = true;
        target.frozenTurns = 1;
        addLog(`${target.name} 被冻结了！（1回合无法行动）`, 'debuff');
      } else {
        addLog(`${target.name} 被冰霜附着。（有概率被冻结）`, 'debuff');
      }
    }

    // 减速效果
    if (skill.slowChance > 0) {
      if (Math.random() < skill.slowChance) {
        target.slowed = true;
        target.slowTurns = 2;
        addLog(`${target.name} 速度下降了！（速度-1级，持续${target.slowTurns}回合）`, 'debuff');
      }
    }

    // 潮湿效果
    if (skill.effect === 'wet') {
      target.wet = true;
      target.wetTurns = 3;
      addLog(`${target.name} 陷入潮湿状态！（受到电属性攻击额外承受30%伤害）`, 'debuff');
    }

    // 浸透效果（水流冲击、水之守护）
    if (skill.waterSoakEffect) {
      const existingSoak = target.debuffs.find(d => d.type === 'water_soak');
      const stacks = 1;
      if (existingSoak) {
        if (existingSoak.stacks < (skill.waterSoakMaxStacks || 6)) {
          existingSoak.stacks += stacks;
          existingSoak.remainingDuration = skill.waterSoakDuration || 2;
        }
        addLog(`${target.name} 的浸透层数+${stacks}（共${existingSoak.stacks}层，最多${skill.waterSoakMaxStacks || 6}层）`, 'debuff');
      } else {
        target.debuffs.push({
          type: 'water_soak',
          stacks: stacks,
          power: skill.waterSoakPower || 1, // 每层特防-1级
          remainingDuration: skill.waterSoakDuration || 2,
          maxStacks: skill.waterSoakMaxStacks || 6
        });
        addLog(`${target.name} 获得「浸透」状态！（特防-1级/层，最多${skill.waterSoakMaxStacks || 6}层，持续${skill.waterSoakDuration || 2}回合）`, 'debuff');
      }
    }

    // 溺水效果（漩涡）
    if (skill.drowningEffect) {
      target.debuffs = target.debuffs.filter(d => d.type !== 'drowning');
      target.debuffs.push({
        type: 'drowning',
        remainingDuration: skill.drowningDuration || 3,
        damageReduction: 0.3 // 下一次能量消耗>3的技能伤害-30%
      });
      addLog(`${target.name} 陷入「溺水」状态！（下一次能量消耗>3的技能伤害-30%，持续${skill.drowningDuration || 3}回合）`, 'debuff');
    }

    // 浑浊效果（浊流）
    if (skill.muddyEffect) {
      const existingMuddy = target.debuffs.find(d => d.type === 'muddy');
      if (existingMuddy) {
        if (existingMuddy.stacks < (skill.muddyMaxStacks || 3)) {
          existingMuddy.stacks += 1;
          existingMuddy.remainingDuration = 3;
        }
        addLog(`${target.name} 的浑浊层数+1（共${existingMuddy.stacks}层）`, 'debuff');
      } else {
        target.debuffs.push({
          type: 'muddy',
          stacks: 1,
          hitReduction: 1, // 命中率-1级/层
          remainingDuration: 3,
          maxStacks: skill.muddyMaxStacks || 3
        });
        addLog(`${target.name} 获得「浑浊」状态！（命中率-1级/层，最多${skill.muddyMaxStacks || 3}层，持续3回合）`, 'debuff');
      }
    }

        // 寄生种子效果（寄生之种）
        if (skill.parasiticSeed) {
          target.debuffs = target.debuffs || [];
          target.debuffs = target.debuffs.filter(d => d.type !== 'parasitic_seed');
          target.debuffs.push({
            type: 'parasitic_seed',
            caster: caster,  // 保存施法者引用用于吸血
            drainPercent: skill.parasiticSeedDrain || 0.06, // 吸取施法者HP的6%
            remainingDuration: skill.parasiticSeedTurns || 4,
            stacks: 1
          });
          addLog(`${target.name} 被施加「寄生种子」！（每回合受到施法者${Math.round((skill.parasiticSeedDrain || 0.06) * 100)}%HP伤害+施法者回复，持续${skill.parasiticSeedTurns || 4}回合）`, 'debuff');
        }

        // 蒸汽灼伤概率（热水）
        if (skill.steamBurnChance > 0) {
          if (Math.random() < skill.steamBurnChance) {
            target.debuffs = target.debuffs || [];
            target.debuffs = target.debuffs.filter(d => d.type !== 'steam_burn');
            target.debuffs.push({
              type: 'steam_burn',
              stacks: 1,
              damagePercentPerStack: 0.02, // 每层2%最大HP
              remainingDuration: 3
            });
            addLog(`${target.name} 陷入「蒸汽灼烧」状态！（每回合损失2%最大HP，持续3回合）`, 'debuff');
          }
        }

    // 清除目标增益效果（火焰冲击等对策技）
    if (skill.clearBuff && target) {
      let clearedCount = 0;
      // 清除属性强化
      if (target.attackBoost && target.attackBoost > 0) {
        clearedCount += target.attackBoost;
        target.attackBoost = 0;
      }
      if (target.spAtkBoost && target.spAtkBoost > 0) {
        clearedCount += target.spAtkBoost;
        target.spAtkBoost = 0;
      }
      if (target.speedBoost && target.speedBoost > 0) {
        clearedCount += target.speedBoost;
        target.speedBoost = 0;
      }
      if (target.defenseBoost && target.defenseBoost > 0) {
        clearedCount += target.defenseBoost;
        target.defenseBoost = 0;
      }
      if (clearedCount > 0) {
        addLog(`${target.name} 的 ${clearedCount} 层增益状态被清除！`, 'debuff');
      }
    }

    // 过热：使用后自身特攻-2级（持续3回合）
    if (skill.spAtkBoost && skill.spAtkBoost < 0) {
      caster.spAtkBoost = (caster.spAtkBoost || 0) + skill.spAtkBoost;
      caster.spAtkBoostTurns = 3;
      addLog(`${caster.name} 的特攻下降了 ${Math.abs(skill.spAtkBoost)} 级！（持续${caster.spAtkBoostTurns}回合）`, 'debuff');
    }

    // 虚弱效果（水炮：自身获得虚弱状态，下一回合无法使用技能）
    if (skill.weaknessEffect) {
      caster.debuffs = caster.debuffs || [];
      caster.debuffs = caster.debuffs.filter(d => d.type !== 'weakness');
      caster.debuffs.push({
        type: 'weakness',
        remainingDuration: skill.weaknessDuration || 2
      });
      addLog(`${caster.name} 获得「虚弱」状态！（下一回合无法使用技能，持续${skill.weaknessDuration || 2}回合）`, 'debuff');
    }

    // 更新HP条
    updateHpBar(target);
    if (target.currentHp <= 0) addLog(`${target.name} 倒下了！`);

    // 火盾反伤 + 龙鳞守护反击
    if (target.fireShield && target.reflectDamage > 0 && target.currentHp > 0) {
      const reflectDmg = Math.floor(target.reflectDamage * (0.8 + Math.random() * 0.4));
      caster.currentHp = Math.max(0, caster.currentHp - reflectDmg);
      showDamageNumber(caster.id, reflectDmg, 'damage', { isSuperEffective: false });
      updateHpBar(caster);
      addLog(`${target.name} 的火盾反伤触发，对 ${caster.name} 造成 ${reflectDmg} 火属性伤害！`, 'damage');

      // 火盾附加灼烧：受伤时攻击者获得灼烧
      const existingBurn = caster.debuffs.find(d => d.type === 'burn');
      if (existingBurn) {
        existingBurn.stacks += 1;
        existingBurn.remainingDuration = 3;
        addLog(`${caster.name} 受到灼烧（+1层，共${existingBurn.stacks}层）`, 'damage');
      } else {
        caster.debuffs.push({
          type: 'burn',
          stacks: 1,
          damagePercentPerStack: 0.02,
          remainingDuration: 3
        });
        addLog(`${caster.name} 陷入灼烧状态！`, 'damage');
      }

      if (caster.currentHp <= 0) addLog(`${caster.name} 倒下了！`);
    }

    // 龙鳞守护反击：护盾存在期间受击反击30威力
    if (target.dragonGuardCounter && target.dragonGuardCounterDamage > 0 && target.currentHp > 0 && damage > 0) {
      const counterDmg = target.dragonGuardCounterDamage;
      caster.currentHp = Math.max(0, caster.currentHp - counterDmg);
      showDamageNumber(caster.id, counterDmg, 'damage', { isSuperEffective: false });
      updateHpBar(caster);
      addLog(`${target.name} 的龙鳞守护触发，对 ${caster.name} 反击 ${counterDmg} 威力龙属性伤害！`, 'damage');
      if (caster.currentHp <= 0) addLog(`${caster.name} 倒下了！`);
    }

    // 光能汇聚：fiber_weave 等既有伤害又有 self_buff (grass_power) 的技能，在伤害后处理光能汇聚
    if (skill.lightGather && skill.lightGather > 0) {
      caster.lightGatherStacks = (caster.lightGatherStacks || 0) + skill.lightGather;
      addLog(`${caster.name} 使用 ${skill.name}，获得 ${skill.lightGather} 层光能汇聚（下回合草系技能+60威力/层）`, 'buff');
      // 施法者如果是玩家，需要刷新显示
      if (playerUnits.includes(caster)) {
        setTimeout(() => renderPlayerUnits(), 950);
      }
    }

    // 延迟重新渲染单位卡片以显示debuff/buff标签，确保伤害数字动画有时间播放
    // 注意：必须使用延迟渲染，否则会清除伤害数字动画
    const renderTargetUnits = () => {
      if (enemyUnits.includes(target)) {
        renderEnemyUnits();
      } else {
        renderPlayerUnits();
      }
    };
    // 在伤害动画播放完成后再渲染
    setTimeout(renderTargetUnits, 900);

  } else if (skill.target === 'single_enemy') {
    // 超能系：精神转移（将自身负面状态转移给敌人）
    if (skill.psychoShift) {
      if (caster.debuffs && caster.debuffs.length > 0) {
        const debuffsToTransfer = [...caster.debuffs];
        caster.debuffs = [];
        target.debuffs = target.debuffs || [];
        debuffsToTransfer.forEach(d => {
          const newDebuff = { ...d, remainingDuration: d.remainingDuration || 2 };
          target.debuffs.push(newDebuff);
        });
        addLog(`${caster.name} 将 ${debuffsToTransfer.length} 个负面状态转移给敌人 ${target.name}！`, 'debuff');
      } else {
        addLog(`${caster.name} 没有需要转移的负面状态！`, 'info');
      }
    }
  } else if (skill.target === 'ally') {
    // 队友目标
    if (skill.type === 'shield') {
      // 护盾技能 - 给队友添加护盾
      target.shield = (target.shield || 0) + skill.power;

      // 减伤效果（如冰墙的50%减伤）
      if (skill.damageReduction && skill.damageReduction > 0) {
        target.damageReduction = (target.damageReduction || 0) + skill.damageReduction;
        target.damageReductionTurns = 2; // 默认持续2回合
        addLog(`${target.name} 获得 ${Math.round(skill.damageReduction * 100)}% 伤害减免（持续${target.damageReductionTurns}回合）`, 'buff');
      }

      // 属性抗性效果
      if (skill.resistances) {
        skill.resistances.forEach(r => {
          target.resistances = target.resistances || {};
          target.resistances[r.element] = (target.resistances[r.element] || 0) + r.value;
          target.resistanceTurns = target.resistanceTurns || {};
          target.resistanceTurns[r.element] = r.duration;
          addLog(`${target.name} 获得 ${r.element} 属性抗性 +${Math.round(r.value * 100)}%`, 'buff');
        });
      }

      // 火盾：反伤效果
      if (skill.effect === 'reflect' || skill.reflectDamage > 0) {
        target.fireShield = true;
        target.reflectDamage = skill.reflectDamage || 30;
        target.reflectElement = caster.element;
        addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 施加 ${skill.power} 点护盾（含反伤效果）`);
      } else {
        addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 施加 ${skill.power} 点护盾`);
      }
    } else if (skill.type === 'heal') {
      // 治疗技能
      let heal = 0;
      // 检查是否有治疗百分比
      if (skill.healPercent && skill.healPercent > 0) {
        if (target.debuffs?.some(d => d.type === 'psychic_noise')) {
          addLog(`${target.name} 处于「精神噪音」状态，无法恢复HP！`, 'debuff');
        } else {
          heal = Math.floor(target.maxHp * skill.healPercent);
        }
      } else {
        if (!target.debuffs?.some(d => d.type === 'psychic_noise')) {
          heal = Math.floor(skill.power * (0.8 + Math.random() * 0.4));
        } else {
          addLog(`${target.name} 处于「精神噪音」状态，无法恢复HP！`, 'debuff');
        }
      }
      if (heal > 0) {
        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
        showDamageNumber(target.id, heal, 'heal');
        updateHpBar(target);
        addLog(`${caster.name} 使用 ${skill.name}，恢复 ${target.name} ${heal} HP`, 'heal');
      }

      // 流水效果（水疗之术：速度+1级）
      if (skill.flowEffect) {
        target.buffs = target.buffs || [];
        target.buffs.push({
          type: 'flow',
          speedBoost: 1,
          remainingDuration: 2
        });
        addLog(`${target.name} 获得「流水」状态！（速度+1级，持续2回合）`, 'buff');
      } else if (skill.healPercent && skill.healPercent > 0) {
        // 治疗技能（养分汲取等）：添加治疗buff标签用于DOM显示
        target.buffs = target.buffs || [];
        target.buffs.push({
          type: 'heal_buff',
          healPercent: skill.healPercent,
          remainingDuration: 1
        });
      }
    }

    // 蓄焰：为目标施加蓄焰状态（持续3回合），下次火属性攻击威力+（自身能量×10）
    if (skill.effect === 'flameCharge' || skill.flameCharge) {
      target.flameCharge = true;
      target.flameChargeTurns = 3;
      target.flameChargePower = caster.energy * 10;
      addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 施加蓄焰（持续${target.flameChargeTurns}回合），下次火属性攻击威力+${target.flameChargePower}`, 'buff');
    }

    // 蓄电：为目标增加蓄电层数
    if (skill.chargeEffect) {
      target.chargeStacks = (target.chargeStacks || 0) + 2;
      target.chargeTurns = skill.duration || 3;
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得2层蓄电！（蓄电层数提升下次电属性技能威力）`, 'buff');
    }

    // 火盾：减伤+反伤（给队友使用）
    if (skill.fireShield) {
      target.fireShield = true;
      target.reflectDamage = skill.reflectDamage || 0.3;
      target.reflectElement = caster.element;
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得火盾效果（受伤时攻击者附加灼烧）`, 'buff');
    }

      // 养分汲取：回复HP并增加能量
      if (skill.healPercent && skill.healPercent > 0) {
        if (target.debuffs?.some(d => d.type === 'psychic_noise')) {
          addLog(`${target.name} 处于「精神噪音」状态，无法恢复HP！`, 'debuff');
        } else {
          const healAmount = Math.floor(target.maxHp * skill.healPercent);
          target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
          showDamageNumber(target.id, healAmount, 'heal');
          updateHpBar(target);
          addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 回复 ${healAmount} HP（${Math.round(skill.healPercent * 100)}%最大HP）`, 'heal');
        }
      }

    // 养分汲取：回复能量
    if (skill.energyRestore && skill.energyRestore > 0) {
      const oldEnergy = target.energy;
      target.energy = Math.min(target.energy + skill.energyRestore, MAX_ENERGY);
      const actualRestore = target.energy - oldEnergy;
      addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 回复 ${actualRestore} 点能量`, 'heal');
    }

    // 防御类技能效果（现已改为ally目标）
    if (skill.type === 'buff' || skill.type === 'special' || skill.effect || skill.vineBody) {
      // 扎根之躯：每回合回复最大HP的8%，但速度-1级
      if (skill.effect === 'rootBound') {
        target.rootBound = true;
        target.rootBoundTurns = skill.duration || 3;
        target.speedBoost = (target.speedBoost || 0) - 1;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 进入扎根状态（持续${target.rootBoundTurns}回合），每回合回复8%HP，但速度-1级`, 'buff');
      }

      // 蓄电/电荷蓄能
      if (skill.charge) {
        target.chargeStacks = (target.chargeStacks || 0) + 2;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'charge', remainingDuration: 3 });
        addLog(`${target.name} 积蓄2层电荷！`, 'buff');
      }

      // 冰墙
      if (skill.effect === 'ice_wall') {
        target.shield = (target.shield || 0) + (skill.power || 40);
        target.iceWallTurns = 2;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'ice_wall', remainingDuration: 2 });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 创造冰墙屏障！（护盾+40）`, 'buff');
      }

      // 藤蔓护甲：减伤+缠绕攻击者
      if (skill.vineBody) {
        target.damageReduction = (target.damageReduction || 0) + 0.5;
        target.damageReductionTurns = 1;
        target.entangleOnHit = true;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'vine_body', remainingDuration: 2 });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得藤蔓护体！（减伤50%，受伤时缠绕攻击者）`, 'buff');
      } else if (skill.effect === 'entangle_on_hit' || skill.damageReduction > 0) {
        target.damageReduction = (target.damageReduction || 0) + (skill.damageReduction || 0.5);
        target.damageReductionTurns = 1;
        target.entangleOnHit = true; // 标记受到攻击时缠绕攻击者
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得 ${Math.round((skill.damageReduction || 0.5) * 100)}% 减伤（本回合），受到攻击时缠绕攻击者（速度-2级）`, 'buff');
      }

      // 防反之姿：反弹伤害
      if (skill.effect === 'counterStance' || skill.reflectDamage > 0) {
        target.counterStance = true;
        target.counterStanceTurns = 1;
        target.reflectDamage = skill.reflectDamage || 0.6;
        target.priorityBoostOnReflect = 1;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 进入防反之姿（持续1回合），反弹 ${Math.round((skill.reflectDamage || 0.6) * 100)}% 伤害`, 'buff');
      }

      // 火盾：反伤效果
      if (skill.effect === 'fire_shield' || skill.fireShield) {
        target.fireShield = true;
        target.reflectDamage = skill.reflectDamage || (skill.effect === 'fire_shield' ? 0.3 : 0.3);
        target.reflectElement = caster.element;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得火盾效果（受伤时攻击者附加灼烧）`, 'buff');
      }

      // 炎体（flame_body）：受伤时攻击者附加灼烧
      if (skill.effect === 'fire_body' || skill.fireBodyEffect) {
        target.fireBodyEffect = true;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'fire_body', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 进入炎体状态（受伤时攻击者附加灼烧）`, 'buff');
      }

      // 烈火护体：减伤+下次火攻必定暴击
      if (skill.effect === 'wall_of_flames') {
        target.damageReduction = (target.damageReduction || 0) + 0.7;
        target.damageReductionTurns = 1;
        target.wallOfFlamesPower = 40;
        target.wallOfFlamesTurns = 1;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 降低70%伤害，本回合下次火攻必定暴击`, 'buff');
      }

      // 水之守护：受伤减50%
      if (skill.effect === 'water_guard') {
        target.damageReduction = (target.damageReduction || 0) + 0.7;
        target.damageReductionTurns = 1;
        target.aquaShield = true;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'aqua_shield', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 降低70%伤害`, 'buff');
      }

      // 冰霜护甲：减伤+反击冻结
      if (skill.effect === 'frost_armor') {
        target.damageReduction = (target.damageReduction || 0) + 0.5;
        target.damageReductionTurns = 1;
        target.frostArmor = true;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'frost_armor', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 降低50%伤害，受伤时使攻击者冻结1回合`, 'buff');
      }

      // 蓄电护体：减伤+蓄电
      if (skill.effect === 'static_charge') {
        target.damageReduction = (target.damageReduction || 0) + 0.5;
        target.damageReductionTurns = 1;
        target.chargeStacks = (target.chargeStacks || 0) + 2;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 降低50%伤害，获得2层蓄电`, 'buff');
      }

      // 电磁偏转：闪避+反击
      if (skill.effect === 'electric_deflect') {
        target.electricDeflect = true;
        target.electricDeflectTurns = 1;
        target.evasionBonus = 0.7;
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得电磁偏转状态（70%闪避并反击20伤害）`, 'buff');
      }

      // 心智护盾：减伤50% + 护盾 + 精神免疫
      if (skill.mindShield || skill.effect === 'mind_shield') {
        target.damageReduction = (target.damageReduction || 0) + 0.5;
        target.damageReductionTurns = 1;
        target.shield = (target.shield || 0) + (skill.power || 30);
        target.psychicResist = true;
        // 应用属性抗性效果（如精神免疫：psychic 属性减伤100%）
        if (skill.resistances) {
          skill.resistances.forEach(r => {
            target.resistances = target.resistances || {};
            target.resistances[r.element] = (target.resistances[r.element] || 0) + r.value;
            target.resistanceTurns = target.resistanceTurns || {};
            target.resistanceTurns[r.element] = r.duration || 1;
          });
        }
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'mind_body', remainingDuration: skill.duration || 1 });
        addLog(`${caster.name} 使用 ${skill.name}，进入心灵护体状态（减伤50%+护盾${skill.power || 30}+精神免疫）！`, 'buff');
      }

      // 灵镜反照：反弹伤害×1.8
      if (skill.mirrorReflect || skill.effect === 'mirror_reflect') {
        target.mirrorReflect = true;
        target.mirrorReflectTurns = 1;
        target.mirrorReflectDamage = skill.mirrorReflectDamage || 1.8;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'mirror_reflect', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，进入灵镜状态（反弹${Math.round((skill.mirrorReflectDamage || 1.8) * 100)}%伤害，未被攻击时保留1次）！`, 'buff');
      }

      // 迷雾之躯：闪避
      if (skill.mistBody || skill.effect === 'mist_body') {
        target.mistBody = true;
        target.mistBodyTurns = skill.duration || 2;
        target.mistBodyChance = skill.mistBodyChance || 0.7;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'mist_body', remainingDuration: skill.duration || 2 });
        addLog(`${caster.name} 使用 ${skill.name}，进入迷雾之躯状态（${Math.round((skill.mistBodyChance || 0.7) * 100)}%闪避，闪避成功后速度+1级）！`, 'buff');
      }

      // 龙鳞守护：减伤75% + 护盾（基于龙之气息层数，每层15点）+ 反击30威力
      if (skill.effect === 'dragon_guard' || skill.dragonScalesShield) {
        // 减伤75%（持续1回合）
        target.damageReduction = (target.damageReduction || 0) + 0.75;
        target.damageReductionTurns = 1;
        // 基于龙之气息层数的护盾
        const dragonBloodStacks = target.dragonBloodStacks || 0;
        const shieldAmount = 15 * dragonBloodStacks;
        target.shield = (target.shield || 0) + shieldAmount;
        // 设置龙鳞守护反击标记（受击时反击30威力）
        target.dragonGuardCounter = true;
        target.dragonGuardCounterDamage = 30;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'dragon_guard', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，获得龙鳞守护（减伤75%，护盾+${shieldAmount}，受击反击30威力）`, 'buff');
      }

      // 龙属共鸣·极：终极技，消耗所有龙之气息（每层：威力+15、护盾+10、减伤+10%）；层数≥10时全体敌人攻击-2级
      if (skill.dragonResonanceUltimate) {
        const dragonBloodStacks = caster.dragonBloodStacks || 0;
        if (dragonBloodStacks === 0) {
          addLog(`${caster.name} 没有龙之气息层数，龙属共鸣·极无法发挥效果！`, 'debuff');
        } else {
          // 消耗所有龙之气息
          caster.dragonBloodStacks = 0;
          addLog(`${caster.name} 消耗 ${dragonBloodStacks} 层龙之气息！`, 'buff');
          // 护盾加成（每层+10）
          const resonanceShield = dragonBloodStacks * 10;
          caster.shield = (caster.shield || 0) + resonanceShield;
          addLog(`${caster.name} 获得龙属共鸣护盾 +${resonanceShield}！`, 'buff');
          // 减伤加成（每层+10%，持续1回合）
          const resonanceDR = Math.min(dragonBloodStacks * 0.10, 1.0);
          caster.damageReduction = (caster.damageReduction || 0) + resonanceDR;
          caster.damageReductionTurns = 1;
          addLog(`${caster.name} 获得龙属共鸣减伤 +${Math.round(resonanceDR * 100)}%（持续1回合）！`, 'buff');
          // 层数≥10：全体敌人攻击-2级
          if (dragonBloodStacks >= 10) {
            enemyUnits.forEach(e => {
              if (e.currentHp <= 0) return;
              e.attackBoost = (e.attackBoost || 0) - 2;
              e.buffs = e.buffs || [];
              e.buffs = e.buffs.filter(b => b.type !== 'dragon_intimidate');
              e.buffs.push({ type: 'dragon_intimidate', remainingDuration: 3 });
            });
            addLog(`${caster.name} 的龙之气息达到${dragonBloodStacks}层！全体敌人攻击力-2级！`, 'debuff');
          }
        }
      }

      // 清泉护盾：每回合回复HP并清除负面状态
      if (skill.effect === 'clear_spring') {
        target.buffs = target.buffs || [];
        target.buffs.push({
          type: 'clear_spring',
          healPercent: 0.1,
          cleanseCount: 1,
          remainingDuration: skill.clearSpringDuration || 3
        });
        addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得「清泉护盾」状态！（每回合回复10%HP并清除1个负面状态，持续${skill.clearSpringDuration || 3}回合）`, 'buff');
      }

      // 超能系：心智同步（与目标交换所有强化/弱化状态）
      if (skill.mindSync) {
        const casterBuffs = [...(caster.buffs || [])];
        const casterDebuffs = [...(caster.debuffs || [])];
        const targetBuffs = [...(target.buffs || [])];
        const targetDebuffs = [...(target.debuffs || [])];
        caster.buffs = targetBuffs;
        caster.debuffs = targetDebuffs;
        target.buffs = casterBuffs;
        target.debuffs = casterDebuffs;
        addLog(`${caster.name} 与 ${target.name} 交换了所有状态！`, 'buff');
      }
    }

  } else if (skill.target === 'self') {
    // 自身目标
    if (skill.type === 'shield') {
      target.shield = (target.shield || 0) + skill.power;

      // 属性抗性效果
      if (skill.resistances) {
        skill.resistances.forEach(r => {
          target.resistances = target.resistances || {};
          target.resistances[r.element] = (target.resistances[r.element] || 0) + r.value;
          target.resistanceTurns = target.resistanceTurns || {};
          target.resistanceTurns[r.element] = r.duration;
          addLog(`${target.name} 获得 ${r.element} 属性抗性 +${Math.round(r.value * 100)}%`, 'buff');
        });
      }

      // 烈火护体：下次火属性攻击威力+40
      if (skill.addFirePower > 0) {
        target.wallOfFlamesPower = skill.addFirePower;
        target.wallOfFlamesTurns = 1;
        addLog(`${caster.name} 使用 ${skill.name}，为自身施加 ${skill.power} 点护盾，下次火属性攻击威力+${skill.addFirePower}`, 'buff');
      } else {
        addLog(`${caster.name} 使用 ${skill.name}，为自身施加 ${skill.power} 点护盾`);
      }
    }

    // 光能聚集：获得光能汇聚层数（与 type 无关，self_buff + grass_power 会产生 lightGather 字段）
    if (skill.lightGather && skill.lightGather > 0) {
      target.lightGatherStacks = (target.lightGatherStacks || 0) + skill.lightGather;
      addLog(`${caster.name} 使用 ${skill.name}，获得 ${skill.lightGather} 层光能汇聚（下回合草系技能+60威力/层）`, 'buff');
    }

    // 火盾：减伤+反伤（self 目标，fire_shield_skill 的 type='special' 不会进入 shield 分支）
    if (skill.fireShield) {
      target.fireShield = true;
      target.reflectDamage = skill.reflectDamage || 0.3;
      target.reflectElement = caster.element;
      addLog(`${caster.name} 使用 ${skill.name}，自身获得火盾效果（受伤时攻击者附加灼烧）`, 'buff');
    }

    // 炎体：受伤时攻击者附加灼烧（self 目标，wall_of_flames 的 type='special'）
    if (skill.effect === 'flame_body' || skill.fireBodyEffect) {
      target.fireBodyEffect = true;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'fire_body', remainingDuration: 1 });
      addLog(`${caster.name} 使用 ${skill.name}，自身进入炎体状态（受伤时攻击者附加灼烧）`, 'buff');
    }

    if (skill.type === 'buff' || skill.type === 'special' || skill.effect || skill.vineBody) {
      // 水之守护：受伤减70%，被攻击时反击者获得浸透
      if (skill.effect === 'water_guard') {
        target.damageReduction = (target.damageReduction || 0) + 0.7;
        target.damageReductionTurns = 1;
        target.aquaShield = true;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'aqua_shield', remainingDuration: 1 });
        addLog(`${caster.name} 使用 ${skill.name}，降低70%伤害（持续1回合）`, 'buff');
      }

      // 藤蔓护甲：减伤+缠绕攻击者
      if (skill.vineBody) {
        target.damageReduction = (target.damageReduction || 0) + (skill.damageReduction || 0.5);
        target.damageReductionTurns = 1;
        target.entangleOnHit = true; // 标记受到攻击时缠绕攻击者
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'vine_body', remainingDuration: 2 });
        addLog(`${caster.name} 使用 ${skill.name}，获得藤蔓护体！（减伤${Math.round((skill.damageReduction || 0.5) * 100)}%，受伤时缠绕攻击者）`, 'buff');
      }
      // 充能加速：速度+2级
      if (skill.speedBoost) {
        target.speedBoost = (target.speedBoost || 0) + skill.speedBoost;
        addLog(`${caster.name} 使用 ${skill.name}，速度提升 ${skill.speedBoost} 级！`, 'buff');
      }
      // 电荷蓄能
      if (skill.charge) {
        target.chargeStacks = (target.chargeStacks || 0) + 2;
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'charge', remainingDuration: 3 });
        addLog(`${target.name} 积蓄2层电荷！`, 'buff');
      }
      // 连击充能
      if (skill.comboCharge) {
        target.comboCharge = true;
        addLog(`${caster.name} 积累连击充能，下次攻击享受增伤！`, 'buff');
      }
      // 属性抗性效果
      if (skill.resistances) {
        skill.resistances.forEach(r => {
          target.resistances = target.resistances || {};
          target.resistances[r.element] = (target.resistances[r.element] || 0) + r.value;
          target.resistanceTurns = target.resistanceTurns || {};
          target.resistanceTurns[r.element] = r.duration;
          addLog(`${target.name} 获得 ${r.element} 属性抗性 +${Math.round(r.value * 100)}%`, 'buff');
        });
      }

      // 扎根之躯：每回合回复最大HP的8%，但速度-1级
      if (skill.effect === 'rootBound') {
        target.rootBound = true;
        target.rootBoundTurns = 3;
        target.speedBoost = (target.speedBoost || 0) - 1;
        addLog(`${caster.name} 使用 ${skill.name}，进入扎根状态（持续${target.rootBoundTurns}回合），每回合回复8%HP，但速度-1级`, 'buff');
      }

      // 藤蔓护甲：减伤+缠绕攻击者
      if (skill.vineBody || (skill.damageReduction && skill.damageReduction > 0)) {
        target.damageReduction = (target.damageReduction || 0) + (skill.damageReduction || 0.5);
        target.damageReductionTurns = 1;
        target.entangleOnHit = true; // 标记受到攻击时缠绕攻击者
        target.buffs = target.buffs || [];
        target.buffs.push({ type: 'vine_body', remainingDuration: 2 });
        addLog(`${caster.name} 使用 ${skill.name}，获得 ${Math.round((skill.damageReduction || 0.5) * 100)}% 减伤（本回合），受到攻击时缠绕攻击者`, 'buff');
      }

      // 防反之姿：反弹伤害+先手
      if (skill.effect === 'counterStance' || skill.reflectDamage > 0) {
        target.counterStance = true;
        target.counterStanceTurns = 1;
        target.reflectDamage = skill.reflectDamage || 0.6;
        target.priorityBoostOnReflect = 1; // 反弹后获得先手+1
        addLog(`${caster.name} 使用 ${skill.name}，进入防反之姿（持续1回合），反弹 ${Math.round(skill.reflectDamage * 100)}% 伤害，反弹后获得先手+1`, 'buff');
      }
    }

    // 清泉护盾效果（每回合回复10%HP并清除1个负面状态）
    if (skill.clearSpringEffect) {
      target.buffs = target.buffs || [];
      target.buffs.push({
        type: 'clear_spring',
        healPercent: 0.1, // 每回合10%HP
        cleanseCount: 1, // 清除1个debuff
        remainingDuration: skill.clearSpringDuration || 3
      });
      addLog(`${caster.name} 获得「清泉护盾」状态！（每回合回复10%HP并清除1个负面状态，持续${skill.clearSpringDuration || 3}回合）`, 'buff');
    }

    // 流水效果（速度+1级）
    if (skill.flowEffect) {
      target.buffs = target.buffs || [];
      target.buffs.push({
        type: 'flow',
        speedBoost: 1,
        remainingDuration: 2
      });
      addLog(`${caster.name} 获得「流水」状态！（速度+1级，持续2回合）`, 'buff');
    }

    // 藤蔓护甲（self 目标）：减伤+缠绕攻击者
    if (skill.vineBody) {
      target.damageReduction = (target.damageReduction || 0) + 0.5;
      target.damageReductionTurns = 1;
      target.entangleOnHit = true;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'vine_body', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，获得藤蔓护体！（减伤50%，受伤时缠绕攻击者）`, 'buff');
    }

    // 冰霜护甲（self 目标）：减伤+反击冻结
    if (skill.effect === 'frost_armor') {
      target.damageReduction = (target.damageReduction || 0) + 0.5;
      target.damageReductionTurns = 1;
      target.frostArmor = true;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'frost_armor', remainingDuration: 1 });
      addLog(`${caster.name} 使用 ${skill.name}，获得冰霜护体！（减伤50%，受伤时使攻击者冻结1回合）`, 'buff');
    }

    // 冰墙（self 目标）：护盾+减伤
    if (skill.effect === 'ice_wall') {
      target.shield = (target.shield || 0) + (skill.power || 40);
      target.damageReduction = (target.damageReduction || 0) + 0.5;
      target.damageReductionTurns = 2;
      target.iceWallTurns = 2;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'ice_wall', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，创造冰墙屏障！（护盾+40，减伤50%）`, 'buff');
    }

    // 寒气凝聚：防御+1级
    if (skill.effect === 'cold_aura' || skill.id === 'cold_aura') {
      target.defenseBoost = (target.defenseBoost || 0) + 1;
      target.defenseBoostTurns = skill.duration || 2;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'cold_aura', remainingDuration: skill.duration || 2 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得「寒气凝聚」！（防御+1级，持续${skill.duration || 2}回合）`, 'buff');
    }

    // 蓄电护体（self 目标）
    if (skill.effect === 'static_charge') {
      target.chargeStacks = (target.chargeStacks || 0) + 1;
      target.electricDefense = true;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'static_charge', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，获得蓄电护体！（受攻击时攻击者受到电属性伤害）`, 'buff');
    }

    // 电磁偏转（self 目标）
    if (skill.effect === 'electric_deflect') {
      target.electricDeflect = true;
      target.dodgeChance = (target.dodgeChance || 0) + 0.3;
      target.electricDeflectTurns = 1;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'electric_deflect', remainingDuration: 1 });
      addLog(`${caster.name} 使用 ${skill.name}，获得电磁偏转！（闪避+30%，持续1回合）`, 'buff');
    }
  } else if (skill.target === 'all_ally') {
    // 全体队友目标
    if (skill.type === 'shield') {
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        unit.shield = (unit.shield || 0) + skill.power;
        // 属性抗性效果
        if (skill.resistances) {
          skill.resistances.forEach(r => {
            unit.resistances = unit.resistances || {};
            unit.resistances[r.element] = (unit.resistances[r.element] || 0) + r.value;
            unit.resistanceTurns = unit.resistanceTurns || {};
            unit.resistanceTurns[r.element] = r.duration;
          });
        }
      });
      addLog(`${caster.name} 使用 ${skill.name}，为全体施加 ${skill.power} 点护盾`);
      if (skill.resistances) {
        skill.resistances.forEach(r => {
          addLog(`全体获得 ${r.element} 属性抗性 +${Math.round(r.value * 100)}%`, 'buff');
        });
      }
    }
    // 炎之意志：攻击+1级、速度+1级、火属性伤害+25%（持续2回合）
    // 检查是否有 buff_all 效果类型的属性提升
    if ((skill.attackBoost || skill.speedBoost || skill.fireDamageBoost) && skill.effects) {
      const hasBuffAll = skill.effects.some(e => e.type === 'buff_all');
      if (hasBuffAll) {
        const allAllies = [...playerUnits];
        allAllies.forEach(unit => {
          if (unit.currentHp <= 0) return;

          if (skill.attackBoost) {
            unit.attackBoost = (unit.attackBoost || 0) + skill.attackBoost;
            unit.attackBoostTurns = skill.duration || 2;
          }
          if (skill.spAtkBoost) {
            unit.spAtkBoost = (unit.spAtkBoost || 0) + skill.spAtkBoost;
            unit.spAtkBoostTurns = skill.duration || 2;
          }
          if (skill.speedBoost) {
            unit.speedBoost = (unit.speedBoost || 0) + skill.speedBoost;
            unit.speedBoostTurns = skill.duration || 2;
          }
          if (skill.fireDamageBoost) {
            unit.fireDamageBoost = (unit.fireDamageBoost || 0) + skill.fireDamageBoost;
            unit.fireDamageBoostTurns = skill.duration || 2;
          }
          addLog(`${unit.name} 获得增益：${skill.attackBoost ? `攻击+${skill.attackBoost}级 ` : ''}${skill.speedBoost ? `速度+${skill.speedBoost}级 ` : ''}${skill.fireDamageBoost ? `火属性伤害+${Math.round(skill.fireDamageBoost * 100)}%` : ''}`, 'buff');
        });

        addLog(`${caster.name} 使用 ${skill.name}，为全体施加增益效果（持续${skill.duration || 2}回合）`, 'buff');
      }
    }

    // 炎之意志：blazeWillEffect（为全体己方添加炎之意志标记，属性由上面的 buff_all 处理器统一设置）
    if (skill.blazeWillEffect) {
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        unit.buffs = unit.buffs || [];
        unit.buffs.push({ type: 'blaze_will', remainingDuration: skill.duration || 3 });
      });
      addLog(`${caster.name} 使用 ${skill.name}，己方全体获得「炎之意志」！（攻击+1、特攻+1、火属性伤害+25%）`, 'buff');
    }

    // 芬芳绽放：召唤芬芳环境（持续4回合），己方草系技能伤害+25%，每回合回复5%HP
    if (skill.effect === 'fragrantEnvironment' || skill.grassDamageBoost) {
      battleEnvironment = 'fragrant';
      battleEnvironmentTurns = 4;
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        unit.fragrantBloom = true;
        unit.fragrantBloomTurns = 4;
      });
      addLog(`${caster.name} 使用 ${skill.name}，召唤芬芳环境！（持续4回合：己方草系技能伤害+25%，每回合回复5%HP）`, 'buff');
    }

    // 草系：藤蔓护体
    if (skill.vineBody) {
      target.damageReduction = (target.damageReduction || 0) + (skill.vineBodyReduction || 0.5);
      target.damageReductionTurns = 1;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'vine_body', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得藤蔓护体！（减伤50%，受伤时缠绕攻击者）`, 'buff');
    }

    // 电系：电磁场
    if (skill.electricFieldEffect) {
      battleEnvironment = 'electric';
      battleEnvironmentTurns = skill.duration || 4;
      addLog(`${caster.name} 使用 ${skill.name}，创造电磁场环境！（持续${skill.duration || 4}回合）`, 'buff');
    }

    // 电系：静电标记
    if (skill.staticMark) {
      target.debuffs = target.debuffs || [];
      target.debuffs.push({ type: 'static_mark', remainingDuration: skill.duration || 3 });
      addLog(`${target.name} 获得「静电标记」！（受到电属性攻击时额外受到伤害）`, 'debuff');
    }

    // 电系：电磁偏转
    if (skill.electricDeflect || skill.effect === 'electric_deflect') {
      target.electricDeflect = true;
      target.dodgeChance = (target.dodgeChance || 0) + 0.3;
      target.electricDeflectTurns = 1;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'electric_deflect', remainingDuration: 1 });
      addLog(`${caster.name} 使用 ${skill.name}，获得电磁偏转！（闪避+30%，持续1回合）`, 'buff');
    }

    // 电系：蓄电护体（静电释放）
    if (skill.effect === 'static_charge') {
      target.chargeStacks = (target.chargeStacks || 0) + 1;
      target.electricDefense = true;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'static_charge', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，获得蓄电护体！（受攻击时攻击者受到电属性伤害）`, 'buff');
    }

    // 冰系：霜印
    if (skill.frostMark) {
      target.frostMarkStacks = (target.frostMarkStacks || 0) + 1;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'frost_mark', remainingDuration: 3 });
      addLog(`${target.name} 获得「霜印」！（冰系技能威力+15%/层，持续3回合）`, 'buff');
    }

    // 冰系：极寒印记
    if (skill.extremeColdMark) {
      target.debuffs = target.debuffs || [];
      target.debuffs.push({ type: 'extreme_cold_mark', remainingDuration: skill.duration || 3 });
      addLog(`${target.name} 获得「极寒印记」！（下次使用技能时额外消耗2能量）`, 'debuff');
    }

    // 冰系：冰墙
    if (skill.effect === 'ice_wall') {
      target.shield = (target.shield || 0) + (skill.power || 40);
      target.damageReduction = (target.damageReduction || 0) + 0.5;
      target.damageReductionTurns = 2;
      target.iceWallTurns = 2;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'ice_wall', remainingDuration: 2 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 创造冰墙屏障！（护盾+40，减伤50%）`, 'buff');
    }

    // 冰系：寒气凝聚
    if (skill.effect === 'cold_aura' || skill.id === 'cold_aura') {
      target.defenseBoost = (target.defenseBoost || 0) + 1;
      target.defenseBoostTurns = skill.duration || 2;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'cold_aura', remainingDuration: skill.duration || 2 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得「寒气凝聚」！（防御+1级，持续${skill.duration || 2}回合）`, 'buff');
    }

    // 冰系：冻土环境
    if (skill.frozenLandEffect) {
      battleEnvironment = 'frozen_land';
      battleEnvironmentTurns = skill.duration || 3;
      addLog(`${caster.name} 使用 ${skill.name}，创造冻土环境！（冰属性技能能耗-1，持续${skill.duration || 3}回合）`, 'buff');
    }

    // 超能系：心灵护体
    if (skill.mindShield) {
      target.shield = (target.shield || 0) + (skill.power || 30);
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'mind_body', remainingDuration: skill.duration || 3 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 进入心灵护体状态！（护盾+30，受伤降低50%）`, 'buff');
    }

    // 超能系：精神场地
    if (skill.psychicTerrain) {
      battleEnvironment = 'psychic';
      battleEnvironmentTurns = skill.duration || 5;
      // 精神场地保护：己方全体免疫优先度攻击（优先度攻击目前无实现，跳过）
      // TODO: 当系统支持优先度攻击时，在此添加优先度免疫检查
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        unit.psychicTerrainProtected = true;
        unit.psychicTerrainProtectedTurns = battleEnvironmentTurns;
      });
      addLog(`${caster.name} 使用 ${skill.name}，召唤精神场地！（超能技能威力+30%，持续${battleEnvironmentTurns}回合）`, 'buff');
    }

    // 超能系：精神噪音
    if (skill.psychicNoise) {
      enemyUnits.forEach(e => {
        if (e.currentHp <= 0) return;
        e.debuffs = e.debuffs || [];
        e.debuffs.push({ type: 'psychic_noise', remainingDuration: skill.duration || 3 });
      });
      addLog(`${caster.name} 使用 ${skill.name}，全体敌人受到精神噪音干扰！（无法通过任何方式恢复HP）`, 'debuff');
    }

    // 地系：沙暴降临
    if (skill.sandstormEffect) {
      battleEnvironment = 'sandstorm';
      battleEnvironmentTurns = skill.duration || 5;
      // 沙暴：岩/地/钢系特防+50%
      const sandstormBoostUnits = [...playerUnits, ...enemyUnits].filter(u =>
        u.currentHp > 0 && (u.element === 'ground' || u.element === 'rock' || u.element === 'steel')
      );
      sandstormBoostUnits.forEach(u => {
        u.spDefenseBoost = (u.spDefenseBoost || 0) + 0.5;
        u.spDefenseBoostTurns = skill.duration || 5;
      });
      addLog(`${caster.name} 使用 ${skill.name}，召唤沙暴天气！（持续${skill.duration || 5}回合，岩/地/钢系特防+50%）`, 'buff');
    }

    // 地系：泼沙 - 命中率-1级
    if (skill.id === 'sand_attack') {
      target.accuracyBoost = (target.accuracyBoost || 0) - 1;
      target.accuracyBoostTurns = skill.duration || 2;
      target.debuffs = target.debuffs || [];
      target.debuffs.push({ type: 'sand_attack', remainingDuration: skill.duration || 2 });
      addLog(`${caster.name} 使用 ${skill.name}，向${target.name}泼沙！命中率降低1级！`, 'debuff');
    }

    // 地系：挖洞
    if (skill.undergroundEffect) {
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'underground', remainingDuration: 1, evasionBonus: 1.0 });
      target.immuneGround = true;
      target.nextTurnPriority = true;
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 进入地下！（免疫地面攻击，下回合必定先手）`, 'buff');
    }

    // 地系：流沙地狱
    if (skill.sandTombEffect) {
      target.debuffs = target.debuffs || [];
      target.debuffs.push({
        type: 'sand_tomb',
        remainingDuration: skill.duration || 3,
        speedDebuff: 2,
        damagePercent: skill.sandTombDamage || 0.04
      });
      target.speedStage = Math.max(-6, (target.speedStage || 0) - 2);
      addLog(`${target.name} 陷入「流沙地狱」！（速度-2级，每回合受到4%最大HP伤害）`, 'debuff');
    }

    // 龙系：龙威减退
    if (skill.dragonPowerLoss) {
      target.debuffs = target.debuffs || [];
      target.debuffs.push({ type: 'dragon_power_loss', remainingDuration: skill.duration || 3 });
      target.attackBoost = (target.attackBoost || 0) - 2;
      target.spAtkBoost = (target.spAtkBoost || 0) - 2;
      addLog(`${target.name} 陷入「龙威减退」！（攻击-2级、特攻-2级）`, 'debuff');
    }

    // 地系：耕地 - 治疗全体25%HP+清除所有异常状态
    if (skill.id === 'cultivate') {
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        const heal = Math.floor(unit.maxHp * 0.25);
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + heal);
        showDamageNumber(unit.id, heal, 'heal');
        updateHpBar(unit);
        // 清除所有异常状态
        if (unit.debuffs && unit.debuffs.length > 0) {
          const clearedTypes = unit.debuffs.map(d => d.type).join('、');
          unit.debuffs = [];
          addLog(`${unit.name} 的异常状态已清除（${clearedTypes}）`, 'buff');
        }
      });
      addLog(`${caster.name} 使用 ${skill.name}，耕地滋养全体队友！（治疗25%HP，清除所有异常状态）`, 'heal');
    }

    // 地系：玩泥巴 - 特攻+1/特防+1/速度+1
    if (skill.id === 'mud_sport') {
      target.spAtkBoost = (target.spAtkBoost || 0) + 1;
      target.spAtkBoostTurns = 3;
      target.spDefenseBoost = (target.spDefenseBoost || 0) + 1;
      target.spDefenseBoostTurns = 3;
      target.speedBoost = (target.speedBoost || 0) + 1;
      target.speedBoostTurns = 3;
      target.buffs = target.buffs || [];
      target.buffs.push({ type: 'mud_sport', remainingDuration: 3 });
      addLog(`${caster.name} 使用 ${skill.name}，${target.name} 获得「玩泥巴」效果！（特攻+1、特防+1、速度+1，持续3回合）`, 'buff');
    }

    // 水系全体队友效果
    // 水疗之术：群体治疗+流水状态
    if (skill.healPercent && skill.healPercent > 0) {
      playerUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        const heal = Math.floor(unit.maxHp * skill.healPercent);
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + heal);
        showDamageNumber(unit.id, heal, 'heal');
        updateHpBar(unit);
      });
      addLog(`${caster.name} 使用 ${skill.name}，为全体恢复 ${Math.round(skill.healPercent * 100)}% HP`);

      // 流水效果（速度+1级）
      if (skill.flowEffect) {
        playerUnits.forEach(unit => {
          if (unit.currentHp <= 0) return;
          unit.buffs = unit.buffs || [];
          unit.buffs.push({
            type: 'flow',
            speedBoost: 1,
            remainingDuration: 2
          });
        });
        addLog(`全体获得「流水」状态！（速度+1级，持续2回合）`, 'buff');
      }
    }
  }

  // 重新渲染单位卡片以显示debuff/buff标签
  // 注意：延迟渲染以确保伤害数字动画有时间播放
  setTimeout(() => {
    renderPlayerUnits();
    renderEnemyUnits();
  }, 1000);

  // 水系天气效果
  // 雨天效果（雨天：所有生物水属性技能威力+50%）
  if (skill.rainyDayEffect) {
    // 设置雨天环境效果
    battleEnvironment = 'rainy';
    battleEnvironmentTurns = skill.rainyDayDuration || 3;
    addLog(`${caster.name} 使用 ${skill.name}，创造雨天环境！（持续${battleEnvironmentTurns}回合，所有水属性技能威力+${Math.round((skill.rainyDayPowerBoost || 0.5) * 100)}%）`, 'buff');
  }

  // 炎之意志（全体己方）
  if (skill.blazeWillEffect) {
    playerUnits.forEach(unit => {
      if (unit.currentHp <= 0) return;
      unit.buffs = unit.buffs || [];
      unit.buffs.push({ type: 'blaze_will', remainingDuration: skill.duration || 3 });
      unit.attackBoost = (unit.attackBoost || 0) + 1;
      unit.spAtkBoost = (unit.spAtkBoost || 0) + 1;
      unit.fireDamageBoost = (unit.fireDamageBoost || 0) + 0.25;
    });
    addLog(`${caster.name} 使用 ${skill.name}，己方全体获得「炎之意志」！（攻击+1、特攻+1、火属性伤害+25%）`, 'buff');
  }

  // 设置防御技能冷却（如果技能有冷却时间）
  if (skill.cooldown && skill.cooldown > 0) {
    // 获取该角色所有防御技能的ID列表
    const defenseSkillIds = caster.skills
      .filter(s => s.cooldown && s.cooldown > 0)
      .map(s => s.id);

    // 为角色A的所有防御技能设置冷却
    defenseSkillIds.forEach(skillId => {
      if (!defenseSkillCooldowns[caster.id]) {
        defenseSkillCooldowns[caster.id] = {};
      }
      defenseSkillCooldowns[caster.id][skillId] = skill.cooldown;
    });

    addLog(`${caster.name} 的所有防御技能进入冷却（持续${skill.cooldown}回合）`, 'info');
  }

  await delay(300);
}
