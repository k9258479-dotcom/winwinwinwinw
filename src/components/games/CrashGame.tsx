import React, { useState, useEffect, useRef } from 'react';
import { Rocket, TrendingUp, Volume2, VolumeX, X, Users, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../utils/audio';

interface CrashGameProps {
  userBalance: number;
  onBalanceUpdate: (newBal: number) => void;
  onClose: () => void;
  onOpenCashier: () => void;
}

interface SimulatedPlayer {
  name: string;
  bet: number;
  cashedOutAt?: number;
}

const SIMULATED_PLAYERS_BASE = [
  { name: 'Juan_MNL', bet: 250 },
  { name: 'CebuanoKing', bet: 100 },
  { name: 'Maria_Santos', bet: 500 },
  { name: 'DavaoStriker', bet: 50 },
  { name: 'PinoyBoss99', bet: 1000 },
  { name: 'LuckyGamerPH', bet: 200 },
];

export const CrashGame: React.FC<CrashGameProps> = ({
  userBalance,
  onBalanceUpdate,
  onClose,
  onOpenCashier,
}) => {
  const [gameState, setGameState] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(4);
  const [betAmount, setBetAmount] = useState(50);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashedOutMultiplier, setCashedOutMultiplier] = useState<number | null>(null);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([1.45, 3.82, 1.12, 14.80, 2.05, 5.40]);
  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedPlayer[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const crashPointRef = useRef<number>(2.5);
  const currentMultiplierRef = useRef<number>(1.00);
  const requestFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Mute toggle
  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Start round countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'WAITING') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        startFlight();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  const startFlight = () => {
    // Determine crash multiplier: 95% RTP distribution
    // 10% instant crash (< 1.2x), 60% medium (1.2x - 4x), 25% high (4x - 20x), 5% moonshot (20x - 100x)
    const roll = Math.random();
    let point = 1.0;
    if (roll < 0.12) {
      point = 1.01 + Math.random() * 0.19;
    } else if (roll < 0.70) {
      point = 1.2 + Math.random() * 2.8;
    } else if (roll < 0.94) {
      point = 4.0 + Math.random() * 14.0;
    } else {
      point = 18.0 + Math.random() * 60.0;
    }
    crashPointRef.current = Math.round(point * 100) / 100;
    currentMultiplierRef.current = 1.00;

    // Reset simulated players
    setSimulatedPlayers(
      SIMULATED_PLAYERS_BASE.map(p => ({
        ...p,
        cashedOutAt: undefined,
      }))
    );

    setGameState('FLYING');
    setHasCashedOut(false);
    setCashedOutMultiplier(null);
    startTimeRef.current = performance.now();

    const loop = (now: number) => {
      const elapsedSeconds = (now - startTimeRef.current) / 1000;
      // Exponential growth curve: 1.0 * e^(0.09 * t)
      const currentMult = Math.round(Math.pow(1.07, elapsedSeconds * 6) * 100) / 100;
      currentMultiplierRef.current = currentMult;
      setMultiplier(currentMult);

      // Simulate bot cashouts
      if (Math.random() < 0.08) {
        setSimulatedPlayers(prev =>
          prev.map(p => {
            if (!p.cashedOutAt && currentMult >= 1.3 && Math.random() < 0.3) {
              return { ...p, cashedOutAt: currentMult };
            }
            return p;
          })
        );
      }

      if (currentMult >= crashPointRef.current) {
        // CRASH!
        sounds.playExplosion();
        setGameState('CRASHED');
        setRecentCrashes(prev => [crashPointRef.current, ...prev.slice(0, 6)]);
        setHasBet(false);

        // Reset for next round after 3 seconds
        setTimeout(() => {
          setMultiplier(1.00);
          setCountdown(4);
          setGameState('WAITING');
        }, 3200);
        return;
      }

      requestFrameRef.current = requestAnimationFrame(loop);
    };

    requestFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      if (requestFrameRef.current) {
        cancelAnimationFrame(requestFrameRef.current);
      }
    };
  }, []);

  const handlePlaceBet = async () => {
    sounds.playClick();
    if (userBalance < betAmount) {
      onOpenCashier();
      return;
    }

    const res = await api.placeCrashBet(betAmount);
    if (res.success && res.newBalance !== undefined) {
      onBalanceUpdate(res.newBalance);
      setHasBet(true);
    }
  };

  const handleCashout = async () => {
    if (!hasBet || hasCashedOut || gameState !== 'FLYING') return;

    const mult = currentMultiplierRef.current;
    sounds.playCashout();
    setHasCashedOut(true);
    setCashedOutMultiplier(mult);

    const res = await api.cashoutCrash(betAmount, mult);
    if (res.success && res.newBalance !== undefined) {
      onBalanceUpdate(res.newBalance);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <Rocket className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-cyan-400 tracking-wide">
              ROCKET CRASH 88
            </h2>
            <div className="flex items-center gap-2 text-xs text-cyan-200/70">
              <span>Spribe Turbo</span>
              <span>·</span>
              <span>RTP 98.0%</span>
              <span>·</span>
              <span>Live Multiplier</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History Ribbon */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-slate-400 font-sans text-[11px] shrink-0">Recent Crashes:</span>
        {recentCrashes.map((val, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded font-bold ${
              val >= 10
                ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                : val >= 2
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {val.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Game Layout (Main Arena + Live Bets) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Canvas & Flight Arena */}
        <div className="lg:col-span-2 relative h-80 sm:h-96 bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/20 border border-cyan-500/20 rounded-2xl overflow-hidden flex flex-col justify-between p-6">
          {/* Flight Grid lines */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Top Info */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
            <span>Server Hash Verified</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              LIVE ROUND
            </span>
          </div>

          {/* Center Multiplier Ticker */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
            {gameState === 'WAITING' ? (
              <div className="animate-pulse">
                <span className="text-xs text-cyan-300 uppercase tracking-widest block font-bold mb-1">
                  Next Launch In
                </span>
                <span className="text-5xl sm:text-6xl font-black text-cyan-400 font-mono">
                  {countdown}s
                </span>
              </div>
            ) : gameState === 'FLYING' ? (
              <div>
                <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-mono tracking-tight drop-shadow-lg">
                  {multiplier.toFixed(2)}x
                </span>
                <p className="text-xs text-cyan-300 mt-2 font-semibold">ROCKET IN FLIGHT</p>
              </div>
            ) : (
              <div className="animate-shake">
                <span className="text-5xl sm:text-6xl font-black text-red-500 font-mono drop-shadow-md">
                  FLEW AWAY @ {crashPointRef.current.toFixed(2)}x
                </span>
                <p className="text-xs text-red-400 mt-2 font-semibold">ROUND CRASHED</p>
              </div>
            )}

            {/* User Cashed Out Toast */}
            {hasCashedOut && cashedOutMultiplier && (
              <div className="mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-xl text-sm font-bold flex items-center gap-2">
                <span>🏆 You Cashed Out at {cashedOutMultiplier.toFixed(2)}x (+₱{(betAmount * cashedOutMultiplier).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              </div>
            )}
          </div>

          {/* Rocket Graphic */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span>1.00x Base</span>
            <div className="flex items-center gap-2 text-cyan-300">
              <Rocket className={`w-6 h-6 transition-transform ${gameState === 'FLYING' ? 'translate-y--2 scale-110 text-cyan-400' : ''}`} />
            </div>
            <span>Max 100.00x</span>
          </div>
        </div>

        {/* Live Multiplayer Sidebar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Live Bets (8 players)
              </span>
              <span className="text-slate-500 font-mono">Total: ₱3,100</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {/* Current user */}
              {hasBet && (
                <div className="flex items-center justify-between p-2 bg-cyan-950/40 border border-cyan-500/40 rounded-lg">
                  <span className="font-bold text-cyan-300 truncate">You (Player)</span>
                  <div className="text-right">
                    <span className="text-slate-400 mr-2">₱{betAmount}</span>
                    {hasCashedOut && cashedOutMultiplier ? (
                      <span className="text-emerald-400 font-bold">{cashedOutMultiplier.toFixed(2)}x</span>
                    ) : gameState === 'CRASHED' ? (
                      <span className="text-red-400">Lost</span>
                    ) : (
                      <span className="text-cyan-400 animate-pulse">In Flight</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bot simulated players */}
              {simulatedPlayers.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2 font-mono">₱{p.bet}</span>
                    {p.cashedOutAt ? (
                      <span className="text-emerald-400 font-mono font-bold">{p.cashedOutAt.toFixed(2)}x</span>
                    ) : gameState === 'CRASHED' ? (
                      <span className="text-red-500 font-mono text-[11px]">Crashed</span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Playing</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Balance Note */}
          <div className="pt-3 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Available Balance:</span>
            <span className="font-mono text-white font-bold">₱{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Bottom Betting Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Bet presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase font-semibold">Bet (PHP):</span>
          <div className="flex items-center gap-1.5">
            {[20, 50, 100, 250, 500, 1000].map(amt => (
              <button
                key={amt}
                disabled={hasBet && gameState === 'FLYING'}
                onClick={() => {
                  sounds.playClick();
                  setBetAmount(amt);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  betAmount === amt
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ₱{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {gameState === 'FLYING' && hasBet && !hasCashedOut ? (
            <button
              onClick={handleCashout}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base uppercase rounded-xl shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              CASH OUT ₱{(betAmount * multiplier).toFixed(2)}
            </button>
          ) : (
            <button
              disabled={hasBet || gameState === 'FLYING'}
              onClick={handlePlaceBet}
              className={`px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all ${
                hasBet
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-default'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-cyan-500/20'
              }`}
            >
              {hasBet ? 'BET PLACED (WAITING FLIGHT)' : `BET ₱${betAmount} NEXT ROUND`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
