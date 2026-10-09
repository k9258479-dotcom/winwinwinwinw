import React from 'react';
import { sounds } from '../utils/audio';

interface ProviderBarProps {
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
}

const PROVIDERS = [
  { id: 'ALL', name: 'All Providers', badge: 'Featured' },
  { id: 'JILI', name: 'JILI Gaming', badge: 'Super Ace' },
  { id: 'BET88 ORIGINALS', name: 'Bet88 Originals', badge: 'Deal or No Deal' },
];

export const ProviderBar: React.FC<ProviderBarProps> = ({
  selectedProvider,
  onSelectProvider,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
      {PROVIDERS.map(p => {
        const isActive = selectedProvider === p.id;
        return (
          <button
            key={p.id}
            onClick={() => {
              sounds.playClick();
              onSelectProvider(p.id);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
              isActive
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>{p.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-normal">
              {p.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
