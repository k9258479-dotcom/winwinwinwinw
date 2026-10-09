import React, { useState } from 'react';
import { sound } from '../../utils/audio';

interface WinMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBalance: (amount: number) => void;
}

export const WinMoreModal: React.FC<WinMoreModalProps> = ({
  isOpen,
  onClose,
  onAddBalance,
}) => {
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelWon, setWheelWon] = useState<number | null>(null);
  const [claimedDay, setClaimedDay] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSpinWheel = () => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    setWheelWon(null);

    sound.playSpin();

    // Wheel outcomes
    const prizes = [10, 25, 5, 100, 50, 200];
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[prizeIndex];

    const segmentAngle = 360 / prizes.length;
    const extraSpins = 360 * 5;
    const targetAngle = wheelRotation + extraSpins + (360 - prizeIndex * segmentAngle - segmentAngle / 2);

    setWheelRotation(targetAngle);

    setTimeout(() => {
      setIsSpinningWheel(false);
      setWheelWon(prize);
      sound.playWin(3);
      onAddBalance(prize);
    }, 3000);
  };

  const handleCheckIn = (day: number, reward: number) => {
    if (claimedDay !== null) return;
    sound.playGoldenTransform();
    setClaimedDay(day);
    onAddBalance(reward);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#251010] via-[#140808] to-[#080303] border-2 border-red-500/70 rounded-2xl p-4 shadow-[0_0_35px_rgba(239,68,68,0.4)] flex flex-col relative animate-win-pop max-h-[88vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-red-300 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-red-500 to-amber-600 flex items-center justify-center text-white text-sm shadow">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <div>
            <h3 className="font-game-title text-xl text-amber-300 tracking-wider">WIN MORE</h3>
            <p className="text-[10px] text-zinc-400">Lucky wheel & daily check-in rewards</p>
          </div>
        </div>

        {/* Lucky Fortune Wheel Card */}
        <div className="bg-black/50 border border-red-900/60 rounded-xl p-3 flex flex-col items-center mb-3">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-dharmachakra text-yellow-400 animate-spin"></i>
            Lucky Fortune Wheel
          </h4>

          {/* Wheel Graphic */}
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            <div
              className="w-full h-full rounded-full border-4 border-amber-400 shadow-[0_0_15px_#f59e0b] bg-[conic-gradient(#dc2626_0deg_60deg,#eab308_60deg_120deg,#16a34a_120deg_180deg,#2563eb_180deg_240deg,#9333ea_240deg_300deg,#f97316_300deg_360deg)] transition-all duration-[3000ms] ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            ></div>
            {/* Center Pointer & Hub */}
            <div className="absolute top-0 -mt-1 w-3 h-4 bg-white border-2 border-red-600 [clip-path:polygon(50%_100%,0%_0%,100%_0%)] z-10"></div>
            <div className="absolute w-10 h-10 rounded-full bg-gradient-to-b from-stone-900 to-black border-2 border-yellow-300 flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-star text-yellow-400 text-xs"></i>
            </div>
          </div>

          {wheelWon !== null && (
            <div className="text-xs font-bold text-emerald-400 animate-bounce mt-1">
              🎉 Congratulations! You won ₱{wheelWon}.000!
            </div>
          )}

          <button
            disabled={isSpinningWheel}
            onClick={handleSpinWheel}
            className={`mt-2 py-1.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg ${
              isSpinningWheel
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-b from-yellow-400 to-amber-600 text-black hover:brightness-110 active:scale-95'
            }`}
          >
            {isSpinningWheel ? 'Spinning...' : 'Spin The Wheel'}
          </button>
        </div>

        {/* Daily Check-in Streak */}
        <div className="bg-black/50 border border-zinc-800 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-zinc-200 uppercase">7-Day Login Streak</h4>
            <span className="text-[10px] text-amber-400 font-bold">
              {claimedDay ? 'Day 1 Claimed' : 'Claim Today'}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[
              { day: 1, amount: 2 },
              { day: 2, amount: 5 },
              { day: 3, amount: 10 },
              { day: 4, amount: 15 },
              { day: 5, amount: 25 },
              { day: 6, amount: 40 },
              { day: 7, amount: 100 },
            ].map(item => {
              const isClaimed = claimedDay !== null && item.day === 1;
              return (
                <div
                  key={item.day}
                  onClick={() => item.day === 1 && handleCheckIn(item.day, item.amount)}
                  className={`p-1 rounded-lg border flex flex-col items-center justify-between text-center transition-all ${
                    isClaimed
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : item.day === 1
                      ? 'bg-amber-950/60 border-amber-400 text-amber-300 cursor-pointer hover:scale-105'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-[8px] font-bold">D{item.day}</span>
                  <i
                    className={`fa-solid ${
                      item.day === 7 ? 'fa-gem text-amber-300' : 'fa-coins'
                    } text-[10px] my-0.5`}
                  ></i>
                  <span className="text-[8px] font-bold font-numbers">₱{item.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
