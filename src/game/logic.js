import { useState, useEffect } from 'react';
import { INGREDIENTS, FEASIBLE_FUSIONS } from './data';

const SAVE_KEY = 'necromancer_save_v1';

const DEFAULT_STATE = {
  gold: 0,
  inventory: {
    bone: 5,
    ash: 5,
    iron: 3,
    crystal: 2,
    shadow: 1,
    cursed_herb: 3
  },
  monsterInventory: {},
  discoveredMonsters: [],
  customMonsters: {}, // Stores unique sacrificed monsters
  battlesWon: 0,
  hasSeenArenaTutorial: false,
  hasDismissedArenaHint: false,
  unclaimedRewards: []
};

// Normalize and deduplicate save data to prevent duplicate monster entries
function normalizeSaveData(parsed) {
  if (!parsed) return DEFAULT_STATE;

  const rawCustom = { ...(parsed.customMonsters || {}) };
  const rawMonsterInv = { ...(parsed.monsterInventory || {}) };
  const rawDiscovered = Array.isArray(parsed.discoveredMonsters) ? [...parsed.discoveredMonsters] : [];

  // Map old/dynamic IDs (e.g. custom_venomous_behemoth_1791...) to canonical IDs (e.g. venomous_behemoth)
  const idRemap = {};

  for (const rawId of Object.keys(rawCustom)) {
    const monster = rawCustom[rawId];
    if (!monster) continue;

    if (monster.image && monster.image.startsWith('blob:')) {
      monster.image = 'toxic_slime.png';
      monster.isCustom = false;
    }

    let canonicalId = rawId;
    if (rawId.startsWith('custom_')) {
      const stripped = rawId.replace(/^custom_/, '').replace(/_\d+$/, '');
      if (stripped) canonicalId = stripped;
    }

    // Match by fusion name or ID
    for (const fKey in FEASIBLE_FUSIONS) {
      const f = FEASIBLE_FUSIONS[fKey];
      if (f.id === canonicalId || (monster.name && f.name.toLowerCase() === monster.name.toLowerCase())) {
        canonicalId = f.id;
        break;
      }
    }

    if (canonicalId !== rawId) {
      idRemap[rawId] = canonicalId;
    }
  }

  // Also check rawDiscovered and rawMonsterInv for any old 'custom_' IDs
  for (const id of [...rawDiscovered, ...Object.keys(rawMonsterInv)]) {
    if (id.startsWith('custom_') && !idRemap[id]) {
      const stripped = id.replace(/^custom_/, '').replace(/_\d+$/, '');
      for (const fKey in FEASIBLE_FUSIONS) {
        const f = FEASIBLE_FUSIONS[fKey];
        if (f.id === stripped) {
          idRemap[id] = f.id;
          break;
        }
      }
      if (!idRemap[id] && stripped) idRemap[id] = stripped;
    }
  }

  // Remap and merge customMonsters
  const normalizedCustom = {};
  for (const [id, data] of Object.entries(rawCustom)) {
    const targetId = idRemap[id] || id;
    if (!normalizedCustom[targetId]) {
      normalizedCustom[targetId] = { ...data, id: targetId };
    } else {
      // Keep existing custom image if current is fallback
      if (data.isCustom && data.image && !normalizedCustom[targetId].image) {
        normalizedCustom[targetId] = { ...data, id: targetId };
      }
    }
  }

  // Remap and merge monster counts
  const normalizedMonsterInv = {};
  for (const [id, count] of Object.entries(rawMonsterInv)) {
    const targetId = idRemap[id] || id;
    normalizedMonsterInv[targetId] = (normalizedMonsterInv[targetId] || 0) + (count || 0);
  }

  // Remap and deduplicate discoveredMonsters
  const normalizedDiscovered = [];
  const seenIds = new Set();
  for (const id of rawDiscovered) {
    const targetId = idRemap[id] || id;
    if (!seenIds.has(targetId)) {
      seenIds.add(targetId);
      normalizedDiscovered.push(targetId);
    }
  }

  return {
    ...DEFAULT_STATE,
    ...parsed,
    customMonsters: normalizedCustom,
    monsterInventory: normalizedMonsterInv,
    discoveredMonsters: normalizedDiscovered
  };
}

export function useGameState() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeSaveData(parsed);
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const consumeIngredients = (ing1, ing2) => {
    setState(prev => {
      const newInv = { ...prev.inventory };
      if (ing1) newInv[ing1] = (newInv[ing1] || 0) - 1;
      if (ing2 && ing2 !== ing1) {
          newInv[ing2] = (newInv[ing2] || 0) - 1;
      } else if (ing2 === ing1) {
          newInv[ing1] = (newInv[ing1] || 0) - 1;
      }
      return { ...prev, inventory: newInv };
    });
  };

  const addDiscoveredMonster = (monsterId) => {
    setState(prev => {
      const inv = prev.monsterInventory || {};
      const newMonsterInv = { ...inv, [monsterId]: (inv[monsterId] || 0) + 1 };
      return {
        ...prev,
        monsterInventory: newMonsterInv,
        discoveredMonsters: Array.from(new Set([...prev.discoveredMonsters, monsterId]))
      };
    });
  };

  const addCustomMonster = (monsterId, monsterData) => {
    setState(prev => {
      const inv = prev.monsterInventory || {};
      const newMonsterInv = { ...inv, [monsterId]: (inv[monsterId] || 0) + 1 };
      return {
        ...prev,
        monsterInventory: newMonsterInv,
        discoveredMonsters: Array.from(new Set([...prev.discoveredMonsters, monsterId])),
        customMonsters: { 
          ...prev.customMonsters, 
          [monsterId]: {
            ...monsterData,
            id: monsterId,
            image: monsterData.image || prev.customMonsters?.[monsterId]?.image
          } 
        }
      };
    });
  };

  const consumeMonsters = (monsterIds) => {
    setState(prev => {
      const inv = prev.monsterInventory || {};
      const newMonsterInv = { ...inv };
      monsterIds.forEach(id => {
        if (id && newMonsterInv[id] > 0) newMonsterInv[id] -= 1;
      });
      return { ...prev, monsterInventory: newMonsterInv };
    });
  };

  const buyIngredient = (ingId, cost) => {
    setState(prev => {
      if (prev.gold < cost) return prev;
      return {
        ...prev,
        gold: prev.gold - cost,
        inventory: {
          ...prev.inventory,
          [ingId]: (prev.inventory[ingId] || 0) + 1
        }
      };
    });
  };



  const addUnclaimedReward = (gold, items = []) => {
    setState(prev => ({
      ...prev,
      battlesWon: (prev.battlesWon || 0) + 1,
      unclaimedRewards: [...(prev.unclaimedRewards || []), { gold, items }]
    }));
  };

  const claimAllRewards = () => {
    setState(prev => {
      let totalGold = 0;
      const newInv = { ...prev.inventory };
      
      (prev.unclaimedRewards || []).forEach(reward => {
        totalGold += reward.gold;
        reward.items.forEach(item => {
          newInv[item] = (newInv[item] || 0) + 1;
        });
      });

      return {
        ...prev,
        gold: prev.gold + totalGold,
        inventory: newInv,
        unclaimedRewards: []
      };
    });
  };

  const addRewards = (gold, items = []) => {
    setState(prev => {
      const newInv = { ...prev.inventory };
      items.forEach(item => {
        newInv[item] = (newInv[item] || 0) + 1;
      });
      return {
        ...prev,
        gold: prev.gold + gold,
        inventory: newInv,
        battlesWon: prev.battlesWon + 1
      };
    });
  };
  
  const resetProgress = () => {
    setState(DEFAULT_STATE);
  }

  return { 
    state, 
    updateState, 
    consumeIngredients, 
    addDiscoveredMonster,
    addCustomMonster,
    consumeMonsters, 
    addRewards, 
    addUnclaimedReward,
    claimAllRewards,
    buyIngredient,
    resetProgress 
  };
}
