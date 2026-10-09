import React, { useState } from 'react';
import { X, User, Copy, Check, ShieldCheck, Wallet, Trophy, Calendar, Phone, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenCashier: (tab?: 'deposit' | 'withdraw' | 'history') => void;
  isNewRegistration?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenCashier,
  isNewRegistration = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const playerId = user.playerId || `BET88-${user.phone.slice(-4)}${user.phone.slice(-2)}`;

  const handleCopyId = () => {
    sounds.playClick();
    navigator.clipboard.writeText(playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
              👤
            </div>
            <div>
              <h3 className="font-bold text-amber-400 text-sm tracking-wider uppercase">
                {isNewRegistration ? 'Maligayang Pagdating sa Bet88!' : 'Player Profile & Account ID'}
              </h3>
              <p className="text-[11px] text-slate-400">Opisyal na Impormasyon ng iyong Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* New Registration Celebration Banner */}
          {isNewRegistration && (
            <div className="p-3 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <span className="text-xs font-bold text-emerald-400 block">Rehistrasyon Matagumpay!</span>
                <span className="text-[11px] text-slate-300">
                  Na-credit na ang iyong <b>₱100.00 Free Welcome Bonus</b>. Heto ang iyong Player ID:
                </span>
              </div>
            </div>
          )}

          {/* Primary ID Card */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-slate-950 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl relative shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  Official Player ID Number
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black font-mono tracking-wider text-white">
                    {playerId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95"
                    title="Kopyahin ang Player ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Player
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Username</span>
                <span className="font-bold text-slate-200">{user.username || 'Player'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Registered Mobile</span>
                <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {user.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Balance & VIP Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">Wallet Balanse</span>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-lg font-black font-mono text-emerald-400 block">
                ₱{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">PHP Available Play Balance</span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">VIP Ranking</span>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-lg font-black text-amber-400 block">
                VIP Tier {user.vipLevel || 1}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">{user.vipPoints || 100} VIP Exp Points</span>
            </div>
          </div>

          {/* Account Details Ledger */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Deposited:</span>
              <span className="font-mono font-bold text-white">
                ₱{(user.totalDeposited || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Withdrawn:</span>
              <span className="font-mono font-bold text-cyan-400">
                ₱{(user.totalWithdrawn || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Bet Turnover:</span>
              <span className="font-mono font-bold text-amber-400">
                ₱{(user.turnover || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Member Since:</span>
              <span className="font-mono text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {user.registeredAt || 'Today'}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenCashier('deposit');
              }}
              className="py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4" /> Mag-Deposit (+PHP)
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCashier('withdraw');
              }}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Mag-Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
