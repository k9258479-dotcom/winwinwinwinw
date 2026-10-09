import React from 'react';
import { sound } from '../../utils/audio';

interface JackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  bet: number;
}

export const JackpotModal: React.FC<JackpotModalProps> = ({
  isOpen,
  onClose,
  bet,
}) => {
  if (!isOpen) return null;

  const grandValue = (40000 * (bet / 40)).toLocaleString('en-US', { minimumFractionDigits: 1 });
  const majorValue = (15625 * (bet / 20)).toLocaleString('en-US', { minimumFractionDigits: 1 });
  const minorValue = (7812.5 * Math.max(1, bet / 0.5)).toLocaleString('en-US', { minimumFractionDigits: 1 });
  const miniValue = (781.2 * Math.max(1, bet / 0.5)).toLocaleString('en-US', { minimumFractionDigits: 1 });

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#180a29] via-[#0d0517] to-[#06020a] border-2 border-fuchsia-500 rounded-2xl p-4 shadow-[0_0_35px_rgba(217,70,239,0.4)] flex flex-col relative animate-win-pop max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-purple-950 border border-fuchsia-400/50 flex items-center justify-center text-fuchsia-300 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Title Badge */}
        <div className="flex flex-col items-center mb-3">
          <div className="py-1 px-3 rounded-full bg-gradient-to-r from-purple-900 to-fuchsia-900 border border-fuchsia-400 shadow-neon-purple flex flex-col items-center mb-1">
            <span className="text-[10px] font-black text-amber-300 tracking-tighter uppercase italic">
              Jackpot
            </span>
            <span className="text-sm font-black text-fuchsia-100 tracking-wider uppercase italic drop-shadow-[0_0_8px_#ff00ea]">
              LEGEND
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">Progressive Jackpots Pool</span>
        </div>

        {/* Jackpot Tiers List */}
        <div className="flex flex-col gap-2 my-2">
          {/* GRAND */}
          <div className="bg-gradient-to-r from-red-950/90 via-red-900/90 to-red-950/90 border-2 border-amber-400 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
                <span className="text-xs font-black text-amber-300">GRAND JACKPOT</span>
              </div>
              <span className="text-[9px] text-zinc-400">
                {bet >= 40 ? '✅ Unlocked at current bet' : '🔒 Requires Bet ≥ ₱40'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-300 font-numbers">₱</span>
              <span className="text-lg font-numbers font-bold text-white tracking-wider ml-0.5">
                {grandValue}
              </span>
            </div>
          </div>

          {/* MAJOR */}
          <div className="bg-gradient-to-r from-purple-950/90 via-purple-900/90 to-purple-950/90 border-2 border-purple-400 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-gem text-fuchsia-300 text-xs"></i>
                <span className="text-xs font-black text-fuchsia-200">MAJOR JACKPOT</span>
              </div>
              <span className="text-[9px] text-zinc-400">
                {bet >= 20 ? '✅ Unlocked at current bet' : '🔒 Requires Bet ≥ ₱20'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-purple-300 font-numbers">₱</span>
              <span className="text-lg font-numbers font-bold text-white tracking-wider ml-0.5">
                {majorValue}
              </span>
            </div>
          </div>

          {/* MINOR */}
          <div className="bg-gradient-to-r from-blue-950/90 via-sky-900/90 to-blue-950/90 border-2 border-sky-400 rounded-xl p-2.5 flex items-center justify-between shadow-neon-blue">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-star text-sky-400 text-xs"></i>
                <span className="text-xs font-black text-cyan-300">MINOR JACKPOT</span>
              </div>
              <span className="text-[9px] text-zinc-400">Unlocked on all bets</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-sky-300 font-numbers">₱</span>
              <span className="text-lg font-numbers font-bold text-white tracking-wider ml-0.5">
                {minorValue}
              </span>
            </div>
          </div>

          {/* MINI */}
          <div className="bg-gradient-to-r from-emerald-950/90 via-green-900/90 to-emerald-950/90 border-2 border-green-400 rounded-xl p-2.5 flex items-center justify-between shadow-neon-green">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-sparkles text-emerald-400 text-xs"></i>
                <span className="text-xs font-black text-emerald-300">MINI JACKPOT</span>
              </div>
              <span className="text-[9px] text-zinc-400">Unlocked on all bets</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-green-300 font-numbers">₱</span>
              <span className="text-lg font-numbers font-bold text-white tracking-wider ml-0.5">
                {miniValue}
              </span>
            </div>
          </div>
        </div>

        {/* Live Winners Ticker */}
        <div className="mt-3 bg-black/50 border border-zinc-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Recent Winners
            </span>
            <span className="text-[9px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
            </span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-zinc-300">
              <span>user_8829***</span>
              <span className="text-amber-400 font-bold">GRAND ₱48,500</span>
              <span className="text-zinc-500">2m ago</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>ph_ace_pro</span>
              <span className="text-fuchsia-400 font-bold">MAJOR ₱16,200</span>
              <span className="text-zinc-500">7m ago</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>lucky_star99</span>
              <span className="text-sky-400 font-bold">MINOR ₱7,812</span>
              <span className="text-zinc-500">14m ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
