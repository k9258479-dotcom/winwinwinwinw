import React from 'react';
import { MULTIPLIERS, FREE_MULTIPLIERS } from '../utils/gameLogic';

interface MultiplierBarProps {
  currentMultiplierIndex: number;
  isFreeGame: boolean;
}

export const MultiplierBar: React.FC<MultiplierBarProps> = ({
  currentMultiplierIndex,
  isFreeGame,
}) => {
  const steps = isFreeGame ? FREE_MULTIPLIERS : MULTIPLIERS;

  return (
    <div className="w-[92%] mt-1 bg-gradient-to-r from-amber-950/70 via-stone-900/90 to-amber-950/70 border border-amber-500/40 rounded-full h-8 px-4 flex items-center justify-between shadow-inner">
      {steps.map((val, idx) => {
        const isActive = idx === currentMultiplierIndex;
        return (
          <div
            key={val}
            className={`flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-b from-amber-400 to-yellow-600 px-3 py-0.5 rounded-full shadow-[0_0_10px_#ffd700] border border-yellow-200 scale-105'
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            <span
              className={`font-numbers text-xl font-bold leading-none ${
                isActive ? 'text-black font-black' : 'text-amber-200'
              }`}
            >
              x{val}
            </span>
          </div>
        );
      })}
    </div>
  );
};
