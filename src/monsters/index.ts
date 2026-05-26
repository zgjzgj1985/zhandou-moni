/**
 * 循迹之境 - 怪物系统导出
 * 
 * 所有怪物都从统一的生物定义中创建
 * 伙伴和怪物共享相同的生物定义，只是阵营不同
 */

export {
  // 怪物创建函数
  createEnemy,
  createEnemy as createFlameSalamander,
  createEnemy as createVenomSpider,
  createEnemy as createFrostWolf,
  createEnemy as createMindMaster,
  createEnemy as createYoungDragon,
  createEnemy as createShadowPanther,
  createEnemy as createVolcanoDragon,
  createEnemy as createDeepFish,
  createEnemy as createPoisonVine,
  createEnemy as createThunderBat,
  createEnemy as createIceCrystal,
  createEnemy as createRockArmadillo,
  createEnemy as createFlameBear,
  createEnemy as createTorrentCrab,
  createEnemy as createVineTurtle,
  createEnemy as createLightningMarten,
  createEnemy as createRockOx,
  createEnemy as createSpiritFox,
  createEnemy as createDreamButterfly,
  createEnemy as createStarDragon,
  createEnemy as createBlazeBeast,
  
  // 生物定义
  ALL_CREATURES,
  getCreatureById,
  getCreaturesByElement,
  
  // 具体生物定义
  FlameSalamanderDefinition,
  MindMasterDefinition,
  YoungDragonDefinition,
  ShadowPantherDefinition,
  VolcanoDragonDefinition,
  DeepFishDefinition,
  PoisonVineDefinition,
  ThunderBatDefinition,
  IceCrystalDefinition,
  RockArmadilloDefinition,
  FlameBearDefinition,
  TorrentCrabDefinition,
  VineTurtleDefinition,
  LightningMartenDefinition,
  RockOxDefinition,
  SpiritFoxDefinition,
  DreamButterflyDefinition,
  StarDragonDefinition,
  BlazeBeastDefinition,
} from '../units';
