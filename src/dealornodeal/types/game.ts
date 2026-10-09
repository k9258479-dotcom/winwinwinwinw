export interface Briefcase {
  id: number; // 1 to 35
  multiplier: number; // e.g. 0.2 to 1000
  isOpen: boolean;
  revealedOrder?: number;
}

export type GamePhase =
  | 'PLAYING' // Player can select box(es) to open OR claim winnings
  | 'GAME_OVER'; // Outcome revealed (Claimed or 6 Boxes Completed)

// 35 Multipliers for 35 Briefcases:
// 20 maleta na 0.3x
// 10 maleta na 0.2x
// 3 maleta na 10x
// 1 maleta na 100x
// 1 maleta na 1,000x
export const BASE_MULTIPLIERS: number[] = [
  // 20 maleta na 0.3x
  0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
  0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
  // 10 maleta na 0.2x
  0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
  // 3 maleta na 10x
  10, 10, 10,
  // 1 maleta na 100x
  100,
  // 1 maleta na 1,000x
  1000,
];

export const PAYTABLE_MULTIPLIERS: number[] = [
  0.2, 0.3, 10, 100, 1000,
];

export interface ProvablyFairData {
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}
