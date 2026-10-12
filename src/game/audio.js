const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Global master volume
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.5; // Reduced volume to be balanced
masterGain.connect(audioCtx.destination);

// Huge, soft reverb for atmospheric space
let reverbCache = null;
const setupReverb = () => {
  if (reverbCache) return reverbCache;
  
  const length = audioCtx.sampleRate * 4.0; // 4 seconds of decay
  const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
  for (let i = 0; i < 2; i++) {
    const channel = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      // Soft, smooth exponential decay
      channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 5);
    }
  }
  
  // Filter the reverb to make it dark but not overly muffled
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000; // Raised from 800 so high sounds are audible
  
  const convolver = audioCtx.createConvolver();
  convolver.buffer = impulse;
  
  convolver.connect(filter);
  
  reverbCache = { input: convolver, output: filter };
  return reverbCache;
};

const playOrganicTone = (type, freqPath, gainPath, duration, useReverb = true) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  
  // Apply frequency path
  osc.frequency.setValueAtTime(freqPath[0].val, now + freqPath[0].time);
  for (let i = 1; i < freqPath.length; i++) {
    if (freqPath[i].exp) {
      osc.frequency.exponentialRampToValueAtTime(freqPath[i].val, now + freqPath[i].time);
    } else {
      osc.frequency.linearRampToValueAtTime(freqPath[i].val, now + freqPath[i].time);
    }
  }
  
  // Apply gain path
  gain.gain.setValueAtTime(gainPath[0].val, now + gainPath[0].time);
  for (let i = 1; i < gainPath.length; i++) {
    if (gainPath[i].exp) {
      gain.gain.exponentialRampToValueAtTime(gainPath[i].val, now + gainPath[i].time);
    } else {
      gain.gain.linearRampToValueAtTime(gainPath[i].val, now + gainPath[i].time);
    }
  }
  
  osc.connect(gain);
  
  if (useReverb) {
    const rv = setupReverb();
    
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 1.0; // Boosted dry signal
    
    const wetGain = audioCtx.createGain();
    wetGain.gain.value = 0.8; 
    
    gain.connect(dryGain);
    gain.connect(rv.input);
    rv.output.connect(wetGain);
    
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
  } else {
    gain.connect(masterGain);
  }
  
  osc.start(now);
  osc.stop(now + duration);
};

export const playClick = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  
  // A sharp, serious heavy stone/metallic clack
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1.5;
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain); 
  
  osc.start(now);
  osc.stop(now + 0.05);
};

export const playPageTurn = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.22); // 220ms parchment rustle
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Soft fluttering noise decay
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, now);
  filter.frequency.exponentialRampToValueAtTime(650, now + 0.2);
  filter.Q.value = 1.8;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  
  noise.start(now);
  noise.stop(now + 0.22);
};

export const playCauldronBubble = () => {
  playOrganicTone(
    'sine',
    [{ val: 150, time: 0 }, { val: 100, time: 1.5 }], // Raised frequencies
    [{ val: 0.01, time: 0 }, { val: 0.8, time: 0.5 }, { val: 0.01, time: 2.0 }], // Boosted gain
    2.0,
    true
  );
};

export const playMonsterGenerated = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  
  // Simple, clean monster generation sound effect:
  // An ascending harmonic chime (C5 -> E5 -> G5 -> C6)
  // No roar, cry, wail, or pitch drops - just a crisp, simple creation sound effect (~0.5s)
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.22, vol: 0.22 },    // C5
    { freq: 659.25, time: 0.08, dur: 0.22, vol: 0.24 },   // E5
    { freq: 783.99, time: 0.16, dur: 0.45, vol: 0.26 },   // G5
    { freq: 1046.50, time: 0.24, dur: 0.50, vol: 0.20 }  // C6
  ];
  
  const rv = setupReverb();
  
  notes.forEach(({ freq, time, dur, vol }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);
    
    // Crisp chime envelope: clean attack, smooth exponential decay
    gain.gain.setValueAtTime(0.0001, now + time);
    gain.gain.linearRampToValueAtTime(vol, now + time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
    
    osc.connect(gain);
    
    const dry = audioCtx.createGain();
    dry.gain.value = 0.6;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.3;
    
    gain.connect(dry);
    gain.connect(rv.input);
    rv.output.connect(wet);
    
    dry.connect(masterGain);
    wet.connect(masterGain);
    
    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
};

export const playMagic = playMonsterGenerated;

export const playHit = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  // Simple, crisp, punchy fight impact sound effect - same for all monster fights
  // Quick physical punch (~0.12s): no ear-piercing high sines, no long drones, no headache
  
  // 1. Low punch thud
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.11);

  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.linearRampToValueAtTime(0.24, now + 0.008);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  osc.connect(oscGain);
  oscGain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.13);

  // 2. Crisp impact snap (quick bandpass click)
  const clickOsc = audioCtx.createOscillator();
  const clickGain = audioCtx.createGain();
  const clickFilter = audioCtx.createBiquadFilter();

  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(300, now);
  clickOsc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

  clickFilter.type = 'bandpass';
  clickFilter.frequency.setValueAtTime(750, now);
  clickFilter.Q.setValueAtTime(1.2, now);

  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.linearRampToValueAtTime(0.14, now + 0.004);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

  clickOsc.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(masterGain);
  clickOsc.start(now);
  clickOsc.stop(now + 0.065);
};

export const playBattleWin = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  // Simple, pleasant victory fanfare (quick 3-note chime ~0.45s)
  const notes = [
    { freq: 440.00, time: 0.0, dur: 0.16, vol: 0.16 }, // A4
    { freq: 554.37, time: 0.1, dur: 0.18, vol: 0.18 }, // C#5
    { freq: 659.25, time: 0.2, dur: 0.30, vol: 0.20 }  // E5
  ];

  notes.forEach(({ freq, time, dur, vol }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.0001, now + time);
    gain.gain.linearRampToValueAtTime(vol, now + time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + time);
    osc.stop(now + time + dur + 0.02);
  });
};

export const playBattleLose = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  // Simple, quiet defeat cue (~0.35s)
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(75, now + 0.32);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.38);
};

export const playVictoryMusic = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  // Clean, crisp victory jingle (~0.65s)
  const notes = [
    { freq: 440.00, time: 0.0, dur: 0.16, vol: 0.16 },
    { freq: 554.37, time: 0.1, dur: 0.16, vol: 0.18 },
    { freq: 659.25, time: 0.2, dur: 0.22, vol: 0.20 },
    { freq: 880.00, time: 0.32, dur: 0.38, vol: 0.22 }
  ];

  notes.forEach(({ freq, time, dur, vol }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.0001, now + time);
    gain.gain.linearRampToValueAtTime(vol, now + time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + time);
    osc.stop(now + time + dur + 0.02);
  });
};

export const playSacrifice = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  
  // Dark sacrificial dissolving tone (low rumble)
  const darkOsc = audioCtx.createOscillator();
  const darkGain = audioCtx.createGain();
  darkOsc.type = 'sawtooth';
  darkOsc.frequency.setValueAtTime(140, now);
  darkOsc.frequency.exponentialRampToValueAtTime(45, now + 0.45);
  
  const darkFilter = audioCtx.createBiquadFilter();
  darkFilter.type = 'lowpass';
  darkFilter.frequency.setValueAtTime(320, now);
  
  darkGain.gain.setValueAtTime(0.0001, now);
  darkGain.gain.linearRampToValueAtTime(0.28, now + 0.03);
  darkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  
  darkOsc.connect(darkFilter);
  darkFilter.connect(darkGain);
  darkGain.connect(masterGain);
  darkOsc.start(now);
  darkOsc.stop(now + 0.5);

  // Sparkling golden coin reward chime
  const coinTones = [1174.66, 1567.98]; // D6, G6
  coinTones.forEach((f, i) => {
    const coinOsc = audioCtx.createOscillator();
    const coinGain = audioCtx.createGain();
    const coinStart = now + 0.12 + (i * 0.08);
    
    coinOsc.type = 'triangle';
    coinOsc.frequency.setValueAtTime(f, coinStart);
    
    coinGain.gain.setValueAtTime(0.0001, coinStart);
    coinGain.gain.linearRampToValueAtTime(0.18, coinStart + 0.015);
    coinGain.gain.exponentialRampToValueAtTime(0.0001, coinStart + 0.35);
    
    coinOsc.connect(coinGain);
    coinGain.connect(masterGain);
    coinOsc.start(coinStart);
    coinOsc.stop(coinStart + 0.4);
  });
};

// Dedicated background music bus for ambient levels
const bgmGain = audioCtx.createGain();
bgmGain.gain.value = 0.20; // Comfortable ambient background level
bgmGain.connect(masterGain);

let bgmInterval = null;
let isBgmPlaying = false;
let bgmStep = 0;
let isMusicMuted = false;

export const startBackgroundMusic = () => {
  if (isMusicMuted) return; // Do not start if user turned music OFF
  if (isBgmPlaying) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isBgmPlaying = true;
  bgmStep = 0; // Starts from the initial low/audible tone
  try {
    bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGain.gain.setValueAtTime(0.20, audioCtx.currentTime);
  } catch (_) {}
  
  // The original, haunting dark music box melody (D minor)
  const melody = [
    293.66, null, 329.63, 349.23, // D4, -, E4, F4
    440.00, null, 349.23, 329.63, // A4, -, F4, E4
    293.66, null, 220.00, 261.63, // D4, -, A3, C4
    293.66, null, null, null      // D4, -, -, -
  ];
  
  let noteIndex = 0;
  
  const playNextNote = () => {
    if (!isBgmPlaying) return;
    
    // Smooth breathing cycle: low -> high (bit loud) -> low -> loop
    // 32 beats (2 full playthroughs of the 16-note melody, ~19.2s total cycle)
    const cyclePeriod = 32;
    const progress = (bgmStep % cyclePeriod) / cyclePeriod;
    const swell = (1 - Math.cos(progress * 2 * Math.PI)) / 2; // Range: 0.0 (low) to 1.0 (high/bit loud)
    
    const freq = melody[noteIndex];
    if (freq) {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Filter: starts low and warm (850Hz), opens to 1350Hz during peak, then softens back
      const cutoff = 850 + (swell * 500);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, now);
      
      // Volume: starts low and audible (0.038), swells gradually to high/bit loud (0.086), then gently returns
      const peakGain = 0.038 + (swell * 0.048);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
      
      // Soft, clean music box decay
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      
      osc.connect(filter);
      filter.connect(gain);
      
      // Ambient spatial reverb
      const rv = setupReverb();
      const dry = audioCtx.createGain(); 
      dry.gain.value = 0.32;
      const wet = audioCtx.createGain(); 
      wet.gain.value = 0.16 + (swell * 0.10);
      
      gain.connect(dry);
      gain.connect(rv.input);
      rv.output.connect(wet);
      
      dry.connect(bgmGain);
      wet.connect(bgmGain);
      
      osc.start(now);
      osc.stop(now + 2.0);
    }
    
    bgmStep++;
    noteIndex = (noteIndex + 1) % melody.length;
    bgmInterval = setTimeout(playNextNote, 600); // 100 BPM
  };
  
  playNextNote();
};

export const stopBackgroundMusic = () => {
  if (!isBgmPlaying) return;
  isBgmPlaying = false;
  bgmStep = 0;
  if (bgmInterval) {
    clearTimeout(bgmInterval);
    bgmInterval = null;
  }
  try {
    bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  } catch (_) {}
};

export const setBgmVolume = (volume) => {
  const clamped = Math.max(0, Math.min(1, volume));
  bgmGain.gain.setValueAtTime(clamped * 0.20, audioCtx.currentTime);
};

export const getBgmVolume = () => {
  return bgmGain.gain.value / 0.20;
};

export const isBgmActive = () => isBgmPlaying;

export const setMusicMuted = (muted) => {
  isMusicMuted = muted;
  if (muted) {
    stopBackgroundMusic();
  } else {
    startBackgroundMusic();
  }
};

export const isMusicDisabled = () => isMusicMuted;

// Battle BGM handlers: totally stops during battle, resumes when battle finishes
export const pauseBgmForBattle = () => {
  stopBackgroundMusic();
};

export const resumeBgmAfterBattle = () => {
  if (!isMusicMuted) {
    startBackgroundMusic();
  }
};

export const restartBackgroundMusic = () => {
  if (bgmInterval) {
    clearTimeout(bgmInterval);
    bgmInterval = null;
  }
  isBgmPlaying = false;
  bgmStep = 0;
  try {
    bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGain.gain.setValueAtTime(0.20, audioCtx.currentTime);
  } catch (_) {}

  if (!isMusicMuted) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        startBackgroundMusic();
      }).catch(() => {
        startBackgroundMusic();
      });
    } else {
      startBackgroundMusic();
    }
  }
};

