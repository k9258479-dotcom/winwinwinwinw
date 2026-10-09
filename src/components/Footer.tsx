import React from 'react';
import { ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Badges & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 font-bold text-sm">
              21+
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Responsible Gaming</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gaming is strictly for entertainment and restricted to persons 21 years of age and above. Keep it fun and play responsibly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Safe & Encrypted</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                256-Bit SSL financial security safeguarding all GCash, Maya, and online bank transactions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Provably Fair RNG</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All slot reels, crash multipliers, and dice rolls use cryptographic random seeds independently verifiable.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Partners */}
        <div>
          <span className="text-[11px] uppercase font-bold text-slate-500 block mb-3">
            Official E-Wallet & Payment Partners
          </span>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-blue-400">
              GCash Express
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
              Maya Instant
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-amber-400">
              GrabPay
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              BDO Unibank
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              BPI Online
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              UnionBank
            </span>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>
            © 2026 Bet88 Gaming Platform. All rights reserved. Simulated gaming platform architecture.
          </span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <span>·</span>
            <a href="/admin" className="text-amber-500/80 hover:text-amber-400 font-bold flex items-center gap-1">
              <span>🛡️</span>
              <span>Admin Portal</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
