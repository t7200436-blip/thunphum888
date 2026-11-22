/**
 * Treasures of Aztec (สาวถ้ำ) - Complete Game Engine (REA Optimized)
 * Pure Vanilla JavaScript implementation with Web Audio API Synthesizer
 * & PG Soft Live Trial Gateway Integration (Game ID: 87)
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const COLS = 6;
  const ROWS = 5;
  const BET_LEVELS = [2, 4, 6, 10, 12, 20, 40, 60, 100, 200, 500, 1000, 2000];
  const PG_LIVE_DEMO_URL = 'https://public.pg-demo.com/demo/?gi=87&lang=th';

  // SVG Artwork for Symbols
  const SYMBOLS = {
    wild: {
      id: 'wild',
      name: 'สาวถ้ำ (WILD)',
      isWild: true,
      payouts: { 3: 0, 4: 0, 5: 0, 6: 0 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <defs>
            <linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff4b8"/>
              <stop offset="50%" stop-color="#f5b027"/>
              <stop offset="100%" stop-color="#9e6c13"/>
            </linearGradient>
            <radialGradient id="gFace" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stop-color="#ffd599"/>
              <stop offset="70%" stop-color="#e09e67"/>
              <stop offset="100%" stop-color="#b26f39"/>
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="#2d170b" rx="8"/>
          <circle cx="50" cy="40" r="26" fill="url(#gFace)"/>
          <polygon points="20,32 32,10 50,22 68,10 80,32 66,35 50,26 34,35" fill="url(#gGold)" stroke="#d48806" stroke-width="2"/>
          <polygon points="50,15 54,21 50,27 46,21" fill="#e53935"/>
          <ellipse cx="41" cy="40" rx="3.5" ry="2.2" fill="#261710"/>
          <ellipse cx="59" cy="40" rx="3.5" ry="2.2" fill="#261710"/>
          <path d="M44,52 Q50,57 56,52" fill="none" stroke="#c62828" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="20,44 14,58 23,54" fill="#ffd54f"/>
          <polygon points="80,44 86,58 77,54" fill="#ffd54f"/>
          <rect x="3" y="3" width="94" height="94" rx="6" fill="none" stroke="url(#gGold)" stroke-width="5"/>
          <rect x="6" y="66" width="88" height="26" rx="4" fill="#1b0e06" stroke="#ffd54f" stroke-width="1.5"/>
          <text x="50" y="86" font-family="'Cinzel', 'Kanit', serif" font-size="22" font-weight="900" fill="url(#gGold)" stroke="#000" stroke-width="1" text-anchor="middle" letter-spacing="1">WILD</text>
        </svg>
      `
    },
    scatter: {
      id: 'scatter',
      name: 'ศิลาสุริยัน (SCATTER)',
      isScatter: true,
      payouts: { 3: 0, 4: 0, 5: 0, 6: 0 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <defs>
            <radialGradient id="gSun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff7043"/>
              <stop offset="60%" stop-color="#d84315"/>
              <stop offset="100%" stop-color="#3e1205"/>
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="#1a0d05" rx="8"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#f5b027" stroke-width="5"/>
          <circle cx="50" cy="50" r="34" fill="url(#gSun)"/>
          <polygon points="50,10 54,20 46,20" fill="#ffca28"/>
          <polygon points="50,90 54,80 46,80" fill="#ffca28"/>
          <polygon points="10,50 20,46 20,54" fill="#ffca28"/>
          <polygon points="90,50 80,46 80,54" fill="#ffca28"/>
          <circle cx="50" cy="50" r="14" fill="#d50000" stroke="#ffeb3b" stroke-width="2"/>
          <rect x="4" y="42" width="92" height="18" rx="3" fill="rgba(15, 6, 2, 0.9)" stroke="#ffd54f" stroke-width="1.2"/>
          <text x="50" y="55" font-family="'Cinzel', 'Kanit', serif" font-size="11" font-weight="900" fill="#ffeb3b" stroke="#000" stroke-width="0.8" text-anchor="middle" letter-spacing="1">SCATTER</text>
        </svg>
      `
    },
    mask_gold: {
      id: 'mask_gold',
      name: 'หน้ากากทองคำ',
      payouts: { 3: 30, 4: 40, 5: 60, 6: 80 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#2d1c08" rx="8"/>
          <path d="M18,22 Q50,14 82,22 L78,74 Q50,88 22,74 Z" fill="#f5b027" stroke="#ffd54f" stroke-width="3"/>
          <polygon points="26,20 36,8 50,16 64,8 74,20" fill="#ffca28"/>
          <circle cx="36" cy="40" r="9" fill="#1b120c" stroke="#ffe082" stroke-width="2"/>
          <circle cx="64" cy="40" r="9" fill="#1b120c" stroke="#ffe082" stroke-width="2"/>
          <circle cx="36" cy="40" r="4" fill="#ffd54f"/>
          <circle cx="64" cy="40" r="4" fill="#ffd54f"/>
          <rect x="32" y="60" width="36" height="12" rx="3" fill="#1b120c"/>
          <rect x="36" y="62" width="6" height="8" fill="#fff"/>
          <rect x="44" y="62" width="6" height="8" fill="#fff"/>
          <rect x="52" y="62" width="6" height="8" fill="#fff"/>
          <rect x="58" y="62" width="6" height="8" fill="#fff"/>
          <circle cx="15" cy="50" r="6" fill="#ffd54f"/>
          <circle cx="85" cy="50" r="6" fill="#ffd54f"/>
        </svg>
      `
    },
    mask_red: {
      id: 'mask_red',
      name: 'หน้ากากแดง',
      payouts: { 3: 20, 4: 25, 5: 50, 6: 70 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#2b0f0b" rx="8"/>
          <path d="M20,24 Q50,16 80,24 L76,76 Q50,88 24,76 Z" fill="#c62828" stroke="#ef5350" stroke-width="3"/>
          <polygon points="28,22 38,10 50,18 62,10 72,22" fill="#ffd54f"/>
          <circle cx="37" cy="42" r="8" fill="#ffd54f"/>
          <circle cx="63" cy="42" r="8" fill="#ffd54f"/>
          <circle cx="37" cy="42" r="4" fill="#000"/>
          <circle cx="63" cy="42" r="4" fill="#000"/>
          <rect x="34" y="62" width="32" height="10" rx="3" fill="#1a0a07"/>
          <circle cx="16" cy="50" r="5" fill="#f5b027"/>
          <circle cx="84" cy="50" r="5" fill="#f5b027"/>
        </svg>
      `
    },
    pink_dragon: {
      id: 'pink_dragon',
      name: 'มังกรชมพู',
      payouts: { 3: 10, 4: 25, 5: 40, 6: 60 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#27122a" rx="8"/>
          <path d="M22,66 C15,40 38,20 62,20 C78,20 86,34 82,52 Z" fill="#ad1457" stroke="#ec407a" stroke-width="3"/>
          <circle cx="48" cy="44" r="8" fill="#ffeb3b"/>
          <circle cx="48" cy="44" r="4" fill="#211"/>
          <polygon points="76,46 88,40 82,54" fill="#ff80ab"/>
          <path d="M24,42 Q15,30 25,20 Q35,30 28,42" fill="#ffd54f"/>
        </svg>
      `
    },
    purple_totem: {
      id: 'purple_totem',
      name: 'อสูรม่วง',
      payouts: { 3: 8, 4: 15, 5: 20, 6: 30 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#1b1226" rx="8"/>
          <path d="M25,65 L45,30 L75,30 L68,70 Z" fill="#6a1b9a" stroke="#ab47bc" stroke-width="3"/>
          <circle cx="45" cy="44" r="7" fill="#80d8ff"/>
          <circle cx="65" cy="44" r="7" fill="#80d8ff"/>
          <rect x="42" y="58" width="22" height="6" fill="#ffd54f"/>
        </svg>
      `
    },
    green_totem: {
      id: 'green_totem',
      name: 'หยกเขียว',
      payouts: { 3: 6, 4: 10, 5: 12, 6: 15 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#11241a" rx="8"/>
          <path d="M24,34 Q38,18 50,30 Q62,18 76,34 L72,74 Z" fill="#2e7d32" stroke="#66bb6a" stroke-width="3"/>
          <circle cx="38" cy="48" r="6" fill="#ffd54f"/>
          <circle cx="62" cy="48" r="6" fill="#ffd54f"/>
          <polygon points="50,56 46,66 54,66" fill="#a5d6a7"/>
        </svg>
      `
    },
    blue_disc: {
      id: 'blue_disc',
      name: 'กงล้อหินฟ้า',
      payouts: { 3: 6, 4: 10, 5: 12, 6: 15 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#102029" rx="8"/>
          <circle cx="50" cy="50" r="38" fill="#37474f" stroke="#78909c" stroke-width="3"/>
          <circle cx="50" cy="50" r="24" fill="#0277bd" stroke="#4fc3f7" stroke-width="2"/>
          <rect x="46" y="20" width="8" height="60" fill="#263238"/>
          <rect x="20" y="46" width="60" height="8" fill="#263238"/>
          <circle cx="50" cy="50" r="10" fill="#81d4fa"/>
        </svg>
      `
    },
    card_A: {
      id: 'card_A',
      name: 'A',
      payouts: { 3: 4, 4: 6, 5: 8, 6: 10 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#36221c" rx="8"/>
          <text x="50" y="73" font-family="'Cinzel', serif" font-size="64" font-weight="900" fill="#d7ccc8" stroke="#5d4037" stroke-width="2" text-anchor="middle">A</text>
        </svg>
      `
    },
    card_K: {
      id: 'card_K',
      name: 'K',
      payouts: { 3: 4, 4: 6, 5: 8, 6: 10 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#2e1a17" rx="8"/>
          <text x="50" y="73" font-family="'Cinzel', serif" font-size="64" font-weight="900" fill="#bcaaa4" stroke="#4e342e" stroke-width="2" text-anchor="middle">K</text>
        </svg>
      `
    },
    card_Q: {
      id: 'card_Q',
      name: 'Q',
      payouts: { 3: 1, 4: 2, 5: 3, 6: 4 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#2a162e" rx="8"/>
          <text x="50" y="73" font-family="'Cinzel', serif" font-size="64" font-weight="900" fill="#ce93d8" stroke="#6a1b9a" stroke-width="2" text-anchor="middle">Q</text>
        </svg>
      `
    },
    card_J: {
      id: 'card_J',
      name: 'J',
      payouts: { 3: 1, 4: 2, 5: 3, 6: 4 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#1c262b" rx="8"/>
          <text x="50" y="73" font-family="'Cinzel', serif" font-size="64" font-weight="900" fill="#90a4ae" stroke="#37474f" stroke-width="2" text-anchor="middle">J</text>
        </svg>
      `
    },
    card_10: {
      id: 'card_10',
      name: '10',
      payouts: { 3: 1, 4: 2, 5: 3, 6: 4 },
      svg: `
        <svg viewBox="0 0 100 100" class="sym-svg">
          <rect width="100" height="100" fill="#1b291d" rx="8"/>
          <text x="50" y="73" font-family="'Cinzel', serif" font-size="52" font-weight="900" fill="#a5d6a7" stroke="#2e7d32" stroke-width="2" text-anchor="middle">10</text>
        </svg>
      `
    }
  };

  const PAYING_KEYS = [
    'mask_gold', 'mask_red', 'pink_dragon', 'purple_totem',
    'green_totem', 'blue_disc', 'card_A', 'card_K', 'card_Q', 'card_J', 'card_10'
  ];

  // Sound Synthesizer via Web Audio API
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.1) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fallback
      }
    }

    click() {
      this.playTone(600, 'triangle', 0.04, 0.08);
    }

    spin() {
      this.playTone(220, 'triangle', 0.18, 0.15);
    }

    drop() {
      this.playTone(140, 'triangle', 0.08, 0.22);
    }

    win() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.12, 0.14), i * 45);
      });
    }

    shatter() {
      this.playTone(320, 'square', 0.09, 0.15);
      setTimeout(() => this.playTone(700, 'sawtooth', 0.08, 0.09), 35);
    }

    multiplierUp() {
      [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.15, 0.18), i * 60);
      });
    }

    freeSpinsTrigger() {
      [261, 329, 392, 523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.2, 0.2), i * 65);
      });
    }

    doorOpen() {
      [180, 220, 260, 310, 440].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.15), i * 65);
      });
    }
  }

  const sound = new SoundManager();

  // --- Game State ---
  const state = {
    balance: Number(localStorage.getItem('balance')) || 50000.0,
    bet: 12.0,
    multiplier: 1,
    isSpinning: false,
    isTurbo: false,
    isAuto: false,
    autoRemaining: 0,
    inFreeSpins: false,
    freeSpinsRemaining: 0,
    freeSpinsTotalWin: 0,
    currentRoundWin: 0,
    grid: [],
    topReel: [],
    forceScatterCount: 0,
    isLiveMode: false
  };

  // Helper: Get random symbol
  function getRandomSymbol(allowSpecial = true) {
    const r = Math.random();
    if (allowSpecial && r < 0.04) return SYMBOLS.scatter;
    if (allowSpecial && r < 0.08) return SYMBOLS.wild;
    if (r < 0.16) return SYMBOLS.mask_gold;
    if (r < 0.26) return SYMBOLS.mask_red;
    if (r < 0.38) return SYMBOLS.pink_dragon;
    if (r < 0.50) return SYMBOLS.purple_totem;
    if (r < 0.62) return SYMBOLS.green_totem;
    if (r < 0.74) return SYMBOLS.blue_disc;
    if (r < 0.82) return SYMBOLS.card_A;
    if (r < 0.89) return SYMBOLS.card_K;
    if (r < 0.94) return SYMBOLS.card_Q;
    if (r < 0.97) return SYMBOLS.card_J;
    return SYMBOLS.card_10;
  }

  // Helper: Create tile object
  function createTile(c, r, sym = null, frame = null) {
    const s = sym || getRandomSymbol(true);
    let fr = frame;
    if (fr === null && c >= 1 && c <= 4 && !s.isWild && !s.isScatter && Math.random() < 0.14) {
      fr = 'silver';
    }
    return {
      uid: `tile_${c}_${r}_${Math.random().toString(36).substr(2, 7)}`,
      sym: s,
      frame: fr,
      isWinning: false,
      isExploding: false,
      isNew: false
    };
  }

  // Initialize Grid & Top Reel
  function initGrid() {
    state.grid = [];
    for (let c = 0; c < COLS; c++) {
      state.grid[c] = [];
      for (let r = 0; r < ROWS; r++) {
        state.grid[c][r] = createTile(c, r);
      }
    }
    state.topReel = [
      getRandomSymbol(false),
      getRandomSymbol(false),
      getRandomSymbol(false),
      getRandomSymbol(false)
    ];
  }

  // --- DOM Elements ---
  const el = {
    screenIntro: document.getElementById('screenIntro'),
    screenGame: document.getElementById('screenGame'),
    liveDemoFrame: document.getElementById('liveDemoFrame'),
    btnStart: document.getElementById('btnStart'),
    btnHome: document.getElementById('btnHome'),
    btnSound: document.getElementById('btnSound'),
    btnPaytable: document.getElementById('btnPaytable'),
    btnLiveMode: document.getElementById('btnLiveMode'),
    btnTurboTop: document.getElementById('btnTurboTop'),
    waysText: document.getElementById('waysText'),
    fsBanner: document.getElementById('fsBanner'),
    fsCountText: document.getElementById('fsCountText'),
    topCarousel: document.getElementById('topCarousel'),
    mainGrid: document.getElementById('mainGrid'),
    toastWin: document.getElementById('toastWin'),
    multiplierText: document.getElementById('multiplierText'),
    balanceVal: document.getElementById('balanceVal'),
    winVal: document.getElementById('winVal'),
    betVal: document.getElementById('betVal'),
    btnBuyFeature: document.getElementById('btnBuyFeature'),
    buyPriceText: document.getElementById('buyPriceText'),
    buyPriceConfirm: document.getElementById('buyPriceConfirm'),
    btnBetMinus: document.getElementById('btnBetMinus'),
    btnSpin: document.getElementById('btnSpin'),
    btnBetPlus: document.getElementById('btnBetPlus'),
    btnAuto: document.getElementById('btnAuto'),
    btnTurboBottom: document.getElementById('btnTurboBottom'),
    modalBuy: document.getElementById('modalBuy'),
    btnBuyConfirm: document.getElementById('btnBuyConfirm'),
    btnBuyCancel: document.getElementById('btnBuyCancel'),
    modalAuto: document.getElementById('modalAuto'),
    autoOptions: document.getElementById('autoOptions'),
    btnAutoCancel: document.getElementById('btnAutoCancel'),
    modalPaytable: document.getElementById('modalPaytable'),
    btnPaytableClose: document.getElementById('btnPaytableClose'),
    modalBigWin: document.getElementById('modalBigWin'),
    bigWinTitle: document.getElementById('bigWinTitle'),
    bigWinScore: document.getElementById('bigWinScore'),
    btnBigWinCollect: document.getElementById('btnBigWinCollect')
  };

  // Render Grid in DOM
  function renderGrid() {
    el.topCarousel.innerHTML = `
      <div class="carousel-spacer"></div>
      ${state.topReel.map((sym, idx) => `
        <div class="top-slot" id="top_slot_${idx}">
          <div class="sym-icon-wrapper">${sym.svg}</div>
        </div>
      `).join('')}
      <div class="carousel-spacer"></div>
    `;

    el.mainGrid.innerHTML = state.grid.map((col, c) => `
      <div class="grid-col" id="col_${c}">
        <div class="col-strip ${state.isSpinning ? 'spinning' : ''}">
          ${col.map((tile, r) => `
            <div class="tile-slot ${tile.frame ? 'frame-' + tile.frame : ''} ${tile.isWinning ? 'winning' : ''} ${tile.isExploding ? 'explode' : ''} ${tile.isNew ? 'drop-in' : ''}" id="tile_${c}_${r}">
              <div class="sym-icon-wrapper">${tile.sym.svg}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const ways = state.grid.reduce((acc, col, idx) => {
      const colLen = col.length + (idx >= 1 && idx <= 4 ? 1 : 0);
      return acc * (colLen || 1);
    }, 1);
    el.waysText.textContent = `${ways.toLocaleString()} WAYS`;
  }

  // Update UI Meters
  function updateMeters() {
    localStorage.setItem('balance', state.balance);
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'UPDATE_BALANCE', balance: state.balance }, '*');
      }
    } catch (e) {}

    const topHudBal = document.getElementById('aztecBalanceVal');
    if (topHudBal) {
      topHudBal.textContent = state.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' THB';
    }

    if (el.balanceVal) el.balanceVal.textContent = state.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (el.winVal) el.winVal.textContent = state.currentRoundWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (el.betVal) el.betVal.textContent = state.bet.toFixed(2);
    if (el.multiplierText) el.multiplierText.textContent = `x ${state.multiplier}`;
    const buyPrice = (state.bet * 75).toFixed(2);
    if (el.buyPriceText) el.buyPriceText.textContent = buyPrice;
    if (el.buyPriceConfirm) el.buyPriceConfirm.textContent = buyPrice;

    if (state.inFreeSpins) {
      el.screenGame.classList.add('free-spins-active');
      el.fsCountText.textContent = state.freeSpinsRemaining;
      el.btnBuyFeature.classList.add('disabled');
    } else {
      el.screenGame.classList.remove('free-spins-active');
      el.btnBuyFeature.classList.remove('disabled');
    }

    if (state.isAuto) {
      el.btnAuto.classList.add('active');
    } else {
      el.btnAuto.classList.remove('active');
    }

    if (state.isTurbo) {
      el.btnTurboTop.classList.add('active');
      el.btnTurboBottom.classList.add('active');
    } else {
      el.btnTurboTop.classList.remove('active');
      el.btnTurboBottom.classList.remove('active');
    }
  }

  // Show Toast
  let toastTimer = null;
  function showToast(text, duration = 1800) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toastWin.textContent = text;
    el.toastWin.classList.add('show');
    toastTimer = setTimeout(() => {
      el.toastWin.classList.remove('show');
    }, duration);
  }

  // Evaluate Wins on Grid
  function evaluateWins() {
    const matchKeys = new Set();
    let totalWinVal = 0;
    const winDetails = [];

    PAYING_KEYS.forEach(key => {
      const targetSym = SYMBOLS[key];
      const colHits = [];

      for (let c = 0; c < COLS; c++) {
        let count = 0;
        for (let r = 0; r < state.grid[c].length; r++) {
          const s = state.grid[c][r].sym;
          if (s.id === targetSym.id || s.isWild) {
            count++;
          }
        }
        if (c >= 1 && c <= 4) {
          const topSym = state.topReel[c - 1];
          if (topSym && (topSym.id === targetSym.id || topSym.isWild)) {
            count++;
          }
        }

        if (count > 0) {
          colHits.push(count);
        } else {
          break;
        }
      }

      if (colHits.length >= 3) {
        matchKeys.add(targetSym.id);
        const totalWays = colHits.reduce((acc, v) => acc * v, 1);
        const rate = targetSym.payouts[colHits.length] || 1;
        const win = rate * totalWays * (state.bet / 20);
        totalWinVal += win;
        winDetails.push(`${targetSym.name} x${colHits.length}`);
      }
    });

    return { matchKeys, totalWinVal, winDetails };
  }

  // Count Scatters on Grid
  function countScatters() {
    let scatters = 0;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < state.grid[c].length; r++) {
        if (state.grid[c][r].sym.isScatter) scatters++;
      }
    }
    return scatters;
  }

  // Cascading Process
  function runCascadeStep() {
    const { matchKeys, totalWinVal, winDetails } = evaluateWins();

    if (matchKeys.size > 0 && totalWinVal > 0) {
      sound.win();
      const stepPayout = totalWinVal * state.multiplier;
      state.currentRoundWin += stepPayout;
      state.balance += stepPayout;
      updateMeters();

      showToast(`+฿${stepPayout.toFixed(2)} (${winDetails.slice(0, 2).join(', ')})`);

      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < state.grid[c].length; r++) {
          const tile = state.grid[c][r];
          if (matchKeys.has(tile.sym.id) || tile.sym.isWild) {
            tile.isWinning = true;
          }
        }
      }
      renderGrid();

      const delay = state.isTurbo ? 280 : 580;

      setTimeout(() => {
        sound.shatter();

        for (let c = 0; c < COLS; c++) {
          const nextCol = [];
          for (let r = 0; r < state.grid[c].length; r++) {
            const tile = state.grid[c][r];
            const isMatch = matchKeys.has(tile.sym.id) || tile.sym.isWild;

            if (isMatch) {
              if (tile.frame === 'silver') {
                nextCol.push({
                  uid: `tile_${c}_${r}_${Math.random().toString(36).substr(2, 7)}`,
                  sym: getRandomSymbol(false),
                  frame: 'gold'
                });
              } else if (tile.frame === 'gold') {
                nextCol.push({
                  uid: `tile_${c}_${r}_${Math.random().toString(36).substr(2, 7)}`,
                  sym: SYMBOLS.wild,
                  frame: null
                });
              }
            } else {
              nextCol.push(tile);
            }
          }

          while (nextCol.length < ROWS) {
            nextCol.unshift({
              uid: `tile_${c}_drop_${Math.random().toString(36).substr(2, 7)}`,
              sym: getRandomSymbol(true),
              frame: (c >= 1 && c <= 4 && Math.random() < 0.12) ? 'silver' : null,
              isNew: true
            });
          }
          state.grid[c] = nextCol;
        }

        state.topReel = state.topReel.map(sym => {
          if (matchKeys.has(sym.id) || sym.isWild) {
            return getRandomSymbol(false);
          }
          return sym;
        });

        const multStep = state.inFreeSpins ? 2 : 1;
        state.multiplier += multStep;
        sound.multiplierUp();
        el.multiplierText.classList.add('bump');
        setTimeout(() => el.multiplierText.classList.remove('bump'), 400);

        renderGrid();
        updateMeters();

        setTimeout(() => {
          runCascadeStep();
        }, state.isTurbo ? 240 : 480);

      }, delay);

    } else {
      onCascadeEnd();
    }
  }

  // After all cascades finished
  function onCascadeEnd() {
    renderGrid();
    updateMeters();

    const scatterHits = countScatters();
    if (scatterHits >= 4 && !state.inFreeSpins) {
      const awardedSpins = 10 + (scatterHits - 4) * 2;
      sound.freeSpinsTrigger();
      showToast(`⭐ ได้รับฟรีสปิน ${awardedSpins} ครั้ง! ⭐`, 3000);
      setTimeout(() => {
        startFreeSpins(awardedSpins);
      }, 1000);
      return;
    }

    if (state.currentRoundWin >= state.bet * 15) {
      showBigWin(state.currentRoundWin);
      return;
    }

    finishSpinRound();
  }

  // Finish Spin Round & Handle Auto/Free Spins Progression
  function finishSpinRound() {
    state.isSpinning = false;
    el.btnSpin.disabled = false;
    el.btnSpin.classList.remove('spinning');

    if (state.inFreeSpins) {
      state.freeSpinsRemaining--;
      state.freeSpinsTotalWin += state.currentRoundWin;
      updateMeters();

      if (state.freeSpinsRemaining > 0) {
        setTimeout(doSpin, state.isTurbo ? 350 : 850);
        return;
      } else {
        state.inFreeSpins = false;
        showToast(`จบรอบฟรีสปิน! รวมชนะ ฿${state.freeSpinsTotalWin.toFixed(2)}`, 3500);
        updateMeters();
      }
    }

    if (state.isAuto) {
      state.autoRemaining--;
      if (state.autoRemaining <= 0 || state.balance < state.bet) {
        state.isAuto = false;
        updateMeters();
      } else {
        setTimeout(doSpin, state.isTurbo ? 300 : 750);
      }
    }
  }

  // Core Spin Action
  function doSpin() {
    if (state.isSpinning) return;

    if (!state.inFreeSpins) {
      if (state.balance < state.bet) {
        alert('ยอดเงินคงเหลือไม่เพียงพอ กรุณาลดเบทหรือเติมเครดิต');
        state.isAuto = false;
        updateMeters();
        return;
      }
      state.balance -= state.bet;
      state.multiplier = 1;
    }

    state.isSpinning = true;
    state.currentRoundWin = 0;
    el.btnSpin.disabled = true;
    el.btnSpin.classList.add('spinning');
    updateMeters();
    sound.spin();

    renderGrid();

    const spinDuration = state.isTurbo ? 220 : 520;

    setTimeout(() => {
      sound.drop();

      for (let c = 0; c < COLS; c++) {
        state.grid[c] = [];
        for (let r = 0; r < ROWS; r++) {
          state.grid[c][r] = createTile(c, r);
        }
      }

      if (state.forceScatterCount >= 4) {
        const scatterCols = [0, 2, 4, 5];
        scatterCols.forEach(colIdx => {
          const rowIdx = Math.floor(Math.random() * ROWS);
          state.grid[colIdx][rowIdx] = createTile(colIdx, rowIdx, SYMBOLS.scatter, null);
        });
        state.forceScatterCount = 0;
      }

      state.topReel = [
        getRandomSymbol(false),
        getRandomSymbol(false),
        getRandomSymbol(false),
        getRandomSymbol(false)
      ];

      renderGrid();
      runCascadeStep();

    }, spinDuration);
  }

  // Trigger Free Spins
  function startFreeSpins(spinsCount) {
    state.inFreeSpins = true;
    state.freeSpinsRemaining = spinsCount;
    state.freeSpinsTotalWin = 0;
    state.multiplier = 2;
    updateMeters();
    setTimeout(doSpin, 800);
  }

  // Big Win Modal
  function showBigWin(amount) {
    let title = 'BIG WIN!';
    if (amount >= state.bet * 50) title = 'SUPER MEGA WIN!';
    else if (amount >= state.bet * 30) title = 'MEGA WIN!';

    el.bigWinTitle.textContent = title;
    el.bigWinScore.textContent = '0.00';
    el.modalBigWin.classList.add('show');
    sound.freeSpinsTrigger();

    let current = 0;
    const step = amount / 30;
    const interval = setInterval(() => {
      current = Math.min(amount, current + step);
      el.bigWinScore.textContent = current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      sound.playTone(400 + (current / amount) * 400, 'sine', 0.04, 0.05);
      if (current >= amount) {
        clearInterval(interval);
      }
    }, 40);
  }

  // Change Bet
  function changeBet(step) {
    if (state.isSpinning) return;
    const idx = BET_LEVELS.indexOf(state.bet);
    if (idx !== -1) {
      const nextIdx = Math.max(0, Math.min(BET_LEVELS.length - 1, idx + step));
      state.bet = BET_LEVELS[nextIdx];
    } else {
      state.bet = Math.max(2, state.bet + step * 2);
    }
    sound.click();
    updateMeters();
  }

  // Toggle Live PG Demo Mode
  function toggleLiveMode() {
    state.isLiveMode = !state.isLiveMode;
    sound.click();
    if (state.isLiveMode) {
      if (!el.liveDemoFrame.src || el.liveDemoFrame.src === 'about:blank') {
        el.liveDemoFrame.src = PG_LIVE_DEMO_URL;
      }
      el.liveDemoFrame.classList.add('active');
      el.btnLiveMode.classList.add('live');
      el.btnLiveMode.textContent = '🎮 Clone';
      el.btnLiveMode.title = 'สลับกลับโหมด Clone Engine';
    } else {
      el.liveDemoFrame.classList.remove('active');
      el.btnLiveMode.classList.remove('live');
      el.btnLiveMode.textContent = '🌐 Live PG';
      el.btnLiveMode.title = 'สลับโหมด: เล่น Live PG Demo จริง';
    }
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    el.btnStart.addEventListener('click', () => {
      sound.doorOpen();
      el.screenIntro.classList.add('hidden');
    });

    el.btnHome.addEventListener('click', () => {
      sound.click();
      el.screenIntro.classList.remove('hidden');
    });

    el.btnLiveMode.addEventListener('click', toggleLiveMode);

    el.btnSound.addEventListener('click', () => {
      sound.isMuted = !sound.isMuted;
      el.btnSound.textContent = sound.isMuted ? '🔇' : '🔊';
      if (!sound.isMuted) sound.click();
    });

    const toggleTurbo = () => {
      state.isTurbo = !state.isTurbo;
      sound.click();
      updateMeters();
    };
    el.btnTurboTop.addEventListener('click', toggleTurbo);
    el.btnTurboBottom.addEventListener('click', toggleTurbo);

    el.btnBetMinus.addEventListener('click', () => changeBet(-1));
    el.btnBetPlus.addEventListener('click', () => changeBet(1));

    el.btnSpin.addEventListener('click', () => {
      if (!state.isSpinning) doSpin();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && el.screenIntro.classList.contains('hidden')) {
        e.preventDefault();
        if (!state.isSpinning) doSpin();
      }
    });

    el.btnAuto.addEventListener('click', () => {
      if (state.isAuto) {
        state.isAuto = false;
        state.autoRemaining = 0;
        updateMeters();
        sound.click();
      } else {
        sound.click();
        el.modalAuto.classList.add('show');
      }
    });

    el.autoOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.auto-option-btn');
      if (btn) {
        const count = parseInt(btn.dataset.spins, 10);
        state.isAuto = true;
        state.autoRemaining = count;
        el.modalAuto.classList.remove('show');
        sound.click();
        updateMeters();
        if (!state.isSpinning) doSpin();
      }
    });

    el.btnAutoCancel.addEventListener('click', () => {
      sound.click();
      el.modalAuto.classList.remove('show');
    });

    el.btnBuyFeature.addEventListener('click', () => {
      if (state.isSpinning || state.inFreeSpins) return;
      sound.click();
      el.modalBuy.classList.add('show');
    });

    el.btnBuyConfirm.addEventListener('click', () => {
      const price = state.bet * 75;
      if (state.balance < price) {
        alert('ยอดเงินคงเหลือไม่พอสำหรับซื้อฟีเจอร์ฟรีสปิน');
        el.modalBuy.classList.remove('show');
        return;
      }
      state.balance -= price;
      state.forceScatterCount = 4;
      el.modalBuy.classList.remove('show');
      sound.freeSpinsTrigger();
      updateMeters();
      doSpin();
    });

    el.btnBuyCancel.addEventListener('click', () => {
      sound.click();
      el.modalBuy.classList.remove('show');
    });

    el.btnPaytable.addEventListener('click', () => {
      sound.click();
      el.modalPaytable.classList.add('show');
    });

    el.btnPaytableClose.addEventListener('click', () => {
      sound.click();
      el.modalPaytable.classList.remove('show');
    });

    el.btnBigWinCollect.addEventListener('click', () => {
      sound.click();
      el.modalBigWin.classList.remove('show');
      finishSpinRound();
    });

    // --- Bi-directional Wallet Synchronization ---
    window.addEventListener('storage', (e) => {
      if (e.key === 'balance' && e.newValue !== null) {
        state.balance = Number(e.newValue);
        updateMeters();
      }
    });

    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && typeof data === 'object') {
          if (typeof data.balance === 'number') {
            state.balance = Number(data.balance);
            updateMeters();
          } else if (typeof data.credit === 'number') {
            state.balance = Number(data.credit);
            updateMeters();
          } else if (data.type === 'balance_update' && typeof data.amount === 'number') {
            state.balance += Number(data.amount);
            updateMeters();
          }
        }
      } catch (err) {}
    });

    window.updateAztecBalance = function(newBal) {
      state.balance = Number(newBal);
      updateMeters();
    };

    // Clicking in-game or top-bar wallet allows instant top-up
    const handleWalletClick = () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'OPEN_WALLET' }, '*');
          return;
        }
      } catch (e) {}
      const add = prompt('ระบุจำนวนเงินที่ต้องการเติม (THB):', '50000');
      if (add && !isNaN(add) && Number(add) > 0) {
        state.balance += Number(add);
        updateMeters();
      }
    };

    const balPill = document.getElementById('balancePill');
    if (balPill) balPill.addEventListener('click', handleWalletClick);

    const topWalletPill = document.getElementById('aztecWalletPill');
    if (topWalletPill) topWalletPill.addEventListener('click', handleWalletClick);

    // Back to Lobby button
    const btnBack = document.querySelector('.play-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'EXIT_GAME' }, '*');
            return;
          }
        } catch (e) {}
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'index.html';
        }
      });
    }
  }

  function start() {
    initGrid();
    setupEventListeners();
    renderGrid();
    updateMeters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
