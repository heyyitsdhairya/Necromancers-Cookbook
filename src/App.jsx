import { useState, useEffect } from 'react';
import Laboratory from './components/Laboratory';
import Grimoire from './components/Grimoire';
import BattleArena from './components/BattleArena';
import { useGameState } from './game/logic';
import { INGREDIENTS, RECIPES } from './game/data';
import { playClick, restartBackgroundMusic, setMusicMuted } from './game/audio';
import './index.css';

export default function App() {
  const { state, updateState, consumeIngredients, addDiscoveredMonster, addCustomMonster, consumeMonsters, addRewards, addUnclaimedReward, claimAllRewards, buyIngredient, resetProgress } = useGameState();
  const [currentTab, setCurrentTab] = useState('laboratory'); // laboratory, codex, arena, rewards
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTitleScreen, setShowTitleScreen] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [battleStatus, setBattleStatus] = useState({ inBattle: false, combatState: null });
  const [delayedGameOverAllowed, setDelayedGameOverAllowed] = useState(false);
  const [grimoireSpread, setGrimoireSpread] = useState(0);

  const openGrimoire = (section = null) => {
    if (section === 'cookbook') setGrimoireSpread(2);
    else if (section === 'bestiary') setGrimoireSpread(6);
    else if (section === 'inquisitors') setGrimoireSpread(9);
    else if (section === 'chronicle') setGrimoireSpread(0);
    // If section is null, user clicked Grimoire nav button: preserve current spread where user left off!
    setCurrentTab('codex');
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Don't play click sound if they clicked exactly on a button that might handle it itself, 
      // or just play a very subtle click everywhere.
      if (e.target.tagName === 'BUTTON' || e.target.closest('.item-slot')) {
        playClick();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const getBackgroundClass = () => {
    if (currentTab === 'laboratory') return 'bg-laboratory';
    if (currentTab === 'arena') return 'bg-arena';
    return '';
  };

  const arenaUnlocked = state.discoveredMonsters.length >= 2;
  const unclaimedCount = state.unclaimedRewards?.length || 0;
  const hasProgress = state.discoveredMonsters.length > 0 || state.battlesWon > 0 || state.gold > 0;

  // If arena is locked, ensure the user is redirected to laboratory
  useEffect(() => {
    if (currentTab === 'arena' && !arenaUnlocked) {
      setCurrentTab('laboratory');
    }
  }, [currentTab, arenaUnlocked]);

  // Handle delay after losing battle so game over does not appear instantly
  useEffect(() => {
    let timer = null;
    if (battleStatus.inBattle && battleStatus.combatState === 'lose') {
      // Fight ended and player lost: wait 3.5 seconds so defeat message and sound play out first
      timer = setTimeout(() => {
        setDelayedGameOverAllowed(true);
      }, 3500);
    } else if (!battleStatus.inBattle) {
      // Out of battle / retreated
      setDelayedGameOverAllowed(true);
    } else {
      // In battle and still fighting / won
      setDelayedGameOverAllowed(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [battleStatus.inBattle, battleStatus.combatState]);

  const checkGameOver = () => {
    if (showTitleScreen) return false;
    
    // Never show game over while battle is actively ongoing
    if (battleStatus.inBattle && battleStatus.combatState !== 'lose') return false;

    // After losing a battle, do not show game over immediately
    if (battleStatus.inBattle && battleStatus.combatState === 'lose' && !delayedGameOverAllowed) {
      return false;
    }

    // 1. Any monsters available?
    const monsterCount = Object.values(state.monsterInventory || {}).reduce((a, b) => a + b, 0);
    if (monsterCount > 0) return false;

    // 2. Any unclaimed rewards?
    if (state.unclaimedRewards?.length > 0) return false;

    // 3. Can afford cheapest ingredient?
    const minCost = Math.min(...Object.values(INGREDIENTS).map(i => i.cost));
    if (state.gold >= minCost) return false;

    // 4. Can craft anything?
    for (let r of RECIPES) {
      if ((state.inventory?.[r.ing1] > 0) && (state.inventory?.[r.ing2] > 0)) {
        return false;
      }
    }
    
    return true;
  };

  const isGameOver = checkGameOver();

  if (showTitleScreen) {
    return (
      <div className={`title-screen ${isFadingOut ? 'fade-out' : ''}`} style={{ backgroundImage: 'url(./assets/backgrounds/laboratory.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        
        <div className="particles-container">
           {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i} 
                className="particle" 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  animationDelay: `${Math.random() * 5}s`, 
                  animationDuration: `${3 + Math.random() * 5}s` 
                }}
              ></div>
           ))}
        </div>

        <div className="title-content" style={{ zIndex: 2 }}>
          <h1 className="title-header">NECROMANCER'S</h1>
          <div className="title-subtitle">C O O K B O O K</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '-20px', marginBottom: '30px', fontStyle: 'italic' }}>
            An Unholy Guide to Creature Creation
          </div>
          <button 
            className="btn-primary" 
            onClick={() => {
              playClick();
              restartBackgroundMusic();
              setIsFadingOut(true);
              setTimeout(() => {
                setShowTitleScreen(false);
                if (!hasProgress) setShowTutorial(true);
              }, 1000);
            }}
            style={{ padding: '15px 40px', fontSize: '1.5rem', marginTop: '10px' }}
          >
            {hasProgress ? 'Continue Journey' : 'Begin Dark Magic'}
          </button>
        </div>

        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '20px', 
          color: 'var(--accent-gold)', 
          fontSize: '0.85rem', 
          zIndex: 2,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 15px',
          borderRadius: '20px',
          border: '1px solid rgba(212, 167, 62, 0.3)',
          boxShadow: '0 0 10px rgba(0,0,0,0.8)',
          letterSpacing: '0.5px'
        }}>
          v1.0.0 | Created for DreamLayer Game Jam
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`app-container ${getBackgroundClass()}`} 
      style={{ 
        backgroundImage: currentTab === 'laboratory' ? 'url(./assets/backgrounds/laboratory.png)' : 'none' 
      }}
    >
      <nav className="top-nav">
        <button className={`nav-btn ${currentTab === 'laboratory' ? 'active' : ''}`} onClick={() => setCurrentTab('laboratory')}>
          Laboratory
        </button>
        <button className={`nav-btn ${currentTab === 'codex' ? 'active' : ''}`} onClick={() => openGrimoire(null)}>
          📖 Grimoire
        </button>
        <button 
          className={`nav-btn ${currentTab === 'arena' ? 'active' : ''}`} 
          onClick={() => {
            if (arenaUnlocked) setCurrentTab('arena');
            else alert('You must discover at least 2 monsters in the Laboratory before you can enter the Arena!');
          }}
          style={{ 
            opacity: arenaUnlocked ? 1 : 0.6, 
            cursor: arenaUnlocked ? 'pointer' : 'not-allowed',
            borderColor: arenaUnlocked ? 'var(--accent-gold)' : 'var(--text-muted)'
          }}
          title={arenaUnlocked ? "Enter the Arena" : "Discover 2 monsters to unlock"}
        >
          {arenaUnlocked ? 'Graveyard Arena' : '🔒 Graveyard Arena'}
        </button>
        
        <button 
          className={`nav-btn ${currentTab === 'rewards' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('rewards')} 
          style={{ borderColor: unclaimedCount > 0 ? 'var(--accent-green)' : '', color: unclaimedCount > 0 ? 'var(--accent-green)' : '' }}
        >
          Spoils of War {unclaimedCount > 0 ? `(${unclaimedCount})` : ''}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>Gold: {state.gold}</span>
          <button 
            onClick={() => {
              if (isMusicMuted) {
                setMusicMuted(false);
                setIsMusicMuted(false);
              } else {
                setMusicMuted(true);
                setIsMusicMuted(true);
              }
            }} 
            title={isMusicMuted ? "Turn Music ON" : "Turn Music OFF"}
            style={{ 
              background: isMusicMuted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 167, 62, 0.15)', 
              border: '1px solid var(--accent-gold)', 
              color: 'var(--accent-gold)', 
              padding: '5px 12px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '120px',
              textAlign: 'center'
            }}
          >
            {isMusicMuted ? '🔇 Music: OFF' : '🎵 Music: ON'}
          </button>
          <button onClick={() => setShowTutorial(true)} style={{ background: 'none', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            Help
          </button>
          <button onClick={() => { 
            if(confirm('Reset all progress?')) { 
              playClick();
              resetProgress(); 
              setCurrentTab('laboratory');
              setGrimoireSpread(0); // Reset book to the beginning on restart
              setBattleStatus({ inBattle: false, combatState: null });
              setDelayedGameOverAllowed(false);
              setIsFadingOut(false); 
              setShowTitleScreen(false);
              restartBackgroundMusic();
            } 
          }} style={{ background: 'none', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            Restart
          </button>
        </div>
      </nav>

      {currentTab === 'laboratory' && (
        <Laboratory 
          state={state} 
          consumeIngredients={consumeIngredients} 
          addDiscoveredMonster={addDiscoveredMonster}
          addCustomMonster={addCustomMonster}
          consumeMonsters={consumeMonsters}
          buyIngredient={buyIngredient}
          addRewards={addRewards}
          setCurrentTab={setCurrentTab}
          openGrimoire={openGrimoire}
        />
      )}
      
      {currentTab === 'codex' && (
        <Grimoire 
          state={state} 
          setCurrentTab={setCurrentTab} 
          spreadIndex={grimoireSpread}
          setSpreadIndex={setGrimoireSpread}
        />
      )}
      
      {currentTab === 'arena' && (
        <BattleArena 
          state={state} 
          updateState={updateState}
          consumeMonsters={consumeMonsters}
          addRewards={addUnclaimedReward} 
          setCurrentTab={setCurrentTab}
          onBattleStatusChange={setBattleStatus}
        />
      )}

      {currentTab === 'rewards' && (
        <div className="screen">
          <div className="panel" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-header">Spoils of War</div>
            <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-muted)' }}>
              Claim the rewards you earned from victories in the Graveyard Arena.
            </div>
            
            {unclaimedCount > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '400px', marginBottom: '30px' }}>
                  {state.unclaimedRewards.map((reward, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '4px', border: '1px solid var(--accent-gold)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--accent-gold)' }}>+ {reward.gold} Gold</span>
                      <span style={{ color: 'var(--accent-green)' }}>+ {reward.items.length} Ingredients</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={claimAllRewards} style={{ padding: '15px 40px' }}>
                  Claim All Spoils
                </button>
              </>
            ) : (
              <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '40px' }}>
                You have no unclaimed spoils. Head to the Arena!
              </div>
            )}
          </div>
          
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">Black Market</div>
            <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-muted)' }}>
              Spend your gold to purchase base ingredients for crafting.
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(INGREDIENTS).map(ing => (
                 <button 
                   key={ing.id} 
                   className="btn-primary" 
                   style={{ fontSize: '0.8rem', padding: '5px 10px', flex: '1 1 45%', minHeight: '40px', background: state.gold >= ing.cost ? 'var(--bg-dark)' : 'rgba(0,0,0,0.5)' }}
                   disabled={state.gold < ing.cost}
                   onClick={() => buyIngredient(ing.id, ing.cost)}
                 >
                   Buy {ing.name} ({ing.cost}g)
                 </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '20px' }}>Welcome, Necromancer.</h2>
            <p style={{ marginBottom: '15px' }}>
              Your laboratory is ready, and the cauldron bubbles with dark magic. Your goal is to discover undead creatures and conquer the Graveyard Arena.
            </p>
            
            <ul style={{ textAlign: 'left', marginBottom: '20px', paddingLeft: '20px', color: 'var(--text-muted)' }}>
              <li style={{ marginBottom: '10px' }}><strong>1. Craft:</strong> In the Laboratory, click an ingredient in your inventory to add it to the cauldron. Combine two ingredients to see what they create!</li>
              <li style={{ marginBottom: '10px' }}><strong>2. Collect:</strong> Discovered monsters are added to your Bestiary, where you can inspect their stats and special abilities.</li>
              <li><strong>3. Battle:</strong> Head to the Graveyard Arena, select a team of up to 3 monsters you've discovered, and fight to earn gold and more ingredients!</li>
            </ul>

            <button className="btn-primary" onClick={() => setShowTutorial(false)}>Begin Dark Magic</button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ border: '2px solid var(--accent-red)', boxShadow: '0 0 30px rgba(231, 76, 60, 0.4)' }}>
            <h2 style={{ color: 'var(--accent-red)', marginBottom: '20px', fontSize: '2.5rem', fontFamily: 'Cinzel, serif' }}>GAME OVER</h2>
            <p style={{ marginBottom: '25px', color: 'var(--text-muted)' }}>
              Your dark magic has faded. You are completely out of resources.
            </p>
            
            <button className="btn-primary btn-danger" onClick={() => {
              playClick();
              resetProgress();
              setCurrentTab('laboratory');
              setGrimoireSpread(0);
              setBattleStatus({ inBattle: false, combatState: null });
              setDelayedGameOverAllowed(false);
              setIsFadingOut(false);
              setShowTitleScreen(false);
              restartBackgroundMusic();
            }}>
              Restart Journey
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
