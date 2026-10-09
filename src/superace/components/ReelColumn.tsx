import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GridCard, CardSymbol } from '../types/game';
import { SlotCard } from './SlotCard';

interface ReelColumnProps {
  colIndex: number;
  cards: GridCard[];
  isSpinning: boolean;
  isTurbo: boolean;
  winningCells: Set<string>;
}

// Generate static strip of cards for seamless infinite scroll
function generateStripCards(colIndex: number): GridCard[] {
  const symbolsByCol: CardSymbol[][] = [
    ['A', 'K', 'Q', 'J', 'SPADE', 'A', 'K', 'Q'],
    ['K', 'Q', 'A', 'WILD', 'J', 'K', 'SCATTER', 'Q'],
    ['Q', 'K', 'WILD', 'A', 'J', 'Q', 'K', 'SCATTER'],
    ['J', 'Q', 'K', 'A', 'WILD', 'J', 'SPADE', 'A'],
    ['SPADE', 'A', 'K', 'Q', 'J', 'SPADE', 'A', 'K'],
  ];

  const symbols = symbolsByCol[colIndex] || symbolsByCol[0];
  // 8 items doubled = 16 items for continuous -50% to 0% translation
  const doubled = [...symbols, ...symbols];

  return doubled.map((symbol, idx) => ({
    id: `strip-${colIndex}-${idx}`,
    symbol,
    isGolden: (colIndex >= 1 && colIndex <= 3 && (idx % 3 === 0)),
  }));
}

export const ReelColumn: React.FC<ReelColumnProps> = ({
  colIndex,
  cards,
  isSpinning,
  isTurbo,
  winningCells,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const prevSpinning = useRef(isSpinning);

  const stripCards = useMemo(() => generateStripCards(colIndex), [colIndex]);

  useEffect(() => {
    if (prevSpinning.current && !isSpinning) {
      // Just stopped spinning -> trigger tactile downward bounce
      setIsBouncing(true);
      const timer = setTimeout(() => {
        setIsBouncing(false);
      }, 360);
      return () => clearTimeout(timer);
    }
    prevSpinning.current = isSpinning;
  }, [isSpinning]);

  return (
    <div className="relative flex-1 h-full overflow-hidden rounded bg-black/20">
      {isSpinning ? (
        /* Spinning Downwards Continuous Reel Strip */
        <div
          className={`absolute inset-x-0 w-full flex flex-col gap-1 select-none filter blur-[0.6px] ${
            isTurbo ? 'animate-reel-scroll-down-turbo' : 'animate-reel-scroll-down'
          }`}
          style={{
            top: 0,
            bottom: 'auto',
          }}
        >
          {stripCards.map((card, idx) => (
            <div key={card.id || idx} className="h-[74px] shrink-0 w-full flex">
              <SlotCard card={card} />
            </div>
          ))}
        </div>
      ) : (
        /* Settled 4 Cards with Downward Bounce on Stop */
        <div
          className={`flex flex-col justify-between h-full gap-1 transition-transform ${
            isBouncing ? 'animate-reel-bounce' : ''
          }`}
        >
          {cards.map((card, rIndex) => {
            const isWinning = winningCells.has(`${colIndex}-${rIndex}`);
            return (
              <div
                key={card.id || `${colIndex}-${rIndex}`}
                className={`flex-1 flex w-full ${card.isNew ? 'animate-card-fall' : ''}`}
              >
                <SlotCard card={card} isWinning={isWinning} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
