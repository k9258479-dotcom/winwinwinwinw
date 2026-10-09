export type CardSymbol = 'A' | 'K' | 'Q' | 'J' | 'SPADE' | 'WILD' | 'SCATTER';

export interface GridCard {
  id: string;
  symbol: CardSymbol;
  isGolden: boolean; // Golden cards appear on reels 2, 3, 4
  isWinning?: boolean;
  isEliminated?: boolean;
  isNew?: boolean;
  isTransformingWild?: boolean;
}

export type MultiplierLevel = 1 | 2 | 3 | 5;
export type FreeGameMultiplierLevel = 2 | 4 | 6 | 10;

export interface WinLine {
  symbol: CardSymbol;
  count: number;
  payout: number;
  multiplier: number;
  cells: { col: number; row: number }[];
}

export interface SpinResult {
  payout: number;
  winLines: WinLine[];
  freeSpinsTriggered: boolean;
  goldenWildsCreated: number;
}

export interface SpinHistoryItem {
  id: string;
  timestamp: string;
  bet: number;
  payout: number;
  multiplier: number;
  isFreeSpin: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}
