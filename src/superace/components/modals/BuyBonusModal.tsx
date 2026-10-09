import React from 'react';
import { sound } from '../../utils/audio';

interface BuyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy: () => void;
  bet: number;
  balance: number;
}

export const BuyBonusModal: React.FC<BuyBonusModalProps> = ({
  isOpen,
  onClose,
  onConfirmBuy,
  bet,
  balance,
}) => {
  if (!isOpen) return null;

  const cost = bet * 50;
  const canAfford = balance >= cost;

  const handleBuy = () => {
    if (!canAfford) return;
    sound.playClick();
    onConfirmBuy();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[340px] bg-gradient-to-b from-[#2a0808] via-[#1a0505] to-[#0d0303] border-2 border-amber-400 rounded-2xl p-5 shadow-[0_0_30px_rgba(255,50,50,0.5)] flex flex-col items-center relative animate-win-pop">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-950 border border-amber-500/50 flex items-center justify-center text-amber-300 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-900 border-2 border-amber-300 p-1 flex flex-col items-center justify-center shadow-lg mb-3">
          <span className="text-xs font-black uppercase text-amber-200 leading-none">BUY</span>
          <span className="text-xs font-black uppercase text-white leading-none mt-1">BONUS</span>
        </div>

        <h3 className="font-game-title text-2xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 tracking-wider">
          BUY FREE SPINS
        </h3>

        <p className="text-xs text-zinc-300 text-center mt-1">
          Instantly trigger <span className="text-amber-400 font-bold">10 Free Spins</span> with doubled multipliers (<span className="text-yellow-300 font-bold">x2, x4, x6, x10</span>)!
        </p>

        {/* Price Box */}
        <div className="w-full bg-black/60 border border-amber-500/40 rounded-xl p-3 my-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase">Purchase Cost</span>
            <span className="text-xs text-amber-400">50x Bet (₱{bet})</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-amber-400 font-numbers">₱</span>
            <span className="text-2xl font-bold font-numbers text-white tracking-wider">
              {cost.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
          </div>
        </div>

        {!canAfford && (
          <span className="text-[11px] text-rose-400 mb-2 font-medium">
            Insufficient balance (₱{balance.toFixed(2)}). Please top-up first.
          </span>
        )}

        {/* Buttons */}
        <div className="w-full flex gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-zinc-300 font-bold text-xs uppercase tracking-wider hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            disabled={!canAfford}
            onClick={handleBuy}
            className={`flex-1 py-2.5 rounded-xl border-2 border-yellow-300 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all ${
              canAfford
                ? 'bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 text-black hover:brightness-110 active:scale-95'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-bolt text-xs"></i>
            Confirm Buy
          </button>
        </div>
      </div>
    </div>
  );
};
