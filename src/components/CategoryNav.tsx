import React from 'react';
import { LayoutGrid, Flame, Disc, Rocket, Gem, Compass, Fish, Sparkles } from 'lucide-react';
import { GameCategory } from '../types';
import { sounds } from '../utils/audio';

interface CategoryNavProps {
  activeCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CATEGORIES: Array<{ id: GameCategory; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'Lahat ng Laro', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'slots', label: 'Slots', icon: <Disc className="w-4 h-4" /> },
  { id: 'arcade', label: 'Deal or No Deal & Arcade', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'live', label: 'Live Casino', icon: <Flame className="w-4 h-4" /> },
  { id: 'table', label: 'Table & Cards', icon: <Compass className="w-4 h-4" /> },
  { id: 'crash', label: 'Crash / Aviator', icon: <Rocket className="w-4 h-4" /> },
  { id: 'fishing', label: 'Fishing', icon: <Fish className="w-4 h-4" /> },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      {/* Category Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Search */}
      <div className="relative min-w-[220px]">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search 500+ games..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>
    </div>
  );
};
