import React from 'react';
import { sound } from '../../utils/audio';

interface HighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayWin: (winAmount: number) => void;
}

export const HighlightsModal: React.FC<HighlightsModalProps> = ({
  isOpen,
  onClose,
  onReplayWin,
}) => {
  if (!isOpen) return null;

  const highlights = [
    {
      id: 'hl-1',
      title: 'SUPER WIN (x2500)',
      payout: 1250.0,
      bet: 0.5,
      multiplier: 'x10 (Free Spins)',
      feature: 'Elimination Golden Wild Combo',
      time: '12m ago',
    },
    {
      id: 'hl-2',
      title: 'MEGA WIN (x840)',
      payout: 420.0,
      bet: 0.5,
      multiplier: 'x5 (Normal)',
      feature: 'Full Screen Aces & Kings',
      time: '1h ago',
    },
    {
      id: 'hl-3',
      title: 'BIG WIN (x360)',
      payout: 180.0,
      bet: 0.5,
      multiplier: 'x5 (Normal)',
      feature: 'Quad Golden Queens Cascades',
      time: '3h ago',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#241c09] via-[#141005] to-[#070501] border-2 border-yellow-400 rounded-2xl p-4 shadow-[0_0_35px_rgba(234,179,8,0.4)] flex flex-col relative animate-win-pop max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-yellow-950 border border-yellow-500/50 flex items-center justify-center text-yellow-300 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-yellow-400 to-amber-600 flex items-center justify-center text-white text-sm shadow">
            <i className="fa-solid fa-circle-play"></i>
          </div>
          <div>
            <h3 className="font-game-title text-xl text-yellow-300 tracking-wider">HIGHLIGHTS</h3>
            <p className="text-[10px] text-zinc-400">Epic Big Wins & Lucky Spin Moments</p>
          </div>
        </div>

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
          {highlights.map(h => (
            <div
              key={h.id}
              className="bg-black/50 border border-amber-900/50 rounded-xl p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black text-amber-300 tracking-wide">{h.title}</span>
                  <p className="text-[10px] text-zinc-400">{h.feature}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500">{h.time}</span>
                  <div className="text-sm font-black text-white font-numbers tracking-wider">
                    ₱{h.payout.toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-400">
                  Bet ₱{h.bet} · Mult: <span className="text-amber-400 font-bold">{h.multiplier}</span>
                </span>
                <button
                  onClick={() => {
                    sound.playBigWin();
                    onReplayWin(h.payout);
                    onClose();
                  }}
                  className="py-1 px-2.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <i className="fa-solid fa-play text-[9px]"></i> Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
