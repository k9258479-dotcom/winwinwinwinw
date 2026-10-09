import React from 'react';
import { sound } from '../../utils/audio';

interface BetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBet: number;
  onSelectBet: (bet: number) => void;
}

const BET_OPTIONS = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 40.0, 100.0, 200.0];

export const BetSelectorModal: React.FC<BetSelectorModalProps> = ({
  isOpen,
  onClose,
  currentBet,
  onSelectBet,
}) => {
  if (!isOpen) return null;

  const handlePick = (bet: number) => {
    sound.playClick();
    onSelectBet(bet);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#141d2e] via-[#0c121e] to-[#060910] border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl flex flex-col relative animate-win-pop">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <h3 className="font-game-title text-xl text-center text-amber-300 tracking-wider mb-2">
          SELECT BET AMOUNT
        </h3>

        {/* Current Bet Display */}
        <div className="flex items-center justify-center bg-black/50 border border-amber-500/30 rounded-xl py-2 px-4 mb-3">
          <span className="text-xs text-zinc-400 mr-2 uppercase">Current Bet:</span>
          <span className="font-numbers text-2xl font-bold text-amber-300">₱ {currentBet}</span>
        </div>

        {/* Chips Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {BET_OPTIONS.map(opt => {
            const isSelected = opt === currentBet;
            const unlocksMajor = opt >= 20;
            const unlocksGrand = opt >= 40;

            return (
              <button
                key={opt}
                onClick={() => handlePick(opt)}
                className={`relative py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-yellow-200 text-black shadow-[0_0_10px_#eab308] scale-105'
                    : 'bg-stone-900/90 border-zinc-700 text-white hover:border-amber-500/60 hover:bg-stone-800'
                }`}
              >
                {unlocksGrand ? (
                  <span className="absolute -top-1.5 -right-1 bg-red-600 text-[8px] font-black text-white px-1 rounded-full border border-yellow-300">
                    GRAND
                  </span>
                ) : unlocksMajor ? (
                  <span className="absolute -top-1.5 -right-1 bg-purple-600 text-[8px] font-black text-white px-1 rounded-full border border-purple-300">
                    MAJOR
                  </span>
                ) : null}

                <span
                  className={`font-numbers text-base font-bold leading-none ${
                    isSelected ? 'text-black' : 'text-amber-200'
                  }`}
                >
                  ₱{opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Tier Perks Info */}
        <div className="bg-black/40 border border-zinc-800 rounded-lg p-2 text-[10px] space-y-1 text-zinc-400">
          <div className="flex items-center gap-1.5 text-red-300">
            <i className="fa-solid fa-crown text-[9px] text-amber-400"></i>
            <span>Bet ≥ ₱40: Unlocks GRAND Jackpot (Max ₱40,000+)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-300">
            <i className="fa-solid fa-gem text-[9px] text-fuchsia-400"></i>
            <span>Bet ≥ ₱20: Unlocks MAJOR Jackpot (Max ₱15,625+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
