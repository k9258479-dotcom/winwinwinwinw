import React from 'react';
import { GamePhase } from '../types/game';
import { Sparkles, Trophy } from 'lucide-react';

interface BankerMarqueeProps {
  phase: GamePhase;
  totalWon: number;
  bet: number;
  selectedCount?: number;
  isOpeningBatch?: boolean;
  totalOpenedCount?: number;
  maxBoxesPerGame?: number;
}

export const BankerMarquee: React.FC<BankerMarqueeProps> = ({
  phase,
  totalWon,
  bet,
  selectedCount = 0,
  isOpeningBatch = false,
  totalOpenedCount = 0,
  maxBoxesPerGame = 6,
}) => {
  const multiplier = bet > 0 ? (totalWon / bet).toFixed(1) : '0.0';
  const progressRatio = Math.min(1, Math.max(0, totalOpenedCount / maxBoxesPerGame));
  const remainingInGame = Math.max(0, maxBoxesPerGame - totalOpenedCount);

  // Dynamic status text in English
  let statusText = '';
  if (isOpeningBatch) {
    statusText = `Opening ${selectedCount} ${selectedCount === 1 ? 'case' : 'cases'}...`;
  } else if (phase === 'GAME_OVER') {
    statusText = `Round Finished (${maxBoxesPerGame}/${maxBoxesPerGame} Cases)`;
  } else {
    if (selectedCount > 0) {
      statusText = `${selectedCount} selected (${remainingInGame} left) • Press Open Box`;
    } else {
      statusText = `${totalOpenedCount}/${maxBoxesPerGame} Cases Opened • Pick ${remainingInGame} more`;
    }
  }

  return (
    <div className="relative marquee-beveled-frame rounded-2xl px-3.5 py-2 text-center mt-0.5 mx-3">
      {/* Marquee Edison Bulbs Border Row */}
      <div className="absolute -top-1.5 left-4 right-4 flex justify-between pointer-events-none px-2">
        <span className="marquee-bulb w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_#ffd54f]"></span>
        <span className="marquee-bulb w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_#ffd54f]"></span>
        <span className="marquee-bulb w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_#ffd54f]"></span>
        <span className="marquee-bulb w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_#ffd54f]"></span>
        <span className="marquee-bulb w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_#ffd54f]"></span>
      </div>

      {/* Total Winnings Ribbon Badge */}
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-black font-black text-[9px] uppercase px-3 py-0.5 rounded-full shadow-[0_2px_8px_rgba(245,158,11,0.6)] tracking-widest border border-yellow-100">
        <span className="text-[8px]">★</span>
        {isOpeningBatch ? (
          <span className="flex items-center gap-1 animate-pulse text-amber-950 font-black">
            <Sparkles className="w-3 h-3 animate-spin" /> OPENING CASES...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5 text-black" /> TOTAL WINNINGS
          </span>
        )}
        <span className="text-[8px]">★</span>
      </div>

      {/* Total Won Amount and Multiplier */}
      <div className="mt-0.5 flex items-center justify-center gap-2">
        <span className="text-3xl font-black text-gold-gradient tracking-wide drop-shadow-[0_2px_12px_rgba(246,211,101,0.6)] font-mono tabular-nums">
          ₱{Math.round(totalWon).toLocaleString()}
        </span>
        <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-400/80 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.4)] tracking-wide font-mono">
          {multiplier}x TOTAL
        </span>
      </div>

      {/* Progress Indicator */}
      <div className="mt-1 flex items-center justify-center gap-2">
        <div className="h-1.5 flex-1 max-w-[70px] bg-black/60 rounded-full overflow-hidden p-0.5 border border-yellow-600/40">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_5px_#f59e0b] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }}
          ></div>
        </div>

        <p className="text-[10px] text-amber-200 font-semibold tracking-wide uppercase truncate max-w-[230px]">
          {isOpeningBatch ? (
            <span className="text-yellow-300 font-black animate-pulse">
              ⚡ Revealing now...
            </span>
          ) : (
            <span className="text-yellow-200 font-bold">{statusText}</span>
          )}
        </p>

        <div className="h-1.5 flex-1 max-w-[70px] bg-black/60 rounded-full overflow-hidden p-0.5 border border-yellow-600/40">
          <div
            className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full shadow-[0_0_5px_#f59e0b] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
