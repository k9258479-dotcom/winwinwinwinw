import React from 'react';
import { Plus, User, LogOut, Crown, Bell } from 'lucide-react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';

interface HeaderProps {
  user: UserProfile;
  onOpenCashier: (tab?: 'deposit' | 'withdraw' | 'history') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenVIP: () => void;
  onOpenPromos: () => void;
  onSelectCategory: (cat: any) => void;
  activeCategory: string;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenCashier,
  onOpenAuth,
  onOpenVIP,
  onOpenPromos,
  onSelectCategory,
  activeCategory,
  onLogout,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element brand mark */}
        <div className="flex items-center gap-6">
          <a
            href="/"
            onClick={e => {
              e.preventDefault();
              onSelectCategory('all');
            }}
            className="text-xl sm:text-2xl font-black tracking-tighter text-amber-400 select-none whitespace-nowrap"
          >
            BET88<span className="text-white font-bold text-lg">.PH</span>
          </a>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <button
              onClick={() => onSelectCategory('all')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
                activeCategory === 'all' ? 'text-amber-400' : ''
              }`}
            >
              Lobby
            </button>
            <button
              onClick={() => onSelectCategory('slots')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
                activeCategory === 'slots' ? 'text-amber-400' : ''
              }`}
            >
              Super Ace Slot
            </button>
            <button
              onClick={onOpenPromos}
              className="text-amber-400 hover:underline transition-colors whitespace-nowrap"
            >
              Promotions
            </button>
            <button
              onClick={onOpenVIP}
              className="text-slate-300 hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              VIP Club
            </button>
          </nav>
        </div>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user.isLoggedIn ? (
            <>
              {/* Wallet Balance Badge */}
              <div
                onClick={() => {
                  sounds.playClick();
                  onOpenCashier('deposit');
                }}
                className="flex items-center bg-slate-900 border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-1 pr-2.5 sm:pr-3 cursor-pointer transition-all group"
              >
                <button
                  type="button"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black group-hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="ml-2 text-right">
                  <span className="text-[10px] text-amber-300/80 block uppercase font-bold leading-none">PHP Balance</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white font-mono tabular-nums leading-tight">
                    ₱{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* VIP Level Badge */}
              <button
                onClick={onOpenVIP}
                title="VIP Status"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500/40 text-xs text-amber-300 font-bold transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>VIP {user.vipLevel}</span>
              </button>

              {/* Player Profile & ID Badge Button */}
              <button
                onClick={onOpenProfile}
                title="View Player Profile & ID"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-amber-500/30 hover:border-amber-400/80 rounded-xl text-xs transition-all group"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[11px] font-bold text-slate-100 block group-hover:text-amber-400 transition-colors leading-none">
                    {user.username || 'Player'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold block leading-none mt-0.5">
                    {user.playerId || `ID: ${user.phone.slice(-6)}`}
                  </span>
                </div>
              </button>

              {/* User Dropdown / Logout */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenCashier('history')}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
                  title="Transactions"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-900 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:border-slate-500 transition-colors whitespace-nowrap"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 rounded-xl hover:brightness-110 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
