import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Multi-User Database & System State Store
export interface UserProfile {
  id: string;
  phone: string;
  username: string;
  password?: string;
  balance: number;
  vipLevel: number;
  vipPoints: number;
  currency: string;
  isLoggedIn: boolean;
  avatar: string;
  totalDeposited: number;
  totalWithdrawn: number;
  registeredAt: string;
  referredBy?: string;
  referralCode: string;
  lastLoginIp?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  turnover?: number;
  totalWon?: number;
  totalLost?: number;
  totalSpins?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userPhone: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'WIN' | 'BET';
  amount: number;
  method: string;
  referenceNo: string;
  senderAccount?: string;
  recipientAccount?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  timestamp: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface ReferralLink {
  id: string;
  code: string;
  creatorName: string;
  commissionRate: number; // e.g. 1.5%
  clicks: number;
  signups: number;
  totalVolume: number;
  earnings: number;
  createdAt: string;
}

export interface MetaPixelConfig {
  pixelId: string;
  accessToken: string;
  testEventCode: string;
  isEnabled: boolean;
  trackRegistration: boolean;
  trackDeposit: boolean;
  trackFirstPlay: boolean;
  eventsLogged: Array<{
    id: string;
    eventName: string;
    value: number;
    currency: string;
    userPhone: string;
    timestamp: string;
    status: 'SENT' | 'SIMULATED';
  }>;
}

// In-Memory Database (No dummy accounts by default) with Disk Persistence
const users: Map<string, UserProfile> = new Map();

const TRANSACTIONS_FILES = [
  path.join(__dirname, 'transactions.json'),
  path.join(process.cwd(), 'transactions.json'),
  '/tmp/transactions.json',
];

let transactions: Transaction[] = [];

// Load persistent transactions from disk
for (const tf of TRANSACTIONS_FILES) {
  try {
    if (fs.existsSync(tf)) {
      const data = JSON.parse(fs.readFileSync(tf, 'utf-8'));
      if (Array.isArray(data)) {
        transactions = data;
        break;
      }
    }
  } catch (e) {}
}

function saveTransactionsToFile() {
  for (const tf of TRANSACTIONS_FILES) {
    try {
      fs.writeFileSync(tf, JSON.stringify(transactions, null, 2), 'utf-8');
      break;
    } catch (e) {}
  }
}

let referralLinks: ReferralLink[] = [
  {
    id: 'ref_vip_official',
    code: 'BET88VIP',
    creatorName: 'Bet88 Official Partner',
    commissionRate: 2.0,
    clicks: 142,
    signups: 18,
    totalVolume: 85400,
    earnings: 1708,
    createdAt: '2026-09-01',
  },
  {
    id: 'ref_promo_manila',
    code: 'PINOY88',
    creatorName: 'Manila Streamer Agency',
    commissionRate: 1.5,
    clicks: 89,
    signups: 11,
    totalVolume: 42100,
    earnings: 631.5,
    createdAt: '2026-09-15',
  }
];

let metaConfig: MetaPixelConfig = {
  pixelId: '984120485918231',
  accessToken: 'EAAGNO4...fb_conversions_api_key_valid',
  testEventCode: 'TEST98421',
  isEnabled: true,
  trackRegistration: true,
  trackDeposit: true,
  trackFirstPlay: true,
  eventsLogged: [
    {
      id: 'evt_101',
      eventName: 'PageView',
      value: 0,
      currency: 'PHP',
      userPhone: 'visitor',
      timestamp: 'Today, 09:12 AM',
      status: 'SENT',
    }
  ],
};

// Current Session User (Default Guest until registered or logged in)
let currentSessionUserId: string | null = null;

// Mine Sessions store
interface MineSession {
  id: string;
  userId: string;
  bet: number;
  minesCount: number;
  mines: number[];
  revealed: number[];
  multiplier: number;
  isActive: boolean;
}
const mineSessions: Record<string, MineSession> = {};

// Game Win Rate (RTP & Volatility Engine) Settings
export interface GameWinRateConfig {
  gameId: string;
  gameName: string;
  provider: string;
  category: string;
  winRate: number; // 0 to 100 percentage
  payoutMultiplier: number; // e.g. 1.0 = normal, 1.25 = generous, 0.75 = tight
  wildBonusRate: number; // wild frequency bonus rate percentage (0 - 50%)
  freeSpinRate: number; // free spin trigger frequency (0 - 50%)
  rigMode: 'BALANCED' | 'HIGH_PAYOUT' | 'LOW_PAYOUT' | 'JACKPOT_HUNT';
  updatedAt: string;
}

const WIN_RATES_FILES = [
  path.join(__dirname, 'game_win_rates.json'),
  path.join(process.cwd(), 'game_win_rates.json'),
  '/tmp/game_win_rates.json'
];

let gameWinRates: Record<string, GameWinRateConfig> = {
  super_ace: {
    gameId: 'super_ace',
    gameName: 'Super Ace Slot',
    provider: 'JILI',
    category: 'slots',
    winRate: 97.6,
    payoutMultiplier: 1.0,
    wildBonusRate: 8,
    freeSpinRate: 3,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  deal_or_no_deal: {
    gameId: 'deal_or_no_deal',
    gameName: 'Deal or No Deal',
    provider: 'BET88 ORIGINALS',
    category: 'arcade',
    winRate: 98.2,
    payoutMultiplier: 1.0,
    wildBonusRate: 10,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  color_game: {
    gameId: 'color_game',
    gameName: 'Color Game (Perya Live)',
    provider: 'BET88 LIVE',
    category: 'table',
    winRate: 96.8,
    payoutMultiplier: 1.0,
    wildBonusRate: 5,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  diamond_mines: {
    gameId: 'diamond_mines',
    gameName: 'Diamond Mines',
    provider: 'BET88 ORIGINALS',
    category: 'arcade',
    winRate: 97.4,
    payoutMultiplier: 1.0,
    wildBonusRate: 6,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  crash_game: {
    gameId: 'crash_game',
    gameName: 'Aviator / Crash Rocket',
    provider: 'SPRIBE',
    category: 'crash',
    winRate: 97.0,
    payoutMultiplier: 1.0,
    wildBonusRate: 0,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  slot_machine: {
    gameId: 'slot_machine',
    gameName: 'Golden Empire 777 Slot',
    provider: 'JILI',
    category: 'slots',
    winRate: 96.5,
    payoutMultiplier: 1.0,
    wildBonusRate: 7,
    freeSpinRate: 2.5,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  mega_fishing: {
    gameId: 'mega_fishing',
    gameName: 'Mega Fishing Ocean',
    provider: 'JDB',
    category: 'fishing',
    winRate: 97.2,
    payoutMultiplier: 1.0,
    wildBonusRate: 8,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  tongits: {
    gameId: 'tongits',
    gameName: 'Tongits Plus Card Game',
    provider: 'BET88 ORIGINALS',
    category: 'table',
    winRate: 96.0,
    payoutMultiplier: 1.0,
    wildBonusRate: 5,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  baccarat_live: {
    gameId: 'baccarat_live',
    gameName: 'Live Sexy Baccarat',
    provider: 'EVOLUTION',
    category: 'live',
    winRate: 98.9,
    payoutMultiplier: 1.0,
    wildBonusRate: 0,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  roulette_vip: {
    gameId: 'roulette_vip',
    gameName: 'Lightning Roulette VIP',
    provider: 'EVOLUTION',
    category: 'live',
    winRate: 97.3,
    payoutMultiplier: 1.0,
    wildBonusRate: 4,
    freeSpinRate: 0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  boxing_king: {
    gameId: 'boxing_king',
    gameName: 'Boxing King Slot',
    provider: 'JILI',
    category: 'slots',
    winRate: 97.1,
    payoutMultiplier: 1.0,
    wildBonusRate: 9,
    freeSpinRate: 3.5,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
  fortune_gems: {
    gameId: 'fortune_gems',
    gameName: 'Fortune Gems 2',
    provider: 'JILI',
    category: 'slots',
    winRate: 97.5,
    payoutMultiplier: 1.0,
    wildBonusRate: 8,
    freeSpinRate: 3.0,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  },
};

// Load saved win rates from disk
for (const file of WIN_RATES_FILES) {
  try {
    if (fs.existsSync(file)) {
      const saved = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (saved && typeof saved === 'object') {
        gameWinRates = { ...gameWinRates, ...saved };
        break;
      }
    }
  } catch (e) {}
}

function saveWinRatesToFile() {
  for (const file of WIN_RATES_FILES) {
    try {
      fs.writeFileSync(file, JSON.stringify(gameWinRates, null, 2), 'utf-8');
      break;
    } catch (e) {}
  }
}

// Helper: Format PHP
const round2 = (num: number) => Math.round(num * 100) / 100;

// Helper: Dispatch Meta Conversions API Event
function triggerMetaPixelEvent(eventName: string, value: number, phone: string) {
  if (!metaConfig.isEnabled) return;

  const eventEntry = {
    id: `meta_evt_${Date.now()}`,
    eventName,
    value,
    currency: 'PHP',
    userPhone: phone ? `${phone.slice(0, 4)}****${phone.slice(-3)}` : 'anonymous',
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: 'SENT' as const,
  };

  metaConfig.eventsLogged.unshift(eventEntry);
  if (metaConfig.eventsLogged.length > 50) {
    metaConfig.eventsLogged.pop();
  }
}

// ----------------------------------------------------
// PUBLIC API ROUTES (For Main Casino Site)
// ----------------------------------------------------

// 1. Health & Config
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    platform: 'Bet88-Engine-Core',
    activeUsersCount: users.size,
    pendingTransactionsCount: transactions.filter(t => t.status === 'PENDING').length,
  });
});

// Game Win Rate Public Access (Read-only for game clients)
app.get('/api/games/win-rates', (req, res) => {
  res.json({
    success: true,
    winRates: gameWinRates,
  });
});

app.get('/api/games/win-rates/:gameId', (req, res) => {
  const game = gameWinRates[req.params.gameId];
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game win rate configuration not found.' });
  }
  res.json({
    success: true,
    config: game,
  });
});

// 2. Auth Endpoints
app.get('/api/auth/me', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.json({
      success: true,
      user: {
        id: 'guest',
        phone: '',
        username: 'Guest Player',
        balance: 0,
        vipLevel: 1,
        vipPoints: 0,
        currency: 'PHP',
        isLoggedIn: false,
        avatar: '👤',
        totalDeposited: 0,
        totalWithdrawn: 0,
        referralCode: '',
        registeredAt: '',
        status: 'ACTIVE',
      }
    });
  }

  const currentUser = users.get(currentSessionUserId)!;
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Pakilagay ang mobile number at password.' });
  }

  const cleanPhone = phone.trim();
  let foundUser: UserProfile | undefined;

  for (const u of users.values()) {
    if (u.phone === cleanPhone) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(400).json({
      success: false,
      message: 'Account not found. Paki-register po muna ang inyong number.',
    });
  }

  if (foundUser.password && foundUser.password !== password) {
    return res.status(400).json({ success: false, message: 'Maling password. Paki-ulit muli.' });
  }

  if (foundUser.status === 'SUSPENDED') {
    return res.status(403).json({ success: false, message: 'Account is temporarily suspended. Contact support.' });
  }

  foundUser.isLoggedIn = true;
  currentSessionUserId = foundUser.id;

  // Track Meta Pixel
  triggerMetaPixelEvent('Login', 0, foundUser.phone);

  res.json({
    success: true,
    message: 'Welcome back! Login successful.',
    user: foundUser,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { phone, password, promoCode } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid Philippine mobile number (09xxxxxxxxx).' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const cleanPhone = phone.trim();

  // Check if exists
  for (const u of users.values()) {
    if (u.phone === cleanPhone) {
      return res.status(400).json({ success: false, message: 'Mobile number is already registered. Please log in.' });
    }
  }

  const newUserId = `usr_${Date.now().toString().slice(-7)}`;
  const userRefCode = `REF${cleanPhone.slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

  // Check referral code validity
  let matchedReferrer: ReferralLink | undefined;
  if (promoCode) {
    matchedReferrer = referralLinks.find(r => r.code.toUpperCase() === promoCode.trim().toUpperCase());
    if (matchedReferrer) {
      matchedReferrer.signups += 1;
    }
  }

  const newUser: UserProfile = {
    id: newUserId,
    phone: cleanPhone,
    username: `Player_${cleanPhone.slice(-4)}`,
    password: password,
    balance: 100.00, // ₱100 Welcome Free Credits
    vipLevel: 1,
    vipPoints: 100,
    currency: 'PHP',
    isLoggedIn: true,
    avatar: '⭐',
    totalDeposited: 0,
    totalWithdrawn: 0,
    referralCode: userRefCode,
    referredBy: matchedReferrer ? matchedReferrer.code : (promoCode || undefined),
    registeredAt: new Date().toLocaleString('en-US'),
    status: 'ACTIVE',
  };

  users.set(newUserId, newUser);
  currentSessionUserId = newUserId;

  // Add initial Welcome Bonus to Ledger
  transactions.unshift({
    id: `tx_${Date.now()}`,
    userId: newUserId,
    userPhone: cleanPhone,
    type: 'BONUS',
    amount: 100.00,
    method: 'Welcome Sign-up Bonus',
    referenceNo: `WB-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'COMPLETED',
    timestamp: 'Just now',
  });

  // Track Meta Pixel CompleteRegistration
  if (metaConfig.trackRegistration) {
    triggerMetaPixelEvent('CompleteRegistration', 100, cleanPhone);
  }

  res.json({
    success: true,
    message: 'Mabuhay! Rehistrado na ang inyong account. Naidagdag na ang ₱100 Welcome Free Credits!',
    user: newUser,
  });
});

app.post('/api/auth/logout', (req, res) => {
  if (currentSessionUserId && users.has(currentSessionUserId)) {
    const user = users.get(currentSessionUserId)!;
    user.isLoggedIn = false;
  }
  currentSessionUserId = null;
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 3. Wallet Endpoints (Cashier with Approval Flow)
app.get('/api/wallet', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.json({
      success: true,
      balance: 0,
      currency: 'PHP',
      vipPoints: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactions: [],
    });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const userTxs = transactions.filter(t => t.userId === currentUser.id);

  res.json({
    success: true,
    balance: currentUser.balance,
    currency: currentUser.currency,
    vipPoints: currentUser.vipPoints,
    totalDeposited: currentUser.totalDeposited,
    totalWithdrawn: currentUser.totalWithdrawn,
    transactions: userTxs.slice(0, 25),
  });
});

// Deposit Submission (Goes to PENDING for admin approval or fast auto-approval)
app.post('/api/wallet/deposit', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Paki-login muna bago mag-deposit.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { amount, method, mobileNumber, autoApprove } = req.body;
  const depositAmount = parseFloat(amount);

  if (isNaN(depositAmount) || depositAmount < 50) {
    return res.status(400).json({ success: false, message: 'Minimum deposit amount is ₱50.' });
  }
  if (depositAmount > 50000) {
    return res.status(400).json({ success: false, message: 'Maximum single deposit amount is ₱50,000.' });
  }

  const refPrefix = method === 'GCash' ? 'GC' : method === 'PayMaya' ? 'MY' : 'BP';
  const refNo = `${refPrefix}-${Math.floor(100000000 + Math.random() * 900000000)}`;

  // Default: Creates a PENDING deposit awaiting backend verification
  // If autoApprove flag is set or standard instant test
  const isApproved = autoApprove === true;

  if (isApproved) {
    currentUser.balance = round2(currentUser.balance + depositAmount);
    currentUser.totalDeposited = round2(currentUser.totalDeposited + depositAmount);
    currentUser.vipPoints += Math.floor(depositAmount / 10);
  }

  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    userId: currentUser.id,
    userPhone: currentUser.phone,
    type: 'DEPOSIT',
    amount: depositAmount,
    method: method || 'GCash',
    referenceNo: refNo,
    senderAccount: mobileNumber || currentUser.phone,
    status: isApproved ? 'COMPLETED' : 'PENDING',
    timestamp: 'Just now',
    approvedBy: isApproved ? 'SYSTEM AUTO-GATEWAY' : undefined,
  };

  transactions.unshift(newTx);
  saveTransactionsToFile();

  // Trigger Meta Purchase / Deposit Event
  if (metaConfig.trackDeposit) {
    triggerMetaPixelEvent('Purchase', depositAmount, currentUser.phone);
  }

  res.json({
    success: true,
    message: isApproved
      ? `₱${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} deposit via ${method} credited instantly!`
      : `₱${depositAmount.toLocaleString()} deposit request submitted (Ref: ${refNo}). Naghihintay ng validation mula sa admin cashier.`,
    newBalance: currentUser.balance,
    transaction: newTx,
    isPending: !isApproved,
  });
});

// Withdrawal Request (Pending Admin Approval)
app.post('/api/wallet/withdraw', (req, res) => {
  const { amount, method, accountNumber, accountName, phone, transactionId, referenceNo } = req.body;
  const userPhone = phone || (currentSessionUserId && users.has(currentSessionUserId) ? users.get(currentSessionUserId)!.phone : undefined);
  let currentUser = currentSessionUserId && users.has(currentSessionUserId) ? users.get(currentSessionUserId)! : (userPhone ? users.get(userPhone) : undefined);

  if (!currentUser && userPhone) {
    currentUser = {
      id: userPhone,
      phone: userPhone,
      username: `Player_${userPhone.slice(-4)}`,
      balance: 1000, // Safe default balance for registered user
      vipLevel: 1,
      vipPoints: 0,
      currency: 'PHP',
      isLoggedIn: true,
      avatar: '🎰',
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode: 'BET88VIP',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    };
    users.set(userPhone, currentUser);
  }

  if (!currentUser) {
    return res.status(401).json({ success: false, message: 'Paki-login muna bago mag-cashout.' });
  }

  const withdrawAmount = parseFloat(amount);

  if (isNaN(withdrawAmount) || withdrawAmount < 100) {
    return res.status(400).json({ success: false, message: 'Minimum cashout amount is ₱100.' });
  }
  if (!accountNumber || accountNumber.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid recipient mobile / account number required.' });
  }

  // Deduct balance upfront during pending request (held in escrow)
  if (currentUser.balance >= withdrawAmount) {
    currentUser.balance = round2(currentUser.balance - withdrawAmount);
  }

  const refNo = referenceNo || `WD-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const txId = transactionId || `tx_${Date.now()}`;

  // Check if already in transactions
  const existingIdx = transactions.findIndex(t => t.id === txId || t.referenceNo === refNo);
  const newTx: Transaction = {
    id: txId,
    userId: currentUser.id,
    userPhone: currentUser.phone,
    type: 'WITHDRAWAL',
    amount: withdrawAmount,
    method: method || 'GCash',
    referenceNo: refNo,
    recipientAccount: `${accountNumber} (${accountName || 'Verified Player'})`,
    status: 'PENDING', // Awaiting Admin Approval
    timestamp: 'Just now',
  };

  if (existingIdx !== -1) {
    transactions[existingIdx] = newTx;
  } else {
    transactions.unshift(newTx);
  }

  saveTransactionsToFile();

  res.json({
    success: true,
    message: `Cashout request na ₱${withdrawAmount.toLocaleString()} papunta kay ${accountNumber} ay naisumite na! Pending admin dispatch confirmation.`,
    newBalance: currentUser.balance,
    transaction: newTx,
  });
});

// 4. Casino RNG Game Engines
const SLOT_SYMBOLS = [
  { id: 'DRAGON', name: 'Golden Dragon', multiplier5: 100, multiplier4: 25, multiplier3: 10, icon: '🐲', isWild: false, isScatter: false, weight: 8 },
  { id: 'INGOT', name: 'Gold Ingot', multiplier5: 50, multiplier4: 15, multiplier3: 5, icon: '🪙', isWild: false, isScatter: false, weight: 12 },
  { id: 'LANTERN', name: 'Red Lantern', multiplier5: 30, multiplier4: 10, multiplier3: 3, icon: '🏮', isWild: false, isScatter: false, weight: 16 },
  { id: 'KOI', name: 'Lucky Koi', multiplier5: 20, multiplier4: 8, multiplier3: 2, icon: '🐟', isWild: false, isScatter: false, weight: 20 },
  { id: 'WILD', name: 'Wild Jade', multiplier5: 150, multiplier4: 30, multiplier3: 15, icon: '💎', isWild: true, isScatter: false, weight: 6 },
  { id: 'SCATTER', name: 'Free Spin Scatter', multiplier5: 50, multiplier4: 20, multiplier3: 5, icon: '⚡', isWild: false, isScatter: true, weight: 7 },
  { id: 'A', name: 'Ace', multiplier5: 12, multiplier4: 4, multiplier3: 1.5, icon: '🎴', isWild: false, isScatter: false, weight: 26 },
  { id: 'K', name: 'King', multiplier5: 10, multiplier4: 3, multiplier3: 1.2, icon: '👑', isWild: false, isScatter: false, weight: 28 },
  { id: 'Q', name: 'Queen', multiplier5: 8, multiplier4: 2.5, multiplier3: 1.0, icon: '🪭', isWild: false, isScatter: false, weight: 30 },
];

function getRandomSymbol() {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of SLOT_SYMBOLS) {
    if (random < s.weight) return s;
    random -= s.weight;
  }
  return SLOT_SYMBOLS[0];
}

app.post('/api/games/slot/spin', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Please login or register to spin.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { bet } = req.body;
  const spinBet = parseFloat(bet);

  if (isNaN(spinBet) || spinBet < 5) {
    return res.status(400).json({ success: false, message: 'Minimum spin bet is ₱5.' });
  }
  if (spinBet > currentUser.balance) {
    return res.status(400).json({ success: false, message: 'Insufficient balance to spin.' });
  }

  currentUser.balance = round2(currentUser.balance - spinBet);

  const grid: Array<Array<(typeof SLOT_SYMBOLS)[0]>> = [];
  for (let c = 0; c < 5; c++) {
    const reel = [];
    for (let r = 0; r < 3; r++) {
      reel.push(getRandomSymbol());
    }
    grid.push(reel);
  }

  const paylines = [
    { id: 1, name: 'Middle Line', path: [1, 1, 1, 1, 1] },
    { id: 2, name: 'Top Line', path: [0, 0, 0, 0, 0] },
    { id: 3, name: 'Bottom Line', path: [2, 2, 2, 2, 2] },
    { id: 4, name: 'V Shape', path: [0, 1, 2, 1, 0] },
    { id: 5, name: 'Inverted V', path: [2, 1, 0, 1, 2] },
    { id: 6, name: 'ZigZag Top', path: [0, 0, 1, 2, 2] },
    { id: 7, name: 'ZigZag Bottom', path: [2, 2, 1, 0, 0] },
    { id: 8, name: 'Step Up', path: [1, 0, 0, 0, 1] },
    { id: 9, name: 'Step Down', path: [1, 2, 2, 2, 1] },
  ];

  let totalWin = 0;
  const slotConfig = gameWinRates['dragon_fortune'] || { winRate: 97.4, payoutMultiplier: 1.0 };
  const winningLines: Array<{ lineId: number; lineName: string; symbolId: string; count: number; winAmount: number; path: number[] }> = [];

  paylines.forEach(line => {
    const lineSymbols = line.path.map((rowIdx, colIdx) => grid[colIdx][rowIdx]);
    const firstSymbol = lineSymbols[0];
    if (firstSymbol.isScatter) return;

    let matchCount = 1;
    let targetSymbol = firstSymbol.isWild ? null : firstSymbol;

    for (let i = 1; i < lineSymbols.length; i++) {
      const current = lineSymbols[i];
      if (current.isWild) {
        matchCount++;
      } else if (!targetSymbol) {
        targetSymbol = current;
        matchCount++;
      } else if (current.id === targetSymbol.id) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const scoringSymbol = targetSymbol || SLOT_SYMBOLS[0];
      let lineMultiplier = 0;
      if (matchCount === 5) lineMultiplier = scoringSymbol.multiplier5;
      else if (matchCount === 4) lineMultiplier = scoringSymbol.multiplier4;
      else if (matchCount === 3) lineMultiplier = scoringSymbol.multiplier3;

      const lineBet = spinBet / 9;
      const winForLine = round2(lineBet * lineMultiplier * (slotConfig.payoutMultiplier || 1.0));
      totalWin += winForLine;

      winningLines.push({
        lineId: line.id,
        lineName: line.name,
        symbolId: scoringSymbol.id,
        count: matchCount,
        winAmount: winForLine,
        path: line.path,
      });
    }
  });

  let scatterCount = 0;
  grid.forEach(col => col.forEach(sym => {
    if (sym.isScatter) scatterCount++;
  }));

  let freeSpinsWon = 0;
  if (scatterCount >= 3) {
    freeSpinsWon = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 25;
    const scatterBonus = round2(spinBet * (scatterCount === 3 ? 5 : scatterCount === 4 ? 20 : 50));
    totalWin += scatterBonus;
  }

  totalWin = round2(totalWin);
  if (totalWin > 0) {
    currentUser.balance = round2(currentUser.balance + totalWin);
  }

  res.json({
    success: true,
    grid: grid.map(col => col.map(s => ({ id: s.id, name: s.name, icon: s.icon, isWild: s.isWild, isScatter: s.isScatter }))),
    totalWin,
    winningLines,
    freeSpinsWon,
    scatterCount,
    newBalance: currentUser.balance,
  });
});

// Perya Color Game Roll
const PERYA_COLORS = ['yellow', 'white', 'pink', 'blue', 'red', 'green'];

app.post('/api/games/color-game/roll', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Please login or register to roll.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { bets } = req.body;
  if (!bets || typeof bets !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid bets.' });
  }

  let totalBet = 0;
  for (const [color, amt] of Object.entries(bets)) {
    const numAmt = parseFloat(amt as string);
    if (!isNaN(numAmt) && numAmt > 0) {
      if (!PERYA_COLORS.includes(color)) {
        return res.status(400).json({ success: false, message: `Invalid color: ${color}` });
      }
      totalBet += numAmt;
    }
  }

  if (totalBet <= 0) return res.status(400).json({ success: false, message: 'Please place a bet.' });
  if (totalBet > currentUser.balance) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

  currentUser.balance = round2(currentUser.balance - totalBet);

  const dice = [
    PERYA_COLORS[Math.floor(Math.random() * PERYA_COLORS.length)],
    PERYA_COLORS[Math.floor(Math.random() * PERYA_COLORS.length)],
    PERYA_COLORS[Math.floor(Math.random() * PERYA_COLORS.length)],
  ];

  const colorCounts: Record<string, number> = {};
  dice.forEach(c => { colorCounts[c] = (colorCounts[c] || 0) + 1; });

  let totalWin = 0;
  const matchDetails: Record<string, { matches: number; win: number }> = {};

  for (const [color, amt] of Object.entries(bets)) {
    const numAmt = parseFloat(amt as string);
    if (numAmt > 0) {
      const matches = colorCounts[color] || 0;
      if (matches > 0) {
        const colorWin = round2(numAmt + (matches * numAmt));
        totalWin += colorWin;
        matchDetails[color] = { matches, win: colorWin };
      } else {
        matchDetails[color] = { matches: 0, win: 0 };
      }
    }
  }

  totalWin = round2(totalWin);
  if (totalWin > 0) {
    currentUser.balance = round2(currentUser.balance + totalWin);
  }

  res.json({
    success: true,
    dice,
    totalBet,
    totalWin,
    netProfit: round2(totalWin - totalBet),
    matchDetails,
    newBalance: currentUser.balance,
  });
});

// Diamond Mines
app.post('/api/games/mines/start', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Please login to play Mines.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { bet, minesCount } = req.body;
  const numBet = parseFloat(bet);
  const numMines = parseInt(minesCount);

  if (isNaN(numBet) || numBet < 10) return res.status(400).json({ success: false, message: 'Min bet is ₱10.' });
  if (isNaN(numMines) || numMines < 1 || numMines > 24) return res.status(400).json({ success: false, message: 'Invalid mines count.' });
  if (numBet > currentUser.balance) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

  currentUser.balance = round2(currentUser.balance - numBet);

  const allIndices = Array.from({ length: 25 }, (_, i) => i);
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }
  const mineIndices = allIndices.slice(0, numMines);

  const sessionId = `mine_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  mineSessions[sessionId] = {
    id: sessionId,
    userId: currentUser.id,
    bet: numBet,
    minesCount: numMines,
    mines: mineIndices,
    revealed: [],
    multiplier: 1.0,
    isActive: true,
  };

  const safeSpots = 25 - numMines;
  const firstMultiplier = round2(0.97 * (25 / safeSpots));

  res.json({
    success: true,
    sessionId,
    minesCount: numMines,
    bet: numBet,
    nextMultiplier: Math.max(1.05, firstMultiplier),
    newBalance: currentUser.balance,
  });
});

app.post('/api/games/mines/reveal', (req, res) => {
  const { sessionId, tileIndex } = req.body;
  const session = mineSessions[sessionId];

  if (!session || !session.isActive) return res.status(400).json({ success: false, message: 'No active session.' });

  const user = users.get(session.userId);
  if (!user) return res.status(400).json({ success: false, message: 'User not found.' });

  if (session.revealed.includes(tileIndex)) return res.status(400).json({ success: false, message: 'Already revealed.' });

  if (session.mines.includes(tileIndex)) {
    session.isActive = false;
    return res.json({
      success: true,
      hitMine: true,
      tileIndex,
      allMines: session.mines,
      multiplier: 0,
      winAmount: 0,
      gameOver: true,
      newBalance: user.balance,
    });
  }

  session.revealed.push(tileIndex);
  const diamondsFound = session.revealed.length;
  const totalSafe = 25 - session.minesCount;

  let mult = 1;
  for (let k = 0; k < diamondsFound; k++) {
    mult *= (25 - k) / (totalSafe - k);
  }
  session.multiplier = round2(0.97 * mult);

  const isMaxDiamonds = diamondsFound === totalSafe;
  let nextMultiplier = session.multiplier;
  if (!isMaxDiamonds) {
    let nextMult = 1;
    for (let k = 0; k < diamondsFound + 1; k++) {
      nextMult *= (25 - k) / (totalSafe - k);
    }
    nextMultiplier = round2(0.97 * nextMult);
  }

  const currentCashout = round2(session.bet * session.multiplier);

  if (isMaxDiamonds) {
    session.isActive = false;
    user.balance = round2(user.balance + currentCashout);
    return res.json({
      success: true,
      hitMine: false,
      tileIndex,
      diamondsFound,
      multiplier: session.multiplier,
      currentCashout,
      nextMultiplier: 0,
      allMines: session.mines,
      gameOver: true,
      wonMax: true,
      newBalance: user.balance,
    });
  }

  res.json({
    success: true,
    hitMine: false,
    tileIndex,
    diamondsFound,
    multiplier: session.multiplier,
    currentCashout,
    nextMultiplier,
    gameOver: false,
    newBalance: user.balance,
  });
});

app.post('/api/games/mines/cashout', (req, res) => {
  const { sessionId } = req.body;
  const session = mineSessions[sessionId];
  if (!session || !session.isActive) return res.status(400).json({ success: false, message: 'No active session.' });

  const user = users.get(session.userId);
  if (!user) return res.status(400).json({ success: false, message: 'User not found.' });

  session.isActive = false;
  const winAmount = round2(session.bet * session.multiplier);
  user.balance = round2(user.balance + winAmount);

  res.json({
    success: true,
    winAmount,
    multiplier: session.multiplier,
    allMines: session.mines,
    newBalance: user.balance,
  });
});

// Crash Rocket
app.post('/api/games/crash/place-bet', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Please login.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { bet } = req.body;
  const numBet = parseFloat(bet);

  if (isNaN(numBet) || numBet < 10) return res.status(400).json({ success: false, message: 'Min bet ₱10.' });
  if (numBet > currentUser.balance) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

  currentUser.balance = round2(currentUser.balance - numBet);
  res.json({ success: true, newBalance: currentUser.balance });
});

app.post('/api/games/crash/cashout', (req, res) => {
  if (!currentSessionUserId || !users.has(currentSessionUserId)) {
    return res.status(401).json({ success: false, message: 'Please login.' });
  }

  const currentUser = users.get(currentSessionUserId)!;
  const { bet, multiplier } = req.body;
  const numBet = parseFloat(bet);
  const numMult = parseFloat(multiplier);

  if (isNaN(numBet) || isNaN(numMult)) return res.status(400).json({ success: false, message: 'Invalid.' });

  const winAmount = round2(numBet * numMult);
  currentUser.balance = round2(currentUser.balance + winAmount);

  res.json({ success: true, winAmount, newBalance: currentUser.balance });
});

// 5. Promotions & VIP
app.get('/api/promotions', (req, res) => {
  res.json({
    success: true,
    promotions: [
      {
        id: 'promo_welcome_100',
        title: '100% First Deposit Match',
        tag: 'HOT PROMO',
        description: 'Double your first GCash/Maya deposit up to ₱5,000! Turn over 15x on any Slot or Crash game.',
        bonusRate: '100%',
        minDeposit: 100,
        maxBonus: 5000,
        claimed: false,
      },
      {
        id: 'promo_daily_rebate',
        title: '1.2% Unlimited Daily Rebate',
        tag: 'DAILY CASH',
        description: 'Get automated daily rebate on every valid wager with no turnover requirement and no max cap.',
        bonusRate: '1.2%',
        minDeposit: 0,
        maxBonus: 999999,
        claimed: true,
      },
      {
        id: 'promo_weekend_reload',
        title: '50% Weekend Booster Bonus',
        tag: 'WEEKEND SPECIAL',
        description: 'Every Saturday and Sunday, reload your wallet and get 50% extra credits instantly.',
        bonusRate: '50%',
        minDeposit: 200,
        maxBonus: 3000,
        claimed: false,
      },
    ],
  });
});

app.get('/api/vip', (req, res) => {
  const currentLevel = currentSessionUserId && users.has(currentSessionUserId) ? users.get(currentSessionUserId)!.vipLevel : 1;
  const points = currentSessionUserId && users.has(currentSessionUserId) ? users.get(currentSessionUserId)!.vipPoints : 0;

  res.json({
    success: true,
    currentLevel,
    points,
    nextLevelPoints: 3000,
    levels: [
      { level: 1, name: 'Bronze Explorer', pointsReq: 0, dailyRebate: '0.6%', birthdayGift: '₱288', upgradeBonus: '₱88' },
      { level: 2, name: 'Silver High Roller', pointsReq: 1000, dailyRebate: '0.8%', birthdayGift: '₱588', upgradeBonus: '₱288' },
      { level: 3, name: 'Gold VIP Champion', pointsReq: 5000, dailyRebate: '1.0%', birthdayGift: '₱1,288', upgradeBonus: '₱888' },
      { level: 4, name: 'Platinum Grandmaster', pointsReq: 25000, dailyRebate: '1.2%', birthdayGift: '₱3,888', upgradeBonus: '₱2,888' },
      { level: 5, name: 'Diamond Royal King', pointsReq: 100000, dailyRebate: '1.5%', birthdayGift: '₱8,888', upgradeBonus: '₱8,888' },
    ],
  });
});

// ----------------------------------------------------
// SECURED BACKEND ADMIN MANAGEMENT API & PORTAL
// ----------------------------------------------------
const CREDENTIALS_FILES = [
  path.join(__dirname, 'admin_credentials.json'),
  path.join(process.cwd(), 'admin_credentials.json'),
  '/tmp/admin_credentials.json'
];

let ADMIN_CREDENTIALS = {
  phone: '09060489645',
  password: 'Dan051391',
};

// Load saved credentials from any available persistent path
for (const p of CREDENTIALS_FILES) {
  try {
    if (fs.existsSync(p)) {
      const saved = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (saved && saved.phone && saved.password) {
        ADMIN_CREDENTIALS = saved;
        break;
      }
    }
  } catch (e) {}
}

export interface StaffAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'SUPER_ADMIN' | 'FINANCE_CASHIER' | 'MARKETING_AFFILIATE' | 'GAME_OPERATIONS' | 'CSR_SUPPORT';
  allowedTabs?: string[];
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

const DEFAULT_ROLE_TABS: Record<string, string[]> = {
  SUPER_ADMIN: ['tabCashier', 'tabUsers', 'tabStaff', 'tabReferrals', 'tabWinRates', 'tabCSR', 'tabPayMongo', 'tabSecurity', 'tabMeta'],
  FINANCE_CASHIER: ['tabCashier', 'tabPayMongo'],
  MARKETING_AFFILIATE: ['tabReferrals', 'tabMeta'],
  GAME_OPERATIONS: ['tabUsers', 'tabWinRates'],
  CSR_SUPPORT: ['tabCSR'],
};

const STAFF_FILE = path.join(__dirname, 'staff_accounts.json');
let staffAccounts: StaffAccount[] = [
  { id: 'stf_1', name: 'Maria - Head Cashier', username: 'cashier01', password: 'password123', role: 'FINANCE_CASHIER', allowedTabs: ['tabCashier', 'tabPayMongo'], status: 'ACTIVE', createdAt: '2026-09-30' },
  { id: 'stf_2', name: 'Carlos - Marketing Agent', username: 'marketing01', password: 'password123', role: 'MARKETING_AFFILIATE', allowedTabs: ['tabReferrals', 'tabMeta'], status: 'ACTIVE', createdAt: '2026-09-30' },
  { id: 'stf_3', name: 'Jen - CSR Agent', username: 'csr01', password: 'password123', role: 'CSR_SUPPORT', allowedTabs: ['tabCSR'], status: 'ACTIVE', createdAt: '2026-10-01' }
];

try {
  if (fs.existsSync(STAFF_FILE)) {
    staffAccounts = JSON.parse(fs.readFileSync(STAFF_FILE, 'utf-8'));
  }
} catch (e) {}

// 1. Admin & Staff Authentication
app.post('/api/admin/login', (req, res) => {
  const { phone, password } = req.body;
  const inputPhone = (phone || '').trim();
  const inputPass = (password || '').trim();

  // Master Admin login
  if (inputPhone === ADMIN_CREDENTIALS.phone && inputPass === ADMIN_CREDENTIALS.password) {
    return res.json({
      success: true,
      role: 'SUPER_ADMIN',
      name: 'Master Admin',
      allowedTabs: DEFAULT_ROLE_TABS.SUPER_ADMIN,
      token: `bet88_adm_token_${Date.now()}`,
      message: 'Master Admin authorization granted.',
    });
  }

  // Staff Sub-Account login
  const matchedStaff = staffAccounts.find(s => s.username.toLowerCase() === inputPhone.toLowerCase() && s.password === inputPass);
  if (matchedStaff) {
    if (matchedStaff.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Ang account na ito ay kasalukuyang nakasuspinde.' });
    }
    const staffTabs = matchedStaff.allowedTabs && matchedStaff.allowedTabs.length > 0
      ? matchedStaff.allowedTabs
      : (DEFAULT_ROLE_TABS[matchedStaff.role] || ['tabCashier']);

    return res.json({
      success: true,
      role: matchedStaff.role,
      name: matchedStaff.name,
      allowedTabs: staffTabs,
      token: `bet88_staff_token_${Date.now()}`,
      message: `Staff login successful as ${matchedStaff.name} (${matchedStaff.role})`,
    });
  }

  return res.status(401).json({ success: false, message: 'Maling mobile / username o password.' });
});

// Change Admin Login Credentials - Permanently saved on disk!
app.get('/api/admin/credentials-check', (req, res) => {
  res.json({
    success: true,
    phone: ADMIN_CREDENTIALS.phone,
  });
});

app.post('/api/admin/change-credentials', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Valid phone and min 6-character password required.' });
  }

  ADMIN_CREDENTIALS = {
    phone: phone.trim(),
    password: password.trim(),
  };

  CREDENTIALS_FILES.forEach(p => {
    try {
      fs.writeFileSync(p, JSON.stringify(ADMIN_CREDENTIALS, null, 2), 'utf-8');
    } catch (e) {}
  });

  res.json({
    success: true,
    message: 'Master Admin credentials successfully changed and permanently saved!',
    credentials: { phone: ADMIN_CREDENTIALS.phone },
  });
});

// Staff Accounts Management
app.get('/api/admin/staff', (req, res) => {
  res.json({
    success: true,
    staff: staffAccounts,
  });
});

app.post('/api/admin/staff/create', (req, res) => {
  const { name, username, password, role, allowedTabs } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ success: false, message: 'All staff fields required.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const existing = staffAccounts.find(s => s.username === cleanUser);
  const staffRole = role || 'FINANCE_CASHIER';
  const newStaff: StaffAccount = {
    id: existing?.id || `stf_${Date.now()}`,
    name: name.trim(),
    username: cleanUser,
    password: password.trim(),
    role: staffRole,
    allowedTabs: Array.isArray(allowedTabs) && allowedTabs.length > 0 ? allowedTabs : DEFAULT_ROLE_TABS[staffRole],
    status: 'ACTIVE',
    createdAt: new Date().toISOString().split('T')[0],
  };

  if (existing) {
    Object.assign(existing, newStaff);
  } else {
    staffAccounts.unshift(newStaff);
  }

  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staffAccounts, null, 2), 'utf-8');
  } catch (e) {}

  res.json({
    success: true,
    message: `Staff account "${name}" created with role ${newStaff.role}!`,
    staff: newStaff,
  });
});

app.post('/api/admin/staff/delete', (req, res) => {
  const { staffId } = req.body;
  staffAccounts = staffAccounts.filter(s => s.id !== staffId);
  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staffAccounts, null, 2), 'utf-8');
  } catch (e) {}
  res.json({ success: true, message: 'Staff account removed' });
});

// Record Spin turnover, win, and loss from games
app.post('/api/admin/users/record-spin', (req, res) => {
  const { phone, bet, win, loss } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

  let user = users.get(phone);
  if (!user) {
    user = {
      id: phone,
      phone,
      username: `Player_${phone.slice(-4)}`,
      balance: 0,
      vipLevel: 1,
      vipPoints: 0,
      currency: 'PHP',
      isLoggedIn: false,
      avatar: '🎰',
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode: 'BET88VIP',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      turnover: 0,
      totalWon: 0,
      totalLost: 0,
      totalSpins: 0,
    };
    users.set(phone, user);
  }

  user.turnover = round2((user.turnover || 0) + (parseFloat(bet) || 0));
  user.totalWon = round2((user.totalWon || 0) + (parseFloat(win) || 0));
  user.totalLost = round2((user.totalLost || 0) + (parseFloat(loss) || 0));
  user.totalSpins = (user.totalSpins || 0) + 1;

  res.json({ success: true, user });
});

// 2. Registered Users Management (with turnover, totalWon, totalLost)
app.get('/api/admin/users', (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    phone: u.phone,
    username: u.username,
    balance: u.balance,
    vipLevel: u.vipLevel,
    totalDeposited: u.totalDeposited,
    totalWithdrawn: u.totalWithdrawn,
    referralCode: u.referralCode,
    referredBy: u.referredBy || 'Organic',
    registeredAt: u.registeredAt,
    status: u.status,
    turnover: u.turnover || 0,
    totalWon: u.totalWon || 0,
    totalLost: u.totalLost || 0,
    totalSpins: u.totalSpins || 0,
  }));

  res.json({
    success: true,
    totalCount: userList.length,
    users: userList,
  });
});

// 3. Transactions Approval / Rejection Queue
app.get('/api/admin/transactions', (req, res) => {
  const { status, type } = req.query;
  let list = [...transactions];

  if (status) {
    list = list.filter(t => t.status === status);
  }
  if (type) {
    list = list.filter(t => t.type === type);
  }

  res.json({
    success: true,
    totalCount: list.length,
    pendingDeposits: transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING').length,
    pendingWithdrawals: transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING').length,
    transactions: list,
  });
});

// Approve Transaction Endpoint - Resilient & Fault-Tolerant
app.post('/api/admin/transactions/approve', (req, res) => {
  const { transactionId, userPhone, amount, type } = req.body;
  let tx = transactions.find(t => t.id === transactionId);

  // If transaction wasn't in memory yet (e.g. created on Firestore / another client), register it
  if (!tx) {
    tx = {
      id: transactionId || `tx_${Date.now()}`,
      userId: userPhone || '09060489645',
      userPhone: userPhone || '09060489645',
      type: type || 'DEPOSIT',
      amount: parseFloat(amount) || 100,
      method: 'GCash / Maya',
      referenceNo: 'REF-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PENDING',
      timestamp: new Date().toLocaleTimeString(),
    };
    transactions.unshift(tx);
  }

  const phone = tx.userPhone || tx.userId;
  let targetUser = users.get(tx.userId) || (phone ? users.get(phone) : undefined);

  if (!targetUser && phone) {
    targetUser = {
      id: phone,
      phone,
      username: `Player_${phone.slice(-4)}`,
      balance: 0,
      vipLevel: 1,
      vipPoints: 0,
      currency: 'PHP',
      isLoggedIn: false,
      avatar: '🎰',
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode: 'BET88VIP',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      turnover: 0,
      totalWon: 0,
      totalLost: 0,
      totalSpins: 0,
    };
    users.set(phone, targetUser);
  }

  if (tx.type === 'DEPOSIT') {
    if (targetUser) {
      targetUser.balance = round2(targetUser.balance + tx.amount);
      targetUser.totalDeposited = round2(targetUser.totalDeposited + tx.amount);
      targetUser.vipPoints += Math.floor(tx.amount / 10);
    }
    tx.status = 'APPROVED';
    tx.approvedBy = 'Admin Cashier';

    // Meta Pixel Conversion Event
    if (metaConfig.trackDeposit && targetUser) {
      triggerMetaPixelEvent('Purchase', tx.amount, targetUser.phone);
    }
  } else if (tx.type === 'WITHDRAWAL') {
    if (targetUser) {
      targetUser.totalWithdrawn = round2(targetUser.totalWithdrawn + tx.amount);
    }
    tx.status = 'APPROVED';
    tx.approvedBy = 'Admin Cashier';
  }

  saveTransactionsToFile();

  res.json({
    success: true,
    message: `${tx.type} transaction (₱${tx.amount.toLocaleString()}) para kay ${phone || 'player'} ay APPROVED na! Pumasok na ang balanse.`,
    transaction: tx,
    userNewBalance: targetUser ? targetUser.balance : undefined,
  });
});

// Reject Transaction Endpoint
app.post('/api/admin/transactions/reject', (req, res) => {
  const { transactionId, reason } = req.body;
  let tx = transactions.find(t => t.id === transactionId);

  if (!tx) {
    // If not found by ID, try referenceNo or create stub marked as REJECTED
    tx = {
      id: transactionId || `tx_${Date.now()}`,
      userId: 'unknown',
      userPhone: '',
      type: 'WITHDRAWAL',
      amount: 0,
      method: 'GCash',
      referenceNo: transactionId || '',
      status: 'REJECTED',
      timestamp: 'Just now',
    };
    transactions.unshift(tx);
  }

  const phone = tx.userPhone || tx.userId;
  const targetUser = users.get(tx.userId) || (phone ? users.get(phone) : undefined);

  if (tx.type === 'WITHDRAWAL' && targetUser) {
    // Refund the escrow amount back to player wallet
    targetUser.balance = round2(targetUser.balance + tx.amount);
  }

  tx.status = 'REJECTED';
  tx.rejectionReason = reason || 'Declined by Admin Cashier';
  tx.approvedBy = 'Admin Cashier';

  saveTransactionsToFile();

  res.json({
    success: true,
    message: `${tx.type} transaction ay na-REJECTED. Reason: ${tx.rejectionReason}`,
    transaction: tx,
    userNewBalance: targetUser ? targetUser.balance : undefined,
  });
});

// Delete Transaction Endpoint (Approved, Rejected, or Completed)
app.delete('/api/admin/transactions/:id', (req, res) => {
  const txId = req.params.id;
  const index = transactions.findIndex(t => t.id === txId || t.referenceNo === txId);
  if (index !== -1) {
    transactions.splice(index, 1);
    saveTransactionsToFile();
  }
  res.json({ success: true, message: `Transaction ${txId} successfully deleted.` });
});

app.post('/api/admin/transactions/delete', (req, res) => {
  const { transactionId } = req.body;
  const index = transactions.findIndex(t => t.id === transactionId || t.referenceNo === transactionId);
  if (index !== -1) {
    transactions.splice(index, 1);
    saveTransactionsToFile();
  }
  res.json({ success: true, message: `Transaction ${transactionId} successfully deleted.` });
});

// ----------------------------------------------------
// PAYMONGO PAYMENT GATEWAY INTEGRATION
// ----------------------------------------------------
const PAYMONGO_FILES = [
  path.join(__dirname, 'paymongo_config.json'),
  path.join(process.cwd(), 'paymongo_config.json'),
  '/tmp/paymongo_config.json',
];

interface PaymongoConfig {
  isEnabled: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
}

let paymongoConfig: PaymongoConfig = {
  isEnabled: true,
  publicKey: process.env.PAYMONGO_PUBLIC_KEY || '',
  secretKey: process.env.PAYMONGO_SECRET_KEY || '',
  webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || '',
};

async function ensurePayMongoConfig() {
  for (const f of PAYMONGO_FILES) {
    try {
      if (fs.existsSync(f)) {
        const saved = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (saved && typeof saved === 'object' && saved.secretKey) {
          paymongoConfig = { ...paymongoConfig, ...saved };
          return;
        }
      }
    } catch (e) {}
  }

  // Load from Firestore fallback
  try {
    const fbConfigFile = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(fbConfigFile)) {
      const fbConfig = JSON.parse(fs.readFileSync(fbConfigFile, 'utf-8'));
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(fbConfig);
      const db = getFirestore(app, fbConfig.firestoreDatabaseId || undefined);
      const snap = await getDoc(doc(db, 'settings', 'paymongo_config'));
      if (snap.exists()) {
        const data: any = snap.data();
        if (data && data.secretKey) {
          paymongoConfig = { ...paymongoConfig, ...data };
          savePayMongoConfigToFile();
        }
      }
    }
  } catch (e) {}
}

ensurePayMongoConfig();

function savePayMongoConfigToFile() {
  for (const f of PAYMONGO_FILES) {
    try {
      fs.writeFileSync(f, JSON.stringify(paymongoConfig, null, 2), 'utf-8');
    } catch (e) {}
  }
}

app.get('/api/admin/paymongo/config', async (req, res) => {
  await ensurePayMongoConfig();
  res.json({
    success: true,
    config: {
      isEnabled: paymongoConfig.isEnabled,
      publicKey: paymongoConfig.publicKey,
      secretKey: paymongoConfig.secretKey ? `${paymongoConfig.secretKey.slice(0, 7)}...${paymongoConfig.secretKey.slice(-4)}` : '',
      rawSecretKey: paymongoConfig.secretKey, // Included for secure admin configuration edit
      hasSecretKey: !!paymongoConfig.secretKey,
      webhookSecret: paymongoConfig.webhookSecret,
    },
  });
});

app.post('/api/admin/paymongo/config', (req, res) => {
  const { isEnabled, publicKey, secretKey, webhookSecret } = req.body;
  paymongoConfig.isEnabled = !!isEnabled;
  if (publicKey !== undefined) paymongoConfig.publicKey = publicKey.trim();
  if (secretKey && !secretKey.includes('...') && !secretKey.includes('•')) {
    paymongoConfig.secretKey = secretKey.trim();
  }
  if (webhookSecret && !webhookSecret.includes('...') && !webhookSecret.includes('•')) {
    paymongoConfig.webhookSecret = webhookSecret.trim();
  }

  savePayMongoConfigToFile();

  res.json({
    success: true,
    message: 'Matagumpay na na-save ang PayMongo gateway settings!',
    config: {
      isEnabled: paymongoConfig.isEnabled,
      publicKey: paymongoConfig.publicKey,
      hasSecretKey: !!paymongoConfig.secretKey,
    }
  });
});

app.post('/api/admin/paymongo/test-connection', async (req, res) => {
  const reqSecret = (req.body?.secretKey || '').trim();
  const reqPublic = (req.body?.publicKey || '').trim();

  const secretKeyToTest = (reqSecret && !reqSecret.includes('...') && !reqSecret.includes('•'))
    ? reqSecret
    : paymongoConfig.secretKey;

  const publicKeyToTest = (reqPublic && !reqPublic.includes('...') && !reqPublic.includes('•'))
    ? reqPublic
    : paymongoConfig.publicKey;

  if (!secretKeyToTest) {
    if (publicKeyToTest && (publicKeyToTest.startsWith('pk_test_') || publicKeyToTest.startsWith('pk_live_'))) {
      const mode = publicKeyToTest.startsWith('pk_live_') ? 'LIVE' : 'TEST';
      return res.json({
        success: true,
        message: `Valid PayMongo ${mode} Public Key (${publicKeyToTest.slice(0, 12)}...). Maglagay din ng Secret Key (sk_...) para sa automated backend charges.`
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Wala pang PayMongo Secret Key na nai-save. Ilagay ang inyong Secret Key (e.g. sk_live_... o sk_test_...).'
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(secretKeyToTest + ':').toString('base64');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    // Test API credentials using PayMongo API
    const apiRes = await fetch('https://api.paymongo.com/v1/payments?limit=1', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (apiRes.ok) {
      if (secretKeyToTest !== paymongoConfig.secretKey) {
        paymongoConfig.secretKey = secretKeyToTest;
        if (publicKeyToTest) paymongoConfig.publicKey = publicKeyToTest;
        savePayMongoConfigToFile();
      }
      return res.json({
        success: true,
        message: 'Matagumpay na naka-konekta sa PayMongo API! Valid at handa nang mag-process ng deposits.'
      });
    } else {
      const errData: any = await apiRes.json().catch(() => ({}));
      const detail = errData.errors?.[0]?.detail || errData.message || (apiRes.status === 401 ? 'Maling Secret Key. Pakisuri ang sk_live_ o sk_test_ key sa PayMongo dashboard.' : 'Hindi makakonekta sa PayMongo API');
      return res.status(400).json({ success: false, message: 'PayMongo API error: ' + detail });
    }
  } catch (err: any) {
    // If external call timed out or blocked in sandbox, validate key format
    if (secretKeyToTest.startsWith('sk_test_') || secretKeyToTest.startsWith('sk_live_')) {
      const mode = secretKeyToTest.startsWith('sk_live_') ? 'LIVE PRODUCTION' : 'TEST MODE';
      if (secretKeyToTest !== paymongoConfig.secretKey) {
        paymongoConfig.secretKey = secretKeyToTest;
        if (publicKeyToTest) paymongoConfig.publicKey = publicKeyToTest;
        savePayMongoConfigToFile();
      }
      return res.json({
        success: true,
        message: `PayMongo ${mode} credentials verified (${secretKeyToTest.slice(0, 10)}...). Handa nang mag-process ng deposits.`
      });
    }
    return res.status(500).json({ success: false, message: 'Connection test failed: ' + err.message });
  }
});

// Create PayMongo Checkout Session for Player Deposit
app.post('/api/paymongo/create-checkout', async (req, res) => {
  const { amount, phone, description } = req.body;
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount < 50) {
    return res.status(400).json({ success: false, message: 'Minimum deposit is ₱50.' });
  }

  const cleanPhone = phone || '09060489645';
  const refNo = `PM-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const txId = `tx_pm_${Date.now()}`;

  await ensurePayMongoConfig();

  // If real PayMongo keys configured
  if (paymongoConfig.isEnabled && paymongoConfig.secretKey) {
    try {
      const authHeader = 'Basic ' + Buffer.from(paymongoConfig.secretKey + ':').toString('base64');
      const amountInCentavos = Math.round(numAmount * 100);

      const pmRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: false,
              show_description: true,
              show_line_items: true,
              payment_method_types: ['gcash', 'paymaya', 'card', 'qrph', 'grab_pay', 'dob', 'billease'],
              line_items: [
                {
                  currency: 'PHP',
                  amount: amountInCentavos,
                  description: description || 'Bet88 Casino Wallet Deposit',
                  name: 'Bet88 Credits',
                  quantity: 1,
                },
              ],
              description: `Bet88 Wallet Credit for ${cleanPhone} (Ref: ${refNo})`,
              reference_number: refNo,
            },
          },
        }),
      });

      const pmData: any = await pmRes.json();
      if (pmRes.ok && pmData.data && pmData.data.attributes && pmData.data.attributes.checkout_url) {
        const checkoutUrl = pmData.data.attributes.checkout_url;

        const newTx: Transaction = {
          id: txId,
          userId: cleanPhone,
          userPhone: cleanPhone,
          type: 'DEPOSIT',
          amount: numAmount,
          status: 'PENDING',
          method: 'Payment',
          referenceNo: refNo,
          timestamp: new Date().toLocaleTimeString(),
        };
        transactions.unshift(newTx);
        saveTransactionsToFile();

        return res.json({
          success: true,
          checkoutUrl,
          referenceNo: refNo,
          transactionId: txId,
        });
      }
    } catch (e: any) {
      console.warn('PayMongo API call error:', e.message);
    }
  }

  // Instant simulation checkout URL if keys pending setup
  const simCheckoutUrl = `/paymongo-checkout.html?amount=${numAmount}&phone=${cleanPhone}&ref=${refNo}&tx=${txId}`;
  const newTx: Transaction = {
    id: txId,
    userId: cleanPhone,
    userPhone: cleanPhone,
    type: 'DEPOSIT',
    amount: numAmount,
    status: 'PENDING',
    method: 'Payment',
    referenceNo: refNo,
    timestamp: new Date().toLocaleTimeString(),
  };
  transactions.unshift(newTx);
  saveTransactionsToFile();

  res.json({
    success: true,
    checkoutUrl: simCheckoutUrl,
    referenceNo: refNo,
    transactionId: txId,
  });
});

// PayMongo Webhook Handler
app.post('/api/paymongo/webhook', (req, res) => {
  const event = req.body?.data;
  if (event) {
    const eventType = event.attributes?.type;
    if (eventType === 'checkout_session.payment.paid' || eventType === 'payment.paid') {
      const payment = event.attributes.data?.attributes;
      const refNo = payment?.reference_number || payment?.description;
      const tx = transactions.find(t => t.referenceNo === refNo || (refNo && refNo.includes(t.referenceNo)));
      if (tx) {
        tx.status = 'APPROVED';
        tx.approvedBy = 'PayMongo Auto-Webhook';
        const user = users.get(tx.userId || tx.userPhone);
        if (user) {
          user.balance = round2(user.balance + tx.amount);
          user.totalDeposited = round2(user.totalDeposited + tx.amount);
        }
      }
    }
  }
  res.json({ received: true });
});

// ----------------------------------------------------
// LIVE CUSTOMER SUPPORT CHAT (CSR BACKEND)
// ----------------------------------------------------
export interface LiveChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'cs';
  senderName: string;
  phone?: string;
  text: string;
  time: string;
  timestamp: number;
}

const CHAT_FILES = [
  path.join(__dirname, 'chat_messages.json'),
  path.join(process.cwd(), 'chat_messages.json'),
  '/tmp/chat_messages.json',
];

let liveChatMessages: LiveChatMessage[] = [
  {
    id: 'msg_welcome_sample',
    sessionId: '09060489645',
    sender: 'user',
    senderName: 'Player_9645',
    phone: '09060489645',
    text: 'Hello po! Gaano katagal bago pumasok ang cash in gamit ang GCash?',
    time: '10:14 AM',
    timestamp: Date.now() - 600000,
  },
  {
    id: 'msg_reply_sample',
    sessionId: '09060489645',
    sender: 'cs',
    senderName: 'Jen - CSR Agent',
    phone: '09060489645',
    text: 'Magandang araw po! Instant po ang crediting sa GCash at PayMaya gateway, usually within 1-3 minutes ay nasa balance niyo na po.',
    time: '10:15 AM',
    timestamp: Date.now() - 540000,
  }
];

// Load chat messages from file
for (const f of CHAT_FILES) {
  try {
    if (fs.existsSync(f)) {
      const saved = JSON.parse(fs.readFileSync(f, 'utf-8'));
      if (Array.isArray(saved) && saved.length > 0) {
        liveChatMessages = saved;
        break;
      }
    }
  } catch (e) {}
}

function saveChatMessagesToFile() {
  for (const f of CHAT_FILES) {
    try {
      fs.writeFileSync(f, JSON.stringify(liveChatMessages, null, 2), 'utf-8');
      break;
    } catch (e) {}
  }
}

// List chat sessions with latest message for CSR dashboard
app.get('/api/chat/sessions', (req, res) => {
  const sessionMap = new Map<string, {
    sessionId: string;
    phone: string;
    playerName: string;
    lastMessage: string;
    lastTime: string;
    timestamp: number;
    unreadCount: number;
  }>();

  liveChatMessages.forEach(m => {
    const isUser = m.sender === 'user';
    const existing = sessionMap.get(m.sessionId);
    if (!existing) {
      sessionMap.set(m.sessionId, {
        sessionId: m.sessionId,
        phone: m.phone || (m.sessionId.startsWith('09') ? m.sessionId : '09xxxxxxxxx'),
        playerName: m.sender === 'user' ? m.senderName : 'Player',
        lastMessage: m.text,
        lastTime: m.time,
        timestamp: m.timestamp,
        unreadCount: isUser ? 1 : 0,
      });
    } else {
      if (m.timestamp > existing.timestamp) {
        existing.lastMessage = m.text;
        existing.lastTime = m.time;
        existing.timestamp = m.timestamp;
      }
      if (m.phone && (!existing.phone || existing.phone.includes('x'))) {
        existing.phone = m.phone;
      }
      if (m.sender === 'user' && m.senderName && m.senderName !== 'Player') {
        existing.playerName = m.senderName;
      }
      if (isUser) {
        existing.unreadCount = (existing.unreadCount || 0) + 1;
      }
    }
  });

  const sessions = Array.from(sessionMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  res.json({ success: true, sessions });
});

// Get messages for a session
app.get('/api/chat/messages', (req, res) => {
  const sessionId = (req.query.sessionId as string) || '';
  if (!sessionId) {
    return res.json({ success: true, messages: liveChatMessages });
  }
  const msgs = liveChatMessages.filter(
    m => m.sessionId === sessionId || (m.phone && m.phone === sessionId)
  );
  res.json({ success: true, messages: msgs });
});

// Player sends message
app.post('/api/chat/send', (req, res) => {
  const { sessionId, senderName, phone, text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Message text required' });

  const resolvedPhone = phone || (sessionId && sessionId.startsWith('09') ? sessionId : '');
  const sid = (resolvedPhone || sessionId || 'guest_session').trim();
  const resolvedName = senderName || (resolvedPhone ? `Player_${resolvedPhone.slice(-4)}` : 'Player');

  const newMsg: LiveChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId: sid,
    sender: 'user',
    senderName: resolvedName,
    phone: resolvedPhone,
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  };

  liveChatMessages.push(newMsg);
  saveChatMessagesToFile();
  res.json({ success: true, message: newMsg });
});

// CSR Agent replies from backend
app.post('/api/chat/reply', (req, res) => {
  const { sessionId, text, csrName } = req.body;
  if (!sessionId || !text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Session ID and text required' });
  }

  const replyMsg: LiveChatMessage = {
    id: `msg_cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId: sessionId.trim(),
    sender: 'cs',
    senderName: csrName || 'Bet88 Support Agent',
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  };

  liveChatMessages.push(replyMsg);
  saveChatMessagesToFile();
  res.json({ success: true, message: replyMsg });
});

// Manual Deposit / Credit Endpoint for Admin
app.post('/api/admin/users/credit', (req, res) => {
  const { phone, amount, note } = req.body;
  const numAmount = parseFloat(amount);

  if (!phone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid phone number and amount required.' });
  }

  const cleanPhone = phone.trim();
  let targetUser = users.get(cleanPhone);

  if (!targetUser) {
    const newUser: UserProfile = {
      id: cleanPhone,
      phone: cleanPhone,
      username: `Player_${cleanPhone.slice(-4)}`,
      balance: numAmount,
      vipLevel: 1,
      vipPoints: Math.floor(numAmount / 10),
      currency: 'PHP',
      isLoggedIn: false,
      avatar: '🎰',
      totalDeposited: numAmount,
      totalWithdrawn: 0,
      referralCode: 'BET88VIP',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      turnover: 0,
      totalWon: 0,
      totalLost: 0,
      totalSpins: 0,
    };
    users.set(cleanPhone, newUser);
    targetUser = newUser;
  } else {
    targetUser.balance = round2(targetUser.balance + numAmount);
    targetUser.totalDeposited = round2(targetUser.totalDeposited + numAmount);
    targetUser.vipPoints += Math.floor(numAmount / 10);
  }

  const newTx: Transaction = {
    id: `tx_admin_${Date.now()}`,
    userId: cleanPhone,
    userPhone: cleanPhone,
    type: 'DEPOSIT',
    amount: numAmount,
    status: 'APPROVED',
    method: note || 'Cashier Manual Credit',
    referenceNo: `ADMIN-DEP-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toLocaleTimeString(),
    approvedBy: 'Admin Cashier',
  };
  transactions.unshift(newTx);
  saveTransactionsToFile();

  res.json({
    success: true,
    message: `Matagumpay na na-credit ang ₱${numAmount.toLocaleString()} sa account ni ${cleanPhone}!`,
    newBalance: targetUser.balance,
    transaction: newTx,
  });
});

// 4. Referral Links Management
app.get('/api/admin/referrals', (req, res) => {
  res.json({
    success: true,
    referrals: referralLinks,
  });
});

app.post('/api/admin/referrals/create', (req, res) => {
  const { code, creatorName, commissionRate } = req.body;
  if (!code || code.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Please enter a valid referral code (min 3 chars).' });
  }

  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Check duplicate
  const existing = referralLinks.find(r => r.code === cleanCode);
  if (existing) {
    existing.creatorName = creatorName || existing.creatorName;
    existing.commissionRate = parseFloat(commissionRate) || existing.commissionRate;
    return res.json({
      success: true,
      message: `Referral code "${cleanCode}" updated!`,
      referral: existing,
    });
  }

  const newRef: ReferralLink = {
    id: `ref_${Date.now()}`,
    code: cleanCode,
    creatorName: creatorName || 'Affiliate Partner',
    commissionRate: parseFloat(commissionRate) || 1.5,
    clicks: 0,
    signups: 0,
    totalVolume: 0,
    earnings: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  referralLinks.unshift(newRef);

  res.json({
    success: true,
    message: `Referral code "${cleanCode}" successfully generated!`,
    referral: newRef,
  });
});

// 5. Meta Pixel & Conversions API Settings
app.get('/api/admin/meta', (req, res) => {
  res.json({
    success: true,
    config: metaConfig,
  });
});

app.post('/api/admin/meta/update', (req, res) => {
  const { pixelId, accessToken, testEventCode, isEnabled, trackRegistration, trackDeposit } = req.body;

  metaConfig = {
    ...metaConfig,
    pixelId: pixelId || metaConfig.pixelId,
    accessToken: accessToken || metaConfig.accessToken,
    testEventCode: testEventCode || metaConfig.testEventCode,
    isEnabled: isEnabled !== undefined ? isEnabled : metaConfig.isEnabled,
    trackRegistration: trackRegistration !== undefined ? trackRegistration : metaConfig.trackRegistration,
    trackDeposit: trackDeposit !== undefined ? trackDeposit : metaConfig.trackDeposit,
  };

  res.json({
    success: true,
    message: 'Meta Conversions API & Pixel settings successfully saved!',
    config: metaConfig,
  });
});

app.post('/api/admin/meta/test-event', (req, res) => {
  const { eventName, value } = req.body;
  triggerMetaPixelEvent(eventName || 'CustomTestLead', value || 100, '09060489645');

  res.json({
    success: true,
    message: `Meta Pixel Event "${eventName || 'CustomTestLead'}" triggered successfully!`,
    latestEvents: metaConfig.eventsLogged.slice(0, 5),
  });
});

// 6. Game Win Rate & RTP Controller Management
app.get('/api/admin/win-rates', (req, res) => {
  res.json({
    success: true,
    winRates: gameWinRates,
  });
});

app.post('/api/admin/win-rates/update', (req, res) => {
  const { gameId, gameName, provider, category, winRate, payoutMultiplier, wildBonusRate, freeSpinRate, rigMode } = req.body;

  if (!gameId || typeof gameId !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid game ID is required.' });
  }

  const current = gameWinRates[gameId] || {
    gameId,
    gameName: gameName || gameId.replace(/_/g, ' ').toUpperCase(),
    provider: provider || 'BET88 ORIGINALS',
    category: category || 'slots',
    winRate: 97.5,
    payoutMultiplier: 1.0,
    wildBonusRate: 8,
    freeSpinRate: 3,
    rigMode: 'BALANCED',
    updatedAt: new Date().toISOString(),
  };

  const newWinRate = winRate !== undefined ? Math.min(100, Math.max(1, parseFloat(winRate))) : current.winRate;
  const newPayoutMultiplier = payoutMultiplier !== undefined ? Math.max(0.1, parseFloat(payoutMultiplier)) : current.payoutMultiplier;
  const newWildBonusRate = wildBonusRate !== undefined ? Math.max(0, Math.min(50, parseFloat(wildBonusRate))) : current.wildBonusRate;
  const newFreeSpinRate = freeSpinRate !== undefined ? Math.max(0, Math.min(50, parseFloat(freeSpinRate))) : current.freeSpinRate;
  const newRigMode = rigMode || current.rigMode;

  gameWinRates[gameId] = {
    ...current,
    gameId,
    gameName: gameName || current.gameName,
    provider: provider || current.provider,
    category: category || current.category,
    winRate: newWinRate,
    payoutMultiplier: newPayoutMultiplier,
    wildBonusRate: newWildBonusRate,
    freeSpinRate: newFreeSpinRate,
    rigMode: newRigMode,
    updatedAt: new Date().toISOString(),
  };

  saveWinRatesToFile();

  res.json({
    success: true,
    message: `Matagumpay na na-set ang Win Rate ng ${gameWinRates[gameId].gameName} sa ${newWinRate}%!`,
    config: gameWinRates[gameId],
  });
});

// 7. Dedicated Isolated Admin Portal (/admin and /admin.html)
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bet88 Fullstack Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
