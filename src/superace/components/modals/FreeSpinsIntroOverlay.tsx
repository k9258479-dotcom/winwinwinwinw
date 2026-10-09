import React from 'react';
import { sound } from '../../utils/audio';

interface FreeSpinsIntroOverlayProps {
  isOpen: boolean;
  onStart: () => void;
  count: number;
}

export const FreeSpinsIntroOverlay: React.FC<FreeSpinsIntroOverlayProps> = ({
  isOpen,
  onStart,
  count,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="relative flex flex-col items-center max-w-[340px] text-center animate-win-pop">
        {/* Glow */}
        <div className="absolute w-64 h-64 rounded-full bg-fuchsia-600/20 blur-3xl animate-pulse pointer-events-none"></div>

        {/* Floating Icons */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-purple-500 via-fuchsia-600 to-indigo-900 border-2 border-fuchsia-300 flex items-center justify-center shadow-[0_0_30px_#d946ef] mb-3 animate-bounce">
          <i className="fa-solid fa-gem text-amber-300 text-3xl"></i>
        </div>

        <h2 className="font-game-title text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 tracking-wider">
          CONGRATULATIONS!
        </h2>

        <div className="py-2 px-6 rounded-2xl bg-gradient-to-r from-purple-950/90 via-fuchsia-950/90 to-purple-950/90 border-2 border-fuchsia-400 my-3 shadow-lg">
          <span className="font-numbers text-5xl font-black text-white tracking-widest block leading-none">
            {count}
          </span>
          <span className="font-game-title text-xl text-amber-300 tracking-wider block mt-1 uppercase">
            FREE SPINS WON!
          </span>
        </div>

        <div className="bg-black/60 border border-fuchsia-500/40 rounded-xl p-3 mb-4 text-xs text-zinc-300">
          <p className="mb-1 text-fuchsia-300 font-bold">✨ Multipliers Doubled!</p>
          <div className="flex justify-center gap-3 font-numbers text-base font-bold text-amber-300">
            <span>x2</span>
            <span>➔</span>
            <span>x4</span>
            <span>➔</span>
            <span>x6</span>
            <span>➔</span>
            <span className="text-yellow-400 font-black">x10</span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playGoldenTransform();
            onStart();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 text-black font-black text-sm uppercase tracking-widest shadow-[0_0_15px_#f59e0b] border border-yellow-200 active:scale-95 transition-transform"
        >
          START FREE GAME
        </button>
      </div>
    </div>
  );
};
