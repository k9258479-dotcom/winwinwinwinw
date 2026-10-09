import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, Zap, HelpCircle, X, Trophy, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../utils/audio';
import { SlotSymbol, SlotSpinResponse } from '../../types';

interface SlotMachineGameProps {
  userBalance: number;
  onBalanceUpdate: (newBal: number) => void;
  onClose: () => void;
  onOpenCashier: () => void;
}

const DEFAULT_SYMBOLS: SlotSymbol[][] = [
  [
    { id: 'DRAGON', name: 'Golden Dragon', icon: '🐲', isWild: false, isScatter: false },
    { id: 'INGOT', name: 'Gold Ingot', icon: '🪙', isWild: false, isScatter: false },
    { id: 'LANTERN', name: 'Red Lantern', icon: '🏮', isWild: false, isScatter: false },
  ],
  [
    { id: 'WILD', name: 'Wild Jade', icon: '💎', isWild: true, isScatter: false },
    { id: 'KOI', name: 'Lucky Koi', icon: '🐟', isWild: false, isScatter: false },
    { id: 'A', name: 'Ace', icon: '🎴', isWild: false, isScatter: false },
  ],
  [
    { id: 'SCATTER', name: 'Scatter Free Spin', icon: '⚡', isWild: false, isScatter: true },
    { id: 'DRAGON', name: 'Golden Dragon', icon: '🐲', isWild: false, isScatter: false },
    { id: 'K', name: 'King', icon: '👑', isWild: false, isScatter: false },
  ],
  [
    { id: 'INGOT', name: 'Gold Ingot', icon: '🪙', isWild: false, isScatter: false },
    { id: 'WILD', name: 'Wild Jade', icon: '💎', isWild: true, isScatter: false },
    { id: 'LANTERN', name: 'Red Lantern', icon: '🏮', isWild: false, isScatter: false },
  ],
  [
    { id: 'KOI', name: 'Lucky Koi', icon: '🐟', isWild: false, isScatter: false },
    { id: 'DRAGON', name: 'Golden Dragon', icon: '🐲', isWild: false, isScatter: false },
    { id: 'Q', name: 'Queen', icon: '🪭', isWild: false, isScatter: false },
  ],
];

const BET_STEPS = [10, 20, 50, 100, 250, 500, 1000];

export const SlotMachineGame: React.FC<SlotMachineGameProps> = ({
  userBalance,
  onBalanceUpdate,
  onClose,
  onOpenCashier,
}) => {
  const [grid, setGrid] = useState<SlotSymbol[][]>(DEFAULT_SYMBOLS);
  const [betIndex, setBetIndex] = useState(2); // ₱50 default
  const [isSpinning, setIsSpinning] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [lastWin, setLastWin] = useState<number>(0);
  const [accumulatedWin, setAccumulatedWin] = useState<number>(0);
  const [winningLines, setWinningLines] = useState<SlotSpinResponse['winningLines']>([]);
  const [showPaytable, setShowPaytable] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState<number | null>(null);

  const bet = BET_STEPS[betIndex];
  const autoSpinRef = useRef<number>(0);
  autoSpinRef.current = autoSpinsLeft;

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleBetChange = (delta: number) => {
    sounds.playClick();
    const nextIdx = Math.max(0, Math.min(BET_STEPS.length - 1, betIndex + delta));
    setBetIndex(nextIdx);
  };

  const handleMaxBet = () => {
    sounds.playClick();
    setBetIndex(BET_STEPS.length - 1);
  };

  const executeSpin = async () => {
    if (isSpinning) return;
    const currentBet = freeSpinsLeft > 0 ? 0 : bet;

    if (freeSpinsLeft === 0 && userBalance < currentBet) {
      sounds.playClick();
      onOpenCashier();
      return;
    }

    setIsSpinning(true);
    setWinningLines([]);
    setLastWin(0);
    sounds.playReelTick();

    try {
      const response = await api.spinSlot(freeSpinsLeft > 0 ? bet : currentBet);

      // Reel spin delay for realistic sensation
      const spinDuration = turboMode ? 400 : 900;
      setTimeout(() => {
        if (response.success && response.grid && response.grid.length === 5) {
          setGrid(response.grid);
          onBalanceUpdate(response.newBalance);

          if (response.totalWin > 0) {
            setLastWin(response.totalWin);
            setAccumulatedWin(prev => prev + response.totalWin);
            setWinningLines(response.winningLines || []);

            // Check Big Win (> 10x bet)
            if (response.totalWin >= bet * 10) {
              sounds.playBigWin();
              setBigWinAmount(response.totalWin);
            } else {
              sounds.playWin();
            }
          }

          // Handle Free Spins trigger
          if (response.freeSpinsWon > 0) {
            sounds.playBigWin();
            setFreeSpinsLeft(prev => prev + response.freeSpinsWon);
          } else if (freeSpinsLeft > 0) {
            setFreeSpinsLeft(prev => Math.max(0, prev - 1));
          }
        }

        setIsSpinning(false);

        // Next auto spin cycle
        if (autoSpinRef.current > 0 || freeSpinsLeft > 1) {
          setTimeout(() => {
            if (autoSpinRef.current > 0) {
              setAutoSpinsLeft(prev => Math.max(0, prev - 1));
            }
            executeSpin();
          }, 600);
        }
      }, spinDuration);
    } catch {
      setIsSpinning(false);
    }
  };

  const startAutoSpin = (count: number) => {
    sounds.playClick();
    setAutoSpinsLeft(count);
    if (!isSpinning) {
      executeSpin();
    }
  };

  const stopAutoSpin = () => {
    sounds.playClick();
    setAutoSpinsLeft(0);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-slate-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐲</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-400 tracking-wide">
              SUPER GOLDEN FORTUNE
            </h2>
            <div className="flex items-center gap-2 text-xs text-amber-200/70">
              <span>JILI Gaming</span>
              <span>·</span>
              <span>9 Paylines</span>
              <span>·</span>
              <span>RTP 97.4%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {freeSpinsLeft > 0 && (
            <div className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black uppercase rounded-lg animate-pulse tracking-wider">
              Free Spins: {freeSpinsLeft}
            </div>
          )}

          <button
            onClick={() => setShowPaytable(true)}
            title="Paytable & Rules"
            className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-800"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-800"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Reels Arena */}
      <div className="p-4 sm:p-6 bg-radial from-amber-950/20 via-slate-950 to-slate-950">
        {/* Jackpot / Win Display */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-slate-900/90 border border-amber-500/20 rounded-xl text-center">
            <span className="text-xs text-amber-300/70 block uppercase tracking-wider font-semibold">Total Balance</span>
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono tabular-nums">
              ₱{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
            <span className="text-xs text-amber-400 block uppercase tracking-wider font-bold">Last Win</span>
            <span className={`text-lg sm:text-xl font-black font-mono tabular-nums transition-colors ${lastWin > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
              ₱{lastWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-amber-500/20 rounded-xl text-center">
            <span className="text-xs text-amber-300/70 block uppercase tracking-wider font-semibold">Accumulated</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
              ₱{accumulatedWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 5x3 Reel Box */}
        <div className="relative p-3 sm:p-4 bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-inner shadow-black/80">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {grid.map((column, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-2 sm:gap-3 bg-slate-950/80 p-1.5 sm:p-2 rounded-xl border border-slate-800"
              >
                {column.map((symbol, rowIdx) => {
                  const isWinningSymbol = winningLines.some(
                    line => line.path[colIdx] === rowIdx
                  );

                  return (
                    <div
                      key={rowIdx}
                      className={`relative flex flex-col items-center justify-center h-20 sm:h-28 rounded-lg transition-all duration-200 ${
                        isSpinning
                          ? 'animate-pulse scale-95 opacity-70'
                          : isWinningSymbol
                          ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-102'
                          : 'bg-slate-900 border border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none transition-transform">
                        {symbol.icon}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate max-w-[90%] text-center mt-1">
                        {symbol.name}
                      </span>

                      {symbol.isWild && (
                        <span className="absolute top-1 right-1 text-[9px] font-black bg-emerald-500 text-slate-950 px-1 rounded uppercase">
                          Wild
                        </span>
                      )}
                      {symbol.isScatter && (
                        <span className="absolute top-1 right-1 text-[9px] font-black bg-amber-400 text-slate-950 px-1 rounded uppercase">
                          Free
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Winning Line Announcements */}
          {winningLines.length > 0 && !isSpinning && (
            <div className="mt-3 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs sm:text-sm text-amber-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Hit {winningLines.length} Winning Line{winningLines.length > 1 ? 's' : ''}!</span>
              </div>
              <span className="font-bold text-amber-400">
                +₱{lastWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Control Deck */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          {/* Bet Adjuster */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Bet:</span>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1">
              <button
                disabled={isSpinning || betIndex === 0}
                onClick={() => handleBetChange(-1)}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 text-lg font-bold"
              >
                -
              </button>
              <span className="px-3 text-sm sm:text-base font-bold text-amber-400 font-mono tabular-nums min-w-[70px] text-center">
                ₱{bet}
              </span>
              <button
                disabled={isSpinning || betIndex === BET_STEPS.length - 1}
                onClick={() => handleBetChange(1)}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 text-lg font-bold"
              >
                +
              </button>
            </div>

            <button
              disabled={isSpinning || betIndex === BET_STEPS.length - 1}
              onClick={handleMaxBet}
              className="px-3 py-2 text-xs font-bold text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors uppercase"
            >
              Max Bet
            </button>
          </div>

          {/* Turbo & Auto Spin */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setTurboMode(!turboMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                turboMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Turbo</span>
            </button>

            {autoSpinsLeft > 0 ? (
              <button
                onClick={stopAutoSpin}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Stop ({autoSpinsLeft})</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-700 rounded-lg">
                {[10, 20, 50].map(count => (
                  <button
                    key={count}
                    disabled={isSpinning}
                    onClick={() => startAutoSpin(count)}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-amber-400 disabled:opacity-30 hover:bg-slate-800 rounded font-semibold"
                  >
                    {count}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Spin Button */}
          <div>
            <button
              disabled={isSpinning}
              onClick={executeSpin}
              className={`relative px-8 py-3 rounded-xl font-black text-sm sm:text-base tracking-wider uppercase shadow-lg transition-all duration-150 ${
                isSpinning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-amber-500/30'
              }`}
            >
              {isSpinning ? 'SPINNING...' : freeSpinsLeft > 0 ? `FREE SPIN (${freeSpinsLeft})` : 'SPIN ₱' + bet}
            </button>
          </div>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-20 p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Paytable & Rules
            </h3>
            <button
              onClick={() => setShowPaytable(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">💎 Wild Jade</div>
              <p className="text-slate-400">Substitutes for all symbols except Scatter. 5x Pays 150x Line Bet.</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">⚡ Free Spin Scatter</div>
              <p className="text-slate-400">3 or more Scatters anywhere on reels awards 10 to 25 Free Spins!</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">🐲 Golden Dragon</div>
              <p className="text-slate-400">5 of a kind pays 100x Line Bet. 4x pays 25x. 3x pays 10x.</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">🪙 Gold Ingot</div>
              <p className="text-slate-400">5 of a kind pays 50x Line Bet. 4x pays 15x. 3x pays 5x.</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">🏮 Red Lantern</div>
              <p className="text-slate-400">5 of a kind pays 30x Line Bet. 4x pays 10x. 3x pays 3x.</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-2xl mb-1">🐟 Lucky Koi</div>
              <p className="text-slate-400">5 of a kind pays 20x Line Bet. 4x pays 8x. 3x pays 2x.</p>
            </div>
          </div>
        </div>
      )}

      {/* Big Win Celebration Modal */}
      {bigWinAmount !== null && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex items-center justify-center p-4">
          <div className="text-center p-8 bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl max-w-sm w-full animate-bounce">
            <span className="text-5xl">🏆</span>
            <h3 className="text-2xl font-black text-amber-400 tracking-wider uppercase mt-2">
              MEGA BIG WIN!
            </h3>
            <p className="text-slate-300 text-xs mt-1">Dragon Fortune has smiled upon you!</p>
            <div className="my-6 text-3xl font-black text-white font-mono tabular-nums">
              +₱{bigWinAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => {
                sounds.playCashout();
                setBigWinAmount(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl uppercase tracking-wider hover:brightness-110"
            >
              Collect ₱{bigWinAmount.toLocaleString()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
