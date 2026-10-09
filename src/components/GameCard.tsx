import React from 'react';
import { Play, Sparkles, Flame } from 'lucide-react';
import { GameItem } from '../types';
import { sounds } from '../utils/audio';

interface GameCardProps {
  game: GameItem;
  onPlay: (game: GameItem) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  return (
    <div
      onClick={() => {
        sounds.playClick();
        onPlay(game);
      }}
      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer flex flex-col"
    >
      {/* Artwork Slot with Fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={game.image}
          alt={game.title}
          onError={(e) => {
            // High reliability fallback SVG placeholder
            const target = e.currentTarget;
            target.onerror = null;
            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><circle cx="200" cy="150" r="70" fill="%23f59e0b" fill-opacity="0.15"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-size="48">🎰</text><text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle" fill="%23f59e0b" font-family="sans-serif" font-weight="bold" font-size="14">BET88 LIVE</text></svg>';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {game.isHot && (
            <span className="flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
              <Flame className="w-3 h-3 text-amber-300" />
              HOT
            </span>
          )}
          {game.isJackpot && (
            <span className="flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
              <Sparkles className="w-3 h-3" />
              JACKPOT
            </span>
          )}
        </div>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
            {game.title}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span>{game.provider}</span>
            <span>·</span>
            <span className="text-emerald-400">{game.rtp} RTP</span>
          </div>
        </div>

        {game.jackpotAmount && (
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Jackpot</span>
            <span className="font-mono font-bold text-amber-400">
              ₱{game.jackpotAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
