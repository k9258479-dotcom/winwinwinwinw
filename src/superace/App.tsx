/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GridCard, SpinHistoryItem, Mission } from './types/game';
import {
  getInitialGrid,
  generateRandomGrid,
  evaluateWins,
  cascadeGrid,
  MULTIPLIERS,
  FREE_MULTIPLIERS,
} from './utils/gameLogic';
import { sound } from './utils/audio';
import { MultiplierBar } from './components/MultiplierBar';
import { JackpotTiers } from './components/JackpotTiers';
import { Sidebar } from './components/Sidebar';
import { SlotReels } from './components/SlotReels';
import { BottomControls } from './components/BottomControls';
import { BuyBonusModal } from './components/modals/BuyBonusModal';
import { JackpotModal } from './components/modals/JackpotModal';
import { BetSelectorModal } from './components/modals/BetSelectorModal';
import { BackpackModal } from './components/modals/BackpackModal';
import { MissionsModal } from './components/modals/MissionsModal';
import { WinMoreModal } from './components/modals/WinMoreModal';
import { TournamentModal } from './components/modals/TournamentModal';
import { HighlightsModal } from './components/modals/HighlightsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { BigWinOverlay } from './components/modals/BigWinOverlay';
import { FreeSpinsIntroOverlay } from './components/modals/FreeSpinsIntroOverlay';

export default function App() {
  // Game Play State
  const [grid, setGrid] = useState<GridCard[][]>(() => getInitialGrid());
  const [balance, setBalance] = useState<number>(0.2);
  const [bet, setBet] = useState<number>(0.5);
  const [currentWin, setCurrentWin] = useState<number>(0);
  const [multiplierIndex, setMultiplierIndex] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());

  // Special Modes
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [autoCount, setAutoCount] = useState<number>(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState<number>(0);

  // Player Progression & Audio
  const [playerLevel, setPlayerLevel] = useState<number>(0);
  const [playerXP, setPlayerXP] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<SpinHistoryItem[]>([]);

  // Modals
  const [isBuyBonusOpen, setIsBuyBonusOpen] = useState<boolean>(false);
  const [isJackpotOpen, setIsJackpotOpen] = useState<boolean>(false);
  const [isBetSelectorOpen, setIsBetSelectorOpen] = useState<boolean>(false);
  const [isBackpackOpen, setIsBackpackOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isWinMoreOpen, setIsWinMoreOpen] = useState<boolean>(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState<boolean>(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [bigWinOverlayData, setBigWinOverlayData] = useState<{ isOpen: boolean; amount: number }>({
    isOpen: false,
    amount: 0,
  });
  const [freeSpinsIntroOpen, setFreeSpinsIntroOpen] = useState<boolean>(false);

  // Missions State
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'm1',
      title: 'Spin Apprentice',
      description: 'Spin the reels 10 times',
      current: 0,
      target: 10,
      reward: 5,
      completed: false,
      claimed: false,
    },
    {
      id: 'm2',
      title: 'Cascade Master',
      description: 'Reach an x3 or higher cascade combo',
      current: 0,
      target: 3,
      reward: 15,
      completed: false,
      claimed: false,
    },
    {
      id: 'm3',
      title: 'High Roller Strike',
      description: 'Hit a Big Win (>15x bet)',
      current: 0,
      target: 1,
      reward: 30,
      completed: false,
      claimed: false,
    },
  ]);

  const isFreeGame = freeSpinsLeft > 0;
  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  // Sound sync
  const toggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // Add demo balance
  const addBalance = (amount: number) => {
    setBalance(prev => +(prev + amount).toFixed(3));
  };

  // Claim mission
  const claimMissionReward = (missionId: string, reward: number) => {
    setMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, claimed: true } : m))
    );
    addBalance(reward);
  };

  // Check XP and level up
  const addXP = (points: number) => {
    setPlayerXP(prev => {
      const newXP = prev + points;
      const nextLevelThreshold = (playerLevel + 1) * 100;
      if (newXP >= nextLevelThreshold) {
        setPlayerLevel(lvl => lvl + 1);
        sound.playGoldenTransform();
        addBalance(5); // Level up gift
      }
      return newXP;
    });
  };

  // Update mission progress
  const updateMissions = (type: 'SPIN' | 'CASCADE' | 'BIG_WIN', val: number = 1) => {
    setMissions(prev =>
      prev.map(m => {
        if (m.claimed) return m;
        let nextCurrent = m.current;
        if (type === 'SPIN' && m.id === 'm1') {
          nextCurrent = Math.min(m.target, m.current + val);
        } else if (type === 'CASCADE' && m.id === 'm2' && val >= 2) {
          nextCurrent = Math.min(m.target, m.current + 1);
        } else if (type === 'BIG_WIN' && m.id === 'm3' && val >= 1) {
          nextCurrent = Math.min(m.target, m.current + 1);
        }
        return {
          ...m,
          current: nextCurrent,
          completed: nextCurrent >= m.target,
        };
      })
    );
  };

  // Perform cascading steps recursively
  const runCascades = async (
    currentGrid: GridCard[][],
    stepIndex: number,
    accumulatedWin: number
  ): Promise<{ finalGrid: GridCard[][]; totalWin: number }> => {
    const steps = isFreeGame ? FREE_MULTIPLIERS : MULTIPLIERS;
    const currentMultiplier = steps[Math.min(stepIndex, steps.length - 1)];

    // Evaluate wins on current grid
    const { winLines, winningCells: winningSet, totalPayout } = evaluateWins(
      currentGrid,
      bet,
      currentMultiplier
    );

    if (winLines.length === 0) {
      // No further wins in cascade
      setWinningCells(new Set());
      return { finalGrid: currentGrid, totalWin: accumulatedWin };
    }

    // Win found!
    setWinningCells(winningSet);
    setMultiplierIndex(Math.min(stepIndex, steps.length - 1));
    sound.playWin(stepIndex + 1);

    const newAccumulatedWin = +(accumulatedWin + totalPayout).toFixed(3);
    setCurrentWin(newAccumulatedWin);

    // Wait for win highlight
    const highlightDelay = isTurbo ? 180 : 400;
    await new Promise(r => setTimeout(r, highlightDelay));

    // Cascade grid: golden cards transform to wilds, others vanish
    const { nextGrid, goldenWildsCreated } = cascadeGrid(currentGrid, winningSet);
    if (goldenWildsCreated > 0) {
      sound.playGoldenTransform();
    }

    setGrid(nextGrid);
    setWinningCells(new Set());

    // Wait for tumble settling
    const tumbleDelay = isTurbo ? 150 : 350;
    await new Promise(r => setTimeout(r, tumbleDelay));

    // Next cascade recursion
    return runCascades(nextGrid, stepIndex + 1, newAccumulatedWin);
  };

  // Main Spin Handler
  const handleSpin = useCallback(async () => {
    if (isSpinningRef.current) return;

    // Check balance if not a free spin
    if (!isFreeGame && balance < bet) {
      // Auto top-up prompt / bonus if completely broke to keep gameplay seamless
      addBalance(50.0);
      return;
    }

    setIsSpinning(true);
    setCurrentWin(0);
    setWinningCells(new Set());
    setMultiplierIndex(0);

    // Deduct bet or decrement free spins
    if (isFreeGame) {
      setFreeSpinsLeft(prev => prev - 1);
    } else {
      setBalance(prev => +(prev - bet).toFixed(3));
    }

    sound.playSpin();
    updateMissions('SPIN', 1);
    addXP(10);

    // Spin animation for each column
    setSpinningCols([true, true, true, true, true]);

    const newTargetGrid = generateRandomGrid();
    const initialSpinDuration = isTurbo ? 200 : 450;
    const colStopDelay = isTurbo ? 90 : 200;

    // Initial spin run for all reels scrolling downwards
    await new Promise(r => setTimeout(r, initialSpinDuration));

    // Sequential reel stops from left to right with individual card updates & bounce
    for (let c = 0; c < 5; c++) {
      // Update this column's cards to the newly rolled cards
      setGrid(prevGrid => {
        const next = [...prevGrid];
        next[c] = newTargetGrid[c];
        return next;
      });

      // Stop spinning for this column
      setSpinningCols(prev => {
        const next = [...prev];
        next[c] = false;
        return next;
      });

      sound.playReelStop(c);

      // Delay before next reel stops
      if (c < 4) {
        await new Promise(r => setTimeout(r, colStopDelay));
      }
    }

    // Brief settling pause after reel 5 lands before checking cascade wins
    await new Promise(r => setTimeout(r, isTurbo ? 100 : 220));

    // Run cascade loop
    const { finalGrid, totalWin } = await runCascades(newTargetGrid, 0, 0);

    // Check if 3+ Scatters appeared anywhere in the final layout to award Free Spins
    let scatterCount = 0;
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 4; r++) {
        if (finalGrid[c][r].symbol === 'SCATTER') scatterCount++;
      }
    }

    // Free spins triggered
    if (scatterCount >= 3) {
      sound.playBigWin();
      setFreeSpinsIntroOpen(true);
      setFreeSpinsLeft(prev => prev + 10);
    }

    // Win payouts
    if (totalWin > 0) {
      addBalance(totalWin);
      if (isFreeGame) {
        setTotalFreeSpinWin(prev => +(prev + totalWin).toFixed(3));
      }

      // Check Big Win threshold
      if (totalWin >= bet * 15) {
        sound.playBigWin();
        updateMissions('BIG_WIN', 1);
        setBigWinOverlayData({ isOpen: true, amount: totalWin });
      }

      if (multiplierIndex >= 2) {
        updateMissions('CASCADE', multiplierIndex);
      }
    }

    // Add to history
    setHistory(prev => [
      {
        id: `spin-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bet,
        payout: totalWin,
        multiplier: (isFreeGame ? FREE_MULTIPLIERS : MULTIPLIERS)[multiplierIndex],
        isFreeSpin: isFreeGame,
      },
      ...prev.slice(0, 19),
    ]);

    setIsSpinning(false);

    // Auto Spin management
    if (isAuto && autoCount > 1) {
      setAutoCount(prev => prev - 1);
      setTimeout(() => {
        handleSpin();
      }, isTurbo ? 400 : 800);
    } else if (isAuto && autoCount === 1) {
      setIsAuto(false);
      setAutoCount(0);
    }
  }, [
    isFreeGame,
    balance,
    bet,
    isTurbo,
    isAuto,
    autoCount,
    multiplierIndex,
  ]);

  // Keyboard shortcut: Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin]);

  // Auto spin toggle
  const toggleAuto = () => {
    if (isAuto) {
      setIsAuto(false);
      setAutoCount(0);
    } else {
      setIsAuto(true);
      setAutoCount(20);
      if (!isSpinning) {
        handleSpin();
      }
    }
  };

  // Buy Bonus Execution
  const handleConfirmBuyBonus = () => {
    const cost = bet * 50;
    if (balance >= cost) {
      setBalance(prev => +(prev - cost).toFixed(3));
      setIsBuyBonusOpen(false);
      setFreeSpinsIntroOpen(true);
      setFreeSpinsLeft(10);
      sound.playBigWin();
    }
  };

  const hasClaimableMission = missions.some(m => m.completed && !m.claimed);

  return (
    <div className="bg-black text-white flex justify-center items-center min-h-screen select-none overflow-hidden m-0 p-0 font-ui">
      {/* BEGIN: Mobile Frame */}
      <div className="relative w-full max-w-[420px] h-[100dvh] max-h-[880px] bg-[#0c0d14] flex flex-col justify-between overflow-hidden shadow-2xl border border-zinc-800">
        {/* Deep Red Luxury Casino Curtain Background (turns royal gold in Free Spins!) */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
            isFreeGame
              ? 'opacity-65 bg-[radial-gradient(circle_at_50%_0%,#b45309_0%,#78350f_50%,#090812_90%)]'
              : 'opacity-45 bg-[radial-gradient(circle_at_50%_0%,#a81010_0%,#3b0202_50%,#090812_90%)]'
          }`}
        ></div>

        {/* Free Game Glowing Banner if active */}
        {isFreeGame && (
          <div className="relative z-30 w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-0.5 px-3 flex items-center justify-between text-black text-xs font-black shadow-md">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-gem text-purple-900 animate-bounce"></i>
              FREE GAME MODE
            </span>
            <span className="font-numbers text-sm">SPINS LEFT: {freeSpinsLeft}</span>
          </div>
        )}

        {/* BEGIN: MainHeader Area */}
        <header className="relative z-10 w-full pt-1 px-2 flex flex-col items-center">
          {/* Top Title & Floating Badges Row */}
          <div className="w-full flex items-center justify-between relative mt-1">
            {/* Collapsible Menu Arrow Indicator */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-5 h-7 bg-amber-950/60 border border-amber-500/40 rounded-r flex items-center justify-center text-amber-400 text-xs shadow-md hover:bg-amber-900/80 active:scale-95 transition-all"
              title="Game Menu"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            {/* Center: Super Ace Logo */}
            <div className="flex flex-col items-center leading-none z-10 select-none">
              <h1 className="font-game-title text-3xl italic tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] scale-y-110">
                Super
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600">
                  Ace
                </span>
              </h1>
            </div>

            {/* Right Side: Buy Bonus & Jackpot Legend Badges */}
            <div className="flex items-center gap-1.5">
              {/* Buy Bonus Stamp Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsBuyBonusOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-900 border-2 border-amber-300 p-0.5 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform hover:brightness-110"
                title="Buy Free Spins Feature"
              >
                <span className="text-[9px] font-black uppercase text-amber-200 leading-none tracking-tight">
                  BUY
                </span>
                <span className="text-[9px] font-black uppercase text-white leading-none tracking-tight mt-0.5">
                  BONUS
                </span>
              </button>

              {/* Jackpot Legend Badge */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsJackpotOpen(true);
                }}
                className="relative py-0.5 px-1.5 rounded-md bg-gradient-to-r from-purple-900/90 to-fuchsia-900/90 border border-fuchsia-400 shadow-neon-purple flex flex-col items-center hover:scale-105 active:scale-95 transition-transform"
                title="Jackpot Legend"
              >
                <span className="text-[8px] font-black text-amber-300 tracking-tighter leading-none italic uppercase">
                  Jackpot
                </span>
                <span className="text-[10px] font-black text-fuchsia-100 tracking-tighter leading-none italic uppercase drop-shadow-[0_0_4px_#ff00ea]">
                  Legend
                </span>
              </button>
            </div>
          </div>

          {/* Multipliers Ribbon Bar (x1, x2, x3, x5 or in Free Spins: x2, x4, x6, x10) */}
          <MultiplierBar
            currentMultiplierIndex={multiplierIndex}
            isFreeGame={isFreeGame}
          />
        </header>
        {/* END: MainHeader Area */}

        {/* BEGIN: Jackpot Tiers Modal / Overlay Display */}
        <JackpotTiers
          currentBet={bet}
          onOpenJackpotModal={() => setIsJackpotOpen(true)}
        />
        {/* END: Jackpot Tiers */}

        {/* BEGIN: Reel Area Container */}
        <main className="relative z-10 flex-1 w-full px-2 py-1 flex flex-row items-center justify-between overflow-hidden">
          {/* Left Vertical Sidebar */}
          <Sidebar
            onOpenBackpack={() => setIsBackpackOpen(true)}
            onOpenMission={() => setIsMissionsOpen(true)}
            onOpenWinMore={() => setIsWinMoreOpen(true)}
            onOpenTournament={() => setIsTournamentOpen(true)}
            onOpenHighlights={() => setIsHighlightsOpen(true)}
            hasClaimableMission={hasClaimableMission}
          />

          {/* Main Slot Reel Board (5 columns x 4 rows) */}
          <SlotReels
            grid={grid}
            winningCells={winningCells}
            spinningCols={spinningCols}
            isTurbo={isTurbo}
          />
        </main>
        {/* END: Reel Area Container */}

        {/* BEGIN: Bottom Win & Control Dashboard */}
        <BottomControls
          currentWin={currentWin}
          balance={balance}
          bet={bet}
          isSpinning={isSpinning}
          isTurbo={isTurbo}
          isAuto={isAuto}
          autoCount={autoCount}
          playerLevel={playerLevel}
          onSpin={handleSpin}
          onToggleTurbo={() => setIsTurbo(prev => !prev)}
          onToggleAuto={toggleAuto}
          onOpenBetSelector={() => setIsBetSelectorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onTopUpBalance={() => addBalance(100.0)}
        />
        {/* END: Bottom Win & Control Dashboard */}

        {/* MODALS & OVERLAYS */}
        <BuyBonusModal
          isOpen={isBuyBonusOpen}
          onClose={() => setIsBuyBonusOpen(false)}
          onConfirmBuy={handleConfirmBuyBonus}
          bet={bet}
          balance={balance}
        />

        <JackpotModal
          isOpen={isJackpotOpen}
          onClose={() => setIsJackpotOpen(false)}
          bet={bet}
        />

        <BetSelectorModal
          isOpen={isBetSelectorOpen}
          onClose={() => setIsBetSelectorOpen(false)}
          currentBet={bet}
          onSelectBet={newBet => setBet(newBet)}
        />

        <BackpackModal
          isOpen={isBackpackOpen}
          onClose={() => setIsBackpackOpen(false)}
          onUseItem={(type, amount) => {
            if (type === 'FREE_SPINS') {
              setFreeSpinsIntroOpen(true);
              setFreeSpinsLeft(prev => prev + amount);
            } else if (type === 'COINS') {
              addBalance(amount);
            }
          }}
        />

        <MissionsModal
          isOpen={isMissionsOpen}
          onClose={() => setIsMissionsOpen(false)}
          missions={missions}
          onClaimReward={claimMissionReward}
        />

        <WinMoreModal
          isOpen={isWinMoreOpen}
          onClose={() => setIsWinMoreOpen(false)}
          onAddBalance={addBalance}
        />

        <TournamentModal
          isOpen={isTournamentOpen}
          onClose={() => setIsTournamentOpen(false)}
          playerLevel={playerLevel}
        />

        <HighlightsModal
          isOpen={isHighlightsOpen}
          onClose={() => setIsHighlightsOpen(false)}
          onReplayWin={amount => {
            setBigWinOverlayData({ isOpen: true, amount });
          }}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isTurbo={isTurbo}
          onToggleTurbo={() => setIsTurbo(prev => !prev)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          history={history}
          onTopUpDemoBalance={() => addBalance(500.0)}
        />

        <BigWinOverlay
          isOpen={bigWinOverlayData.isOpen}
          winAmount={bigWinOverlayData.amount}
          bet={bet}
          onClose={() => setBigWinOverlayData({ isOpen: false, amount: 0 })}
        />

        <FreeSpinsIntroOverlay
          isOpen={freeSpinsIntroOpen}
          onStart={() => {
            setFreeSpinsIntroOpen(false);
            if (!isSpinning) {
              handleSpin();
            }
          }}
          count={10}
        />
      </div>
      {/* END: Mobile Frame */}
    </div>
  );
}
