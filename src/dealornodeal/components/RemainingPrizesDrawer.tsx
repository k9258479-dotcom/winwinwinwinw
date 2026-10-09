import React from 'react';
import { X, Sparkles, Trophy } from 'lucide-react';

interface RemainingPrizesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bet: number;
  eliminatedMultipliers: Set<number>;
}

const REGULAR_TIER = [
  { mul: 0.3, countText: '20 cases on grid' },
  { mul: 0.2, countText: '10 cases on grid' },
];

const JACKPOT_TIER = [
  { mul: 10, label: '10x (3 Cases)', countText: '3 cases on grid' },
  { mul: 100, label: '100x (Major)', countText: '1 case on grid' },
  { mul: 1000, label: '1,000x (Grand)', countText: '1 case on grid' },
];

export const RemainingPrizesDrawer: React.FC<RemainingPrizesDrawerProps> = ({
  isOpen,
  onClose,
  bet,
  eliminatedMultipliers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-gradient-to-b from-[#24080d] via-[#140306] to-[#0a0103] border-2 border-yellow-500/50 rounded-2xl shadow-2xl p-4 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-black text-gold-gradient uppercase tracking-wide">
                Paytable Multipliers
              </h2>
              <p className="text-[10px] text-zinc-400">
                30 Regular Cases (20x 0.3x, 10x 0.2x) • 5 Jackpot Cases (35 Cases Total)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-yellow-400 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Column Board */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-2 gap-3 font-mono text-xs">
          {/* Regular Boxes Column */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-zinc-400 pb-1 border-b border-zinc-800 text-center">
              Regular Cases (30 pcs)
            </div>
            {REGULAR_TIER.map((item) => {
              const amount = Math.round(bet * item.mul);
              return (
                <div
                  key={item.mul}
                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-yellow-500/30 text-amber-300 font-bold shadow-sm flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">{item.mul}x</span>
                    <span className="text-emerald-400 font-mono">₱{amount.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {item.countText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Jackpot Boxes Column */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-amber-400 pb-1 border-b border-zinc-800 text-center flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" /> Jackpot Cases (5 pcs)
            </div>
            {JACKPOT_TIER.map((item) => {
              const amount = Math.round(bet * item.mul);
              const isGrand = item.mul === 1000;
              const isOut = eliminatedMultipliers.has(item.mul);
              return (
                <div
                  key={item.mul}
                  className={`p-2 rounded-xl border flex flex-col gap-0.5 transition-all ${
                    isOut
                      ? 'bg-zinc-950/80 border-rose-900/30 text-zinc-600 line-through opacity-60'
                      : isGrand
                      ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border-yellow-400 text-yellow-300 font-black shadow-[0_0_10px_rgba(255,215,0,0.4)] animate-pulse'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200 font-black shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">{item.mul}x</span>
                    <span className="font-mono">₱{amount >= 1000 ? `${(amount / 1000).toLocaleString()}k` : amount}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-sans">
                    {item.countText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-yellow-500/20 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase text-xs hover:brightness-110 active:scale-98 transition-all cursor-pointer"
          >
            Resume Game
          </button>
        </div>
      </div>
    </div>
  );
};
