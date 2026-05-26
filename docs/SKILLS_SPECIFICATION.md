# 循迹之境 - 技能系统开发规范

> 本文档是技能系统代码的开发规范和约定，用于指导后续技能开发工作。

---

## 一、系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      技能系统 (Skills)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Skill.ts    │  │ SkillEffect │  │ 各属性技能库         │ │
│  │ 技能基类    │  │ 效果定义    │  │ fire.ts, ice.ts...  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      效果系统 (Effects)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Buff.ts     │  │ Debuff.ts   │  │ StatusEffect.ts     │ │
│  │ 增益效果    │  │ 减益效果    │  │ 状态效果基类        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      战斗系统 (Battle)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │BattleManager│  │CombatUnit   │  │ 伤害计算            │ │
│  │ 战斗管理器  │  │ 战斗单位    │  │ calculateDamage()   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技能属性分类

| 属性 | 英文 | 核心流派 | 定位 |
|------|------|----------|------|
| 火 | FIRE | 爆发流 | 高伤害、灼烧DOT |
| 水 | WATER | 控制流 | 治疗、护盾、软解 |
| 草 | GRASS | 光环流 | 层数叠加、持续增益 |
| 电 | ELECTRIC | 连击流 | 多段攻击、高速度 |
| 冰 | ICE | 冰霜蓄力流 | 冻结控制、冰霜叠加 |
| 岩 | ROCK | 防御流 | 高防御、减伤反击 |
| 超能 | PSYCHIC | 奥秘流 | 心理博弈、延迟触发 |
| 龙 | DRAGON | 中速流 | 攻防兼备 |

---

## 二、技能定义规范

### 2.1 技能文件结构

每个属性技能库应放在 `src/skills/` 目录下，文件命名规范：
- `fire.ts` - 火属性
- `ice.ts` - 冰属性
- `water.ts` - 水属性
- `grass.ts` - 草属性
- `electric.ts` - 电属性
- `rock.ts` - 岩石属性
- `psychic.ts` - 超能属性
- `dragon.ts` - 龙属性

### 2.2 技能代码模板

```typescript
/**
 * 【倾向】技能名称
 * 技能ID: skill_id
 * 能量消耗: N
 * 目标类型: 单体敌人/自身/己方单体等
 * 技能威力: XX
 * 特效: 描述特效
 *
 * 效果描述：详细描述技能效果
 */
export const SKILL_NAME: Skill = (() => {
  const definition: SkillDefinition = {
    id: 'skill_id',
    name: '技能名称',
    description: '效果描述',
    type: 'action',
    energyCost: N,
    target: SkillTarget.SINGLE,
    tendency: SkillTendency.ATTACK,
    effects: [{
      // 伤害效果
      damage: {
        basePower: 50,
        damageType: DamageType.SPECIAL,
        element: ElementType.FIRE
      },
      // 或 Debuff 效果
      applyDebuff: {
        debuffType: 'burn',
        duration: 3,
        stacks: 2,
        successRate: 0.5
      },
      // 或 Buff 效果
      applyBuff: {
        buffType: 'power',
        duration: 3,
        stacks: 1
      }
    }],
    category: '属性·流派·倾向',
    tags: ['标签1', '标签2']
  };
  return new Skill(definition);
})();
```

### 2.3 导出规范

```typescript
/**
 * 技能库导出
 */
export const ELEMENT_SKILLS = {
  // 攻击倾向
  ATTACK: {
    SKILL_1,
    SKILL_2,
    SKILL_3,
    SKILL_4
  },
  // 防御倾向
  DEFENSE: {
    SKILL_5,
    SKILL_6,
    SKILL_7
  },
  // 辅助倾向
  SUPPORT: {
    SKILL_8,
    SKILL_9,
    SKILL_10
  },
  // 全部技能
  ALL: [
    SKILL_1, SKILL_2, SKILL_3, SKILL_4,
    SKILL_5, SKILL_6, SKILL_7,
    SKILL_8, SKILL_9, SKILL_10
  ]
};
```

---

## 三、SkillDefinition 字段说明

### 3.1 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 技能唯一标识符（使用下划线命名） |
| `name` | string | 技能中文名称 |
| `description` | string | 效果描述 |
| `type` | 'action' \| 'trait' | 技能类型 |
| `energyCost` | number | 能量消耗值 |
| `target` | SkillTarget | 目标类型 |
| `effects` | SkillEffect[] | 效果数组 |

### 3.2 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `tendency` | SkillTendency | 技能倾向 |
| `category` | string | 分类标签 |
| `tags` | string[] | 技能标签数组 |
| `chargeTurns` | number | 蓄力回合数 |
| `canBeInterrupted` | boolean | 蓄力是否可被打断 |
| `priority` | number | 技能优先级（先手等） |

### 3.3 SkillEffect 效果类型

```typescript
interface SkillEffect {
  // 伤害效果
  damage?: {
    basePower: number;      // 基础威力
    damageType: DamageType; // 伤害类型 (PHYSICAL/SPECIAL/TRUE)
    element?: ElementType;  // 属性
    hits?: number;          // 攻击次数（多段攻击）
    typeBonus?: {           // 属性克制加成
      targetElement: ElementType;
      multiplier: number;
    };
  };

  // 治疗效果
  healing?: {
    amount: number;         // 固定治疗量
    percent?: number;       // 百分比治疗（相对于maxHp）
  };

  // 护盾效果
  shield?: {
    amount: number;         // 护盾值
    duration?: number;      // 持续回合
  };

  // Buff效果（单体）
  applyBuff?: {
    buffType: string;       // Buff类型（字符串形式）
    duration?: number;
    stacks?: number;
    value?: number;         // 效果值
  };

  // Debuff效果（单体）
  applyDebuff?: {
    debuffType: string;     // Debuff类型（字符串形式）
    duration?: number;
    stacks?: number;
    maxStacks?: number;     // 最大层数
    successRate?: number;   // 命中率/触发率
    value?: number;
  };

  // Debuff效果（群体）
  applyDebuffAll?: {
    debuffType: string;
    duration?: number;
    stacks?: number;
    maxStacks?: number;
    successRate?: number;
    value?: number;
  };

  // 属性强化效果
  statBoost?: {
    stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';
    stages: number;          // 等级变化量
    duration?: number;
  };

  // 特殊效果
  special?: {
    type: 'reflect' | 'counter' | 'cleanse' | 'consume_buff_heal' | 'delay_damage' | ...;
    value?: number;
  };
}
```

---

## 四、Buff/Debuff 编写规范

### 4.1 Buff 类结构

```typescript
/**
 * Buff说明
 */
export class XxxBuff extends Buff {
  value: number;

  constructor(duration: number = 3, value: number = 0.5) {
    super('Buff名称', BuffType.XXX_BUFF, 1, duration);
    this.value = value;
  }

  // 可选：定义效果方法
  getValue(): number {
    return this.value;
  }

  // 必须：实现clone方法
  clone(): XxxBuff {
    return new XxxBuff(this.remainingDuration, this.value);
  }
}
```

### 4.2 Debuff 类结构

```typescript
/**
 * Debuff说明
 */
export class XxxDebuff extends Debuff {
  damage: number;

  constructor(duration: number = 3, damage: number = 10) {
    super('Debuff名称', DebuffType.XXX_DEBUFF, 1, duration);
    this.damage = damage;
  }

  // 可选：回合开始/结束触发
  onTurnStart(unit: DebuffCombatUnit): void {
    unit.takeDamage(this.damage, 'xxx');
  }

  // 必须：实现clone方法
  clone(): XxxDebuff {
    return new XxxDebuff(this.remainingDuration, this.damage);
  }
}
```

### 4.3 枚举值命名规范

Buff/Debuff 类型使用字符串枚举，命名规则：

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| Buff | `xxx_buff` | `fire_shield`, `power` |
| Debuff | `xxx_debuff` | `burn`, `slow` |

---

## 五、伤害计算规则

### 5.1 基础伤害公式

```
伤害 = floor((level * 2 / 5 + 2) * power * attack / defense / 50) + 2
```

### 5.2 属性克制表

| 攻击\防御 | 火 | 水 | 草 | 电 | 冰 | 岩 | 龙 | 超能 |
|----------|-----|-----|-----|------|-----|------|------|------|
| 火       | 0.5 | 0.5 | 2   | 1   | 2   | 0.5 | 1   | 1    |
| 水       | 2   | 0.5 | 0.5 | 0.5 | 1   | 2   | 1   | 1    |
| 草       | 0.5 | 2   | 0.5 | 1   | 1   | 2   | 1   | 1    |
| 电       | 1   | 2   | 0.5 | 0.5 | 1   | 1   | 0.5 | 1    |
| 冰       | 0.5 | 0.5 | 2   | 1   | 0.5 | 1   | 2   | 1    |
| 岩       | 2   | 1   | 0.5 | 1   | 2   | 1   | 1   | 1    |
| 龙       | 1   | 1   | 1   | 1   | 1   | 1   | 2   | 1    |
| 超能     | 1   | 1   | 1   | 1   | 1   | 1   | 0   | 0.5  |

### 5.3 能力等级映射

| 等级 | 倍率 |
|------|------|
| -6   | 0.5  |
| -5   | 0.55 |
| -4   | 0.6  |
| -3   | 0.67 |
| -2   | 0.75 |
| -1   | 0.8  |
| 0    | 1.0  |
| +1   | 1.25 |
| +2   | 1.5  |
| +3   | 1.75 |
| +4   | 2.0  |
| +5   | 2.25 |
| +6   | 2.5  |

---

## 六、类型映射

### 6.1 BuffType 字符串映射

```typescript
// 在 src/types/index.ts 中
export const STRING_TO_BUFF_TYPE: Record<string, BuffType> = {
  'power': BuffType.POWER,
  'fire_shield': BuffType.FIRE_SHIELD,
  // ... 更多映射
};
```

### 6.2 DebuffType 字符串映射

```typescript
// 在 src/types/index.ts 中
export const STRING_TO_DEBUFF_TYPE: Record<string, DebuffType> = {
  'burn': DebuffType.BURN,
  'slow': DebuffType.SLOW,
  // ... 更多映射
};
```

---

## 七、代码审查清单

新增技能时，请确保：

- [ ] 使用字符串形式定义 `buffType` 和 `debuffType`（如 `'burn'` 而非 `BurnDebuff`）
- [ ] `debuffType` 值必须在 `STRING_TO_DEBUFF_TYPE` 中有映射
- [ ] `buffType` 值必须在 `STRING_TO_BUFF_TYPE` 中有映射
- [ ] 技能ID唯一且使用下划线命名
- [ ] 能量消耗符合技能定位（攻击1-3，辅助1-4，终极5-6）
- [ ] 每个属性至少10个技能（攻击4、防御3、辅助3）
- [ ] 包含完整的JSDoc注释
- [ ] 在技能库导出对象的 `ALL` 数组中注册

---

## 八、文件变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-05-26 | 初始版本：添加类型映射、修复类型安全问题、统一护盾系统 |
| 2026-05-26 | 清理废弃代码：移除 DeepFreezeDebuff、AbsoluteFreezeDebuff |
| 2026-05-26 | 修改"烈火护体"：70%减伤+下次火攻+40威力（原必定暴击已废弃） |
| 2026-05-26 | 修改"蓄焰"：改为基于能量的增伤机制（每点能量+10威力） |
| 2026-05-26 | 修改"炎之意志"：火属性伤害+15%→+25% |
| 2026-05-26 | 修复能量消耗顺序：蓄焰计算先于能量消耗 |
| 2026-05-26 | 实现火盾、灼热反击、烈火护体、炎之意志的完整Buff效果 |
| 2026-05-26 | 实现灼伤印记和燃尽印记的延迟效果 |
| 2026-05-26 | 修复多段伤害灼烧判定逻辑 |

---

## 九、附录

### 9.1 SkillTarget 枚举值

```typescript
enum SkillTarget {
  SINGLE = 'single',      // 单体敌人
  ALL = 'all',            // 全体
  SELF = 'self',          // 自身
  ALLY = 'ally',          // 己方单体
  ALLY_ALL = 'ally_all',  // 己方全体
  ENEMY_ALL = 'enemy_all' // 敌方全体
}
```

### 9.2 DamageType 枚举值

```typescript
enum DamageType {
  PHYSICAL = 'physical',  // 物理伤害
  SPECIAL = 'special',    // 特殊伤害
  STATUS = 'status',      // 变化技能
  TRUE = 'true'           // 真实伤害
}
```

### 9.3 SkillTendency 枚举值

```typescript
enum SkillTendency {
  ATTACK = 'attack',     // 攻击倾向
  DEFENSE = 'defense',   // 防御倾向
  SUPPORT = 'support'    // 辅助倾向
}
```

### 9.4 冰属性冻结机制

当前冰属性只有 **2种冻结相关效果**：

| 效果 | 类型 | 说明 |
|------|------|------|
| `frost` | 冰霜层数 | 叠加型，3层触发冻结 |
| `freeze` | 直接冻结 | 概率触发，30%自解 |

> **注意**：`deep_freeze`（深冻）和 `absolute_freeze`（绝对冻结）已废弃，不再使用。

### 9.5 火属性蓄焰机制

**蓄焰Buff**会根据施法者的当前能量增加火属性攻击的威力。

| 属性 | 说明 |
|------|------|
| 公式 | 额外威力 = 当前能量 × 10 |
| 示例 | 能量10时，40威力技能变为140威力 |

**实现位置**：`BattleManager.ts` 施放技能时检查火属性伤害并应用蓄焰效果。

### 9.6 火属性防御机制

| Buff | 效果 | 实现位置 |
|------|------|----------|
| 火盾 (FireShield) | 受伤时对攻击者附加灼烧（1层） | `triggerOnDamagedEffects()` |
| 灼热反击 (HeatCounter) | 受伤时反弹50%火属性伤害 | `triggerOnDamagedEffects()` |
| 烈火护体 (FlameBody) | 下次火属性攻击威力+40 | 施放技能时检查 |

### 9.7 火属性Debuff机制

| Debuff | 效果 | 触发条件 |
|--------|------|----------|
| 灼烧 (Burn) | 每回合2%最大HP伤害，层数减半 | 回合结束 |
| 灼伤印记 (BurnMark) | 下回合行动前追加40威力火属性伤害 | 回合开始 |
| 燃尽印记 (CombustionMark) | 持续回合结束时扣除30%当前HP | 持续回合结束 |

### 9.8 炎之意志Buff机制

**炎之意志Buff**增加火属性伤害加成。

| 属性 | 说明 |
|------|------|
| 效果 | 火属性伤害 × 1.25 |
| 附加 | 攻击+1级，速度+1级 |
| 实现位置 | `CombatUnit.calculateDamage()` |
