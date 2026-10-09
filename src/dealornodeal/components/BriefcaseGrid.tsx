import React from 'react';
import { Briefcase, GamePhase } from '../types/game';
import { Check } from 'lucide-react';

interface BriefcaseGridProps {
  briefcases: Briefcase[];
  phase: GamePhase;
  bet: number;
  topRemainingPrize: number;
  remainingCount: number;
  onSelectCase: (caseId: number) => void;
  selectedBoxIds: Set<number>;
  isOpeningBatch: boolean;
  recentlyRevealedIds?: Set<number>;
  totalOpenedCount?: number;
  maxBoxesPerGame?: number;
}

const BRIEFCASE_IMG_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNVo1WrTjrgn18Mt7b8JCBG8-IaMW8cOKJp6_VwlheH_hcFD7EHl2CrnCbmcU_9eq9HstH9j0tN5HjpR6gSSneb9AbukSc7La2pGP-YihaM9DpPT85X9CttPQvaOpn1Lfji5ijISt49zYUiAn13J9NZjsrLHp0fKMIhWMvjgYJ-Ug_vs7VoSzv-89QlKQ57-rriZOCIVUP8A0pkSH0jjt7JyjN-_HkTT-ZZDv-eFmDCJNVJVDNKxeMIA';

export const BriefcaseGrid: React.FC<BriefcaseGridProps> = ({
  briefcases,
  phase,
  bet,
  topRemainingPrize,
  remainingCount,
  onSelectCase,
  selectedBoxIds,
  isOpeningBatch,
  recentlyRevealedIds = new Set(),
  totalOpenedCount = 0,
  maxBoxesPerGame = 6,
}) => {
  return (
    <section
      className="relative z-20 flex-1 flex flex-col justify-start overflow-y-auto px-3 py-1 min-h-0"
      data-purpose="briefcase-stage-grid"
    >
      {/* Briefcase Stage Grid (5x7 for 35 Briefcases) */}
      <div className="w-full max-w-[384px] mx-auto grid grid-cols-5 gap-1 sm:gap-1.5 my-auto">
        {briefcases.map((bCase) => {
          const isEliminated = bCase.isOpen;
          const isSelected = selectedBoxIds.has(bCase.id);
          const isRecentlyRevealed = recentlyRevealedIds.has(bCase.id);

          // Actual prize won from this box = bet * multiplier
          const prizeWon = Math.round(bet * bCase.multiplier);
          const isWinningTier = bCase.multiplier >= 1;

          // 1. OPENED BOX (REVEALS PRIZE WON)
          if (isEliminated) {
            return (
              <div
                key={bCase.id}
                className={`flex flex-col items-center ${
                  isRecentlyRevealed ? 'case-batch-revealed z-10' : 'animate-in zoom-in-95 duration-200'
                }`}
              >
                <div
                  className={`w-full aspect-[1/0.92] rounded-[7px] flex items-center justify-center relative shadow-inner ${
                    isWinningTier
                      ? 'bg-gradient-to-b from-[#1f1604] to-[#0a0701] border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'briefcase-eliminated'
                  }`}
                >
                  <span
                    className={`font-black text-2xl select-none ${
                      isWinningTier
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                    }`}
                  >
                    {isWinningTier ? '✓' : '✕'}
                  </span>
                  <span className="absolute bottom-0.5 text-[8px] font-bold text-zinc-400 font-mono">
                    #{bCase.id}
                  </span>
                </div>

                {/* Prize won displayed */}
                <span
                  className={`text-[8px] font-black mt-0.5 font-mono whitespace-nowrap ${
                    isWinningTier
                      ? 'text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]'
                      : 'text-amber-300/90'
                  }`}
                >
                  ₱{prizeWon.toLocaleString()} ({bCase.multiplier}x)
                </span>
              </div>
            );
          }

          // 2. UNOPENED REGULAR CASE (CLICKABLE TO SELECT)
          const canClick =
            phase === 'PLAYING' && !isOpeningBatch && totalOpenedCount < maxBoxesPerGame;

          return (
            <div key={bCase.id} className="flex flex-col items-center">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => onSelectCase(bCase.id)}
                className={`w-full aspect-[1/0.92] gold-briefcase-card flex flex-col items-center justify-center p-0.5 overflow-hidden transition-all ${
                  isOpeningBatch && isSelected
                    ? 'case-opening-shake z-20'
                    : isSelected
                    ? 'case-selected-batch z-10'
                    : ''
                } ${canClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-90'}`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}

                <img
                  alt={`Case ${bCase.id}`}
                  className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] pointer-events-none"
                  src={BRIEFCASE_IMG_URL}
                  referrerPolicy="no-referrer"
                />

                <span className="absolute bottom-0.5 text-[10px] font-black text-amber-100 drop-shadow-[0_1px_2px_#000] font-mono">
                  {bCase.id}
                </span>
              </button>

              {/* Tag below unopened briefcase */}
              {isSelected ? (
                <span className="text-[9px] font-black text-yellow-300 animate-pulse tracking-wide mt-0.5 drop-shadow-[0_0_4px_#facc15]">
                  SELECTED
                </span>
              ) : (
                <span className="text-[9px] font-bold text-amber-400/60 mt-0.5 font-mono">
                  #{bCase.id}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Status Ticker Pill */}
      <div className="mx-auto mt-2 flex items-center justify-center gap-3 text-[10px] uppercase font-bold text-amber-100/90 bg-black/60 border border-yellow-500/25 px-3 py-1 rounded-full backdrop-blur-sm shadow">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_5px_#34d399]"></span>{' '}
          {totalOpenedCount} / {maxBoxesPerGame} Cases Opened
        </span>
        <span className="text-amber-500">•</span>
        <span className="text-yellow-300 font-extrabold">
          Top Prize: ₱{topRemainingPrize.toLocaleString()}
        </span>
      </div>
    </section>
  );
};
