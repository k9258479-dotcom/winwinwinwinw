import { UserProfile, Transaction, Promotion, VIPTier, SlotSpinResponse, SlotSymbol, GameWinRateConfig } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Helper for local storage persistence fallback & immediate speed
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem('bet88_' + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem('bet88_' + key, JSON.stringify(val));
  } catch {}
}

const DEFAULT_GUEST: UserProfile = {
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
};

const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'DRAGON', name: 'Golden Dragon', icon: '🐲', isWild: false, isScatter: false, multiplier3: 15, multiplier4: 50, multiplier5: 200 },
  { id: 'INGOT', name: 'Gold Ingot', icon: '🪙', isWild: false, isScatter: false, multiplier3: 10, multiplier4: 30, multiplier5: 100 },
  { id: 'KOI', name: 'Lucky Koi', icon: '🐟', isWild: false, isScatter: false, multiplier3: 8, multiplier4: 25, multiplier5: 75 },
  { id: 'LANTERN', name: 'Red Lantern', icon: '🏮', isWild: false, isScatter: false, multiplier3: 6, multiplier4: 20, multiplier5: 50 },
  { id: 'A', name: 'Ace', icon: '🎴', isWild: false, isScatter: false, multiplier3: 4, multiplier4: 15, multiplier5: 35 },
  { id: 'K', name: 'King', icon: '👑', isWild: false, isScatter: false, multiplier3: 3, multiplier4: 10, multiplier5: 25 },
  { id: 'Q', name: 'Queen', icon: '🪭', isWild: false, isScatter: false, multiplier3: 2, multiplier4: 8, multiplier5: 20 },
  { id: 'WILD', name: 'Wild Jade', icon: '💎', isWild: true, isScatter: false, multiplier3: 20, multiplier4: 80, multiplier5: 300 },
  { id: 'SCATTER', name: 'Free Spin', icon: '⚡', isWild: false, isScatter: true, multiplier3: 5, multiplier4: 20, multiplier5: 50 },
];

function getRandomSymbol(): SlotSymbol {
  const rand = Math.random() * 100;
  if (rand < 5) return SLOT_SYMBOLS[8]; // Scatter
  if (rand < 12) return SLOT_SYMBOLS[7]; // Wild
  if (rand < 22) return SLOT_SYMBOLS[0]; // Dragon
  if (rand < 34) return SLOT_SYMBOLS[1]; // Ingot
  if (rand < 48) return SLOT_SYMBOLS[2]; // Koi
  if (rand < 62) return SLOT_SYMBOLS[3]; // Lantern
  if (rand < 75) return SLOT_SYMBOLS[4]; // Ace
  if (rand < 88) return SLOT_SYMBOLS[5]; // King
  return SLOT_SYMBOLS[6]; // Queen
}

export const api = {
  // Current session user
  async getCurrentUser(): Promise<{ success: boolean; user: UserProfile }> {
    // 1. Try local session
    const cachedUser = getLocalItem<UserProfile | null>('currentUser', null);
    if (cachedUser && cachedUser.isLoggedIn) {
      // Sync fresh balance from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', cachedUser.phone));
        if (userDoc.exists()) {
          const freshData = userDoc.data() as UserProfile;
          const merged = { ...cachedUser, ...freshData, isLoggedIn: true };
          setLocalItem('currentUser', merged);
          return { success: true, user: merged };
        }
      } catch {}
      return { success: true, user: cachedUser };
    }

    return { success: true, user: DEFAULT_GUEST };
  },

  // Login
  async login(phone: string, password: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, message: 'Maglagay ng valid Philippine mobile number (09...).' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Kailangang hindi bababa sa 6 characters ang password.' };
    }

    try {
      // Check in Firestore
      const userDocRef = doc(db, 'users', cleanPhone);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password && userData.password !== password) {
          return { success: false, message: 'Maling password. Pakisubukang muli.' };
        }
        const playerId = userData.playerId || `ID-${cleanPhone.slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        const loggedUser: UserProfile = {
          id: cleanPhone,
          playerId,
          phone: cleanPhone,
          username: userData.username || `Player_${cleanPhone.slice(-4)}`,
          balance: userData.balance ?? 100,
          vipLevel: userData.vipLevel || 1,
          vipPoints: userData.vipPoints || 0,
          currency: 'PHP',
          isLoggedIn: true,
          avatar: userData.avatar || '🎰',
          totalDeposited: userData.totalDeposited || 0,
          totalWithdrawn: userData.totalWithdrawn || 0,
          registeredAt: userData.registeredAt || new Date().toISOString().split('T')[0],
        };
        setLocalItem('currentUser', loggedUser);
        return { success: true, message: 'Login successful!', user: loggedUser };
      }

      // Check LocalStorage fallback
      const localUsers = getLocalItem<Record<string, any>>('registered_accounts', {});
      if (localUsers[cleanPhone]) {
        if (localUsers[cleanPhone].password !== password) {
          return { success: false, message: 'Maling password.' };
        }
        const playerId = localUsers[cleanPhone].playerId || `ID-${cleanPhone.slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        const loggedUser: UserProfile = {
          ...localUsers[cleanPhone],
          playerId,
          isLoggedIn: true,
        };
        setLocalItem('currentUser', loggedUser);
        return { success: true, message: 'Login successful!', user: loggedUser };
      }

      return { success: false, message: 'Wala pang account ang mobile number na ito. Paki-pili ang REGISTER.' };
    } catch (err: unknown) {
      // If Firestore network error, try local fallback
      const localUsers = getLocalItem<Record<string, any>>('registered_accounts', {});
      if (localUsers[cleanPhone] && localUsers[cleanPhone].password === password) {
        const playerId = localUsers[cleanPhone].playerId || `ID-${cleanPhone.slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        const loggedUser: UserProfile = {
          ...localUsers[cleanPhone],
          playerId,
          isLoggedIn: true,
        };
        setLocalItem('currentUser', loggedUser);
        return { success: true, message: 'Login successful!', user: loggedUser };
      }
      return { success: false, message: (err as Error).message || 'Hindi makapag-login sa kasalukuyan.' };
    }
  },

  // Register with Instant ₱100 Bonus & Firebase Sync
  async register(phone: string, password: string, promoCode?: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, message: 'Maglagay ng valid Philippine mobile number (09...).' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Kailangang hindi bababa sa 6 characters ang password.' };
    }

    // 1. DUPLICATE CHECK: Verify if mobile number is already registered in LocalStorage
    const localUsers = getLocalItem<Record<string, any>>('registered_accounts', {});
    if (localUsers[cleanPhone]) {
      return {
        success: false,
        message: 'Ang numero na ito ay nakarehistro na sa sistema ng Bet88. Mangyaring mag-log in na lamang.',
      };
    }

    // 2. DUPLICATE CHECK: Verify if mobile number is already registered in Firestore
    try {
      const userDocRef = doc(db, 'users', cleanPhone);
      const existingSnap = await getDoc(userDocRef);
      if (existingSnap.exists()) {
        return {
          success: false,
          message: 'Ang numero na ito ay nakarehistro na sa sistema ng Bet88. Mangyaring mag-log in na lamang.',
        };
      }
    } catch (err) {
      console.warn('Firestore duplicate check error, checking backend...', err);
    }

    // 3. DUPLICATE CHECK: Check with Express Backend API
    try {
      const backendRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password, promoCode }),
      });
      const backendData = await backendRes.json().catch(() => ({}));
      if (!backendRes.ok || (backendData && backendData.success === false)) {
        if (backendData.message && backendData.message.toLowerCase().includes('already registered')) {
          return {
            success: false,
            message: 'Ang numero na ito ay nakarehistro na sa sistema ng Bet88. Mangyaring mag-log in na lamang.',
          };
        }
      }
    } catch (e) {
      console.warn('Backend API registration call skipped or offline:', e);
    }

    const playerId = `ID-${cleanPhone.slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const regDate = new Date().toISOString().split('T')[0];

    const newUser: UserProfile = {
      id: cleanPhone,
      playerId,
      phone: cleanPhone,
      username: `Player_${cleanPhone.slice(-4)}`,
      balance: 100, // ₱100 Welcome Free Credit Bonus
      vipLevel: 1,
      vipPoints: 100,
      currency: 'PHP',
      isLoggedIn: true,
      avatar: '🎰',
      totalDeposited: 0,
      totalWithdrawn: 0,
      registeredAt: regDate,
    };

    try {
      // 1. Save to Firebase Firestore
      const userDocRef = doc(db, 'users', cleanPhone);
      await setDoc(userDocRef, {
        ...newUser,
        password,
        referralCode: promoCode || 'BET88VIP',
        createdAt: new Date().toISOString(),
        registeredAt: regDate,
      }, { merge: true });

      // Save initial welcome bonus transaction in transactions subcollection/collection
      const bonusTxId = `tx_welcome_${Date.now()}`;
      await setDoc(doc(db, 'transactions', bonusTxId), {
        id: bonusTxId,
        userId: cleanPhone,
        userPhone: cleanPhone,
        type: 'BONUS',
        amount: 100,
        currency: 'PHP',
        status: 'COMPLETED',
        method: 'Welcome Promo Free Play',
        referenceNo: `BONUS-${cleanPhone.slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore direct write fallback to local storage:', e);
    }

    // 2. Always persist to localStorage for instant reliability & offline backup
    localUsers[cleanPhone] = { ...newUser, password, referralCode: promoCode || 'BET88VIP' };
    setLocalItem('registered_accounts', localUsers);
    setLocalItem('currentUser', newUser);

    // Add bonus transaction to local history
    const txs = getLocalItem<Transaction[]>('transactions', []);
    txs.unshift({
      id: `tx_welcome_${Date.now()}`,
      userId: cleanPhone,
      userPhone: cleanPhone,
      type: 'BONUS',
      amount: 100,
      currency: 'PHP',
      status: 'COMPLETED',
      method: 'Welcome Promo Free Play',
      referenceNo: `BONUS-${cleanPhone.slice(-4)}`,
      timestamp: 'Today, Just now',
      createdAt: new Date().toISOString(),
    });
    setLocalItem('transactions', txs);

    return {
      success: true,
      message: 'Maligayang pagdating sa Bet88! Na-credit na ang iyong ₱100 Free Welcome Bonus!',
      user: newUser,
    };
  },

  // Logout
  async logout(): Promise<{ success: boolean }> {
    setLocalItem('currentUser', null);
    return { success: true };
  },

  // Wallet
  async getWallet(): Promise<{ success: boolean; balance: number; currency: string; transactions: Transaction[] }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    const balance = user ? user.balance : 0;
    let transactions: Transaction[] = getLocalItem<Transaction[]>('transactions', []);

    if (user && user.isLoggedIn) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.phone));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            success: true,
            balance: data.balance ?? balance,
            currency: 'PHP',
            transactions,
          };
        }
      } catch {}
    }

    return {
      success: true,
      balance,
      currency: 'PHP',
      transactions,
    };
  },

  // Deposit Request (GCash / Maya)
  async deposit(amount: number, method: string, mobileNumber: string): Promise<{ success: boolean; message: string; newBalance?: number; transaction?: Transaction }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    const userPhone = user && user.isLoggedIn ? user.phone : mobileNumber;
    const refNo = `GC-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userPhone,
      userPhone,
      type: 'DEPOSIT',
      amount,
      currency: 'PHP',
      status: 'PENDING',
      method,
      referenceNo: refNo,
      timestamp: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString(),
    };

    // 1. Save directly into Firestore collection 'transactions' with exact matching ID
    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
    } catch (e) {
      console.warn('Firestore deposit write error:', e);
    }

    // 2. Also POST to backend Express API so server.ts has it in memory
    try {
      await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, mobileNumber: userPhone, referenceNo: refNo, transactionId: newTx.id }),
      });
    } catch {}

    // 3. Save to localStorage
    const txs = getLocalItem<Transaction[]>('transactions', []);
    txs.unshift(newTx);
    setLocalItem('transactions', txs);

    return {
      success: true,
      message: `Deposit request of ₱${amount.toLocaleString()} via ${method} is submitted! Admin will verify reference: ${refNo}`,
      transaction: newTx,
      newBalance: user ? user.balance : 0,
    };
  },

  // Record Player Game Spin (Turnover, Win, Loss)
  async recordPlayerGameSpin(spinData: {
    bet: number;
    win: number;
    isFreeGame?: boolean;
    gameId?: string;
  }): Promise<void> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || !user.isLoggedIn || !user.phone) return;

    const phone = user.phone;
    const betAmount = spinData.isFreeGame ? 0 : spinData.bet;
    const winAmount = spinData.win;
    const lossAmount = Math.max(0, betAmount - winAmount);

    // 1. Update Firestore user document
    try {
      const userRef = doc(db, 'users', phone);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const d = snap.data();
        const currentTurnover = (d.turnover || 0) + betAmount;
        const currentTotalWon = (d.totalWon || 0) + winAmount;
        const currentTotalLost = (d.totalLost || 0) + lossAmount;
        const currentTotalSpins = (d.totalSpins || 0) + 1;
        await updateDoc(userRef, {
          turnover: Math.round(currentTurnover * 100) / 100,
          totalWon: Math.round(currentTotalWon * 100) / 100,
          totalLost: Math.round(currentTotalLost * 100) / 100,
          totalSpins: currentTotalSpins,
          lastActive: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error recording spin to Firestore:', e);
    }

    // 2. Update localStorage
    try {
      const localUsers = getLocalItem<Record<string, any>>('registered_accounts', {});
      if (localUsers[phone]) {
        localUsers[phone].turnover = Math.round(((localUsers[phone].turnover || 0) + betAmount) * 100) / 100;
        localUsers[phone].totalWon = Math.round(((localUsers[phone].totalWon || 0) + winAmount) * 100) / 100;
        localUsers[phone].totalLost = Math.round(((localUsers[phone].totalLost || 0) + lossAmount) * 100) / 100;
        localUsers[phone].totalSpins = (localUsers[phone].totalSpins || 0) + 1;
        setLocalItem('registered_accounts', localUsers);
      }
    } catch {}

    // 3. Notify backend API
    try {
      await fetch('/api/games/record-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bet: betAmount, win: winAmount }),
      });
    } catch {}
  },

  // Withdraw Request
  async withdraw(amount: number, method: string, accountNumber: string, accountName: string): Promise<{ success: boolean; message: string; newBalance?: number; transaction?: Transaction }> {
    if (amount < 200) {
      return { success: false, message: 'Ang minimum withdrawal ay ₱200.00.' };
    }

    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || user.balance < amount) {
      return { success: false, message: 'Hindi sapat ang iyong balanse para mag-withdraw.' };
    }

    user.balance = Math.round((user.balance - amount) * 100) / 100;
    setLocalItem('currentUser', user);

    const refNo = `WD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: user.phone,
      userPhone: user.phone,
      type: 'WITHDRAWAL',
      amount,
      currency: 'PHP',
      status: 'PENDING',
      method,
      referenceNo: refNo,
      recipientAccount: `${accountNumber} (${accountName})`,
      timestamp: 'Today, Just now',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
      await updateDoc(doc(db, 'users', user.phone), { balance: user.balance });
    } catch {}

    // Also notify Express backend
    try {
      await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method,
          accountNumber,
          accountName,
          phone: user.phone,
          transactionId: newTx.id,
          referenceNo: refNo,
        }),
      });
    } catch {}

    const txs = getLocalItem<Transaction[]>('transactions', []);
    txs.unshift(newTx);
    setLocalItem('transactions', txs);

    return {
      success: true,
      message: `Withdrawal request of ₱${amount.toLocaleString()} submitted. Ipapadala sa iyong ${method} account (${accountNumber}).`,
      transaction: newTx,
      newBalance: user.balance,
    };
  },

  // Game: Super Golden Fortune Slot
  async spinSlot(bet: number): Promise<SlotSpinResponse> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || !user.isLoggedIn) {
      return {
        success: false,
        grid: [],
        totalWin: 0,
        winningLines: [],
        freeSpinsWon: 0,
        scatterCount: 0,
        newBalance: 0,
        message: 'Please login or register to spin.'
      };
    }

    if (user.balance < bet) {
      return {
        success: false,
        grid: [],
        totalWin: 0,
        winningLines: [],
        freeSpinsWon: 0,
        scatterCount: 0,
        newBalance: user.balance,
        message: 'Insufficient balance to spin.'
      };
    }

    user.balance = Math.round((user.balance - bet) * 100) / 100;

    // Generate 5x3 Grid
    const grid: SlotSymbol[][] = [];
    for (let c = 0; c < 5; c++) {
      const col: SlotSymbol[] = [];
      for (let r = 0; r < 3; r++) {
        col.push(getRandomSymbol());
      }
      grid.push(col);
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
        if (matchCount === 5) lineMultiplier = scoringSymbol.multiplier5 || 50;
        else if (matchCount === 4) lineMultiplier = scoringSymbol.multiplier4 || 20;
        else if (matchCount === 3) lineMultiplier = scoringSymbol.multiplier3 || 5;

        const lineBet = bet / 9;
        const winForLine = Math.round(lineBet * lineMultiplier * 100) / 100;
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
      const scatterBonus = Math.round(bet * (scatterCount === 3 ? 5 : scatterCount === 4 ? 20 : 50) * 100) / 100;
      totalWin += scatterBonus;
    }

    totalWin = Math.round(totalWin * 100) / 100;
    if (totalWin > 0) {
      user.balance = Math.round((user.balance + totalWin) * 100) / 100;
    }

    setLocalItem('currentUser', user);

    // Save balance update to Firestore
    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return {
      success: true,
      grid: grid.map(col => col.map(s => ({ id: s.id, name: s.name, icon: s.icon, isWild: s.isWild, isScatter: s.isScatter }))),
      totalWin,
      winningLines,
      freeSpinsWon,
      scatterCount,
      newBalance: user.balance,
    };
  },

  // Game: Perya Color Game
  async rollColorGame(bets: Record<string, number>): Promise<{
    success: boolean;
    dice: string[];
    totalBet: number;
    totalWin: number;
    netProfit: number;
    matchDetails: Record<string, { matches: number; win: number }>;
    newBalance: number;
    message?: string;
  }> {
    const PERYA_COLORS = ['yellow', 'white', 'pink', 'blue', 'red', 'green'];
    const user = getLocalItem<UserProfile | null>('currentUser', null);

    if (!user || !user.isLoggedIn) {
      return {
        success: false,
        dice: ['yellow', 'white', 'pink'],
        totalBet: 0,
        totalWin: 0,
        netProfit: 0,
        matchDetails: {},
        newBalance: 0,
        message: 'Please login or register to roll.'
      };
    }

    let totalBet = 0;
    for (const [, amt] of Object.entries(bets)) {
      const numAmt = parseFloat(amt as unknown as string);
      if (!isNaN(numAmt) && numAmt > 0) {
        totalBet += numAmt;
      }
    }

    if (totalBet <= 0) {
      return {
        success: false,
        dice: ['yellow', 'white', 'pink'],
        totalBet: 0,
        totalWin: 0,
        netProfit: 0,
        matchDetails: {},
        newBalance: user.balance,
        message: 'Maglagay ng taya sa kahit isang kulay.'
      };
    }

    if (totalBet > user.balance) {
      return {
        success: false,
        dice: ['yellow', 'white', 'pink'],
        totalBet: 0,
        totalWin: 0,
        netProfit: 0,
        matchDetails: {},
        newBalance: user.balance,
        message: 'Kulang ang iyong balanse.'
      };
    }

    user.balance = Math.round((user.balance - totalBet) * 100) / 100;

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
      const numAmt = parseFloat(amt as unknown as string);
      if (numAmt > 0) {
        const matches = colorCounts[color] || 0;
        if (matches > 0) {
          const colorWin = Math.round((numAmt + (matches * numAmt)) * 100) / 100;
          totalWin += colorWin;
          matchDetails[color] = { matches, win: colorWin };
        } else {
          matchDetails[color] = { matches: 0, win: 0 };
        }
      }
    }

    totalWin = Math.round(totalWin * 100) / 100;
    if (totalWin > 0) {
      user.balance = Math.round((user.balance + totalWin) * 100) / 100;
    }

    setLocalItem('currentUser', user);

    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return {
      success: true,
      dice,
      totalBet,
      totalWin,
      netProfit: Math.round((totalWin - totalBet) * 100) / 100,
      matchDetails,
      newBalance: user.balance,
    };
  },

  // Game: Diamond Mines
  async startMines(bet: number, minesCount: number): Promise<{
    success: boolean;
    sessionId?: string;
    minesCount?: number;
    bet?: number;
    nextMultiplier?: number;
    newBalance?: number;
    message?: string;
  }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || !user.isLoggedIn) return { success: false, message: 'Please login to play Mines.' };
    if (bet > user.balance) return { success: false, message: 'Insufficient balance.' };

    user.balance = Math.round((user.balance - bet) * 100) / 100;
    setLocalItem('currentUser', user);

    // Pick mine locations
    const mines: number[] = [];
    while (mines.length < minesCount) {
      const rand = Math.floor(Math.random() * 25);
      if (!mines.includes(rand)) mines.push(rand);
    }

    const sessionId = `mine_${Date.now()}`;
    setLocalItem('active_mine_session', {
      sessionId,
      bet,
      minesCount,
      mines,
      revealed: [],
      multiplier: 1.0,
      isActive: true,
    });

    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return {
      success: true,
      sessionId,
      minesCount,
      bet,
      nextMultiplier: Math.round((1.0 + (minesCount * 0.15)) * 100) / 100,
      newBalance: user.balance,
    };
  },

  async revealMineTile(sessionId: string, tileIndex: number): Promise<{
    success: boolean;
    hitMine?: boolean;
    tileIndex?: number;
    diamondsFound?: number;
    multiplier?: number;
    currentCashout?: number;
    nextMultiplier?: number;
    allMines?: number[];
    gameOver?: boolean;
    wonMax?: boolean;
    newBalance?: number;
    message?: string;
  }> {
    const session = getLocalItem<any>('active_mine_session', null);
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!session || !session.isActive || !user) return { success: false, message: 'No active session.' };

    if (session.mines.includes(tileIndex)) {
      session.isActive = false;
      setLocalItem('active_mine_session', session);
      return {
        success: true,
        hitMine: true,
        tileIndex,
        allMines: session.mines,
        gameOver: true,
        newBalance: user.balance,
      };
    }

    if (!session.revealed.includes(tileIndex)) {
      session.revealed.push(tileIndex);
    }

    const diamondsFound = session.revealed.length;
    const baseMult = 1.0 + (session.minesCount * 0.12 * diamondsFound);
    session.multiplier = Math.round(baseMult * 100) / 100;
    setLocalItem('active_mine_session', session);

    return {
      success: true,
      hitMine: false,
      tileIndex,
      diamondsFound,
      multiplier: session.multiplier,
      currentCashout: Math.round(session.bet * session.multiplier * 100) / 100,
      nextMultiplier: Math.round((session.multiplier + 0.3) * 100) / 100,
      gameOver: false,
      newBalance: user.balance,
    };
  },

  async cashoutMines(sessionId: string): Promise<{
    success: boolean;
    winAmount?: number;
    multiplier?: number;
    allMines?: number[];
    newBalance?: number;
    message?: string;
  }> {
    const session = getLocalItem<any>('active_mine_session', null);
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!session || !session.isActive || !user) return { success: false, message: 'No active session.' };

    session.isActive = false;
    const winAmount = Math.round(session.bet * session.multiplier * 100) / 100;
    user.balance = Math.round((user.balance + winAmount) * 100) / 100;

    setLocalItem('active_mine_session', session);
    setLocalItem('currentUser', user);

    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return {
      success: true,
      winAmount,
      multiplier: session.multiplier,
      allMines: session.mines,
      newBalance: user.balance,
    };
  },

  // Game: Crash Rocket
  async placeCrashBet(bet: number): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || !user.isLoggedIn) return { success: false, message: 'Please login.' };
    if (bet > user.balance) return { success: false, message: 'Insufficient balance.' };

    user.balance = Math.round((user.balance - bet) * 100) / 100;
    setLocalItem('currentUser', user);

    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return { success: true, newBalance: user.balance };
  },

  async cashoutCrash(bet: number, multiplier: number): Promise<{ success: boolean; winAmount?: number; newBalance?: number; message?: string }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user || !user.isLoggedIn) return { success: false, message: 'Please login.' };

    const winAmount = Math.round(bet * multiplier * 100) / 100;
    user.balance = Math.round((user.balance + winAmount) * 100) / 100;
    setLocalItem('currentUser', user);

    try {
      updateDoc(doc(db, 'users', user.phone), { balance: user.balance }).catch(() => {});
    } catch {}

    return { success: true, winAmount, newBalance: user.balance };
  },

  // Promotions & VIP
  async getPromotions(): Promise<{ success: boolean; promotions: Promotion[] }> {
    return {
      success: true,
      promotions: [
        {
          id: 'promo_welcome_100',
          title: '₱100 Free Welcome Bonus',
          tag: 'INSTANT CREDIT',
          description: 'Instant ₱100 credited upon registration! No deposit required. Play any Slots or Crash game immediately.',
          bonusRate: 'FREE ₱100',
          minDeposit: 0,
          maxBonus: 100,
          claimed: true,
        },
        {
          id: 'promo_welcome_match',
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
        }
      ]
    };
  },

  async getVipInfo(): Promise<{ success: boolean; currentLevel: number; points: number; nextLevelPoints: number; levels: VIPTier[] }> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    const level = user ? user.vipLevel : 1;
    const points = user ? user.vipPoints : 100;

    return {
      success: true,
      currentLevel: level,
      points,
      nextLevelPoints: 1000,
      levels: [
        { level: 1, name: 'Bronze Explorer', pointsReq: 0, dailyRebate: '0.6%', birthdayGift: '₱288', upgradeBonus: '₱88' },
        { level: 2, name: 'Silver High Roller', pointsReq: 1000, dailyRebate: '0.8%', birthdayGift: '₱588', upgradeBonus: '₱288' },
        { level: 3, name: 'Gold VIP Champion', pointsReq: 5000, dailyRebate: '1.0%', birthdayGift: '₱1,288', upgradeBonus: '₱888' },
        { level: 4, name: 'Platinum Grandmaster', pointsReq: 25000, dailyRebate: '1.2%', birthdayGift: '₱3,888', upgradeBonus: '₱2,888' },
        { level: 5, name: 'Diamond Royal King', pointsReq: 100000, dailyRebate: '1.5%', birthdayGift: '₱8,888', upgradeBonus: '₱8,888' },
      ]
    };
  },

  // Direct balance updater for gameplay synchronization (e.g. Super Ace)
  async updateUserBalance(newBalance: number): Promise<void> {
    const user = getLocalItem<UserProfile | null>('currentUser', null);
    if (!user) return;
    user.balance = Math.round(newBalance * 1000) / 1000;
    setLocalItem('currentUser', user);

    if (user.phone) {
      try {
        await updateDoc(doc(db, 'users', user.phone), { balance: user.balance });
      } catch {}
    }
  },

  // Game Win Rate Management
  async getGameWinRates(): Promise<{ success: boolean; winRates: Record<string, GameWinRateConfig> }> {
    try {
      const res = await fetch('/api/games/win-rates');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {}

    // Fallback default
    return {
      success: true,
      winRates: {
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
        }
      }
    };
  },

  async getGameWinRate(gameId: string): Promise<GameWinRateConfig> {
    const fallbackDefault: GameWinRateConfig = {
      gameId,
      gameName: 'Super Ace Slot',
      provider: 'JILI',
      category: 'slots',
      winRate: 97.6,
      payoutMultiplier: 1.0,
      wildBonusRate: 8,
      freeSpinRate: 3,
      rigMode: 'BALANCED',
      updatedAt: new Date().toISOString(),
    };

    // 1. Try Backend API first - directly reads real-time server config!
    try {
      const res = await fetch(`/api/games/win-rates/${gameId}?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          // Immediately update localStorage so offline/static fallback stays aligned
          const stored = getLocalItem<Record<string, any>>('game_win_rates', {});
          stored[gameId] = data.config;
          setLocalItem('game_win_rates', stored);
          return { ...fallbackDefault, ...data.config };
        }
      }
    } catch {}

    // 2. Try Firestore direct (for standalone Vercel / serverless deployments)
    try {
      const snap = await getDoc(doc(db, 'settings', 'game_win_rates'));
      if (snap.exists()) {
        const rates = snap.data();
        if (rates[gameId]) {
          return {
            ...fallbackDefault,
            ...rates[gameId]
          };
        }
      }
    } catch {}

    // 3. Try LocalStorage (for static hosting)
    try {
      const stored = getLocalItem<Record<string, any>>('game_win_rates', {});
      if (stored[gameId]) {
        return {
          ...fallbackDefault,
          ...stored[gameId]
        };
      }
    } catch {}

    return fallbackDefault;
  },

  async updateGameWinRate(config: Partial<GameWinRateConfig> & { gameId: string }): Promise<{ success: boolean; message: string; config?: GameWinRateConfig }> {
    // Sync to Firestore
    try {
      await setDoc(doc(db, 'settings', 'game_win_rates'), { [config.gameId]: config }, { merge: true });
    } catch {}

    // Sync to LocalStorage
    try {
      const stored = getLocalItem<Record<string, any>>('game_win_rates', {});
      stored[config.gameId] = { ...(stored[config.gameId] || {}), ...config };
      setLocalItem('game_win_rates', stored);
    } catch {}

    try {
      const res = await fetch('/api/admin/win-rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await res.json();
    } catch (err: any) {
      return { success: true, message: `Win rate successfully updated for ${config.gameId}!` };
    }
  }
};
