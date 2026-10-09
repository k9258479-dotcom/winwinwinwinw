import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  onRestart: () => void;
  winType: 'DEAL' | 'ALL_OPENED';
  payout: number;
  bet: number;
  maxBoxesPerGame?: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onRestart,
  winType,
  payout,
  bet,
  maxBoxesPerGame = 6,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#f59e0b', '#10b981', '#ffffff'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const netProfit = payout - bet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2a0910] via-[#170407] to-[#0a0103] border-2 border-yellow-500 rounded-3xl p-5 text-center shadow-[0_0_40px_rgba(255,215,0,0.4)] text-zinc-100 animate-in zoom-in-95 duration-200">
        {/* Trophy icon */}
        <div className="w-16 h-16 mx-auto -mt-10 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,215,0,0.8)] border-2 border-yellow-100">
          <Trophy className="w-9 h-9" />
        </div>

        {/* Title */}
        <h2 className="mt-3 text-xl font-black text-gold-gradient uppercase tracking-wider">
          {winType === 'DEAL' ? 'WINNINGS CLAIMED!' : `ROUND COMPLETE (${maxBoxesPerGame}/${maxBoxesPerGame})!`}
        </h2>
        <p className="text-xs text-amber-200 font-semibold uppercase">
          {winType === 'DEAL' ? 'You collected your total winnings' : `You opened all ${maxBoxesPerGame} cases in this round`}
        </p>

        {/* Big Payout Box */}
        <div className="my-4 p-3 bg-black/60 border border-yellow-500/40 rounded-2xl shadow-inner">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">
            Total Payout Won
          </span>
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)] font-mono tabular-nums">
            ₱{Math.round(payout).toLocaleString()}
          </span>
          <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-bold">
            <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
              {bet > 0 ? (payout / bet).toFixed(1) : 1}x BET
            </span>
            <span className={`font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+₱${netProfit.toLocaleString()} Net` : `-₱${Math.abs(netProfit).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black uppercase text-sm shadow-[0_4px_15px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </div>
  );
};
