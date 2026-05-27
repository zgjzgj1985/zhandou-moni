const fs = require("fs");
let content = fs.readFileSync("d:/Vibe coding/战斗模拟/水属性控制流技能设计.md", "utf8");

// 更新漩涡和浊流热水代码示例中的SPECIAL为PHYSICAL
content = content.replace(/damageType: DamageType\.SPECIAL,/g, "damageType: DamageType.PHYSICAL,");

// 更新水弹的多段伤害为物理伤害
content = content.replace("damageType: DamageType.MULTI_HIT, // 多段伤害", "damageType: DamageType.PHYSICAL, // 物理伤害（多段）");

fs.writeFileSync("d:/Vibe coding/战斗模拟/水属性控制流技能设计.md", content);
console.log("代码示例更新完成");
