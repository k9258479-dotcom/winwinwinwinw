import React, { useState } from 'react';
import { sound } from '../../utils/audio';

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseItem: (type: 'FREE_SPINS' | 'COINS', amount: number) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  quantity: number;
  type: 'FREE_SPINS' | 'COINS';
  amount: number;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  isOpen,
  onClose,
  onUseItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: 'fs-5',
      name: 'Super Free Spin Voucher',
      desc: 'Grants 5 immediate Free Spins with doubled multipliers!',
      icon: 'fa-gem',
      color: 'from-fuchsia-600 to-purple-900',
      quantity: 2,
      type: 'FREE_SPINS',
      amount: 5,
    },
    {
      id: 'coin-bag',
      name: 'Lucky Coin Pouch',
      desc: 'Instantly grants ₱50.000 free casino credits.',
      icon: 'fa-sack-dollar',
      color: 'from-amber-500 to-yellow-800',
      quantity: 1,
      type: 'COINS',
      amount: 50,
    },
    {
      id: 'vip-chest',
      name: 'JILI VIP Gift Chest',
      desc: 'Exclusive high roller gift with ₱100.000 bonus balance.',
      icon: 'fa-gift',
      color: 'from-emerald-500 to-teal-900',
      quantity: 1,
      type: 'COINS',
      amount: 100,
    },
  ]);

  if (!isOpen) return null;

  const handleUse = (item: InventoryItem) => {
    sound.playGoldenTransform();
    onUseItem(item.type, item.amount);
    setItems(prev =>
      prev
        .map(i => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter(i => i.quantity > 0)
    );
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-gradient-to-b from-[#1b1712] via-[#100d0a] to-[#070504] border-2 border-amber-600/70 rounded-2xl p-4 shadow-2xl flex flex-col relative animate-win-pop max-h-[85vh]">
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

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-amber-400 to-amber-700 flex items-center justify-center text-white text-sm shadow">
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <h3 className="font-game-title text-xl text-amber-300 tracking-wider">BACKPACK</h3>
            <p className="text-[10px] text-zinc-400">Inventory & Special Bonus Items</p>
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Your backpack is currently empty. Complete missions or spin to earn items!
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="bg-black/50 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-b ${item.color} flex items-center justify-center text-white text-lg shrink-0 shadow-md border border-white/20`}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-200 truncate">{item.name}</h4>
                    <span className="text-[10px] font-bold text-zinc-400 ml-1">x{item.quantity}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleUse(item)}
                  className="py-1.5 px-3 rounded-lg bg-gradient-to-b from-yellow-400 to-amber-600 text-black font-bold text-xs shadow hover:brightness-110 active:scale-95 whitespace-nowrap"
                >
                  Use
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
