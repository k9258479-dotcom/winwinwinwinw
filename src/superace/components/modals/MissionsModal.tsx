import React from 'react';
import { Mission } from '../../types/game';
import { sound } from '../../utils/audio';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  onClaimReward: (missionId: string, reward: number) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  onClaimReward,
}) => {
  if (!isOpen) return null;

  const handleClaim = (m: Mission) => {
    sound.playGoldenTransform();
    onClaimReward(m.id, m.reward);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#0a1e16] via-[#06140e] to-[#020805] border-2 border-emerald-500/70 rounded-2xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col relative animate-win-pop max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-emerald-400 to-green-700 flex items-center justify-center text-white text-sm shadow">
            <i className="fa-solid fa-clipboard-check"></i>
          </div>
          <div>
            <h3 className="font-game-title text-xl text-emerald-300 tracking-wider">DAILY MISSIONS</h3>
            <p className="text-[10px] text-zinc-400">Complete tasks to claim free coin rewards</p>
          </div>
        </div>

        {/* Mission Items */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
          {missions.map(m => {
            const pct = Math.min(100, Math.floor((m.current / m.target) * 100));

            return (
              <div
                key={m.id}
                className="bg-black/50 border border-emerald-900/50 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{m.title}</h4>
                    <p className="text-[10px] text-zinc-400">{m.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[9px] text-zinc-400">Reward</span>
                    <div className="text-xs font-bold text-amber-300 font-numbers">₱{m.reward}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 min-w-[32px] text-right">
                    {m.current}/{m.target}
                  </span>
                </div>

                {/* Action button */}
                <div className="flex justify-end pt-1">
                  {m.claimed ? (
                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                      <i className="fa-solid fa-check"></i> Claimed
                    </span>
                  ) : m.completed ? (
                    <button
                      onClick={() => handleClaim(m)}
                      className="py-1 px-3 rounded-lg bg-gradient-to-b from-yellow-400 to-amber-600 text-black font-black text-xs shadow-md animate-pulse hover:brightness-110 active:scale-95"
                    >
                      Claim ₱{m.reward}
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-400">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
