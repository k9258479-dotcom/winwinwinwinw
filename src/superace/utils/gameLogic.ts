import { CardSymbol, GridCard, WinLine } from '../types/game';

export interface GameWinRateConfig {
  winRate: number; // 0 to 100 percentage
  payoutMultiplier?: number;
  wildBonusRate?: number; // e.g. 8 (percent)
  freeSpinRate?: number; // e.g. 3 (percent)
  rigMode?: 'BALANCED' | 'HIGH_PAYOUT' | 'LOW_PAYOUT' | 'JACKPOT_HUNT';
}

export const MULTIPLIERS = [1, 2, 3, 5] as const;
export const FREE_MULTIPLIERS = [2, 4, 6, 10] as const;

export const SYMBOL_PAYOUTS: Record<CardSymbol, { [count: number]: number }> = {
  A: { 3: 0.5, 4: 1.5, 5: 3.5 },
  K: { 3: 0.4, 4: 1.0, 5: 2.5 },
  Q: { 3: 0.3, 4: 0.8, 5: 2.0 },
  J: { 3: 0.2, 4: 0.5, 5: 1.5 },
  SPADE: { 3: 0.1, 4: 0.3, 5: 0.8 },
  WILD: { 3: 0.5, 4: 1.5, 5: 3.5 },
  SCATTER: { 3: 2.0, 4: 5.0, 5: 10.0 },
};

// Generate an individual card symbol with weighted odds modulated by dynamic win rate config
export function getRandomSymbol(colIndex: number, config?: GameWinRateConfig): { symbol: CardSymbol; isGolden: boolean } {
  const rand = Math.random();
  let symbol: CardSymbol = 'J';

  // Base frequencies
  const winRate = config?.winRate !== undefined ? config.winRate : 97.6;
  const rigMode = config?.rigMode || 'BALANCED';

  // Adjust probabilities according to win rate & rigMode
  // Default: scatter 3%, wild 5%
  let scatterOdds = (config?.freeSpinRate !== undefined ? config.freeSpinRate : 3) / 100;
  let wildOdds = (config?.wildBonusRate !== undefined ? config.wildBonusRate : 8) / 100;

  if (rigMode === 'HIGH_PAYOUT') {
    scatterOdds = Math.max(scatterOdds, 0.06);
    wildOdds = Math.max(wildOdds, 0.14);
  } else if (rigMode === 'LOW_PAYOUT') {
    scatterOdds = Math.min(scatterOdds, 0.015);
    wildOdds = Math.min(wildOdds, 0.03);
  } else if (rigMode === 'JACKPOT_HUNT') {
    scatterOdds = Math.max(scatterOdds, 0.08);
    wildOdds = Math.max(wildOdds, 0.16);
  }

  // Factor winRate scale
  const rtpFactor = winRate / 97.6;
  wildOdds = Math.min(0.35, wildOdds * rtpFactor);

  const scatterThreshold = scatterOdds;
  const wildThreshold = scatterThreshold + wildOdds;

  if (rand < scatterThreshold) {
    symbol = 'SCATTER';
  } else if (rand < wildThreshold) {
    symbol = 'WILD';
  } else if (rand < wildThreshold + 0.20) {
    symbol = 'SPADE';
  } else if (rand < wildThreshold + 0.42) {
    symbol = 'J';
  } else if (rand < wildThreshold + 0.62) {
    symbol = 'Q';
  } else if (rand < wildThreshold + 0.80) {
    symbol = 'K';
  } else {
    symbol = 'A';
  }

  // Golden cards appear only on reels 2, 3, 4 (0-indexed 1, 2, 3) and cannot be Scatter or Wild
  let isGolden = false;
  if (colIndex >= 1 && colIndex <= 3 && symbol !== 'SCATTER' && symbol !== 'WILD') {
    // Higher win rate gives higher golden transformation chance
    const goldenProb = Math.min(0.60, 0.25 * rtpFactor);
    isGolden = Math.random() < goldenProb;
  }

  return { symbol, isGolden };
}

// Generate the initial grid matching the screenshot
export function getInitialGrid(): GridCard[][] {
  const grid: GridCard[][] = [];

  // Reel 1: All A
  grid.push([
    { id: 'c0-r0', symbol: 'A', isGolden: false },
    { id: 'c0-r1', symbol: 'A', isGolden: false },
    { id: 'c0-r2', symbol: 'A', isGolden: false },
    { id: 'c0-r3', symbol: 'A', isGolden: false },
  ]);

  // Reel 2: Top is Golden K, rest are normal K
  grid.push([
    { id: 'c1-r0', symbol: 'K', isGolden: true },
    { id: 'c1-r1', symbol: 'K', isGolden: false },
    { id: 'c1-r2', symbol: 'K', isGolden: false },
    { id: 'c1-r3', symbol: 'K', isGolden: false },
  ]);

  // Reel 3: Top is Golden Q, rest are normal Q
  grid.push([
    { id: 'c2-r0', symbol: 'Q', isGolden: true },
    { id: 'c2-r1', symbol: 'Q', isGolden: false },
    { id: 'c2-r2', symbol: 'Q', isGolden: false },
    { id: 'c2-r3', symbol: 'Q', isGolden: false },
  ]);

  // Reel 4: All J
  grid.push([
    { id: 'c3-r0', symbol: 'J', isGolden: false },
    { id: 'c3-r1', symbol: 'J', isGolden: false },
    { id: 'c3-r2', symbol: 'J', isGolden: false },
    { id: 'c3-r3', symbol: 'J', isGolden: false },
  ]);

  // Reel 5: All SPADE cards
  grid.push([
    { id: 'c4-r0', symbol: 'SPADE', isGolden: false },
    { id: 'c4-r1', symbol: 'SPADE', isGolden: false },
    { id: 'c4-r2', symbol: 'SPADE', isGolden: false },
    { id: 'c4-r3', symbol: 'SPADE', isGolden: false },
  ]);

  return grid;
}

// Disjoint symbol pairs for guaranteed zero-win grid generation
const DISJOINT_PAIRS: [CardSymbol[], CardSymbol[]][] = [
  [['A', 'K'], ['Q', 'J', 'SPADE']],
  [['Q', 'J'], ['A', 'K', 'SPADE']],
  [['SPADE', 'A'], ['K', 'Q', 'J']],
  [['K', 'SPADE'], ['A', 'Q', 'J']],
  [['J', 'K'], ['A', 'Q', 'SPADE']],
];

// Generate a brand new random grid with strict win-rate / RTP enforcement
export function generateRandomGrid(config?: GameWinRateConfig): GridCard[][] {
  const targetRtp = config?.winRate !== undefined ? config.winRate : 97.6;
  const rigMode = config?.rigMode || 'BALANCED';

  // Authentic slot hit frequency mapping:
  // RTP 0 - 30% -> ~8% chance to hit
  // RTP 30 - 55% -> ~15% chance to hit (tight / house advantage)
  // RTP 55 - 80% -> ~22% chance to hit
  // RTP 80 - 95% -> ~28% chance to hit
  // RTP 96 - 98% -> ~33% chance to hit (industry standard slot hit rate)
  // RTP 99 - 100% -> ~90%+ chance to hit (sure-win / demo mode)
  let allowedWinProbability: number;
  if (targetRtp <= 30) {
    allowedWinProbability = 0.08;
  } else if (targetRtp <= 55) {
    allowedWinProbability = 0.15;
  } else if (targetRtp <= 75) {
    allowedWinProbability = 0.22;
  } else if (targetRtp <= 90) {
    allowedWinProbability = 0.28;
  } else if (targetRtp <= 98.5) {
    allowedWinProbability = 0.33;
  } else {
    allowedWinProbability = 0.90 + (targetRtp - 98.5) * 0.06;
  }

  // Modulate with rigMode
  if (rigMode === 'LOW_PAYOUT') {
    allowedWinProbability = Math.min(allowedWinProbability, 0.12);
  } else if (rigMode === 'HIGH_PAYOUT') {
    allowedWinProbability = Math.max(allowedWinProbability, 0.65);
  } else if (rigMode === 'JACKPOT_HUNT') {
    allowedWinProbability = 0.18;
  }

  const shouldAllowWin = Math.random() < allowedWinProbability;

  // 1. GUARANTEED NON-WINNING GRID (If spin is calculated as a LOSS)
  if (!shouldAllowWin) {
    const pair = DISJOINT_PAIRS[Math.floor(Math.random() * DISJOINT_PAIRS.length)];
    const reel1Symbols = pair[0];
    const reel2Symbols = pair[1];

    const grid: GridCard[][] = [];

    // Reel 1: Only draws from reel1Symbols, NO wilds
    const col0: GridCard[] = [];
    for (let r = 0; r < 4; r++) {
      const symbol = reel1Symbols[Math.floor(Math.random() * reel1Symbols.length)];
      col0.push({
        id: `c0-r${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol,
        isGolden: false,
      });
    }
    grid.push(col0);

    // Reel 2: Only draws from reel2Symbols, NO wilds
    const col1: GridCard[] = [];
    for (let r = 0; r < 4; r++) {
      const symbol = reel2Symbols[Math.floor(Math.random() * reel2Symbols.length)];
      const isGolden = Math.random() < 0.1;
      col1.push({
        id: `c1-r${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol,
        isGolden,
      });
    }
    grid.push(col1);

    // Reel 3, 4, 5: Random symbols from all standard symbols, NO wild on reel 3 to guarantee 0 win
    const regularSymbols: CardSymbol[] = ['A', 'K', 'Q', 'J', 'SPADE'];
    for (let c = 2; c < 5; c++) {
      const col: GridCard[] = [];
      for (let r = 0; r < 4; r++) {
        let sym: CardSymbol;
        if (c === 2) {
          sym = regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
        } else {
          const rand = Math.random();
          if (rand < 0.05) sym = 'SCATTER';
          else if (rand < 0.10) sym = 'WILD';
          else sym = regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
        }
        const isGolden = (c === 2 || c === 3) && sym !== 'SCATTER' && sym !== 'WILD' && Math.random() < 0.15;
        col.push({
          id: `c${c}-r${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          symbol: sym,
          isGolden,
        });
      }
      grid.push(col);
    }

    // Ensure Scatters do not exceed 2 on a dead spin
    let scatters = 0;
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 4; r++) {
        if (grid[c][r].symbol === 'SCATTER') {
          scatters++;
          if (scatters > 2) {
            grid[c][r].symbol = 'SPADE';
          }
        }
      }
    }

    return grid;
  }

  // 2. AUTHENTIC WINNING GRID (When spin is allowed to win)
  const winSymbolPool: CardSymbol[] = [
    'SPADE', 'SPADE', 'SPADE',
    'J', 'J', 'J',
    'Q', 'Q',
    'K', 'K',
    'A',
  ];
  const targetSymbol = winSymbolPool[Math.floor(Math.random() * winSymbolPool.length)];

  // How many reels does this win hit? At least 3 reels (Reel 1, 2, 3)
  let winLength = 3;
  const randLength = Math.random();
  if (targetRtp >= 90 || rigMode === 'HIGH_PAYOUT') {
    if (randLength < 0.35) winLength = 4;
    else if (randLength < 0.50) winLength = 5;
  } else if (targetRtp >= 70) {
    if (randLength < 0.20) winLength = 4;
    else if (randLength < 0.28) winLength = 5;
  } else {
    if (randLength < 0.08) winLength = 4;
  }

  const grid: GridCard[][] = [];
  for (let c = 0; c < 5; c++) {
    const col: GridCard[] = [];
    const isWinReel = c < winLength;
    const winRow1 = Math.floor(Math.random() * 4);
    const hasSecondWinRow = (targetRtp >= 95 || rigMode === 'HIGH_PAYOUT') && Math.random() < 0.35;
    const winRow2 = hasSecondWinRow ? (winRow1 + 1 + Math.floor(Math.random() * 3)) % 4 : -1;

    for (let r = 0; r < 4; r++) {
      if (isWinReel && (r === winRow1 || r === winRow2)) {
        const isWild = c > 0 && Math.random() < ((config?.wildBonusRate || 8) / 100);
        const isGolden = c >= 1 && c <= 3 && !isWild && Math.random() < (targetRtp > 80 ? 0.30 : 0.15);
        col.push({
          id: `c${c}-r${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          symbol: isWild ? 'WILD' : targetSymbol,
          isGolden,
        });
      } else {
        const { symbol, isGolden } = getRandomSymbol(c, config);
        let finalSymbol = symbol;
        if (targetRtp < 70 && symbol === targetSymbol) {
          finalSymbol = targetSymbol === 'A' ? 'J' : 'A';
        }
        col.push({
          id: `c${c}-r${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          symbol: finalSymbol,
          isGolden,
        });
      }
    }
    grid.push(col);
  }

  return grid;
}

// Find winning ways in the grid (1024 ways: matching symbols on reels 1 -> 2 -> 3...)
export function evaluateWins(
  grid: GridCard[][],
  bet: number,
  multiplier: number,
  config?: GameWinRateConfig
): {
  winLines: WinLine[];
  winningCells: Set<string>;
  totalPayout: number;
} {
  const winLines: WinLine[] = [];
  const winningCells = new Set<string>();
  let totalPayout = 0;
  let payoutMultiplier = config?.payoutMultiplier !== undefined ? config.payoutMultiplier : 1.0;
  if (config?.rigMode === 'LOW_PAYOUT') {
    payoutMultiplier = Math.min(payoutMultiplier, 0.70);
  } else if (config?.rigMode === 'HIGH_PAYOUT') {
    payoutMultiplier = Math.max(payoutMultiplier, 1.25);
  } else if (config?.rigMode === 'JACKPOT_HUNT') {
    payoutMultiplier = Math.max(payoutMultiplier, 2.5);
  }

  const targetSymbols: CardSymbol[] = ['A', 'K', 'Q', 'J', 'SPADE'];

  for (const sym of targetSymbols) {
    const matchingCols: { col: number; row: number; cardId: string }[][] = [];

    for (let c = 0; c < 5; c++) {
      const matchesInCol: { col: number; row: number; cardId: string }[] = [];
      for (let r = 0; r < 4; r++) {
        const card = grid[c][r];
        if (card.symbol === sym || card.symbol === 'WILD') {
          matchesInCol.push({ col: c, row: r, cardId: card.id });
        }
      }
      if (matchesInCol.length > 0) {
        matchingCols.push(matchesInCol);
      } else {
        break; // Ways must be consecutive from reel 1
      }
    }

    const count = matchingCols.length;
    if (count >= 3) {
      // Calculate ways: product of matching symbol counts on each reel
      let ways = 1;
      const participatingCells: { col: number; row: number }[] = [];
      matchingCols.forEach(colMatches => {
        ways *= colMatches.length;
        colMatches.forEach(cell => {
          participatingCells.push({ col: cell.col, row: cell.row });
          winningCells.add(`${cell.col}-${cell.row}`);
        });
      });

      const basePayout = SYMBOL_PAYOUTS[sym][count] || 0;
      const linePayout = +(basePayout * bet * ways * multiplier * payoutMultiplier).toFixed(3);

      totalPayout += linePayout;
      winLines.push({
        symbol: sym,
        count,
        payout: linePayout,
        multiplier,
        cells: participatingCells,
      });
    }
  }

  // Also check for Scatters (3 or more anywhere on grid)
  let scatterCount = 0;
  const scatterCells: { col: number; row: number }[] = [];
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 4; r++) {
      if (grid[c][r].symbol === 'SCATTER') {
        scatterCount++;
        scatterCells.push({ col: c, row: r });
      }
    }
  }

  if (scatterCount >= 3) {
    const scatterPayout = +((SYMBOL_PAYOUTS.SCATTER[Math.min(scatterCount, 5)] || 2.0) * bet * payoutMultiplier).toFixed(3);
    totalPayout += scatterPayout;
    scatterCells.forEach(cell => winningCells.add(`${cell.col}-${cell.row}`));
    winLines.push({
      symbol: 'SCATTER',
      count: scatterCount,
      payout: scatterPayout,
      multiplier,
      cells: scatterCells,
    });
  }

  return { winLines, winningCells, totalPayout };
}

// Cascade the grid:
// 1. Winning golden cards turn into WILD cards!
// 2. Other winning cards vanish
// 3. Remaining cards drop down, new cards spawn at top
export function cascadeGrid(
  currentGrid: GridCard[][],
  winningCellCoords: Set<string>,
  config?: GameWinRateConfig
): { nextGrid: GridCard[][]; goldenWildsCreated: number } {
  const nextGrid: GridCard[][] = [];
  let goldenWildsCreated = 0;
  const isTight = (config?.winRate !== undefined && config.winRate < 65) || config?.rigMode === 'LOW_PAYOUT';

  for (let c = 0; c < 5; c++) {
    const currentCol = currentGrid[c];
    const survivingCards: GridCard[] = [];

    for (let r = 0; r < 4; r++) {
      const card = currentCol[r];
      const isWinner = winningCellCoords.has(`${c}-${r}`);

      if (isWinner) {
        if (card.isGolden) {
          // If in tight / low win-rate mode, only 40% of golden cards transform into wilds (or max 1 wild per column)
          const allowTransform = !isTight || Math.random() < 0.40;
          if (allowTransform && (!isTight || goldenWildsCreated < 1)) {
            goldenWildsCreated++;
            survivingCards.push({
              id: `wild-${c}-${r}-${Date.now()}`,
              symbol: 'WILD',
              isGolden: false,
              isTransformingWild: true,
            });
          }
        }
        // Non-golden winner disappears
      } else {
        survivingCards.push({ ...card, isWinning: false });
      }
    }

    // Fill top with new cards until length is 4
    const needed = 4 - survivingCards.length;
    const newCards: GridCard[] = [];
    for (let i = 0; i < needed; i++) {
      const { symbol, isGolden } = getRandomSymbol(c, config);
      let spawnSymbol = symbol;
      if (isTight && spawnSymbol === 'WILD') {
        spawnSymbol = 'J';
      }
      newCards.push({
        id: `spawn-${c}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: spawnSymbol,
        isGolden: isTight ? false : isGolden,
        isNew: true,
      });
    }

    // Combine: new cards at top, surviving cards below
    nextGrid.push([...newCards, ...survivingCards]);
  }

  return { nextGrid, goldenWildsCreated };
}
