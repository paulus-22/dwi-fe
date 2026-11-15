/** Short audio + haptic cues, so an usher knows the result without looking. */

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine") {
  ctx ??= new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

export const cue = {
  ok() {
    navigator.vibrate?.(60);
    tone(880, 0, 0.12);
    tone(1320, 0.1, 0.16);
  },
  warn() {
    navigator.vibrate?.([80, 60, 80]);
    tone(660, 0, 0.14, "triangle");
    tone(660, 0.18, 0.14, "triangle");
  },
  bad() {
    navigator.vibrate?.([200]);
    tone(220, 0, 0.32, "square");
  },
  shutter() {
    tone(2000, 0, 0.05, "square");
  },
  tick() {
    tone(1200, 0, 0.05);
  },
};
