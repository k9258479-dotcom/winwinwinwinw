/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BankerMarquee } from './components/BankerMarquee';
import { BriefcaseGrid } from './components/BriefcaseGrid';
import { ActionFooter } from './components/ActionFooter';
import { RulesModal } from './components/RulesModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { RemainingPrizesDrawer } from './components/RemainingPrizesDrawer';
import { GameOverModal } from './components/GameOverModal';
import { Briefcase, GamePhase, ProvablyFairData } from './types/game';
import { soundManager } from './utils/audio';
import { generateSeed, sha256, shuffleWithSeeds } from './utils/provablyFair';
import { api } from '../services/api';
import { BOX_MODES } from './components/Header';

// 35 Multipliers for 35 Briefcases:
// 20 maleta na 0.3x
// 10 maleta na 0.2x
// 3 maleta na 10x
// 1 maleta na 100x
// 1 maleta na 1,000x
const BASE_MULTIPLIERS = [
  // 20 maleta na 0.3x
  0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
  0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
  // 10 maleta na 0.2x
  0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
  // 3 maleta na 10x
  10, 10, 10,
  // 1 maleta na 100x
  100,
  // 1 maleta na 1,000x
  1000,
];

const STAGE_BG_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQADZEcE9NJDkouEpQ3W7LSfgSlCAsn6UWobT9OHWx3yq29TwkM1spfUtlBzkJcT8gZeHj-Lwt74rWUYASbKcvgnUXdUUPYjfPTA9NtfV_uR-jY6gWq4f4JXpXcemVZLuM8B3vzdAg1ZfxR7fD6DyAMwsTpqmnBRauNYkS1-XX-FTUZpevLDp6YG8EN16zB6KQA7xpSlTHrlJ9GbK0UHYyQ1QQS_oC8vI2n_nnpdyngaKkejaqSmHotA';

export interface DealOrNoDealGameProps {
  userBalance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
  onOpenCashier?: () => void;
  onClose?: () => void;
}

export function DealOrNoDealGame({
  userBalance = 25000,
  onBalanceUpdate,
  onOpenCashier,
  onClose,
}: DealOrNoDealGameProps) {
  // Balance & Bet (matches Bet88 player balance and selected mode)
  const [balance, setBalance] = useState<number>(userBalance);
  const [maxBoxesPerGame, setMaxBoxesPerGame] = useState<number>(6);
  const [bet, setBet] = useState<number>(500);

  // Keep local balance in sync if parent userBalance changes (e.g. approved deposit)
  useEffect(() => {
    if (userBalance !== undefined) {
      setBalance(userBalance);
    }
  }, [userBalance]);

  // Handle Box Mode Selection (2 boxes = ₱100, 3 boxes = ₱200, 6 boxes = ₱500)
  const handleSelectMaxBoxes = useCallback((boxes: number) => {
    setMaxBoxesPerGame(boxes);
    const matchedMode = BOX_MODES.find((m) => m.boxes === boxes);
    if (matchedMode) {
      setBet(matchedMode.bet);
    }
  }, []);

  // Active game metadata (Starts straight into playing immediately!)
  const [gameId, setGameId] = useState<string>('#BV-98214');
  const [phase, setPhase] = useState<GamePhase>('PLAYING');

  // Batch selection state: boxes selected by player to open
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<number>>(new Set());
  const [isOpeningBatch, setIsOpeningBatch] = useState<boolean>(false);
  const [recentlyRevealedIds, setRecentlyRevealedIds] = useState<Set<number>>(new Set());
  const [winToast, setWinToast] = useState<{ amount: number; boxesCount: number; cost: number } | null>(null);

  // Total bets invested
  const [totalBetInvested, setTotalBetInvested] = useState<number>(0);

  // Clean initial state: all 35 briefcases fresh and unopened
  const [briefcases, setBriefcases] = useState<Briefcase[]>(() => {
    const shuffledMultipliers = shuffleWithSeeds(
      BASE_MULTIPLIERS,
      `vault_initial:${Date.now()}`
    );
    return Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      multiplier: shuffledMultipliers[i],
      isOpen: false,
    }));
  });

  // Total winnings calculated directly from all opened boxes: sum of (bet * multiplier)
  const totalWon = useMemo(() => {
    return briefcases
      .filter((b) => b.isOpen)
      .reduce((sum, b) => sum + Math.round(bet * b.multiplier), 0);
  }, [briefcases, bet]);

  // Provably Fair data
  const [provablyFair, setProvablyFair] = useState<ProvablyFairData>({
    serverSeed: generateSeed(32),
    serverSeedHash: '7f9a1b4d83e20c6a51d9f8e7b6c5a43210fe9dc8ba76543210abcdef01234567',
    clientSeed: 'golden_vault_vip_777',
    nonce: 98214,
  });

  // Modals state
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showProvablyFairModal, setShowProvablyFairModal] = useState<boolean>(false);
  const [showPrizesDrawer, setShowPrizesDrawer] = useState<boolean>(false);
  const [gameOverModal, setGameOverModal] = useState<{
    isOpen: boolean;
    winType: 'DEAL' | 'ALL_OPENED';
    payout: number;
  }>({
    isOpen: false,
    winType: 'DEAL',
    payout: 0,
  });

  // Calculate remaining count and top remaining prize
  const remainingCases = useMemo(() => {
    return briefcases.filter((b) => !b.isOpen);
  }, [briefcases]);

  const remainingCount = remainingCases.length;

  const topRemainingPrize = useMemo(() => {
    const highestMul = remainingCases.reduce((max, b) => Math.max(max, b.multiplier), 0);
    return Math.round(bet * (highestMul || 1000));
  }, [remainingCases, bet]);

  const eliminatedMultipliers = useMemo(() => {
    const set = new Set<number>();
    briefcases.forEach((b) => {
      if (b.isOpen) set.add(b.multiplier);
    });
    return set;
  }, [briefcases]);

  // Initialize a fresh new game (Directly into playing mode!)
  const startNewGame = useCallback(async () => {
    const sSeed = generateSeed(32);
    const hash = await sha256(sSeed);
    const newNonce = provablyFair.nonce + 1;
    const newGameId = `#BV-${Math.floor(10000 + Math.random() * 90000)}`;

    const shuffledMultipliers = shuffleWithSeeds(
      BASE_MULTIPLIERS,
      `${sSeed}:${provablyFair.clientSeed}:${newNonce}`
    );

    const freshBriefcases: Briefcase[] = Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      multiplier: shuffledMultipliers[i],
      isOpen: false,
    }));

    setProvablyFair((prev) => ({
      ...prev,
      serverSeed: sSeed,
      serverSeedHash: hash,
      nonce: newNonce,
    }));

    setGameId(newGameId);
    setBriefcases(freshBriefcases);
    setSelectedBoxIds(new Set());
    setRecentlyRevealedIds(new Set());
    setIsOpeningBatch(false);
    setTotalBetInvested(0);
    setPhase('PLAYING');
    setGameOverModal({ isOpen: false, winType: 'DEAL', payout: 0 });
  }, [provablyFair.clientSeed, provablyFair.nonce]);

  const totalOpenedCount = useMemo(() => {
    return briefcases.filter((b) => b.isOpen).length;
  }, [briefcases]);

  const remainingQuota = Math.max(0, maxBoxesPerGame - totalOpenedCount);

  // Execute opening of selected boxes
  const executeBatchOpen = useCallback(
    (boxesToOpen: number[]) => {
      if (boxesToOpen.length === 0 || isOpeningBatch) return;

      const totalBatchCost = boxesToOpen.length * bet;
      if (balance < totalBatchCost) {
        if (onOpenCashier) {
          onOpenCashier();
        } else {
          alert(
            `Kulang ang iyong balance (Kailangan: ₱${totalBatchCost.toLocaleString()} para sa ${boxesToOpen.length} maleta). Pindutin ang Total Balance sa itaas upang mag-reload ng chips.`
          );
        }
        return;
      }

      // Deduct bet for each box opened
      const balanceAfterBet = Math.round((balance - totalBatchCost) * 100) / 100;
      setBalance(balanceAfterBet);
      onBalanceUpdate?.(balanceAfterBet);
      setTotalBetInvested((prev) => prev + totalBatchCost);

      setIsOpeningBatch(true);
      soundManager.playSuspense();

      // Suspense delay: boxes shake and burst open simultaneously!
      setTimeout(() => {
        const openingSet = new Set(boxesToOpen);

        // Calculate actual prize won: bet * multiplier (e.g. 1000 * 0.8 = 800)
        const batchPrizesWon = boxesToOpen.reduce((sum, id) => {
          const b = briefcases.find((box) => box.id === id);
          return sum + (b ? Math.round(bet * b.multiplier) : 0);
        }, 0);

        // Award the won prize directly to player's balance!
        const finalBalance = Math.round((balanceAfterBet + batchPrizesWon) * 100) / 100;
        setBalance(finalBalance);
        onBalanceUpdate?.(finalBalance);

        // Record turnover, win, and loss to Firestore & Express backend!
        api.recordPlayerGameSpin({
          bet: totalBatchCost,
          win: batchPrizesWon,
          gameId: 'deal_or_no_deal',
        });

        // Check if any high value was revealed (>= 10x)
        const anyHigh = briefcases.some(
          (b) => openingSet.has(b.id) && b.multiplier >= 10
        );

        if (batchPrizesWon >= totalBatchCost) {
          soundManager.playDeal();
        } else {
          soundManager.playSimultaneousReveal(anyHigh);
        }

        // Show win notification toast
        setWinToast({
          amount: batchPrizesWon,
          boxesCount: boxesToOpen.length,
          cost: totalBatchCost,
        });
        setTimeout(() => setWinToast(null), 3500);

        const updatedBriefcases = briefcases.map((b) =>
          openingSet.has(b.id)
            ? { ...b, isOpen: true, revealedOrder: Date.now() }
            : b
        );

        setBriefcases(updatedBriefcases);
        setRecentlyRevealedIds(new Set(boxesToOpen));
        setSelectedBoxIds(new Set());
        setIsOpeningBatch(false);

        const newOpenedCount = updatedBriefcases.filter((b) => b.isOpen).length;

        // If max boxes reached for active mode, finish round and celebrate!
        if (newOpenedCount >= maxBoxesPerGame) {
          const finalTotalWon = updatedBriefcases
            .filter((b) => b.isOpen)
            .reduce((sum, b) => sum + Math.round(bet * b.multiplier), 0);

          setPhase('GAME_OVER');
          setGameOverModal({
            isOpen: true,
            winType: 'ALL_OPENED',
            payout: finalTotalWon,
          });
        }
      }, 750);
    },
    [
      isOpeningBatch,
      balance,
      bet,
      briefcases,
      maxBoxesPerGame,
      onBalanceUpdate,
      onOpenCashier,
    ]
  );

  // Handle box click / selection (Max 6 boxes per game!)
  const handleSelectCase = useCallback(
    (caseId: number) => {
      if (isOpeningBatch || remainingQuota <= 0) return;

      const target = briefcases.find((b) => b.id === caseId);
      if (!target || target.isOpen) return;

      // Restrict selecting more than remaining quota for 6 boxes
      if (!selectedBoxIds.has(caseId) && selectedBoxIds.size >= remainingQuota) {
        soundManager.playClick();
        return;
      }

      soundManager.playClick();
      setSelectedBoxIds((prev) => {
        const next = new Set(prev);
        if (next.has(caseId)) {
          next.delete(caseId);
        } else {
          next.add(caseId);
        }
        return next;
      });
    },
    [isOpeningBatch, briefcases, selectedBoxIds, remainingQuota]
  );

  // OPEN BOX handler: opens selected boxes (up to remaining quota) or 1 box directly
  const handleOpenBox = useCallback(() => {
    if (phase !== 'PLAYING' || isOpeningBatch || remainingQuota <= 0) return;

    if (selectedBoxIds.size > 0) {
      // Open all currently selected boxes up to remaining quota
      executeBatchOpen(Array.from(selectedBoxIds).slice(0, remainingQuota));
    } else {
      // Pick 1 random unopened box and open it immediately
      const available = briefcases.filter((b) => !b.isOpen);
      if (available.length === 0) return;

      soundManager.playClick();
      const randomBox = available[Math.floor(Math.random() * available.length)];
      setSelectedBoxIds(new Set([randomBox.id]));
      executeBatchOpen([randomBox.id]);
    }
  }, [
    phase,
    isOpeningBatch,
    remainingQuota,
    selectedBoxIds,
    briefcases,
    executeBatchOpen,
  ]);

  // Player claims total winnings & finishes round
  const handleClaim = useCallback(() => {
    soundManager.playDeal();
    setPhase('GAME_OVER');
    setGameOverModal({
      isOpen: true,
      winType: 'DEAL',
      payout: totalWon,
    });
  }, [totalWon]);

  return (
    <div className="bg-[#050102] text-white min-h-screen w-full flex justify-center items-start overflow-y-auto overflow-x-hidden select-none font-sans antialiased">
      {/* Mobile iOS Frame Wrapper (390px - 430px optimal) with smooth vertical scrolling */}
      <main className="relative w-full max-w-[440px] min-h-screen bg-[#0c0406] flex flex-col justify-between overflow-y-auto shadow-2xl border-x border-[#3b1d11] pb-20">
        {/* AAA Professional Stage Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            alt="Casino Stage Background"
            className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.12] scale-105"
            src={STAGE_BG_URL}
            referrerPolicy="no-referrer"
          />
          {/* Dark Vignette Gradient Overlays for High Legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080204]/90 via-[#0d0205]/65 to-[#050102]/95"></div>
          {/* Golden Volumetric Stage Center Beam Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] h-[400px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Top Casino Header */}
        <Header
          balance={balance}
          onOpenRules={() => setShowRulesModal(true)}
          onAddFunds={(amt) => {
            const newBal = balance + amt;
            setBalance(newBal);
            onBalanceUpdate?.(newBal);
          }}
          isGameActive={totalOpenedCount > 0 && phase === 'PLAYING'}
          maxBoxesPerGame={maxBoxesPerGame}
          onSelectMaxBoxes={handleSelectMaxBoxes}
          onClose={onClose}
          onOpenCashier={onOpenCashier}
        />

        {/* Total Winnings 3D Marquee Sign (Replaced Banker Live Offer) */}
        <BankerMarquee
          phase={phase}
          totalWon={totalWon}
          bet={bet}
          selectedCount={selectedBoxIds.size}
          isOpeningBatch={isOpeningBatch}
          totalOpenedCount={totalOpenedCount}
          maxBoxesPerGame={maxBoxesPerGame}
        />

        {/* Live Box Prize Won Toast */}
        {winToast && (
          <div className="mx-3 mt-1 px-3 py-1.5 bg-gradient-to-r from-emerald-950 via-zinc-950 to-emerald-950 border border-emerald-400/80 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-between animate-in zoom-in-95 duration-200 z-30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-xs shadow">
                ₱
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] uppercase font-black text-emerald-300 tracking-wide">
                  Panalo sa {winToast.boxesCount} Box
                </span>
                <span className="text-xs font-black text-white font-mono">
                  +₱{winToast.amount.toLocaleString()} ({bet > 0 ? (winToast.amount / (winToast.boxesCount * bet)).toFixed(1) : 1}x)
                </span>
              </div>
            </div>
            <span
              className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                winToast.amount >= winToast.cost
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              }`}
            >
              {winToast.amount >= winToast.cost
                ? `+₱${(winToast.amount - winToast.cost).toLocaleString()} Net`
                : `-₱${(winToast.cost - winToast.amount).toLocaleString()}`}
            </span>
          </div>
        )}

        {/* Main Game Arena: 5x7 Briefcase Grid */}
        <BriefcaseGrid
          briefcases={briefcases}
          phase={phase}
          bet={bet}
          topRemainingPrize={topRemainingPrize}
          remainingCount={remainingCount}
          onSelectCase={handleSelectCase}
          selectedBoxIds={selectedBoxIds}
          isOpeningBatch={isOpeningBatch}
          recentlyRevealedIds={recentlyRevealedIds}
          totalOpenedCount={totalOpenedCount}
          maxBoxesPerGame={maxBoxesPerGame}
        />

        {/* Action Footer: CLAIM and OPEN BOX Buttons */}
        <ActionFooter
          phase={phase}
          totalWon={totalWon}
          topRemainingPrize={topRemainingPrize}
          bet={bet}
          gameId={gameId}
          onClaim={handleClaim}
          onOpenBox={handleOpenBox}
          onRestart={startNewGame}
          onOpenProvablyFair={() => setShowProvablyFairModal(true)}
          onTogglePrizesDrawer={() => setShowPrizesDrawer(true)}
          isOpeningBatch={isOpeningBatch}
          selectedCount={selectedBoxIds.size}
        />

        {/* Modals & Drawers */}
        <RulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          currentBet={bet}
        />

        <ProvablyFairModal
          isOpen={showProvablyFairModal}
          onClose={() => setShowProvablyFairModal(false)}
          provablyFair={provablyFair}
          onUpdateClientSeed={(newSeed) =>
            setProvablyFair((prev) => ({ ...prev, clientSeed: newSeed }))
          }
          isGameActive={false}
        />

        <RemainingPrizesDrawer
          isOpen={showPrizesDrawer}
          onClose={() => setShowPrizesDrawer(false)}
          bet={bet}
          eliminatedMultipliers={eliminatedMultipliers}
        />

        <GameOverModal
          isOpen={gameOverModal.isOpen}
          onRestart={startNewGame}
          winType={gameOverModal.winType}
          payout={totalWon}
          bet={totalBetInvested}
          maxBoxesPerGame={maxBoxesPerGame}
        />
      </main>
    </div>
  );
}

export default DealOrNoDealGame;
