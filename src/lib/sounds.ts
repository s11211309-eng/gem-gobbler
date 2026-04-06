// Cute 8-bit sound effects using Web Audio API
const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new AudioContext();
  }
  return (window as any).__gameAudioCtx as AudioContext;
};

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNotes(notes: [number, number][], type: OscillatorType = 'square', volume = 0.12) {
  const ctx = audioCtx();
  let t = ctx.currentTime;
  for (const [freq, dur] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur * 0.7;
  }
}

export const SFX = {
  shoot: () => playTone(880, 0.08, 'square', 0.08),
  hit: () => playTone(220, 0.1, 'sawtooth', 0.1),
  xpPickup: () => playNotes([[660, 0.06], [880, 0.06], [1100, 0.08]], 'sine', 0.1),
  levelUp: () => playNotes([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.15]], 'square', 0.15),
  playerHit: () => playNotes([[300, 0.1], [200, 0.15]], 'sawtooth', 0.12),
  gameOver: () => playNotes([[400, 0.2], [300, 0.2], [200, 0.3]], 'triangle', 0.15),
  buttonClick: () => playTone(600, 0.05, 'sine', 0.08),
  bossAppear: () => playNotes([[150, 0.2], [100, 0.3], [150, 0.2], [200, 0.15]], 'sawtooth', 0.18),
  bossDefeat: () => playNotes([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [1319, 0.15], [1568, 0.2]], 'square', 0.15),
};
