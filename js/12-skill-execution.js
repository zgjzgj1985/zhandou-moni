// 玩家技能执行系统
// 从 battle-simple.html 行 4151-4945 提取

// 执行玩家命令
async function executePlayerCommand(caster, skill, targetId) {
  const target = [...enemyUnits, ...playerUnits].find(u => u.id === targetId);
  if (!target || target.currentHp <= 0) return;

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
    let totalDamage = 0;

    // 检查蓄焰增伤buff（蓄焰是给队友的buff，所以检查target）
    let powerBonus = 0;
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

    // 检查芬芳环境增伤（草系技能）
    if (battleEnvironment === 'fragrant' && skill.element === 'grass') {
      powerBonus += Math.floor(skill.power * 0.25);
      addLog(`芬芳环境影响，草系技能威力+25%！`, 'buff');
    }

    // 雷霆连击：多段攻击
    if (skill.effect === 'combo') {
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
        showDamageNumber(target.id, hitDamage, 'damage');

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
        showDamageNumber(target.id, extraDamage, 'damage');
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
      const result = calculatePokemonDamage(caster, target, { ...skill, power: skill.power + powerBonus });
      let damage = result.damage;

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
      showDamageNumber(target.id, damage, 'damage');

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

      // 绽放之舞：必定暴击效果（×1.5）
      if (skill.guaranteedCrit) {
        addLog(`${skill.name} 本回合必定暴击！`);
      }

      let logMsg = `${caster.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`;
      if (result.isCrit) logMsg += '（暴击！）';
      if (result.hasStab) logMsg += '【STAB】';
      if (result.typeMultiplier !== 1) logMsg += `【${result.typeMultiplier >= 2 ? '效果拔群' : '效果微弱'}×${result.typeMultiplier}】`;
      addLog(logMsg, 'damage');

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
    }

    // 燃尽：延迟伤害（3回合后扣除30%当前HP）
    if (skill.effect === 'combustion') {
      target.combustionStacks = (target.combustionStacks || 0) + 1;
      target.combustionTurnsLeft = 3;
      addLog(`${target.name} 被施加「燃尽印记」（${target.combustionTurnsLeft}回合后扣除30%当前HP）`, 'debuff');
    }

    // 灼伤印记：每次行动前受到自身威力计算的物理/特殊伤害
    if (skill.effect === 'burnMark') {
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

    // 火盾反伤 + 附加灼烧（玩家攻击敌人时触发）
    if (target.fireShield && target.reflectDamage > 0 && target.currentHp > 0) {
      const reflectDmg = Math.floor(target.reflectDamage * (0.8 + Math.random() * 0.4));
      caster.currentHp = Math.max(0, caster.currentHp - reflectDmg);
      showDamageNumber(caster.id, reflectDmg, 'damage');
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

    // 重新渲染单位卡片以显示debuff/buff标签
    if (enemyUnits.includes(target)) {
      renderEnemyUnits();
    } else {
      renderPlayerUnits();
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
        heal = Math.floor(target.maxHp * skill.healPercent);
      } else {
        heal = Math.floor(skill.power * (0.8 + Math.random() * 0.4));
      }
      target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
      showDamageNumber(target.id, heal, 'heal');
      updateHpBar(target);
      addLog(`${caster.name} 使用 ${skill.name}，恢复 ${target.name} ${heal} HP`, 'heal');

      // 流水效果（水疗之术：速度+1级）
      if (skill.flowEffect) {
        target.buffs = target.buffs || [];
        target.buffs.push({
          type: 'flow',
          speedBoost: 1,
          remainingDuration: 2
        });
        addLog(`${target.name} 获得「流水」状态！（速度+1级，持续2回合）`, 'buff');
      }
    }

    // 蓄焰：为目标施加蓄焰状态（持续3回合），下次火属性攻击威力+（自身能量×10）
    if (skill.effect === 'flameCharge') {
      target.flameCharge = true;
      target.flameChargeTurns = 3;
      target.flameChargePower = caster.energy * 10;
      addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 施加蓄焰（持续${target.flameChargeTurns}回合），下次火属性攻击威力+${target.flameChargePower}`, 'buff');
    }

    // 养分汲取：回复HP并增加能量
    if (skill.healPercent && skill.healPercent > 0) {
      const healAmount = Math.floor(target.maxHp * skill.healPercent);
      target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
      showDamageNumber(target.id, healAmount, 'heal');
      updateHpBar(target);
      addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 回复 ${healAmount} HP（${Math.round(skill.healPercent * 100)}%最大HP）`, 'heal');
    }

    // 养分汲取：回复能量
    if (skill.energyRestore && skill.energyRestore > 0) {
      const oldEnergy = target.energy;
      target.energy = Math.min(target.energy + skill.energyRestore, MAX_ENERGY);
      const actualRestore = target.energy - oldEnergy;
      addLog(`${caster.name} 使用 ${skill.name}，为 ${target.name} 回复 ${actualRestore} 点能量`, 'heal');
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
    if (skill.type === 'buff') {
      // 充能加速：速度+2级
      if (skill.speedBoost) {
        target.speedBoost = (target.speedBoost || 0) + skill.speedBoost;
        addLog(`${caster.name} 使用 ${skill.name}，速度提升 ${skill.speedBoost} 级！`, 'buff');
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
      if (skill.damageReduction && skill.damageReduction > 0) {
        target.damageReduction = (target.damageReduction || 0) + skill.damageReduction;
        target.damageReductionTurns = 1;
        target.entangleOnHit = true; // 标记受到攻击时缠绕攻击者
        addLog(`${caster.name} 使用 ${skill.name}，获得 ${Math.round(skill.damageReduction * 100)}% 减伤（本回合），受到攻击时缠绕攻击者（速度-2级）`, 'buff');
      }

      // 防反之姿：反弹伤害+先手
      if (skill.effect === 'counterStance' || skill.reflectDamage > 0) {
        target.counterStance = true;
        target.counterStanceTurns = 1;
        target.reflectDamage = skill.reflectDamage || 0.6;
        target.priorityBoostOnReflect = 1; // 反弹后获得先手+1
        addLog(`${caster.name} 使用 ${skill.name}，进入防反之姿（持续1回合），反弹 ${Math.round(skill.reflectDamage * 100)}% 伤害，反弹后获得先手+1`, 'buff');
      }

      // 光能聚集：获得光能汇聚层数
      if (skill.lightGather && skill.lightGather > 0) {
        target.lightGatherStacks = (target.lightGatherStacks || 0) + skill.lightGather;
        addLog(`${caster.name} 使用 ${skill.name}，获得 ${skill.lightGather} 层光能汇聚（下回合草系技能+60威力/层）`, 'buff');
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
  renderPlayerUnits();
  renderEnemyUnits();

  // 水系天气效果
  // 雨天效果（雨天：所有生物水属性技能威力+50%）
  if (skill.rainyDayEffect) {
    // 设置全局天气效果
    globalWeather = globalWeather || {};
    globalWeather.type = 'rainy';
    globalWeather.duration = skill.rainyDayDuration || 3;
    globalWeather.powerBoost = skill.rainyDayPowerBoost || 0.5; // 50%加成
    addLog(`${caster.name} 使用 ${skill.name}，创造雨天环境！（持续${globalWeather.duration}回合，所有水属性技能威力+${Math.round(globalWeather.powerBoost * 100)}%）`, 'buff');
  }

  await delay(300);
}
