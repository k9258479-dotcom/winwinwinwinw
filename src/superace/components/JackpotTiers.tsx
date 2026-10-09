import React from 'react';

interface JackpotTiersProps {
  currentBet: number;
  onOpenJackpotModal: () => void;
}

export const JackpotTiers: React.FC<JackpotTiersProps> = ({
  currentBet,
  onOpenJackpotModal,
}) => {
  const isGrandUnlocked = currentBet >= 40;
  const isMajorUnlocked = currentBet >= 20;

  // Jackpots dynamic calculation
  const grandValue = (40000 * (currentBet / 40)).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const majorValue = (15625 * (currentBet / 20)).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const minorValue = (7812.5 * Math.max(1, currentBet / 0.5)).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const miniValue = (781.2 * Math.max(1, currentBet / 0.5)).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div
      onClick={onOpenJackpotModal}
      className="relative z-20 flex flex-col items-center w-full px-12 -mt-1 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      title="Click to view Jackpot details"
    >
      {/* GRAND */}
      <div
        className={`w-full bg-gradient-to-r from-red-950/90 via-red-900/95 to-red-950/90 border rounded-lg py-0.5 px-3 flex items-center justify-between shadow-md mb-0.5 transition-colors ${
          isGrandUnlocked ? 'border-yellow-300 shadow-[0_0_10px_#eab308]' : 'border-amber-400'
        }`}
      >
        <div className="flex items-center gap-1">
          {isGrandUnlocked ? (
            <i className="fa-solid fa-crown text-yellow-300 text-[10px] animate-bounce"></i>
          ) : (
            <i className="fa-solid fa-lock text-amber-400 text-[10px]"></i>
          )}
          <span className="text-[10px] font-black tracking-wide text-red-300 drop-shadow">
            GRAND
          </span>
        </div>
        {isGrandUnlocked ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-amber-300 uppercase">₱</span>
            <span className="text-sm font-numbers font-bold text-amber-200 tracking-wider">
              {grandValue}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-amber-200 font-ui">Bet 40 unlock</span>
        )}
      </div>

      {/* MAJOR */}
      <div
        className={`w-full bg-gradient-to-r from-purple-950/90 via-purple-900/95 to-purple-950/90 border rounded-lg py-0.5 px-3 flex items-center justify-between shadow-md mb-0.5 transition-colors ${
          isMajorUnlocked ? 'border-fuchsia-300 shadow-[0_0_10px_#d946ef]' : 'border-purple-400'
        }`}
      >
        <div className="flex items-center gap-1">
          {isMajorUnlocked ? (
            <i className="fa-solid fa-gem text-fuchsia-300 text-[10px]"></i>
          ) : (
            <i className="fa-solid fa-lock text-amber-400 text-[10px]"></i>
          )}
          <span className="text-[10px] font-black tracking-wide text-purple-300 drop-shadow">
            MAJOR
          </span>
        </div>
        {isMajorUnlocked ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-purple-300 uppercase">₱</span>
            <span className="text-sm font-numbers font-bold text-purple-100 tracking-wider">
              {majorValue}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-purple-100 font-ui">Bet 20 unlock</span>
        )}
      </div>

      {/* MINOR */}
      <div className="w-full bg-gradient-to-r from-blue-950/95 via-sky-900/95 to-blue-950/95 border-2 border-sky-400 rounded-lg py-0.5 px-3 flex items-center justify-between shadow-neon-blue mb-0.5">
        <span className="text-[10px] font-black tracking-wide text-cyan-300 uppercase">MINOR</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-zinc-300 uppercase">MAX</span>
          <span className="text-sm font-numbers font-bold text-white tracking-wider">
            {minorValue}
          </span>
        </div>
      </div>

      {/* MINI */}
      <div className="w-full bg-gradient-to-r from-emerald-950/95 via-green-900/95 to-emerald-950/95 border-2 border-green-400 rounded-lg py-0.5 px-3 flex items-center justify-between shadow-neon-green">
        <span className="text-[10px] font-black tracking-wide text-green-300 uppercase">MINI</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-zinc-300 uppercase">MAX</span>
          <span className="text-sm font-numbers font-bold text-white tracking-wider">
            {miniValue}
          </span>
        </div>
      </div>
    </div>
  );
};
