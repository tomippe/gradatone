// Gradatone - Seamless Piano Application
// Audio Engine and Input Handling

// Scale Definitions - World Music Scales
const SCALES = {
    major: {
        name: 'Major',
        pattern: [0, 2, 4, 5, 7, 9, 11],  // C D E F G A B
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    },
    minor: {
        name: 'Minor',
        pattern: [0, 2, 3, 5, 7, 8, 10, 11],  // A B C D E F G G# (natural + harmonic minor)
        root: 'A',
        rootOffset: 9,  // A = 9 semitones from C
        tonic: 'A',
        dominant: 'E'
    },
    ryukyu: {
        name: 'Ryukyu',
        pattern: [0, 4, 5, 7, 11],  // C E F G B (ドミファソシ - 沖縄音階)
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    },
    miyakobushi: {
        name: 'Miyako',
        pattern: [0, 1, 5, 7, 8],  // 都節音階 (半音-4度-全音-半音)
        root: 'E',
        rootOffset: 4,  // E = 4 semitones from C
        tonic: 'E',
        dominant: 'B'
    },
    chinese: {
        name: 'Chinese',
        pattern: [0, 2, 4, 7, 9],  // 五音階 (宮商角徴羽)
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    },
    bhairav: {
        name: 'India',
        pattern: [0, 1, 4, 5, 7, 8, 11],  // Raga Bhairav / Arabic Maqam Hijaz
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    },
    arabic: {
        name: 'Arabic',
        pattern: [0, 2, 3, 5, 7, 9, 10],  // Maqam Bayati - アラブ音楽の基本的なマカーム
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    },
    blues: {
        name: 'Blues',
        pattern: [0, 3, 5, 6, 7, 10],  // Blues scale
        root: 'C',
        rootOffset: 0,
        tonic: 'C',
        dominant: 'G'
    }
};

// Instrument Definitions
const INSTRUMENTS = {
    piano: {
        name: 'Piano',
        category: 'Keyboards',
        oscillators: [
            // Fundamental - triangle wave for rich but mellow tone
            { type: 'triangle', detune: 0, gain: 0.03, octave: 0 },
            { type: 'triangle', detune: 0, gain: 0.03, octave: 1 },
            // Deep sub-bass for piano body weight
            { type: 'triangle', octave: 0, gain: 0.12 },
            // 2nd harmonic - important for piano character
            { type: 'sine', partial: 1, detune: 1, gain: 0.18, octave: 0 },
            // 3rd harmonic - adds depth without harshness
            { type: 'sine', partial: 1, detune: 2, gain: 0.06, octave: 1 },
            // 4th harmonic - very subtle
            { type: 'sine', partial: 4, detune: 3, gain: 0.06, octave: 0 }
        ],
        // pitchBend: { startOffset: -2000, duration: 0.005, delay: 0 },  // Start very low, rise to original
        filter: { type: 'lowpass', frequency: 1000, Q: 0.6 }, // Slightly brighter
        // Hammer noise for realistic attack transient
        hammerNoise: {
            enabled: true,
            gain: 0.4,            // Volume of noise burst (reduced to prevent clipping)
            attack: 0.01,           // Instant attack
            decay: 0.08,            // Very short decay
            filterFreq: 150,        // Bandpass center frequency
            filterQ: 3.0             // Moderate Q to prevent resonance peaks
        },
        envelope: {
            attack: 0.001,    // Very fast attack for sharp initial transient
            decay: 1.2,       // Longer decay for piano sustain
            sustain: 0.18,    // Low sustain (strings dampen naturally)
            holdTime: 5.0,
            release: 0.5      // Natural fade
        }
    },
    organ: {
        name: 'Organ',
        category: 'Keyboards',
        vibrato: { rate: 6, depth: 10, delay: 0 },
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.3 },
            { type: 'sine', octave: 1, gain: 0.2 },
            { type: 'sine', octave: -1, gain: 0.15 },
            { type: 'triangle', octave: 2, gain: 0.05 }
        ],
        filter: { type: 'lowpass', frequency: 3000, Q: 0.5 },
        envelope: {
            attack: 0.05,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 20.0,
            release: 0.4      // Organ-like smooth fade
        }
    },
    xylophone: {
        name: 'Xylophone',
        category: 'Percussion',
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.75 },
            { type: 'triangle', detune: 0, gain: 0.3 },
            { type: 'sine', partial: 3, gain: 0.15 } // Woody overtone
        ],
        filter: { type: 'lowpass', frequency: 2000, Q: 0.7 },
        envelope: {
            attack: 0.001,
            decay: 0.5, // Tighter decay for better attack
            sustain: 0.0,
            holdTime: 1.0,
            release: 0.45
        }
    },
    glockenspiel: {
        name: 'Glockenspiel',
        category: 'Percussion',
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.4 },
            { type: 'sine', partial: 2.7, gain: 0.2 }, // Metallic partials
            { type: 'sine', partial: 4.2, gain: 0.1 }
        ],
        filter: { type: 'lowpass', frequency: 8000, Q: 0.5 },
        envelope: {
            attack: 0.001,
            decay: 1.5, // Ringing decay
            sustain: 0.0,
            holdTime: 0.1,
            release: 1.5
        }
    },
    acoustic_guitar: {
        name: 'Acoustic Guitar',
        category: 'Guitars',
        vibrato: { rate: 3.5, depth: 14, delay: 0.25 },  // Gentle guitar vibrato (half of electric)
        oscillators: [
            // Core string tone
            { type: 'triangle', detune: 0, gain: 0.35 },
            { type: 'triangle', detune: 3, gain: 0.18 },
            { type: 'triangle', detune: -3, gain: 0.18 },
            // Body resonance
            { type: 'sine', octave: -1, gain: 0.25 },
            // Harmonics for brightness
            { type: 'sine', partial: 2, detune: 2, gain: 0.12 },
            { type: 'sine', partial: 3, detune: 3, gain: 0.08 },
            // Subtle high harmonics for "shimmer"
            { type: 'sine', partial: 5, gain: 0.04 }
        ],
        filter: { type: 'lowpass', frequency: 4200, Q: 1.2 },
        envelope: {
            attack: 0.003,    // Sharp pluck
            decay: 0.4,       // Quick initial decay
            sustain: 0.35,    // Medium sustain
            holdTime: 5.0,
            release: 0.8      // Natural acoustic guitar decay
        }
    },
    electric_guitar: {
        name: 'Electric Guitar',
        category: 'Guitars',
        distortion: true,
        vibrato: { rate: 3.5, depth: 28, delay: 0.3 },  // Guitar-style vibrato (slow and wide)
        pitchBend: { startOffset: -1000, duration: 0.01, delay: 0 },  // Start very low, rise to original
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.4 },
            { type: 'square', detune: 2, gain: 0.3 },
            { type: 'sine', octave: -1, gain: 0.2 }
        ],
        filter: { type: 'lowpass', frequency: 3000, Q: 2.0 },
        // Pick scrape noise for gritty attack
        hammerNoise: {
            enabled: true,
            gain: 0.25,              // Strong pick scrape
            attack: 0.001,           // Instant
            decay: 0.025,            // Short gritty sound (25ms)
            filterFreq: 1500,        // Mid-low frequencies for grittiness
            filterQ: 1.5             // Somewhat focused
        },
        envelope: {
            attack: 0.02,    // Slightly faster for sharper pick attack
            decay: 1.0,
            sustain: 0.7,
            holdTime: 8.0,
            release: 0.8     // Shorter release
        }
    },
    bass: {
        name: 'Bass',
        category: 'Guitars',
        oscillators: [
            { type: 'sine', octave: -1, gain: 0.5 },
            { type: 'sawtooth', octave: -1, gain: 0.3 },
            { type: 'square', octave: -2, gain: 0.2 }
        ],
        filter: { type: 'lowpass', frequency: 600, Q: 1.5 },
        envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.6,
            holdTime: 8.0,
            release: 1.5 // Longer release - bass strings vibrate
        }
    },
    violin: {
        name: 'Violin',
        category: 'Strings',
        vibrato: { rate: 6, depth: 22, delay: 0.2 },
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.2 },
            { type: 'sawtooth', detune: 3, gain: 0.15 }, // Detuned for thickness
            { type: 'sine', detune: 0, gain: 0.1 },      // Fundamental (changed from triangle to reduce horn-like sound)
            { type: 'sawtooth', octave: 2, gain: 0.06 }  // Increased texture
        ],
        filter: { type: 'lowpass', frequency: 3500, Q: 1.5 }, // Brighter with more resonance
        envelope: {
            attack: 0.1,    // Faster attack
            decay: 0.0,
            sustain: 1.0,
            holdTime: 20.0,
            release: 0.3
        }
    },
    viola: {
        name: 'Viola',
        category: 'Strings',
        vibrato: { rate: 5.5, depth: 20, delay: 0.2 },
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.22 },
            { type: 'sawtooth', detune: 3, gain: 0.16 },
            { type: 'sine', detune: 0, gain: 0.12 },
            { type: 'sawtooth', octave: 2, gain: 0.05 }
        ],
        filter: { type: 'lowpass', frequency: 3000, Q: 1.4 }, // Slightly darker than violin
        envelope: {
            attack: 0.12,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 20.0,
            release: 0.35
        }
    },
    harp: {
        name: 'Harp',
        category: 'Strings',
        oscillators: [
            { type: 'triangle', detune: 0, gain: 0.38 },    // Strong fundamental for body
            { type: 'triangle', detune: 2, gain: 0.22 },    // Slight detuning for wood texture
            { type: 'triangle', detune: -2, gain: 0.15 },   // More wood texture
            { type: 'sine', partial: 2, gain: 0.1 },        // Gentle 2nd harmonic
            { type: 'square', detune: 1, gain: 0.05 }       // Touch of woodiness
        ],
        filter: { type: 'lowpass', frequency: 3200, Q: 0.7 }, // Slightly warmer, more focused
        // Pluck noise for realistic attack
        hammerNoise: {
            enabled: true,
            gain: 0.16,              // More prominent pluck
            attack: 0.001,           // Instant
            decay: 0.012,            // Shorter for sharper attack
            filterFreq: 1800,        // Lower for more wood sound
            filterQ: 2.0             // Less focused for natural feel
        },
        envelope: {
            attack: 0.002,    // Sharper pluck
            decay: 1.5,       // Shorter decay
            sustain: 0.08,    // Lower sustain
            holdTime: 6.0,
            release: 0.9      // Shorter fade
        }
    },
    trumpet: {
        name: 'Trumpet',
        category: 'Winds',
        // 適度な歪みでラッパ感を追加（エレキギターより控えめ）
        distortion: { 
            preGain: 2.5,    // エレキギターの半分（控えめなドライブ）
            amount: 200,     // エレキギターの半分（軽い歪み）
            postGain: 0.85   // 音量補正（さらに上げた）
        },
        vibrato: { rate: 5, depth: 8, delay: 0.2 },  // 少し深めのビブラート
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.3 },
            { type: 'sawtooth', detune: 3, gain: 0.2 },
            { type: 'square', detune: 1, gain: 0.15 },  // 金管的な倍音を追加
            { type: 'sine', partial: 3, gain: 0.1 }
        ],
        filter: { type: 'bandpass', frequency: 2500, Q: 2.0 }, // Nasal/Brassy
        // ブレスノイズでラッパの息遣いを表現
        hammerNoise: {
            enabled: true,
            gain: 0.12,              // 控えめなブレスノイズ
            attack: 0.001,           // 瞬時
            decay: 0.04,             // 短い息の音（40ms）
            filterFreq: 3500,        // 高めの周波数でブレス感
            filterQ: 1.2             // 適度な集中
        },
        envelope: {
            attack: 0.03,    // 少し遅めのアタックでより自然な吹き始め
            decay: 0.0,
            sustain: 1.0,
            holdTime: 8.0,
            release: 0.2
        }
    },
    harmonica: {
        name: 'Harmonica',
        category: 'Winds',
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.5 },
            { type: 'square', detune: 2, gain: 0.3 },
            { type: 'sine', partial: 2, gain: 0.2 },
            { type: 'sine', partial: 3, gain: 0.16 }
        ],
        filter: { type: 'bandpass', frequency: 2800, Q: 1.8 },
        envelope: {
            attack: 0.08,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 8.0,
            release: 0.2
        }
    },
    flute: {
        name: 'Flute',
        category: 'Winds',
        vibrato: { rate: 5, depth: 9, delay: 0.15 },  // Gentle vibrato (half of ocarina)
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.4 },
            { type: 'sine', partial: 2, gain: 0.15 },
            { type: 'sine', partial: 3, gain: 0.08 },
            { type: 'triangle', detune: 2, gain: 0.05 }
        ],
        filter: { type: 'lowpass', frequency: 4000, Q: 0.8 },
        envelope: {
            attack: 0.08,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 10.0,
            release: 0.3
        }
    },
    ocarina: {
        name: 'Ocarina',
        category: 'Winds',
        vibrato: { rate: 5, depth: 18, delay: 0.1 },  // Expressive vibrato
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.4 },        // Pure fundamental
            { type: 'triangle', detune: 1, gain: 0.2 },    // Earthy texture
            { type: 'sine', partial: 2, gain: 0.1 },       // Gentle 2nd harmonic
            { type: 'sine', partial: 3, gain: 0.05 }       // Subtle brightness
        ],
        filter: { type: 'lowpass', frequency: 3000, Q: 0.5 }, // Warm and mellow
        envelope: {
            attack: 0.01,    // Very strong "po-" breath attack
            decay: 0.0,
            sustain: 1.0,
            holdTime: 10.0,
            release: 0.35
        }
    },
    shakuhachi: {
        name: 'Shakuhachi',
        category: 'Winds',
        vibrato: { rate: 5, depth: 5, delay: 0.1 },  // Moderate vibrato (half of original)

        pitchBend: { startOffset: 600, duration: 0.08, delay: 0 },  // Start low, rise to original
        // 吹き始めのブレスノイズ（息を入れる音）
        hammerNoise: {
            enabled: true,
            gain: 0.03,              // 控えめなブレスノイズ
            attack: 0.16,            // やや緩やかな立ち上がり
            decay: 0.1,                // 息の音の長さ
            filterType: 'lowpass',   // 高域をカットして柔らかい音に
            filterFreq: 2500,         // 低めで「ふーっ」という柔らかい息
            filterQ: 9.4             // 適度なロールオフ
        },
        // 持続的な息のノイズ（本体が鳴っている間ずっと）
        sustainNoise: {
            enabled: true,
            gain: 0.03,              // 控えめな持続ノイズ
            filterType: 'lowpass',
            filterFreq: 3200,        // 柔らかい息の音
            filterQ: 6
        },
        oscillators: [
            { type: 'triangle', detune: 0, gain: 0.35 },   // Breathy fundamental
            { type: 'sine', detune: 0, gain: 0.25 },       // Pure tone
            { type: 'square', detune: 2, gain: 0.08 },     // Breath noise texture
            { type: 'sine', partial: 2, gain: 0.12 },      // 2nd harmonic
            { type: 'sine', partial: 3, gain: 0.06 }       // Subtle upper harmonics
        ],
        filter: { type: 'lowpass', frequency: 2800, Q: 0.6 }, // Deep and warm
        envelope: {
            delay: 0.07,     // 本体の音を遅らせてブレスノイズが先に聞こえる
            attack: 0.2,     // Balanced breath attack
            decay: 0.0,
            sustain: 1.0,
            holdTime: 12.0,
            release: 0.25    // Shorter release
        }
    },
    synth_strings: {
        name: 'Synth String',
        category: 'Synth',
        oscillators: [
            { type: 'sawtooth', detune: 0, gain: 0.34 },
            { type: 'sawtooth', detune: 4, gain: 0.34 },
            { type: 'sawtooth', detune: -4, gain: 0.34 },
            { type: 'sine', octave: -1, gain: 0.225 }
        ],
        filter: { type: 'lowpass', frequency: 1500, Q: 1 },
        envelope: {
            attack: 0.15,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 20.0,
            release: 0.8
        }
    },
    pad: {
        name: 'Pad',
        category: 'Synth',
        oscillators: [
            { type: 'triangle', detune: 0, gain: 0.35 },
            { type: 'triangle', detune: 8, gain: 0.25 },
            { type: 'triangle', detune: -8, gain: 0.25 },
            { type: 'sine', detune: 0, gain: 0.35 }
        ],
        filter: { type: 'lowpass', frequency: 800, Q: 1.0 },
        envelope: {
            attack: 0.8,
            decay: 0.0,
            sustain: 1.0,
            holdTime: 20.0,
            release: 1.5
        }
    },
    bell: {
        name: 'Bell',
        category: 'Percussion',
        oscillators: [
            { type: 'sine', detune: 0, gain: 0.4 },
            { type: 'sine', partial: 2.0, gain: 0.25 },
            { type: 'sine', partial: 3.0, gain: 0.15 },
            { type: 'sine', partial: 4.2, gain: 0.1 },
            { type: 'sine', partial: 5.8, gain: 0.05 }
        ],
        filter: { type: 'lowpass', frequency: 8000, Q: 0.5 },
        envelope: {
            attack: 0.001,
            decay: 3.0,
            sustain: 0.0,
            holdTime: 0.1,
            release: 3.0
        }
    },
    cat: {
        name: 'Cat',
        category: 'Animals',
        vibrato: { rate: 3, depth: 15, delay: 0.2 },  // Slow, gentle vibrato
        pitchBend: { startOffset: -800, duration: 0.1, delay: 0 },  // Start low, rise to original
        pitchDrift: { duration: 1.2, delay: 0.12 },  // Settle at original pitch
        releasePitchBend: { amount: -120, duration: 0.4 },  // Further drop on release
        // "にーーーゃーーーぅ" multi-stage vowel sweep
        filterSweep: {
            stages: [
                { freq: 2200, hold: 0.3 },    // "にーーー" (high, nasal)
                { freq: 1000, duration: 0.5, hold: 0.6 },  // "ゃーーー" (mid, open)
                { freq: 550, duration: 0.25 }  // "ぅ" (low, rounded)
            ]
        },
        // Slight distortion for "nya" edge
        distortion: {
            preGain: 1.8,
            amount: 40,
            postGain: 0.9
        },
        // Nasal onset noise for "n/m" consonant feel
        hammerNoise: {
            enabled: true,
            gain: 0.58,
            filterFreq: 350,  // Low frequency for nasal "んn/m" sound
            filterQ: 10,      // Narrow band for nasal resonance
            attack: 0.008,
            decay: 0.1
        },
        oscillators: [
            // Main meow tone
            { type: 'triangle', detune: 0, gain: 1.4 },
            { type: 'sine', detune: 4, gain: 1.0 },
            // Harmonic richness
            { type: 'sawtooth', detune: 0, gain: 0.28 },
            // Upper harmonics
            { type: 'sine', partial: 2.0, gain: 0.5 },
            { type: 'sine', partial: 3.0, gain: 0.2 }
        ],
        filter: { type: 'bandpass', frequency: 2400, Q: 4.0 },  // Stronger resonance for vowel feel
        envelope: {
            attack: 0.2,
            decay: 0.25,
            sustain: 0.55,
            holdTime: 2.5,
            release: 0.5
        }
    },
    beagle: {
        name: 'Beagle',
        category: 'Animals',
        vibrato: { rate: 2, depth: 18, delay: 0.15 },  // Gentler vibrato, delayed
        pitchBend: { startOffset: -1000, duration: 0.07, delay: 0 },  // Start very low, rise to original
        pitchDrift: { target: -680, duration: 1.0, delay: 0.3 },  // Gradually drop during hold
        releasePitchBend: { amount: -250, duration: 0.15 },  // Fast, big drop on release
        // "わぁうーーー" vowel sweep
        filterSweep: {
            stages: [
                { freq: 700, hold: 0.08 },     // "わ" (initial)
                { freq: 1000, duration: 0.05, hold: 0.05 },  // "ぁ" (shorter)
                { freq: 400, duration: 0.12 }  // "うーーー" (closed "u" vowel)
            ]
        },
        // Breath onset for "ほ" feel
        hammerNoise: {
            enabled: true,
            gain: 0.22,
            filterFreq: 500,
            filterQ: 5,
            attack: 0.003,
            decay: 0.05
        },
        oscillators: [
            // Main tone - warm
            { type: 'triangle', detune: 0, gain: 1.0 },
            { type: 'sine', detune: 2, gain: 0.85 },
            // Slight harmonics
            { type: 'sawtooth', detune: 0, gain: 0.16 },
            // Formant harmonics
            { type: 'sine', partial: 1.8, gain: 0.42 },
            { type: 'sine', partial: 2.6, gain: 0.14 }
        ],
        filter: { type: 'bandpass', frequency: 850, Q: 3.0 },  // Stronger resonance for vowel
        envelope: {
            attack: 0.028,     // Stronger attack
            decay: 0.1,
            sustain: 0.6,
            holdTime: 2.5,
            release: 0.18      // Short release
        }
    },
    bulldog: {
        name: 'Bulldog',
        category: 'Animals',
        vibrato: { rate: 3, depth: 12, delay: 0.1 },  // Quick subtle vibrato for voice
        pitchBend: { startOffset: -2000, duration: 0.04, delay: 0 },  // Start low "ぅ" then rise to "ば"
        pitchDrift: { target: -200, duration: 1, delay: 0.5 },  // Gradual drop for ending "ぅ"
        releasePitchBend: { amount: -4000, duration: 0.2 },  // Further drop on release
        // "ぅばぅ" - closed to open to closed vowel
        filterSweep: {
            stages: [
                { freq: 400, hold: 0.1 },      // "ぅ" (closed, initial)
                { freq: 1100, duration: 0.06, hold: 0.08 },  // "ば/わ" (open, bright like dog)
                { freq: 350, duration: 0.12 }   // "ぅ" (closed, ending)
            ]
        },
        // Strong percussive attack noise
        hammerNoise: {
            enabled: true,
            gain: 0.3,
            filterFreq: 350,
            filterQ: 2.5,
            attack: 0.002,
            decay: 0.05
        },
        oscillators: [
            // Deep bass tone - C3 area
            { type: 'sine', octave: -1, gain: 0.32 },
            { type: 'triangle', octave: -1, detune: 3, gain: 0.2 },
            // Sub bass for weight
            { type: 'sine', octave: -2, gain: 0.2 },
            { type: 'triangle', octave: -2, detune: -3, gain: 0.08 },
            // Growl texture - sawtooth for roughness
            { type: 'sawtooth', octave: -1, gain: 0.12 },
            { type: 'sawtooth', octave: -1, detune: 5, gain: 0.096 },
            { type: 'sawtooth', octave: -1, detune: -5, gain: 0.096 },
            // High frequency dirt
            { type: 'sawtooth', octave: 0, detune: 7, gain: 0.144 },
            { type: 'sawtooth', octave: 1, detune: -8, gain: 0.032 },
            // Formant harmonics for voice quality (like dog)
            { type: 'sine', partial: 1.8, gain: 0.144 },
            { type: 'sine', partial: 2.6, detune: -4, gain: 0.08 },
            { type: 'sine', partial: 3.2, gain: 0.048 },
            // High dirty harmonics
            { type: 'sine', partial: 4.5, detune: 10, gain: 0.192 },
            { type: 'sine', partial: 6.0, detune: -12, gain: 0.104 },
            { type: 'sawtooth', partial: 5.5, detune: 15, gain: 0.02 }
        ],
        filter: { type: 'lowpass', frequency: 650, Q: 2.8 },  // Higher Q for vocal resonance
        envelope: {
            attack: 0.008,    // Fast but not instant attack
            decay: 0.2,       // Longer decay
            sustain: 0.3,     // More sustain for voice
            holdTime: 0.5,    // Longer hold for "ばぅー"
            release: 0.25     // Natural fade
        }
    },
    monkey: {
        name: 'Monkey',
        category: 'Animals',
        vibrato: { rate: 2, depth: 18, delay: 0.15 },  // Gentler vibrato, delayed
        pitchBend: { startOffset: -600, duration: 0.2, delay: 0 },  // Start very low, fast rise
        pitchDrift: { duration: 0.8, delay: 0.2 },  // Settle at original pitch
        // releasePitchBend: { amount: 300, duration: 0.08 },  // Whip up on release
        // "きーーーぃーーー" multi-stage vowel sweep
        filterSweep: {
            stages: [
                { freq: 3200, hold: 0.15 },   // "きーーー" (high, sharp)
                { freq: 3800, duration: 0.1, hold: 0.3 },  // "ぃーーー" (rise)
                { freq: 3000, duration: 0.2 }  // settle
            ]
        },
        oscillators: [
            // High-pitched screech "ki" sound - 2 octaves up
            { type: 'sawtooth', detune: 0, gain: 0.18, octave: 2 },
            { type: 'triangle', detune: 4, gain: 0.2, octave: 1 },
            // Bright harmonics for shrillness
            { type: 'sine', partial: 2.0, gain: 0.22, octave: 2 },
            { type: 'sine', partial: 3.0, gain: 0.1, octave: 1 },
            { type: 'sine', partial: 4.5, gain: 0.04, octave: 2 }
        ],
        filter: { type: 'highpass', frequency: 3500, Q: 1.2 },  // Higher cutoff for 2 octaves up
        envelope: {
            attack: 0.1,    // Very quick attack for "ki"
            decay: 0.1,
            sustain: 0.7,
            holdTime: 1.5,
            release: 0.2
        }
    }
};

function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        // Soft clipping curve: Math.tanh(x) is a natural choice
        curve[i] = Math.tanh(x);
    }
    return curve;
}

// Label mapping for different notation systems
const NOTE_LABELS = {
    'C': { eng: 'C', abc: 'C', sol: 'Do', jp: 'ド', svara: 'स' },
    'D': { eng: 'D', abc: 'D', sol: 'Re', jp: 'レ', svara: 'रे' },
    'E': { eng: 'E', abc: 'E', sol: 'Mi', jp: 'ミ', svara: 'ग' },
    'F': { eng: 'F', abc: 'F', sol: 'Fa', jp: 'ﾌｧ', svara: 'म' },
    'G': { eng: 'G', abc: 'G', sol: 'So', jp: 'ソ', svara: 'प' },
    'A': { eng: 'A', abc: 'A', sol: 'La', jp: 'ラ', svara: 'ध' },
    'B': { eng: 'B', abc: 'B', sol: 'Ti', jp: 'シ', svara: 'नि' }
};

function isNativeCapacitor() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

const APP_REVIEW_STORAGE_KEY = 'gradatone-review-state';
const APP_REVIEW_SESSION_KEY = 'gradatone-review-session-counted';
const APP_REVIEW_LAUNCH_THRESHOLD = 10;
const APP_REVIEW_COOLDOWN_DAYS = 30;
const APP_REVIEW_PROMPT_DELAY_MS = 5000;

function readAppReviewState() {
    try {
        const raw = localStorage.getItem(APP_REVIEW_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                launchCount: Math.max(0, Number(parsed.launchCount) || 0),
                lastRequestedAt: parsed.lastRequestedAt ?? null
            };
        }
    } catch (e) {
        console.warn('readAppReviewState:', e);
    }
    return { launchCount: 0, lastRequestedAt: null };
}

function writeAppReviewState(state) {
    try {
        localStorage.setItem(APP_REVIEW_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('writeAppReviewState:', e);
    }
}

function daysSinceIsoDate(isoDate) {
    return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function recordLaunchIfNewSession() {
    try {
        if (sessionStorage.getItem(APP_REVIEW_SESSION_KEY)) {
            return readAppReviewState().launchCount;
        }
        sessionStorage.setItem(APP_REVIEW_SESSION_KEY, '1');
    } catch (e) {
        // sessionStorage 不可なら毎回加算
    }
    const state = readAppReviewState();
    state.launchCount += 1;
    writeAppReviewState(state);
    return state.launchCount;
}

function shouldRequestAppReview(launchCount, state) {
    if (launchCount < APP_REVIEW_LAUNCH_THRESHOLD) return false;
    if (state.lastRequestedAt && daysSinceIsoDate(state.lastRequestedAt) < APP_REVIEW_COOLDOWN_DAYS) {
        return false;
    }
    return true;
}

async function requestNativeAppReview() {
    const plugin = window.Capacitor?.Plugins?.InAppReview;
    if (!plugin?.requestReview) return false;
    await plugin.requestReview();
    return true;
}

/** ネイティブ版の起動時。10回目以降かつ前回依頼から30日経過後にストアのレビュー依頼を出す。 */
async function maybeRequestAppReviewOnLaunch() {
    if (!isNativeCapacitor()) return;

    const state = readAppReviewState();
    const launchCount = recordLaunchIfNewSession();
    if (!shouldRequestAppReview(launchCount, state)) return;

    await new Promise((resolve) => setTimeout(resolve, APP_REVIEW_PROMPT_DELAY_MS));

    try {
        const ok = await requestNativeAppReview();
        if (ok) {
            writeAppReviewState({ ...readAppReviewState(), lastRequestedAt: new Date().toISOString() });
        }
    } catch (e) {
        console.warn('[AppReview] request failed', e);
    }
}

function getGradatoneAudioSessionPlugin() {
    const cap = window.Capacitor;
    if (!cap) return null;
    return (
        (cap.Plugins && cap.Plugins.GradatoneAudioSession) ||
        (typeof cap.registerPlugin === 'function'
            ? cap.registerPlugin('GradatoneAudioSession')
            : null)
    );
}

async function waitForCapacitorBridge(maxMs = 5000) {
    if (!isNativeCapacitor()) return;
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
        if (getGradatoneAudioSessionPlugin()) return;
        await new Promise((r) => setTimeout(r, 50));
    }
}

/** WKWebView 用: 極短の無音 MP3（HTML audio で Web プロセスの session を playback に寄せる） */
const IOS_SILENT_MP3 =
    'data:audio/mp3;base64,//tAxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzZmZmZmZmZmZmZmZmZmZmZmZmZmaZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////8AAAA5TEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAABEhNIZS0AAAAAAD/+0DEAAPH3Yz0AAR8CPqyIEABp6AxjG/4x/XiInE4lfQDFwIIRE+uBgZoW4RL0OLMDFn6E5v+/u5ehf76bu7/6bu5+gAiIQGAABQIUJ0QolFghEn/9PhZQpcUTpXMjo0OGzRCZXyKxoIQzB2KhCtGobpT9TRVj/3Pmfp+f8X7Pu1B04sTnc3s0XhOlXoGVCMNo9X//9/r6a10TZEY5DsxqvO7mO5qFvpFCmKIjhpSItGsUYcRO//7QsQRgEiljQIAgLFJAbIhNBCa+JmorCbOi5q9nVd2dKnusTMQg4MFUlD6DQ4OFijwGAijRMfLbHG4nLVTjydyPlJTj8pfPflf9/5GD950A5e+jsrmNZSjSirjs1R7hnkia8vr//l/7Nb+crvr9Ok5ZJOylUKRxf/P9Zn0j2P4pJYXyKkeuy5wUYtdmOu6uobEtFqhIJViLEKIjGxchGev/L3Y0O3bwrIOszTBAZ7Ih28EUaSOZf/7QsQfg8fpjQIADN0JHbGgQBAZ8T//y//t/7d/2+f5m7MdCeo/9tdkMtGLbt1tqnabRroO1Qfvh20yEbei8nfDXP7btW7f9/uO9tbe5IvHQbLlxpf3DkAk0ojYcv///5/u3/7PTfGjPEPUvt5D6f+/3Lea4lz4tc4TnM/mFPrmalWbboeNiNyeyr+vufttZuvrVrt/WYv3T74JFo8qEDiJqJrmDTs///v99xDku2xG02jjunrICP/7QsQtA8kpkQAAgNMA/7FgQAGnobgfghgqA+uXwWQ3XFmGimSbe2X3ksY//KzK1a2k6cnNWOPJnPWUsYbKqkh8RJzrVf///P///////4vyhLKHLrCb5nIrYIUss4cthigL1lQ1wwNAc6C1pf1TIKRSkt+a//z+yLVcwlXKSqeSuCVQFLng2h4AFAFgTkH+Z/8jTX/zr//zsJV/5f//5UX/0ZNCNCCaf5lTCTRkaEdhNP//n/KUjf/7QsQ5AEhdiwAAjN7I6jGddBCO+WGTQ1mXrYatSAgaykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==';

function setNavigatorAudioSessionPlayback() {
    try {
        if (navigator.audioSession && 'type' in navigator.audioSession) {
            navigator.audioSession.type = 'playback';
        }
    } catch (e) {
        console.warn('navigator.audioSession:', e);
    }
}

function disableIosSilentBypassAudio() {
    const el = document.getElementById('gradatone-ios-audio-session');
    if (el) {
        el.muted = true;
    }
}

async function enableIosSilentBypassAudio({ create = false } = {}) {
    if (!isNativeCapacitor()) return;
    let el = document.getElementById('gradatone-ios-audio-session');
    if (!el && create) {
        el = document.createElement('audio');
        el.id = 'gradatone-ios-audio-session';
        el.loop = true;
        el.volume = 0.01;
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        el.src = IOS_SILENT_MP3;
        document.body.appendChild(el);
        try {
            await el.play();
        } catch (e) {
            console.warn('ios silent bypass play:', e);
        }
    } else if (el) {
        el.muted = false;
        try {
            if (el.paused) {
                await el.play();
            }
        } catch (e) {
            console.warn('ios silent bypass resume:', e);
        }
    }
}

let nativeAudioSessionConfigured = false;

/** ネイティブ AVAudioSession + Web プロセス側の playback 化（消音スイッチ対策） */
async function configureNativeAudioSession({ userGesture = false, force = false } = {}) {
    if (!isNativeCapacitor()) return;
    setNavigatorAudioSessionPlayback();

    const needsFullSetup = force || !nativeAudioSessionConfigured;
    if (!needsFullSetup) {
        if (userGesture) {
            await enableIosSilentBypassAudio({ create: false });
        }
        return;
    }

    try {
        const plugin = getGradatoneAudioSessionPlugin();
        if (plugin && typeof plugin.configure === 'function') {
            await plugin.configure();
            if (!nativeAudioSessionConfigured) {
                await new Promise((r) => setTimeout(r, 0));
                await plugin.configure();
            }
        }
    } catch (e) {
        console.warn('GradatoneAudioSession configure:', e);
    }
    if (userGesture) {
        await enableIosSilentBypassAudio({ create: !nativeAudioSessionConfigured });
    } else {
        await enableIosSilentBypassAudio({ create: false });
    }
    nativeAudioSessionConfigured = true;
}

/** 離した瞬間の画面速度（px/s）。windowStart〜windowEnd ms 前の区間を区間平均（合計変位÷合計時間） */
function computeReleaseScreenVelocity(
    positionHistory,
    nowMs = Date.now(),
    windowStartMs = 100,
    windowEndMs = 20
) {
    if (!positionHistory || positionHistory.length < 2) {
        return { velocityX: 0, velocityY: 0, method: 'empty' };
    }

    const recent = positionHistory
        .filter((e) => {
            const ageMs = nowMs - e.time;
            return ageMs >= windowEndMs && ageMs <= windowStartMs;
        })
        .sort((a, b) => a.time - b.time);

    if (recent.length < 2) {
        return { velocityX: 0, velocityY: 0, method: 'short-window' };
    }

    let sumDx = 0;
    let sumDy = 0;
    let sumDt = 0;
    for (let i = 1; i < recent.length; i++) {
        const a = recent[i - 1];
        const b = recent[i];
        const dt = (b.time - a.time) / 1000;
        if (dt <= 0) continue;
        sumDx += b.x - a.x;
        sumDy += b.y - a.y;
        sumDt += dt;
    }

    if (sumDt <= 0) {
        return { velocityX: 0, velocityY: 0, method: 'none' };
    }

    const velocityX = sumDx / sumDt;
    const velocityY = sumDy / sumDt;
    return {
        velocityX,
        velocityY,
        method: 'window-average',
        bestSpeed: Math.hypot(velocityX, velocityY)
    };
}

class Gradatone {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.masterCompressor = null;
        this.activeTouches = new Map();
        this.touchIndicators = new Map(); // Track visual indicators
        this.labelStartedTouches = new Map(); // Track touches that started on labels
        this.ownedTouchIds = new Set(); // canvas 上で開始したタッチ
        this.cancelledTouchIds = new Set(); // touchend が touchstart(非同期) より先に来た ID
        this.pendingStartTouchIds = new Set(); // 音生成待ち（iOS 高速連打で欠落しないよう）
        this.deferredTouchEnds = new Map(); // 音生成前に離れたタッチ → 生成直後に stop
        this._audioReadyInFlight = null;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startButton = document.getElementById('startButton');
        this.transposeSelect = document.getElementById('transposeSelect');
        this.scaleSelect = document.getElementById('scaleSelect');
        this.labelSelect = document.getElementById('labelSelect');
        this.snapSelect = document.getElementById('snapSelect');
        this.instrumentControls = document.getElementById('instrumentControls');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.controlsContainer = document.getElementById('controlsContainer');

        // Debug: track mouse event timing
        this.mouseDownTime = null;
        this.lastMouseMoveTime = null;

        // Snap feature
        this.snapMode = 'whole'; // 'off', 'semi', 'whole'
        this.snapDelay = 0.15; // 0.15 seconds (150ms)

        // Transpose feature
        this.transposeOffset = 0; // -6 to +6 semitones

        // Scale mode
        this.currentScale = 'major'; // Default scale

        // Label mode
        this.labelMode = 'C/G'; // 'C/G', 'ABC', 'Do/So', 'DoReMi', 'ド/ソ', 'ドレミ', 'off'

        // Label position (portrait: right/left/both, landscape: bottom/top/both)
        this.labelPositionPortrait = 'right'; // 'right', 'left', 'both'
        this.labelPositionLandscape = 'bottom'; // 'bottom', 'top', 'both'

        // Settings visibility
        this.settingsOpen = false;

        // Instrument layers
        this.layers = [];
        this.nextLayerId = 0;

        // Audio parameters
        this.minFreq = 55; // A1
        this.maxFreq = 440; // A4 for mobile, will adjust for desktop
        this.decayTime = 7.0; // Very long sustain (2x original)
        this.releaseTime = 0.5;

        // Orientation
        this.isPortrait = false;

        // Load settings before any drawing
        this.loadSnapSettings(); // Load snap setting from localStorage
        this.loadScaleSettings(); // Load scale setting from localStorage
        this.loadLabelSettings(); // Load label setting from localStorage
        this.loadTransposeSettings(); // Load transpose setting from localStorage
        this.loadSettingsVisibility(); // Load settings visibility from localStorage

        this.setupCanvas();

        // Load layer configuration or add default
        if (!this.loadLayerConfig()) {
            this.addLayer('piano'); // Add first layer (default: piano)
        }

        this.setupEventListeners();
        this.adjustFrequencyRange();
        this.setupPitchLabels();
        this.drawGuideLines();
        this.updateLayerUI(); // Update UI for loaded layers
        this.toggleOrientationClass(); // Added: Call to toggle orientation class on body
        this.updateControlLabels(); // Update control labels based on screen size

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.adjustFrequencyRange();
            this.adjustLayerCount(); // Adjust layer count based on screen size
            this.setupPitchLabels();
            this.drawGuideLines();
            this.toggleOrientationClass(); // Added: Call to toggle orientation class on body
            this.updateLayerUI(); // Update layer control positions
            this.updateControlLabels(); // Update control labels based on screen size
        });

        window.__gradatone = this;
    }

    // Calculate maximum layers based on screen aspect ratio
    getMaxLayers() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const shortSide = Math.min(width, height);

        // Based on short side length, determine max layers
        // 16:9 aspect ratio (1920x1080, 1280x720, etc.) → short side ~56% → 3 layers
        // 1:1 aspect ratio (square) → short side 100% → 4 layers
        // Use short side as percentage of long side to determine layers

        const aspectRatio = Math.max(width, height) / shortSide;

        if (aspectRatio >= 1.77) {
            // 16:9 or wider (e.g., 21:9) → 3 layers
            return 3;
        } else if (aspectRatio >= 1.5) {
            // Between 3:2 and 16:9 → 3 layers
            return 3;
        } else if (aspectRatio >= 1.3) {
            // Between 4:3 and 3:2 → 4 layers
            return 4;
        } else {
            // Close to 1:1 or portrait → 4 layers
            return 4;
        }
    }

    // Adjust layer count based on screen size
    adjustLayerCount() {
        const maxLayers = this.getMaxLayers();

        // Remove excess layers from the end
        let removed = false;
        while (this.layers.length > maxLayers) {
            const removedLayer = this.layers.pop();
            removed = true;
        }

        // Update area indices
        this.layers.forEach((layer, i) => {
            layer.areaIndex = i;
        });

        // Update UI and save if layers were removed
        if (removed) {
            this.updateLayerUI();
            this.saveLayerConfig(); // Save to localStorage
        }
    }

    getLabelEdgeInset() {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const base = parseFloat(style.getPropertyValue('--label-edge-inset-base')) || 20;
        const safeTop = parseFloat(style.getPropertyValue('--safe-top')) || 0;
        const safeRight = parseFloat(style.getPropertyValue('--safe-right')) || 0;
        const safeBottom = parseFloat(style.getPropertyValue('--safe-bottom')) || 0;
        const safeLeft = parseFloat(style.getPropertyValue('--safe-left')) || 0;
        const uiMin = parseFloat(style.getPropertyValue('--ui-inset-min')) || 12;
        if (this.isPortrait) {
            return Math.max(base, uiMin, safeTop, safeBottom);
        }
        return Math.max(base, uiMin, safeLeft, safeRight);
    }

    getPlayableSpan() {
        const edgeInset = this.getLabelEdgeInset();
        if (this.isPortrait) {
            return {
                start: edgeInset,
                size: Math.max(0, this.canvasHeight - edgeInset * 2)
            };
        }
        return {
            start: edgeInset,
            size: Math.max(0, this.canvasWidth - edgeInset * 2)
        };
    }

    getRatioFromPlayablePosition(pos) {
        const { start, size } = this.getPlayableSpan();
        if (size <= 0) return 0;
        // 画面端（playable 外）も線形外挿 — min/max 音階で止めない（慣性と同様）
        if (this.isPortrait) {
            return 1 - (pos - start) / size;
        }
        return (pos - start) / size;
    }

    /** 音階ラベル・ガイド線・タッチ音程で共通の座標（ratio 0=低音端, 1=高音端） */
    getPlayablePositionFromRatio(ratio) {
        const { start, size } = this.getPlayableSpan();
        if (this.isPortrait) {
            return start + (1 - ratio) * size;
        }
        return start + ratio * size;
    }

    getUiBottomOffsetPx() {
        const style = getComputedStyle(document.documentElement);
        const safeBottom = parseFloat(style.getPropertyValue('--safe-bottom')) || 0;
        const uiBottom = parseFloat(style.getPropertyValue('--ui-bottom')) || 12;
        const uiMin = parseFloat(style.getPropertyValue('--ui-inset-min')) || 12;
        return safeBottom + Math.max(uiBottom, uiMin);
    }

    refreshLayerControlPositions() {
        this.layers.forEach((layer, index) => {
            const controlDiv = this.instrumentControls.querySelector(`[data-layer-id="${layer.id}"]`);
            if (controlDiv) {
                this.positionLayerControl(controlDiv, index, this.layers.length);
            }
        });
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
    }

    drawGuideLines() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw 35% control area background (grid dot pattern for non-slip effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        const totalLayers = this.layers.length;
        const dotRadius = 2; // Radius of each dot
        const dotSpacing = 8; // Space between dot centers (both horizontal and vertical)

        for (let i = 0; i < totalLayers; i++) {
            if (this.isPortrait) {
                // Portrait: left 35% of each layer
                const layerWidth = this.canvasWidth / totalLayers;
                const layerLeft = i * layerWidth;
                const controlWidth = layerWidth * 0.35;

                // Draw grid dot pattern
                for (let y = dotSpacing / 2; y < this.canvasHeight; y += dotSpacing) {
                    for (let x = layerLeft + dotSpacing / 2; x < layerLeft + controlWidth; x += dotSpacing) {
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            } else {
                // Landscape: top 35% of each layer
                const layerHeight = this.canvasHeight / totalLayers;
                const layerTop = i * layerHeight;
                const controlHeight = layerHeight * 0.35;

                // Draw grid dot pattern
                for (let y = layerTop + dotSpacing / 2; y < layerTop + controlHeight; y += dotSpacing) {
                    for (let x = dotSpacing / 2; x < this.canvasWidth; x += dotSpacing) {
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }

        // Draw layer dividers if multiple layers (same style as guide lines)
        if (this.layers.length > 1) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 3; // Same as C note lines

            for (let i = 1; i < this.layers.length; i++) {
                const ratio = i / this.layers.length;

                if (this.isPortrait) {
                    // Portrait: vertical dividers (left-right)
                    const x = ratio * this.canvasWidth;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, 0);
                    this.ctx.lineTo(x, this.canvasHeight);
                    this.ctx.stroke();
                } else {
                    // Landscape: horizontal dividers (top-bottom)
                    const y = ratio * this.canvasHeight;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, y);
                    this.ctx.lineTo(this.canvasWidth, y);
                    this.ctx.stroke();
                }
            }
        }

        // Get scale pattern for current scale
        const scale = SCALES[this.currentScale];
        const scalePattern = scale ? scale.pattern : [0, 2, 4, 5, 7, 9, 11]; // Default to major
        const rootOffset = scale ? scale.rootOffset : 0;
        
        // Apply rootOffset to scale pattern (NOT transposeOffset - guide lines stay fixed)
        // rootOffset shifts the scale to its proper root (e.g., Minor starts from A, not C)
        // Transpose only changes the pitch, not the visual position of guide lines
        const scaleNotes = scalePattern.map(note => (note + rootOffset + 120) % 12);
        
        // Root note position (for thick line) - also fixed, no transpose
        const rootNoteIndex = (rootOffset + 120) % 12;
        // Dominant (5th) note - 7 semitones above root
        const dominantNoteIndex = (rootNoteIndex + 7) % 12;
        
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Calculate total semitones in range
        const totalSemitones = Math.log2(this.maxFreq / this.minFreq) * 12;

        // Starting semitone based on minFreq
        // A1=55Hz is 9 semitones from C, A2=110Hz is 21, A3=220Hz is 33
        const startingSemitone = Math.round(Math.log2(this.minFreq / 16.35) * 12); // 16.35 is C0

        // Draw guide lines for each scale note with volume curtain gradient per layer
        const baseOpacity = 0.15;
        const prominentOpacity = 0.4; // Higher opacity for root and dominant
        // Use totalLayers already declared above

        for (let semitone = 0; semitone <= totalSemitones; semitone++) {
            const absoluteSemitone = (startingSemitone + semitone) % 12;

            // Check if this semitone is in the current scale
            if (scaleNotes.includes(absoluteSemitone)) {
                // Root gets thicker line, root and dominant get higher opacity
                const isRoot = absoluteSemitone === rootNoteIndex;
                const isDominant = absoluteSemitone === dominantNoteIndex;
                const isProminent = isRoot || isDominant;
                this.ctx.lineWidth = isRoot ? 3 : 1;
                const opacity = isProminent ? prominentOpacity : baseOpacity;

                // Calculate position using logarithmic scale
                const ratio = semitone / totalSemitones;

                if (this.isPortrait) {
                    // Portrait: horizontal lines（ラベル位置と同じ inset 付き座標）
                    const y = this.getPlayablePositionFromRatio(ratio);
                    
                    // Draw line segment for each layer with its own gradient
                    for (let layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
                        const layerWidth = this.canvasWidth / totalLayers;
                        const layerLeft = layerIndex * layerWidth;
                        const layerRight = (layerIndex + 1) * layerWidth;

                        // Create gradient for this layer (left to right within the layer)
                        const gradient = this.ctx.createLinearGradient(layerLeft, 0, layerRight, 0);
                        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);         // 0%: transparent
                        gradient.addColorStop(0.05, `rgba(255, 255, 255, 0)`);      // 5%: transparent
                        gradient.addColorStop(0.15, `rgba(255, 255, 255, ${opacity})`); // 15%: opaque
                        gradient.addColorStop(0.85, `rgba(255, 255, 255, ${opacity})`); // 85%: opaque
                        gradient.addColorStop(0.95, `rgba(255, 255, 255, 0)`);      // 95%: transparent
                        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);         // 100%: transparent

                        this.ctx.strokeStyle = gradient;
                        this.ctx.beginPath();
                        this.ctx.moveTo(layerLeft, y);
                        this.ctx.lineTo(layerRight, y);
                        this.ctx.stroke();
                    }
                } else {
                    // Landscape: vertical lines（ラベル位置と同じ inset 付き座標）
                    const x = this.getPlayablePositionFromRatio(ratio);
                    
                    // Draw line segment for each layer with its own gradient
                    for (let layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
                        const layerHeight = this.canvasHeight / totalLayers;
                        const layerTop = layerIndex * layerHeight;
                        const layerBottom = (layerIndex + 1) * layerHeight;

                        // Create gradient for this layer (top to bottom within the layer)
                        const gradient = this.ctx.createLinearGradient(0, layerTop, 0, layerBottom);
                        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);         // 0%: transparent
                        gradient.addColorStop(0.05, `rgba(255, 255, 255, 0)`);      // 5%: transparent
                        gradient.addColorStop(0.15, `rgba(255, 255, 255, ${opacity})`); // 15%: opaque
                        gradient.addColorStop(0.85, `rgba(255, 255, 255, ${opacity})`); // 85%: opaque
                        gradient.addColorStop(0.95, `rgba(255, 255, 255, 0)`);      // 95%: transparent
                        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);         // 100%: transparent

                        this.ctx.strokeStyle = gradient;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, layerTop);
                        this.ctx.lineTo(x, layerBottom);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    getPositionFromFrequency(frequency) {
        const baseFreq = frequency / Math.pow(2, this.transposeOffset / 12);

        const logMin = Math.log2(this.minFreq);
        const logMax = Math.log2(this.maxFreq);
        const logFreq = Math.log2(baseFreq);
        const ratio = (logFreq - logMin) / (logMax - logMin);

        return this.getPlayablePositionFromRatio(ratio);
    }

    // Get screen coordinates (clientX, clientY) from frequency
    getScreenPositionFromFrequency(frequency, currentClientX, currentClientY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasPos = this.getPositionFromFrequency(frequency);

        if (this.isPortrait) {
            // Portrait: move Y, keep X
            return {
                x: currentClientX,
                y: rect.top + canvasPos
            };
        } else {
            // Landscape: move X, keep Y
            return {
                x: rect.left + canvasPos,
                y: currentClientY
            };
        }
    }

    adjustFrequencyRange() {
        // Detect orientation
        this.isPortrait = window.innerHeight > window.innerWidth;

        // Adjust octave range based on screen width
        const width = window.innerWidth;
        if (width >= 1200) {
            // Desktop: A1 to A6 (5 octaves)
            this.minFreq = 55; // A1
            this.maxFreq = 1760; // A6
        } else if (width >= 768) {
            // Tablet: A2 to A5 (3 octaves)
            this.minFreq = 110; // A2
            this.maxFreq = 880; // A5
        } else {
            // Mobile: A3 to A6 (3 octaves)
            this.minFreq = 220; // A3
            this.maxFreq = 1760; // A6
        }
    }

    toggleOrientationClass() {
        // Apply to both container and body for CSS selectors
        const container = document.querySelector('.container');
        const body = document.body;

        if (this.isPortrait) {
            container.classList.add('portrait');
            container.classList.remove('landscape');
            body.classList.add('portrait');
            body.classList.remove('landscape');
        } else {
            container.classList.add('landscape');
            container.classList.remove('portrait');
            body.classList.add('landscape');
            body.classList.remove('portrait');
        }
    }

    updateControlLabels() {
        // Update control labels based on screen size (use short labels on mobile)
        const isMobile = window.innerWidth <= 768;
        const controlTexts = document.querySelectorAll('.control-text[data-short]');
        
        controlTexts.forEach(element => {
            const fullText = element.getAttribute('data-full');
            const shortText = element.getAttribute('data-short');
            element.textContent = isMobile ? shortText : fullText;
        });
    }

    setupPitchLabels() {
        const container = document.getElementById('pitchLabels');
        container.innerHTML = '';

        // Update container class based on orientation and position
        container.classList.remove('portrait', 'landscape', 'pos-right', 'pos-left', 'pos-both', 'pos-bottom', 'pos-top');
        
        if (this.isPortrait) {
            container.classList.add('portrait', `pos-${this.labelPositionPortrait}`);
        } else {
            container.classList.add('landscape', `pos-${this.labelPositionLandscape}`);
        }

        const labels = this.generatePitchLabels();
        const currentPosition = this.isPortrait ? this.labelPositionPortrait : this.labelPositionLandscape;
        const positions = currentPosition === 'both' 
            ? (this.isPortrait ? ['right', 'left'] : ['bottom', 'top']) 
            : [currentPosition];

        positions.forEach(pos => {
            labels.forEach(labelData => {
                const div = document.createElement('div');
                div.className = labelData.isFullMode ? 'pitch-label pitch-label-full' : 'pitch-label';
                div.classList.add(`label-${pos}`);
                
                // For svara mode, HTML is already included (komal/tivra spans)
                // For other modes, replace # with superscript
                const labelType = this.getLabelType();
                const displayName = labelType === 'svara' 
                    ? labelData.name 
                    : labelData.name.replace(/#/g, '<sup>#</sup>');
                div.innerHTML = displayName;

                if (this.isPortrait) {
                    div.style.top = `${labelData.position}px`;
                } else {
                    div.style.left = `${labelData.position}px`;
                }


                container.appendChild(div);
            });
        });
    }

    toggleLabelPosition() {
        if (this.isPortrait) {
            // Portrait: right -> left -> both -> right
            const sequence = ['right', 'left', 'both'];
            const currentIndex = sequence.indexOf(this.labelPositionPortrait);
            this.labelPositionPortrait = sequence[(currentIndex + 1) % sequence.length];
        } else {
            // Landscape: bottom -> top -> both -> bottom
            const sequence = ['bottom', 'top', 'both'];
            const currentIndex = sequence.indexOf(this.labelPositionLandscape);
            this.labelPositionLandscape = sequence[(currentIndex + 1) % sequence.length];
        }
        this.saveLabelSettings();
        this.setupPitchLabels();
    }

    isPointOnLabel(clientX, clientY) {
        // Check if the point is on any pitch label element
        const container = document.getElementById('pitchLabels');
        if (!container) return false;
        
        const labels = container.querySelectorAll('.pitch-label');
        for (const label of labels) {
            const rect = label.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom) {
                return true;
            }
        }
        return false;
    }

    generatePitchLabels() {
        // If label mode is off, return empty array
        if (this.labelMode === 'off') {
            return [];
        }

        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Determine display mode and label type
        const is2NoteMode = ['C/G', 'Do/So', 'ド/ソ', 'स/प'].includes(this.labelMode);
        const labelType = this.getLabelType();
        
        // Get scale pattern (same as guide lines - NO transposeOffset for position)
        const scale = SCALES[this.currentScale];
        const scalePattern = scale ? scale.pattern : [0, 2, 4, 5, 7, 9, 11];
        const rootOffset = scale ? scale.rootOffset : 0;
        
        // Scale notes for position (same as guide lines - fixed position)
        const scaleNotes = scalePattern.map(note => (note + rootOffset + 120) % 12);
        
        // Root note position (for determining which labels to show)
        const rootNoteIndex = (rootOffset + 120) % 12;
        
        // For 2-note mode, find tonic and dominant positions
        let targetSemitones;
        if (is2NoteMode) {
            // Tonic is the root note
            const tonicSemitone = rootNoteIndex;
            // Dominant is typically 5th scale degree (7 semitones from root)
            const dominantSemitone = (rootNoteIndex + 7 + 120) % 12;
            targetSemitones = [tonicSemitone, dominantSemitone];
        } else {
            // Full mode: all notes in the scale
            targetSemitones = scaleNotes;
        }

        const labels = [];

        // Calculate total semitones in range
        const totalSemitones = Math.log2(this.maxFreq / this.minFreq) * 12;

        // Starting semitone based on minFreq
        const startingSemitone = Math.round(Math.log2(this.minFreq / 16.35) * 12); // 16.35 is C0

        // Find all target notes in the range (matching guide lines exactly)
        for (let semitone = 0; semitone <= totalSemitones; semitone++) {
            const absoluteSemitone = (startingSemitone + semitone) % 12;

            // Only add labels for notes in the scale (same as guide lines)
            if (targetSemitones.includes(absoluteSemitone)) {
                // Apply transpose to the displayed note name (the actual pitch that will sound)
                const transposedSemitone = (absoluteSemitone + this.transposeOffset + 120) % 12;
                const noteName = notes[transposedSemitone];
                // Octave also affected by transpose
                const octave = Math.floor((startingSemitone + semitone + this.transposeOffset) / 12);

                // Get label based on label mode
                const displayLabel = this.getDisplayLabel(noteName, labelType);

                const ratio = semitone / totalSemitones;
                const position = this.getPlayablePositionFromRatio(ratio);

                labels.push({
                    name: is2NoteMode ? `${displayLabel}${octave}` : displayLabel,
                    position: position,
                    isFullMode: !is2NoteMode
                });
            }
        }

        return labels;
    }

    getLabelType() {
        // Determine label type from labelMode
        switch (this.labelMode) {
            case 'C/G':
                return 'eng';
            case 'ABC':
                return 'abc';
            case 'Do/So':
            case 'DoReMi':
                return 'sol';
            case 'ド/ソ':
            case 'ドレミ':
                return 'jp';
            case 'स/प':
            case 'स्वर':
                return 'svara';
            default:
                return 'eng';
        }
    }

    getDisplayLabel(noteName, labelType, asHtml = true) {
        // Extract base note and accidental (sharp/flat)
        const baseNote = noteName[0];
        const accidental = noteName.substring(1); // e.g., '#', '♯', etc.
        
        // Get label from NOTE_LABELS
        if (NOTE_LABELS[baseNote]) {
            const baseLabel = NOTE_LABELS[baseNote][labelType];
            
            // For svara (Indian notation), use traditional komal/tivra marks
            if (labelType === 'svara') {
                if (accidental === '#' || accidental === '♯') {
                    // Tivra (sharp) - only Ma can be tivra, shown with overline
                    if (asHtml) {
                        return `<span class="tivra">${baseLabel}</span>`;
                    } else {
                        // Use upward arrow for tivra in plain text
                        return baseLabel + '↑';
                    }
                } else if (accidental === 'b' || accidental === '♭') {
                    // Komal (flat) - Re, Ga, Dha, Ni can be komal, shown with underline
                    if (asHtml) {
                        return `<span class="komal">${baseLabel}</span>`;
                    } else {
                        // Use downward arrow for komal in plain text
                        return baseLabel + '↓';
                    }
                }
                return baseLabel;
            }
            
            return baseLabel + accidental;
        }
        
        // Fallback: return original note name
        return noteName;
    }

    loadSnapSettings() {
        // Load snap setting from localStorage
        try {
            const savedSnap = localStorage.getItem('gradatone_snap_mode');

            if (savedSnap !== null) {
                this.snapMode = savedSnap;
            }
            
            // Ensure DOM element exists and sync with current mode
            if (this.snapSelect) {
                this.snapSelect.value = this.snapMode;
            } else {
                console.warn('⚠️ snapSelect element not found');
            }
        } catch (e) {
            console.warn('Could not load snap settings:', e);
        }
    }

    saveSnapSettings() {
        // Save snap setting to localStorage
        try {
            localStorage.setItem('gradatone_snap_mode', this.snapMode);
        } catch (e) {
            console.warn('Could not save snap settings:', e);
        }
    }

    loadScaleSettings() {
        // Load scale setting from localStorage
        try {
            const savedScale = localStorage.getItem('gradatone_scale');

            if (savedScale !== null && SCALES[savedScale]) {
                this.currentScale = savedScale;

                // Ensure DOM element exists
                if (this.scaleSelect) {
                    this.scaleSelect.value = this.currentScale;
                } else {
                    console.warn('⚠️ scaleSelect element not found');
                }
            }
        } catch (e) {
            console.warn('Could not load scale settings:', e);
        }
    }

    saveScaleSettings() {
        // Save scale setting to localStorage
        try {
            localStorage.setItem('gradatone_scale', this.currentScale);
        } catch (e) {
            console.warn('Could not save scale settings:', e);
        }
    }

    loadLabelSettings() {
        // Load label setting from localStorage
        try {
            const savedLabel = localStorage.getItem('gradatone_label_mode');

            if (savedLabel !== null) {
                this.labelMode = savedLabel;

                // Ensure DOM element exists
                if (this.labelSelect) {
                    this.labelSelect.value = this.labelMode;
                } else {
                    console.warn('⚠️ labelSelect element not found');
                }
            }

            // Load label position settings
            const savedPositionPortrait = localStorage.getItem('gradatone_label_position_portrait');
            const savedPositionLandscape = localStorage.getItem('gradatone_label_position_landscape');
            
            if (savedPositionPortrait !== null) {
                this.labelPositionPortrait = savedPositionPortrait;
            }
            if (savedPositionLandscape !== null) {
                this.labelPositionLandscape = savedPositionLandscape;
            }
        } catch (e) {
            console.warn('Could not load label settings:', e);
        }
    }

    saveLabelSettings() {
        // Save label setting to localStorage
        try {
            localStorage.setItem('gradatone_label_mode', this.labelMode);
            localStorage.setItem('gradatone_label_position_portrait', this.labelPositionPortrait);
            localStorage.setItem('gradatone_label_position_landscape', this.labelPositionLandscape);
        } catch (e) {
            console.warn('Could not save label settings:', e);
        }
    }

    loadSettingsVisibility() {
        // Load settings visibility from localStorage
        try {
            const savedVisibility = localStorage.getItem('gradatone_settings_open');
            
            if (savedVisibility !== null) {
                this.settingsOpen = savedVisibility === 'true';
            } else {
                // Default: settings closed
                this.settingsOpen = false;
            }
            
            // Apply visibility state
            if (this.settingsOpen) {
                this.controlsContainer.classList.add('open');
                this.settingsToggle.classList.add('active');
            }
        } catch (e) {
            console.warn('Could not load settings visibility:', e);
        }
    }

    saveSettingsVisibility() {
        // Save settings visibility to localStorage
        try {
            localStorage.setItem('gradatone_settings_open', this.settingsOpen.toString());
        } catch (e) {
            console.warn('Could not save settings visibility:', e);
        }
    }

    toggleSettings() {
        this.settingsOpen = !this.settingsOpen;
        
        if (this.settingsOpen) {
            this.controlsContainer.classList.add('open');
            this.settingsToggle.classList.add('active');
        } else {
            this.controlsContainer.classList.remove('open');
            this.settingsToggle.classList.remove('active');
        }
        
        this.saveSettingsVisibility();
    }

    loadTransposeSettings() {
        // Load transpose setting from localStorage
        try {
            const savedTranspose = localStorage.getItem('gradatone_transpose_offset');

            if (savedTranspose !== null) {
                this.transposeOffset = parseInt(savedTranspose, 10);

                // Ensure DOM element exists
                if (this.transposeSelect) {
                    this.transposeSelect.value = this.transposeOffset.toString();
                } else {
                    console.warn('⚠️ transposeSelect element not found');
                }
            } else {
            }
        } catch (e) {
            console.warn('Could not load transpose settings:', e);
        }

        // Update option labels with root note
        this.updateTransposeOptions();
    }

    saveTransposeSettings() {
        // Save transpose setting to localStorage
        try {
            localStorage.setItem('gradatone_transpose_offset', this.transposeOffset.toString());
        } catch (e) {
            console.warn('Could not save transpose settings:', e);
        }
    }

    updateTransposeOptions() {
        // Update transpose select options with root note based on label mode
        if (!this.transposeSelect) return;

        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const labelType = this.getLabelType();

        const scale = SCALES[this.currentScale];
        const rootOffset = scale ? scale.rootOffset : 0;

        for (const option of this.transposeSelect.options) {
            const value = parseInt(option.value, 10);
            // Root note offset based on current scale
            const rootNoteIndex = (((value + rootOffset) % 12) + 12) % 12; // Handle negative values
            const rootNoteName = notes[rootNoteIndex];
            
            // Get display label based on label mode (plain text for select options)
            const rootLabel = this.getDisplayLabel(rootNoteName, labelType, false);

            // Format: +5(F) or ±0(C) or -3(A)
            let prefix;
            if (value > 0) {
                prefix = `+${value}`;
            } else if (value === 0) {
                prefix = '±0';
            } else {
                prefix = `${value}`;
            }
            
            option.textContent = `${prefix}(${rootLabel})`;
        }
    }

    loadLayerConfig() {
        // Load layer configuration from localStorage
        try {
            const savedConfig = localStorage.getItem('gradatone_layer_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);

                // Clear default layer
                this.layers = [];
                this.nextLayerId = 0;

                // Restore layers
                const maxLayers = this.getMaxLayers();
                config.forEach((instrumentType, index) => {
                    // Only restore layers that fit current screen
                    if (index < maxLayers && INSTRUMENTS[instrumentType]) {
                        const layerId = this.nextLayerId++;
                        this.layers.push({
                            id: layerId,
                            instrument: instrumentType,
                            areaIndex: this.layers.length
                        });
                    }
                });

                // If no layers were restored, add default
                if (this.layers.length === 0) {
                    const layerId = this.nextLayerId++;
                    this.layers.push({
                        id: layerId,
                        instrument: 'piano',
                        areaIndex: 0
                    });
                }


                // UI will be updated after initialization
                return true;
            }
        } catch (e) {
            console.warn('Could not load layer config:', e);
        }
        return false;
    }

    saveLayerConfig() {
        // Save layer configuration to localStorage
        try {
            const config = this.layers.map(layer => layer.instrument);
            localStorage.setItem('gradatone_layer_config', JSON.stringify(config));
        } catch (e) {
            console.warn('Could not save layer config:', e);
        }
    }

    setupEventListeners() {
        const resumeFromGesture = () => this.ensureAudioReady({ fromUserGesture: true });

        document.addEventListener('touchstart', resumeFromGesture, { capture: true, passive: true, once: false });
        document.addEventListener('click', resumeFromGesture, { capture: true, once: false });

        this.startButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        this.startButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.ensureAudioReady({ fromUserGesture: true });
        });

        const handleVisibleAgain = (event) => {
            if (document.hidden) return;
            const fromBFCache = event && event.persisted;
            this.ensureAudioReady({ fromUserGesture: false, fromBFCache });
        };

        document.addEventListener('visibilitychange', () => handleVisibleAgain());
        window.addEventListener('pageshow', handleVisibleAgain);
        window.addEventListener('focus', () => handleVisibleAgain());

        this.setupCapacitorLifecycle();

        // Transpose select - prevent touch/click propagation
        this.transposeSelect.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        this.transposeSelect.addEventListener('change', (e) => {
            e.stopPropagation(); // Prevent canvas click event
            this.transposeOffset = parseInt(e.target.value, 10);
            this.saveTransposeSettings();
            // Redraw guide lines and regenerate pitch labels with new transpose
            this.drawGuideLines();
            this.setupPitchLabels();
        });

        // Scale select - prevent touch/click propagation
        if (this.scaleSelect) {
            this.scaleSelect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            this.scaleSelect.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent canvas click event
                this.currentScale = e.target.value;
                this.saveScaleSettings();
                // Redraw canvas and regenerate pitch labels
                this.drawGuideLines();
                this.setupPitchLabels();
                // Update transpose options to show correct root note based on scale
                this.updateTransposeOptions();
            });
        }

        // Label select - prevent touch/click propagation
        if (this.labelSelect) {
            this.labelSelect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            this.labelSelect.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent canvas click event
                this.labelMode = e.target.value;
                this.saveLabelSettings();
                // Regenerate pitch labels
                this.setupPitchLabels();
                // Update transpose options with new label format
                this.updateTransposeOptions();
            });
        } else {
            console.warn('⚠️ labelSelect element not found');
        }

        // Snap select - prevent touch/click propagation
        this.snapSelect.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        this.snapSelect.addEventListener('change', (e) => {
            e.stopPropagation(); // Prevent canvas click event
            this.snapMode = e.target.value;
            this.saveSnapSettings();
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            void this.handleTouchStart(e);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

        // canvas 外で指を離しても拾う（capture で全 touchend / touchcancel を監視）
        this.boundHandleGlobalTouchEnd = (e) => this.handleGlobalTouchEnd(e);
        document.addEventListener('touchend', this.boundHandleGlobalTouchEnd, { capture: true, passive: false });
        document.addEventListener('touchcancel', this.boundHandleGlobalTouchEnd, { capture: true, passive: false });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Instrument controls container - prevent touch propagation
        this.instrumentControls.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        // Settings toggle button - prevent touch/click propagation
        this.settingsToggle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        this.settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });

        // Settings are already loaded and applied
    }

    // Layer management
    addLayer(instrumentType = 'piano') {
        const maxLayers = this.getMaxLayers();

        // Check if we can add more layers
        if (this.layers.length >= maxLayers) {
            console.warn(`⚠️ Cannot add more layers. Maximum ${maxLayers} layers for current screen size.`);
            return;
        }

        const layerId = this.nextLayerId++;
        this.layers.push({
            id: layerId,
            instrument: instrumentType,
            areaIndex: this.layers.length
        });
        this.updateLayerUI();
        this.drawGuideLines(); // Redraw to show new divider
        this.saveLayerConfig(); // Save to localStorage
    }

    removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1 && this.layers.length > 1) {
            this.layers.splice(index, 1);
            // Update area indices
            this.layers.forEach((layer, i) => {
                layer.areaIndex = i;
            });
            this.updateLayerUI();
            this.drawGuideLines(); // Redraw to remove divider
            this.saveLayerConfig(); // Save to localStorage
        }
    }

    changeInstrument(layerId, instrumentType) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.instrument = instrumentType;
            this.saveLayerConfig(); // Save to localStorage
        }
    }

    updateLayerUI() {
        this.instrumentControls.innerHTML = '';

        // Update add button state and visibility
        const maxLayers = this.getMaxLayers();

        this.layers.forEach((layer, index) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'instrument-control';
            controlDiv.dataset.layerId = layer.id;

            // Create select
            const select = document.createElement('select');
            select.className = 'instrument-select';

            // Group instruments by category
            const categories = {};
            Object.keys(INSTRUMENTS).forEach(key => {
                const instr = INSTRUMENTS[key];
                const cat = instr.category || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ key, name: instr.name });
            });

            // Define category order
            const categoryOrder = ['Keyboards', 'Guitars', 'Strings', 'Winds', 'Percussion', 'Synth', 'Animals', 'Other'];

            // Add options grouped by category
            categoryOrder.forEach(cat => {
                if (categories[cat]) {
                    const group = document.createElement('optgroup');
                    group.label = cat;

                    categories[cat].forEach(instr => {
                        const option = document.createElement('option');
                        option.value = instr.key;
                        option.textContent = instr.name;
                        if (instr.key === layer.instrument) {
                            option.selected = true;
                        }
                        group.appendChild(option);
                    });

                    select.appendChild(group);
                }
            });



            // Add delete option if more than one layer
            if (this.layers.length > 1) {
                const deleteOption = document.createElement('option');
                deleteOption.value = '__delete__';
                deleteOption.textContent = 'Delete...';
                deleteOption.style.color = '#ff6666';
                select.appendChild(deleteOption);
            }

            // Add "Add..." option if not at max layers
            if (this.layers.length < maxLayers) {
                const addOption = document.createElement('option');
                addOption.value = '__add__';
                addOption.textContent = 'Add...';
                select.appendChild(addOption);
            }

            // Store current value for restoration if delete is cancelled
            const currentInstrument = layer.instrument;

            // Prevent touch propagation to canvas
            select.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            select.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent canvas click event
                if (e.target.value === '__delete__') {
                    // Delete immediately without confirmation
                    this.removeLayer(layer.id);
                } else if (e.target.value === '__add__') {
                    // Add new layer
                    this.addLayer('piano');
                    // Reset select to current instrument
                    e.target.value = currentInstrument;
                } else {
                    this.changeInstrument(layer.id, e.target.value);
                }
            });

            controlDiv.appendChild(select);

            // Prevent touch propagation from control div to canvas
            controlDiv.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            this.instrumentControls.appendChild(controlDiv);
        });

        // Position all controls and set uniform width after all are created
        this.layers.forEach((layer, index) => {
            const controlDiv = this.instrumentControls.querySelector(`[data-layer-id="${layer.id}"]`);
            if (controlDiv) {
                this.positionLayerControl(controlDiv, index, this.layers.length);
            }
        });
    }

    positionLayerControl(controlDiv, index, totalLayers) {
        // Apply uniform width to select element
        const select = controlDiv.querySelector('select');
        if (select) {
            if (this.isPortrait) {
                // Portrait: calculate based on layer width
                const layerWidthPx = window.innerWidth / totalLayers;
                const maxSelectWidth = Math.max(100, Math.min(180, layerWidthPx - 40)); // 40px margin
                select.style.width = `${maxSelectWidth}px`;
                select.style.maxWidth = `${maxSelectWidth}px`;
            } else {
                // Landscape: fixed 8em width
                select.style.width = '8em';
                select.style.maxWidth = '8em';
            }
        }

        // Position control div
        const areaSize = 100 / totalLayers;
        const centerPosition = (index + 0.5) * areaSize;

        if (this.isPortrait) {
            controlDiv.style.left = `${centerPosition}%`;
            controlDiv.style.bottom = `${this.getUiBottomOffsetPx()}px`;
            controlDiv.style.top = 'auto';
            controlDiv.style.right = 'auto';
            controlDiv.style.transform = 'translateX(-50%)';
        } else {
            const style = getComputedStyle(document.documentElement);
            const safeRight = parseFloat(style.getPropertyValue('--safe-right')) || 0;
            const uiRight = parseFloat(style.getPropertyValue('--ui-right')) || 12;
            controlDiv.style.top = `${centerPosition}%`;
            controlDiv.style.right = `${safeRight + uiRight}px`;
            controlDiv.style.left = 'auto';
            controlDiv.style.bottom = 'auto';
            controlDiv.style.transform = 'translateY(-50%)';
        }
    }

    // Get layer index from touch position
    getLayerIndexFromPosition(x, y) {
        const totalLayers = this.layers.length;
        if (totalLayers === 1) return 0;

        if (this.isPortrait) {
            // Portrait: left-right division
            const ratio = x / this.canvasWidth;
            return Math.min(Math.floor(ratio * totalLayers), totalLayers - 1);
        } else {
            // Landscape: top-bottom division
            const ratio = y / this.canvasHeight;
            return Math.min(Math.floor(ratio * totalLayers), totalLayers - 1);
        }
    }


    setupCapacitorLifecycle() {
        if (!isNativeCapacitor()) return;
        const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
        if (!App || typeof App.addListener !== 'function') return;
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                this.ensureAudioReady({ fromUserGesture: false });
            }
        });
    }

    releaseAllActiveTouchSounds() {
        this.pendingStartTouchIds.clear();
        this.deferredTouchEnds.clear();
        const touchIds = Array.from(this.activeTouches.keys());
        touchIds.forEach((touchId) => {
            try {
                const t = this.activeTouches.get(touchId);
                this.stopTouchSound(
                    touchId,
                    'cleanup',
                    t?.currentClientX ?? null,
                    t?.currentClientY ?? null
                );
            } catch (e) {
                // Best-effort cleanup
            }
        });
        this.ownedTouchIds.clear();
        this.cancelledTouchIds.clear();
    }

    /** 画面上に存在しないタッチ ID の音・インジケータを解放 */
    reconcileActiveTouches(touchList) {
        const live = new Set();
        for (let i = 0; i < touchList.length; i++) {
            live.add(touchList[i].identifier);
        }
        const staleIds = new Set([
            ...this.activeTouches.keys(),
            ...this.ownedTouchIds,
            ...this.pendingStartTouchIds
        ]);
        staleIds.forEach((touchId) => {
            if (touchId === 'mouse') return;
            if (live.has(touchId)) return;
            const touch = this.activeTouches.get(touchId);
            this.endTouch(
                touchId,
                touch?.currentClientX ?? null,
                touch?.currentClientY ?? null,
                'reconcile'
            );
        });
    }

    endTouch(touchId, clientX, clientY, source = 'unknown') {
        // 音生成待ちの間に離した → 生成後に止める（iOS で高速タップが消えるのを防ぐ）
        if (!this.activeTouches.has(touchId) && this.pendingStartTouchIds.has(touchId)) {
            this.deferredTouchEnds.set(touchId, { clientX, clientY });
            this.ownedTouchIds.delete(touchId);
            return;
        }

        this.ownedTouchIds.delete(touchId);
        this.cancelledTouchIds.add(touchId);

        if (
            clientX != null &&
            clientY != null &&
            this.labelStartedTouches.has(touchId) &&
            this.isPointOnLabel(clientX, clientY)
        ) {
            this.toggleLabelPosition();
        }
        this.labelStartedTouches.delete(touchId);

        if (this.activeTouches.has(touchId)) {
            const inertiaInfo = this.stopTouchSound(touchId, source, clientX, clientY);
            this.markTouchIndicatorReleased(touchId, inertiaInfo);
            return;
        }

        const indicator = this.touchIndicators.get(touchId);
        if (indicator && indicator.releaseTime === null) {
            if (indicator.element) {
                indicator.element.remove();
            }
            this.touchIndicators.delete(touchId);
        }
    }

    handleGlobalTouchEnd(e) {
        for (let touch of e.changedTouches) {
            const touchId = touch.identifier;
            if (
                !this.ownedTouchIds.has(touchId) &&
                !this.activeTouches.has(touchId) &&
                !this.pendingStartTouchIds.has(touchId)
            ) {
                continue;
            }
            this.endTouch(touchId, touch.clientX, touch.clientY);
        }
        this.reconcileActiveTouches(e.touches);
    }

    async destroyAudioContext() {
        this._audioStateListenerAttached = false;
        if (!this.audioContext) return;
        this.releaseAllActiveTouchSounds();
        const ctx = this.audioContext;
        this.audioContext = null;
        this.masterGain = null;
        this.masterCompressor = null;
        this.softClipper = null;
        this.outputGain = null;
        if (ctx.state !== 'closed') {
            try {
                await ctx.close();
            } catch (e) {
                // Already closed on some platforms
            }
        }
    }

    attachAudioStateListener() {
        if (!this.audioContext || this._audioStateListenerAttached) return;
        this._audioStateListenerAttached = true;
        this.audioContext.addEventListener('statechange', () => {
            if (!this.audioContext) return;
            const state = this.audioContext.state;
            if (state === 'running') {
                void configureNativeAudioSession({ userGesture: true });
                this.hidePowerButton();
                return;
            }
            if (state === 'closed') {
                this.releaseAllActiveTouchSounds();
                this.showPowerButton();
                return;
            }
            if (state === 'suspended' || state === 'interrupted') {
                this.showPowerButton();
            }
        });
    }

    async createAudioGraph() {
        await configureNativeAudioSession({ userGesture: true });
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000,
            latencyHint: 'interactive'
        });
        await configureNativeAudioSession({ userGesture: true });
        this.attachAudioStateListener();

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);

        this.masterCompressor = this.audioContext.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
        this.masterCompressor.knee.setValueAtTime(10, this.audioContext.currentTime);
        this.masterCompressor.ratio.setValueAtTime(8, this.audioContext.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.001, this.audioContext.currentTime);
        this.masterCompressor.release.setValueAtTime(0.15, this.audioContext.currentTime);

        this.softClipper = this.audioContext.createWaveShaper();
        this.softClipper.curve = makeDistortionCurve(0);
        this.softClipper.oversample = '4x';

        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);

        this.masterGain.connect(this.masterCompressor);
        this.masterCompressor.connect(this.softClipper);
        this.softClipper.connect(this.outputGain);
        this.outputGain.connect(this.audioContext.destination);
    }

    async recreateAudioContext() {
        await this.destroyAudioContext();
        await this.createAudioGraph();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        await configureNativeAudioSession({ userGesture: true });
    }

    isAudioRunning() {
        return !!(this.audioContext && this.audioContext.state === 'running');
    }

    scheduleAudioUiCheck() {
        window.setTimeout(() => {
            if (this.isAudioRunning()) {
                this.hidePowerButton();
            } else {
                this.showPowerButton();
            }
        }, 200);
    }

    async ensureAudioReady({ fromUserGesture = false, fromBFCache = false } = {}) {
        if (!fromBFCache && this.isAudioRunning()) {
            return true;
        }

        if (this._audioReadyInFlight) {
            return this._audioReadyInFlight;
        }

        this._audioReadyInFlight = this._ensureAudioReadySlow({ fromUserGesture, fromBFCache }).finally(
            () => {
                this._audioReadyInFlight = null;
            }
        );
        return this._audioReadyInFlight;
    }

    async _ensureAudioReadySlow({ fromUserGesture = false, fromBFCache = false } = {}) {
        await configureNativeAudioSession({
            userGesture: fromUserGesture,
            force: fromBFCache
        });

        if (fromBFCache && this.audioContext) {
            await this.recreateAudioContext();
            this.scheduleAudioUiCheck();
            return this.isAudioRunning();
        }

        if (!this.audioContext || this.audioContext.state === 'closed') {
            await this.createAudioGraph();
        }

        if (!this.audioContext) {
            this.showPowerButton();
            return false;
        }

        if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                // May need a fresh context after phone call / task switch
            }
        }

        if (fromUserGesture && this.audioContext && this.audioContext.state !== 'running') {
            await this.recreateAudioContext();
        }

        if (this.isAudioRunning()) {
            this.hidePowerButton();
            return true;
        }

        this.showPowerButton();
        return false;
    }

    async initAudio() {
        return this.ensureAudioReady({ fromUserGesture: true });
    }

    async resumeAudio() {
        return this.ensureAudioReady({ fromUserGesture: true });
    }

    async tryAutoResumeOnVisible() {
        return this.ensureAudioReady({ fromUserGesture: false });
    }

    showPowerButton() {
        this.startButton.classList.remove('hidden');
        const blurOverlay = document.querySelector('.blur-overlay');
        if (blurOverlay) {
            blurOverlay.classList.remove('hidden');
        }
    }

    hidePowerButton() {
        this.startButton.classList.add('hidden');
        const blurOverlay = document.querySelector('.blur-overlay');
        if (blurOverlay) {
            blurOverlay.classList.add('hidden');
        }
    }

    /**
     * 慣性の終了音程と滑り時間。
     * 画面の min/max 音階で止めず、離した速度のまま release 中ずっと音程を動かす（上／下とも鳴り終わりまで）。
     */
    computeInertiaEndFrequency(startFreq, velocityX, velocityY, releaseTimeSec) {
        const logStart = Math.log2(Math.max(20, startFreq));
        const logMin = Math.log2(this.minFreq);
        const logMax = Math.log2(this.maxFreq);
        const logSpan = logMax - logMin;
        const playableSize = this.getPlayableSpan().size;

        if (playableSize <= 0 || releaseTimeSec <= 0 || logSpan <= 0) {
            return {
                endFreq: startFreq,
                logSlopePerSec: 0,
                screenLogSlopePerSec: 0,
                inertiaGlideTime: releaseTimeSec,
                beyondScale: false
            };
        }

        const ratioSpeedPerSec = this.isPortrait
            ? (-velocityY / playableSize)
            : (velocityX / playableSize);
        const logSlopePerSec = ratioSpeedPerSec * logSpan;
        const screenLogSlopePerSec = logSlopePerSec;

        const rawEndLog = logStart + logSlopePerSec * releaseTimeSec;

        const nyquist = (this.audioContext?.sampleRate || 48000) / 2;
        const maxOscFreq = nyquist * 0.95;
        const minLog = Math.log2(20);
        const maxLog = Math.log2(maxOscFreq);
        const endLog = Math.max(minLog, Math.min(maxLog, rawEndLog));
        const endFreq = Math.pow(2, endLog);

        // 高速時は Nyquist/下限で頭打ち → 意図した log 傾きで到達する時間だけ滑らせる（3s かけない）
        let inertiaGlideTime = releaseTimeSec;
        if (Math.abs(logSlopePerSec) > 1e-6) {
            inertiaGlideTime = Math.abs(endLog - logStart) / Math.abs(logSlopePerSec);
            inertiaGlideTime = Math.max(0.03, Math.min(releaseTimeSec, inertiaGlideTime));
        }

        return {
            endFreq,
            logSlopePerSec,
            screenLogSlopePerSec,
            inertiaGlideTime,
            beyondScale: rawEndLog > logMax + 1e-6 || rawEndLog < logMin - 1e-6,
            nyquistLimited: rawEndLog > maxLog + 1e-6 || rawEndLog < minLog - 1e-6
        };
    }

    getFrequencyFromPosition(x, y) {
        const ratio = this.isPortrait
            ? this.getRatioFromPlayablePosition(y)
            : this.getRatioFromPlayablePosition(x);

        // Logarithmic scale for natural pitch perception
        const logMin = Math.log2(this.minFreq);
        const logMax = Math.log2(this.maxFreq);
        const logFreq = logMin + ratio * (logMax - logMin);
        const baseFreq = Math.pow(2, logFreq);

        // Apply transpose offset (semitones)
        const transposedFreq = baseFreq * Math.pow(2, this.transposeOffset / 12);
        return transposedFreq;
    }

    // Snap frequency to nearest semitone or whole tone
    getEffectiveSnapMode(clientX, clientY, layerIndex) {
        // Determine effective snap mode based on touch position
        // Top 35% (landscape) or Left 35% (portrait) = one level finer snapping
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // Get layer dimensions
        const totalLayers = this.layers.length;
        let isInTopArea = false;

        if (this.isPortrait) {
            // Portrait: layers are side-by-side (left to right)
            const layerWidth = this.canvasWidth / totalLayers;
            const layerLeft = layerIndex * layerWidth;
            const layerLocalX = canvasX - layerLeft;
            // Left 35% of this layer
            isInTopArea = layerLocalX < layerWidth * 0.35;
        } else {
            // Landscape: layers are top-to-bottom
            const layerHeight = this.canvasHeight / totalLayers;
            const layerTop = layerIndex * layerHeight;
            const layerLocalY = canvasY - layerTop;
            // Top 35% of this layer
            isInTopArea = layerLocalY < layerHeight * 0.35;
        }

        if (!isInTopArea) {
            return this.snapMode; // Use global snap mode
        }

        // Top/Left 35%: upgrade snap mode
        if (this.snapMode === 'whole') {
            return 'semi'; // Whole -> Semi
        } else if (this.snapMode === 'semi') {
            return 'off'; // Semi -> Off
        } else {
            return 'off'; // Off -> Off
        }
    }

    isInControlArea(clientX, clientY, layerIndex) {
        // Check if position is in the 35% control area
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        const totalLayers = this.layers.length;

        if (this.isPortrait) {
            // Portrait: layers are side-by-side (left to right)
            const layerWidth = this.canvasWidth / totalLayers;
            const layerLeft = layerIndex * layerWidth;
            const layerLocalX = canvasX - layerLeft;
            return layerLocalX < layerWidth * 0.35;
        } else {
            // Landscape: layers are top-to-bottom
            const layerHeight = this.canvasHeight / totalLayers;
            const layerTop = layerIndex * layerHeight;
            const layerLocalY = canvasY - layerTop;
            return layerLocalY < layerHeight * 0.35;
        }
    }

    // Calculate edge fade volume based on position within the layer (0.0 = silent at edge, 1.0 = full volume in center)
    getEdgeFadeVolume(clientX, clientY, layerIndex) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        const silentZone = 0.05; // 5% from edge = silent (0% volume)
        const fadeZoneEnd = 0.15; // 15% from edge = full volume (100% volume)

        const totalLayers = this.layers.length;

        if (this.isPortrait) {
            // Portrait: fade on left and right edges within each layer (X axis)
            const layerWidth = this.canvasWidth / totalLayers;
            const layerLeft = layerIndex * layerWidth;
            const layerLocalX = canvasX - layerLeft; // Position within this layer

            const leftSilent = layerWidth * silentZone;
            const leftFull = layerWidth * fadeZoneEnd;
            const rightFull = layerWidth * (1 - fadeZoneEnd);
            const rightSilent = layerWidth * (1 - silentZone);

            if (layerLocalX < leftSilent) {
                // Left silent zone (0% - 5%): silent
                return 0.0;
            } else if (layerLocalX < leftFull) {
                // Left fade zone (5% - 15%): 0% to 100%
                return (layerLocalX - leftSilent) / (leftFull - leftSilent);
            } else if (layerLocalX > rightSilent) {
                // Right silent zone (95% - 100%): silent
                return 0.0;
            } else if (layerLocalX > rightFull) {
                // Right fade zone (85% - 95%): 100% to 0%
                return (rightSilent - layerLocalX) / (rightSilent - rightFull);
            } else {
                // Center: full volume
                return 1.0;
            }
        } else {
            // Landscape: fade on top and bottom edges within each layer (Y axis)
            const layerHeight = this.canvasHeight / totalLayers;
            const layerTop = layerIndex * layerHeight;
            const layerLocalY = canvasY - layerTop; // Position within this layer

            const topSilent = layerHeight * silentZone;
            const topFull = layerHeight * fadeZoneEnd;
            const bottomFull = layerHeight * (1 - fadeZoneEnd);
            const bottomSilent = layerHeight * (1 - silentZone);

            if (layerLocalY < topSilent) {
                // Top silent zone (0% - 5%): silent
                return 0.0;
            } else if (layerLocalY < topFull) {
                // Top fade zone (5% - 15%): 0% to 100%
                return (layerLocalY - topSilent) / (topFull - topSilent);
            } else if (layerLocalY > bottomSilent) {
                // Bottom silent zone (95% - 100%): silent
                return 0.0;
            } else if (layerLocalY > bottomFull) {
                // Bottom fade zone (85% - 95%): 100% to 0%
                return (bottomSilent - layerLocalY) / (bottomSilent - bottomFull);
            } else {
                // Center: full volume
                return 1.0;
            }
        }
    }

    snapToSemitone(frequency, effectiveSnapMode = null) {
        // Use provided effectiveSnapMode or fall back to global snapMode
        const snapMode = effectiveSnapMode !== null ? effectiveSnapMode : this.snapMode;

        // Convert frequency to semitones from C0 (16.35Hz) - same basis as guide lines
        const semitonesFromC0 = 12 * Math.log2(frequency / 16.35);

        let roundedSemitones;
        if (snapMode === 'whole') {
            // Scale snap with transpose support
            // Get scale pattern from SCALES definition
            const scale = SCALES[this.currentScale];
            const scalePattern = scale ? scale.pattern : [0, 2, 4, 5, 7, 9, 11]; // Default to major
            const rootOffset = scale ? scale.rootOffset : 0;

            // Apply rootOffset and transpose to scale pattern
            // rootOffset shifts the scale to its proper root (e.g., Minor starts from A, not C)
            const scaleNotes = scalePattern.map(note => (note + rootOffset + this.transposeOffset + 120) % 12).sort((a, b) => a - b);

            // Get the octave and position within octave (C-based, same as guide lines)
            const octave = Math.floor(semitonesFromC0 / 12);
            let positionInOctave = semitonesFromC0 - octave * 12;
            
            // Normalize to 0-12 range
            if (positionInOctave < 0) {
                positionInOctave += 12;
            }

            // Create extended scale with adjacent octave notes for proper wrap-around handling
            const extendedScale = [
                ...scaleNotes.map(n => n - 12), // Previous octave
                ...scaleNotes,                   // Current octave
                ...scaleNotes.map(n => n + 12)  // Next octave
            ];

            // Find nearest note in extended scale
            let nearestNote = extendedScale[0];
            let minDistance = Math.abs(positionInOctave - nearestNote);

            for (const note of extendedScale) {
                const distance = Math.abs(positionInOctave - note);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestNote = note;
                }
            }
            
            // Determine octave adjustment based on which octave the nearest note is in
            let octaveAdjust = 0;
            if (nearestNote < 0) {
                octaveAdjust = -1;
                nearestNote += 12;
            } else if (nearestNote >= 12) {
                octaveAdjust = 1;
                nearestNote -= 12;
            }

            roundedSemitones = (octave + octaveAdjust) * 12 + nearestNote;
        } else if (snapMode === 'semi') {
            // Semi tone snap: round to nearest semitone
            roundedSemitones = Math.round(semitonesFromC0);
        } else {
            // No snap (off mode): return original frequency
            return frequency;
        }

        // Convert back to frequency (from C0 basis)
        return 16.35 * Math.pow(2, roundedSemitones / 12);
    }

    // Schedule snap for a touch after snapDelay
    scheduleSnap(touchId, currentFrequency) {
        const touch = this.activeTouches.get(touchId);
        if (!touch) return;

        // Calculate effective snap mode based on current position
        const effectiveSnapMode = (touch.currentClientX !== null && touch.currentClientY !== null)
            ? this.getEffectiveSnapMode(touch.currentClientX, touch.currentClientY, touch.layerIndex)
            : this.snapMode;

        // Only schedule if effective snap mode is not 'off'
        if (effectiveSnapMode === 'off') return;

        // Cancel any existing snap timeout
        if (touch.snapTimeout) {
            clearTimeout(touch.snapTimeout);
        }

        // Schedule snap
        touch.snapTimeout = setTimeout(() => {
            this.performSnap(touchId);
        }, this.snapDelay * 1000);
    }

    // Perform smooth snap to nearest semitone
    performSnap(touchId) {
        const touch = this.activeTouches.get(touchId);
        if (!touch) return;

        // Calculate effective snap mode based on current position
        const effectiveSnapMode = (touch.currentClientX !== null && touch.currentClientY !== null)
            ? this.getEffectiveSnapMode(touch.currentClientX, touch.currentClientY, touch.layerIndex)
            : this.snapMode;

        const snappedFreq = this.snapToSemitone(touch.currentFrequency, effectiveSnapMode);
        const now = this.audioContext.currentTime;
        const transitionTime = 0.05; // 50ms smooth transition


        // Smoothly transition to snapped frequency
        const instrument = INSTRUMENTS[touch.instrumentType];
        touch.oscillators.forEach(({ osc, config }) => {
            let freq = snappedFreq;
            if (config.octave !== undefined) {
                freq = snappedFreq * Math.pow(2, config.octave);
            } else if (config.partial !== undefined) {
                freq = snappedFreq * config.partial;
            }
            osc.frequency.setTargetAtTime(freq, now, transitionTime);
        });

        touch.currentFrequency = snappedFreq;
        touch.targetFrequency = snappedFreq;
        touch.snappedFrequency = snappedFreq; // Record snapped frequency for stickiness
        touch.snapTimeout = null;

        // Move indicator to snapped position smoothly
        if (touch.currentClientX !== null && touch.currentClientY !== null) {
            const snappedPos = this.getScreenPositionFromFrequency(
                snappedFreq,
                touch.currentClientX,
                touch.currentClientY
            );

            // Move indicator smoothly (0.3s transition)
            this.updateTouchIndicatorPosition(touchId, snappedPos.x, snappedPos.y, true);
            
            // Note: Do NOT update touch.currentClientX/Y or edgeFadeVolume here
            // The actual finger position hasn't changed - only the indicator moved for visual feedback
            // Edge fade volume should reflect the actual finger position, not the snapped indicator position
        }
    }

    createTouchSound(touchId, frequency, layerIndex = 0, clientX = null, clientY = null) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const layer = this.layers[layerIndex];
        if (!layer) return;

        const instrument = INSTRUMENTS[layer.instrument];

        // Fixed velocity (no force sensitivity)
        const velocity = 0.5;


        // Create oscillators based on instrument definition
        const oscillators = instrument.oscillators.map(oscDef => {
            const osc = this.audioContext.createOscillator();
            osc.type = oscDef.type;

            // Calculate frequency based on definition
            let freq = frequency;
            if (oscDef.octave !== undefined) {
                freq = frequency * Math.pow(2, oscDef.octave);
            } else if (oscDef.partial !== undefined) {
                freq = frequency * oscDef.partial;
            }
            if (oscDef.detune !== undefined) {
                osc.detune.setValueAtTime(oscDef.detune, now);
            }

            osc.frequency.setValueAtTime(freq, now);

            // Create gain for this oscillator
            const oscGain = this.audioContext.createGain();
            oscGain.gain.setValueAtTime(oscDef.gain, now);

            osc.connect(oscGain);
            osc.start(now);

            return { osc, gain: oscGain, config: oscDef };
        });

        // Create filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = instrument.filter.type;
        filter.frequency.setValueAtTime(instrument.filter.frequency, now);
        filter.Q.setValueAtTime(instrument.filter.Q, now);

        // Connect oscillators to filter
        oscillators.forEach(({ gain }) => gain.connect(filter));

        // Create hammer noise if enabled (Piano attack transient)
        let noiseSource = null;
        let noiseGain = null;
        let noiseFilter = null;
        
        if (instrument.hammerNoise && instrument.hammerNoise.enabled) {
            // Create white noise buffer (duration based on attack + decay)
            const noiseDuration = instrument.hammerNoise.attack + instrument.hammerNoise.decay + 0.05;
            const bufferSize = Math.ceil(this.audioContext.sampleRate * noiseDuration);
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }
            
            noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Filter for noise (type can be specified per instrument)
            noiseFilter = this.audioContext.createBiquadFilter();
            noiseFilter.type = instrument.hammerNoise.filterType || 'bandpass';
            noiseFilter.frequency.setValueAtTime(instrument.hammerNoise.filterFreq, now);
            noiseFilter.Q.setValueAtTime(instrument.hammerNoise.filterQ, now);
            
            // Noise envelope (very short burst)
            noiseGain = this.audioContext.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(instrument.hammerNoise.gain * velocity, now + instrument.hammerNoise.attack);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + instrument.hammerNoise.attack + instrument.hammerNoise.decay);
            
            // Connect noise chain (will connect to output later to bypass oscillator envelope)
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            // noiseGain connection deferred until edgeFadeGainNode is created
            
            noiseSource.start(now);
            noiseSource.stop(now + instrument.hammerNoise.attack + instrument.hammerNoise.decay + 0.01);
        }

        // Create sustain noise if enabled (continuous breath noise while note is held)
        let sustainNoiseSource = null;
        let sustainNoiseGain = null;
        let sustainNoiseFilter = null;

        if (instrument.sustainNoise && instrument.sustainNoise.enabled) {
            // Create looping noise buffer (longer for sustained sound)
            const sustainBufferSize = Math.ceil(this.audioContext.sampleRate * 0.5); // 500ms loop
            const sustainNoiseBuffer = this.audioContext.createBuffer(1, sustainBufferSize, this.audioContext.sampleRate);
            const sustainOutput = sustainNoiseBuffer.getChannelData(0);

            for (let i = 0; i < sustainBufferSize; i++) {
                sustainOutput[i] = Math.random() * 2 - 1; // White noise
            }

            sustainNoiseSource = this.audioContext.createBufferSource();
            sustainNoiseSource.buffer = sustainNoiseBuffer;
            sustainNoiseSource.loop = true; // Loop the noise

            // Filter for sustain noise
            sustainNoiseFilter = this.audioContext.createBiquadFilter();
            sustainNoiseFilter.type = instrument.sustainNoise.filterType || 'lowpass';
            sustainNoiseFilter.frequency.setValueAtTime(instrument.sustainNoise.filterFreq || 1000, now);
            sustainNoiseFilter.Q.setValueAtTime(instrument.sustainNoise.filterQ || 0.7, now);

            // Gain for sustain noise (follows main envelope via gainNode connection)
            sustainNoiseGain = this.audioContext.createGain();
            sustainNoiseGain.gain.setValueAtTime(instrument.sustainNoise.gain || 0.05, now);

            // Connect: sustainNoise -> filter -> gain -> main filter (to follow envelope)
            sustainNoiseSource.connect(sustainNoiseFilter);
            sustainNoiseFilter.connect(sustainNoiseGain);
            sustainNoiseGain.connect(filter);

            sustainNoiseSource.start(now);
        }

        // Create distortion if enabled (Electric Guitar, Trumpet, etc.)
        let outputNode = filter;
        let distortionNode = null;

        if (instrument.distortion) {
            // Distortion settings (can be customized per instrument)
            const distortionSettings = typeof instrument.distortion === 'object' 
                ? instrument.distortion 
                : { preGain: 5.0, amount: 400, postGain: 0.2 }; // Default: Electric Guitar settings
            
            distortionNode = this.audioContext.createWaveShaper();
            // Hard clipping / Overdrive curve
            distortionNode.curve = makeDistortionCurve(distortionSettings.amount);
            distortionNode.oversample = '4x';

            // Add a pre-gain to drive the distortion
            const preDistortionGain = this.audioContext.createGain();
            preDistortionGain.gain.setValueAtTime(distortionSettings.preGain, now);

            // Add a post-gain to tame the volume
            const postDistortionGain = this.audioContext.createGain();
            postDistortionGain.gain.setValueAtTime(distortionSettings.postGain, now);

            filter.connect(preDistortionGain);
            preDistortionGain.connect(distortionNode);
            distortionNode.connect(postDistortionGain);

            outputNode = postDistortionGain;
        }

        // Create main gain envelope (use instrument-specific envelope if available)
        const gainNode = this.audioContext.createGain();

        if (instrument.envelope) {
            // Use instrument-specific envelope with holdTime
            const env = instrument.envelope;
            const envDelay = env.delay || 0; // Optional delay before oscillator sound starts
            const holdTime = env.holdTime || 5.0; // Default holdTime
            const fadeOutTime = 3.0; // Gradual fade after holdTime

            gainNode.gain.setValueAtTime(0, now);
            // Keep silent during delay period, then start attack
            if (envDelay > 0) {
                gainNode.gain.setValueAtTime(0, now + envDelay);
            }
            gainNode.gain.linearRampToValueAtTime(velocity, now + envDelay + env.attack);
            gainNode.gain.linearRampToValueAtTime(velocity * env.sustain, now + envDelay + env.attack + env.decay);
            // Hold sustain level for holdTime
            gainNode.gain.linearRampToValueAtTime(velocity * env.sustain, now + envDelay + env.attack + env.decay + holdTime);
            // Then gradually fade out
            gainNode.gain.linearRampToValueAtTime(0, now + envDelay + env.attack + env.decay + holdTime + fadeOutTime);
        } else {
            // Use default envelope (for backward compatibility)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(velocity, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(velocity * 0.9, now + 2.0);
            gainNode.gain.linearRampToValueAtTime(0, now + this.decayTime);
        }

        // Create edge fade gain node (for volume reduction near screen edges)
        const edgeFadeGainNode = this.audioContext.createGain();
        edgeFadeGainNode.gain.setValueAtTime(1.0, now); // Start at full volume

        // Connect: output node (filter or distortion) -> gainNode (envelope) -> edgeFadeGainNode -> master gain
        outputNode.connect(gainNode);
        gainNode.connect(edgeFadeGainNode);
        edgeFadeGainNode.connect(this.masterGain);

        // Connect hammerNoise directly to edgeFadeGainNode (bypasses oscillator envelope delay)
        if (noiseGain) {
            noiseGain.connect(edgeFadeGainNode);
        }

        // Setup Vibrato (LFO)
        let lfo = null;
        let lfoGain = null;

        if (instrument.vibrato) {
            lfo = this.audioContext.createOscillator();
            lfo.frequency.setValueAtTime(instrument.vibrato.rate, now);

            lfoGain = this.audioContext.createGain();
            lfoGain.gain.setValueAtTime(0, now); // Start with 0 depth

            // Delay vibrato onset
            const delay = instrument.vibrato.delay || 0.5;
            const depth = instrument.vibrato.depth || 10; // Cents

            lfoGain.gain.setTargetAtTime(depth, now + delay, 0.5); // Smooth fade in

            lfo.connect(lfoGain);

            // Connect LFO to all oscillator detunes
            oscillators.forEach(({ osc }) => {
                lfoGain.connect(osc.detune);
            });

            lfo.start(now);
        }

        // Setup Pitch Bend (for animal sounds, etc.)
        // New behavior: startOffset defines where pitch starts, then returns to 0 (original pitch)
        if (instrument.pitchBend) {
            const pb = instrument.pitchBend;
            const bendDelay = pb.delay || 0;
            const bendDuration = pb.duration || 0.5;
            // startOffset: negative = start below, positive = start above
            // amount: how much to change (positive = go up, negative = go down)
            const startOffset = pb.startOffset !== undefined ? pb.startOffset : -pb.amount;
            const targetOffset = pb.target !== undefined ? pb.target : 0; // Default: return to original pitch

            oscillators.forEach(({ osc, config }) => {
                const baseDetune = config.detune || 0;
                // Start from offset
                osc.detune.setValueAtTime(baseDetune + startOffset, now + bendDelay);
                // Bend to target (default: original pitch)
                osc.detune.linearRampToValueAtTime(baseDetune + targetOffset, now + bendDelay + bendDuration);

                // Apply pitch drift if defined (gradual change during hold, returns to original)
                if (instrument.pitchDrift) {
                    const pd = instrument.pitchDrift;
                    const driftDelay = pd.delay || (bendDelay + bendDuration);
                    const driftDuration = pd.duration || 1.0;
                    const driftTarget = pd.target !== undefined ? pd.target : 0; // Default: original pitch
                    osc.detune.linearRampToValueAtTime(baseDetune + driftTarget, now + driftDelay + driftDuration);
                }
            });
        } else if (instrument.pitchDrift) {
            // Pitch drift without initial bend
            const pd = instrument.pitchDrift;
            const driftDelay = pd.delay || 0;
            const driftDuration = pd.duration || 1.0;
            const driftTarget = pd.target !== undefined ? pd.target : 0;

            oscillators.forEach(({ osc, config }) => {
                const baseDetune = config.detune || 0;
                osc.detune.setValueAtTime(baseDetune, now + driftDelay);
                osc.detune.linearRampToValueAtTime(baseDetune + driftTarget, now + driftDelay + driftDuration);
            });
        }

        // Setup Filter Sweep (for formant-like vowel changes)
        if (instrument.filterSweep) {
            const fs = instrument.filterSweep;
            
            // Multi-stage filter sweep support
            if (fs.stages) {
                let currentTime = now;
                let currentFreq = fs.stages[0]?.freq || instrument.filter.frequency;
                filter.frequency.setValueAtTime(currentFreq, currentTime);
                
                fs.stages.forEach((stage, index) => {
                    if (index === 0) {
                        // First stage: hold at initial freq
                        currentTime += stage.hold || 0;
                        filter.frequency.setValueAtTime(stage.freq, currentTime);
                    } else {
                        // Subsequent stages: ramp to new freq
                        const rampTime = stage.duration || 0.2;
                        filter.frequency.exponentialRampToValueAtTime(stage.freq, currentTime + rampTime);
                        currentTime += rampTime;
                        // Hold at this freq if specified
                        if (stage.hold) {
                            currentTime += stage.hold;
                            filter.frequency.setValueAtTime(stage.freq, currentTime);
                        }
                    }
                });
            } else {
                // Simple two-point sweep
                const sweepDelay = fs.delay || 0;
                const sweepDuration = fs.duration || 0.3;
                const startFreq = fs.startFreq || instrument.filter.frequency;
                const endFreq = fs.endFreq || instrument.filter.frequency;

                filter.frequency.setValueAtTime(startFreq, now + sweepDelay);
                filter.frequency.exponentialRampToValueAtTime(endFreq, now + sweepDelay + sweepDuration);
            }
        }

        // Calculate total envelope time
        let totalTime = this.decayTime;
        if (instrument.envelope) {
            const holdTime = instrument.envelope.holdTime || 5.0;
            const fadeOutTime = 3.0;
            totalTime = instrument.envelope.attack + instrument.envelope.decay + holdTime + fadeOutTime;
        }

        // Auto-stop: touchend 欠落時の安全弁（通常は stopTouchSound で解除）
        const autoStopTimeout = setTimeout(() => {
            if (this.activeTouches.has(touchId)) {
                this.endTouch(
                    touchId,
                    this.activeTouches.get(touchId)?.currentClientX ?? null,
                    this.activeTouches.get(touchId)?.currentClientY ?? null
                );
                return;
            }
            try {
                oscillators.forEach(({ osc }) => {
                    try {
                        osc.stop();
                    } catch (err) {
                        // Already stopped
                    }
                });
                if (lfo) {
                    try {
                        lfo.stop();
                    } catch (err) { /* noop */ }
                }
                if (sustainNoiseSource) {
                    try {
                        sustainNoiseSource.stop();
                    } catch (err) { /* noop */ }
                }
                gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            } catch (err) {
                // Ignore
            }
            this.markTouchIndicatorReleased(touchId, null);
        }, totalTime * 1000 + 100);

        // Store references
        const touchData = {
            oscillators,
            filter,
            gainNode,
            edgeFadeGainNode, // Store edge fade gain node for volume control near edges
            lfo, // Store LFO reference
            noiseSource, // Store noise source reference
            sustainNoiseSource, // Store sustain noise source reference
            layerIndex,
            instrumentType: layer.instrument,
            startTime: now,
            touchStartTime: Date.now(), // Real timestamp for hold duration calculation
            touchStartFrequency: frequency,
            cleanupTimeout: null,
            autoStopTimeout: autoStopTimeout,
            snapTimeout: null,
            currentFrequency: frequency,
            targetFrequency: frequency,
            currentClientX: null,
            currentClientY: null,
            frequencyHistory: [], // Store recent frequency changes for inertia
            positionHistory: [], // Store screen position history for mute detection
            snappedFrequency: null // Store snapped frequency for stickiness
        };

        this.activeTouches.set(touchId, touchData);

        // Start position tracker for static position recording (for mute detection)
        const positionTracker = setInterval(() => {
            const touch = this.activeTouches.get(touchId);
            if (!touch || touch.currentClientX === null || touch.currentClientY === null) {
                return;
            }

            // Record current position even if not moving
            const positionEntry = {
                time: Date.now(),
                x: touch.currentClientX,
                y: touch.currentClientY
            };
            touch.positionHistory.push(positionEntry);

            // Remove entries older than 600ms
            const cutoffTime = Date.now() - 600;
            touch.positionHistory = touch.positionHistory.filter(entry => entry.time > cutoffTime);
        }, 50); // Record every 50ms

        touchData.positionTracker = positionTracker;

        // Set initial edge fade volume if position is known
        if (clientX !== null && clientY !== null) {
            const edgeFadeVolume = this.getEdgeFadeVolume(clientX, clientY, layerIndex);
            edgeFadeGainNode.gain.setValueAtTime(edgeFadeVolume, now);
        }

        // Schedule snap if enabled (effectiveSnapMode is calculated dynamically in scheduleSnap)
        this.scheduleSnap(touchId, frequency);
    }

    // Store touch indicator screen position
    setTouchPosition(touchId, clientX, clientY) {
        const touch = this.activeTouches.get(touchId);
        if (touch) {
            touch.currentClientX = clientX;
            touch.currentClientY = clientY;

            // Record screen position history for inertia calculation (keep last 600ms for mute detection)
            if (!touch.positionHistory) {
                touch.positionHistory = [];
            }

            const positionEntry = {
                time: Date.now(),
                x: clientX,
                y: clientY
            };
            touch.positionHistory.push(positionEntry);

            // Remove entries older than 600ms
            const cutoffTime = Date.now() - 600;
            touch.positionHistory = touch.positionHistory.filter(entry => entry.time > cutoffTime);
        }
    }

    updateTouchSound(touchId, frequency, clientX, clientY) {
        const touch = this.activeTouches.get(touchId);
        if (!touch) {
            const elapsed = touchId === 'mouse' && this.mouseDownTime ?
                ((Date.now() - this.mouseDownTime) / 1000).toFixed(2) : 'N/A';
            console.error(`❌ updateTouchSound: No active touch for ${touchId}, elapsed: ${elapsed}s`);
            return;
        }

        const now = this.audioContext.currentTime;

        // Debug: log frequency updates for mouse
        if (touchId === 'mouse') {
            const elapsed = this.mouseDownTime ? ((Date.now() - this.mouseDownTime) / 1000).toFixed(2) : 'N/A';
            const timeSinceLastMove = this.lastMouseMoveTime ? ((Date.now() - this.lastMouseMoveTime) / 1000).toFixed(3) : 'N/A';
            this.lastMouseMoveTime = Date.now();
        }

        // Calculate effective snap mode based on current position
        const effectiveSnapMode = (clientX !== null && clientY !== null)
            ? this.getEffectiveSnapMode(clientX, clientY, touch.layerIndex)
            : this.snapMode;

        // Track if we were snapped before this update
        const wasSnapped = touch.snappedFrequency !== null;
        let isUnsnapping = false;

        // Check snap stickiness: if we're close to a snapped frequency, maintain it
        if (touch.snappedFrequency && effectiveSnapMode !== 'off') {
            const semitonesFromSnap = 12 * Math.log2(frequency / touch.snappedFrequency);
            const snapStickyThreshold = 0.3; // semitones

            if (Math.abs(semitonesFromSnap) < snapStickyThreshold) {
                // Stay snapped - use the snapped frequency instead
                frequency = touch.snappedFrequency;
            } else {
                // Moved far enough - clear snap and mark as unsnapping
                touch.snappedFrequency = null;
                isUnsnapping = true;
            }
        }

        // Update current frequency
        touch.currentFrequency = frequency;

        // Record frequency history for inertia calculation (keep last 150ms)
        const historyEntry = {
            time: Date.now(),
            frequency: frequency
        };
        touch.frequencyHistory.push(historyEntry);

        // Update screen position (which also records position history)
        this.setTouchPosition(touchId, clientX, clientY);

        // 慣性用に押し終わり 100ms 前まで保持（100〜20ms 窓用）
        const cutoffTime = Date.now() - 200;
        touch.frequencyHistory = touch.frequencyHistory.filter(entry => entry.time > cutoffTime);

        // Update oscillator frequencies
        const instrument = INSTRUMENTS[touch.instrumentType];
        
        if (isUnsnapping) {
            // Smooth transition when unsnapping (30ms)
            const unsnapTransitionTime = 0.03;
            touch.oscillators.forEach(({ osc, config }) => {
                let freq = frequency;
                if (config.octave !== undefined) {
                    freq = frequency * Math.pow(2, config.octave);
                } else if (config.partial !== undefined) {
                    freq = frequency * config.partial;
                }

                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(osc.frequency.value, now);
                osc.frequency.setTargetAtTime(freq, now, unsnapTransitionTime);
            });
        } else {
            // Instant response during normal dragging
            touch.oscillators.forEach(({ osc, config }) => {
                let freq = frequency;
                if (config.octave !== undefined) {
                    freq = frequency * Math.pow(2, config.octave);
                } else if (config.partial !== undefined) {
                    freq = frequency * config.partial;
                }

                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(freq, now);
            });
        }

        // Update edge fade volume based on current position
        if (clientX !== null && clientY !== null) {
            const edgeFadeVolume = this.getEdgeFadeVolume(clientX, clientY, touch.layerIndex);
            // Smooth transition to new volume (20ms for responsive but smooth change)
            const volumeTransitionTime = 0.02;
            touch.edgeFadeGainNode.gain.cancelScheduledValues(now);
            touch.edgeFadeGainNode.gain.setValueAtTime(touch.edgeFadeGainNode.gain.value, now);
            touch.edgeFadeGainNode.gain.setTargetAtTime(edgeFadeVolume, now, volumeTransitionTime);
            
            // Update touch indicator with current edge fade volume using CSS filter
            const indicator = this.touchIndicators.get(touchId);
            if (indicator && indicator.element) {
                indicator.element.style.filter = `opacity(${edgeFadeVolume})`;
            }
        }

        // Reschedule snap if enabled (effectiveSnapMode is calculated in scheduleSnap)
        this.scheduleSnap(touchId, frequency);
    }

    stopTouchSound(touchId, endSource = 'unknown', releaseClientX = null, releaseClientY = null) {
        const touch = this.activeTouches.get(touchId);
        if (!touch) {
            console.warn(`⚠️ stopTouchSound: No active touch for ${touchId}`);
            return;
        }

        if (releaseClientX != null && releaseClientY != null) {
            touch.currentClientX = releaseClientX;
            touch.currentClientY = releaseClientY;
            this.setTouchPosition(touchId, releaseClientX, releaseClientY);
        }

        // 離した位置の音程を反映（非慣性でも端で min/max に張り付かない）
        if (touch.currentClientX != null && touch.currentClientY != null) {
            const rect = this.canvas.getBoundingClientRect();
            touch.currentFrequency = this.getFrequencyFromPosition(
                touch.currentClientX - rect.left,
                touch.currentClientY - rect.top
            );
        }

        const elapsed = touchId === 'mouse' && this.mouseDownTime ?
            ((Date.now() - this.mouseDownTime) / 1000).toFixed(2) : 'N/A';

        const now = this.audioContext.currentTime;

        // Calculate effective snap mode based on current position
        const effectiveSnapMode = (touch.currentClientX !== null && touch.currentClientY !== null)
            ? this.getEffectiveSnapMode(touch.currentClientX, touch.currentClientY, touch.layerIndex)
            : this.snapMode;

        // If snap is enabled and there's a pending snap, perform it immediately on release
        if (effectiveSnapMode !== 'off' && touch.snapTimeout) {
            clearTimeout(touch.snapTimeout);
            touch.snapTimeout = null;

            // Perform snap immediately
            const snappedFreq = this.snapToSemitone(touch.currentFrequency, effectiveSnapMode);

            // Instant snap (no smooth transition since we're releasing)
            const instrument = INSTRUMENTS[touch.instrumentType];
            touch.oscillators.forEach(({ osc, config }) => {
                let freq = snappedFreq;
                if (config.octave !== undefined) {
                    freq = snappedFreq * Math.pow(2, config.octave);
                } else if (config.partial !== undefined) {
                    freq = snappedFreq * config.partial;
                }
                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(freq, now);
            });

            // Move indicator to snapped position with quick smooth transition
            if (touch.currentClientX !== null && touch.currentClientY !== null) {
                const snappedPos = this.getScreenPositionFromFrequency(
                    snappedFreq,
                    touch.currentClientX,
                    touch.currentClientY
                );

                // Use a quick smooth transition (0.1s) for release snap
                const indicator = this.touchIndicators.get(touchId);
                if (indicator) {
                    indicator.element.style.transition = 'left 0.1s ease-out, top 0.1s ease-out';
                    indicator.element.style.left = `${snappedPos.x}px`;
                    indicator.element.style.top = `${snappedPos.y}px`;
                    
                    // Note: Do NOT update edgeFadeVolume here
                    // The actual finger position hasn't changed - only the indicator moved
                    // Edge fade volume should reflect the actual finger position
                }
            } else {
                console.warn(`⚠️ Cannot move indicator: currentClientX=${touch.currentClientX}, currentClientY=${touch.currentClientY}`);
            }
        } else if (touch.currentClientX != null && touch.currentClientY != null) {
            // スナップオフ: 離した位置の音程をそのままオシレータへ
            const releaseFreq = touch.currentFrequency;
            touch.oscillators.forEach(({ osc, config }) => {
                let freq = releaseFreq;
                if (config.octave !== undefined) {
                    freq = releaseFreq * Math.pow(2, config.octave);
                } else if (config.partial !== undefined) {
                    freq = releaseFreq * config.partial;
                }
                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(Math.max(20, Math.abs(freq)), now);
            });
        }

        // Inertia velocity will be calculated from screen pixel velocity (velocityX/Y)
        // This ensures the visual speed matches the swipe speed

        const nowMs = Date.now();
        const releaseVel = computeReleaseScreenVelocity(touch.positionHistory, nowMs, 100, 20);
        let velocityX = releaseVel.velocityX;
        let velocityY = releaseVel.velocityY;

        // Detect quick mute (guitar mute technique)
        let isQuickMute = false;
        if (touch.positionHistory && touch.positionHistory.length >= 3) {
            const history = touch.positionHistory;
            const now = Date.now();
            const isLandscape = window.innerWidth >= window.innerHeight;
            const axis = isLandscape ? 'x' : 'y';

            // Filter to last 150ms and older entries
            const recent150ms = history.filter(e => now - e.time <= 150);
            const older = history.filter(e => now - e.time > 150 && now - e.time <= 600);

            if (recent150ms.length >= 2 && older.length >= 2) {
                // Calculate overall direction in last 150ms
                const recentFirst = recent150ms[0];
                const recentLast = recent150ms[recent150ms.length - 1];
                const recentMove = recentLast[axis] - recentFirst[axis];

                // Calculate overall direction before 150ms
                const olderFirst = older[0];
                const olderLast = older[older.length - 1];
                const olderMove = olderLast[axis] - olderFirst[axis];

                // Check if direction changed (opposite signs) and both movements are significant
                const directionChanged = (recentMove * olderMove) < 0;
                const recentSignificant = Math.abs(recentMove) > 5; // At least 5px
                const olderSignificant = Math.abs(olderMove) > 10; // At least 10px

                if (directionChanged && recentSignificant && olderSignificant) {
                    isQuickMute = true;
                }
            } else {
            }
        }

        // Save references before removing from active touches
        const oscillators = touch.oscillators;
        const gainNode = touch.gainNode;
        const filter = touch.filter;
        const sustainNoiseSource = touch.sustainNoiseSource;
        const startFreq = touch.currentFrequency;
        const startX = touch.currentClientX || 0;
        const startY = touch.currentClientY || 0;

        // Stop position tracker
        if (touch.positionTracker) {
            clearInterval(touch.positionTracker);
        }

        // Immediately remove from active touches to prevent double-stop
        this.activeTouches.delete(touchId);

        // Get release time from instrument envelope, or use default
        const instrument = INSTRUMENTS[touch.instrumentType];
        let releaseTime = instrument?.envelope?.release || this.releaseTime;

        // Override release time and apply mute effect for quick mute
        if (isQuickMute) {
            releaseTime = 0.12; // 120ms - shorter for clear mute
            
            // Apply EXTREME mute effect: drastically reduce high frequencies (like palm muting)
            filter.frequency.cancelScheduledValues(now);
            filter.frequency.setValueAtTime(filter.frequency.value, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.01); // Cut to 80Hz VERY quickly (10ms)
            
            // Also reduce Q for duller sound
            filter.Q.cancelScheduledValues(now);
            filter.Q.setValueAtTime(filter.Q.value, now);
            filter.Q.linearRampToValueAtTime(0.1, now + 0.01); // Very low Q for muffled sound
            
            // Reduce volume too for mute effect
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(gainNode.gain.value * 0.3, now + 0.01); // Reduce to 30%
            gainNode.gain.linearRampToValueAtTime(0, now + releaseTime); // Then fade out
        } else {
        }

        let endFreq = startFreq;
        const isLandscape = window.innerWidth >= window.innerHeight;

        const velocityThreshold = 50; // px/s
        const minHoldMsForInertia = 400;
        const holdMs = Date.now() - (touch.touchStartTime || Date.now());
        const touchStartFrequency = touch.touchStartFrequency || startFreq;
        const octaveTravel = Math.abs(
            Math.log2(Math.max(20, startFreq) / Math.max(20, touchStartFrequency))
        );
        const hasEnoughPitchTravel = octaveTravel >= 0.5;
        const meetsHoldRequirement = holdMs >= minHoldMsForInertia || hasEnoughPitchTravel;
        const pitchVelocity = isLandscape ? velocityX : velocityY;
        const hasInertia = !isQuickMute
            && meetsHoldRequirement
            && Math.abs(pitchVelocity) > velocityThreshold;

        let inertiaGlideTime = releaseTime;
        let inertiaMeta = { logSlopePerSec: 0, beyondScale: false };

        if (hasInertia) {
            inertiaMeta = this.computeInertiaEndFrequency(
                startFreq,
                velocityX,
                velocityY,
                releaseTime
            );
            endFreq = inertiaMeta.endFreq;
            inertiaGlideTime = inertiaMeta.inertiaGlideTime;
        }

        if (hasInertia) {

            // Use exponentialRampToValueAtTime for smooth frequency change on logarithmic scale
            oscillators.forEach(({ osc, config }) => {
                let startF = startFreq;
                let endF = endFreq;

                if (config.octave !== undefined) {
                    startF = startFreq * Math.pow(2, config.octave);
                    endF = endFreq * Math.pow(2, config.octave);
                } else if (config.partial !== undefined) {
                    startF = startFreq * config.partial;
                    endF = endFreq * config.partial;
                }

                try {
                    osc.frequency.cancelScheduledValues(now);
                    osc.frequency.setValueAtTime(startF, now);
                    // Use exponential ramp for logarithmic frequency scale
                    osc.frequency.exponentialRampToValueAtTime(Math.max(20, Math.abs(endF)), now + inertiaGlideTime);
                } catch (e) {
                    console.warn('Failed to set frequency ramp:', e);
                }
            });
        }

        // Fade out main gain (skip if already handled by quick mute)
        if (!isQuickMute) {
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);
        }

        // Complete pitch bend first if released early (for animal sounds)
        // This ensures the initial pitch rise happens even on quick release
        if (!isQuickMute && instrument.pitchBend) {
            const pb = instrument.pitchBend;
            const bendDuration = pb.duration || 0.5;
            const elapsedTime = (now - touch.startTime);
            
            // If released before pitch bend completed, quickly finish the bend
            if (elapsedTime < bendDuration) {
                const baseDetune = 0; // Target is always 0 (original pitch)
                const quickFinishTime = 0.05; // 50ms to finish the bend
                
                oscillators.forEach(({ osc, config }) => {
                    const configDetune = config.detune || 0;
                    osc.detune.cancelScheduledValues(now);
                    osc.detune.setValueAtTime(osc.detune.value, now);
                    // Quickly ramp to target (original pitch)
                    osc.detune.linearRampToValueAtTime(configDetune + baseDetune, now + quickFinishTime);
                });
                
                // Delay release pitch bend to after quick finish
                if (instrument.releasePitchBend) {
                    const rpb = instrument.releasePitchBend;
                    const bendAmount = rpb.amount || 0;
                    const bendDur = Math.min(rpb.duration || releaseTime, releaseTime);
                    
                    oscillators.forEach(({ osc, config }) => {
                        const configDetune = config.detune || 0;
                        osc.detune.linearRampToValueAtTime(configDetune + bendAmount, now + quickFinishTime + bendDur);
                    });
                }
            } else {
                // Normal release pitch bend
                if (instrument.releasePitchBend) {
                    const rpb = instrument.releasePitchBend;
                    const bendAmount = rpb.amount || 0;
                    const bendDuration = Math.min(rpb.duration || releaseTime, releaseTime);

                    oscillators.forEach(({ osc, config }) => {
                        const currentDetune = osc.detune.value;
                        osc.detune.cancelScheduledValues(now);
                        osc.detune.setValueAtTime(currentDetune, now);
                        osc.detune.linearRampToValueAtTime(currentDetune + bendAmount, now + bendDuration);
                    });
                }
            }
        } else if (!isQuickMute && instrument.releasePitchBend) {
            // Apply release pitch bend if defined (for instruments without pitchBend)
            const rpb = instrument.releasePitchBend;
            const bendAmount = rpb.amount || 0;
            const bendDuration = Math.min(rpb.duration || releaseTime, releaseTime);

            oscillators.forEach(({ osc, config }) => {
                const currentDetune = osc.detune.value;
                osc.detune.cancelScheduledValues(now);
                osc.detune.setValueAtTime(currentDetune, now);
                osc.detune.linearRampToValueAtTime(currentDetune + bendAmount, now + bendDuration);
            });
        }

        // Cancel any existing timeouts
        if (touch.cleanupTimeout) {
            clearTimeout(touch.cleanupTimeout);
        }
        if (touch.autoStopTimeout) {
            clearTimeout(touch.autoStopTimeout);
        }

        // Stop oscillators after release time
        setTimeout(() => {

            try {
                oscillators.forEach(({ osc }) => {
                    try {
                        osc.stop();
                    } catch (e) {
                        // Oscillator may already be stopped
                    }
                });
                // Stop sustain noise if exists
                if (sustainNoiseSource) {
                    try {
                        sustainNoiseSource.stop();
                    } catch (e) {
                        // Already stopped
                    }
                }
                // Disconnect all nodes to ensure cleanup
                oscillators.forEach(({ osc, gain }) => {
                    try {
                        osc.disconnect();
                        gain.disconnect();
                    } catch (e) {
                        // Already disconnected
                    }
                });
                filter.disconnect();
                gainNode.disconnect();
            } catch (e) {
                console.warn(`Warning: Could not stop oscillators for ${touchId}:`, e.message);
            }
        }, releaseTime * 1000 + 100);

        // Return inertia info for indicator animation
        return {
            endFrequency: endFreq,
            hasInertia,
            releaseTime,
            inertiaGlideTime: hasInertia ? inertiaGlideTime : releaseTime,
            currentFrequency: startFreq,
            velocityX,
            velocityY,
            startX,
            startY
        };
    }

    createTouchIndicator(touchId, x, y, layerIndex = 0) {
        const indicator = document.createElement('div');
        indicator.className = 'touch-indicator';
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        indicator.style.opacity = '1';
        
        // Calculate initial edge fade volume and apply as CSS filter
        const initialEdgeFadeVolume = this.getEdgeFadeVolume(x, y, layerIndex);
        indicator.style.filter = `opacity(${initialEdgeFadeVolume})`;
        
        document.body.appendChild(indicator);

        // Get instrument type from layer for release time calculation
        const layer = this.layers[layerIndex];
        const instrumentType = layer ? layer.instrument : 'piano';

        // Store reference for tracking
        this.touchIndicators.set(touchId, {
            element: indicator,
            startTime: Date.now(),
            releaseTime: null, // Track when touch is released
            releaseOpacity: null, // Store opacity at release for smooth fade
            instrumentType: instrumentType // Store for release time lookup
        });

        // Start fade animation based on velocity decay
        this.animateTouchIndicator(touchId);
    }

    animateTouchIndicator(touchId) {
        const indicator = this.touchIndicators.get(touchId);
        if (!indicator || !indicator.element || !indicator.element.parentNode) {
            // Indicator has been removed, stop animation
            if (indicator) {
                this.touchIndicators.delete(touchId);
            }
            return;
        }

        const now = Date.now();
        let opacity;

        if (indicator.releaseTime !== null) {
            // Touch has been released - use instrument-specific release time
            const releaseElapsed = (now - indicator.releaseTime) / 1000;

            // Get release time from stored value or instrument envelope
            const instrument = INSTRUMENTS[indicator.instrumentType];
            const glideTime = indicator.releaseTimeTotal || instrument?.envelope?.release || this.releaseTime;
            const gainReleaseTime = indicator.gainReleaseTimeTotal || glideTime;

            if (releaseElapsed < gainReleaseTime) {
                const releaseProgress = releaseElapsed / gainReleaseTime;
                opacity = indicator.releaseOpacity * (1 - releaseProgress);

                if (indicator.hasInertia && releaseElapsed < glideTime) {
                    const startFreq = indicator.startFrequency || 440;
                    const endFreq = indicator.endFrequency || startFreq;

                    const progress = releaseElapsed / glideTime;
                    const ratio = endFreq / startFreq;
                    const currentFreq = startFreq * Math.pow(ratio, progress);

                    // Calculate screen position from frequency
                    const currentX = parseFloat(indicator.element.style.left) || window.innerWidth / 2;
                    const currentY = parseFloat(indicator.element.style.top) || window.innerHeight / 2;

                    const newPos = this.getScreenPositionFromFrequency(currentFreq, currentX, currentY);

                    // Apply screen position inertia for non-pitch axis using same progress
                    let finalX = newPos.x;
                    let finalY = newPos.y;

                    const isLandscape = window.innerWidth >= window.innerHeight;

                    const velocityThreshold = 50; // px/s

                    if (isLandscape) {
                        // Landscape: X is pitch, Y is free
                        // Apply Y velocity inertia with same progress ratio
                        if (Math.abs(indicator.velocityY) > velocityThreshold) {
                            const endY = indicator.startY + indicator.velocityY * glideTime;
                            const clampedEndY = Math.max(0, Math.min(window.innerHeight, endY));
                            // Linear interpolation with same progress
                            finalY = indicator.startY + (clampedEndY - indicator.startY) * progress;
                            // Clamp current position as well
                            finalY = Math.max(0, Math.min(window.innerHeight, finalY));
                        }
                    } else {
                        // Portrait: Y is pitch, X is free
                        // Apply X velocity inertia with same progress ratio
                        if (Math.abs(indicator.velocityX) > velocityThreshold) {
                            const endX = indicator.startX + indicator.velocityX * glideTime;
                            const clampedEndX = Math.max(0, Math.min(window.innerWidth, endX));
                            // Linear interpolation with same progress
                            finalX = indicator.startX + (clampedEndX - indicator.startX) * progress;
                            // Clamp current position as well
                            finalX = Math.max(0, Math.min(window.innerWidth, finalX));
                        }
                    }

                    // Update position
                    indicator.element.style.left = `${finalX}px`;
                    indicator.element.style.top = `${finalY}px`;
                }
            } else {
                opacity = 0;
            }
        } else {
            // Touch is still held - keep visible for user feedback
            const elapsed = (now - indicator.startTime) / 1000;
            const instrument = INSTRUMENTS[indicator.instrumentType];
            const env = instrument?.envelope;

            if (env) {
                const attack = Math.max(0.05, env.attack); // Minimum visual attack
                const holdTime = env.holdTime || 5.0;
                const fadeOutTime = 3.0;
                const minOpacity = 0.7; // Keep visible during hold

                if (elapsed < attack) {
                    // Attack phase - fade in to full opacity
                    opacity = 0.3 + (elapsed / attack) * 0.7; // 0.3 -> 1.0
                } else if (elapsed < attack + holdTime) {
                    // Hold phase - maintain high opacity for visibility
                    opacity = 1.0;
                } else if (elapsed < attack + holdTime + fadeOutTime) {
                    // Gradual fade during extended hold
                    const fadeProgress = (elapsed - attack - holdTime) / fadeOutTime;
                    opacity = 1.0 - fadeProgress * (1.0 - minOpacity); // 1.0 -> 0.7
                } else {
                    // Final slow fade
                    const extraTime = elapsed - attack - holdTime - fadeOutTime;
                    opacity = minOpacity * Math.max(0, 1 - extraTime / 5.0); // Very slow fade
                }
            } else {
                // Fallback for instruments without envelope
                if (elapsed < 2.0) {
                    opacity = 1.0;
                } else if (elapsed < this.decayTime) {
                    const decayProgress = (elapsed - 2.0) / (this.decayTime - 2.0);
                    opacity = 1.0 - decayProgress * 0.3; // Stay mostly visible
                } else {
                    opacity = 0.7 * Math.max(0, 1 - (elapsed - this.decayTime) / 5.0);
                }
            }
        }

        // Set envelope-based opacity (edge fade is handled separately via CSS filter)
        indicator.element.style.opacity = opacity.toString();

        // Continue animation if still active
        if (opacity > 0 && this.touchIndicators.has(touchId)) {
            requestAnimationFrame(() => this.animateTouchIndicator(touchId));
        } else if (opacity <= 0) {
            this.removeTouchIndicator(touchId);
        }
    }

    updateTouchIndicatorPosition(touchId, x, y, smooth = false) {
        const indicator = this.touchIndicators.get(touchId);
        if (!indicator) return;

        if (smooth) {
            // Enable smooth CSS transition
            indicator.element.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
        } else {
            // Instant movement (for dragging)
            indicator.element.style.transition = 'left 0.05s ease-out, top 0.05s ease-out';
        }

        indicator.element.style.left = `${x}px`;
        indicator.element.style.top = `${y}px`;
    }

    markTouchIndicatorReleased(touchId, inertiaInfo = null) {
        const indicator = this.touchIndicators.get(touchId);
        if (!indicator) return;

        // Only mark as released if not already released
        if (indicator.releaseTime !== null) return;

        // Mark as released and store current opacity and inertia
        indicator.releaseTime = Date.now();
        indicator.releaseOpacity = parseFloat(indicator.element.style.opacity) || 0.5;

        if (inertiaInfo) {
            indicator.hasInertia = inertiaInfo.hasInertia || false;
            indicator.endFrequency = inertiaInfo.endFrequency || inertiaInfo.currentFrequency || 440;
            indicator.releaseTimeTotal = inertiaInfo.inertiaGlideTime || inertiaInfo.releaseTime || 0.5;
            indicator.gainReleaseTimeTotal = inertiaInfo.releaseTime || 0.5;
            indicator.startFrequency = inertiaInfo.currentFrequency || 440; // Store start frequency
            indicator.velocityX = inertiaInfo.velocityX || 0; // px per second
            indicator.velocityY = inertiaInfo.velocityY || 0; // px per second
            indicator.startX = inertiaInfo.startX || 0; // Starting screen X
            indicator.startY = inertiaInfo.startY || 0; // Starting screen Y
        } else {
            indicator.hasInertia = false;
            indicator.endFrequency = 440;
            indicator.releaseTimeTotal = 0.5;
            indicator.startFrequency = 440;
            indicator.velocityX = 0;
            indicator.velocityY = 0;
            indicator.startX = 0;
            indicator.startY = 0;
        }
    }

    removeTouchIndicator(touchId) {
        const indicator = this.touchIndicators.get(touchId);
        if (!indicator) return;

        indicator.element.remove();
        this.touchIndicators.delete(touchId);
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        this.reconcileActiveTouches(e.touches);

        const rect = this.canvas.getBoundingClientRect();
        const pendingTouches = [];

        for (let touch of e.changedTouches) {
            const touchId = touch.identifier;
            this.ownedTouchIds.add(touchId);
            this.cancelledTouchIds.delete(touchId);
            this.pendingStartTouchIds.add(touchId);

            if (this.activeTouches.has(touchId)) {
                this.endTouch(touchId, touch.clientX, touch.clientY);
            }

            if (this.touchIndicators.has(touchId)) {
                const indicator = this.touchIndicators.get(touchId);
                if (indicator) {
                    if (indicator.releaseTime === null) {
                        if (indicator.element) {
                            indicator.element.remove();
                        }
                        this.touchIndicators.delete(touchId);
                    } else {
                        const newKey = `released-${touchId}-${Date.now()}`;
                        this.touchIndicators.delete(touchId);
                        this.touchIndicators.set(newKey, indicator);
                        this.animateTouchIndicator(newKey);
                    }
                }
            }

            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            pendingTouches.push({
                touchId,
                x,
                y,
                clientX: touch.clientX,
                clientY: touch.clientY,
                layerIndex: this.getLayerIndexFromPosition(x, y),
                onLabel: this.isPointOnLabel(touch.clientX, touch.clientY)
            });
        }

        if (pendingTouches.length === 0) {
            return;
        }

        // オーディオ稼働中は await せず即鳴らす（連打の遅延を防ぐ）
        if (this.isAudioRunning()) {
            this.applyTouchStarts(pendingTouches);
            return;
        }

        void this.ensureAudioReady({ fromUserGesture: true })
            .then((ready) => {
                if (!ready || !this.audioContext) {
                    pendingTouches.forEach((p) => {
                        this.pendingStartTouchIds.delete(p.touchId);
                        this.deferredTouchEnds.delete(p.touchId);
                        this.ownedTouchIds.delete(p.touchId);
                    });
                    return;
                }
                this.applyTouchStarts(pendingTouches);
            })
            .catch((err) => console.warn('applyTouchStarts:', err));
    }

    applyTouchStarts(pendingTouches) {
        for (const p of pendingTouches) {
            if (!this.pendingStartTouchIds.has(p.touchId)) {
                continue;
            }

            const deferredEnd = this.deferredTouchEnds.get(p.touchId);
            if (this.cancelledTouchIds.has(p.touchId) && !deferredEnd) {
                this.cancelledTouchIds.delete(p.touchId);
                this.pendingStartTouchIds.delete(p.touchId);
                this.ownedTouchIds.delete(p.touchId);
                continue;
            }

            this.cancelledTouchIds.delete(p.touchId);
            this.pendingStartTouchIds.delete(p.touchId);

            if (p.onLabel) {
                this.labelStartedTouches.set(p.touchId, true);
            }

            const freq = this.getFrequencyFromPosition(p.x, p.y);
            this.createTouchSound(p.touchId, freq, p.layerIndex, p.clientX, p.clientY);
            this.createTouchIndicator(p.touchId, p.clientX, p.clientY, p.layerIndex);
            this.setTouchPosition(p.touchId, p.clientX, p.clientY);

            if (deferredEnd) {
                this.deferredTouchEnds.delete(p.touchId);
                this.endTouch(p.touchId, deferredEnd.clientX, deferredEnd.clientY, 'deferred');
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.audioContext) return;
        this.reconcileActiveTouches(e.touches);

        const rect = this.canvas.getBoundingClientRect();

        for (let touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const freq = this.getFrequencyFromPosition(x, y);
            this.updateTouchSound(touch.identifier, freq, touch.clientX, touch.clientY);
            this.updateTouchIndicatorPosition(touch.identifier, touch.clientX, touch.clientY, false);
        }
    }

    // Mouse event handlers
    handleMouseDown(e) {

        if (!this.audioContext) {
            return; // Wait for audio initialization
        }

        // Prevent duplicate mouse down events
        if (this.isMouseDown) {
            console.warn('⚠️ Mouse already down, ignoring duplicate mousedown');
            return;
        }

        // Force cleanup of any existing mouse sound and indicator
        if (this.activeTouches.has('mouse')) {
            const existingTouch = this.activeTouches.get('mouse');

            // Cancel any pending timeouts
            if (existingTouch.cleanupTimeout) {
                clearTimeout(existingTouch.cleanupTimeout);
            }
            if (existingTouch.autoStopTimeout) {
                clearTimeout(existingTouch.autoStopTimeout);
            }
            if (existingTouch.snapTimeout) {
                clearTimeout(existingTouch.snapTimeout);
            }

            // Immediately remove from active touches
            this.activeTouches.delete('mouse');

            // Stop oscillators immediately
            try {
                existingTouch.oscillators.forEach(({ osc }) => osc.stop());
            } catch (e) {
                console.warn('Warning: Could not stop oscillators:', e.message);
            }
        }

        // Force remove indicator even if still animating
        if (this.touchIndicators.has('mouse')) {
            const indicator = this.touchIndicators.get('mouse');
            if (indicator && indicator.element) {
                indicator.element.remove();
            }
            this.touchIndicators.delete('mouse');
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const freq = this.getFrequencyFromPosition(x, y);

        // Determine which layer this mouse belongs to
        const layerIndex = this.getLayerIndexFromPosition(x, y);

        this.mouseDownTime = Date.now();
        this.lastMouseMoveTime = Date.now();

        // Track if mouse started on a label
        if (this.isPointOnLabel(e.clientX, e.clientY)) {
            this.labelStartedTouches.set('mouse', true);
        }

        this.createTouchSound('mouse', freq, layerIndex, e.clientX, e.clientY);
        this.createTouchIndicator('mouse', e.clientX, e.clientY, layerIndex);
        this.setTouchPosition('mouse', e.clientX, e.clientY);
        this.isMouseDown = true;

    }

    handleMouseMove(e) {
        if (!this.isMouseDown) return;
        if (!this.audioContext) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const freq = this.getFrequencyFromPosition(x, y);

        this.updateTouchSound('mouse', freq, e.clientX, e.clientY);
        this.updateTouchIndicatorPosition('mouse', e.clientX, e.clientY, false);
    }

    handleMouseUp(e) {
        if (!this.isMouseDown) return;

        const elapsed = this.mouseDownTime ? ((Date.now() - this.mouseDownTime) / 1000).toFixed(2) : 'N/A';

        // Check if mouse started and ended on a label
        if (this.labelStartedTouches.has('mouse') && 
            this.isPointOnLabel(e.clientX, e.clientY)) {
            this.toggleLabelPosition();
        }
        this.labelStartedTouches.delete('mouse');

        this.isMouseDown = false;
        this.mouseDownTime = null;
        this.lastMouseMoveTime = null;

        // Only stop sound if it's still active
        let inertiaInfo = null;
        if (this.activeTouches.has('mouse')) {
            inertiaInfo = this.stopTouchSound('mouse', 'mouse', e.clientX, e.clientY);
        } else {
        }

        this.markTouchIndicatorReleased('mouse', inertiaInfo);

    }
}

function readCssEnvSafeAreaInsets() {
    const probe = document.createElement('div');
    probe.setAttribute(
        'style',
        'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)'
    );
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const insets = {
        top: parseFloat(cs.paddingTop) || 0,
        right: parseFloat(cs.paddingRight) || 0,
        bottom: parseFloat(cs.paddingBottom) || 0,
        left: parseFloat(cs.paddingLeft) || 0
    };
    probe.remove();
    return insets;
}

function applySafeAreaInsets(insets) {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', `${insets.top}px`);
    root.style.setProperty('--safe-right', `${insets.right}px`);
    root.style.setProperty('--safe-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-left', `${insets.left}px`);
}

function mergeSafeAreaInsets(a, b) {
    return {
        top: Math.max(a.top, b.top),
        right: Math.max(a.right, b.right),
        bottom: Math.max(a.bottom, b.bottom),
        left: Math.max(a.left, b.left)
    };
}

async function fetchNativeSafeAreaInsets() {
    if (!isNativeCapacitor()) return null;
    try {
        const plugin = getGradatoneAudioSessionPlugin();
        if (!plugin || typeof plugin.getSafeAreaInsets !== 'function') return null;
        const result = await plugin.getSafeAreaInsets();
        return {
            top: Number(result.top) || 0,
            right: Number(result.right) || 0,
            bottom: Number(result.bottom) || 0,
            left: Number(result.left) || 0
        };
    } catch (e) {
        console.warn('getSafeAreaInsets:', e);
        return null;
    }
}

function onSafeAreaInsetsUpdated() {
    const app = window.__gradatone;
    if (!app) return;
    app.setupPitchLabels();
    app.drawGuideLines();
    app.refreshLayerControlPositions();
}

/** env(safe-area-inset-*) + ネイティブ inset を CSS 変数へ反映 */
function installSafeAreaInsets() {
    const update = async () => {
        let insets = readCssEnvSafeAreaInsets();

        if (isNativeCapacitor()) {
            const native = await fetchNativeSafeAreaInsets();
            if (native) {
                insets = mergeSafeAreaInsets(insets, native);
            }
        } else {
            const vv = window.visualViewport;
            if (vv) {
                insets = mergeSafeAreaInsets(insets, {
                    top: vv.offsetTop,
                    left: vv.offsetLeft,
                    right: Math.max(0, window.innerWidth - vv.width - vv.offsetLeft),
                    bottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
                });
            }
        }

        applySafeAreaInsets(insets);
        onSafeAreaInsetsUpdated();
    };

    void update();
    window.addEventListener('resize', () => void update());
    window.visualViewport?.addEventListener('resize', () => void update());
    window.visualViewport?.addEventListener('scroll', () => void update());
    window.addEventListener('gradatone-safe-area', () => void update());
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    installSafeAreaInsets();
    await waitForCapacitorBridge();

    if (isNativeCapacitor()) {
        const appPlugin = window.Capacitor?.Plugins?.App;
        if (appPlugin && typeof appPlugin.addListener === 'function') {
            appPlugin.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    void configureNativeAudioSession({ userGesture: false });
                    void fetchNativeSafeAreaInsets().then((native) => {
                        if (native) {
                            applySafeAreaInsets(
                                mergeSafeAreaInsets(readCssEnvSafeAreaInsets(), native)
                            );
                            onSafeAreaInsetsUpdated();
                        }
                    });
                } else {
                    disableIosSilentBypassAudio();
                }
            });
        }
    }

    new Gradatone();
    void maybeRequestAppReviewOnLaunch();
});

// Register Service Worker for PWA (not in Capacitor native shell)
if (!window.Capacitor && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {

                // Check for updates on every page load
                registration.update();

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            // Reload page to get latest version
                            window.location.reload();
                        }
                    });
                });
            })
            .catch(error => {
            });
    });
}
