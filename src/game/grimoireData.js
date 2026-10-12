// Simplified, engaging lore, recipes, and tactical guides for the Necromancer's Grimoire

export const CHRONICLE_CHAPTERS = [
  {
    id: 'origins',
    title: 'The Banished Alchemist',
    subtitle: 'Chapter I: The Awakening',
    quote: '"They called me mad for refusing to let death win. Now, they tremble before my creations."',
    content: [
      {
        heading: 'Why You Were Exiled',
        text: 'You were the chief healer of the Grand Citadel. When the fatal plague struck, prayers failed, so you turned to the eternal science of alchemy. When you revived the dead, the Holy Inquisition branded you a heretic and burned your lab. You escaped into the dark catacombs with only your boiling cauldron.'
      },
      {
        heading: 'Your Dark Purpose',
        text: 'Here in the DreamLayer Abyss, death is not an ending—it is raw material. Gather ancient bones, shadows, and volatile minerals. Synthesize an unstoppable undead army, conquer the Graveyard Arena, and show the Church that true power belongs to the fleshcrafter.'
      }
    ]
  },
  {
    id: 'alchemy',
    title: 'The 6 Core Reagents',
    subtitle: 'Chapter II: The Alchemical Elements',
    quote: '"Master these six ingredients, and you hold dominion over every horror in the abyss."',
    content: [
      {
        heading: 'The Building Blocks',
        text: 'Every monster in this grimoire is forged from two basic reagents in the Cauldron:'
      },
      {
        isReagentList: true,
        items: [
          { name: 'Bone', icon: 'bone.png', role: 'Forms bone frames, skeletal warriors, and baseline physical thralls.' },
          { name: 'Ash', icon: 'ash.png', role: 'Provides spectral spirit, smoke evasion, and cold ethereal speed.' },
          { name: 'Iron', icon: 'iron.png', role: 'Adds heavy armor plate, massive health pools, and blunt impact defense.' },
          { name: 'Crystal', icon: 'crystal.png', role: 'Refracts piercing astral magic missiles that completely ignore shields.' },
          { name: 'Shadow', icon: 'shadow.png', role: 'Infuses life-draining void strikes, swift dodges, and critical damage.' },
          { name: 'Cursed Herb', icon: 'cursed_herb.png', role: 'Secretes toxic rot and corrosive acid that melts enemy defense.' }
        ]
      }
    ]
  },
  {
    id: 'fusions',
    title: 'Rules of Fleshcrafting',
    subtitle: 'Chapter III: Cauldron & Altar Secrets',
    quote: '"Two simple reagents create a soldier. Two living horrors create a god."',
    content: [
      {
        heading: '1. Basic Synthesis (Reagents)',
        text: 'Drop two ingredients into the cauldron to synthesize a monster. If the combination is valid, the creature permanently awakens in your Bestiary and enters your army.'
      },
      {
        heading: '2. Living Fusion (2.5x Boss Multiplier)',
        text: 'Combine two compatible living monsters in the cauldron to trigger a Dark Fusion. Fusions produce Legendary Boss-tier horrors with massive 2.0x to 2.5x boosted stats and devastating signature abilities!'
      },
      {
        heading: '3. The Taboo of Twins (Cannot Fuse Same)',
        text: 'Never try to fuse two identical creatures (e.g. Skeleton + Skeleton). Their souls violently repel and will not merge. True fusion requires two distinct horrors!'
      },
      {
        heading: '4. The Dark Altar (Sacrifice for Gold)',
        text: 'Have extra monsters you don’t need? Place them on the Cauldron altar and hit Sacrifice. Dissolving them awards instant Gold to buy rare materials on the Black Market!'
      }
    ]
  },
  {
    id: 'inquisition',
    title: 'Battle Arena Tactics',
    subtitle: 'Chapter IV: How to Win in Battle',
    quote: '"Knowledge is as sharp as a scythe. Know your enemy before sending your minions to war."',
    content: [
      {
        heading: 'Speed Wins Battles',
        text: 'Higher Speed means your monster attacks first. Fast creatures like Wraiths and Nether Liches can eliminate dangerous foes before they even strike.'
      },
      {
        heading: 'Shields vs Magic',
        text: 'Heavy enemy knights have high Defense that blocks physical damage. Use Magic Missiles (Arcane Familiar) or Corrosive Acid (Toxic Slime) to pierce straight through their armor!'
      },
      {
        heading: 'Form Your Dream Trio',
        text: 'In the Graveyard Arena, select a balanced 3-monster team: 1 Frontline Tank (Iron Golem / Armored Skeleton) to soak hits, and 2 High Damage Dealers (Revenant / Nether Lich) to wipe out the opposition.'
      }
    ]
  }
];

export const RECIPE_LORE = {
  skeleton: {
    title: 'Formula I: Skeleton',
    subtitle: 'Bone + Ash ➔ Skeleton',
    riddle: 'Burn calcified bones in cold ash to awaken a loyal marrow servant.',
    lore: 'Brittle but reliable. Small chance to throw bones for double strikes.',
    tier: 'Common',
    tip: 'Your starter soldier. Cheap to craft and great in numbers.'
  },
  armored_skeleton: {
    title: 'Formula II: Armored Skeleton',
    subtitle: 'Bone + Iron ➔ Armored Skeleton',
    riddle: 'Fasten heavy iron plates over skeletal limbs for an ironclad sentry.',
    lore: 'Slightly more durable than a regular skeleton. Iron guard reduces incoming damage.',
    tier: 'Uncommon',
    tip: 'Great early-game tank against physical attackers.'
  },
  wraith: {
    title: 'Formula III: Wraith',
    subtitle: 'Ash + Shadow ➔ Wraith',
    riddle: 'Weave pyre ash into deep shadows to summon a floating phantom.',
    lore: 'A restless spirit with 20% chance to dodge all incoming attacks.',
    tier: 'Uncommon',
    tip: 'Very fast attacker that frequently slips through enemy blades.'
  },
  crystal_wraith: {
    title: 'Formula IV: Crystal Wraith',
    subtitle: 'Crystal + Shadow ➔ Crystal Wraith',
    riddle: 'Trap a shadow inside a sharp mana crystal to create a razor-sharp phantom.',
    lore: 'Empowered by arcane crystals. Crystal Shards reflect damage back at attackers.',
    tier: 'Rare',
    tip: 'Deals retributive damage whenever struck.'
  },
  plague_ghoul: {
    title: 'Formula V: Plague Ghoul',
    subtitle: 'Cursed Herb + Bone ➔ Plague Ghoul',
    riddle: 'Soak dead marrow in cursed herbs to reanimate festering rotten flesh.',
    lore: 'A toxic ghoul oozing poison. Poisons enemies on hit for ongoing damage.',
    tier: 'Rare',
    tip: 'Infects heavy tanks with deadly damage-over-time.'
  },
  iron_golem: {
    title: 'Formula VI: Iron Golem',
    subtitle: 'Iron + Ash ➔ Iron Golem',
    riddle: 'Smelt iron slabs over ancient ash to animate an unstoppable titan.',
    lore: 'Massive 100 HP monolith. Immune to all status effects and debuffs.',
    tier: 'Epic',
    tip: 'The ultimate frontline meat-shield in the arena.'
  },
  arcane_familiar: {
    title: 'Formula VII: Arcane Familiar',
    subtitle: 'Crystal + Cursed Herb ➔ Arcane Familiar',
    riddle: 'Infuse toxic herbs into a resonant crystal to hatch a winged scout.',
    lore: 'Shoots Magic Missiles that completely ignore enemy defense ratings.',
    tier: 'Epic',
    tip: 'Deadly against Holy Knights and heavily armored commanders.'
  },
  shadow_revenant: {
    title: 'Formula VIII: Shadow Revenant',
    subtitle: 'Bone + Shadow ➔ Shadow Revenant',
    riddle: 'Crown ancient warlord bones in abyss shadow to awaken the king of darkness.',
    lore: 'King of the underworld. Life Drain steals enemy health on every strike.',
    tier: 'Legendary',
    tip: 'Self-sustaining titan that heals as it fights.'
  },
  dark_knight: {
    title: 'Formula IX: Dark Knight',
    subtitle: 'Iron + Shadow ➔ Dark Knight',
    riddle: 'Temper black steel in abyssal darkness to forge a merciless executioner.',
    lore: 'An elite warrior possessed by shadows. High defense and deadly shadow cleaves.',
    tier: 'Legendary',
    tip: 'Tremendous all-around stats with 75 HP and 30 Defense.'
  },
  toxic_slime: {
    title: 'Formula X: Toxic Slime',
    subtitle: 'Cursed Herb + Ash ➔ Toxic Slime',
    riddle: 'Dissolve poisonous herbs into chimney ash to form a puddle of living acid.',
    lore: 'Mindless corrosive ooze. Acid Splash lowers enemy defense on hit.',
    tier: 'Uncommon',
    tip: 'Softens up tanky foes so your other minions hit harder.'
  }
};

export const FUSION_LORE = {
  'skeleton+shadow_revenant': {
    title: 'Fusion: Nether Lich',
    fusionId: 'nether_lich',
    pair: ['Skeleton', 'Shadow Revenant'],
    riddle: 'Merge a basic Skeleton with the mighty Shadow Revenant to awaken the Nether Lich.',
    lore: 'Reborn in shadow fire. Soul Reap devours enemy vitality on hit.',
    multiplier: '2.2x Stats'
  },
  'iron_golem+wraith': {
    title: 'Fusion: Phantom Colossus',
    fusionId: 'phantom_colossus',
    pair: ['Iron Golem', 'Wraith'],
    riddle: 'Trap a dodging Wraith inside the iron frame of an Iron Golem to forge the Phantom Colossus.',
    lore: 'Combines monolithic golem defense with ethereal ghost evasion.',
    multiplier: '2.3x Stats'
  },
  'arcane_familiar+crystal_wraith': {
    title: 'Fusion: Prism Archon',
    fusionId: 'prism_archon',
    pair: ['Arcane Familiar', 'Crystal Wraith'],
    riddle: 'Fuse the Arcane Familiar with the Crystal Wraith to summon the Prism Archon.',
    lore: 'Refraction Beam pierces armor at blinding speed.',
    multiplier: '2.4x Stats'
  },
  'plague_ghoul+toxic_slime': {
    title: 'Fusion: Venomous Behemoth',
    fusionId: 'venomous_behemoth',
    pair: ['Plague Ghoul', 'Toxic Slime'],
    riddle: 'Merge Plague Ghoul with Toxic Slime to birth the Venomous Behemoth.',
    lore: 'Corrosive Deluge drenches enemies in catastrophic acid and rot.',
    multiplier: '2.2x Stats'
  },
  'armored_skeleton+dark_knight': {
    title: 'Fusion: Dread Juggernaut',
    fusionId: 'dread_juggernaut',
    pair: ['Armored Skeleton', 'Dark Knight'],
    riddle: 'Fuse Armored Skeleton with Dark Knight to seal the Dread Juggernaut in black plate.',
    lore: 'Black Bastion shrugs off massive physical trauma with steel fortitude.',
    multiplier: '2.3x Stats'
  },
  'skeleton+toxic_slime': {
    title: 'Fusion: Acid Skulllord',
    fusionId: 'acid_skulllord',
    pair: ['Skeleton', 'Toxic Slime'],
    riddle: 'Immerse a brittle Skeleton in caustic Toxic Slime to create the Acid Skulllord.',
    lore: 'Caustic Bones spatters acid back when taking damage.',
    multiplier: '2.0x Stats'
  },
  'shadow_revenant+wraith': {
    title: 'Fusion: Void Stalker',
    fusionId: 'void_dragon',
    pair: ['Shadow Revenant', 'Wraith'],
    riddle: 'Unite Shadow Revenant with Wraith to unbind the cosmic Void Stalker from outer darkness.',
    lore: 'Event Horizon strikes with cosmic fury from beyond dimensions.',
    multiplier: '2.5x Stats'
  },
  'dark_knight+shadow_revenant': {
    title: 'Fusion: Abyssal Warlord',
    fusionId: 'abyssal_warlord',
    pair: ['Dark Knight', 'Shadow Revenant'],
    riddle: 'Fuse Dark Knight with Shadow Revenant to crown the apocalyptic Abyssal Warlord.',
    lore: 'Void Cleave inflicts massive life-stealing critical strikes.',
    multiplier: '2.5x Stats'
  }
};

export const ENEMY_DOSSIER = [
  {
    id: 'villager',
    name: 'Angry Villager',
    title: 'The Torched Mob',
    image: '/assets/enemies/villager.png',
    threat: 'Rank I (Easy)',
    hp: 20, attack: 5, defense: 2, speed: 10,
    lore: 'Armed with pitchforks and torches. Frightened and weak.',
    tactics: 'Easy prey. Any basic minion will defeat them quickly for starting gold.'
  },
  {
    id: 'militia',
    name: 'Town Militia',
    title: 'Garrison Guards',
    image: '/assets/enemies/militia.png',
    threat: 'Rank II (Moderate)',
    hp: 40, attack: 12, defense: 10, speed: 8,
    lore: 'Trained guards with wooden shields and swords.',
    tactics: 'Use Armored Skeletons or Toxic Slime to break through their guard.'
  },
  {
    id: 'knight',
    name: 'Holy Knight',
    title: 'Blessed Crusader',
    image: '/assets/enemies/knight.png',
    threat: 'Rank III (Tough)',
    hp: 100, attack: 25, defense: 30, speed: 15,
    lore: 'Zealous knights clad in holy steel plate.',
    tactics: 'High 30 Defense blocks normal attacks! Use Arcane Familiar magic missiles or poison.'
  },
  {
    id: 'inquisitor',
    name: 'Scarlet Inquisitor',
    title: 'Pyre Judge',
    image: '/assets/enemies/inquisitor.png',
    threat: 'Rank IV (Dangerous)',
    hp: 60, attack: 75, defense: 5, speed: 25,
    lore: 'Strikes with holy fire for massive 75 Attack at high speed.',
    tactics: 'Glass cannon! Eliminate them quickly with fast attackers before they incinerate your team.'
  },
  {
    id: 'paladin',
    name: 'Paladin Commander',
    title: 'Golden Vanguard',
    image: '/assets/enemies/paladin.png',
    threat: 'Rank V (Boss)',
    hp: 250, attack: 40, defense: 40, speed: 20,
    lore: 'Heavily armored crusade commander with 250 HP and sacred hammer strikes.',
    tactics: 'Requires high-tier minions or Fusions (like Dread Juggernaut or Venomous Behemoth).'
  },
  {
    id: 'archmage',
    name: 'High Archmage',
    title: 'Supreme Spellcaster',
    image: '/assets/enemies/archmage.png',
    threat: 'Rank VI (Final Boss)',
    hp: 120, attack: 150, defense: 10, speed: 30,
    lore: 'Master of radiant solar flares. Boasts catastrophic 150 Attack and 30 Speed.',
    tactics: 'Deploy Void Stalkers or Abyssal Warlords with Life Drain to survive his burst damage.'
  }
];
