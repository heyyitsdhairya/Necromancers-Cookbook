import { useState, useEffect, useMemo, useRef } from 'react';
import ItemIcon from './ItemIcon';
import { INGREDIENTS, MONSTERS, RECIPES, FEASIBLE_FUSIONS, getMonsterSacrificeValue } from '../game/data';
import { CHRONICLE_CHAPTERS, RECIPE_LORE, FUSION_LORE, ENEMY_DOSSIER } from '../game/grimoireData';
import { playPageTurn, playClick } from '../game/audio';

export default function Grimoire({ 
  state, 
  setCurrentTab, 
  spreadIndex: propSpreadIndex, 
  setSpreadIndex: propSetSpreadIndex, 
  targetSection, 
  setTargetSection 
}) {
  const { discoveredMonsters = [], customMonsters = {} } = state;

  // Active spread index (0 to 10)
  // 0: Chronicle 1 & 2
  // 1: Chronicle 3 & 4
  // 2: Cookbook Basic 1-5
  // 3: Cookbook Basic 6-10
  // 4: Cookbook Fusions 1-4
  // 5: Cookbook Fusions 5-8
  // 6: Bestiary Catalog (Common & Uncommon)
  // 7: Bestiary Catalog (Rare & Epic)
  // 8: Bestiary Catalog (Legendary)
  // 9: Inquisitors 1-3
  // 10: Inquisitors 4-6
  const [localSpreadIndex, setLocalSpreadIndex] = useState(targetSection === 'cookbook' ? 2 : 0);

  const spreadIndex = propSpreadIndex !== undefined ? propSpreadIndex : localSpreadIndex;
  const setSpreadIndex = (val) => {
    if (typeof propSetSpreadIndex === 'function') {
      propSetSpreadIndex(val);
    } else {
      setLocalSpreadIndex(val);
    }
  };

  const setSpreadIndexRef = useRef(setSpreadIndex);
  useEffect(() => {
    setSpreadIndexRef.current = setSpreadIndex;
  }, [setSpreadIndex]);
  const flipDestRef = useRef(null);

  // Jump to targeted section when requested from outside (e.g. Open Cookbook button in Laboratory)
  useEffect(() => {
    if (targetSection === 'cookbook') {
      setSpreadIndex(2); // Jump directly to Cookbook formulas!
      if (setTargetSection) setTargetSection(null);
    } else if (targetSection === 'bestiary') {
      setSpreadIndex(6);
      if (setTargetSection) setTargetSection(null);
    } else if (targetSection === 'inquisitors') {
      setSpreadIndex(9);
      if (setTargetSection) setTargetSection(null);
    } else if (targetSection === 'chronicle') {
      setSpreadIndex(0);
      if (setTargetSection) setTargetSection(null);
    }
  }, [targetSection, setTargetSection]);

  // 3D Flip animation state
  // null | { direction: 'forward' | 'backward', fromSpread: number, toSpread: number }
  const [flipState, setFlipState] = useState(null);
  const flipTimerRef = useRef(null);

  // Bestiary selected monster
  const [selectedMonsterId, setSelectedMonsterId] = useState('skeleton');

  // Enemy selected
  const [selectedEnemyId, setSelectedEnemyId] = useState('villager');

  const TOTAL_SPREADS = 11;

  // Clean up flip timer on unmount and ensure pending spread destination is preserved
  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      if (flipDestRef.current !== null && setSpreadIndexRef.current) {
        setSpreadIndexRef.current(flipDestRef.current);
      }
    };
  }, []);

  // Calculate monsters
  const uniqueMonsterMap = useMemo(() => {
    const map = new Map();
    for (const [id, m] of Object.entries({ ...MONSTERS, ...customMonsters })) {
      if (!m) continue;
      const key = m.name || id;
      if (!map.has(key)) {
        map.set(key, { ...m, id });
      }
    }
    return map;
  }, [customMonsters]);

  const allMonstersList = useMemo(() => Array.from(uniqueMonsterMap.values()), [uniqueMonsterMap]);

  const isMonsterDiscovered = (monster) => {
    if (!monster) return false;
    return discoveredMonsters.includes(monster.id) || 
      discoveredMonsters.some(dId => (MONSTERS[dId]?.name === monster.name || customMonsters[dId]?.name === monster.name));
  };

  const totalDiscoveredCount = useMemo(() => {
    return allMonstersList.filter(isMonsterDiscovered).length;
  }, [allMonstersList, discoveredMonsters]);

  // Compiled Recipes for the Cookbook
  const compiledRecipes = useMemo(() => {
    const list = [];

    // Basic recipes
    RECIPES.forEach((r, idx) => {
      const resultMonster = MONSTERS[r.result];
      const isUnlocked = discoveredMonsters.includes(r.result);
      const lore = RECIPE_LORE[r.result] || {};
      list.push({
        type: 'basic',
        id: `basic_${idx}`,
        title: lore.title || `Formula ${idx + 1}: ${resultMonster?.name}`,
        subtitle: `${INGREDIENTS[r.ing1]?.name} + ${INGREDIENTS[r.ing2]?.name}`,
        ing1: INGREDIENTS[r.ing1],
        ing2: INGREDIENTS[r.ing2],
        result: resultMonster,
        resultId: r.result,
        isUnlocked,
        riddle: lore.riddle || 'Mix two reagents in the cauldron.',
        lore: lore.lore || resultMonster?.description,
        tier: lore.tier || resultMonster?.rarity,
        tip: lore.tip
      });
    });

    // Fusion recipes
    Object.entries(FEASIBLE_FUSIONS).forEach(([pairKey, fusion], idx) => {
      const [m1Id, m2Id] = pairKey.split('+');
      const m1 = MONSTERS[m1Id];
      const m2 = MONSTERS[m2Id];
      const isUnlocked = discoveredMonsters.includes(fusion.id);
      const lore = FUSION_LORE[pairKey] || {};
      list.push({
        type: 'fusion',
        id: `fusion_${idx}`,
        title: lore.title || `Fusion: ${fusion.name}`,
        subtitle: `${m1?.name || m1Id} + ${m2?.name || m2Id} ➔ ${fusion.name}`,
        ing1: m1,
        ing2: m2,
        result: fusion,
        resultId: fusion.id,
        isUnlocked,
        riddle: lore.riddle || 'Merge two living monsters in the cauldron.',
        lore: lore.lore || fusion.description,
        tier: fusion.rarity,
        multiplier: lore.multiplier || '2.2x Stats'
      });
    });

    return list;
  }, [discoveredMonsters]);

  // Turn Page Forward with 3D animation
  const flipForward = (targetSpread = null) => {
    if (flipState) return;
    const dest = targetSpread !== null ? targetSpread : spreadIndex + 1;
    if (dest >= TOTAL_SPREADS || dest === spreadIndex) return;

    playPageTurn();
    setFlipState({ direction: 'forward', fromSpread: spreadIndex, toSpread: dest });
    flipDestRef.current = dest;

    flipTimerRef.current = setTimeout(() => {
      setSpreadIndex(dest);
      flipDestRef.current = null;
      setFlipState(null);
    }, 520);
  };

  // Turn Page Backward with 3D animation
  const flipBackward = (targetSpread = null) => {
    if (flipState) return;
    const dest = targetSpread !== null ? targetSpread : spreadIndex - 1;
    if (dest < 0 || dest === spreadIndex) return;

    playPageTurn();
    setFlipState({ direction: 'backward', fromSpread: spreadIndex, toSpread: dest });
    flipDestRef.current = dest;

    flipTimerRef.current = setTimeout(() => {
      setSpreadIndex(dest);
      flipDestRef.current = null;
      setFlipState(null);
    }, 520);
  };

  const jumpToSpread = (dest) => {
    if (dest === spreadIndex || flipState) return;
    if (dest > spreadIndex) {
      flipForward(dest);
    } else {
      flipBackward(dest);
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        flipForward();
      } else if (e.key === 'ArrowLeft') {
        flipBackward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spreadIndex, flipState]);

  // Ribbon Bookmark Navigation
  const activeRibbon = useMemo(() => {
    if (spreadIndex <= 1) return 'chronicle';
    if (spreadIndex <= 5) return 'cookbook';
    if (spreadIndex <= 8) return 'bestiary';
    return 'inquisitors';
  }, [spreadIndex]);

  // Handle ribbon click
  const handleRibbonClick = (tab) => {
    if (tab === 'chronicle') jumpToSpread(0);
    else if (tab === 'cookbook') jumpToSpread(2);
    else if (tab === 'bestiary') jumpToSpread(6);
    else if (tab === 'inquisitors') jumpToSpread(9);
  };

  // Page slider change
  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    jumpToSpread(val);
  };

  // Active monster in Bestiary
  const activeMonster = allMonstersList.find(m => m.id === selectedMonsterId) || allMonstersList[0];
  const isSelectedMonsterDiscovered = activeMonster ? isMonsterDiscovered(activeMonster) : false;

  // Active enemy in Inquisitor Dossier
  const activeEnemy = ENEMY_DOSSIER.find(e => e.id === selectedEnemyId) || ENEMY_DOSSIER[0];

  // Helper to render the contents of any spread (Left & Right pages)
  const renderSpreadContent = (targetSpread) => {
    switch (targetSpread) {
      /* ==================== SPREAD 0: CHRONICLE CHAPTERS 1 & 2 ==================== */
      case 0:
        return (
          <>
            {/* Left Page: Chapter 1 */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Chapter I: Lore</span>
                <h2 className="page-heading">The Banished Alchemist</h2>
                <div className="page-divider">❖ ─── ❖</div>
              </div>

              <blockquote className="simple-quote">
                {CHRONICLE_CHAPTERS[0].quote}
              </blockquote>

              <div className="simple-story-card">
                <h3 className="story-card-title">⚰️ Why You Were Exiled</h3>
                <p className="story-card-text">{CHRONICLE_CHAPTERS[0].content[0].text}</p>
              </div>

              <div className="simple-story-card">
                <h3 className="story-card-title">🌑 Your Dark Mission</h3>
                <p className="story-card-text">{CHRONICLE_CHAPTERS[0].content[1].text}</p>
              </div>

              <div className="page-footer-simple">
                <span>The Necromancer's Chronicle</span>
                <span>Page 1</span>
              </div>
            </div>

            {/* Right Page: Chapter 2 Reagents */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Chapter II: Reagents</span>
                <h2 className="page-heading">The 6 Core Elements</h2>
                <div className="page-divider">⚗️ ─── ⚗️</div>
              </div>

              <p className="simple-intro-hint">
                Every creature in this book is synthesized from <strong>two reagents</strong> in your cauldron:
              </p>

              <div className="reagents-compact-grid">
                {CHRONICLE_CHAPTERS[1].content[1].items.map(item => (
                  <div key={item.name} className="reagent-compact-item">
                    <div className="reagent-mini-icon">
                      <ItemIcon src={`/assets/ingredients/${item.icon}`} alt={item.name} />
                    </div>
                    <div className="reagent-mini-desc">
                      <strong>{item.name}</strong>
                      <span>{item.role}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 2</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 1: CHRONICLE CHAPTERS 3 & 4 ==================== */
      case 1:
        return (
          <>
            {/* Left Page: Chapter 3 Rules */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Chapter III: Alchemy</span>
                <h2 className="page-heading">Golden Rules of Crafting</h2>
                <div className="page-divider">📜 ─── 📜</div>
              </div>

              <div className="rules-cards-stack">
                <div className="rule-card">
                  <span className="rule-num">1</span>
                  <div>
                    <strong>Basic Synthesis:</strong>
                    <p>Combine any 2 ingredients in the Cauldron to synthesize a new minion.</p>
                  </div>
                </div>

                <div className="rule-card highlight-gold">
                  <span className="rule-num">2</span>
                  <div>
                    <strong>Living Fusion (2.5x Stats!):</strong>
                    <p>Merge 2 living monsters to create a Boss-tier Legendary Horror.</p>
                  </div>
                </div>

                <div className="rule-card highlight-red">
                  <span className="rule-num">3</span>
                  <div>
                    <strong>Taboo of Twins (Cannot Fuse Same):</strong>
                    <p>Never mix two identical minions—their souls violently repel.</p>
                  </div>
                </div>

                <div className="rule-card highlight-green">
                  <span className="rule-num">4</span>
                  <div>
                    <strong>Dark Altar of Sacrifice:</strong>
                    <p>Dissolve unneeded monsters to earn Gold and buy rare materials!</p>
                  </div>
                </div>
              </div>

              <div className="page-footer-simple">
                <span>Page 3</span>
              </div>
            </div>

            {/* Right Page: Chapter 4 Arena */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Chapter IV: Combat</span>
                <h2 className="page-heading">Arena Battle Guide</h2>
                <div className="page-divider">⚔️ ─── ⚔️</div>
              </div>

              <div className="rules-cards-stack">
                <div className="rule-card">
                  <span className="rule-num">⚡</span>
                  <div>
                    <strong>Speed Hits First:</strong>
                    <p>Fast minions strike before enemies can react. Speed can win fights before taking a hit!</p>
                  </div>
                </div>

                <div className="rule-card">
                  <span className="rule-num">🛡️</span>
                  <div>
                    <strong>Bypassing High Defense:</strong>
                    <p>Heavy knights have high Defense. Use Magic Missiles (Arcane Familiar) or Poison to pierce shields.</p>
                  </div>
                </div>

                <div className="rule-card highlight-gold">
                  <span className="rule-num">👑</span>
                  <div>
                    <strong>The 3-Monster Warband:</strong>
                    <p>Pair 1 High-Health Tank (Iron Golem) with 2 High-Damage Attackers (Revenant / Nether Lich).</p>
                  </div>
                </div>
              </div>

              {setCurrentTab && (
                <button className="simple-action-btn" onClick={() => { playClick(); setCurrentTab('laboratory'); }}>
                  🔥 Go to Laboratory Cauldron
                </button>
              )}

              <div className="page-footer-simple">
                <span>Page 4</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 2: COOKBOOK BASIC 1 - 5 ==================== */
      case 2:
        return (
          <>
            {/* Left Page: Formulas 1 to 3 */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Ingredients</span>
                <h2 className="page-heading">Formulas I – III</h2>
                <div className="page-divider">🧪 ─── 🧪</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(0, 3).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Alchemical Cookbook</span>
                <span>Page 5</span>
              </div>
            </div>

            {/* Right Page: Formulas 4 & 5 + Quick Links */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Ingredients</span>
                <h2 className="page-heading">Formulas IV – V</h2>
                <div className="page-divider">🧪 ─── 🧪</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(3, 5).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              <div className="simple-cookbook-tip-box">
                <strong>💡 Alchemist's Tip:</strong>
                <p>Missing an ingredient? You can buy Bone, Ash, Iron, Crystal, Shadow, and Cursed Herb from the Black Market in the Spoils tab!</p>
              </div>

              <div className="page-footer-simple">
                <span>Page 6</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 3: COOKBOOK BASIC 6 - 10 ==================== */
      case 3:
        return (
          <>
            {/* Left Page: Formulas 6 to 8 */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Ingredients</span>
                <h2 className="page-heading">Formulas VI – VIII</h2>
                <div className="page-divider">🧪 ─── 🧪</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(5, 8).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 7</span>
              </div>
            </div>

            {/* Right Page: Formulas 9 & 10 */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Ingredients</span>
                <h2 className="page-heading">Formulas IX – X</h2>
                <div className="page-divider">🧪 ─── 🧪</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(8, 10).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              <div className="simple-cookbook-tip-box highlight">
                <strong>⚡ Next Step: Living Fusions!</strong>
                <p>Once you discover these basic minions, you can fuse two of them together on the next pages to awaken Legendary Bosses!</p>
              </div>

              <div className="page-footer-simple">
                <span>Page 8</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 4: COOKBOOK FUSIONS 1 - 4 ==================== */
      case 4:
        return (
          <>
            {/* Left Page: Fusions 1 & 2 */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Living Fusions</span>
                <h2 className="page-heading">Fusion Rites I – II</h2>
                <div className="page-divider">⚡ ─── ⚡</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(10, 12).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} isFusion />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Living Fusions</span>
                <span>Page 9</span>
              </div>
            </div>

            {/* Right Page: Fusions 3 & 4 */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Living Fusions</span>
                <h2 className="page-heading">Fusion Rites III – IV</h2>
                <div className="page-divider">⚡ ─── ⚡</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(12, 14).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} isFusion />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 10</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 5: COOKBOOK FUSIONS 5 - 8 ==================== */
      case 5:
        return (
          <>
            {/* Left Page: Fusions 5 & 6 */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Living Fusions</span>
                <h2 className="page-heading">Fusion Rites V – VI</h2>
                <div className="page-divider">⚡ ─── ⚡</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(14, 16).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} isFusion />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 11</span>
              </div>
            </div>

            {/* Right Page: Fusions 7 & 8 */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">Cookbook: Living Fusions</span>
                <h2 className="page-heading">Fusion Rites VII – VIII</h2>
                <div className="page-divider">⚡ ─── ⚡</div>
              </div>

              <div className="recipe-simple-list">
                {compiledRecipes.slice(16, 18).map(recipe => (
                  <RecipeSimpleCard key={recipe.id} recipe={recipe} isFusion />
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 12</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 6: BESTIARY CATALOG (COMMON & UNCOMMON) ==================== */
      case 6:
      case 7:
      case 8:
        return (
          <>
            {/* Left Page: Monster Catalog Index */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">The Living Bestiary</span>
                <h2 className="page-heading">Monster Index ({totalDiscoveredCount}/{allMonstersList.length})</h2>
                <div className="page-divider">💀 ─── 💀</div>
              </div>

              <div className="bestiary-compact-list">
                {allMonstersList.map(monster => {
                  const unlocked = isMonsterDiscovered(monster);
                  const isSelected = selectedMonsterId === monster.id;
                  return (
                    <div 
                      key={monster.id}
                      className={`bestiary-item-row ${isSelected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => { playClick(); setSelectedMonsterId(monster.id); }}
                    >
                      <div className="bestiary-thumb-box">
                        {unlocked ? (
                          <ItemIcon src={monster.isCustom ? monster.image : `/assets/monsters/${monster.image}`} alt={monster.name} />
                        ) : (
                          '?'
                        )}
                      </div>
                      <div className="bestiary-thumb-text">
                        <strong>{unlocked ? monster.name : 'Unknown Minion'}</strong>
                        <span className={`rarity-tag ${(monster.rarity || 'common').toLowerCase()}`}>{monster.rarity}</span>
                      </div>
                      {unlocked && (
                        <span className="sac-gold-tag">+{getMonsterSacrificeValue(monster)}g</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="page-footer-simple">
                <span>Click any creature to inspect</span>
                <span>Page {spreadIndex * 2 + 1}</span>
              </div>
            </div>

            {/* Right Page: Full Illuminated Monster Page */}
            <div className="grimoire-page page-right">
              {activeMonster && (
                isSelectedMonsterDiscovered ? (
                  <div className="monster-illumination-card-clean">
                    <div className="page-header-simple">
                      <span className={`rarity-badge-simple ${(activeMonster.rarity || 'common').toLowerCase()}`}>
                        {activeMonster.rarity}
                      </span>
                      <h2 className="monster-title-clean">{activeMonster.name}</h2>
                      <div className="page-divider">❖ ─── ❖</div>
                    </div>

                    <div className="monster-portrait-center">
                      <div className="monster-frame-box">
                        <ItemIcon src={activeMonster.isCustom ? activeMonster.image : `/assets/monsters/${activeMonster.image}`} alt={activeMonster.name} />
                      </div>
                      <div className="monster-sacrifice-pill">
                        🪙 Dark Altar Value: <strong>+{getMonsterSacrificeValue(activeMonster)} Gold</strong>
                      </div>
                    </div>

                    <div className="monster-stat-bars-clean">
                      <div className="stat-clean-row">
                        <span>❤️ Health:</span>
                        <div className="stat-clean-track"><div className="stat-clean-fill fill-hp" style={{ width: `${Math.min(100, (activeMonster.hp / 250) * 100)}%` }}></div></div>
                        <strong>{activeMonster.hp}</strong>
                      </div>
                      <div className="stat-clean-row">
                        <span>⚔️ Attack:</span>
                        <div className="stat-clean-track"><div className="stat-clean-fill fill-atk" style={{ width: `${Math.min(100, (activeMonster.attack / 150) * 100)}%` }}></div></div>
                        <strong>{activeMonster.attack}</strong>
                      </div>
                      <div className="stat-clean-row">
                        <span>🛡️ Defense:</span>
                        <div className="stat-clean-track"><div className="stat-clean-fill fill-def" style={{ width: `${Math.min(100, (activeMonster.defense / 50) * 100)}%` }}></div></div>
                        <strong>{activeMonster.defense}</strong>
                      </div>
                      <div className="stat-clean-row">
                        <span>⚡ Speed:</span>
                        <div className="stat-clean-track"><div className="stat-clean-fill fill-spd" style={{ width: `${Math.min(100, (activeMonster.speed / 40) * 100)}%` }}></div></div>
                        <strong>{activeMonster.speed}</strong>
                      </div>
                    </div>

                    <div className="monster-clean-ability">
                      <strong>✨ Ability: {activeMonster.ability.split(' - ')[0]}</strong>
                      <p>{activeMonster.ability.split(' - ')[1] || activeMonster.ability}</p>
                    </div>

                    <div className="monster-clean-lore">
                      <em>"{activeMonster.description}"</em>
                    </div>
                  </div>
                ) : (
                  <div className="undiscovered-clean-view">
                    <div className="page-header-simple">
                      <span className="page-badge">Sealed Horror</span>
                      <h2 className="page-heading">Not Yet Discovered</h2>
                      <div className="page-divider">🔒 ─── 🔒</div>
                    </div>

                    <div className="mystery-big-box">?</div>
                    <p className="mystery-clean-text">This creature hasn't been created yet!</p>
                    <div className="mystery-clean-hint">
                      <strong>How to unlock:</strong>
                      <p>Check the <strong>Cookbook</strong> tab for ingredient recipes or try fusing two monsters in your Cauldron.</p>
                    </div>

                    {setCurrentTab && (
                      <button className="simple-action-btn" onClick={() => { playClick(); setCurrentTab('laboratory'); }}>
                        🔥 Go to Cauldron
                      </button>
                    )}
                  </div>
                )
              )}

              <div className="page-footer-simple">
                <span>Page {spreadIndex * 2 + 2}</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 9: INQUISITORS 1 - 3 ==================== */
      case 9:
        return (
          <>
            {/* Left Page: Inquisitor List */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">The Holy Crusade</span>
                <h2 className="page-heading">Church Opponents</h2>
                <div className="page-divider">⚔️ ─── ⚔️</div>
              </div>

              <p className="simple-intro-hint">
                These crusaders attack your lab in the Graveyard Arena. Learn their stats and weaknesses to defeat them:
              </p>

              <div className="bestiary-compact-list">
                {ENEMY_DOSSIER.map(enemy => (
                  <div 
                    key={enemy.id}
                    className={`bestiary-item-row unlocked ${selectedEnemyId === enemy.id ? 'selected' : ''}`}
                    onClick={() => { playClick(); setSelectedEnemyId(enemy.id); }}
                  >
                    <div className="bestiary-thumb-box">
                      <ItemIcon src={enemy.image} alt={enemy.name} />
                    </div>
                    <div className="bestiary-thumb-text">
                      <strong>{enemy.name}</strong>
                      <span style={{ color: '#cc394c', fontSize: '0.75rem', fontWeight: 'bold' }}>{enemy.threat}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="page-footer-simple">
                <span>Page 19</span>
              </div>
            </div>

            {/* Right Page: Selected Inquisitor Detail */}
            <div className="grimoire-page page-right">
              {activeEnemy && (
                <div className="monster-illumination-card-clean">
                  <div className="page-header-simple">
                    <span style={{ color: '#cc394c', fontWeight: 'bold', fontSize: '0.8rem' }}>{activeEnemy.threat}</span>
                    <h2 className="monster-title-clean">{activeEnemy.name}</h2>
                    <div className="page-divider">⚔️ ─── ⚔️</div>
                  </div>

                  <div className="monster-portrait-center">
                    <div className="monster-frame-box enemy-frame">
                      <ItemIcon src={activeEnemy.image} alt={activeEnemy.name} />
                    </div>
                    <span className="enemy-sub-title">{activeEnemy.title}</span>
                  </div>

                  <div className="monster-stat-bars-clean">
                    <div className="stat-clean-row">
                      <span>❤️ Health:</span>
                      <div className="stat-clean-track"><div className="stat-clean-fill fill-hp" style={{ width: `${Math.min(100, (activeEnemy.hp / 250) * 100)}%` }}></div></div>
                      <strong>{activeEnemy.hp}</strong>
                    </div>
                    <div className="stat-clean-row">
                      <span>⚔️ Attack:</span>
                      <div className="stat-clean-track"><div className="stat-clean-fill fill-atk" style={{ width: `${Math.min(100, (activeEnemy.attack / 150) * 100)}%` }}></div></div>
                      <strong>{activeEnemy.attack}</strong>
                    </div>
                    <div className="stat-clean-row">
                      <span>🛡️ Defense:</span>
                      <div className="stat-clean-track"><div className="stat-clean-fill fill-def" style={{ width: `${Math.min(100, (activeEnemy.defense / 50) * 100)}%` }}></div></div>
                      <strong>{activeEnemy.defense}</strong>
                    </div>
                    <div className="stat-clean-row">
                      <span>⚡ Speed:</span>
                      <div className="stat-clean-track"><div className="stat-clean-fill fill-spd" style={{ width: `${Math.min(100, (activeEnemy.speed / 40) * 100)}%` }}></div></div>
                      <strong>{activeEnemy.speed}</strong>
                    </div>
                  </div>

                  <div className="enemy-tactics-box">
                    <strong>🎯 Tactical Weakness:</strong>
                    <p>{activeEnemy.tactics}</p>
                  </div>
                </div>
              )}

              <div className="page-footer-simple">
                <span>Page 20</span>
              </div>
            </div>
          </>
        );

      /* ==================== SPREAD 10: INQUISITORS 4 - 6 ==================== */
      case 10:
      default:
        return (
          <>
            {/* Left Page: Boss Summary */}
            <div className="grimoire-page page-left">
              <div className="page-header-simple">
                <span className="page-badge">Boss Warnings</span>
                <h2 className="page-heading">The Supreme Bosses</h2>
                <div className="page-divider">🔥 ─── 🔥</div>
              </div>

              <div className="simple-story-card">
                <h3 className="story-card-title" style={{ color: '#d4a73e' }}>🛡️ Paladin Commander (Rank V)</h3>
                <p className="story-card-text">
                  Boasts 250 HP and 40 Defense. Do not fight him with basic skeletons! Bring a Dread Juggernaut or Venomous Behemoth to withstand his strikes.
                </p>
              </div>

              <div className="simple-story-card">
                <h3 className="story-card-title" style={{ color: '#cc394c' }}>🔥 High Archmage (Supreme Boss)</h3>
                <p className="story-card-text">
                  With 150 Attack and 30 Speed, he strikes first and can wipe out unprotected minions in seconds. Deploy Void Stalkers or Abyssal Warlords with Life Drain!
                </p>
              </div>

              <div className="page-footer-simple">
                <span>Page 21</span>
              </div>
            </div>

            {/* Right Page: Alchemical Seal */}
            <div className="grimoire-page page-right">
              <div className="page-header-simple">
                <span className="page-badge">The Final Folio</span>
                <h2 className="page-heading">The Undead Mastery</h2>
                <div className="page-divider">💀 ─── 💀</div>
              </div>

              <div className="final-seal-box">
                <div className="final-seal-glyph">🜏</div>
                <h3>The Grimoire is Complete</h3>
                <p>
                  Consult this tome whenever you need recipes, combat advice, or creature stats. Now step into the Cauldron chamber and let your dark magic flourish!
                </p>

                {setCurrentTab && (
                  <button className="simple-action-btn" onClick={() => { playClick(); setCurrentTab('laboratory'); }}>
                    🔥 Return to Laboratory
                  </button>
                )}
              </div>

              <div className="page-footer-simple">
                <span>Page 22</span>
              </div>
            </div>
          </>
        );
    }
  };

  const activeRibbonInfo = useMemo(() => {
    switch (activeRibbon) {
      case 'chronicle':
        return {
          title: "THE NECROMANCER'S CHRONICLE",
          subtitle: 'Story, Origins & Corpse-Crafting Laws',
          icon: '📜',
          colorClass: 'glory-chronicle'
        };
      case 'cookbook':
        return {
          title: 'ALCHEMICAL COOKBOOK',
          subtitle: 'Synthesis Recipes & Living Fusions',
          icon: '🧪',
          colorClass: 'glory-cookbook'
        };
      case 'bestiary':
        return {
          title: 'THE LIVING BESTIARY',
          subtitle: 'Creature Compendium & Field Observations',
          icon: '💀',
          colorClass: 'glory-bestiary'
        };
      case 'inquisitors':
        return {
          title: 'INQUISITOR DOSSIER',
          subtitle: 'Holy Order Threats & Tactical Weaknesses',
          icon: '⚔️',
          colorClass: 'glory-inquisitors'
        };
      default:
        return { title: 'GRIMOIRE', subtitle: '', icon: '📖', colorClass: '' };
    }
  }, [activeRibbon]);

  return (
    <div className="grimoire-viewport">
      <div className="grimoire-desk">

        {/* Ribbon Bookmark Tabs along the top */}
        <div className="grimoire-ribbons">
          <button 
            className={`grimoire-ribbon ribbon-chronicle ${activeRibbon === 'chronicle' ? 'active glorious-active glory-glow-chronicle' : ''}`}
            onClick={() => handleRibbonClick('chronicle')}
            title="Chronicle & Story (Pages 1 - 4)"
          >
            <span className="ribbon-icon">📜</span>
            <span className="ribbon-text">Story & Rules</span>
          </button>

          <button 
            className={`grimoire-ribbon ribbon-recipes ${activeRibbon === 'cookbook' ? 'active glorious-active glory-glow-cookbook' : ''}`}
            onClick={() => handleRibbonClick('cookbook')}
            title="Alchemical Cookbook: Recipes & Fusions (Pages 5 - 12)"
          >
            <span className="ribbon-icon">🧪</span>
            <span className="ribbon-text">Cookbook ({compiledRecipes.filter(r => r.isUnlocked).length}/{compiledRecipes.length})</span>
          </button>

          <button 
            className={`grimoire-ribbon ribbon-bestiary ${activeRibbon === 'bestiary' ? 'active glorious-active glory-glow-bestiary' : ''}`}
            onClick={() => handleRibbonClick('bestiary')}
            title="The Living Bestiary (Pages 13 - 18)"
          >
            <span className="ribbon-icon">💀</span>
            <span className="ribbon-text">Bestiary ({totalDiscoveredCount}/{allMonstersList.length})</span>
          </button>

          <button 
            className={`grimoire-ribbon ribbon-enemies ${activeRibbon === 'inquisitors' ? 'active glorious-active glory-glow-inquisitors' : ''}`}
            onClick={() => handleRibbonClick('inquisitors')}
            title="The Inquisitor Dossier (Pages 19 - 22)"
          >
            <span className="ribbon-icon">⚔️</span>
            <span className="ribbon-text">Inquisitors</span>
          </button>
        </div>

        {/* 3D Animated Open Tome Structure */}
        <div className="grimoire-book-wrapper">
          <div className="grimoire-book-cover">
            <div className="grimoire-leather-trim">

              {/* Glorious Active Chapter Banner Bar at the very top of the parchment spread */}
              <div className={`active-chapter-glory-bar ${activeRibbonInfo.colorClass}`}>
                <span className="glory-sparkle-glyph">✨</span>
                <span className="glory-icon-symbol">{activeRibbonInfo.icon}</span>
                <span className="glory-chapter-name">{activeRibbonInfo.title}</span>
                <span className="glory-chapter-sep">·</span>
                <span className="glory-chapter-sub">{activeRibbonInfo.subtitle}</span>
                <span className="glory-sparkle-glyph">✨</span>
              </div>

              {/* Central Spine shadow */}
              <div className="grimoire-spine-fold"></div>

              {/* 1. Underlying Stationary Base Pages */}
              <div className="grimoire-spread base-spread">
                {renderSpreadContent(flipState ? flipState.toSpread : spreadIndex)}
              </div>

              {/* 2. 3D Turning Page Leaf during flip animation */}
              {flipState && (
                <div className={`page-flipper-container flip-${flipState.direction}`}>
                  {/* Forward Flip (Right page curls and flips over to Left) */}
                  {flipState.direction === 'forward' && (
                    <div className="page-flip-leaf leaf-forward">
                      {/* Front face of flipping leaf: Current Right Page */}
                      <div className="flip-face flip-front">
                        {renderSpreadContent(flipState.fromSpread).props.children[1]}
                        <div className="page-lighting-shadow"></div>
                      </div>
                      {/* Back face of flipping leaf: Incoming Left Page */}
                      <div className="flip-face flip-back">
                        {renderSpreadContent(flipState.toSpread).props.children[0]}
                        <div className="page-lighting-shadow"></div>
                      </div>
                    </div>
                  )}

                  {/* Backward Flip (Left page curls and flips over to Right) */}
                  {flipState.direction === 'backward' && (
                    <div className="page-flip-leaf leaf-backward">
                      {/* Front face of flipping leaf: Current Left Page */}
                      <div className="flip-face flip-front">
                        {renderSpreadContent(flipState.fromSpread).props.children[0]}
                        <div className="page-lighting-shadow"></div>
                      </div>
                      {/* Back face of flipping leaf: Incoming Right Page */}
                      <div className="flip-face flip-back">
                        {renderSpreadContent(flipState.toSpread).props.children[1]}
                        <div className="page-lighting-shadow"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Clickable Dog-ear Page Flip Hitboxes on left & right sides (like archive.org) */}
              <div 
                className="page-turn-zone zone-left"
                onClick={() => flipBackward()}
                title={spreadIndex > 0 ? "Flip Left (Previous Page)" : ""}
                style={{ cursor: spreadIndex > 0 ? 'pointer' : 'default' }}
              >
                {spreadIndex > 0 && <span className="zone-turn-hint">◀ Flip Left</span>}
              </div>

              <div 
                className="page-turn-zone zone-right"
                onClick={() => flipForward()}
                title={spreadIndex < TOTAL_SPREADS - 1 ? "Flip Right (Next Page)" : ""}
                style={{ cursor: spreadIndex < TOTAL_SPREADS - 1 ? 'pointer' : 'default' }}
              >
                {spreadIndex < TOTAL_SPREADS - 1 && <span className="zone-turn-hint">Flip Right ▶</span>}
              </div>

            </div>
          </div>
        </div>

        {/* Tactile Book Navigation Bar & Page Slider (Internet Archive Style) */}
        <div className="grimoire-controls-footer">
          <button 
            className="grimoire-turn-btn"
            onClick={() => flipBackward()}
            disabled={spreadIndex <= 0 || !!flipState}
            title="Previous Page (Arrow Left)"
          >
            ◀ Flip Left
          </button>

          {/* Smooth Digital Page Slider */}
          <div className="grimoire-slider-container">
            <span className="grimoire-slider-label">Spread:</span>
            <input 
              type="range"
              min="0"
              max={TOTAL_SPREADS - 1}
              value={spreadIndex}
              onChange={handleSliderChange}
              disabled={!!flipState}
              className="grimoire-page-slider"
              title="Drag to slide through the book"
            />
            <span className="grimoire-page-counter">
              Page {spreadIndex * 2 + 1} - {spreadIndex * 2 + 2} / 22
            </span>
          </div>

          <button 
            className="grimoire-turn-btn"
            onClick={() => flipForward()}
            disabled={spreadIndex >= TOTAL_SPREADS - 1 || !!flipState}
            title="Next Page (Arrow Right)"
          >
            Flip Right ▶
          </button>
        </div>

      </div>
    </div>
  );
}

// Subcomponent: Clean, Simple Recipe Card for the Cookbook
function RecipeSimpleCard({ recipe, isFusion = false }) {
  return (
    <div className={`recipe-simple-box ${recipe.isUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="recipe-simple-header">
        <span className="recipe-simple-title">{recipe.title}</span>
        <span className={`recipe-simple-tier ${(recipe.tier || 'common').toLowerCase()}`}>
          {recipe.tier}
        </span>
      </div>

      <div className="recipe-simple-equation">
        {/* Reagent 1 */}
        <div className="equation-slot">
          <ItemIcon 
            src={isFusion ? `/assets/monsters/${recipe.ing1?.image}` : `/assets/ingredients/${recipe.ing1?.image}`} 
            alt={recipe.ing1?.name} 
          />
          <span>{recipe.ing1?.name}</span>
        </div>

        <div className="equation-symbol">+</div>

        {/* Reagent 2 */}
        <div className="equation-slot">
          <ItemIcon 
            src={isFusion ? `/assets/monsters/${recipe.ing2?.image}` : `/assets/ingredients/${recipe.ing2?.image}`} 
            alt={recipe.ing2?.name} 
          />
          <span>{recipe.ing2?.name}</span>
        </div>

        <div className="equation-symbol glyph-arrow">➔</div>

        {/* Result Creature */}
        <div className={`equation-slot result-slot ${recipe.isUnlocked ? '' : 'locked-silhouette'}`}>
          {recipe.isUnlocked ? (
            recipe.result && (
              <ItemIcon 
                src={recipe.result.isCustom ? recipe.result.image : (isFusion ? recipe.result.image : `/assets/monsters/${recipe.result.image}`)} 
                alt={recipe.result.name} 
              />
            )
          ) : (
            <div className="equation-mystery-q">?</div>
          )}
          <strong>{recipe.isUnlocked ? recipe.result?.name : '??? Sealed ???'}</strong>
        </div>
      </div>

      <div className="recipe-simple-footer">
        {recipe.isUnlocked ? (
          <div className="recipe-unlocked-row">
            <span className="recipe-lore-note">"{recipe.lore}"</span>
            <div className="recipe-stat-mini-badges">
              <span>❤️ {recipe.result?.hp}</span>
              <span>⚔️ {recipe.result?.attack}</span>
              <span>🛡️ {recipe.result?.defense}</span>
              <span>⚡ {recipe.result?.speed}</span>
              {recipe.multiplier && <strong className="stat-multiplier">{recipe.multiplier}</strong>}
            </div>
          </div>
        ) : (
          <div className="recipe-riddle-row">
            <span className="riddle-tag">💡 Hint:</span>
            <span className="riddle-text">"{recipe.riddle}"</span>
          </div>
        )}
      </div>
    </div>
  );
}
