import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface BigWinOverlayProps {
  isOpen: boolean;
  winAmount: number;
  bet: number;
  onClose: () => void;
}

export const BigWinOverlay: React.FC<BigWinOverlayProps> = ({
  isOpen,
  winAmount,
  bet,
  onClose,
}) => {
  const [displayedWin, setDisplayedWin] = useState(0);

  const ratio = bet > 0 ? winAmount / bet : 0;
  let tierTitle = 'BIG WIN';
  let tierColor = 'from-amber-200 via-yellow-400 to-amber-600';
  let bannerBg = 'from-amber-950 via-yellow-900 to-amber-950';

  if (ratio >= 50) {
    tierTitle = 'SUPER WIN';
    tierColor = 'from-yellow-200 via-amber-300 to-red-500';
    bannerBg = 'from-red-950 via-amber-900 to-red-950';
  } else if (ratio >= 30) {
    tierTitle = 'MEGA WIN';
    tierColor = 'from-purple-200 via-fuchsia-400 to-amber-300';
    bannerBg = 'from-purple-950 via-fuchsia-900 to-purple-950';
  }

  useEffect(() => {
    if (!isOpen) {
      setDisplayedWin(0);
      return;
    }

    // Fire celebratory confetti bursts
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff0055', '#00ffcc', '#ffffff'],
      });
    } catch {
      // Ignored
    }

    // Number ticker count up
    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = winAmount / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= winAmount) {
        setDisplayedWin(winAmount);
        clearInterval(timer);
      } else {
        setDisplayedWin(start);
      }
    }, stepTime);

    // Auto close timer
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => {
      clearInterval(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [isOpen, winAmount, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer select-none"
    >
      <div className="relative flex flex-col items-center animate-win-pop">
        {/* Glowing Background Radial Halo */}
        <div className="absolute w-72 h-72 rounded-full bg-yellow-500/20 blur-2xl animate-pulse pointer-events-none"></div>

        {/* 3D Trophy / Medal Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_25px_#f59e0b] border-2 border-yellow-200 mb-3 animate-bounce">
          <i className="fa-solid fa-trophy text-black text-3xl"></i>
        </div>

        {/* Title */}
        <div className={`px-6 py-1.5 rounded-full bg-gradient-to-r ${bannerBg} border-2 border-yellow-400 shadow-2xl mb-2`}>
          <h2
            className={`font-game-title text-4xl text-transparent bg-clip-text bg-gradient-to-b ${tierColor} tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]`}
          >
            {tierTitle}
          </h2>
        </div>

        {/* Multiplier Tag */}
        <span className="text-xs font-bold text-amber-300 tracking-wider mb-3 uppercase">
          {ratio.toFixed(1)}x Total Bet
        </span>

        {/* Amount Ticker */}
        <div className="flex items-baseline gap-1 bg-black/70 border border-yellow-500/50 rounded-2xl py-2 px-6 shadow-inner">
          <span className="font-sans text-xl font-bold text-cyan-300">₱</span>
          <span className="font-numbers text-4xl font-bold text-white tracking-wider">
            {displayedWin.toLocaleString('en-US', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          </span>
        </div>

        <span className="text-[10px] text-zinc-400 mt-4 animate-pulse">Tap anywhere to collect</span>
      </div>
    </div>
  );
};
