import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, RefreshCw } from 'lucide-react';
import { ProvablyFairData } from '../types/game';
import { generateSeed, sha256 } from '../utils/provablyFair';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  provablyFair: ProvablyFairData;
  onUpdateClientSeed: (newSeed: string) => void;
  isGameActive: boolean;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  provablyFair,
  onUpdateClientSeed,
  isGameActive,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customClientSeed, setCustomClientSeed] = useState(provablyFair.clientSeed);
  const [verificationHashInput, setVerificationHashInput] = useState('');
  const [verifiedHashResult, setVerifiedHashResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyClientSeed = () => {
    if (customClientSeed.trim()) {
      onUpdateClientSeed(customClientSeed.trim());
    }
  };

  const handleVerify = async () => {
    if (!verificationHashInput.trim()) return;
    const res = await sha256(verificationHashInput.trim());
    setVerifiedHashResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1a080d] via-[#100305] to-[#080102] border-2 border-emerald-500/40 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.25)] p-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-emerald-300 tracking-wide uppercase">Provably Fair RNG</h2>
              <p className="text-[10px] text-zinc-400">Cryptographically Verifiable Game Integrity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-3.5 text-xs text-zinc-300">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            All multipliers in the 35 briefcases are randomly generated and sealed using{' '}
            <span className="text-emerald-300 font-semibold">SHA-256 cryptographic hashes</span> before you open your first case. The outcome cannot be altered during gameplay.
          </p>

          {/* Server Seed Hash */}
          <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300">Server Seed Hash (SHA-256)</span>
              <span className="text-[9px] text-zinc-500">Active Game</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/80 border border-zinc-800 rounded-lg p-2 font-mono text-[10px] text-zinc-300 break-all">
              <span className="flex-1 select-all">{provablyFair.serverSeedHash}</span>
              <button
                onClick={() => handleCopy(provablyFair.serverSeedHash, 'serverHash')}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0 cursor-pointer"
                title="Copy Hash"
              >
                {copiedField === 'serverHash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-zinc-500">This hash was predetermined and locked before the round started.</p>
          </div>

          {/* Client Seed */}
          <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-300">Client Seed (Your Randomness)</span>
              {isGameActive && <span className="text-[9px] text-amber-400">Locked during active game</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                disabled={isGameActive}
                value={customClientSeed}
                onChange={(e) => setCustomClientSeed(e.target.value)}
                className="flex-1 bg-black/80 border border-zinc-800 focus:border-emerald-500 disabled:opacity-60 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none"
              />
              {!isGameActive && (
                <>
                  <button
                    onClick={() => setCustomClientSeed(generateSeed(16))}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0 cursor-pointer"
                    title="Generate New Random Seed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleApplyClientSeed}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase shrink-0 cursor-pointer"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nonce & RTP */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-400 block font-semibold">Game Nonce</span>
              <span className="font-mono text-amber-300 font-bold text-sm">#{provablyFair.nonce}</span>
            </div>
            <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-400 block font-semibold">RTP (Return to Player)</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">97.45%</span>
            </div>
          </div>

          {/* Verifier Tool */}
          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Quick SHA-256 Verifier</span>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Enter string to hash..."
                value={verificationHashInput}
                onChange={(e) => setVerificationHashInput(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-200 outline-none"
              />
              <button
                onClick={handleVerify}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
              >
                Hash
              </button>
            </div>
            {verifiedHashResult && (
              <div className="p-2 bg-black/90 rounded border border-emerald-900/50 font-mono text-[9px] text-emerald-400 break-all select-all">
                {verifiedHashResult}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
