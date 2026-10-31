// Original synthesized bells: no recording, network, or persistent preference.
export function createChristmasSound({ factory, available, changed }: {
  factory: () => AudioContext;
  available: () => boolean;
  changed: (enabled: boolean, failed?: boolean) => void;
}) {
  let context: AudioContext | undefined;
  let enabled = false;
  let generation = 0;
  const voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  function stop() {
    for (const voice of voices) {
      voice.gain.disconnect();
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      voice.oscillator.disconnect();
    }
    voices.clear();
  }
  function mute() {
    generation++;
    enabled = false;
    stop();
    changed(false);
  }
  function bells(duration: number) {
    stop();
    if (!enabled || !available() || context?.state !== 'running') return;
    const start = context.currentTime;
    // At most two soft inharmonic strikes overlap; no recurring JS timer.
    for (let beat = 0; beat < duration - .3; beat += .45) {
      const frequency = [1318.51, 1567.98, 1760, 1567.98][Math.round(beat / .45) % 4];
      for (const [ratio, level] of [[1, .022], [2.76, .009], [4.07, .004]]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const voice = { oscillator, gain };
        voices.add(voice);
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency * ratio;
        gain.gain.setValueAtTime(0, start + beat);
        gain.gain.linearRampToValueAtTime(level, start + beat + .008);
        gain.gain.exponentialRampToValueAtTime(.00001, start + beat + .3);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => {
          oscillator.disconnect(); gain.disconnect(); voices.delete(voice);
        };
        oscillator.start(start + beat); oscillator.stop(start + beat + .32);
      }
    }
  }
  async function activate() {
    const request = ++generation;
    if (!available()) return;
    try {
      context ??= factory(); // Only called by the explicit button gesture.
      await context.resume();
      if (request !== generation || !available()) return;
      if (context.state !== 'running') throw new Error('Audio unavailable');
      enabled = true;
      changed(true);
      bells(.65); // Immediate brief preview; full jingle only during flight.
    } catch {
      if (request === generation) { mute(); changed(false, true); }
    }
  }
  return { activate, mute, stop, flight: () => bells(6), isEnabled: () => enabled };
}
