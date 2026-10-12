import { useState, useEffect, useRef } from 'react';
import ItemIcon from './ItemIcon';
import { MONSTERS, ENEMIES } from '../game/data';
import { generateBossImage } from '../game/api';
import { playHit, playVictoryMusic, playBattleWin, playBattleLose, pauseBgmForBattle, resumeBgmAfterBattle } from '../game/audio';

export default function BattleArena({ state, updateState, consumeMonsters, addRewards, setCurrentTab, onBattleStatusChange }) {
  const [team, setTeam] = useState([null, null, null]);
  const [inBattle, setInBattle] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [activeMonsterIndex, setActiveMonsterIndex] = useState(0);
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(0);
  
  const [combatState, setCombatState] = useState(null); // 'win', 'lose', null
  const [showTutorial, setShowTutorial] = useState(!state.hasSeenArenaTutorial);
  const [shakeTarget, setShakeTarget] = useState(null);
  const [isAbyssMode, setIsAbyssMode] = useState(false);
  const [abyssLevel, setAbyssLevel] = useState(1);
  const logEndRef = useRef(null);

  const closeTutorial = () => {
    setShowTutorial(false);
    updateState({ hasSeenArenaTutorial: true });
  };

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  useEffect(() => {
    return () => {
      // Resume background music if navigating away from the Arena
      resumeBgmAfterBattle();
      onBattleStatusChange?.({ inBattle: false, combatState: null });
    };
  }, []);

  const getAvailableCount = (id) => {
    const total = state.monsterInventory?.[id] || 0;
    const drafted = team.filter(m => (m?.id || m) === id).length;
    return total - drafted;
  };

  const handleSelectTeam = (slotIndex, monsterId) => {
    if (inBattle) return;
    setTeam(prev => {
      const newTeam = [...prev];
      newTeam[slotIndex] = monsterId;
      return newTeam;
    });
  };

  const startBattle = async () => {
    const activeTeam = team.map(id => {
      if (!id) return null;
      const mData = MONSTERS[id] || state.customMonsters[id];
      return mData ? { ...mData, currentHp: mData.maxHp } : null;
    });
    const draftedMonsters = activeTeam.filter(m => m !== null);
    
    if (draftedMonsters.length === 0) {
      setBattleLog(['You must select at least one monster to fight.']);
      return;
    }

    // Stop background music completely during battle
    pauseBgmForBattle();

    setInBattle(true);
    setCombatState(null);
    setTeam(activeTeam);
    onBattleStatusChange?.({ inBattle: true, combatState: null });
    
    let generatedEnemyTeam = [];
    
    if (isAbyssMode) {
      setBattleLog([`Gazing into the DreamLayer Abyss (Level ${abyssLevel})...`, 'The AI is forming a new horror...']);
      
      const bossImageUrl = await generateBossImage(abyssLevel);
      let finalImageUrl = bossImageUrl;
      
      if (!bossImageUrl) {
        const abyssBossImages = ['/assets/abyss/abyss_boss_1.png', '/assets/abyss/abyss_boss_2.png', '/assets/abyss/abyss_boss_3.png'];
        const bossIndex = (abyssLevel - 1) % abyssBossImages.length;
        finalImageUrl = abyssBossImages[bossIndex];
      }

      generatedEnemyTeam = [{
        id: `abyss_boss_${abyssLevel}`,
        name: `Abyssal Horror LVL ${abyssLevel}`,
        image: finalImageUrl,
        isCustom: true,
        maxHp: 40 + (abyssLevel * 20), currentHp: 40 + (abyssLevel * 20),
        attack: 5 + (abyssLevel * 5),
        defense: 2 + (abyssLevel * 3),
        power: 100 * abyssLevel
      }];
      setBattleLog(prev => [...prev, `A terrifying nightmare emerges from the Abyss!`]);
    } else {
      let playerPower = 0;
      let playerDefense = 0;
      draftedMonsters.forEach(m => {
        playerPower += (m.maxHp + m.attack + m.defense);
        playerDefense += m.defense;
      });

      const numEnemies = draftedMonsters.length;
      const enemyPowers = ENEMIES.map(e => ({ ...e, power: e.maxHp + e.attack + e.defense }));
      const targetPower = playerPower * 1.05;
      
      let bestCombo = [];
      let bestScore = Infinity;
      const avgPlayerDef = playerDefense / numEnemies;

      const findCombinations = (start, combo) => {
        if (combo.length === numEnemies) {
          let comboPower = 0;
          let comboDef = 0;
          combo.forEach(e => {
            comboPower += e.power;
            comboDef += e.defense;
          });
          const powerDiff = Math.abs(comboPower - targetPower);
          const avgEnemyDef = comboDef / numEnemies;
          let tankPenalty = 0;
          if (avgPlayerDef >= 15 && avgEnemyDef >= 15) tankPenalty = 5000;
          const score = powerDiff + tankPenalty;
          
          if (score < bestScore) {
            bestScore = score;
            bestCombo = [...combo];
          }
          return;
        }
        for (let i = start; i < enemyPowers.length; i++) {
          findCombinations(i + 1, [...combo, enemyPowers[i]]);
        }
      };
      findCombinations(0, []);

      const shuffledCombo = [...bestCombo].sort(() => Math.random() - 0.5);
      generatedEnemyTeam = shuffledCombo.map((template, i) => ({ 
        ...template, 
        maxHp: template.hp, 
        currentHp: template.hp, 
        id: `enemy_${i}` 
      }));
      setBattleLog([`Battle started! A squad of ${numEnemies} enemies approaches.`]);
    }

    setEnemyTeam(generatedEnemyTeam);
    consumeMonsters([draftedMonsters[0].id]);
    
    const firstIdx = activeTeam.findIndex(m => m !== null);
    setActiveMonsterIndex(firstIdx);
    setActiveEnemyIndex(0);

    setTimeout(() => combatTick(activeTeam, generatedEnemyTeam, firstIdx, 0, 0), 1200);
  };

  const combatTick = (currentTeam, currentEnemyTeam, activeIdx, enemyIdx, turnCount = 0) => {
    let currentEnemy = currentEnemyTeam[enemyIdx];

    if (!currentEnemy || currentEnemy.currentHp <= 0) {
      const nextEnemyIdx = currentEnemyTeam.findIndex((e, i) => i > enemyIdx && e && e.currentHp > 0);
      if (nextEnemyIdx === -1) {
        handleWin(currentEnemyTeam);
        return;
      }
      enemyIdx = nextEnemyIdx;
      currentEnemy = currentEnemyTeam[enemyIdx];
      setActiveEnemyIndex(enemyIdx);
      addLog(`A new ${currentEnemy.name} steps up to fight!`);
      setTimeout(() => combatTick(currentTeam, currentEnemyTeam, activeIdx, enemyIdx, turnCount), 1200);
      return;
    }
    
    let activeMonster = currentTeam[activeIdx];
    if (!activeMonster || activeMonster.currentHp <= 0) {
      const nextIdx = currentTeam.findIndex((m, i) => i > activeIdx && m && m.currentHp > 0);
      if (nextIdx === -1) {
        handleLose();
        return;
      }
      activeIdx = nextIdx;
      activeMonster = currentTeam[activeIdx];
      setActiveMonsterIndex(activeIdx);
      consumeMonsters([activeMonster.id]);
      addLog(`${activeMonster.name} steps up!`);
      setTimeout(() => combatTick(currentTeam, currentEnemyTeam, activeIdx, enemyIdx, turnCount), 1200);
      return;
    }

    let logMsg = '';
    let frenzyDmg = Math.floor(turnCount / 4); 
    
    // Player Attacks
    let mDamage = Math.max(1, activeMonster.attack - currentEnemy.defense) + frenzyDmg;
    if (activeMonster.id === 'wraith' && Math.random() < 0.2) logMsg += `${activeMonster.name} phased through attack! `;
    if (activeMonster.id === 'arcane_familiar') { mDamage = activeMonster.attack + frenzyDmg; logMsg += `Magic Missile! `; }

    currentEnemy.currentHp -= mDamage;
    logMsg += `${activeMonster.name} hits ${currentEnemy.name} for ${mDamage}${frenzyDmg > 0 ? ` (+${frenzyDmg} Frenzy)` : ''}. `;
    
    playHit(activeMonster.id);
    
    setShakeTarget('enemy');
    setTimeout(() => setShakeTarget(null), 300);

    if (currentEnemy.currentHp <= 0) {
      currentEnemy.currentHp = 0;
      setEnemyTeam([...currentEnemyTeam]);
      addLog(logMsg);
      addLog(`${currentEnemy.name} was defeated!`);
      setTimeout(() => combatTick(currentTeam, currentEnemyTeam, activeIdx, enemyIdx, turnCount + 1), 1200);
      return;
    }

    // Enemy Attacks
    let eDamage = Math.max(1, currentEnemy.attack - activeMonster.defense) + frenzyDmg;
    if (activeMonster.id === 'armored_skeleton') { eDamage = Math.max(1, eDamage - 5); logMsg += `Armor absorbs hit. `; }
    
    let dodged = false;
    if (activeMonster.id === 'wraith' && Math.random() < 0.2) {
      dodged = true; eDamage = 0; logMsg += `Dodged! `;
    }

    if (!dodged) {
      activeMonster.currentHp -= eDamage;
      logMsg += `${currentEnemy.name} hits ${activeMonster.name} for ${eDamage}${frenzyDmg > 0 ? ` (+${frenzyDmg} Frenzy)` : ''}. `;
      
      playHit(currentEnemy.id);
      
      setShakeTarget('player');
      setTimeout(() => setShakeTarget(null), 300);

      if (activeMonster.id === 'crystal_wraith') {
        const recoil = Math.floor(eDamage / 2);
        currentEnemy.currentHp -= recoil;
        logMsg += `Crystals recoil ${recoil} dmg! `;
      }
    }

    addLog(logMsg);
    
    const newTeam = [...currentTeam];
    newTeam[activeIdx] = { ...activeMonster };
    setTeam(newTeam);
    setEnemyTeam([...currentEnemyTeam]);
    setActiveMonsterIndex(activeIdx);
    setActiveEnemyIndex(enemyIdx);

    setTimeout(() => combatTick(newTeam, currentEnemyTeam, activeIdx, enemyIdx, turnCount + 1), 1200);
  };

  const addLog = (msg) => {
    setBattleLog(prev => [...prev, msg]);
  };
  const handleWin = (finalEnemyTeam) => {
    addLog(`VICTORY! All enemies were defeated!`);
    
    if (isAbyssMode && abyssLevel === 10) {
      setCombatState('victory');
      playVictoryMusic();
      addLog('YOU HAVE CONQUERED THE DREAMLAYER ABYSS!');
    } else {
      setCombatState('win');
      playBattleWin();
    }
    onBattleStatusChange?.({ inBattle: true, combatState: 'win' });

    // Battle finished: automatically resume background music after victory cue
    setTimeout(() => {
      resumeBgmAfterBattle();
    }, 1200);
    
    setTimeout(() => {
      let totalEnemyPower = 0;
      finalEnemyTeam.forEach(e => { totalEnemyPower += (e.maxHp + e.attack + e.defense); });
      
      const multiplier = isAbyssMode ? 3 : finalEnemyTeam.length;
      const powerGold = Math.floor(totalEnemyPower * (0.1 + Math.random() * 0.15));
      const gold = Math.max(10, powerGold * (isAbyssMode ? 2 : 1));
      
      const ings = ['bone', 'ash', 'iron', 'crystal', 'shadow', 'cursed_herb'];
      const loot = [];
      for(let i = 0; i < multiplier; i++) {
        loot.push(ings[Math.floor(Math.random() * ings.length)]);
      }
      addRewards(gold, loot);
      
      const counts = {};
      loot.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
      const lootStr = Object.entries(counts).map(([id, q]) => `${q} ${id.replace('_', ' ')}`).join(', ');
      
      addLog(`Found ${gold} gold and ${lootStr}.`);
      if(isAbyssMode) {
          setAbyssLevel(prev => prev + 1);
          addLog('You have delved deeper into the Abyss...');
      }
    }, 1000);
  };

  const handleLose = () => {
    addLog(`Your team was wiped out...`);
    setCombatState('lose');
    playBattleLose();
    onBattleStatusChange?.({ inBattle: true, combatState: 'lose' });
    // Battle finished: automatically resume background music after defeat cue
    setTimeout(() => {
      resumeBgmAfterBattle();
    }, 1200);
  };

  const resetArena = () => {
    setInBattle(false);
    setCombatState(null);
    setBattleLog([]);
    setEnemyTeam([]);
    setTeam([null, null, null]);
    resumeBgmAfterBattle();
    onBattleStatusChange?.({ inBattle: false, combatState: null });
  };

  const activeEnemy = enemyTeam[activeEnemyIndex];

  return (
    <div className="screen">
      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span>Your Team</span>
          <button 
            onClick={() => setShowTutorial(true)} 
            style={{ background: 'none', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Rules
          </button>
        </div>
        
        {!inBattle && !state.hasDismissedArenaHint && (
          <div style={{ padding: '10px', background: 'rgba(212, 167, 62, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>How to play:</strong> Click any monster in the roster at the bottom to add it to your team. <strong>Monsters are only consumed if they enter combat.</strong>
            </div>
            <button 
              className="btn-primary" 
              style={{ marginLeft: '15px', padding: '5px 15px', fontSize: '0.8rem', minWidth: '60px' }}
              onClick={() => updateState({ hasDismissedArenaHint: true })}
            >
              OK
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexShrink: 0 }}>
          {[0, 1, 2].map(slotIdx => {
            const m = team[slotIdx];
            const isObj = m && typeof m === 'object';
            const mData = isObj ? m : (m ? (MONSTERS[m] || state.customMonsters[m]) : null);
            const isActive = inBattle && activeMonsterIndex === slotIdx;
            
            return (
              <div 
                key={slotIdx} 
                className="panel" 
                style={{ 
                  padding: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  background: 'rgba(0,0,0,0.5)',
                  borderColor: isActive ? 'var(--accent-green)' : (mData?.currentHp <= 0 ? 'var(--accent-red)' : 'var(--border-color)')
                }}
              >
                <div className="item-slot" style={{ width: '60px', height: '60px', opacity: mData?.currentHp <= 0 ? 0.3 : 1 }}>
                  {mData ? <ItemIcon src={mData.isCustom ? mData.image : `/assets/monsters/${mData.image}`} alt={mData.name} /> : 'Empty'}
                </div>
                
                <div style={{ flex: 1 }}>
                  {mData ? (
                    <>
                      <div style={{ fontWeight: 'bold' }}>{mData.name}</div>
                      {inBattle && isObj ? (
                        <div style={{ marginTop: '5px' }}>
                          <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>HP: {Math.max(0, mData.currentHp)} / {mData.maxHp}</div>
                          <div style={{ width: '100%', background: '#222', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(0, (mData.currentHp / mData.maxHp) * 100)}%`, background: 'var(--accent-green)', height: '100%', transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mData.isCustom ? 'Custom' : 'LVL 1'}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Select from roster below</div>
                  )}
                </div>
                
                {!inBattle && (
                  <button 
                    className="btn-primary" 
                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                    onClick={() => handleSelectTeam(slotIdx, null)}
                  >
                    Clear
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!inBattle && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
            <div className="panel-header" style={{ border: 'none', fontSize: '1.2rem', flexShrink: 0 }}>Available Roster</div>
            
            <div className="inventory-grid" style={{ paddingRight: '5px' }}>
              {(() => {
                const uniqueMap = new Map();
                const allIds = Array.from(new Set([...state.discoveredMonsters, ...Object.keys(state.customMonsters || {})]));
                
                for (const id of allIds) {
                  const m = MONSTERS[id] || state.customMonsters?.[id];
                  if (!m) continue;
                  const key = m.name || id;
                  if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, { primaryId: id, monster: m });
                  }
                }

                return Array.from(uniqueMap.values()).map(({ primaryId: id, monster: m }) => {
                  const available = getAvailableCount(id);
                  return (
                    <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div 
                        className="item-slot" 
                        style={{ opacity: available > 0 ? 1 : 0.3, cursor: available > 0 ? 'pointer' : 'not-allowed', borderColor: m.isCustom ? 'var(--accent-red)' : '' }}
                        onClick={() => {
                          if (available <= 0) return;
                          const emptySlot = team.findIndex(s => s === null);
                          if (emptySlot !== -1) handleSelectTeam(emptySlot, id);
                        }}
                        title={m.name}
                      >
                        <ItemIcon src={m.isCustom ? m.image : `/assets/monsters/${m.image}`} alt={m.name} />
                        <div className="item-count">{available}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={() => { setIsAbyssMode(false); startBattle(); }}
                disabled={team.every(m => m === null)}
                >
                Normal Battle
                </button>

                <button 
                className="btn-primary" 
                style={{ flex: 1, background: 'var(--accent-red)', borderColor: '#fff' }}
                onClick={() => { setIsAbyssMode(true); startBattle(); }}
                disabled={team.every(m => m === null)}
                >
                DreamLayer Abyss (Lv. {abyssLevel})
                </button>
            </div>
          </div>
        )}
        
        {combatState && combatState !== 'victory' && (
          <button className="btn-primary mt-2" onClick={() => {
            const wasWin = combatState === 'win';
            resetArena();
            if (wasWin && setCurrentTab) {
              setCurrentTab('rewards');
            }
          }}>
            {combatState === 'win' ? 'Claim Rewards & Return' : 'Retreat & Regroup'}
          </button>
        )}
      </div>

      <div className="panel" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        <div className="panel-header" style={{ flexShrink: 0 }}>{isAbyssMode ? 'The DreamLayer Abyss' : 'The Graveyard Arena'}</div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative' }}>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {inBattle && team[activeMonsterIndex] && team[activeMonsterIndex].currentHp > 0 ? (
                <>
                  <div className={shakeTarget === 'player' ? 'anim-shake' : ''} style={{ width: '150px', height: '150px', transition: 'transform 0.1s' }}>
                     <ItemIcon src={team[activeMonsterIndex].isCustom ? team[activeMonsterIndex].image : `/assets/monsters/${team[activeMonsterIndex].image}`} alt="Active Monster" />
                  </div>
                  <div style={{ marginTop: '10px', fontWeight: 'bold' }}>{team[activeMonsterIndex].name}</div>
                  <div style={{ width: '120px', background: '#222', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '5px', border: '1px solid #444' }}>
                    <div style={{ width: `${Math.max(0, (team[activeMonsterIndex].currentHp / team[activeMonsterIndex].maxHp) * 100)}%`, background: 'var(--accent-green)', height: '100%', transition: 'width 0.3s' }}></div>
                  </div>
                </>
              ) : (
                <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  {inBattle ? 'Defeated' : 'Waiting...'}
                </div>
              )}
           </div>
           
           <div style={{ fontSize: '2rem', color: 'var(--accent-red)', fontWeight: 'bold' }}>VS</div>
           
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: activeEnemy?.currentHp <= 0 ? 0.3 : 1 }}>
              {activeEnemy ? (
                <>
                  <div className={shakeTarget === 'enemy' ? 'anim-shake' : ''} style={{ width: '150px', height: '150px', transition: 'transform 0.1s' }}>
                     <ItemIcon src={activeEnemy.isCustom ? activeEnemy.image : (activeEnemy.image.startsWith('/') ? activeEnemy.image : `/assets/enemies/${activeEnemy.image}`)} alt={activeEnemy.name} />
                  </div>
                  <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                    {activeEnemy.name} {enemyTeam.length > 1 ? `(${activeEnemyIndex + 1}/${enemyTeam.length})` : ''}
                  </div>
                  <div style={{ width: '120px', background: '#222', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '5px', border: '1px solid #444' }}>
                    <div style={{ width: `${Math.max(0, (activeEnemy.currentHp / activeEnemy.maxHp) * 100)}%`, background: 'var(--accent-red)', height: '100%', transition: 'width 0.3s' }}></div>
                  </div>
                </>
              ) : (
                <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  ???
                </div>
              )}
           </div>
        </div>

        <div style={{ 
          flex: 1, minHeight: 0, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--border-color)', 
          borderRadius: '4px', padding: '10px', marginTop: '20px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'monospace'
        }}>
          {battleLog.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Combat log...</span>}
          {battleLog.map((log, i) => (
            <div key={i} style={{ color: log.includes('VICTORY') || log.includes('wiped') ? 'var(--accent-gold)' : (log.includes('Nightmare') || log.includes('Abyss') ? 'var(--accent-red)' : 'var(--text-main)') }}>
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {showTutorial && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '20px' }}>The Graveyard Arena</h2>
            <p style={{ marginBottom: '15px' }}>Welcome to the Arena! This is an <strong>Auto-Battler</strong>.</p>
            <ul style={{ textAlign: 'left', marginBottom: '20px', paddingLeft: '20px', color: 'var(--text-muted)' }}>
              <li style={{ marginBottom: '10px' }}><strong>1. Draft your team:</strong> Click on any monster in the roster.</li>
              <li style={{ marginBottom: '10px' }}><strong>2. Risk and Reward:</strong> Every monster that <strong>steps up to fight</strong> is consumed and lost. Unused backup monsters are kept!</li>
              <li><strong>3. DreamLayer Abyss:</strong> Test your might against infinite AI-generated horrors for massive rewards!</li>
            </ul>
            <button className="btn-primary" onClick={closeTutorial}>Enter the Arena</button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {combatState === 'victory' && (
        <div className="modal-overlay" style={{ zIndex: 100, background: 'rgba(20, 10, 0, 0.9)' }}>
          <div className="modal-content" style={{ border: '2px solid var(--accent-gold)', boxShadow: '0 0 40px rgba(212, 167, 62, 0.5)', maxWidth: '600px' }}>
            <h1 style={{ color: 'var(--accent-gold)', marginBottom: '20px', fontSize: '3rem', fontFamily: 'Cinzel, serif', textShadow: '0 0 20px var(--accent-gold)' }}>VICTORY</h1>
            
            <p style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-main)', lineHeight: '1.6' }}>
              You have vanquished the true nightmare at the bottom of the DreamLayer Abyss. Your mastery of dark magic is absolute, and your undead legions rule the realm.
            </p>
            
            <p style={{ fontSize: '1rem', marginBottom: '30px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              You may continue exploring the endless Abyss, or retreat to your laboratory to create even greater horrors...
            </p>
            
            <button className="btn-primary" onClick={resetArena} style={{ padding: '15px 40px', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(212, 167, 62, 0.3)' }}>
              Claim Infinite Glory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
