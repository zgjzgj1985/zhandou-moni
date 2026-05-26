/**
 * 循迹之境 - 伙伴系统导出
 * 
 * 所有伙伴都从统一的生物定义中创建
 * 伙伴和怪物共享相同的生物定义，只是阵营不同
 */

export {
  // 伙伴创建函数
  createCompanion,
  createCompanion as createFlameBear,
  createCompanion as createFlameSalamander,
  createCompanion as createTorrentCrab,
  createCompanion as createDeepFish,
  createCompanion as createVineTurtle,
  createCompanion as createPoisonVine,
  createCompanion as createLightningMarten,
  createCompanion as createThunderBat,
  createCompanion as createFrostWolf,
  createCompanion as createIceCrystal,
  createCompanion as createRockOx,
  createCompanion as createRockArmadillo,
  createCompanion as createSpiritFox,
  createCompanion as createDreamButterfly,
  createCompanion as createMindMaster,
  createCompanion as createShadowPanther,
  createCompanion as createStarDragon,
  createCompanion as createBlazeBeast,
  createCompanion as createYoungDragon,
  createCompanion as createVolcanoDragon,
  
  // 生物定义
  ALL_CREATURES,
  getCreatureById,
  getCreaturesByElement,
  
  // 具体生物定义
  FlameBearDefinition,
  FlameSalamanderDefinition,
  TorrentCrabDefinition,
  DeepFishDefinition,
  VineTurtleDefinition,
  PoisonVineDefinition,
  LightningMartenDefinition,
  ThunderBatDefinition,
  FrostWolfDefinition,
  IceCrystalDefinition,
  RockOxDefinition,
  RockArmadilloDefinition,
  SpiritFoxDefinition,
  DreamButterflyDefinition,
  MindMasterDefinition,
  ShadowPantherDefinition,
  StarDragonDefinition,
  BlazeBeastDefinition,
  YoungDragonDefinition,
  VolcanoDragonDefinition,
} from '../units';
