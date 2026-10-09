import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Plus } from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface BoxModeOption {
  boxes: number;
  bet: number;
}

export const BOX_MODES: BoxModeOption[] = [
  { boxes: 2, bet: 100 },
  { boxes: 3, bet: 200 },
  { boxes: 6, bet: 500 },
];

interface HeaderProps {
  balance: number;
  onOpenRules: () => void;
  onAddFunds: (amount: number) => void;
  isGameActive: boolean;
  maxBoxesPerGame: number;
  onSelectMaxBoxes: (boxes: number) => void;
  onClose?: () => void;
  onOpenCashier?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  balance,
  onOpenRules,
  onAddFunds,
  isGameActive,
  maxBoxesPerGame,
  onSelectMaxBoxes,
  onClose,
  onOpenCashier,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <>
      <header className="relative z-30 pt-2.5 px-3 flex flex-col gap-2">
        {/* Balance, Logo & Utility Bar */}
        <div className="flex items-center justify-between gap-1.5 backdrop-blur-md bg-black/60 border border-yellow-500/30 rounded-2xl p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {/* Balance Badge with Gold Coin */}
          <div
            onClick={() => {
              if (onOpenCashier) onOpenCashier();
              else setShowAddFundsModal(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#211105] to-[#120803] border border-amber-400/50 rounded-xl px-2.5 py-1 shadow-inner cursor-pointer hover:border-amber-300 transition-colors group"
            title="Click to reload chips"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center text-black font-black text-[11px] shadow-[0_0_8px_rgba(255,215,0,0.8)] border border-yellow-100 flex-shrink-0 group-hover:scale-105 transition-transform">
              ₱
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[7.5px] uppercase tracking-wider text-amber-300/80 font-bold flex items-center gap-1">
                Balance <Plus className="w-2 h-2 text-amber-400 opacity-60 group-hover:opacity-100" />
              </span>
              <span className="text-xs font-black tracking-tight text-white drop-shadow font-mono tabular-nums whitespace-nowrap">
                ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* DEAL OR NO DEAL Game Show Logo Badge */}
          <div
            className="flex flex-col items-center justify-center px-2.5 py-0.5 bg-gradient-to-b from-[#2a0910] via-[#160408] to-[#0a0103] border border-amber-400/50 rounded-xl shadow-[0_0_14px_rgba(255,215,0,0.35)] select-none cursor-default group"
            title="Deal or No Deal"
          >
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[11px] font-black tracking-tighter text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-sans">
                DEAL
              </span>
              <span className="text-[6.5px] font-black uppercase px-1 py-0.5 rounded bg-gradient-to-r from-red-600 via-red-500 to-rose-700 text-white shadow border border-red-400/50 leading-none">
                OR
              </span>
              <span className="text-[11px] font-black tracking-tighter text-gold-gradient drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-sans">
                NO DEAL
              </span>
            </div>
            <span className="text-[6.5px] uppercase tracking-[0.22em] text-amber-400/90 font-black scale-90 -mt-0.5">
              GOLDEN VAULT
            </span>
          </div>

          {/* Utility Buttons (Audio & Rules & Exit) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenRules();
              }}
              aria-label="Game Info and Rules"
              className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#2a130c] to-[#160805] border border-amber-400/40 text-amber-300 text-xs flex items-center justify-center shadow hover:border-yellow-300 active:scale-95 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute Audio" : "Unmute Audio"}
              className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#2a130c] to-[#160805] border border-amber-400/40 text-amber-300 text-xs flex items-center justify-center shadow hover:border-yellow-300 active:scale-95 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
            {onClose && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                aria-label="Exit to Lobby"
                className="w-7 h-7 rounded-xl bg-gradient-to-b from-red-950 to-red-900 border border-red-500/50 text-red-200 text-xs flex items-center justify-center shadow hover:border-red-400 active:scale-95 transition-all cursor-pointer font-bold"
                title="Bumalik sa Lobby"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Box Mode Selector with Direct Fixed Bets: 2 Cases (₱100) | 3 Cases (₱200) | 6 Cases (₱500) */}
        <div className="flex items-center gap-1.5 p-1 bg-black/75 backdrop-blur-md border border-yellow-500/30 rounded-2xl shadow-lg">
          <span className="text-[8px] font-black uppercase text-amber-400/90 pl-1.5 tracking-wider whitespace-nowrap">
            Mode:
          </span>
          <div className="grid grid-cols-3 gap-1 flex-1">
            {BOX_MODES.map((mode) => {
              const isSelected = maxBoxesPerGame === mode.boxes;
              return (
                <button
                  key={mode.boxes}
                  disabled={isGameActive}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectMaxBoxes(mode.boxes);
                  }}
                  className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-[0_0_12px_rgba(255,215,0,0.6)] font-black border border-yellow-200 scale-[1.02]'
                      : 'bg-[#18090b]/80 hover:bg-[#250d11] text-zinc-300 border border-yellow-500/20 disabled:opacity-40'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase leading-tight">
                    {mode.boxes} Cases
                  </span>
                  <span
                    className={`text-[9px] leading-none font-mono font-bold mt-0.5 ${
                      isSelected ? 'text-black/85 font-black' : 'text-amber-300/90'
                    }`}
                  >
                    ₱{mode.bet.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Quick Reload Balance Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-gradient-to-b from-[#25090f] to-[#120306] border-2 border-yellow-500/50 rounded-2xl p-4 shadow-2xl text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-300 font-black mb-2">
              ₱
            </div>
            <h3 className="text-sm font-black text-amber-300 uppercase">VIP Reload Chips</h3>
            <p className="text-[11px] text-zinc-400 mt-1 mb-3">Add chips to your vault balance.</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[50000, 100000, 250000, 500000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    soundManager.playClick();
                    onAddFunds(amt);
                    setShowAddFundsModal(false);
                  }}
                  className="py-2 px-1 bg-black/60 border border-yellow-500/30 hover:border-yellow-400 rounded-xl text-xs font-bold text-amber-200 hover:text-white transition-all cursor-pointer"
                >
                  +₱{(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddFundsModal(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 uppercase font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
