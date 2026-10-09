import React, { useState } from 'react';
import { Gem, Bomb, Volume2, VolumeX, X } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../utils/audio';

interface DiamondMinesGameProps {
  userBalance: number;
  onBalanceUpdate: (newBal: number) => void;
  onClose: () => void;
  onOpenCashier: () => void;
}

export const DiamondMinesGame: React.FC<DiamondMinesGameProps> = ({
  userBalance,
  onBalanceUpdate,
  onClose,
  onOpenCashier,
}) => {
  const [bet, setBet] = useState(50);
  const [minesCount, setMinesCount] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [revealedDiamonds, setRevealedDiamonds] = useState<number[]>([]);
  const [allMines, setAllMines] = useState<number[]>([]);
  const [hitMineIndex, setHitMineIndex] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState(1.15);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleStartGame = async () => {
    sounds.playClick();
    if (userBalance < bet) {
      onOpenCashier();
      return;
    }

    setIsLoading(true);
    setRevealedDiamonds([]);
    setAllMines([]);
    setHitMineIndex(null);
    setLastWin(null);

    const res = await api.startMines(bet, minesCount);
    setIsLoading(false);

    if (res.success && res.sessionId) {
      setSessionId(res.sessionId);
      setIsPlaying(true);
      setCurrentMultiplier(1.0);
      setNextMultiplier(res.nextMultiplier || 1.15);
      if (res.newBalance !== undefined) {
        onBalanceUpdate(res.newBalance);
      }
    }
  };

  const handleTileClick = async (index: number) => {
    if (!isPlaying || !sessionId || isLoading || revealedDiamonds.includes(index)) return;

    setIsLoading(true);
    const res = await api.revealMineTile(sessionId, index);
    setIsLoading(false);

    if (!res.success) return;

    if (res.hitMine) {
      sounds.playExplosion();
      setHitMineIndex(index);
      setAllMines(res.allMines || []);
      setIsPlaying(false);
      setSessionId(null);
      if (res.newBalance !== undefined) {
        onBalanceUpdate(res.newBalance);
      }
    } else {
      sounds.playDiamond();
      setRevealedDiamonds(prev => [...prev, index]);
      setCurrentMultiplier(res.multiplier || 1.0);
      setNextMultiplier(res.nextMultiplier || 1.0);

      if (res.gameOver && res.wonMax) {
        sounds.playBigWin();
        setIsPlaying(false);
        setAllMines(res.allMines || []);
        setLastWin(res.currentCashout || 0);
        if (res.newBalance !== undefined) {
          onBalanceUpdate(res.newBalance);
        }
      }
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || !sessionId || revealedDiamonds.length === 0 || isLoading) return;

    setIsLoading(true);
    const res = await api.cashoutMines(sessionId);
    setIsLoading(false);

    if (res.success) {
      sounds.playCashout();
      setIsPlaying(false);
      setAllMines(res.allMines || []);
      setLastWin(res.winAmount || 0);
      if (res.newBalance !== undefined) {
        onBalanceUpdate(res.newBalance);
      }
    }
  };

  const currentCashout = Math.round(bet * currentMultiplier * 100) / 100;

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-slate-950 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          <Gem className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-blue-400 tracking-wide">
              DIAMOND MINES 88
            </h2>
            <div className="flex items-center gap-2 text-xs text-blue-200/70">
              <span>Provably Fair</span>
              <span>·</span>
              <span>RTP 97.0%</span>
              <span>·</span>
              <span>Custom Mines</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800"
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

      {/* Main Grid & Controls */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Setup Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Bet Selector */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase block mb-1.5">
                Bet Amount (PHP)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[20, 50, 100, 200, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    disabled={isPlaying}
                    onClick={() => {
                      sounds.playClick();
                      setBet(amt);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      bet === amt
                        ? 'bg-blue-600/30 text-blue-300 border-blue-400'
                        : 'text-slate-400 border-slate-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Mines Count Selector */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400 font-semibold uppercase">Mines Count</span>
                <span className="text-blue-400 font-mono font-bold">{minesCount} Mines ({25 - minesCount} Gems)</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 5, 10, 15, 20, 24].map(count => (
                  <button
                    key={count}
                    disabled={isPlaying}
                    onClick={() => {
                      sounds.playClick();
                      setMinesCount(count);
                    }}
                    className={`py-1 text-xs font-bold rounded-lg border transition-colors ${
                      minesCount === count
                        ? 'bg-red-950/60 text-red-300 border-red-500'
                        : 'text-slate-400 border-slate-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Stats */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Diamonds Found:</span>
                <span className="text-white font-mono font-bold">{revealedDiamonds.length} / {25 - minesCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Multiplier:</span>
                <span className="text-emerald-400 font-mono font-bold">{currentMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Next Tile Multiplier:</span>
                <span className="text-blue-400 font-mono font-bold">{nextMultiplier.toFixed(2)}x</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {isPlaying ? (
              <button
                disabled={revealedDiamonds.length === 0 || isLoading}
                onClick={handleCashout}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {revealedDiamonds.length === 0 ? 'Pick a Tile' : `Cashout ₱${currentCashout.toFixed(2)}`}
              </button>
            ) : (
              <button
                onClick={handleStartGame}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Bet ₱{bet} & Start
              </button>
            )}
          </div>
        </div>

        {/* Right Side: 5x5 Mines Grid */}
        <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 max-w-md w-full aspect-square">
            {Array.from({ length: 25 }, (_, i) => {
              const isRevealedDiamond = revealedDiamonds.includes(i);
              const isMine = allMines.includes(i);
              const isHitMine = hitMineIndex === i;

              return (
                <button
                  key={i}
                  disabled={!isPlaying || isRevealedDiamond}
                  onClick={() => handleTileClick(i)}
                  className={`relative rounded-xl border flex items-center justify-center transition-all duration-200 aspect-square select-none ${
                    isRevealedDiamond
                      ? 'bg-gradient-to-br from-blue-900/60 to-cyan-950 border-blue-400 shadow-md shadow-blue-500/20 scale-95'
                      : isHitMine
                      ? 'bg-red-600/40 border-red-500 shadow-lg shadow-red-500/30 animate-shake'
                      : isMine
                      ? 'bg-slate-900/80 border-slate-700 opacity-60'
                      : isPlaying
                      ? 'bg-slate-800/90 border-slate-700 hover:border-blue-400 hover:bg-slate-750 active:scale-95 shadow-inner'
                      : 'bg-slate-800/60 border-slate-700/80 cursor-default'
                  }`}
                >
                  {isRevealedDiamond ? (
                    <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300 drop-shadow-md animate-bounce" />
                  ) : isHitMine ? (
                    <Bomb className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  ) : isMine ? (
                    <Bomb className="w-5 h-5 text-slate-500" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 group-hover:bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Win / Loss Announcements */}
          {lastWin !== null && (
            <div className="mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-xl text-sm font-bold animate-pulse">
              🏆 You Won ₱{lastWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}!
            </div>
          )}
          {hitMineIndex !== null && (
            <div className="mt-4 px-4 py-2 bg-red-500/20 border border-red-400 text-red-300 rounded-xl text-sm font-bold">
              💥 Boom! Mine triggered. Good luck next round!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
