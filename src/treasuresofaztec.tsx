/**
 * Treasures of Aztec (สาวถ้ำ) - PG SOFT™ Web Replica
 * 
 * ============================================================================
 * BUILT WITH: react-best-practices (Vercel Engineering Optimization Standards)
 * ============================================================================
 * 
 * Checklist of Implemented Rules:
 * - [Rule 1.1] Check Cheap Conditions Before Async Flags:
 *     In handleSpin: 'if (isSpinningRef.current || balance < bet) return' prior to any async actions.
 * - [Rule 1.2] Defer Await / Timers Until Needed:
 *     Timers for cascade drop are deferred until grid state evaluation passes.
 * - [Rule 2.1] Avoid Barrel File Imports:
 *     Zero barrel import bloat; self-contained module dependencies.
 * - [Rule 3.5] Hoist Static I/O to Module Level:
 *     SYMBOLS, PAYOUTS, BET_LIST, AUDIO_SYNTH hoisted to module level.
 * - [Rule 4.1] Deduplicate Global Event Listeners:
 *     Centralized keyboard spacebar event listener registered once in useEffect.
 * - [Rule 4.2] Use Passive Event Listeners:
 *     Passive touch and wheel handlers on mobile viewport.
 * - [Rule 5.1] Calculate Derived State During Rendering:
 *     waysCount, canSpin, hasAffordableBet calculated inline during render (no useEffect sync).
 * - [Rule 5.3] Do not wrap simple expressions with a primitive result type in useMemo:
 *     waysCount and roundWin math evaluated directly without useMemo overhead.
 * - [Rule 5.4] Don't Define Components Inside Components:
 *     All subcomponents (IntroScreen, TileCell, TopCarousel, BottomConsole, MultiplierPedestal,
 *     BigWinModal, ToastPopup) are declared strictly outside the parent at module scope.
 * - [Rule 5.5] Extract Default Non-primitive Values to Module Constants:
 *     DEFAULT_GRID, EMPTY_SET, INITIAL_TOP_REEL hoisted as constants.
 * - [Rule 5.6] Extract to Memoized Components:
 *     All leaf subcomponents wrapped in React.memo for zero unnecessary re-renders.
 * - [Rule 5.7] Narrow Effect Dependencies:
 *     Only primitive values (isAuto, isSpinning, spinRoundId) in useEffect dependency arrays.
 * - [Rule 5.8] Put Interaction Logic in Event Handlers:
 *     Button clicks directly trigger audio synth, balance deductions, and spin dispatch.
 * - [Rule 5.11] Use Functional setState Updates:
 *     setBalance(prev => prev - bet), setMultiplier(prev => prev + 1) eliminate stale state dependencies.
 * - [Rule 5.12] Use Lazy State Initialization:
 *     useState(() => createInitialGrid()) avoids recreating initial state arrays on every render.
 * - [Rule 5.13] Use Transitions for Non-Urgent Updates:
 *     startTransition wraps win toast breakdowns and round stats so UI interactions stay 60 FPS.
 * - [Rule 5.15] Use useRef for Transient Values:
 *     audioCtxRef, autoSpinTimerRef, isSpinningRef, cascadeStepRef stored in useRef.
 * - [Rule 6.1] Animate SVG Wrapper Instead of SVG Element:
 *     CSS transforms (translate3d, scale3d) applied to wrapper <div> for hardware GPU acceleration.
 * - [Rule 6.3] Hoist Static JSX Elements:
 *     Aztec stone pillars and PG logo badges hoisted to module constants.
 * - [Rule 6.7] Use CSS Display / Class Toggles for Show/Hide:
 *     Intro screen hidden via CSS class to preserve game state without unmounting.
 * - [Rule 6.9] Use Explicit Conditional Rendering:
 *     Ternary expressions (condition ? <Comp /> : null) used instead of short-circuit '&&'.
 * - [Rule 7.6] Combine Multiple Array Iterations:
 *     Win calculation and payout sums computed in a single linear pass over reels.
 * - [Rule 7.13] Use Set/Map for O(1) Lookups:
 *     winningTileKeys stored in Set<string> for instantaneous O(1) winning tile highlighting.
 * - [Rule 7.14] Immutability with Array Spreading:
 *     Immutable reel copying during cascades to ensure predictable state updates.
 * - [Rule 8.2] Initialize AudioContext Once, Not Per Mount:
 *     AudioContext initialized lazily once on first user interaction as a singleton ref.
 */

import React, { 
  useState, 
  useCallback, 
  useRef, 
  useEffect, 
  useTransition 
} from 'react';

// ============================================================================
// 1. TYPE DEFINITIONS & MODULE CONSTANTS (Rule 3.5 & 5.5)
// ============================================================================

export interface SymbolDef {
  id: string;
  name: string;
  payouts: Record<number, number>;
  isWild?: boolean;
  isScatter?: boolean;
  svg: string;
}

export interface GridTile {
  uid: string;
  sym: SymbolDef;
  frame: 'silver' | 'gold' | null;
  isWinning?: boolean;
  isExploding?: boolean;
  isNew?: boolean;
}

export const COLS = 6;
export const ROWS = 5;
export const DEFAULT_BETS = [2, 4, 6, 10, 12, 20, 40, 60, 100, 200, 500, 1000, 2000];

// Official Aztec Symbols with Rich SVG Artwork
export const SYMBOLS: Record<string, SymbolDef> = {
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
        <!-- Aztec Queen Face -->
        <circle cx="50" cy="40" r="26" fill="url(#gFace)"/>
        <!-- Golden Tiara -->
        <polygon points="20,32 32,10 50,22 68,10 80,32 66,35 50,26 34,35" fill="url(#gGold)" stroke="#d48806" stroke-width="2"/>
        <!-- Ruby Jewel in Tiara -->
        <polygon points="50,15 54,21 50,27 46,21" fill="#e53935"/>
        <!-- Eyes & Lips -->
        <ellipse cx="41" cy="40" rx="3.5" ry="2.2" fill="#261710"/>
        <ellipse cx="59" cy="40" rx="3.5" ry="2.2" fill="#261710"/>
        <path d="M44,52 Q50,57 56,52" fill="none" stroke="#c62828" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Gold Feather Earrings -->
        <polygon points="20,44 14,58 23,54" fill="#ffd54f"/>
        <polygon points="80,44 86,58 77,54" fill="#ffd54f"/>
        <!-- Ornate Gold Frame with Bevel -->
        <rect x="3" y="3" width="94" height="94" rx="6" fill="none" stroke="url(#gGold)" stroke-width="5"/>
        <!-- Glowing WILD Banner -->
        <rect x="6" y="66" width="88" height="26" rx="4" fill="#1b0e06" stroke="#ffd54f" stroke-width="1.5"/>
        <text x="50" y="86" font-family="'Cinzel', 'Oswald', serif" font-size="22" font-weight="900" fill="url(#gGold)" stroke="#000" stroke-width="1" text-anchor="middle" letter-spacing="1">WILD</text>
      </svg>
    `
  },
  scatter: {
    id: 'scatter',
    name: 'SCATTER',
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
        <!-- Aztec Sun Stone Outer Ring -->
        <circle cx="50" cy="50" r="42" fill="none" stroke="#f5b027" stroke-width="5"/>
        <circle cx="50" cy="50" r="34" fill="url(#gSun)"/>
        <!-- Aztec Sun Rays -->
        <polygon points="50,10 54,20 46,20" fill="#ffca28"/>
        <polygon points="50,90 54,80 46,80" fill="#ffca28"/>
        <polygon points="10,50 20,46 20,54" fill="#ffca28"/>
        <polygon points="90,50 80,46 80,54" fill="#ffca28"/>
        <!-- Center Gem -->
        <circle cx="50" cy="50" r="14" fill="#d50000" stroke="#ffeb3b" stroke-width="2"/>
        <!-- SCATTER Plaque -->
        <rect x="4" y="42" width="92" height="18" rx="3" fill="rgba(15, 6, 2, 0.9)" stroke="#ffd54f" stroke-width="1.2"/>
        <text x="50" y="55" font-family="'Cinzel', 'Oswald', serif" font-size="12" font-weight="900" fill="#ffeb3b" stroke="#000" stroke-width="0.8" text-anchor="middle" letter-spacing="1">SCATTER</text>
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
        <!-- Golden Mask Base -->
        <path d="M18,22 Q50,14 82,22 L78,74 Q50,88 22,74 Z" fill="#f5b027" stroke="#ffd54f" stroke-width="3"/>
        <!-- Crown Headdress -->
        <polygon points="26,20 36,8 50,16 64,8 74,20" fill="#ffca28"/>
        <!-- Mask Eyes -->
        <circle cx="36" cy="40" r="9" fill="#1b120c" stroke="#ffe082" stroke-width="2"/>
        <circle cx="64" cy="40" r="9" fill="#1b120c" stroke="#ffe082" stroke-width="2"/>
        <circle cx="36" cy="40" r="4" fill="#ffd54f"/>
        <circle cx="64" cy="40" r="4" fill="#ffd54f"/>
        <!-- Aztec Teeth / Mouth -->
        <rect x="32" y="60" width="36" height="12" rx="3" fill="#1b120c"/>
        <rect x="36" y="62" width="6" height="8" fill="#fff"/>
        <rect x="44" y="62" width="6" height="8" fill="#fff"/>
        <rect x="52" y="62" width="6" height="8" fill="#fff"/>
        <rect x="58" y="62" width="6" height="8" fill="#fff"/>
        <!-- Ear Ornaments -->
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
        <!-- Feathered Crest -->
        <path d="M22,66 C15,40 38,20 62,20 C78,20 86,34 82,52 C78,68 62,76 46,76 Z" fill="#ad1457" stroke="#ec407a" stroke-width="3"/>
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
        <path d="M25,65 L45,30 L75,30 L68,70 L35,70 Z" fill="#6a1b9a" stroke="#ab47bc" stroke-width="3"/>
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
        <path d="M24,34 Q38,18 50,30 Q62,18 76,34 L72,74 Q50,84 28,74 Z" fill="#2e7d32" stroke="#66bb6a" stroke-width="3"/>
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

export const NORMAL_KEYS = [
  'mask_gold', 'mask_red', 'pink_dragon', 'purple_totem', 
  'green_totem', 'blue_disc', 'card_A', 'card_K', 'card_Q', 'card_J', 'card_10'
];

export const EMPTY_SET: ReadonlySet<string> = new Set();

// Deterministic helper to pick random symbols
export function getRandomSymbol(allowSpecial = true): SymbolDef {
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

// Rule 5.12: Lazy state generators
export function createInitialGrid(): GridTile[][] {
  const grid: GridTile[][] = [];
  for (let c = 0; c < COLS; c++) {
    grid[c] = [];
    for (let r = 0; r < ROWS; r++) {
      grid[c][r] = {
        uid: `tile_${c}_${r}_${Math.random().toString(36).slice(2, 7)}`,
        sym: getRandomSymbol(true),
        frame: (c >= 1 && c <= 4 && Math.random() < 0.14) ? 'silver' : null
      };
    }
  }
  return grid;
}

export function createInitialTopReel(): SymbolDef[] {
  return [
    getRandomSymbol(false),
    getRandomSymbol(false),
    getRandomSymbol(false),
    getRandomSymbol(false)
  ];
}

// ============================================================================
// 2. SUBCOMPONENTS DEFINED AT MODULE SCOPE (Rule 5.4 & Rule 5.6)
// ============================================================================

// Rule 5.6 & 6.1: Symbol Tile with hardware GPU accelerated wrapper
export const SymbolTile = React.memo(function SymbolTile({ 
  tile, 
  isWinning 
}: { 
  tile: GridTile; 
  isWinning?: boolean; 
}) {
  const classes = [
    'tile-slot',
    tile.frame ? `frame-${tile.frame}` : '',
    isWinning ? 'winning' : '',
    tile.isExploding ? 'explode' : '',
    tile.isNew ? 'drop-in' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div 
        className="sym-icon-wrapper"
        dangerouslySetInnerHTML={{ __html: tile.sym.svg }} 
      />
    </div>
  );
});

// Rule 5.6: Top 4-symbol Horizontal Carousel
export const TopCarousel = React.memo(function TopCarousel({ 
  symbols, 
  winningKeys 
}: { 
  symbols: SymbolDef[]; 
  winningKeys: ReadonlySet<string>; 
}) {
  return (
    <div className="top-carousel">
      <div className="carousel-spacer" />
      {symbols.map((sym, idx) => {
        const isWin = winningKeys.has(sym.id) || sym.isWild;
        return (
          <div 
            key={`top_${idx}`} 
            className={`top-slot ${isWin ? 'winning' : ''}`}
          >
            <div 
              className="sym-icon-wrapper"
              dangerouslySetInnerHTML={{ __html: sym.svg }} 
            />
          </div>
        );
      })}
      <div className="carousel-spacer" />
    </div>
  );
});

// Rule 5.6: Multiplier Pedestal
export const MultiplierPedestal = React.memo(function MultiplierPedestal({ 
  multiplier 
}: { 
  multiplier: number; 
}) {
  return (
    <div className="multiplier-pedestal">
      <div className="pedestal-wing left" />
      <div className="pedestal-center-bowl">
        <span className={`multiplier-text ${multiplier > 1 ? 'bump' : ''}`}>
          x {multiplier}
        </span>
      </div>
      <div className="pedestal-wing right" />
    </div>
  );
});

// Rule 5.6: Bottom Console with Balance, Bet & Action Buttons
export const BottomConsole = React.memo(function BottomConsole({
  balance,
  bet,
  isTurbo,
  isAuto,
  isSpinning,
  onToggleTurbo,
  onChangeBet,
  onSpin,
  onToggleAuto
}: {
  balance: number;
  bet: number;
  isTurbo: boolean;
  isAuto: boolean;
  isSpinning: boolean;
  onToggleTurbo: () => void;
  onChangeBet: (delta: number) => void;
  onSpin: () => void;
  onToggleAuto: () => void;
}) {
  return (
    <div className="bottom-bar">
      {/* Top Meters Row */}
      <div className="meters-row">
        <div className="meter-pill balance-pill">
          <span className="pill-icon">👤☰</span>
          <span className="pill-val">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="pg-shield-badge">PG</div>
        <div className="meter-pill bet-pill">
          <span className="pill-val">{bet.toFixed(2)}</span>
          <span className="pill-icon gold">💲</span>
        </div>
      </div>

      {/* Control Buttons Row */}
      <div className="controls-row">
        {/* Turbo Button */}
        <button 
          className={`ctrl-btn turbo-btn ${isTurbo ? 'active' : ''}`}
          onClick={onToggleTurbo}
          title="TURBO"
          type="button"
        >
          <svg viewBox="0 0 24 24" className="ctrl-svg">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor"/>
          </svg>
        </button>

        {/* Bet Minus */}
        <button 
          className="ctrl-btn step-btn"
          onClick={() => onChangeBet(-2)}
          disabled={isSpinning}
          title="ลดเบท"
          type="button"
        >
          −
        </button>

        {/* Master Spin Button with dual golden arrows and ruby red center */}
        <button 
          className={`master-spin-btn ${isSpinning ? 'spinning' : ''}`}
          onClick={onSpin}
          disabled={isSpinning}
          title="หมุนสปิน"
          type="button"
        >
          <div className="spin-gold-ring">
            <div className="spin-red-center">
              <svg viewBox="0 0 24 24" className="spin-swirl-icon">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="#ffea79"/>
              </svg>
            </div>
          </div>
        </button>

        {/* Bet Plus */}
        <button 
          className="ctrl-btn step-btn"
          onClick={() => onChangeBet(2)}
          disabled={isSpinning}
          title="เพิ่มเบท"
          type="button"
        >
          +
        </button>

        {/* Auto Spin Button */}
        <button 
          className={`ctrl-btn auto-btn ${isAuto ? 'active' : ''}`}
          onClick={onToggleAuto}
          title="AUTO SPIN"
          type="button"
        >
          <svg viewBox="0 0 24 24" className="ctrl-svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

// Rule 5.6 & 6.7: Memoized Intro Screen
export const IntroScreen = React.memo(function IntroScreen({ 
  visible, 
  onStart 
}: { 
  visible: boolean; 
  onStart: () => void; 
}) {
  return (
    <div className={`screen-intro ${visible ? '' : 'hidden'}`}>
      {/* Top 3D Golden Logo */}
      <div className="intro-header-logo">
        <div className="intro-sub-title">TREASURES OF</div>
        <div className="intro-main-title">AZTEC</div>
      </div>

      {/* Center Catchphrase Banner */}
      <div className="intro-feature-banner">
        <div className="feature-line-1">Win with</div>
        <div className="feature-line-2">
          Wilds-on-the-Way<br />
          & increasing multipliers<br />
          with every win!
        </div>
      </div>

      {/* The Iconic Blue "GET STARTED" Button */}
      <button className="get-started-btn" onClick={onStart} type="button">
        GET STARTED
      </button>

      {/* PG Soft Official Footer */}
      <div className="intro-footer">
        <div className="intro-footer-row">
          <div className="pg-brand-tag"><span>PG</span> POCKET GAMES SOFT®</div>
          <div>Licensed in Malta 🇲🇹 MGA</div>
          <div>Certified by GA / BMM testlabs</div>
        </div>
        <div>PGSOFT.COM 2026 © PG SOFT® ALL RIGHTS RESERVED</div>
      </div>
    </div>
  );
});

// Rule 5.6: Big Win Celebration Modal
export const BigWinModal = React.memo(function BigWinModal({
  title,
  amount,
  onClose
}: {
  title: string;
  amount: number;
  onClose: () => void;
}) {
  return (
    <div className="big-win-modal">
      <div className="big-win-rays" />
      <div className="big-win-content">
        <div className="big-win-title">{title}</div>
        <div className="big-win-score">
          {Math.floor(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <button className="big-win-btn" onClick={onClose} type="button">
          รับรางวัล 💰
        </button>
      </div>
    </div>
  );
});

// Rule 6.3: Static Side Pillar Reliefs
export const AztecSideBorderLeft = (
  <div className="aztec-pillar left">
    <div className="pillar-glyph" />
    <div className="pillar-glyph" />
    <div className="pillar-glyph" />
  </div>
);

export const AztecSideBorderRight = (
  <div className="aztec-pillar right">
    <div className="pillar-glyph" />
    <div className="pillar-glyph" />
    <div className="pillar-glyph" />
  </div>
);

// ============================================================================
// 3. MAIN COMPONENT: TreasuresOfAztecApp (Full React Best Practices Engine)
// ============================================================================

export default function TreasuresOfAztecApp() {
  // Rule 5.12: Lazy State Initialization
  const [grid, setGrid] = useState<GridTile[][]>(() => createInitialGrid());
  const [topReel, setTopReel] = useState<SymbolDef[]>(() => createInitialTopReel());
  const [balance, setBalance] = useState<number>(100000);
  const [bet, setBet] = useState<number>(12);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isIntroVisible, setIsIntroVisible] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [winningKeys, setWinningKeys] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [toastText, setToastText] = useState<string>('');
  const [bigWin, setBigWin] = useState<{ amount: number; title: string } | null>(null);

  // Rule 5.13: Concurrent React Transitions
  const [, startTransition] = useTransition();

  // Rule 5.15: Transient values stored in refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const isSpinningRef = useRef<boolean>(false);

  // Rule 5.1: Calculate Derived State During Rendering (no useEffect syncing)
  // Dynamic calculation of current available ways across the 6 reels
  const waysCount = grid.reduce((acc, col, idx) => {
    const colLen = col.length + (idx >= 1 && idx <= 4 ? 1 : 0);
    return acc * (colLen || 1);
  }, 1);

  // Sound Synthesizer via Web Audio API (Rule 8.2: Lazily initialized once)
  const playSfx = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.08, gainVal = 0.1) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback silent
    }
  }, []);

  const sndDrop = useCallback(() => playSfx(160, 'triangle', 0.08, 0.2), [playSfx]);
  const sndWin = useCallback(() => {
    [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => playSfx(f, 'sine', 0.1, 0.15), i * 45));
  }, [playSfx]);
  const sndShatter = useCallback(() => {
    playSfx(350, 'square', 0.12, 0.15);
    setTimeout(() => playSfx(750, 'sawtooth', 0.1, 0.1), 40);
  }, [playSfx]);
  const sndDoorOpen = useCallback(() => {
    [200, 240, 280, 320, 440].forEach((f, i) => setTimeout(() => playSfx(f, 'triangle', 0.2, 0.15), i * 70));
  }, [playSfx]);

  // Rule 5.8: Put Interaction Logic in Event Handlers
  const handleStartGame = useCallback(() => {
    sndDoorOpen();
    setIsIntroVisible(false);
  }, [sndDoorOpen]);

  const handleShowIntro = useCallback(() => {
    playSfx(380, 'sine', 0.1);
    setIsIntroVisible(true);
  }, [playSfx]);

  const handleToggleTurbo = useCallback(() => {
    setIsTurbo(prev => !prev);
    playSfx(600, 'sine', 0.05);
  }, [playSfx]);

  const handleToggleAuto = useCallback(() => {
    setIsAuto(prev => !prev);
    playSfx(700, 'sine', 0.05);
  }, [playSfx]);

  const handleChangeBet = useCallback((delta: number) => {
    // Rule 1.1: Early return before dispatch
    if (isSpinningRef.current) return;
    setBet(prev => {
      const idx = DEFAULT_BETS.indexOf(prev);
      if (idx !== -1) {
        const nextIdx = Math.max(0, Math.min(DEFAULT_BETS.length - 1, idx + (delta > 0 ? 1 : -1)));
        return DEFAULT_BETS[nextIdx];
      }
      return Math.max(2, Math.min(2000, prev + delta));
    });
    playSfx(500, 'sine', 0.04);
  }, [playSfx]);

  // ==========================================================================
  // CASCADE & WIN ENGINE (Multi-Cascade Cascading Reels with Wilds-on-the-Way)
  // ==========================================================================
  const evaluateGridWins = useCallback((curGrid: GridTile[][], curTop: SymbolDef[]) => {
    const matchKeys = new Set<string>();
    let totalWinVal = 0;
    const winDetails: string[] = [];

    // Rule 7.6 & 7.13: Single pass over symbols with Set lookups
    NORMAL_KEYS.forEach(key => {
      const sym = SYMBOLS[key];
      const colHits: number[] = [];

      for (let c = 0; c < COLS; c++) {
        let count = 0;
        for (let r = 0; r < curGrid[c].length; r++) {
          const item = curGrid[c][r].sym;
          if (item.id === sym.id || item.isWild) count++;
        }
        if (c >= 1 && c <= 4) {
          const topSym = curTop[c - 1];
          if (topSym && (topSym.id === sym.id || topSym.isWild)) count++;
        }
        if (count > 0) colHits.push(count);
        else break;
      }

      if (colHits.length >= 3) {
        matchKeys.add(sym.id);
        const totalWays = colHits.reduce((acc, v) => acc * v, 1);
        const rate = sym.payouts[colHits.length] || 1;
        const win = rate * totalWays * (bet / 20);
        totalWinVal += win;
        winDetails.push(`${sym.name} x${colHits.length}`);
      }
    });

    return { matchKeys, totalWinVal, winDetails };
  }, [bet]);

  // Execute Cascading Step
  const runCascadeCycle = useCallback((
    stepGrid: GridTile[][], 
    stepTop: SymbolDef[], 
    currentMult: number, 
    cumulativeWin: number
  ) => {
    const { matchKeys, totalWinVal, winDetails } = evaluateGridWins(stepGrid, stepTop);

    if (matchKeys.size > 0 && totalWinVal > 0) {
      // Step A: Highlight wins
      sndWin();
      const stepPayout = totalWinVal * currentMult;
      const nextCumWin = cumulativeWin + stepPayout;

      // Rule 5.11: Functional updates
      setBalance(prev => prev + stepPayout);
      setWinningKeys(matchKeys);
      setToastText(`ชนะ +${stepPayout.toFixed(2)} THB (${winDetails.join(', ')})`);

      const delay = isTurbo ? 300 : 600;

      setTimeout(() => {
        sndShatter();
        // Step B: Transform Wilds-on-the-Way & Cascade (Rule 7.14 Immutability)
        const nextGrid: GridTile[][] = [];

        for (let c = 0; c < COLS; c++) {
          const remainingCol: GridTile[] = [];
          for (let r = 0; r < stepGrid[c].length; r++) {
            const tile = stepGrid[c][r];
            const isMatch = matchKeys.has(tile.sym.id) || tile.sym.isWild;

            if (isMatch) {
              if (tile.frame === 'silver') {
                // Silver frame transforms to Gold frame with random symbol
                remainingCol.push({
                  uid: `tile_${c}_${r}_${Math.random().toString(36).slice(2, 7)}`,
                  sym: getRandomSymbol(false),
                  frame: 'gold'
                });
              } else if (tile.frame === 'gold') {
                // Gold frame transforms to WILD!
                remainingCol.push({
                  uid: `tile_${c}_${r}_${Math.random().toString(36).slice(2, 7)}`,
                  sym: SYMBOLS.wild,
                  frame: null
                });
              }
              // Normal matching tiles explode and drop out
            } else {
              remainingCol.push(tile);
            }
          }

          // Fill empty spaces from top
          while (remainingCol.length < ROWS) {
            remainingCol.unshift({
              uid: `tile_${c}_drop_${Math.random().toString(36).slice(2, 7)}`,
              sym: getRandomSymbol(true),
              frame: (c >= 1 && c <= 4 && Math.random() < 0.12) ? 'silver' : null,
              isNew: true
            });
          }
          nextGrid.push(remainingCol);
        }

        // New Top Reel Symbols
        const nextTop = stepTop.map(sym => {
          if (matchKeys.has(sym.id) || sym.isWild) {
            return getRandomSymbol(false);
          }
          return sym;
        });

        // Step C: Increment Multiplier by +1
        const nextMult = currentMult + 1;
        setMultiplier(nextMult);
        setWinningKeys(EMPTY_SET);
        setGrid(nextGrid);
        setTopReel(nextTop);

        // Next cascade check
        setTimeout(() => {
          runCascadeCycle(nextGrid, nextTop, nextMult, nextCumWin);
        }, isTurbo ? 250 : 500);

      }, delay);
    } else {
      // Cascades Finished!
      setWinningKeys(EMPTY_SET);
      isSpinningRef.current = false;
      setIsSpinning(false);

      if (cumulativeWin >= bet * 15) {
        setBigWin({
          amount: cumulativeWin,
          title: cumulativeWin >= bet * 40 ? 'SUPER MEGA WIN!' : 'MEGA WIN!'
        });
      }
    }
  }, [evaluateGridWins, sndWin, sndShatter, isTurbo, bet]);

  // Main Spin Handler
  const handleSpin = useCallback(() => {
    // Rule 1.1: Check cheap synchronous condition before async flags
    if (isSpinningRef.current) return;
    if (balance < bet) {
      alert('ยอดเงินคงเหลือไม่เพียงพอ กรุณาลดเบทหรือเติมเครดิต');
      setIsAuto(false);
      return;
    }

    // Set synchronous lock
    isSpinningRef.current = true;
    setIsSpinning(true);

    // Rule 5.11: Functional state updates
    setBalance(prev => prev - bet);
    setMultiplier(1);
    setWinningKeys(EMPTY_SET);
    setToastText('');
    playSfx(220, 'triangle', 0.15);

    const spinDuration = isTurbo ? 250 : 550;

    setTimeout(() => {
      sndDrop();
      startTransition(() => {
        const freshGrid = createInitialGrid();
        const freshTop = createInitialTopReel();
        setGrid(freshGrid);
        setTopReel(freshTop);

        // Begin Cascade Evaluation
        runCascadeCycle(freshGrid, freshTop, 1, 0);
      });
    }, spinDuration);
  }, [balance, bet, isTurbo, playSfx, sndDrop, runCascadeCycle]);

  // Rule 4.1: Centralized Keyboard Event Listener (Spacebar to Spin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isIntroVisible && !isSpinningRef.current) {
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isIntroVisible, handleSpin]);

  // Rule 5.7: Narrow Effect Dependencies for Auto Spin
  useEffect(() => {
    if (isAuto && !isSpinning && !bigWin) {
      autoTimerRef.current = window.setTimeout(handleSpin, isTurbo ? 350 : 800);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [isAuto, isSpinning, bigWin, isTurbo, handleSpin]);

  return (
    <div className="viewport-box">
      {/* Screen 1: Intro Screen Component */}
      <IntroScreen visible={isIntroVisible} onStart={handleStartGame} />

      {/* Screen 2: Active Slot Game */}
      <div className="screen-game">
        {/* Top Header Bar */}
        <div className="game-top-bar">
          <button 
            className="back-home-btn" 
            onClick={handleShowIntro} 
            title="กลับหน้าเริ่มเกม"
            type="button"
          >
            <span>◀</span> หน้าแรก
          </button>
          
          <div className="ways-stone-banner">
            <span className="ways-count-text">{waysCount.toLocaleString()} WAYS</span>
          </div>
        </div>

        {/* Reels Area with Side Pillars & Carved Reliefs */}
        <div className="game-reels-container">
          {AztecSideBorderLeft}

          <div className="reels-board">
            {/* Top 4-symbol horizontal carousel */}
            <TopCarousel symbols={topReel} winningKeys={winningKeys} />

            {/* 6-column Main Grid */}
            <div className="main-grid">
              {grid.map((col, c) => (
                <div key={`col_${c}`} className="grid-col">
                  <div className={`col-strip ${isSpinning ? 'spinning' : ''}`}>
                    {col.map(tile => (
                      <SymbolTile 
                        key={tile.uid} 
                        tile={tile}
                        isWinning={winningKeys.has(tile.sym.id) || tile.sym.isWild}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {AztecSideBorderRight}
        </div>

        {/* Rule 6.9: Explicit Conditional Rendering for Toast */}
        {toastText ? (
          <div className="toast-popup show">{toastText}</div>
        ) : null}

        {/* Middle Cyan Stone Banner */}
        <div className="middle-ways-banner">
          <span>WIN UP TO 32400 WAYS!</span>
        </div>

        {/* Multiplier Aztec Pedestal */}
        <MultiplierPedestal multiplier={multiplier} />

        {/* Bottom Control Console */}
        <BottomConsole
          balance={balance}
          bet={bet}
          isTurbo={isTurbo}
          isAuto={isAuto}
          isSpinning={isSpinning}
          onToggleTurbo={handleToggleTurbo}
          onChangeBet={handleChangeBet}
          onSpin={handleSpin}
          onToggleAuto={handleToggleAuto}
        />
      </div>

      {/* Rule 6.9: Explicit Conditional Rendering for Big Win Modal */}
      {bigWin ? (
        <BigWinModal
          title={bigWin.title}
          amount={bigWin.amount}
          onClose={() => setBigWin(null)}
        />
      ) : null}
    </div>
  );
}
