import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BannerCarousel } from './components/BannerCarousel';
import { ProviderBar } from './components/ProviderBar';
import { CategoryNav } from './components/CategoryNav';
import { GameCard } from './components/GameCard';
import { SuperAceGame } from './superace/SuperAceGame';
import { DealOrNoDealGame } from './dealornodeal/DealOrNoDealGame';
import { CashierModal } from './components/CashierModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { PromotionsModal } from './components/PromotionsModal';
import { VIPModal } from './components/VIPModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { Footer } from './components/Footer';

import { api } from './services/api';
import { GAMES_CATALOG } from './data/games';
import { UserProfile, GameItem, GameCategory, Transaction, Promotion, VIPTier } from './types';
import { Home, Gift, PlusCircle, Gamepad2, User, Trophy, Play } from 'lucide-react';
import { sounds } from './utils/audio';

export default function App() {
  // User Profile & Wallet State (Empty initial state until user registers or logs in)
  const [user, setUser] = useState<UserProfile>({
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
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vipTiers, setVipTiers] = useState<VIPTier[]>([]);

  // Navigation & Filtering
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierTab, setCashierTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [promosOpen, setPromosOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);

  // Active Interactive Game
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam === 'super_ace' || gameParam === 'superace' || gameParam === 'super-ace') {
        if (user.isLoggedIn) {
          setActiveGame(GAMES_CATALOG[0]);
        }
      } else if (gameParam === 'deal_or_no_deal' || gameParam === 'dealornodeal' || gameParam === 'deal-or-no-deal') {
        if (user.isLoggedIn) {
          setActiveGame(GAMES_CATALOG[1] || GAMES_CATALOG[0]);
        }
      } else {
        setActiveGame(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user.isLoggedIn]);

  // Initial Data Fetching from fullstack Express backend
  useEffect(() => {
    async function loadInitialData() {
      const userRes = await api.getCurrentUser();
      let isAuthed = false;
      if (userRes.success && userRes.user) {
        setUser(userRes.user);
        isAuthed = userRes.user.isLoggedIn;
      }

      const walletRes = await api.getWallet();
      if (walletRes.success && walletRes.transactions) {
        setTransactions(walletRes.transactions);
      }

      const promoRes = await api.getPromotions();
      if (promoRes.success && promoRes.promotions) {
        setPromotions(promoRes.promotions);
      }

      const vipRes = await api.getVipInfo();
      if (vipRes.success && vipRes.levels) {
        setVipTiers(vipRes.levels);
      }

      // Check URL query: ?game=super_ace or ?game=deal_or_no_deal
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam === 'super_ace' || gameParam === 'superace' || gameParam === 'super-ace') {
        if (isAuthed) {
          setActiveGame(GAMES_CATALOG[0]);
        } else {
          setAuthMode('register');
          setAuthNotice('Kailangan mong mag-register o mag-login muna bago makapaglaro ng Super Ace Slot!');
          setAuthOpen(true);
        }
      } else if (gameParam === 'deal_or_no_deal' || gameParam === 'dealornodeal' || gameParam === 'deal-or-no-deal') {
        if (isAuthed) {
          setActiveGame(GAMES_CATALOG[1] || GAMES_CATALOG[0]);
        } else {
          setAuthMode('register');
          setAuthNotice('Kailangan mong mag-register o mag-login muna bago makapaglaro ng Deal or No Deal!');
          setAuthOpen(true);
        }
      }
    }

    loadInitialData();
  }, []);

  // Periodic wallet refresh to sync approved deposits automatically
  useEffect(() => {
    if (!user.isLoggedIn) return;
    const interval = setInterval(() => {
      handleRefreshWallet();
    }, 6000);
    return () => clearInterval(interval);
  }, [user.isLoggedIn]);

  const handleRefreshWallet = async () => {
    const walletRes = await api.getWallet();
    if (walletRes.success) {
      setUser(prev => ({ ...prev, balance: walletRes.balance }));
      if (walletRes.transactions) {
        setTransactions(walletRes.transactions);
      }
    }
  };

  const handleBalanceUpdate = (newBal: number) => {
    setUser(prev => ({ ...prev, balance: newBal }));
    api.updateUserBalance(newBal);
  };

  const handleOpenCashier = (tab: 'deposit' | 'withdraw' | 'history' = 'deposit') => {
    sounds.playClick();
    setCashierTab(tab);
    setCashierOpen(true);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', notice?: string) => {
    sounds.playClick();
    setAuthMode(mode);
    setAuthNotice(notice);
    setAuthOpen(true);
  };

  const handleLogout = async () => {
    sounds.playClick();
    await api.logout();
    setUser(prev => ({ ...prev, isLoggedIn: false }));
    setActiveGame(null);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    handleRefreshWallet();
    // If user was trying to play game, launch it now!
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam === 'deal_or_no_deal' || gameParam === 'dealornodeal' || gameParam === 'deal-or-no-deal') {
      setActiveGame(GAMES_CATALOG[1] || GAMES_CATALOG[0]);
    } else if (gameParam) {
      setActiveGame(GAMES_CATALOG[0]);
    }
  };

  const handleLaunchGame = (game: GameItem) => {
    sounds.playClick();
    // Requirement 3: Must register / log in first before playing
    if (!user.isLoggedIn) {
      handleOpenAuth('register', `Kailangan mong mag-register o mag-login muna bago makapaglaro ng ${game.title}!`);
      return;
    }
    setActiveGame(game);
    // Push clean game URL
    const url = new URL(window.location.href);
    const gameParamKey = game.id === 'game_deal_or_no_deal' ? 'deal_or_no_deal' : 'super_ace';
    url.searchParams.set('game', gameParamKey);
    window.history.pushState({ game: gameParamKey }, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseGame = () => {
    sounds.playClick();
    setActiveGame(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    window.history.pushState({}, '', url.toString());
  };

  // Filtered games catalog
  const filteredGames = GAMES_CATALOG.filter(game => {
    const matchesCategory =
      activeCategory === 'all' ? true : game.category === activeCategory;
    const matchesProvider =
      selectedProvider === 'ALL' ? true : game.provider === selectedProvider;
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.provider.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesProvider && matchesSearch;
  });

  // Synchronize document title with active game
  useEffect(() => {
    if (activeGame) {
      document.title = `${activeGame.title} - Bet88 Gaming`;
    } else {
      document.title = 'Bet88 Gaming Platform - Online Casino & Arcade';
    }
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top 1-row 3-zone Header Contract */}
      <Header
        user={user}
        onOpenCashier={handleOpenCashier}
        onOpenAuth={handleOpenAuth}
        onOpenVIP={() => {
          sounds.playClick();
          setVipOpen(true);
        }}
        onOpenPromos={() => {
          sounds.playClick();
          setPromosOpen(true);
        }}
        onSelectCategory={(cat) => {
          if (cat === 'slots') {
            handleLaunchGame(GAMES_CATALOG[0]);
          } else {
            if (activeGame) handleCloseGame();
            setActiveCategory(cat);
          }
        }}
        activeCategory={activeCategory}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* When Game is Active: Direct Full Screen Game Experience */}
      {activeGame ? (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start overflow-y-auto w-screen h-screen select-none animate-fadeIn">
          {/* Top Floating Controls Bar */}
          <header className="sticky top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 z-50 flex items-center justify-between w-[96%] max-w-4xl mx-auto my-1 pointer-events-none">
            <button
              onClick={handleCloseGame}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 text-xs font-bold shadow-2xl backdrop-blur-md transition-all active:scale-95"
            >
              <span>←</span>
              <span>Bumalik sa Lobby</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balanse:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ₱{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => handleOpenCashier('deposit')}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-full text-[10px] uppercase hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20"
              >
                + Cash In
              </button>
            </div>
          </header>

          {/* Interactive Full Screen Game */}
          <div className="w-full min-h-full flex items-start justify-center pb-12 overflow-y-auto">
            {activeGame.id === 'game_deal_or_no_deal' ? (
              <DealOrNoDealGame
                userBalance={user.balance}
                onBalanceUpdate={handleBalanceUpdate}
                onClose={handleCloseGame}
                onOpenCashier={() => handleOpenCashier('deposit')}
              />
            ) : (
              <SuperAceGame
                userBalance={user.balance}
                onBalanceUpdate={handleBalanceUpdate}
                onClose={handleCloseGame}
                onOpenCashier={() => handleOpenCashier('deposit')}
              />
            )}
          </div>
        </div>
      ) : (
        /* When No Game Active: Main Lobby View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {/* Hero Promotional Banner */}
          <BannerCarousel
            onPlaySlot={() => handleLaunchGame(GAMES_CATALOG[0])}
            onOpenCashier={() => handleOpenCashier('deposit')}
            onOpenPromos={() => setPromosOpen(true)}
          />

          {/* Top Provider Bar */}
          <ProviderBar
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
          />

          {/* Category Navigation & Search Bar */}
          <CategoryNav
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Games Grid Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
                {activeCategory === 'all'
                  ? 'Popular Casino Games'
                  : `${activeCategory.toUpperCase()} COLLECTION`}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Showing {filteredGames.length} Games
              </span>
            </div>

            {filteredGames.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400">No games found matching your search filter.</p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedProvider('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPlay={handleLaunchGame}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Footer with PAGCOR & 21+ Disclaimers */}
      <Footer />

      {/* Floating 24/7 CS Support Chat */}
      <LiveChatWidget />

      {/* Mobile Bottom Navigation Bar (15% mobile sticky cap compliant) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] text-slate-400">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame(null);
            setActiveCategory('all');
          }}
          className="flex flex-col items-center gap-1 hover:text-amber-400"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setPromosOpen(true);
          }}
          className="flex flex-col items-center gap-1 hover:text-amber-400"
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>Promos</span>
        </button>

        <button
          onClick={() => handleOpenCashier('deposit')}
          className="flex flex-col items-center -mt-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 p-2.5 rounded-full shadow-lg shadow-amber-500/30"
        >
          <PlusCircle className="w-5 h-5 font-black" />
          <span className="font-extrabold text-[9px]">DEPOSIT</span>
        </button>

        <button
          onClick={() => handleLaunchGame(GAMES_CATALOG[0])}
          className="flex flex-col items-center gap-1 hover:text-amber-400"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Slots</span>
        </button>

        <button
          onClick={() => (user.isLoggedIn ? setProfileOpen(true) : handleOpenAuth('login'))}
          className="flex flex-col items-center gap-1 hover:text-amber-400"
        >
          <User className="w-4 h-4" />
          <span>{user.isLoggedIn ? 'Profile' : 'Login'}</span>
        </button>
      </nav>

      {/* Modals */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onOpenCashier={handleOpenCashier}
      />

      <CashierModal
        isOpen={cashierOpen}
        onClose={() => setCashierOpen(false)}
        userBalance={user.balance}
        onBalanceUpdate={handleBalanceUpdate}
        transactions={transactions}
        onRefreshWallet={handleRefreshWallet}
        initialTab={cashierTab}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
        noticeMessage={authNotice}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <PromotionsModal
        isOpen={promosOpen}
        onClose={() => setPromosOpen(false)}
        promotions={promotions}
        onDepositClick={() => handleOpenCashier('deposit')}
      />

      <VIPModal
        isOpen={vipOpen}
        onClose={() => setVipOpen(false)}
        currentLevel={user.vipLevel}
        currentPoints={user.vipPoints}
        levels={vipTiers}
      />
    </div>
  );
}
