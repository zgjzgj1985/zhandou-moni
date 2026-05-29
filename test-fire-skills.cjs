/**
 * 火系技能效果标签测试脚本 v5 - 最终版
 *
 * 用法: node test-fire-skills.cjs
 */
const { chromium } = require('playwright');
const path = require('path');

const FIRE_SKILLS = [
  { id: 'ember',            name: '点燃',     target: 'single_enemy', p: 0,  effects: [{ type: 'add_status', statusId: 'burn', stacks: 5 }] },
  { id: 'flare_blitz',      name: '大字爆炎', target: 'single_enemy', p: 120, effects: [{ type: 'damage' }, { type: 'add_status', statusId: 'burn_mark' }] },
  { id: 'explosion_flame',  name: '爆炸烈焰', target: 'single_enemy', p: 150, effects: [{ type: 'multi_hit', hits: 6, damage: 25 }, { type: 'add_status', statusId: 'combustion_mark', stacks: 1 }] },
  { id: 'overheat',         name: '过热',     target: 'single_enemy', p: 130, effects: [{ type: 'damage' }, { type: 'add_status', statusId: 'overheat_penalty' }] },
  { id: 'fire_shield',      name: '火盾',     target: 'self', p: 0, effects: [{ type: 'add_status', statusId: 'fire_shield' }] },
  { id: 'wall_of_flames',   name: '烈火护体', target: 'self', p: 0, effects: [{ type: 'add_status', statusId: 'flame_body' }, { type: 'special', specialType: 'extra_attack_damage', value: 40 }] },
  { id: 'flame_charge',     name: '蓄焰',     target: 'ally', p: 0, effects: [{ type: 'add_status', statusId: 'flame_charge' }] },
  { id: 'combustion',        name: '燃尽',     target: 'single_enemy', p: 0, effects: [{ type: 'add_status', statusId: 'combustion_mark', stacks: 1 }] },
  { id: 'blaze_will',       name: '炎之意志', target: 'all_ally', p: 0, effects: [{ type: 'add_status', statusId: 'blaze_will' }, { type: 'buff', stats: { attack: 1, speed: 1 } }, { type: 'buff', stats: { fire_damage_boost: 0.25 } }] },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(`file://${path.resolve('battle-simple-modular.html')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.getElementById('mode2Btn').click());
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    if (typeof initializePlayerSkills === 'function') initializePlayerSkills();
    if (typeof initializeEnemySkills === 'function') initializeEnemySkills();
  });
  await page.waitForTimeout(500);

  console.log('\n========== 火系技能效果标签测试 ==========\n');

  let pass = 0, fail = 0;

  for (const def of FIRE_SKILLS) {
    const r = await page.evaluate(async (skillDef) => {
      // === 确定施法者和目标 ===
      const caster = playerUnits[0];
      const ally   = playerUnits[1];
      const enemy  = enemyUnits[0];

      // === 转换技能 ===
      const skill = convertSkillToBattleFormat(skillDef, 'fire');
      skill.element = 'fire';
      skill.energyCost = 0;

      // === 确定目标 ===
      let target;
      if (skill.target === 'self') target = caster;
      else if (skill.target === 'ally') target = ally;
      else target = enemy;

      // === 清理（只清理实际会用到的那个目标，避免误清） ===
      target.fireShield    = false;
      target.fireBodyEffect = false;
      target.wallOfFlamesPower = 0;
      target.flameCharge   = false;
      target.flameChargeTurns = 0;
      target.attackBoost   = 0;
      target.spAtkBoost   = 0;
      target.fireDamageBoost = 0;
      target.buffs   = [];
      target.debuffs = [];

      // === 执行技能 ===
      await executePlayerCommand(caster, skill, target.id);

      // === 渲染 DOM ===
      renderPlayerUnits(); renderEnemyUnits();
      await new Promise(r2 => setTimeout(r2, 50));

      // === 获取 DOM 标签 ===
      const getTags = (id) => {
        const el = document.getElementById(id);
        return el
          ? [...el.querySelectorAll('.buff-tag, .debuff-tag')].map(e => e.textContent.trim())
          : [];
      };

      return {
        // 技能基本信息
        skillId:      skill.id,
        skillName:     skill.name,
        skillTarget:   skill.target,
        // 目标单位的直接属性
        targetFireShield:    target.fireShield,
        targetFireBodyEffect: target.fireBodyEffect,
        targetWallOfFlames:  target.wallOfFlamesPower,
        targetFlameCharge:    target.flameCharge,
        targetFlameChargeTurns: target.flameChargeTurns,
        // 目标单位的 buffs/debuffs 数组
        targetBuffs:   target.buffs.map(b => b.type),
        targetDebuffs: target.debuffs.map(d => d.type),
        // DOM 中的标签
        targetTags: getTags(target.id),
      };
    }, def);

    // === 验证 ===
    const checks = [];
    switch (r.skillId) {
      case 'ember':
        if (!r.targetDebuffs.includes('burn')) checks.push(`目标缺少灼烧 debuff`);
        break;
      case 'flare_blitz':
        if (!r.targetDebuffs.includes('burn_mark')) checks.push(`目标缺少灼伤印记 debuff`);
        break;
      case 'explosion_flame':
        // 多段命中每次叠加灼烧（爆炸烈焰有 alwaysBurn）
        if (!r.targetDebuffs.includes('combustion')) checks.push(`目标缺少燃尽 debuff`);
        break;
      case 'overheat':
        if (!r.targetDebuffs.includes('weakness')) checks.push(`目标缺少虚弱 debuff`);
        break;
      case 'fire_shield':
        if (!r.targetFireShield) checks.push(`目标缺少 fireShield 标志`);
        if (!r.targetTags.some(t => t.includes('火盾') || t.includes('反伤'))) {
          checks.push(`目标 DOM 缺少火盾标签，实际：[${r.targetTags.join(', ')}]`);
        }
        break;
      case 'wall_of_flames':
        if (!r.targetFireBodyEffect) checks.push(`目标缺少 fireBodyEffect 标志`);
        if (!r.targetWallOfFlames) checks.push(`目标缺少 wallOfFlamesPower 值`);
        if (!r.targetTags.some(t => t.includes('炎体') || t.includes('烈火'))) {
          checks.push(`目标 DOM 缺少炎体/烈火护体标签，实际：[${r.targetTags.join(', ')}]`);
        }
        break;
      case 'flame_charge':
        if (!r.targetFlameCharge) checks.push(`目标缺少 flameCharge 标志`);
        if (!r.targetFlameChargeTurns) checks.push(`目标缺少 flameChargeTurns`);
        if (!r.targetTags.some(t => t.includes('蓄焰'))) {
          checks.push(`目标 DOM 缺少蓄焰标签，实际：[${r.targetTags.join(', ')}]`);
        }
        break;
      case 'combustion':
        if (!r.targetDebuffs.includes('combustion')) checks.push(`目标缺少燃尽 debuff`);
        break;
      case 'blaze_will':
        if (!r.targetBuffs.includes('blaze_will')) checks.push(`目标缺少 blaze_will buff`);
        if (!r.targetTags.some(t => t.includes('炎意'))) {
          checks.push(`目标 DOM 缺少炎之意志标签，实际：[${r.targetTags.join(', ')}]`);
        }
        break;
    }

    if (checks.length === 0) {
      console.log(`[PASS] ${r.skillName} (${r.skillId})`);
      pass++;
    } else {
      console.log(`[FAIL] ${r.skillName} (${r.skillId})`);
      checks.forEach(c => console.log(`       ${c}`));
      fail++;
    }
  }

  console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);

  if (consoleErrors.length) {
    console.log('\n控制台错误:');
    consoleErrors.slice(0, 5).forEach(e => console.log('  ' + e));
  }

  await browser.close();
})();
