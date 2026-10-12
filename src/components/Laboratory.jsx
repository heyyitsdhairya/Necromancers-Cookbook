import { useState, useEffect } from 'react';
import ItemIcon from './ItemIcon';
import { INGREDIENTS, checkRecipe, MONSTERS, RECIPES, getFeasibleFusion, getMonsterSacrificeValue } from '../game/data';
import { playMonsterGenerated, playSacrifice } from '../game/audio';

export default function Laboratory({ state, consumeIngredients, addDiscoveredMonster, addCustomMonster, consumeMonsters, buyIngredient, addRewards, setCurrentTab, openGrimoire }) {
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [message, setMessage] = useState('Select two ingredients or two compatible monsters to combine.');
  const [isCrafting, setIsCrafting] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [customResult, setCustomResult] = useState(null); // For AI generated monsters
  const [hint, setHint] = useState('');

  // Clear slots if inventory runs out
  useEffect(() => {
    if (slot1 && INGREDIENTS[slot1] && (state.inventory[slot1] || 0) <= 0) setSlot1(null);
    if (slot2 && INGREDIENTS[slot2] && (state.inventory[slot2] || 0) <= 0) setSlot2(null);
    if (slot1 && (MONSTERS[slot1] || state.customMonsters?.[slot1]) && (state.monsterInventory[slot1] || 0) <= 0) setSlot1(null);
    if (slot2 && (MONSTERS[slot2] || state.customMonsters?.[slot2]) && (state.monsterInventory[slot2] || 0) <= 0) setSlot2(null);
  }, [state.inventory, state.monsterInventory, slot1, slot2]);

  // Generate a dynamic hint based on undiscovered recipes and inventory
  useEffect(() => {
    // 35% chance to show a fusion hint
    if (Math.random() < 0.35) {
      const fusionHints = [
        'Hint: Only compatible creature resonances can fuse! Try merging a Wraith with an Iron Golem to forge the Phantom Colossus.',
        'Hint: Merge a Skeleton with a Shadow Revenant to awaken the legendary Nether Lich!',
        'Hint: Combine Toxic Slime with a Plague Ghoul to create the dreaded Venomous Behemoth!',
        'Hint: Fusing Armored Skeleton with Dark Knight creates the unstoppable Dread Juggernaut.',
        'Hint: Fuse Arcane Familiar with Crystal Wraith to summon the radiant Prism Archon!',
        'Hint: Combining Wraith and Shadow Revenant unbinds the cosmic Void Stalker!',
        'Hint: Two identical creatures will violently repel each other in the Cauldron. Seek two distinct horrors to merge!'
      ];
      setHint(fusionHints[Math.floor(Math.random() * fusionHints.length)]);
      return;
    }

    const undiscovered = RECIPES.filter(r => !state.discoveredMonsters.includes(r.result));
    
    if (undiscovered.length === 0) {
      setHint('You have discovered all basic recipes! Now fuse compatible monsters in the Cauldron to awaken legendary horrors...');
      return;
    }

    const craftable = undiscovered.filter(r => (state.inventory[r.ing1] || 0) > 0 && (state.inventory[r.ing2] || 0) > 0);
    if (craftable.length > 0) {
      const r = craftable[Math.floor(Math.random() * craftable.length)];
      setHint(`Hint: Try mixing ${INGREDIENTS[r.ing1].name} with ${INGREDIENTS[r.ing2].name}... or try fusing two monsters!`);
      return;
    }

    const partial = undiscovered.filter(r => (state.inventory[r.ing1] || 0) > 0 || (state.inventory[r.ing2] || 0) > 0);
    if (partial.length > 0) {
      const r = partial[Math.floor(Math.random() * partial.length)];
      const has1 = (state.inventory[r.ing1] || 0) > 0;
      const ownedName = INGREDIENTS[has1 ? r.ing1 : r.ing2].name;
      const missingName = INGREDIENTS[has1 ? r.ing2 : r.ing1].name;
      setHint(`Hint: You need to find or buy some ${missingName} to mix with your ${ownedName}...`);
      return;
    }

    const r = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    setHint(`Hint: Hunt for ${INGREDIENTS[r.ing1].name} and ${INGREDIENTS[r.ing2].name}... or try fusing monsters in the Cauldron!`);
  }, [state.discoveredMonsters, state.inventory, resultId, customResult]);

  const isMonster = (id) => !!MONSTERS[id] || !!state.customMonsters?.[id];
  const getEntity = (id) => INGREDIENTS[id] || MONSTERS[id] || state.customMonsters?.[id];
  
  const getImage = (id) => {
    if (!id) return '';
    if (INGREDIENTS[id]) return `/assets/ingredients/${INGREDIENTS[id].image}`;
    if (MONSTERS[id]) return `/assets/monsters/${MONSTERS[id].image}`;
    if (state.customMonsters?.[id]) {
      const m = state.customMonsters[id];
      return m.isCustom ? m.image : `/assets/monsters/${m.image}`;
    }
    return '';
  };

  const isBothMonsters = slot1 && slot2 && isMonster(slot1) && isMonster(slot2);
  const isBothIngredients = slot1 && slot2 && !isMonster(slot1) && !isMonster(slot2);
  const isMixed = slot1 && slot2 && ((isMonster(slot1) && !isMonster(slot2)) || (!isMonster(slot1) && isMonster(slot2)));
  const isSameMonster = isBothMonsters && (slot1 === slot2 || getEntity(slot1)?.name === getEntity(slot2)?.name);
  const feasibleFusion = isBothMonsters && !isSameMonster ? getFeasibleFusion(slot1, slot2) : null;
  const isIncompatibleMonsters = isBothMonsters && !isSameMonster && !feasibleFusion;
  const isSacrifice = isBothMonsters;

  const monster1Val = slot1 && isMonster(slot1) ? getMonsterSacrificeValue(getEntity(slot1)) : 0;
  const monster2Val = slot2 && isMonster(slot2) ? getMonsterSacrificeValue(getEntity(slot2)) : 0;
  const totalSacrificeGold = monster1Val + monster2Val;

  const handleSelect = (id, type) => {
    if (type === 'ingredient' && (state.inventory[id] || 0) <= 0) return;
    if (type === 'monster' && (state.monsterInventory[id] || 0) <= 0) return;
    if (isCrafting) return;

    if (slot1 === id) { 
      setSlot1(null); 
      setResultId(null); 
      setCustomResult(null); 
      if (slot2) {
        setMessage(`Selected ${getEntity(slot2)?.name}. Choose another item or sacrifice for gold.`);
      } else {
        setMessage('Select ingredients or monsters to combine.');
      }
      return; 
    }
    if (slot2 === id) { 
      setSlot2(null); 
      setResultId(null); 
      setCustomResult(null); 
      if (slot1) {
        setMessage(`Selected ${getEntity(slot1)?.name}. Choose another item or sacrifice for gold.`);
      } else {
        setMessage('Select ingredients or monsters to combine.');
      }
      return; 
    }

    // Strictly prevent selecting the exact same monster into both slots
    if (type === 'monster' && slot1 && isMonster(slot1)) {
      const ent1 = getEntity(slot1);
      const entNew = getEntity(id);
      if (slot1 === id || ent1?.name === entNew?.name) {
        setMessage('⚠️ Two identical monsters cannot be combined! Select two different creatures.');
        return;
      }
    }

    let newSlot1 = slot1;
    let newSlot2 = slot2;

    if (!newSlot1) {
      newSlot1 = id;
    } else if (!newSlot2) {
      newSlot2 = id;
    } else {
      newSlot1 = slot2;
      newSlot2 = id;
    }

    setSlot1(newSlot1);
    setSlot2(newSlot2);
    setResultId(null);
    setCustomResult(null);

    if (newSlot1 && newSlot2) {
      const m1 = isMonster(newSlot1);
      const m2 = isMonster(newSlot2);

      if (m1 && m2) {
        const ent1 = getEntity(newSlot1);
        const ent2 = getEntity(newSlot2);
        if (newSlot1 === newSlot2 || ent1?.name === ent2?.name) {
          setMessage('⚠️ Two identical monsters cannot be combined. Select two different creatures.');
        } else {
          const fusion = getFeasibleFusion(newSlot1, newSlot2);
          if (fusion) {
            setMessage(`✨ Feasible Fusion! Harmonic resonance detected for ${fusion.name}.`);
          } else {
            setMessage('⚠️ Incompatible Resonance! These creatures repel each other and cannot fuse.');
          }
        }
      } else if (!m1 && !m2) {
        setMessage('Ready to combine ingredients in the cauldron...');
      } else {
        setMessage('⚠️ Place two ingredients for basic alchemy, or two compatible monsters for Dark Fusion.');
      }
    } else if (newSlot1 || newSlot2) {
      const activeId = newSlot1 || newSlot2;
      if (isMonster(activeId)) {
        setMessage(`Selected ${getEntity(activeId)?.name}. Choose a different, compatible monster to fuse.`);
      } else {
        setMessage(`Selected ${getEntity(activeId)?.name}. Choose a second ingredient to mix.`);
      }
    }
  };

  const handleCombine = async () => {
    if (!slot1 || !slot2 || isCrafting) return;
    setIsCrafting(true);
    setResultId(null);
    setCustomResult(null);

    const m1 = isMonster(slot1);
    const m2 = isMonster(slot2);

    if (m1 && m2) {
      const ent1 = getEntity(slot1);
      const ent2 = getEntity(slot2);

      // Guard against identical monsters
      if (slot1 === slot2 || ent1?.name === ent2?.name) {
        setMessage('⚠️ Two identical monsters cannot be combined. Select two different creatures.');
        setIsCrafting(false);
        return;
      }

      // Guard against incompatible monsters
      const fusion = getFeasibleFusion(slot1, slot2);
      if (!fusion) {
        setMessage('⚠️ The cauldron violently repels! Incompatible resonance - these creatures cannot fuse.');
        setIsCrafting(false);
        return;
      }

      setMessage(`Initiating Dark Fusion. The AI is dreaming the ${fusion.name}...`);
      
      let baseImageUrl = ent1.image;
      if (!ent1.isCustom && !ent1.image.startsWith('/')) {
        baseImageUrl = window.location.origin + `/assets/monsters/${ent1.image}`;
      }

      let newImageUrl = null;
      try {
        newImageUrl = await Promise.race([
          sacrificeMonsterImage(baseImageUrl, ent2.name),
          new Promise((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
      } catch (err) {
        console.warn("API fusion fallback:", err);
      }

      const prevCustom = state.customMonsters?.[fusion.id];
      const finalImage = newImageUrl || prevCustom?.image || fusion.image;
      const isCustomImage = newImageUrl ? true : (finalImage.startsWith('/') || !!fusion.isCustom || !!prevCustom?.isCustom);
      const customId = fusion.id;

      consumeMonsters([slot1, slot2]);
      
      const customData = {
        id: customId,
        name: fusion.name,
        image: finalImage,
        hp: Math.floor((ent1.maxHp + ent2.maxHp) * (fusion.multiplier || 2.2)),
        maxHp: Math.floor((ent1.maxHp + ent2.maxHp) * (fusion.multiplier || 2.2)),
        attack: Math.floor((ent1.attack + ent2.attack) * (fusion.multiplier || 2.2)),
        defense: Math.floor((ent1.defense + ent2.defense) * (fusion.multiplier || 2.2)),
        speed: Math.floor((ent1.speed + ent2.speed) * 1.3),
        rarity: fusion.rarity || 'Legendary',
        ability: fusion.ability,
        description: fusion.description,
        isCustom: isCustomImage
      };
      
      addCustomMonster(customId, customData);
      
      // Simple, direct message regarding the generated monster - no mention of exhaustion or API errors
      setMessage(`Success! You unleashed the ${customData.name}!`);
      playMonsterGenerated();
      setCustomResult(customData);
      setSlot1(null);
      setSlot2(null);
      setIsCrafting(false);
      return;

    } else if (!m1 && !m2) {
      setMessage('Chanting dark incantations...');
      setTimeout(() => {
        const result = checkRecipe(slot1, slot2);
        if (result) {
          consumeIngredients(slot1, slot2);
          addDiscoveredMonster(result);
          const monster = MONSTERS[result];
          setMessage(`Success! You created a ${monster.name}!`);
          playMonsterGenerated();
          setResultId(result);
        } else {
          setMessage('The mixture fizzles into nothingness. Invalid recipe.');
        }
        setIsCrafting(false);
        setSlot1(null);
        setSlot2(null);
      }, 300);
      return;
    } else {
      setMessage('⚠️ Place two ingredients for basic alchemy, or two compatible monsters for Dark Fusion.');
      setIsCrafting(false);
      return;
    }
  };

  const clearSlots = () => {
    setSlot1(null);
    setSlot2(null);
    setResultId(null);
    setCustomResult(null);
    setMessage('Select ingredients or monsters to combine.');
  };

  const handleSacrifice = () => {
    const monstersToSacrifice = [];
    if (slot1 && isMonster(slot1)) monstersToSacrifice.push(slot1);
    if (slot2 && isMonster(slot2)) monstersToSacrifice.push(slot2);
    
    if (monstersToSacrifice.length === 0) return;
    
    let totalGold = 0;
    const names = [];
    monstersToSacrifice.forEach(id => {
      const ent = getEntity(id);
      if (ent) {
        const val = getMonsterSacrificeValue(ent);
        totalGold += val;
        names.push(`${ent.name} (+${val}g)`);
      }
    });

    try {
      playSacrifice();
    } catch (e) {
      console.warn('Audio playback error', e);
    }

    consumeMonsters(monstersToSacrifice);
    addRewards(totalGold, []);
    setMessage(`Sacrificed ${names.join(' and ')} to the dark altar. Gained +${totalGold} Gold!`);
    setSlot1(null);
    setSlot2(null);
  };

  // removed getEntity here because we hoisted it

  return (
    <div className="screen">
      
      {/* Inventory Panel */}
      <div className="panel" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="panel-header">Ingredients</div>
        <div className="inventory-grid">
          {Object.values(INGREDIENTS).map(ing => {
            const count = state.inventory[ing.id] || 0;
            const isSelected = slot1 === ing.id || slot2 === ing.id;
            return (
              <div key={ing.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  className={`item-slot ${isSelected ? 'selected' : ''}`}
                  style={{ opacity: count > 0 ? 1 : 0.3 }}
                  onClick={() => handleSelect(ing.id, 'ingredient')}
                  title={ing.name}
                >
                  <ItemIcon src={`/assets/ingredients/${ing.image}`} alt={ing.name} className="contain" />
                  <div className="item-count">{count}</div>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '5px', textAlign: 'center', color: 'var(--text-main)', fontWeight: 'bold' }}>
                  {ing.name}
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel-header" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>Sacrifices (Monsters)</div>
        <div className="inventory-grid">
          {(() => {
            const uniqueMap = new Map();
            const allIds = Array.from(new Set([...state.discoveredMonsters, ...Object.keys(state.customMonsters || {})]));
            
            for (const id of allIds) {
              const m = MONSTERS[id] || state.customMonsters?.[id];
              if (!m) continue;
              const key = m.name || id;
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, { primaryId: id, monster: m, count: state.monsterInventory?.[id] || 0 });
              } else {
                const entry = uniqueMap.get(key);
                entry.count += (state.monsterInventory?.[id] || 0);
              }
            }

            return Array.from(uniqueMap.values()).map(({ primaryId: id, monster: m, count }) => {
              const isSelected = slot1 === id || slot2 === id;
              return (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    className={`item-slot ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: count > 0 ? 1 : 0.3, borderColor: isSelected ? 'var(--accent-red)' : '' }}
                    onClick={() => handleSelect(id, 'monster')}
                    title={`${m.name} (${m.rarity}) - Sacrifice: +${getMonsterSacrificeValue(m)}g`}
                  >
                    <ItemIcon src={m.isCustom ? m.image : `/assets/monsters/${m.image}`} alt={m.name} />
                    <div className="item-count">{count}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', textAlign: 'center', color: 'var(--text-main)', fontWeight: 'bold' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>
                    +{getMonsterSacrificeValue(m)}g
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="mt-2" style={{ padding: '15px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>Recipe Guide</div>
            {(openGrimoire || setCurrentTab) && (
              <button 
                onClick={() => {
                  if (openGrimoire) openGrimoire('cookbook');
                  else if (setCurrentTab) setCurrentTab('codex');
                }}
                className="btn-open-cookbook-glorious"
                title="Consult the Alchemical Cookbook"
              >
                📖 Open Cookbook
              </button>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{hint}</div>
        </div>
      </div>

      {/* Cauldron Panel */}
      <div className="panel" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="panel-header">The Cauldron</div>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '40px' }}>
          {/* Slot 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="item-slot" style={{ width: '100px', height: '100px', cursor: 'pointer', borderColor: isMonster(slot1) ? 'var(--accent-red)' : '' }} onClick={() => !isCrafting && setSlot1(null)}>
              {slot1 ? <ItemIcon src={getImage(slot1)} alt={getEntity(slot1).name} className="contain" /> : '?'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: MONSTERS[slot1] ? 'var(--accent-red)' : 'var(--accent-gold)', minHeight: '20px', fontWeight: 'bold', textAlign:'center' }}>
              {slot1 ? getEntity(slot1).name : ''}
            </div>
          </div>
          <div className="flex-center" style={{ fontSize: '2rem', color: (isMonster(slot1) || isMonster(slot2)) ? 'var(--accent-red)' : 'var(--text-muted)' }}>+</div>
          {/* Slot 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="item-slot" style={{ width: '100px', height: '100px', cursor: 'pointer', borderColor: isMonster(slot2) ? 'var(--accent-red)' : '' }} onClick={() => !isCrafting && setSlot2(null)}>
              {slot2 ? <ItemIcon src={getImage(slot2)} alt={getEntity(slot2).name} className="contain" /> : '?'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: MONSTERS[slot2] ? 'var(--accent-red)' : 'var(--accent-gold)', minHeight: '20px', fontWeight: 'bold', textAlign:'center' }}>
              {slot2 ? getEntity(slot2).name : ''}
            </div>
          </div>
        </div>

        {/* Cauldron Image */}
        <div className={`item-slot ${isCrafting ? 'anim-shake anim-glow' : ''}`} style={{ width: '200px', height: '200px', border: 'none', background: 'transparent' }}>
          <ItemIcon src="/assets/ui/cauldron.png" alt="Cauldron" className="contain" />
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <button 
            className="btn-primary" 
            onClick={handleCombine} 
            disabled={
              !slot1 || !slot2 || isCrafting || 
              isMixed || isSameMonster || isIncompatibleMonsters
            }
            style={
              isBothMonsters && feasibleFusion 
                ? { background: 'var(--accent-red)', borderColor: '#fff', boxShadow: '0 0 15px rgba(231, 76, 60, 0.6)' } 
                : (isSameMonster || isIncompatibleMonsters || isMixed)
                  ? { background: '#333', borderColor: '#555', opacity: 0.6, cursor: 'not-allowed' }
                  : {}
            }
          >
            {isCrafting ? 'Channeling...' : 
             isSameMonster ? 'Identical Monsters (Cannot Fuse)' :
             isIncompatibleMonsters ? 'Incompatible (Cannot Fuse)' :
             isMixed ? 'Select Same Types to Combine' :
             isBothMonsters && feasibleFusion ? `Dark Fusion: ${feasibleFusion.name}` :
             'Combine'}
          </button>
          <button 
            className="btn-primary" 
            onClick={clearSlots} 
            disabled={(!slot1 && !slot2) || isCrafting}
            style={{ background: 'transparent', borderColor: 'var(--text-muted)' }}
          >
            Clear
          </button>
          
          {/* Sacrifice Altar Button */}
          {((slot1 && isMonster(slot1)) || (slot2 && isMonster(slot2))) && (
            <button 
              className="btn-primary" 
              onClick={handleSacrifice} 
              disabled={isCrafting}
              style={{ background: 'var(--accent-red)', borderColor: '#fff' }}
            >
              {slot1 && isMonster(slot1) && slot2 && isMonster(slot2)
                ? `Sacrifice Both for Gold (+${totalSacrificeGold}g)`
                : `Sacrifice for Gold (+${totalSacrificeGold}g)`}
            </button>
          )}
        </div>

        <div className="mt-2 text-center" style={{ fontSize: '1.2rem', minHeight: '30px', color: (isSameMonster || isIncompatibleMonsters) ? 'var(--accent-red)' : (resultId || customResult ? 'var(--accent-green)' : 'var(--accent-gold)') }}>
          {message}
        </div>

        {/* Result Reveal */}
        {(resultId || customResult) && (
          <div className="mt-2 anim-glow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="item-slot" style={{ width: '160px', height: '160px', borderColor: customResult ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
              <ItemIcon src={customResult ? (customResult.isCustom ? customResult.image : `/assets/monsters/${customResult.image}`) : `/assets/monsters/${MONSTERS[resultId].image}`} alt={customResult ? customResult.name : MONSTERS[resultId].name} />
            </div>
            <div style={{ marginTop: '10px', fontSize: '1.4rem', fontWeight: 'bold', color: customResult ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
              {customResult ? customResult.name : MONSTERS[resultId].name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
