import React from 'react';
import { sound } from '../utils/audio';

interface BottomControlsProps {
  currentWin: number;
  balance: number;
  bet: number;
  isSpinning: boolean;
  isTurbo: boolean;
  isAuto: boolean;
  autoCount: number;
  playerLevel: number;
  onSpin: () => void;
  onToggleTurbo: () => void;
  onToggleAuto: () => void;
  onOpenBetSelector: () => void;
  onOpenSettings: () => void;
  onTopUpBalance: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  currentWin,
  balance,
  bet,
  isSpinning,
  isTurbo,
  isAuto,
  autoCount,
  playerLevel,
  onSpin,
  onToggleTurbo,
  onToggleAuto,
  onOpenBetSelector,
  onOpenSettings,
  onTopUpBalance,
}) => {
  const handleSpinPress = () => {
    sound.playClick();
    onSpin();
  };

  return (
    <footer className="relative z-20 w-full flex flex-col select-none">
      {/* Big WIN Display Banner */}
      <div className="w-full flex items-center justify-center py-0.5 bg-gradient-to-r from-transparent via-[#09352e]/80 to-transparent min-h-[30px]">
        <div className="flex items-baseline gap-2">
          <span className="font-game-title text-xl text-yellow-400 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            WIN
          </span>
          <span className="font-numbers text-2xl font-bold text-white tracking-wide flex items-center">
            <span className="text-sm mr-1 font-sans text-cyan-300">₱</span>
            {currentWin.toLocaleString('en-US', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          </span>
        </div>
      </div>

      {/* Wooden / Curved Casino Table Border Rim */}
      <div className="w-full h-2 bg-gradient-to-b from-[#5c2a16] via-[#3a1a0e] to-[#180803] border-t border-amber-700/60 shadow-lg"></div>

      {/* Control Dashboard Buttons Area */}
      <div className="w-full px-3 py-2 bg-gradient-to-b from-[#0b1322] via-[#080d19] to-[#04060c] flex items-center justify-between">
        {/* Left: Settings Gear & Bet Amount Controls */}
        <div className="flex items-center gap-2">
          {/* Settings Icon */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-full bg-stone-800/80 border border-stone-600 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 shadow transition-colors"
            title="Settings & Game Rules"
          >
            <i className="fa-solid fa-gear text-xs"></i>
          </button>

          {/* Bet Selector */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenBetSelector();
            }}
            className="flex items-center bg-black/60 hover:bg-black/80 rounded-full border border-amber-600/40 px-2 py-1 shadow-inner active:scale-95 transition-all text-left"
            title="Select Bet Amount"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-400 flex items-center justify-center text-[10px] text-white shadow mr-1">
              <i className="fa-solid fa-coins"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-400 leading-none">Bet</span>
              <span className="text-xs font-bold text-amber-300 font-numbers leading-none">
                ₱ {bet}
              </span>
            </div>
          </button>
        </div>

        {/* Center: Glowing 3D Golden Spin Button */}
        <div className="relative flex items-center justify-center -mt-3">
          {/* Button Outer Ring / Glow */}
          <div
            className={`absolute w-16 h-16 rounded-full bg-yellow-500/25 blur-md pointer-events-none ${
              isSpinning ? 'animate-spin opacity-80' : 'animate-pulse'
            }`}
          ></div>
          <button
            id="spin-button"
            disabled={isSpinning && !isTurbo}
            onClick={handleSpinPress}
            className={`relative w-14 h-14 rounded-full bg-gradient-to-b from-[#ffe57f] via-[#ffaa00] to-[#b37400] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_#ffffff] border-2 border-yellow-200 active:scale-90 transition-transform flex items-center justify-center ${
              isSpinning ? 'brightness-90 cursor-not-allowed' : 'cursor-pointer hover:brightness-105'
            }`}
            title="Spin (Spacebar)"
          >
            {/* Inner Bevel Circle */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-inner border border-amber-300">
              <i
                className={`fa-solid fa-arrows-rotate text-yellow-950 text-xl font-black transition-transform ${
                  isSpinning ? 'animate-spin' : ''
                }`}
              ></i>
              <span className="text-[7px] font-black uppercase text-amber-950 -mt-0.5 tracking-tighter">
                {isSpinning ? 'STOP' : 'SPIN'}
              </span>
            </div>
          </button>
        </div>

        {/* Right: Autoplay & Lightning Turbo Buttons */}
        <div className="flex items-center gap-2">
          {/* Autoplay Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                sound.playClick();
                onToggleAuto();
              }}
              className={`w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 shadow transition-all ${
                isAuto
                  ? 'bg-amber-500 border-yellow-300 text-black shadow-[0_0_8px_#f59e0b]'
                  : 'bg-gradient-to-b from-stone-800 to-stone-900 border-amber-600/40 text-amber-400 hover:text-amber-200'
              }`}
              title={isAuto ? `Auto Spin Active (${autoCount})` : 'Start Auto Spin'}
            >
              {isAuto ? (
                <span className="text-[10px] font-black">{autoCount}</span>
              ) : (
                <i className="fa-solid fa-rotate text-xs"></i>
              )}
            </button>
            <span
              className={`text-[7px] font-ui mt-0.5 ${
                isAuto ? 'text-amber-300 font-bold' : 'text-zinc-400'
              }`}
            >
              Auto
            </span>
          </div>

          {/* Lightning / Turbo Spin Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                sound.playClick();
                onToggleTurbo();
              }}
              className={`w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 shadow transition-all ${
                isTurbo
                  ? 'bg-amber-500 border-yellow-200 text-black shadow-[0_0_8px_#f59e0b]'
                  : 'bg-gradient-to-b from-amber-950 to-stone-900 border-amber-500/60 text-yellow-400 hover:text-yellow-200'
              }`}
              title={isTurbo ? 'Turbo Mode ON' : 'Turn on Turbo Mode'}
            >
              <i className="fa-solid fa-bolt text-xs"></i>
            </button>
            <span
              className={`text-[7px] font-ui mt-0.5 ${
                isTurbo ? 'text-yellow-300 font-bold' : 'text-zinc-400'
              }`}
            >
              Turbo
            </span>
          </div>
        </div>
      </div>

      {/* System Status Bar (Level, Balance, Wi-Fi status) */}
      <div className="w-full bg-[#030509] px-3 py-1 flex items-center justify-between border-t border-zinc-800/80 text-[10px] text-zinc-400 font-ui">
        {/* Player Level Badge */}
        <div className="flex items-center gap-1">
          <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-bold px-1 rounded uppercase tracking-wider">
            LV {playerLevel}
          </span>
        </div>

        {/* Current Balance */}
        <div
          onClick={() => {
            sound.playClick();
            onTopUpBalance();
          }}
          className="flex items-center cursor-pointer hover:opacity-90 active:scale-95 transition-all group"
          title="Click to Top-Up Free Demo Balance"
        >
          <span className="text-zinc-400 mr-1.5">Balance</span>
          <span className="text-white font-bold font-numbers text-xs tracking-wider flex items-center">
            <span className="text-amber-400 mr-0.5 text-[10px]">₱</span>
            {balance.toLocaleString('en-US', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          </span>
          <span className="ml-1 text-[9px] text-emerald-400 group-hover:scale-125 transition-transform">
            +
          </span>
        </div>

        {/* Network Wi-Fi indicator */}
        <div className="flex items-center text-emerald-500 text-xs gap-1" title="Connected">
          <i className="fa-solid fa-wifi"></i>
        </div>
      </div>
    </footer>
  );
};
