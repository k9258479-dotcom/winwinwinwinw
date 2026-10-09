export interface UserProfile {
  id: string;
  playerId?: string;
  phone: string;
  username: string;
  balance: number;
  vipLevel: number;
  vipPoints: number;
  currency: string;
  isLoggedIn: boolean;
  avatar: string;
  totalDeposited: number;
  totalWithdrawn: number;
  turnover?: number;
  totalWon?: number;
  totalLost?: number;
  totalSpins?: number;
  registeredAt?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  userPhone?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'WIN' | 'BET';
  amount: number;
  currency?: string;
  method: string;
  referenceNo: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  createdAt?: string;
  recipientAccount?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export type GameCategory = 'all' | 'slots' | 'live' | 'crash' | 'perya' | 'table' | 'fishing' | 'arcade';

export interface GameItem {
  id: string;
  title: string;
  provider: 'JILI' | 'PG Soft' | 'Pragmatic Play' | 'Fa Chai' | 'Spribe' | 'Evolution' | 'Perya' | 'BET88 ORIGINALS' | 'JDB' | 'BET88 LIVE' | string;
  category: GameCategory;
  rtp: string;
  image: string;
  isHot?: boolean;
  isJackpot?: boolean;
  jackpotAmount?: number;
  playCount: string;
  badge?: string;
}

export interface SlotSymbol {
  id: string;
  name: string;
  icon: string;
  isWild: boolean;
  isScatter: boolean;
  multiplier3?: number;
  multiplier4?: number;
  multiplier5?: number;
}

export interface SlotSpinResponse {
  success: boolean;
  grid: SlotSymbol[][];
  totalWin: number;
  winningLines: Array<{
    lineId: number;
    lineName: string;
    symbolId: string;
    count: number;
    winAmount: number;
    path: number[];
  }>;
  freeSpinsWon: number;
  scatterCount: number;
  newBalance: number;
  message?: string;
}

export interface Promotion {
  id: string;
  title: string;
  tag: string;
  description: string;
  bonusRate: string;
  minDeposit: number;
  maxBonus: number;
  claimed: boolean;
}

export interface VIPTier {
  level: number;
  name: string;
  pointsReq: number;
  dailyRebate: string;
  birthdayGift: string;
  upgradeBonus: string;
}

export interface GameWinRateConfig {
  gameId: string;
  gameName: string;
  provider: string;
  category: string;
  winRate: number; // 0 to 100 percentage
  payoutMultiplier: number;
  wildBonusRate: number;
  freeSpinRate: number;
  rigMode: 'BALANCED' | 'HIGH_PAYOUT' | 'LOW_PAYOUT' | 'JACKPOT_HUNT';
  updatedAt: string;
}
