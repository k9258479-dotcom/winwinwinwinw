import React from 'react';
import { GridCard } from '../types/game';

interface SlotCardProps {
  card: GridCard;
  isWinning?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({ card, isWinning }) => {
  const { symbol, isGolden, isTransformingWild } = card;

  // Render content based on symbol
  const renderCardContent = () => {
    switch (symbol) {
      case 'A':
        return (
          <div className="flex flex-col justify-between h-full p-0.5 relative">
            <div className="text-[11px] font-black text-zinc-900 leading-none">A</div>
            <div className="self-center my-auto flex items-center justify-center">
              <i className="fa-solid fa-spade text-zinc-900 text-lg drop-shadow-sm"></i>
            </div>
            <div className="text-[8px] font-black text-zinc-800 text-center uppercase tracking-tighter">
              ACE
            </div>
          </div>
        );

      case 'K':
        if (isGolden) {
          return (
            <div className="flex flex-col justify-between h-full p-0.5 relative">
              <div className="text-[11px] font-black text-amber-950 leading-none flex items-center justify-between">
                <span>K</span>
                <i className="fa-solid fa-crown text-[8px] text-amber-800"></i>
              </div>
              <div className="self-center my-auto flex flex-col items-center">
                <div className="w-8 h-8 rounded border border-amber-600 bg-gradient-to-b from-blue-700 via-blue-600 to-amber-200 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-chess-king text-amber-300 text-base drop-shadow"></i>
                </div>
              </div>
              <div className="text-[8px] font-black text-amber-950 text-center uppercase tracking-tighter">
                KING
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col justify-between h-full p-0.5 relative">
            <div className="text-[11px] font-black text-zinc-800 leading-none">K</div>
            <div className="self-center my-auto flex flex-col items-center">
              <div className="w-7 h-7 rounded border border-zinc-300 bg-gradient-to-b from-blue-800 to-white flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-crown text-yellow-600 text-xs"></i>
              </div>
            </div>
            <div className="text-[8px] font-black text-zinc-700 text-center uppercase tracking-tighter">
              KING
            </div>
          </div>
        );

      case 'Q':
        if (isGolden) {
          return (
            <div className="flex flex-col justify-between h-full p-0.5 relative">
              <div className="text-[11px] font-black text-amber-950 leading-none flex items-center justify-between">
                <span>Q</span>
                <i className="fa-solid fa-crown text-[8px] text-amber-800"></i>
              </div>
              <div className="self-center my-auto flex flex-col items-center">
                <div className="w-8 h-8 rounded border border-red-500 bg-gradient-to-b from-red-600 via-rose-500 to-amber-100 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-chess-queen text-red-950 text-base drop-shadow"></i>
                </div>
              </div>
              <div className="text-[8px] font-black text-amber-950 text-center uppercase tracking-tighter">
                QUEEN
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col justify-between h-full p-0.5 relative">
            <div className="text-[11px] font-black text-red-600 leading-none">Q</div>
            <div className="self-center my-auto flex flex-col items-center">
              <div className="w-7 h-7 rounded border border-red-300 bg-gradient-to-b from-red-600 to-rose-100 flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-heart text-red-600 text-xs"></i>
              </div>
            </div>
            <div className="text-[8px] font-black text-red-600 text-center uppercase tracking-tighter">
              QUEEN
            </div>
          </div>
        );

      case 'J':
        if (isGolden) {
          return (
            <div className="flex flex-col justify-between h-full p-0.5 relative">
              <div className="text-[11px] font-black text-amber-950 leading-none flex items-center justify-between">
                <span>J</span>
                <i className="fa-solid fa-crown text-[8px] text-amber-800"></i>
              </div>
              <div className="self-center my-auto flex flex-col items-center">
                <div className="w-8 h-8 rounded border border-blue-400 bg-gradient-to-b from-blue-600 to-amber-100 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-shield text-blue-900 text-base drop-shadow"></i>
                </div>
              </div>
              <div className="text-[8px] font-black text-amber-950 text-center uppercase tracking-tighter">
                JACK
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col justify-between h-full p-0.5 relative">
            <div className="text-[11px] font-black text-blue-700 leading-none">J</div>
            <div className="self-center my-auto flex flex-col items-center">
              <div className="w-7 h-7 rounded border border-blue-300 bg-gradient-to-b from-blue-700 to-white flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-shield text-blue-800 text-xs"></i>
              </div>
            </div>
            <div className="text-[8px] font-black text-blue-700 text-center uppercase tracking-tighter">
              JACK
            </div>
          </div>
        );

      case 'SPADE':
        return (
          <div className="flex flex-col items-center justify-center h-full p-0.5 relative">
            <i className="fa-solid fa-spade text-zinc-900 text-2xl drop-shadow"></i>
          </div>
        );

      case 'WILD':
        return (
          <div className="flex flex-col justify-between items-center h-full p-0.5 relative">
            <div className="text-[9px] font-black text-amber-950 uppercase tracking-tight">WILD</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-md animate-bounce">
              <i className="fa-solid fa-crown text-amber-950 text-base"></i>
            </div>
            <div className="text-[8px] font-black text-amber-950 uppercase tracking-tighter">JOKER</div>
          </div>
        );

      case 'SCATTER':
        return (
          <div className="flex flex-col justify-between items-center h-full p-0.5 relative">
            <div className="text-[8px] font-black text-fuchsia-200 uppercase tracking-tight">FREE</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-purple-400 via-fuchsia-500 to-indigo-800 flex items-center justify-center shadow-lg border border-fuchsia-300 animate-pulse">
              <i className="fa-solid fa-gem text-amber-300 text-sm"></i>
            </div>
            <div className="text-[8px] font-black text-amber-200 uppercase tracking-tighter">SPIN</div>
          </div>
        );
    }
  };

  // Compute card base class
  let baseClass = 'card-face border border-slate-300';
  if (symbol === 'WILD') {
    baseClass = 'wild-card-face border-2 border-amber-400';
  } else if (symbol === 'SCATTER') {
    baseClass = 'scatter-card-face border-2 border-fuchsia-400';
  } else if (isGolden) {
    baseClass = 'golden-card-face border-2 border-yellow-400 shadow-gold-glow';
  }

  return (
    <div
      className={`flex-1 rounded min-h-[64px] max-h-[82px] overflow-hidden transition-all duration-300 ${baseClass} ${
        isWinning ? 'ring-2 ring-amber-400 ring-offset-1 scale-[1.03] animate-pulse-glow z-10' : ''
      } ${isTransformingWild ? 'animate-win-pop' : ''}`}
    >
      {renderCardContent()}
    </div>
  );
};
