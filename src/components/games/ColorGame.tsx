import React, { useState } from 'react';
import { Sparkles, RotateCcw, Volume2, VolumeX, X, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../utils/audio';

interface ColorGameProps {
  userBalance: number;
  onBalanceUpdate: (newBal: number) => void;
  onClose: () => void;
  onOpenCashier: () => void;
}

const COLORS_DATA = [
  { id: 'yellow', name: 'Yellow / Dilaw', bg: 'bg-yellow-400', text: 'text-yellow-950', border: 'border-yellow-300' },
  { id: 'white', name: 'White / Puti', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' },
  { id: 'pink', name: 'Pink / Rosas', bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400' },
  { id: 'blue', name: 'Blue / Asul', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  { id: 'red', name: 'Red / Pula', bg: 'bg-red-600', text: 'text-white', border: 'border-red-500' },
  { id: 'green', name: 'Green / Berde', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400' },
];

const CHIP_VALUES = [10, 50, 100, 200, 500];

export const ColorGame: React.FC<ColorGameProps> = ({
  userBalance,
  onBalanceUpdate,
  onClose,
  onOpenCashier,
}) => {
  const [selectedChip, setSelectedChip] = useState(50);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isRolling, setIsRolling] = useState(false);
  const [dice, setDice] = useState<string[]>(['yellow', 'red', 'blue']);
  const [lastResult, setLastResult] = useState<{
    totalBet: number;
    totalWin: number;
    netProfit: number;
    matchDetails: Record<string, { matches: number; win: number }>;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const totalCurrentBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const handleAddBet = (colorId: string) => {
    sounds.playClick();
    if (userBalance < totalCurrentBet + selectedChip) {
      onOpenCashier();
      return;
    }
    setBets(prev => ({
      ...prev,
      [colorId]: (prev[colorId] || 0) + selectedChip,
    }));
  };

  const handleClearBets = () => {
    sounds.playClick();
    setBets({});
    setLastResult(null);
  };

  const handleRollDice = async () => {
    if (isRolling || totalCurrentBet <= 0) return;

    if (userBalance < totalCurrentBet) {
      onOpenCashier();
      return;
    }

    setIsRolling(true);
    sounds.playDiceRoll();

    try {
      const res = await api.rollColorGame(bets);

      // Simulate 800ms perya dice shaking and drop
      setTimeout(() => {
        if (res.success && res.dice) {
          setDice(res.dice);
          setLastResult({
            totalBet: res.totalBet,
            totalWin: res.totalWin,
            netProfit: res.netProfit,
            matchDetails: res.matchDetails,
          });

          if (res.newBalance !== undefined) {
            onBalanceUpdate(res.newBalance);
          }

          if (res.totalWin > 0) {
            if (res.netProfit > 200) {
              sounds.playBigWin();
            } else {
              sounds.playWin();
            }
          }
        }
        setIsRolling(false);
      }, 850);
    } catch {
      setIsRolling(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-slate-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎪</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-400 tracking-wide">
              PERYA COLOR GAME 88
            </h2>
            <div className="flex items-center gap-2 text-xs text-amber-200/70">
              <span>Pinoy Carnival Classic</span>
              <span>·</span>
              <span>3-Dice Fair Drop</span>
              <span>·</span>
              <span>Up to 3x Win</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
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

      {/* Main Board Arena */}
      <div className="p-4 sm:p-6 bg-radial from-amber-950/20 via-slate-950 to-slate-950">
        {/* Dice Roller Display (Funnel / Drop box) */}
        <div className="p-4 bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl shadow-inner mb-6 text-center">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-300/80 mb-2 block">
            {isRolling ? 'Rolling Perya Dice...' : 'Winning Dice Result'}
          </span>

          <div className="flex justify-center items-center gap-4 sm:gap-6 my-2">
            {dice.map((col, idx) => {
              const colorObj = COLORS_DATA.find(c => c.id === col) || COLORS_DATA[0];
              return (
                <div
                  key={idx}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-xl border-4 ${
                    isRolling ? 'animate-spin scale-90 opacity-60' : 'scale-100'
                  } ${colorObj.bg} ${colorObj.border} transition-all duration-300`}
                >
                  <span className={`text-sm font-black uppercase ${colorObj.text}`}>
                    {colorObj.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Results Outcome */}
          {lastResult && !isRolling && (
            <div className="mt-3 text-sm">
              {lastResult.totalWin > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Winner! You won ₱{lastResult.totalWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}! (Net: +₱{lastResult.netProfit})
                </span>
              ) : (
                <span className="text-slate-400 font-medium">
                  No match this round. Good luck on the next pull!
                </span>
              )}
            </div>
          )}
        </div>

        {/* 6 Betting Boxes (Color Board) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {COLORS_DATA.map(col => {
            const currentBet = bets[col.id] || 0;
            const matchInfo = lastResult?.matchDetails?.[col.id];

            return (
              <button
                key={col.id}
                disabled={isRolling}
                onClick={() => handleAddBet(col.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-between min-h-[110px] group ${col.bg} ${col.border} hover:brightness-105 active:scale-95 shadow-md`}
              >
                <span className={`text-base sm:text-lg font-black tracking-wide uppercase ${col.text}`}>
                  {col.name}
                </span>

                {/* Bet Chip placed */}
                {currentBet > 0 ? (
                  <div className="px-3 py-1 bg-slate-950/80 text-amber-400 font-mono font-bold text-xs sm:text-sm rounded-full border border-amber-400 shadow-md">
                    ₱{currentBet}
                  </div>
                ) : (
                  <span className={`text-xs opacity-75 font-semibold ${col.text}`}>
                    Tap to Bet
                  </span>
                )}

                {/* Match indicator from last roll */}
                {matchInfo && matchInfo.matches > 0 && !isRolling && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-md uppercase">
                    {matchInfo.matches}x Win!
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chip Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          {/* Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase mr-1">Chip:</span>
            {CHIP_VALUES.map(val => (
              <button
                key={val}
                disabled={isRolling}
                onClick={() => {
                  sounds.playClick();
                  setSelectedChip(val);
                }}
                className={`w-10 h-10 rounded-full font-mono text-xs font-black border-2 transition-all ${
                  selectedChip === val
                    ? 'bg-amber-500 text-slate-950 border-white scale-110 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400'
                }`}
              >
                {val}
              </button>
            ))}

            {totalCurrentBet > 0 && (
              <button
                disabled={isRolling}
                onClick={handleClearBets}
                className="ml-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Roll Lever Action */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Bet:</span>
              <span className="text-base font-mono font-bold text-amber-400">
                ₱{totalCurrentBet}
              </span>
            </div>

            <button
              disabled={isRolling || totalCurrentBet <= 0}
              onClick={handleRollDice}
              className={`px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-lg ${
                isRolling || totalCurrentBet <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-amber-500/30'
              }`}
            >
              {isRolling ? 'DROPPING DICE...' : 'PULL LEVER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
