import React from 'react';
import { X, HelpCircle, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { PAYTABLE_MULTIPLIERS } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBet: number;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, currentBet }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#24080d] via-[#150407] to-[#0a0103] border-2 border-yellow-500/50 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.35)] p-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gold-gradient tracking-wide uppercase">Golden Vault Rules</h2>
              <p className="text-[11px] text-amber-200/80 font-medium">VIP Deal or No Deal Casino Mechanics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-yellow-500/30 hover:border-yellow-400 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs leading-relaxed text-zinc-300">
          {/* Objective */}
          <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-3.5 space-y-1.5">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm uppercase">
              <Trophy className="w-4 h-4 text-amber-400" /> How to Play
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 pl-1">
              <li>
                <strong className="text-amber-200">Select Game Mode & Bet:</strong>
                <div className="mt-1 pl-2 text-[11px] text-zinc-300 space-y-0.5">
                  <div>• <span className="text-amber-300 font-bold">2 Cases:</span> Fixed Bet is <strong>₱100</strong></div>
                  <div>• <span className="text-amber-300 font-bold">3 Cases:</span> Fixed Bet is <strong>₱200</strong></div>
                  <div>• <span className="text-amber-300 font-bold">6 Cases:</span> Fixed Bet is <strong>₱500</strong></div>
                </div>
              </li>
              <li><strong className="text-amber-200">Pick Briefcases:</strong> Click any unopened case (#1 to #35) on the grid up to your mode limit. You can select one or multiple cases at a time.</li>
              <li><strong className="text-amber-200">Open Box:</strong> Press <strong>Open Box</strong> to reveal your chosen cases and immediately collect <code>Bet × Multiplier</code> into your balance.</li>
              <li><strong className="text-amber-200">Auto-Restart or Claim:</strong> Once all cases in your mode are opened, the round automatically completes and restarts, or click <strong>Claim</strong> anytime to secure your current winnings.</li>
            </ol>
          </div>

          {/* Paytable Grid */}
          <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm uppercase">
                <Sparkles className="w-4 h-4 text-amber-400" /> Paytable (35 Multipliers)
              </h3>
              <span className="text-[10px] text-amber-400/90 font-mono">Current Bet: ₱{currentBet.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
              {PAYTABLE_MULTIPLIERS.map((mul) => {
                const prize = currentBet * mul;
                const isGrand = mul === 1000;
                return (
                  <div
                    key={mul}
                    className={`p-1.5 rounded-lg border ${
                      isGrand
                        ? 'bg-amber-500/20 border-yellow-400 text-yellow-300 font-black shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                        : mul >= 50
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 font-bold'
                        : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-300'
                    }`}
                  >
                    <div className="font-bold">{mul}x</div>
                    <div className="text-[8px] text-zinc-400">₱{prize >= 1000 ? `${(prize / 1000).toFixed(0)}k` : prize}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RTP & Fair Play */}
          <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Provably Fair & RTP
            </h3>
            <p className="text-zinc-400 text-[11px]">
              All 35 briefcases are pre-seeded and cryptographically locked using <strong className="text-emerald-300">SHA-256 hashes</strong> before the first case is selected. The theoretical Return to Player (RTP) is <strong className="text-amber-300">97.45%</strong>.
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
