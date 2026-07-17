/**
 * Synthesizes placeholder wedding-game audio as 16-bit mono WAV files.
 * Run: node scripts/generate-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/assets/audio');
const SR = 22050;

fs.mkdirSync(OUT, { recursive: true });

function writeWav(fileName, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i] ?? 0));
    data.writeInt16LE((v * 32767) | 0, i * 2);
  }

  const header = Buffer.alloc(44);
  const byteRate = SR * 2;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(path.join(OUT, fileName), Buffer.concat([header, data]));
}

function env(t, attack, release, dur) {
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

function tone(freq, dur, { type = 'sine', vol = 0.35, attack = 0.01, release = 0.08 } = {}) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const phase = 2 * Math.PI * freq * t;
    let s = 0;
    if (type === 'sine') s = Math.sin(phase);
    else if (type === 'triangle') s = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
    else if (type === 'square') s = Math.sin(phase) > 0 ? 0.45 : -0.45;
    else if (type === 'noise') s = Math.random() * 2 - 1;
    out[i] = s * vol * env(t, attack, release, dur);
  }
  return out;
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(len);
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      out[i] += part[i] ?? 0;
    }
  }
  let peak = 0.0001;
  for (let i = 0; i < out.length; i += 1) peak = Math.max(peak, Math.abs(out[i] ?? 0));
  const gain = Math.min(1, 0.92 / peak);
  for (let i = 0; i < out.length; i += 1) out[i] *= gain;
  return out;
}

function concat(...parts) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(len);
  let o = 0;
  for (const part of parts) {
    out.set(part, o);
    o += part.length;
  }
  return out;
}

function silence(dur) {
  return new Float32Array(Math.floor(SR * dur));
}

function chord(freqs, dur, vol = 0.18) {
  return mix(...freqs.map((f) => tone(f, dur, { vol, type: 'sine', attack: 0.05, release: 0.2 })));
}

function arpeggio(freqs, noteDur, loops = 1, vol = 0.22) {
  const notes = [];
  for (let L = 0; L < loops; L += 1) {
    for (const f of freqs) {
      notes.push(tone(f, noteDur, { vol, attack: 0.01, release: 0.08 }));
    }
  }
  return concat(...notes);
}

// —— BGM (soft wedding-ish loops) ——
writeWav(
  'bgm_menu.wav',
  concat(
    chord([261.63, 329.63, 392.0], 1.2),
    chord([293.66, 349.23, 440.0], 1.2),
    chord([246.94, 311.13, 392.0], 1.2),
    chord([261.63, 329.63, 392.0], 1.4),
  ),
);

writeWav(
  'bgm_play.wav',
  concat(
    arpeggio([392.0, 493.88, 587.33, 659.25], 0.22, 2, 0.2),
    arpeggio([349.23, 440.0, 523.25, 659.25], 0.22, 2, 0.2),
    arpeggio([329.63, 415.3, 493.88, 622.25], 0.22, 2, 0.18),
    arpeggio([392.0, 493.88, 587.33, 783.99], 0.22, 2, 0.22),
  ),
);

writeWav(
  'bgm_result.wav',
  concat(
    chord([261.63, 329.63, 392.0, 523.25], 1.5, 0.16),
    chord([293.66, 369.99, 440.0, 587.33], 1.5, 0.16),
    chord([246.94, 311.13, 392.0, 493.88], 1.8, 0.15),
  ),
);

// —— UI ——
writeWav('ui_click.wav', tone(880, 0.08, { type: 'sine', vol: 0.35, release: 0.05 }));
writeWav(
  'ui_toggle.wav',
  mix(tone(660, 0.07, { vol: 0.3 }), tone(990, 0.09, { vol: 0.22 })),
);

// —— Gameplay SFX ——
// Clear double "ting-ting" like a soft iPhone message chime.
writeWav(
  'sfx_catch_good.wav',
  concat(
    mix(
      tone(1568.0, 0.07, { type: 'sine', vol: 0.38, attack: 0.001, release: 0.055 }),
      tone(2093.0, 0.05, { type: 'sine', vol: 0.18, attack: 0.001, release: 0.04 }),
    ),
    silence(0.055),
    mix(
      tone(1864.7, 0.09, { type: 'sine', vol: 0.34, attack: 0.001, release: 0.07 }),
      tone(2489.0, 0.06, { type: 'sine', vol: 0.14, attack: 0.001, release: 0.05 }),
    ),
  ),
);

// Soft boom / bomb hit for bad catches.
writeWav(
  'sfx_catch_bad.wav',
  (() => {
    const dur = 0.42;
    const n = Math.floor(SR * dur);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const t = i / SR;
      const boom =
        Math.sin(2 * Math.PI * (70 + t * 40) * t) *
        Math.exp(-t * 6.5) *
        0.55;
      const thump =
        Math.sin(2 * Math.PI * 42 * t) * Math.exp(-t * 4.2) * 0.35;
      const crackle = (Math.random() * 2 - 1) * Math.exp(-t * 14) * 0.28;
      out[i] = boom + thump + crackle;
    }
    let peak = 0.0001;
    for (let i = 0; i < out.length; i += 1) peak = Math.max(peak, Math.abs(out[i] ?? 0));
    const gain = Math.min(1, 0.9 / peak);
    for (let i = 0; i < out.length; i += 1) out[i] *= gain;
    return out;
  })(),
);

writeWav(
  'sfx_catch_bonus.wav',
  concat(
    mix(
      tone(784.0, 0.07, { type: 'triangle', vol: 0.26, attack: 0.002, release: 0.05 }),
      tone(1174.7, 0.08, { type: 'sine', vol: 0.18, attack: 0.002, release: 0.06 }),
    ),
    silence(0.03),
    mix(
      tone(988.0, 0.08, { type: 'triangle', vol: 0.24, attack: 0.002, release: 0.06 }),
      tone(1480.0, 0.1, { type: 'sine', vol: 0.16, attack: 0.002, release: 0.08 }),
    ),
    silence(0.02),
    mix(
      tone(1318.5, 0.12, { type: 'sine', vol: 0.22, attack: 0.002, release: 0.1 }),
      tone(1760.0, 0.1, { type: 'sine', vol: 0.12, attack: 0.002, release: 0.08 }),
    ),
  ),
);

// Soft "starman / invincible" style loop — fast rising arpeggio, quieter than before.
writeWav(
  'sfx_bonus_fanfare.wav',
  (() => {
    // Chromatic-ish rising pattern reminiscent of Mario invincibility (original melody not copied).
    const pattern = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    const noteDur = 0.085;
    const loops = 3;
    const notes = [];
    for (let L = 0; L < loops; L += 1) {
      for (const f of pattern) {
        notes.push(
          mix(
            tone(f, noteDur, { type: 'triangle', vol: 0.11, attack: 0.004, release: 0.05 }),
            tone(f * 2, noteDur, { type: 'sine', vol: 0.045, attack: 0.004, release: 0.045 }),
          ),
        );
      }
      // quick descending answer
      for (const f of [987.77, 880.0, 783.99, 659.25]) {
        notes.push(
          tone(f, noteDur * 0.9, {
            type: 'triangle',
            vol: 0.09,
            attack: 0.004,
            release: 0.05,
          }),
        );
      }
    }
    return concat(...notes);
  })(),
);
writeWav(
  'sfx_bonus_magnet.wav',
  mix(
    tone(300, 0.18, { type: 'triangle', vol: 0.22 }),
    tone(450, 0.2, { vol: 0.2 }),
    tone(700, 0.22, { vol: 0.18 }),
    tone(950, 0.16, { vol: 0.14 }),
  ),
);
writeWav(
  'sfx_bonus_double.wav',
  mix(
    tone(659.25, 0.1, { vol: 0.28 }),
    tone(987.77, 0.14, { vol: 0.26 }),
    tone(1318.5, 0.12, { vol: 0.18 }),
  ),
);
writeWav(
  'sfx_bonus_extra_time.wav',
  concat(
    mix(tone(880, 0.06, { vol: 0.28, release: 0.04 }), tone(440, 0.06, { vol: 0.12 })),
    mix(tone(880, 0.06, { vol: 0.24, release: 0.04 })),
    mix(tone(523.25, 0.16, { vol: 0.22 }), tone(784, 0.18, { vol: 0.2 })),
  ),
);
writeWav(
  'sfx_bonus_lucky_rain.wav',
  concat(
    mix(tone(1046.5, 0.07, { vol: 0.2 }), tone(1318.5, 0.08, { vol: 0.16 })),
    mix(tone(880, 0.07, { vol: 0.2 }), tone(1174.7, 0.08, { vol: 0.16 })),
    mix(tone(698.46, 0.08, { vol: 0.2 }), tone(987.77, 0.1, { vol: 0.18 })),
    mix(
      tone(523.25, 0.1, { vol: 0.22 }),
      tone(783.99, 0.14, { vol: 0.2 }),
      tone(1046.5, 0.12, { vol: 0.16 }),
    ),
  ),
);
writeWav(
  'sfx_miss.wav',
  mix(tone(220, 0.15, { type: 'triangle', vol: 0.22 }), tone(160, 0.18, { vol: 0.18 })),
);
writeWav(
  'sfx_combo.wav',
  mix(tone(587.33, 0.08, { vol: 0.28 }), tone(880, 0.12, { vol: 0.24 })),
);
writeWav(
  'sfx_strike.wav',
  mix(tone(200, 0.16, { type: 'square', vol: 0.3 }), tone(120, 0.2, { vol: 0.2 })),
);
writeWav(
  'sfx_stage.wav',
  mix(tone(392, 0.1, { vol: 0.25 }), tone(523.25, 0.12, { vol: 0.22 }), tone(659.25, 0.14, { vol: 0.2 })),
);

// —— Transition / start / end ——
writeWav('sfx_countdown.wav', tone(523.25, 0.12, { vol: 0.32, release: 0.06 }));
writeWav(
  'sfx_go.wav',
  mix(tone(659.25, 0.1, { vol: 0.3 }), tone(880, 0.16, { vol: 0.28 }), tone(1174.7, 0.12, { vol: 0.2 })),
);
writeWav(
  'sfx_game_start.wav',
  mix(tone(392, 0.12, { vol: 0.24 }), tone(523.25, 0.14, { vol: 0.26 }), tone(784, 0.18, { vol: 0.24 })),
);
writeWav(
  'sfx_game_over.wav',
  concat(
    mix(tone(392, 0.2, { vol: 0.25 }), tone(311.13, 0.22, { vol: 0.2 })),
    mix(tone(261.63, 0.35, { vol: 0.22 }), tone(196, 0.4, { vol: 0.18 })),
  ),
);
writeWav(
  'sfx_result.wav',
  mix(tone(523.25, 0.15, { vol: 0.24 }), tone(659.25, 0.18, { vol: 0.22 }), tone(783.99, 0.22, { vol: 0.2 })),
);

console.log('Generated audio files in', OUT);
console.log(fs.readdirSync(OUT).filter((f) => f.endsWith('.wav')).sort().join('\n'));
