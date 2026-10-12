export const INGREDIENTS = {
  bone: { id: 'bone', name: 'Bone', image: 'bone.png', cost: 10 },
  ash: { id: 'ash', name: 'Ash', image: 'ash.png', cost: 10 },
  iron: { id: 'iron', name: 'Iron', image: 'iron.png', cost: 20 },
  crystal: { id: 'crystal', name: 'Crystal', image: 'crystal.png', cost: 40 },
  shadow: { id: 'shadow', name: 'Shadow', image: 'shadow.png', cost: 50 },
  cursed_herb: { id: 'cursed_herb', name: 'Cursed Herb', image: 'cursed_herb.png', cost: 25 }
};

export const MONSTERS = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    image: 'skeleton.png',
    hp: 30, maxHp: 30, attack: 10, defense: 5, speed: 10,
    rarity: 'Common',
    ability: 'Bone Throw - Small chance to attack twice.',
    description: 'A basic undead servant. Brittle but reliable.'
  },
  armored_skeleton: {
    id: 'armored_skeleton',
    name: 'Armored Skeleton',
    image: 'armored_skeleton.png',
    hp: 50, maxHp: 50, attack: 15, defense: 20, speed: 5,
    rarity: 'Uncommon',
    ability: 'Iron Guard - Reduces incoming damage.',
    description: 'Slightly more durable than a regular skeleton. Still lacks a brain.'
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    image: 'wraith.png',
    hp: 20, maxHp: 20, attack: 25, defense: 0, speed: 20,
    rarity: 'Uncommon',
    ability: 'Ethereal Form - 20% chance to dodge attacks.',
    description: 'A restless spirit composed of ash and shadow.'
  },
  crystal_wraith: {
    id: 'crystal_wraith',
    name: 'Crystal Wraith',
    image: 'crystal_wraith.png',
    hp: 40, maxHp: 40, attack: 35, defense: 10, speed: 25,
    rarity: 'Rare',
    ability: 'Crystal Shards - Deals damage back when attacked.',
    description: 'Empowered by arcane crystals. Dangerous to touch.'
  },
  plague_ghoul: {
    id: 'plague_ghoul',
    name: 'Plague Ghoul',
    image: 'plague_ghoul.png',
    hp: 45, maxHp: 45, attack: 20, defense: 10, speed: 15,
    rarity: 'Rare',
    ability: 'Toxic Touch - Poisons enemy, dealing damage over time.',
    description: 'A disgusting abomination oozing with cursed toxicity.'
  },
  iron_golem: {
    id: 'iron_golem',
    name: 'Iron Golem',
    image: 'iron_golem.png',
    hp: 100, maxHp: 100, attack: 20, defense: 40, speed: 2,
    rarity: 'Epic',
    ability: 'Unstoppable - Immune to status effects.',
    description: 'A hulking mass of iron animated by ash. Slow but devastating.'
  },
  arcane_familiar: {
    id: 'arcane_familiar',
    name: 'Arcane Familiar',
    image: 'arcane_familiar.png',
    hp: 30, maxHp: 30, attack: 40, defense: 5, speed: 30,
    rarity: 'Epic',
    ability: 'Magic Missile - Attack ignores defense.',
    description: 'A bizarre magical construct meant for scouting and spellcasting.'
  },
  shadow_revenant: {
    id: 'shadow_revenant',
    name: 'Shadow Revenant',
    image: 'shadow_revenant.png',
    hp: 80, maxHp: 80, attack: 45, defense: 25, speed: 18,
    rarity: 'Legendary',
    ability: 'Life Drain - Heals for a portion of damage dealt.',
    description: 'A king of the underworld, summoned through pure dark magic.'
  },
  toxic_slime: {
    id: 'toxic_slime',
    name: 'Toxic Slime',
    image: 'toxic_slime.png',
    hp: 60, maxHp: 60, attack: 15, defense: 15, speed: 8,
    rarity: 'Uncommon',
    ability: 'Acid Splash - Lowers enemy defense on hit.',
    description: 'A mindless puddle of corrosive goop.'
  },
  dark_knight: {
    id: 'dark_knight',
    name: 'Dark Knight',
    image: 'dark_knight.png',
    hp: 75, maxHp: 75, attack: 30, defense: 30, speed: 12,
    rarity: 'Legendary',
    ability: 'Shadow Cleave - Attacks hit all enemies (if multiple existed).',
    description: 'An elite warrior possessed by shadows. Ruthless and efficient.'
  }
};

export const RECIPES = [
  { ing1: 'bone', ing2: 'ash', result: 'skeleton' },
  { ing1: 'bone', ing2: 'iron', result: 'armored_skeleton' },
  { ing1: 'ash', ing2: 'shadow', result: 'wraith' },
  { ing1: 'crystal', ing2: 'shadow', result: 'crystal_wraith' },
  { ing1: 'cursed_herb', ing2: 'bone', result: 'plague_ghoul' },
  { ing1: 'iron', ing2: 'ash', result: 'iron_golem' },
  { ing1: 'crystal', ing2: 'cursed_herb', result: 'arcane_familiar' },
  { ing1: 'bone', ing2: 'shadow', result: 'shadow_revenant' },
  { ing1: 'iron', ing2: 'shadow', result: 'dark_knight' },
  { ing1: 'cursed_herb', ing2: 'ash', result: 'toxic_slime' }
];

// Helper to check recipe
export function checkRecipe(i1, i2) {
  for (let r of RECIPES) {
    if ((r.ing1 === i1 && r.ing2 === i2) || (r.ing1 === i2 && r.ing2 === i1)) {
      return r.result;
    }
  }
  return null;
}

export const ENEMIES = [
  { id: 'villager', name: 'Angry Villager', hp: 20, maxHp: 20, attack: 5, defense: 2, speed: 10, image: 'villager.png', rarity: 'Common' },
  { id: 'militia', name: 'Town Militia', hp: 40, maxHp: 40, attack: 12, defense: 10, speed: 8, image: 'militia.png', rarity: 'Common' },
  { id: 'knight', name: 'Holy Knight', hp: 100, maxHp: 100, attack: 25, defense: 30, speed: 15, image: 'knight.png', rarity: 'Rare' },
  { id: 'inquisitor', name: 'Scarlet Inquisitor', hp: 60, maxHp: 60, attack: 75, defense: 5, speed: 25, image: 'inquisitor.png', rarity: 'Rare' },
  { id: 'paladin', name: 'Paladin Commander', hp: 250, maxHp: 250, attack: 40, defense: 40, speed: 20, image: 'paladin.png', rarity: 'Epic' },
  { id: 'archmage', name: 'High Archmage', hp: 120, maxHp: 120, attack: 150, defense: 10, speed: 30, image: 'archmage.png', rarity: 'Epic' },
];

export const FEASIBLE_FUSIONS = {
  'skeleton+shadow_revenant': {
    id: 'nether_lich',
    name: 'Nether Lich',
    image: '/assets/fusions/nether_lich.png',
    rarity: 'Legendary',
    multiplier: 2.2,
    ability: 'Soul Reap - Devours enemy essence on attack.',
    description: 'A sovereign skeleton lord reborn in pure shadow fire and ancient necromancy.'
  },
  'iron_golem+wraith': {
    id: 'phantom_colossus',
    name: 'Phantom Colossus',
    image: '/assets/fusions/phantom_colossus.png',
    rarity: 'Legendary',
    multiplier: 2.3,
    ability: 'Spectral Iron - High defense with ethereal dodge chance.',
    description: 'An iron monolith animated by a screaming spectral wraith.'
  },
  'arcane_familiar+crystal_wraith': {
    id: 'prism_archon',
    name: 'Prism Archon',
    image: '/assets/fusions/prism_archon.svg',
    rarity: 'Legendary',
    multiplier: 2.4,
    ability: 'Refraction Beam - Attack pierces enemy armor.',
    description: 'A crystalline avatar radiating raw prismatic arcane sorcery.'
  },
  'plague_ghoul+toxic_slime': {
    id: 'venomous_behemoth',
    name: 'Venomous Behemoth',
    image: '/assets/fusions/venomous_behemoth.png',
    rarity: 'Legendary',
    multiplier: 2.2,
    ability: 'Corrosive Deluge - Inflicts catastrophic acid rot.',
    description: 'A grotesque giant of sentient necrotic bile and melting toxic ooze.'
  },
  'armored_skeleton+dark_knight': {
    id: 'dread_juggernaut',
    name: 'Dread Juggernaut',
    image: '/assets/fusions/dread_juggernaut.svg',
    rarity: 'Legendary',
    multiplier: 2.3,
    ability: 'Black Bastion - Shrugs off massive physical damage.',
    description: 'An unstoppable undead war machine sealed in impenetrable black plate.'
  },
  'skeleton+toxic_slime': {
    id: 'acid_skulllord',
    name: 'Acid Skulllord',
    image: '/assets/fusions/acid_skeleton.svg',
    rarity: 'Epic',
    multiplier: 2.0,
    ability: 'Caustic Bones - Splatters acid when taking damage.',
    description: 'A cursed skeleton encased in bubbling green venom.'
  },
  'shadow_revenant+wraith': {
    id: 'void_dragon',
    name: 'Void Stalker',
    image: '/assets/fusions/void_dragon.png',
    rarity: 'Legendary',
    multiplier: 2.5,
    ability: 'Event Horizon - Phantasmal attacks strike with cosmic fury.',
    description: 'A terrifying cosmic predator stalking through the darkness between dimensions.'
  },
  'dark_knight+shadow_revenant': {
    id: 'abyssal_warlord',
    name: 'Abyssal Warlord',
    image: '/assets/fusions/abyssal_warlord.png',
    rarity: 'Legendary',
    multiplier: 2.5,
    ability: 'Void Cleave - Massive life steal on critical hit.',
    description: 'An ancient demon warlord commanding shadows from a sunken throne of skulls.'
  }
};

export function getFeasibleFusion(id1, id2) {
  if (!id1 || !id2) return null;
  if (id1 === id2) return null; // Strictly no two same monsters can combine!
  return FEASIBLE_FUSIONS[`${id1}+${id2}`] || FEASIBLE_FUSIONS[`${id2}+${id1}`] || null;
}

// Gold awarded when sacrificing monsters to the dark altar (scaled by rarity, materials & fusion tiers)
export const SACRIFICE_VALUES = {
  // Common (Basic starter undead)
  skeleton: 12,
  
  // Uncommon (Mid-tier creations)
  armored_skeleton: 25,
  toxic_slime: 30,
  wraith: 45,
  
  // Rare (Advanced alchemical horrors)
  plague_ghoul: 40,
  crystal_wraith: 70,
  
  // Epic (Formidable constructs & familiars)
  iron_golem: 65,
  arcane_familiar: 80,
  acid_skulllord: 100,
  
  // Legendary (Elite underworld terrors)
  dark_knight: 110,
  shadow_revenant: 115,
  
  // Legendary Fusions (Formed by fusing two complete monsters)
  nether_lich: 180,
  phantom_colossus: 190,
  venomous_behemoth: 200,
  dread_juggernaut: 210,
  prism_archon: 220,
  void_dragon: 240,
  abyssal_warlord: 250
};

export function getMonsterSacrificeValue(entity) {
  if (!entity) return 10;
  if (entity.id && SACRIFICE_VALUES[entity.id]) {
    return SACRIFICE_VALUES[entity.id];
  }
  if (entity.isCustom) {
    return 180; // High tier custom dark fusion
  }
  // Tiered fallback by rarity
  const rarity = (entity.rarity || '').toLowerCase();
  switch (rarity) {
    case 'common': return 12;
    case 'uncommon': return 30;
    case 'rare': return 50;
    case 'epic': return 80;
    case 'legendary': return 120;
    default: return 25;
  }
}


