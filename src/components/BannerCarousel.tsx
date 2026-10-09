import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BannerCarouselProps {
  onPlaySlot: () => void;
  onOpenCashier: () => void;
  onOpenPromos: () => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  onPlaySlot,
  onOpenCashier,
  onOpenPromos,
}) => {
  const [jackpot, setJackpot] = useState(48924510.82);

  // Progressive jackpot ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + 1.25 + Math.random() * 2.5);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950 mb-8 shadow-2xl">
      {/* Background Graphic */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
        <img
          src="/images/casino_hero_banner_1790656581762.jpg"
          alt="Bet88 Casino Hero"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center brightness-90 filter"
        />
        {/* Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent max-w-2xl" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-xs text-amber-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              Philippine Official Gaming Hub
            </span>
            <span className="hidden sm:inline text-slate-400">· GCash Payout Instant</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight text-balance leading-tight drop-shadow-md">
            Spin, Win & Cash Out In Seconds
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
            Experience Philippines’ leading casino platform. Play JILI Super Ace slot with cascading reels, golden wild cards, multipliers up to 10x, and massive jackpots!
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => {
                sounds.playClick();
                onPlaySlot();
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <span>Play Super Ace Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenCashier();
              }}
              className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>Deposit via GCash</span>
            </button>
          </div>
        </div>

        {/* Floating Progressive Jackpot Counter on Desktop */}
        <div className="hidden lg:flex absolute bottom-6 right-6 p-4 bg-slate-950/90 border border-amber-500/40 rounded-2xl backdrop-blur-md shadow-2xl flex-col items-end">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Grand Mega Jackpot</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
            ₱{jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">Ticking live across all active rooms</span>
        </div>
      </div>
    </div>
  );
};
