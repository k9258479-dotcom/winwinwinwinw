import React from 'react';
import { X, Gift, Check, ArrowRight } from 'lucide-react';
import { Promotion } from '../types';
import { sounds } from '../utils/audio';

interface PromotionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotions: Promotion[];
  onDepositClick: () => void;
}

export const PromotionsModal: React.FC<PromotionsModalProps> = ({
  isOpen,
  onClose,
  promotions,
  onDepositClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-400">BET88 PROMOTIONS & BONUSES</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Promo List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {promotions.map(promo => (
            <div
              key={promo.id}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-400/40">
                    {promo.tag}
                  </span>
                  <h3 className="font-bold text-slate-200 text-sm">{promo.title}</h3>
                </div>
                <p className="text-xs text-slate-400 max-w-md">{promo.description}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                  <span>Min Deposit: ₱{promo.minDeposit}</span>
                  <span>·</span>
                  <span>Max Bonus: ₱{promo.maxBonus.toLocaleString()}</span>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onDepositClick();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Claim Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
