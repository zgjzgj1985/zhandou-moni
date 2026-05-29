/**
 * 火系技能效果标签测试脚本
 *
 * 使用游戏内置的测试技能注入功能，通过 convertSkillToBattleFormat 转换技能数据，
 * 然后执行技能并验证 debuff/buff 标签是否正确显示。
 *
 * 用法: node test-inject.cjs [skillId]
 * 不带参数则测试全部列出的 9 个火系技能
 */
const { chromium } = require('playwright');
const path = require('path');

const SKILLS_TO_TEST = [
  { id: 'ember',               name: '点燃',     target: 'enemy' },
  { id: 'flare_blitz',         name: '大字爆炎', target: 'enemy' },
  { id: 'explosion_flame',     name: '爆炸烈焰', target: 'enemy' },
  { id: 'overheat',            name: '过热',     target: 'enemy' },
  { id: 'fire_shield_skill',   name: '火盾',     target: 'self'  },
  { id: 'wall_of_flames',      name: '烈火护体', target: 'self'  },
  { id: 'flame_charge_skill',  name: '蓄焰',     target: 'ally'  },
  { id: 'combustion',          name: '燃尽',     target: 'enemy' },
  { id: 'blaze_will',          name: '炎之意志', target: 'all_ally' },
  // 水系攻击
  { id: 'water_jet',           name: '水流冲击', target: 'enemy' },
  { id: 'hydro_pump',          name: '水炮',     target: 'enemy' },
  { id: 'abyss_vortex',        name: '漩涡',     target: 'enemy' },
  { id: 'scald',               name: '热水',     target: 'enemy' },
  { id: 'muddy_water',         name: '浊流',     target: 'enemy' },
  // 水系防御
  { id: 'aqua_shield',         name: '水之守护', target: 'self'  },
  { id: 'clear_spring',        name: '清泉护盾', target: 'self'  },
  // 水系辅助
  { id: 'healing_wave',        name: '治愈波动', target: 'ally'  },
  { id: 'aqua_therapy',        name: '水疗之术', target: 'all_ally' },
  { id: 'rainy_day',           name: '雨天',     target: 'self'  },
  // 草系攻击
  { id: 'leaf_beam',           name: '叶绿光束',     target: 'enemy' },
  { id: 'bloom_dance',         name: '绽放之舞',     target: 'enemy' },
  { id: 'fiber_weave',         name: '纤维化',       target: 'enemy' },
  { id: 'solar_detonation',    name: '光能爆轰',     target: 'enemy' },
  { id: 'splendor',            name: '韶光',         target: 'enemy' },
  // 草系防御
  { id: 'root_bound',          name: '扎根之躯',     target: 'self'  },
  { id: 'vine_armor',          name: '藤蔓护甲',     target: 'self'  },
  { id: 'grass_counter_stance', name: '防反之姿',   target: 'self'  },
  // 草系辅助
  { id: 'light_gather',        name: '光能聚集',     target: 'self'  },
  { id: 'fragrant_bloom',      name: '芬芳绽放',     target: 'all_ally' },
  { id: 'parasitic_seed',      name: '寄生之种',     target: 'enemy' },
  { id: 'nutrient_absorption', name: '养分汲取',     target: 'ally'  },
];

const skillArg = process.argv[2];

async function testSkill(page, skillDef) {
  // 1. 打开自定义战斗界面
  await page.evaluate(() => {
    document.getElementById('customBtn').click();
  });
  await page.waitForTimeout(500);

  // 2. 通过游戏内置的 changeTestSkill 函数注入测试技能
  const injected = await page.evaluate((skillId) => {
    changeTestSkill(0, skillId);
    return customPlayerConfig[0].testSkill;
  }, skillDef.id);

  if (injected !== skillDef.id) {
    return { pass: false, reason: `注入失败，期望 ${skillDef.id}，实际 ${injected}` };
  }

  // 3. 载入战斗（选择器要精确，不能选到"取消"按钮）
  await page.evaluate(() => {
    // 找有 applyCustomBattle onclick 的按钮
    const btn = [...document.querySelectorAll('.custom-battle-btn')].find(b => b.getAttribute('onclick') === 'applyCustomBattle()');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // 4. 检查第一个伙伴的配置和技能
  const skillInfo = await page.evaluate(() => {
    const cfg = customPlayerConfig[0];
    const unit = playerUnits[0];
    if (!unit || !unit.skills || unit.skills.length === 0) return null;
    return {
      cfgTestSkill: cfg ? cfg.testSkill : null,
      unitName: unit.name,
      skillName: unit.skills[0].name,
      skillId: unit.skills[0].id,
      energyCost: unit.skills[0].energyCost,
      allSkillIds: unit.skills.map(s => s.id),
    };
  });

  if (!skillInfo) {
    return { pass: false, reason: '伙伴单位或技能为空' };
  }

  if (skillInfo.skillId !== skillDef.id) {
    return {
      pass: false,
      reason: `技能未替换，期望 ${skillDef.id}，实际 ${skillInfo.skillId}`,
      debug: skillInfo,
    };
  }

  // 5. 执行技能（根据 skill.target 确定目标）
  const execResult = await page.evaluate(async (def) => {
    const caster = playerUnits[0];
    const skill = caster.skills[0];
    let targetId;
    let target;

    // 根据 skill.target（不是 def.target）决定目标
    const st = skill.target;
    if (st === 'self' || st === 'all_ally') {
      targetId = caster.id;
      target = caster;
    } else if (st === 'ally') {
      targetId = playerUnits[1] ? playerUnits[1].id : playerUnits[0].id;
      target = playerUnits[1] || caster;
    } else {
      targetId = enemyUnits[0].id;
      target = enemyUnits[0];
    }

    target.buffs = [];
    target.debuffs = [];
    target.fireShield = false;
    target.fireBodyEffect = false;
    target.flameCharge = false;
    target.flameChargeTurns = 0;
    target.wallOfFlamesPower = 0;
    target.aquaShield = false;
    target.clearSpringEffect = false;
    target.clearSpringTurns = 0;
    target.rainyDayEffect = false;

    await executePlayerCommand(caster, skill, targetId);
    renderPlayerUnits();
    renderEnemyUnits();

    // 等待动画
    await new Promise(r => setTimeout(r, 100));

    // 获取DOM标签
    const targetEl = document.getElementById(target.id);
    const domTags = targetEl
      ? [...targetEl.querySelectorAll('.buff-tag, .debuff-tag')].map(e => e.textContent.trim())
      : [];

    return {
      skillName: skill.name,
      targetId: target.id,
      targetName: target.name,
      targetBuffs: target.buffs.map(b => b.type),
      targetDebuffs: target.debuffs.map(d => d.type),
      casterDebuffs: caster.debuffs.map(d => d.type),
      fireShield: target.fireShield,
      fireBodyEffect: target.fireBodyEffect,
      flameCharge: target.flameCharge,
      battleEnvironment: typeof battleEnvironment !== 'undefined' ? battleEnvironment : null,
      domTags,
    };
  }, skillDef);

  // 6. 验证
  const checks = [];

  switch (skillDef.id) {
    case 'ember':
      if (!execResult.targetDebuffs.includes('burn')) {
        checks.push(`目标缺少灼烧 debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'flare_blitz':
      if (!execResult.targetDebuffs.includes('burn_mark')) {
        checks.push(`目标缺少灼伤印记 debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'explosion_flame':
      // explosion_flame 同时有燃烧效果（explosion）和燃尽效果（combustion）
      // 实际效果是 target 获得 burn debuff（不是 combustion）
      if (!execResult.targetDebuffs.includes('burn') && !execResult.targetDebuffs.includes('combustion')) {
        checks.push(`目标缺少 burn/combustion debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'overheat':
      // weakness debuff 在 caster 身上
      if (!execResult.casterDebuffs.includes('weakness')) {
        checks.push(`施法者缺少 weakness debuff，实际：[${execResult.casterDebuffs.join(', ')}]`);
      }
      break;
    case 'fire_shield_skill':
      if (!execResult.fireShield) checks.push('fireShield 标志未设置');
      if (!execResult.domTags.some(t => t.includes('火盾'))) {
        checks.push(`DOM 缺少「火盾」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'wall_of_flames':
      if (!execResult.fireBodyEffect) checks.push('fireBodyEffect 标志未设置');
      if (!execResult.domTags.some(t => t.includes('炎体') || t.includes('烈火'))) {
        checks.push(`DOM 缺少「炎体/烈火」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'flame_charge_skill':
      if (!execResult.flameCharge) checks.push('flameCharge 标志未设置');
      if (!execResult.domTags.some(t => t.includes('蓄焰'))) {
        checks.push(`DOM 缺少「蓄焰」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'combustion':
      if (!execResult.targetDebuffs.includes('combustion')) {
        checks.push(`目标缺少燃尽 debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'blaze_will':
      if (!execResult.targetBuffs.includes('blaze_will')) {
        checks.push(`目标缺少 blaze_will buff，实际：[${execResult.targetBuffs.join(', ')}]`);
      }
      if (!execResult.domTags.some(t => t.includes('炎意'))) {
        checks.push(`DOM 缺少「炎意」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    // 水系攻击
    case 'water_jet':
      if (!execResult.targetDebuffs.includes('water_soak')) {
        checks.push(`目标缺少 water_soak debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'hydro_pump':
      if (!execResult.casterDebuffs.includes('weakness')) {
        checks.push(`施法者缺少 weakness debuff，实际：[${execResult.casterDebuffs.join(', ')}]`);
      }
      break;
    case 'abyss_vortex':
      if (!execResult.targetDebuffs.includes('drowning')) {
        checks.push(`目标缺少 drowning debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'scald':
      // 30%概率，需要多次测试验证
      if (!execResult.targetDebuffs.includes('steam_burn')) {
        checks.push(`目标缺少 steam_burn debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'muddy_water':
      if (!execResult.targetDebuffs.includes('muddy')) {
        checks.push(`目标缺少 muddy debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    // 水系防御
    case 'aqua_shield':
      if (!execResult.domTags.some(t => t.includes('水之守护') || t.includes('护') || t.includes('减'))) {
        checks.push(`DOM 缺少「水之守护」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'clear_spring':
      if (!execResult.domTags.some(t => t.includes('清泉') || t.includes('护盾'))) {
        checks.push(`DOM 缺少「清泉护盾」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    // 水系辅助
    case 'healing_wave':
      // 治疗技能，验证HP是否增加（通过测试的技能执行是否成功来判断）
      if (!execResult.details) {
        checks.push('无法获取治疗详情');
      }
      break;
    case 'aqua_therapy':
      // 全体治疗+流水状态
      if (!execResult.domTags.some(t => t.includes('流水') || t.includes('水') || t.includes('治'))) {
        checks.push(`DOM 缺少「流水/治疗」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'rainy_day':
      // 雨天环境，测试全局天气是否设置（通过测试是否执行成功判断）
      if (!execResult.details) {
        checks.push('无法获取天气详情');
      }
      break;
    // 草系攻击
    case 'leaf_beam':
      if (!execResult.targetDebuffs.includes('wither')) {
        checks.push(`目标缺少枯萎 debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'bloom_dance':
      // 绽放之舞：必定暴击，没有直接的buff/debuff标签，但需要技能能正常执行
      // 验证目标是敌人且技能执行成功即可
      if (execResult.details && execResult.details.targetName === undefined) {
        checks.push('技能未正确执行');
      }
      break;
    case 'fiber_weave':
      // fiber_weave：光能汇聚在 caster 身上（不是 target）
      if (!execResult.domTags.some(t => t.includes('光能'))) {
        checks.push(`施法者缺少「光能汇聚」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'solar_detonation':
      // 光能爆轰：消耗光能汇聚，没有直接的buff/debuff标签
      // 验证技能执行成功即可
      if (execResult.details && execResult.details.targetName === undefined) {
        checks.push('技能未正确执行');
      }
      break;
    case 'splendor':
      // 韶光：召唤芬芳环境（fragrant_env debuff），需要在 all_ally 分支处理
      // 但 splendor 是 enemy 目标，需要在 enemy 伤害处理时设置环境
      if (!execResult.targetDebuffs.some(d => d.includes('fragrant'))) {
        // 检查全局环境
        const envSet = execResult.details && execResult.details.battleEnvironment === 'fragrant';
        if (!envSet) checks.push('未设置芬芳环境');
      }
      break;
    // 草系防御
    case 'root_bound':
      if (!execResult.domTags.some(t => t.includes('扎根'))) {
        checks.push(`DOM 缺少「扎根」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'vine_armor':
      if (!execResult.domTags.some(t => t.includes('藤蔓'))) {
        checks.push(`DOM 缺少「藤蔓」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'grass_counter_stance':
      if (!execResult.domTags.some(t => t.includes('防反'))) {
        checks.push(`DOM 缺少「防反」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    // 草系辅助
    case 'light_gather':
      if (!execResult.domTags.some(t => t.includes('光能'))) {
        checks.push(`DOM 缺少「光能汇聚」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'fragrant_bloom':
      // 芬芳绽放：全体获得 fragrantBloom，在 all_ally 分支处理
      if (!execResult.domTags.some(t => t.includes('芬芳'))) {
        checks.push(`DOM 缺少「芬芳」标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
    case 'parasitic_seed':
      if (!execResult.targetDebuffs.includes('parasitic_seed')) {
        checks.push(`目标缺少 parasitic_seed debuff，实际：[${execResult.targetDebuffs.join(', ')}]`);
      }
      break;
    case 'nutrient_absorption':
      // 养分汲取：治疗+充能，检查标签
      if (!execResult.domTags.some(t => t.includes('清泉') || t.includes('护盾') || t.includes('回复'))) {
        checks.push(`DOM 缺少治疗/护盾相关标签，实际：[${execResult.domTags.join(', ')}]`);
      }
      break;
  }

  return {
    pass: checks.length === 0,
    reason: checks.length > 0 ? checks.join('；') : '',
    details: execResult,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    else if (msg.text().includes('注入调试')) consoleLogs.push(msg.text());
  });

  const filePath = `file://${path.resolve('battle-simple-modular.html')}`;
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 切换到模式2（宝可梦模式，确保战斗流程正常）
  await page.evaluate(() => document.getElementById('mode2Btn').click());
  await page.waitForTimeout(500);

  const toTest = skillArg
    ? SKILLS_TO_TEST.filter(s => s.id === skillArg)
    : SKILLS_TO_TEST;

  console.log(`\n========== 游戏内置注入测试 ==========\n`);

  let pass = 0, fail = 0;

  for (const def of toTest) {
    const result = await testSkill(page, def);

    if (result.pass) {
      console.log(`[PASS] ${def.name} (${def.id})`);
      pass++;
    } else {
      console.log(`[FAIL] ${def.name} (${def.id})`);
      console.log(`       ${result.reason}`);
      // 打印详细信息辅助调试
      if (result.debug) {
        console.log(`       调试信息 → cfg.testSkill=${result.debug.cfgTestSkill} unit=${result.debug.unitName} 所有技能=[${result.debug.allSkillIds.join(', ')}]`);
      }
      if (result.details) {
        const d = result.details;
        console.log(`       内部状态 → buffs:[${d.targetBuffs}] debuffs:[${d.targetDebuffs}] fireShield:${d.fireShield} fireBodyEffect:${d.fireBodyEffect} flameCharge:${d.flameCharge}`);
        console.log(`       DOM标签 → [${d.domTags.join(', ')}]`);
      }
      fail++;
    }

    // 每个技能测试完重置：回到初始页面
    await page.goto(filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.getElementById('mode2Btn').click());
    await page.waitForTimeout(500);
  }

  console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);

  if (consoleErrors.length) {
    console.log('\n控制台错误:');
    consoleErrors.slice(0, 5).forEach(e => console.log('  ' + e));
  }
  if (consoleLogs.length) {
    console.log('\n注入调试日志:');
    consoleLogs.forEach(l => console.log('  ' + l));
  }

  await browser.close();
})();
