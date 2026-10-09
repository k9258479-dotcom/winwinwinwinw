import React from 'react';
import { GridCard } from '../types/game';
import { ReelColumn } from './ReelColumn';

interface SlotReelsProps {
  grid: GridCard[][];
  winningCells: Set<string>;
  spinningCols: boolean[];
  isTurbo?: boolean;
}

export const SlotReels: React.FC<SlotReelsProps> = ({
  grid,
  winningCells,
  spinningCols,
  isTurbo = false,
}) => {
  return (
    <section
      className="flex-1 h-full grid grid-cols-5 gap-1 bg-stone-900/60 p-1 rounded-lg border-2 border-amber-900/50 shadow-2xl relative overflow-hidden backdrop-blur-xs"
      data-purpose="reels-board"
    >
      {grid.map((col, cIndex) => {
        const isSpinning = spinningCols[cIndex];

        return (
          <ReelColumn
            key={cIndex}
            colIndex={cIndex}
            cards={col}
            isSpinning={isSpinning}
            isTurbo={isTurbo}
            winningCells={winningCells}
          />
        );
      })}
    </section>
  );
};
