# 战斗模拟系统测试指南

本文档介绍如何使用游戏内置注入功能 + Playwright 脚本验证技能效果。

## 目录

1. [测试方式概览](#测试方式概览)
2. [游戏内置注入测试](#游戏内置注入测试)
3. [Playwright 自动化测试](#playwright-自动化测试)
4. [技能效果与标签对照表](#技能效果与标签对照表)
5. [测试覆盖清单](#测试覆盖清单)
6. [已知问题与调试方法](#已知问题与调试方法)

---

## 测试方式概览

| 方式 | 用途 | 脚本 |
|------|------|------|
| **游戏内置** | 快速手动验证标签显示 | 无需脚本，直接操作 UI |
| **Playwright 脚本** | 批量验证、回归测试 | `test-inject.cjs` |

> **注**：`test-fire-skills.cjs`（旧脚本）因目标判断逻辑 bug（对所有技能都用 enemy 作为目标）会导致误报，已废弃，不再使用。

---

## 游戏内置注入测试

适合快速手动验证，无需运行脚本。

### 使用方法

1. 在浏览器打开 `battle-simple-modular.html`
2. 点击"**自定义战斗**"按钮
3. 第一个伙伴（标记 🔬）旁出现紫色的"**测试技能**"下拉框
4. 选择要测试的技能（如"火盾"）
5. 点击"**载入战斗**"进入战斗
6. 查看该伙伴技能面板——第1个技能已被替换为测试技能
7. 对敌人使用该技能，观察单位卡片是否出现预期标签

### 原理

```
自定义界面选择技能 → customPlayerConfig[0].testSkill = "fire_shield_skill"
        ↓
openCustomBattleEditor() → applyCustomBattle()
        ↓
initializeCompanionSkills() → 检测到 testSkill
        ↓
在 SKILLS_DB 中查找原始技能定义
        ↓
convertSkillToBattleFormat() → 转换为战斗格式
        ↓
替换 playerUnits[0].skills[0]
        ↓
战斗中使用 → 技能执行 → DOM 标签渲染
```

### 添加新测试技能

在 `js/07-mode-system.js` 的 `renderPlayerList` 中，找到 `test-skill-select` 的 `<select>` 标签，添加新选项：

```html
<optgroup label="火系防御">
  <option value="fire_shield_skill">火盾</option>
  <!-- 新技能在此添加 -->
</optgroup>
```

---

## Playwright 自动化测试

适用于批量验证或验证内置测试本身是否存在问题。

### 依赖

```bash
npm install
npx playwright install chromium
```

> **注意**：项目使用 ES 模块（`"type": "module"`），测试脚本必须使用 `.cjs` 后缀。

### 运行测试

```bash
# 测试全部技能（包括火系、水系、草系等）
node test-inject.cjs

# 测试单个技能
node test-inject.cjs blaze_will

# 输出示例：
# ========== 游戏内置注入测试 ==========
# [PASS] 点燃 (ember)
# [PASS] 大字爆炎 (flare_blitz)
# [PASS] 爆炸烈焰 (explosion_flame)
# [PASS] 过热 (overheat)
# [PASS] 火盾 (fire_shield_skill)
# [PASS] 烈火护体 (wall_of_flames)
# [PASS] 蓄焰 (flame_charge_skill)
# [PASS] 燃尽 (combustion)
# [PASS] 炎之意志 (blaze_will)
# [PASS] 水流冲击 (water_jet)
# [PASS] 水炮 (hydro_pump)
# [PASS] 漩涡 (abyss_vortex)
# [PASS] 热水 (scald)
# [PASS] 浊流 (muddy_water)
# [PASS] 水之守护 (aqua_shield)
# [PASS] 清泉护盾 (clear_spring)
# [PASS] 治愈波动 (healing_wave)
# [PASS] 水疗之术 (aqua_therapy)
# [PASS] 雨天 (rainy_day)
# ...（草系技能略）
# ========== 结果: 31 通过, 0 失败 ==========
```

### 测试脚本核心逻辑

`test-inject.cjs` 内部流程：

```
1. page.evaluate(() => changeTestSkill(0, skillId))
   → 设置 customPlayerConfig[0].testSkill

2. page.evaluate(() => applyCustomBattle())
   → 载入战斗，技能自动注入到 playerUnits[0].skills[0]

3. page.evaluate(async (def) => {
     const caster = playerUnits[0];
     const skill = caster.skills[0];        // 已注入的技能
     const st = skill.target;               // 使用转换后的 skill.target
     if (st === 'self' || st === 'all_ally') target = caster;
     else if (st === 'ally') target = playerUnits[1] || caster;
     else target = enemyUnits[0];

     await executePlayerCommand(caster, skill, target.id);
     renderPlayerUnits(); renderEnemyUnits();

     return {
       targetDebuffs: target.debuffs.map(d => d.type),
       casterDebuffs: caster.debuffs.map(d => d.type),
       fireShield: target.fireShield,
       domTags: [...target.querySelectorAll('.buff-tag,.debuff-tag')]
     };
   })

4. 断言验证
```

**关键**：目标选择使用 `skill.target`（转换后的值），不是 `def.target`（原始数据）。因为 `convertSkillToBattleFormat` 会将 `'单体敌人'`、``'single_enemy'` 等多种写法统一为 `'single_enemy'`。

---

## 技能效果与标签对照表

### 火系技能

| 技能 ID | 技能名 | 效果描述 | 标签显示 | 状态所在 |
|---------|--------|---------|---------|---------|
| `ember` | 点燃 | 5层灼烧 | `灼烧5层` | `target.debuffs[burn]` |
| `flame_punch` | 烈焰拳 | 50%概率2层灼烧 | `灼烧2层` | `target.debuffs[burn]` |
| `flare_blitz` | 大字爆炎 | 灼伤印记 | `灼伤印记` | `target.debuffs[burn_mark]` |
| `explosion_flame` | 爆炸烈焰 | 燃烧（3回合后扣30%HP） | `燃尽3回合` | `target.debuffs[combustion]` |
| `overheat` | 过热 | 施法者虚弱2回合 | `虚弱2回合` | `caster.debuffs[weakness]` |
| `fire_shield_skill` | 火盾 | 受伤降低30%并反伤灼烧 | `火盾` | `unit.fireShield = true` |
| `wall_of_flames` | 烈火护体 | 下次火攻+40威力 | `烈火40` | `unit.wallOfFlamesPower > 0` |
| `flame_charge_skill` | 蓄焰 | 下次火攻+(能量×10)威力 | `蓄焰3回合` | `unit.flameCharge = true` |
| `combustion` | 燃尽 | 3回合后扣30%HP | `燃尽3回合` | `target.debuffs[combustion]` |
| `blaze_will` | 炎之意志 | 攻击+1、特攻+1、火伤+25% | `炎意3回合` | `target.buffs[blaze_will]` |

### 水系技能

| 技能 ID | 技能名 | 效果描述 | 标签显示 | 状态所在 |
|---------|--------|---------|---------|---------|
| `water_jet` | 水流冲击 | 特防-1级/层浸透 | `浸透2回合` | `target.debuffs[water_soak]` |
| `hydro_pump` | 水炮 | 施法者虚弱2回合 | `虚弱2回合` | `caster.debuffs[weakness]` |
| `abyss_vortex` | 漩涡 | 溺水状态 | `溺水3回合` | `target.debuffs[drowning]` |
| `scald` | 热水 | 30%概率蒸汽灼伤 | `蒸汽灼伤` | `target.debuffs[steam_burn]` |
| `muddy_water` | 浊流 | 命中率-1级/层浑浊 | `浑浊1层` | `target.debuffs[muddy]` |
| `aqua_shield` | 水之守护 | 减伤70%，被攻击时反击者获得浸透 | `水之守护` | `unit.buffs[aqua_shield]` |
| `clear_spring` | 清泉护盾 | 每回合回复10%HP并清除1个负面状态 | `清泉3回合` | `unit.buffs[clear_spring]` |
| `healing_wave` | 治愈波动 | 治疗目标25%HP | `回复25%` | HP增加验证 |
| `aqua_therapy` | 水疗之术 | 治疗全体15%HP + 速度+1级 | `流水2回合` | `unit.buffs[flow]` |
| `rainy_day` | 雨天 | 创造雨天环境（持续3回合） | 天气设置 | `battleEnvironment === 'rainy'` |

### 草系技能

| 技能 ID | 技能名 | 效果描述 | 标签显示 | 状态所在 |
|---------|--------|---------|---------|---------|
| `leaf_beam` | 叶绿光束 | 80威力+枯萎1层 | `枯萎` | `target.debuffs[wither]` |
| `bloom_dance` | 绽放之舞 | 90威力+必定暴击 | 无特定标签 | 技能正常执行 |
| `fiber_weave` | 纤维化 | 40威力+光能汇聚1层 | `光能×1` | `caster.lightGatherStacks` |
| `solar_detonation` | 光能爆轰 | 消耗光能+威力100+60×层 | 无特定标签 | 技能正常执行 |
| `splendor` | 韶光 | 140威力+芬芳环境 | `芬芳` | `battleEnvironment='fragrant'` |
| `root_bound` | 扎根之躯 | 每回合回复8%HP+速度-1 | `扎根` | `unit.rootBound = true` |
| `vine_armor` | 藤蔓护甲 | 减伤50%+缠绕攻击者 | `藤蔓` | `unit.entangleOnHit = true` |
| `grass_counter_stance` | 防反之姿 | 反弹60%伤害+先手 | `防反` | `unit.counterStance = true` |
| `light_gather` | 光能聚集 | 光能汇聚1层 | `光能×1` | `caster.lightGatherStacks` |
| `fragrant_bloom` | 芬芳绽放 | 芬芳环境+草伤+25% | `芬芳` | `unit.fragrantBloom = true` |
| `parasitic_seed` | 寄生之种 | 每回合6%HP流失+施法者回复 | `寄生种子` | `target.debuffs[parasitic_seed]` |
| `nutrient_absorption` | 养分汲取 | 回复20%HP+4点能量 | `回复20%` | `target.buffs[heal_buff]` |

### 三层测试模型

```
skills-db.js (原始技能定义)
        ↓
js/03-skill-effects.js (convertSkillToBattleFormat)
        ↓
js/12-skill-execution.js (executePlayerCommand)
        ↓
js/05-renderer.js (renderPlayerUnits / renderEnemyUnits)
        ↓
DOM 标签显示
```

每一层都可能出错，测试必须覆盖完整链路。

### 关键模块职责

| 文件 | 职责 |
|------|------|
| `js/02-status-system.js` | `STATUS_EFFECT_MAP`（状态 ID → 执行字段映射） |
| `js/03-skill-effects.js` | `convertSkillToBattleFormat`（技能数据转换）<br>`parseSingleEffect`（解析单个效果）<br>`applyAddStatusEffect`（解析 add_status 效果） |
| `js/05-renderer.js` | 渲染 Buff/Debuff 标签到 DOM |
| `js/07-mode-system.js` | 测试技能注入入口（`changeTestSkill`、`renderPlayerList`） |
| `js/12-skill-execution.js` | `executePlayerCommand`（技能执行逻辑） |

---

## 已知问题与调试方法

### 问题 1：技能转换后执行字段为 `false/undefined`

**排查路径**：

1. 检查 `skills-db.js` 中该技能的 `effects` 数组，`statusId` 是否拼写正确
2. 检查 `js/02-status-system.js` 的 `STATUS_EFFECT_MAP` 是否有该 `statusId` 的条目
3. 检查 `applyAddStatusEffect` 的 switch 语句（处理 `combustion_mark`、`burn_mark` 等未注册状态）
4. 检查 `convertSkillToBattleFormat` 的 `Object.assign` 列表和后续赋值语句是否包含该字段

**常见原因**：

- `STATUS_EFFECT_MAP` 中缺少该 `statusId`
- `applyAddStatusEffect` 返回 `{}` 时，`parseSingleEffect` 的兜底逻辑 `result.effect = effect.statusId` 覆盖了正确值

### 问题 2：执行层 `effect === 'xxx'` 条件不匹配

**原因 1**：`skills-db.js` 的 `statusId` 是 snake_case（如 `'burn_mark'`），但 `STATUS_EFFECT_MAP` 中 `effect` 字段是 camelCase（如 `'burnMark'`）。`Object.assign` 覆盖后，handler 找不到。

**排查**：在浏览器控制台直接打印 `skill.effect` 值：

```javascript
// 在 test-inject.cjs 的调试块中
console.log('skill.effect:', skill.effect);
```

**解决**：确保 `STATUS_EFFECT_MAP` 中的 `effect` 值与执行层 handler 检查的字符串一致（使用 underscore 命名）。

**原因 2**：`skills-db.js` 的 `statusId` 与执行层 handler 检查的 `effect` 值名称不匹配。例如 `aqua_shield` 技能用 `statusId: 'defense_up'` 但执行层检查 `'water_guard'`。

**排查**：打印 skill 的所有属性，找到 `effect` 的实际值，然后与 handler 中的 `===` 检查比较。

**原因 3**：handler 在错误的分支中（如 `ally` 分支而非 `self` 分支）。`aqua_shield` 是 `self` 目标但 handler 只在 `ally` 分支中。

### 问题 3：治疗技能不生效（healPercent 值太小）

**原因**：`skills-db.js` 中 `percent` 使用小数表示（如 `0.0025` 表示 0.25%，`0.0015` 表示 0.15%）。`parseSingleEffect` 中 `heal` 分支直接使用此值，导致治疗量极小。

**解决**：在 `js/03-skill-effects.js` 的 `case 'heal':` 中，将 `percent` 乘以 100：

```javascript
result.healPercent = (effect.percent || 0) * 100;
// 结果 0.25 表示治疗 25% HP
```

### 问题 4：虚弱、灼伤印记等 debuff 在错误的单位上

**原因**：不同技能的效果生效位置不同

- `overheat` 的 `weakness` → 在 `caster`（施法者）身上
- `flame_charge` 的 `flameCharge` → 在 `target`（目标）身上
- `blaze_will` 的 `blaze_will` → 在 `target`（目标）身上

**解决**：测试断言必须根据 `skill.target` 和效果类型确定检查哪个单位

### 问题 4：`buffs[]` / `debuffs[]` 有数据但 DOM 不显示标签

**排查路径**：

1. 检查 `renderPlayerUnits` 中对应的 `forEach` 或 `if` 判断条件
2. 确认渲染时 `unit` 对象引用是否正确（可能被替换了）
3. 检查 CSS 是否有 `.buff-tag { display: none }` 等样式

### 问题 5：按钮点击没反应

**原因**：Playwright `page.click()` 在元素被重新渲染后会失去引用

**解决**：使用 JavaScript 直接调用：

```javascript
// ❌ Playwright 点击（DOM 重绘后失效）
await page.click('.custom-battle-btn');

// ✅ JavaScript 直接调用（稳定）
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.custom-battle-btn')]
    .find(b => b.getAttribute('onclick') === 'applyCustomBattle()');
  if (btn) btn.click();
});
```

### 问题 6：`executePlayerCommand` 是 async 但没有 await

**症状**：技能执行了但状态还没更新，测试就检查了结果

**解决**：确保 `await executePlayerCommand(caster, skill, targetId)` 被正确 await。

### 问题 7：技能分配随机变化

**原因**：`assignSkillsByElement` 使用 `shuffleArray` 打乱技能池

**解决**：通过 `customPlayerConfig[0].testSkill` 注入固定技能，测试始终替换 `skills[0]`，不受随机分配影响
