import React from 'react';
import { sound } from '../utils/audio';

interface SidebarProps {
  onOpenBackpack: () => void;
  onOpenMission: () => void;
  onOpenWinMore: () => void;
  onOpenTournament: () => void;
  onOpenHighlights: () => void;
  hasClaimableMission?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenBackpack,
  onOpenMission,
  onOpenWinMore,
  onOpenTournament,
  onOpenHighlights,
  hasClaimableMission,
}) => {
  const handleClick = (fn: () => void) => {
    sound.playClick();
    fn();
  };

  return (
    <aside className="w-14 flex flex-col items-center justify-around h-full py-1 z-20 shrink-0 mr-1.5 bg-black/40 backdrop-blur-[2px] rounded-lg border border-amber-900/30">
      {/* JILI Branding */}
      <div className="text-center mb-1 select-none">
        <span className="font-game-title text-base font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow">
          JILI
        </span>
      </div>

      {/* Backpack Button */}
      <button
        onClick={() => handleClick(onOpenBackpack)}
        className="flex flex-col items-center group my-0.5 active:scale-95 transition-transform"
        title="Backpack & Inventory"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-amber-400 to-amber-700 flex items-center justify-center text-white text-xs shadow hover:brightness-110">
          <i className="fa-solid fa-briefcase"></i>
        </div>
        <span className="text-[8px] font-bold text-amber-200 mt-0.5 tracking-tighter">Backpack</span>
      </button>

      {/* Mission Button */}
      <button
        onClick={() => handleClick(onOpenMission)}
        className="flex flex-col items-center group my-0.5 active:scale-95 transition-transform relative"
        title="Daily Missions & Quests"
      >
        {hasClaimableMission && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-ping"></span>
        )}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-emerald-400 to-green-700 flex items-center justify-center text-white text-xs shadow hover:brightness-110">
          <i className="fa-solid fa-clipboard-check"></i>
        </div>
        <span className="text-[8px] font-bold text-amber-200 mt-0.5 tracking-tighter">Mission</span>
      </button>

      {/* Win More Button */}
      <button
        onClick={() => handleClick(onOpenWinMore)}
        className="flex flex-col items-center group my-0.5 active:scale-95 transition-transform"
        title="Win More & VIP Rewards"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-red-500 to-amber-600 flex items-center justify-center text-white text-xs shadow hover:brightness-110">
          <i className="fa-solid fa-box-open"></i>
        </div>
        <span className="text-[8px] font-bold text-amber-200 mt-0.5 leading-none tracking-tighter text-center">
          WIN MORE
        </span>
      </button>

      {/* Tournament Button */}
      <button
        onClick={() => handleClick(onOpenTournament)}
        className="flex flex-col items-center group my-0.5 active:scale-95 transition-transform"
        title="Slot Tournament"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-yellow-400 to-amber-600 flex items-center justify-center text-white text-xs shadow hover:brightness-110">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <span className="text-[8px] font-bold text-amber-200 mt-0.5 tracking-tighter">Tournament</span>
      </button>

      {/* Highlights Button */}
      <button
        onClick={() => handleClick(onOpenHighlights)}
        className="flex flex-col items-center group my-0.5 active:scale-95 transition-transform"
        title="Big Win Highlights"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-yellow-400 to-amber-600 flex items-center justify-center text-white text-xs shadow hover:brightness-110">
          <i className="fa-solid fa-circle-play"></i>
        </div>
        <span className="text-[8px] font-bold text-amber-200 mt-0.5 tracking-tighter">HIGHLIGHTS</span>
      </button>
    </aside>
  );
};
