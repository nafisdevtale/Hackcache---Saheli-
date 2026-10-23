/**
 * Saheli 7.3 — My Saheli Companion: 15 Selectable Pets Catalogue
 *
 * Design Charter:
 * - Exactly 15 original, warm, supportive animal companions.
 * - Distinct visual characteristics and bespoke SVG rendering in the Saheli palette.
 * - Fictional treats and toys (completely unrelated to user dietary intake or health logs).
 * - Gentle growth stages that never penalize inactivity or absence.
 */

export const PET_SPECIES = [
  {
    id: "cat",
    nameKey: "pet.species.cat",
    defaultName: "Mimi",
    descriptionKey: "pet.species.catDesc",
    primaryColor: "#f472b6", // warm rose
    accentColor: "#be185d",
    ears: "triangular",
    tail: "long_curled",
    favoriteTreatKey: "pet.treat.berryNibble",
    favoriteToyKey: "pet.toy.yarnBall",
    idleQuoteKeys: ["pet.quote.cat1", "pet.quote.cat2", "pet.quote.cat3"],
  },
  {
    id: "dog",
    nameKey: "pet.species.dog",
    defaultName: "Moti",
    descriptionKey: "pet.species.dogDesc",
    primaryColor: "#fb923c", // golden amber
    accentColor: "#c2410c",
    ears: "floppy",
    tail: "wagging",
    favoriteTreatKey: "pet.treat.crunchyBiscuit",
    favoriteToyKey: "pet.toy.bouncyBall",
    idleQuoteKeys: ["pet.quote.dog1", "pet.quote.dog2", "pet.quote.dog3"],
  },
  {
    id: "rabbit",
    nameKey: "pet.species.rabbit",
    defaultName: "Chiku",
    descriptionKey: "pet.species.rabbitDesc",
    primaryColor: "#e879f9", // soft lilac
    accentColor: "#86198f",
    ears: "long_upright",
    tail: "puff",
    favoriteTreatKey: "pet.treat.sweetClover",
    favoriteToyKey: "pet.toy.woodenBlock",
    idleQuoteKeys: ["pet.quote.rabbit1", "pet.quote.rabbit2", "pet.quote.rabbit3"],
  },
  {
    id: "fox",
    nameKey: "pet.species.fox",
    defaultName: "Lali",
    descriptionKey: "pet.species.foxDesc",
    primaryColor: "#f97316", // vivid terracotta
    accentColor: "#9a3412",
    ears: "pointed_large",
    tail: "bushy_white_tip",
    favoriteTreatKey: "pet.treat.forestBerries",
    favoriteToyKey: "pet.toy.featherWand",
    idleQuoteKeys: ["pet.quote.fox1", "pet.quote.fox2", "pet.quote.fox3"],
  },
  {
    id: "panda",
    nameKey: "pet.species.panda",
    defaultName: "Bao",
    descriptionKey: "pet.species.pandaDesc",
    primaryColor: "#334155", // slate dark
    accentColor: "#1e293b",
    ears: "round_black",
    tail: "stubby",
    favoriteTreatKey: "pet.treat.bambooShoot",
    favoriteToyKey: "pet.toy.softCushion",
    idleQuoteKeys: ["pet.quote.panda1", "pet.quote.panda2", "pet.quote.panda3"],
  },
  {
    id: "bear",
    nameKey: "pet.species.bear",
    defaultName: "Bhalu",
    descriptionKey: "pet.species.bearDesc",
    primaryColor: "#a16207", // warm honey brown
    accentColor: "#713f12",
    ears: "round_small",
    tail: "stubby",
    favoriteTreatKey: "pet.treat.honeyDrop",
    favoriteToyKey: "pet.toy.plushieStar",
    idleQuoteKeys: ["pet.quote.bear1", "pet.quote.bear2", "pet.quote.bear3"],
  },
  {
    id: "koala",
    nameKey: "pet.species.koala",
    defaultName: "Koko",
    descriptionKey: "pet.species.koalaDesc",
    primaryColor: "#94a3b8", // soft eucalyptus gray
    accentColor: "#475569",
    ears: "fluffy_round",
    tail: "none",
    favoriteTreatKey: "pet.treat.crispLeaf",
    favoriteToyKey: "pet.toy.climbingBranch",
    idleQuoteKeys: ["pet.quote.koala1", "pet.quote.koala2", "pet.quote.koala3"],
  },
  {
    id: "hamster",
    nameKey: "pet.species.hamster",
    defaultName: "Golu",
    descriptionKey: "pet.species.hamsterDesc",
    primaryColor: "#f59e0b", // warm peach gold
    accentColor: "#b45309",
    ears: "tiny_round",
    tail: "tiny",
    favoriteTreatKey: "pet.treat.sunflowerSeed",
    favoriteToyKey: "pet.toy.miniTunnel",
    idleQuoteKeys: ["pet.quote.hamster1", "pet.quote.hamster2", "pet.quote.hamster3"],
  },
  {
    id: "hedgehog",
    nameKey: "pet.species.hedgehog",
    defaultName: "Kanta",
    descriptionKey: "pet.species.hedgehogDesc",
    primaryColor: "#78716c", // gentle bristle stone
    accentColor: "#44403c",
    ears: "soft_curled",
    tail: "none",
    favoriteTreatKey: "pet.treat.figNibble",
    favoriteToyKey: "pet.toy.rollingNut",
    idleQuoteKeys: ["pet.quote.hedgehog1", "pet.quote.hedgehog2", "pet.quote.hedgehog3"],
  },
  {
    id: "penguin",
    nameKey: "pet.species.penguin",
    defaultName: "Pingu",
    descriptionKey: "pet.species.penguinDesc",
    primaryColor: "#0284c7", // arctic ocean sky
    accentColor: "#0369a1",
    ears: "none",
    tail: "waddle_tail",
    favoriteTreatKey: "pet.treat.iceBerry",
    favoriteToyKey: "pet.toy.smoothPebble",
    idleQuoteKeys: ["pet.quote.penguin1", "pet.quote.penguin2", "pet.quote.penguin3"],
  },
  {
    id: "butterfly",
    nameKey: "pet.species.butterfly",
    defaultName: "Titli",
    descriptionKey: "pet.species.butterflyDesc",
    primaryColor: "#a855f7", // iridescent violet
    accentColor: "#7e22ce",
    ears: "antennae_feathered",
    tail: "none",
    favoriteTreatKey: "pet.treat.flowerNectar",
    favoriteToyKey: "pet.toy.windChime",
    idleQuoteKeys: ["pet.quote.butterfly1", "pet.quote.butterfly2", "pet.quote.butterfly3"],
  },
  {
    id: "turtle",
    nameKey: "pet.species.turtle",
    defaultName: "Kachhua",
    descriptionKey: "pet.species.turtleDesc",
    primaryColor: "#10b981", // gentle emerald
    accentColor: "#047857",
    ears: "none",
    tail: "pointed_short",
    favoriteTreatKey: "pet.treat.waterLily",
    favoriteToyKey: "pet.toy.zenRock",
    idleQuoteKeys: ["pet.quote.turtle1", "pet.quote.turtle2", "pet.quote.turtle3"],
  },
  {
    id: "owl",
    nameKey: "pet.species.owl",
    defaultName: "Ullu",
    descriptionKey: "pet.species.owlDesc",
    primaryColor: "#6366f1", // twilight indigo
    accentColor: "#4338ca",
    ears: "tufted_horns",
    tail: "fan_feathers",
    favoriteTreatKey: "pet.treat.moonberryCracker",
    favoriteToyKey: "pet.toy.shinyBookmark",
    idleQuoteKeys: ["pet.quote.owl1", "pet.quote.owl2", "pet.quote.owl3"],
  },
  {
    id: "otter",
    nameKey: "pet.species.otter",
    defaultName: "Pani",
    descriptionKey: "pet.species.otterDesc",
    primaryColor: "#0d9488", // river teal
    accentColor: "#0f766e",
    ears: "small_aquatic",
    tail: "streamlined",
    favoriteTreatKey: "pet.treat.kelpCrisp",
    favoriteToyKey: "pet.toy.floatingShell",
    idleQuoteKeys: ["pet.quote.otter1", "pet.quote.otter2", "pet.quote.otter3"],
  },
  {
    id: "frog",
    nameKey: "pet.species.frog",
    defaultName: "Dadu",
    descriptionKey: "pet.species.frogDesc",
    primaryColor: "#84cc16", // moss lime
    accentColor: "#4d7c0f",
    ears: "none",
    tail: "none",
    favoriteTreatKey: "pet.treat.dewDropGel",
    favoriteToyKey: "pet.toy.lilyPadDisc",
    idleQuoteKeys: ["pet.quote.frog1", "pet.quote.frog2", "pet.quote.frog3"],
  },
];

export const HABITAT_THEMES = [
  {
    id: "meadow",
    labelKey: "pet.habitat.meadow",
    descriptionKey: "pet.habitat.meadowDesc",
    bgColor: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30",
    accentBorder: "border-emerald-200/60 dark:border-emerald-800/40",
    iconName: "Sun",
  },
  {
    id: "cozy_room",
    labelKey: "pet.habitat.cozyRoom",
    descriptionKey: "pet.habitat.cozyRoomDesc",
    bgColor: "from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/30",
    accentBorder: "border-amber-200/60 dark:border-amber-800/40",
    iconName: "Home",
  },
  {
    id: "sunset_porch",
    labelKey: "pet.habitat.sunsetPorch",
    descriptionKey: "pet.habitat.sunsetPorchDesc",
    bgColor: "from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30",
    accentBorder: "border-rose-200/60 dark:border-rose-800/40",
    iconName: "Sunset",
  },
  {
    id: "starlit_garden",
    labelKey: "pet.habitat.starlitGarden",
    descriptionKey: "pet.habitat.starlitGardenDesc",
    bgColor: "from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30",
    accentBorder: "border-indigo-200/60 dark:border-indigo-800/40",
    iconName: "Moon",
  },
];

export const HABITATS = HABITAT_THEMES;

export const ACCESSORIES = [
  {
    id: "none",
    labelKey: "pet.acc.none",
    iconName: "Ban",
  },
  {
    id: "flower_crown",
    labelKey: "pet.acc.flowerCrown",
    descriptionKey: "pet.acc.flowerCrownDesc",
    iconName: "Flower2",
  },
  {
    id: "cozy_scarf",
    labelKey: "pet.acc.cozyScarf",
    descriptionKey: "pet.acc.cozyScarfDesc",
    iconName: "Wind",
  },
  {
    id: "ribbon_bow",
    labelKey: "pet.acc.ribbonBow",
    descriptionKey: "pet.acc.ribbonBowDesc",
    iconName: "Sparkles",
  },
  {
    id: "star_charm",
    labelKey: "pet.acc.starCharm",
    descriptionKey: "pet.acc.starCharmDesc",
    iconName: "Star",
  },
  {
    id: "tiny_glasses",
    labelKey: "pet.acc.tinyGlasses",
    descriptionKey: "pet.acc.tinyGlassesDesc",
    iconName: "Eye",
  },
];

export const GROWTH_STAGES = [
  {
    stage: 1,
    id: "new_companion",
    labelKey: "pet.stage.new",
    descKey: "pet.stage.newDesc",
    minInteractions: 0,
    scale: 0.85,
  },
  {
    stage: 2,
    id: "growing_companion",
    labelKey: "pet.stage.growing",
    descKey: "pet.stage.growingDesc",
    minInteractions: 10,
    scale: 0.95,
  },
  {
    stage: 3,
    id: "established_companion",
    labelKey: "pet.stage.established",
    descKey: "pet.stage.establishedDesc",
    minInteractions: 25,
    scale: 1.05,
  },
  {
    stage: 4,
    id: "mature_companion",
    labelKey: "pet.stage.mature",
    descKey: "pet.stage.matureDesc",
    minInteractions: 50,
    scale: 1.15,
  },
];

export const MOODS = [
  { id: "happy", labelKey: "pet.mood.happy", icon: "Smile", animation: "bounce" },
  { id: "playful", labelKey: "pet.mood.playful", icon: "Sparkles", animation: "wiggle" },
  { id: "calm", labelKey: "pet.mood.calm", icon: "Heart", animation: "float" },
  { id: "curious", labelKey: "pet.mood.curious", icon: "Compass", animation: "tilt" },
  { id: "sleepy", labelKey: "pet.mood.sleepy", icon: "Moon", animation: "gentle_pulse" },
];

export const CARE_ACTIVITIES = [
  { id: "feed", labelKey: "companion.actionFeed", iconName: "Apple" },
  { id: "play", labelKey: "companion.actionPlay", iconName: "Sparkles" },
  { id: "groom", labelKey: "companion.actionGroom", iconName: "Brush" },
  { id: "rest", labelKey: "companion.actionRest", iconName: "Moon" },
  { id: "affection", labelKey: "companion.actionAffection", iconName: "Heart" },
];

export function getPetSpeciesById(id) {
  return PET_SPECIES.find((p) => p.id === id) || PET_SPECIES[0];
}
