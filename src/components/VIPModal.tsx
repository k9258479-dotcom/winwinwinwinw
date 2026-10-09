import React from 'react';
import { X, Crown, Award, Check } from 'lucide-react';
import { VIPTier } from '../types';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentPoints: number;
  levels: VIPTier[];
}

export const VIPModal: React.FC<VIPModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  currentPoints,
  levels,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-400">BET88 VIP ROYAL CLUB</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User VIP Status Summary */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Your Current Status</span>
            <span className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
              <Award className="w-5 h-5" />
              VIP Level {currentLevel} (Silver)
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">VIP Tier Points</span>
            <span className="text-base font-mono font-bold text-white">
              {currentPoints.toLocaleString()} / 3,000 EXP
            </span>
          </div>
        </div>

        {/* Tiers List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {levels.map(tier => {
            const isCurrent = tier.level === currentLevel;
            return (
              <div
                key={tier.level}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-400/60 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                      {tier.level}
                    </span>
                    <span className="font-bold text-sm text-slate-200">{tier.name}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full uppercase">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
                    <span>Rebate: <b className="text-emerald-400">{tier.dailyRebate}</b></span>
                    <span>Birthday Gift: <b className="text-amber-400">{tier.birthdayGift}</b></span>
                    <span>Upgrade Bonus: <b className="text-amber-400">{tier.upgradeBonus}</b></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Required Points</span>
                  <span className="text-xs font-mono text-slate-300 font-bold">
                    {tier.pointsReq.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
