# 循迹之境 - 战斗模拟系统

> 一个精致的回合制战斗模拟游戏，包含多种战斗模式、属性系统和策略深度。

![版本](https://img.shields.io/badge/version-1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Vitest](https://img.shields.io/badge/Vitest-1.6-green)

## 项目简介

循迹之境是一个回合制战斗模拟系统，支持多种战斗模式和丰富的技能系统。玩家可以组建队伍、使用各种技能、与AI敌人进行策略对抗。

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（文件变更时自动运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 启动游戏

直接在浏览器中打开 `battle-simple-modular.html` 文件即可开始游戏。

## 项目结构

```
战斗模拟/
├── battle-simple-modular.html  # 主游戏入口
├── skill-book.html             # 技能图鉴
├── css/
│   └── battle.css              # 战斗界面样式
├── js/                         # JavaScript 模块
│   ├── 00-constants.js         # 常量定义
│   ├── 00-state.js             # 状态管理
│   ├── 01-data.js              # 游戏数据
│   ├── 02-status-system.js     # 状态效果系统
│   ├── 03-skill-effects.js     # 技能效果定义
│   ├── 04-utils.js             # 工具函数
│   ├── 05-renderer.js          # 渲染器
│   ├── 06-skill-panel.js       # 技能面板
│   ├── 07-mode-system.js       # 战斗模式系统
│   ├── 08-battle-engine.js     # 战斗引擎
│   ├── 09-enemy-ai.js          # 敌人AI
│   ├── 10-events.js            # 事件系统
│   ├── 11-init.js              # 初始化
│   └── 12-skill-execution.js   # 技能执行
├── src/                        # TypeScript 源码
│   ├── battle/                 # 战斗系统核心
│   │   ├── BattleManager.ts    # 战斗管理器
│   │   ├── CombatUnit.ts       # 战斗单位基类
│   │   ├── PlayerUnit.ts       # 玩家单位
│   │   └── EnemyUnit.ts        # 敌人单位
│   ├── skills/                 # 技能系统
│   │   ├── Skill.ts            # 技能基类
│   │   ├── fire.ts             # 火属性技能
│   │   ├── water.ts           # 水属性技能
│   │   ├── grass.ts           # 草属性技能
│   │   ├── electric.ts         # 电属性技能
│   │   ├── ice.ts              # 冰属性技能
│   │   ├── ground.ts           # 地属性技能
│   │   ├── psychic.ts          # 超能属性技能
│   │   └── dragon.ts           # 龙属性技能
│   ├── effects/                # 效果系统
│   │   ├── StatusEffect.ts     # 状态效果基类
│   │   ├── buffs/              # Buff效果
│   │   └── debuffs/            # Debuff效果
│   ├── units/                  # 单位定义
│   ├── items/                  # 道具系统
│   └── types/                  # 类型定义
├── docs/                       # 设计文档
│   ├── SKILLS_SPECIFICATION.md # 技能系统规范
│   └── *属性*技能设计.md        # 各属性技能设计
└── package.json
```

## 核心系统

### 战斗模式

| 模式 | 描述 |
|------|------|
| 经典模式 | 传统回合制战斗 |
| 宝可梦模式 | 宝可梦风格的技能与属性系统 |
| 以太术士模式 | 特殊职业战斗系统 |

### 属性系统

游戏包含 8 种属性，每种属性有独特的战斗风格：

| 属性 | 英文 | 定位 | 核心机制 |
|------|------|------|----------|
| 火 | FIRE | 爆发流 | 高伤害、灼烧DOT |
| 水 | WATER | 控制流 | 治疗、护盾、软解 |
| 草 | GRASS | 光环流 | 层数叠加、持续增益 |
| 电 | ELECTRIC | 多段伤害流 | 特性系统、多段攻击、雷暴环境 |
| 冰 | ICE | 冰霜蓄力流 | 冻结控制、冰霜叠加 |
| 地 | GROUND | 天气流 | 沙暴天气、挖洞免疫 |
| 超能 | PSYCHIC | 奥秘流 | 心理博弈、延迟触发 |
| 龙 | DRAGON | 中速流 | 攻防兼备 |

### 属性克制表

```
攻击\防御  火   水   草   电   冰   地   龙   超能
火         0.5  0.5  2    1    2    0.5  1    1
水         2    0.5  0.5  0.5  1    2    1    1
草         0.5  2    0.5  1    1    2    1    1
电         1    2    0.5  0.5  1    0    1    1
冰         0.5  0.5  2    1    0.5  2    2    1
地         2    1    0.5  2    2    1    1    1
龙         1    1    1    1    1    1    2    1
超能       1    1    1    1    1    1    0    0.5
```

### Buff/Debuff 系统

- **Buff**：增益效果，如攻击强化、护盾、治疗
- **Debuff**：减益效果，如灼烧、冰霜、减速

### 天气系统

| 天气 | 效果 | 代表技能 |
|------|------|----------|
| 沙暴 | 非岩/地/钢系每回合受损 | 沙暴降临 |
| 雨天 | 水属性技能增强 | - |
| 晴天 | 火属性技能增强 | - |
| 冰雹 | 非冰系每回合受损 | - |

## 伤害计算

### 基础公式

```
伤害 = floor((level * 2 / 5 + 2) * power * attack / defense / 50) + 2
```

### 能力等级倍率

| 等级 | 倍率 |
|------|------|
| -6 | 0.5 |
| -3 | 0.67 |
| 0 | 1.0 |
| +3 | 1.75 |
| +6 | 2.5 |

## 开发指南

### 添加新技能

1. 在对应的属性文件中添加技能定义
2. 使用 `SkillDefinition` 接口定义技能结构
3. 在技能库导出对象的 `ALL` 数组中注册

### 添加新效果

1. 在 `src/effects/` 目录下创建新的效果类
2. 继承 `Buff` 或 `Debuff` 基类
3. 实现相应的生命周期方法

### 运行演示

```bash
# 运行 BattleDemo
npx vitest run src/battle/BattleDemo.ts
```

## 技术栈

- **语言**: TypeScript, JavaScript (ES6+)
- **测试**: Vitest
- **E2E测试**: Playwright
- **构建**: 原生浏览器（无需构建工具）

## 文档

更多详细设计文档位于 `docs/` 目录：

- [技能系统开发规范](./docs/SKILLS_SPECIFICATION.md)
- [火属性爆发流技能设计](./docs/火属性爆发流技能设计.md)
- [水属性控制流技能设计](./docs/水属性控制流技能设计.md)
- [冰属性减速流技能设计](./docs/冰属性减速流技能设计.md)
- [地属性天气流技能设计](./docs/地属性天气流技能设计.md)
- [生物系统设计说明](./docs/生物系统设计说明.md)

## License

MIT License
