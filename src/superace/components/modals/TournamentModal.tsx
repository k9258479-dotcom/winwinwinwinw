import React from 'react';
import { sound } from '../../utils/audio';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  playerLevel,
}) => {
  if (!isOpen) return null;

  const leaders = [
    { rank: 1, name: 'DragonKing_99', points: '142,500', prize: '₱150,000' },
    { rank: 2, name: 'AceHunter_PH', points: '118,200', prize: '₱90,000' },
    { rank: 3, name: 'GoldenSlots777', points: '94,800', prize: '₱60,000' },
    { rank: 4, name: 'LuckyCardMaster', points: '72,100', prize: '₱35,000' },
    { rank: 5, name: 'JackpotBeast', points: '58,400', prize: '₱25,000' },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#241c09] via-[#141005] to-[#070501] border-2 border-yellow-400 rounded-2xl p-4 shadow-[0_0_35px_rgba(234,179,8,0.4)] flex flex-col relative animate-win-pop max-h-[85vh] overflow-y-auto">
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
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div>
            <h3 className="font-game-title text-xl text-yellow-300 tracking-wider">TOURNAMENT</h3>
            <p className="text-[10px] text-zinc-400">Weekly Super Ace Master Cup</p>
          </div>
        </div>

        {/* Prize Pool Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border border-yellow-400/60 rounded-xl p-3 flex items-center justify-between shadow mb-3">
          <div>
            <span className="text-[10px] text-amber-200 uppercase font-bold">Total Prize Pool</span>
            <div className="font-numbers text-2xl font-bold text-white tracking-wider">₱500,000</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400">Ends In</span>
            <div className="text-xs font-bold text-amber-300">2d 14h 22m</div>
          </div>
        </div>

        {/* Player Status Card */}
        <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-2.5 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-black flex items-center justify-center text-xs shadow">
              LV{playerLevel}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Your Ranking</div>
              <div className="text-[10px] text-zinc-400">Points: 12,450</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-amber-300 font-numbers">#14</span>
            <div className="text-[9px] text-emerald-400">In Prize Zone (₱2,500)</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Top Contenders
          </h4>
          {leaders.map(l => (
            <div
              key={l.rank}
              className="bg-black/40 border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    l.rank === 1
                      ? 'bg-yellow-400 text-black'
                      : l.rank === 2
                      ? 'bg-slate-300 text-black'
                      : l.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {l.rank}
                </span>
                <span className="text-zinc-200 font-medium text-[11px]">{l.name}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-300 font-bold text-[11px] font-numbers">{l.prize}</span>
                <div className="text-[9px] text-zinc-500">{l.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
