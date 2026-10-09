import React, { useState } from 'react';
import { sound } from '../../utils/audio';
import { SpinHistoryItem } from '../../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTurbo: boolean;
  onToggleTurbo: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  history: SpinHistoryItem[];
  onTopUpDemoBalance: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isTurbo,
  onToggleTurbo,
  soundEnabled,
  onToggleSound,
  history,
  onTopUpDemoBalance,
}) => {
  const [activeTab, setActiveTab] = useState<'RULES' | 'SETTINGS' | 'HISTORY'>('RULES');

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-[380px] bg-gradient-to-b from-[#181a24] via-[#0f1118] to-[#07080c] border-2 border-stone-600 rounded-2xl p-4 shadow-2xl flex flex-col relative animate-win-pop max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl mb-3 border border-zinc-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('RULES');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RULES'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Paytable & Rules
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('SETTINGS');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('HISTORY');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Tab 1: Rules & Paytable */}
        {activeTab === 'RULES' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {/* Elimination & Multiplier explanation */}
            <div className="bg-black/50 border border-amber-900/40 rounded-xl p-3">
              <h4 className="text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-bolt text-yellow-400"></i>
                Elimination Multiplier
              </h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Winning symbols eliminate and tumble. Each consecutive win cascade increases the multiplier:{' '}
                <span className="text-yellow-400 font-bold">x1 ➔ x2 ➔ x3 ➔ x5</span>. In Free Game, multipliers double to{' '}
                <span className="text-fuchsia-400 font-bold">x2 ➔ x4 ➔ x6 ➔ x10</span>!
              </p>
            </div>

            {/* Golden Card Feature */}
            <div className="bg-black/50 border border-yellow-500/40 rounded-xl p-3">
              <h4 className="text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-crown text-yellow-400"></i>
                Golden Card Transformation
              </h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Cards appearing on <span className="text-yellow-300 font-bold">Reels 2, 3, and 4</span> can have a Golden border. When matched in an elimination, the Golden Card turns into a{' '}
                <span className="text-amber-400 font-black">WILD CARD</span> for the next cascade!
              </p>
            </div>

            {/* Free Game Feature */}
            <div className="bg-black/50 border border-purple-900/40 rounded-xl p-3">
              <h4 className="text-fuchsia-300 font-bold mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-gem text-fuchsia-400"></i>
                Free Game (10 Free Spins)
              </h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Landing <span className="text-fuchsia-300 font-bold">3 or more Scatters</span> awards 10 Free Spins with doubled multipliers and higher Golden Card frequency.
              </p>
            </div>

            {/* Paytable Chart */}
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-3">
              <h4 className="text-zinc-200 font-bold mb-2">Symbol Payouts (x Bet)</h4>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-ui">
                <div className="p-1 rounded bg-zinc-900 text-zinc-300 font-bold">Symbol</div>
                <div className="p-1 rounded bg-zinc-900 text-zinc-300">3x</div>
                <div className="p-1 rounded bg-zinc-900 text-zinc-300">4x</div>
                <div className="p-1 rounded bg-zinc-900 text-zinc-300">5x</div>

                <div className="font-bold text-amber-300">ACE</div>
                <div>0.5x</div>
                <div>1.5x</div>
                <div className="text-amber-400 font-bold">3.5x</div>

                <div className="font-bold text-amber-300">KING</div>
                <div>0.4x</div>
                <div>1.0x</div>
                <div className="text-amber-400 font-bold">2.5x</div>

                <div className="font-bold text-red-400">QUEEN</div>
                <div>0.3x</div>
                <div>0.8x</div>
                <div>2.0x</div>

                <div className="font-bold text-blue-400">JACK</div>
                <div>0.2x</div>
                <div>0.5x</div>
                <div>1.5x</div>

                <div className="font-bold text-zinc-300">SPADE</div>
                <div>0.1x</div>
                <div>0.3x</div>
                <div>0.8x</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Settings */}
        {activeTab === 'SETTINGS' && (
          <div className="flex-1 space-y-3 pr-1 text-xs">
            {/* Audio Toggle */}
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Game Sound Effects</div>
                <div className="text-[10px] text-zinc-400">Slot reel spins and win fanfares</div>
              </div>
              <button
                onClick={onToggleSound}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* Turbo Toggle */}
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Turbo Spin Speed</div>
                <div className="text-[10px] text-zinc-400">Accelerated reel tumbling</div>
              </div>
              <button
                onClick={onToggleTurbo}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  isTurbo ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isTurbo ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* Demo Balance Recharge */}
            <div className="bg-black/50 border border-amber-900/50 rounded-xl p-3">
              <div className="font-bold text-amber-300 mb-1">Free Demo Top-Up</div>
              <p className="text-[10px] text-zinc-400 mb-2">
                Replenish ₱500.000 instantly to test bet tiers and bonus features.
              </p>
              <button
                onClick={() => {
                  sound.playGoldenTransform();
                  onTopUpDemoBalance();
                }}
                className="w-full py-2 rounded-lg bg-gradient-to-b from-emerald-500 to-green-700 text-white font-bold text-xs shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-coins"></i>
                Add +₱500.000 Balance
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'HISTORY' && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {history.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No spins recorded yet. Spin the reels to view history!
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  className="bg-black/50 border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <div className="text-zinc-300 font-medium">
                      Bet: <span className="font-bold">₱{item.bet}</span> · {item.multiplier}x
                    </div>
                    <span className="text-[9px] text-zinc-500">{item.timestamp}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold font-numbers text-sm ${
                        item.payout > 0 ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    >
                      {item.payout > 0 ? `+₱${item.payout.toFixed(3)}` : '₱0.000'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
