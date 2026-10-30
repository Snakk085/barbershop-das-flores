import React from 'react';
import { Scissors, ShieldCheck, Smartphone, UserCheck, Terminal, Sparkles, Clock, PackageCheck } from 'lucide-react';
import { UserRole } from '../types/barbershop';

interface HeaderProps {
  currentRole: UserRole | 'BLUEPRINT';
  onSelectRole: (role: UserRole | 'BLUEPRINT') => void;
  pendingPixCount: number;
  todayCount: number;
  onOpenHandover?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  pendingPixCount,
  todayCount,
  onOpenHandover,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40 shrink-0">
              <Scissors className="w-5 h-5 text-zinc-950 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  BarberShop <span className="text-amber-400">Das Flores</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  CE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Manoel Sátiro, Fortaleza • André & Neto • Pix No-Show
              </p>
            </div>
          </div>

          {/* Quick indicators (visible on mobile too) */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {todayCount} hoje
            </span>
          </div>
        </div>

        {/* Role & Blueprint Switcher Tabs */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-1 sm:pb-0 gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => onSelectRole('CLIENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              currentRole === 'CLIENT'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Cliente (PWA)</span>
            {pendingPixCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentRole === 'CLIENT' ? 'bg-zinc-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {pendingPixCount} Pix
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectRole('BARBER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              currentRole === 'BARBER'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>✂️ Barbeiro</span>
          </button>

          <button
            onClick={() => onSelectRole('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              currentRole === 'ADMIN'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>👑 Dono (Admin)</span>
          </button>

          <button
            onClick={() => onSelectRole('BLUEPRINT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              currentRole === 'BLUEPRINT'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-amber-500/30'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-bold">🏛️ Blueprint Tech Lead</span>
          </button>

          {onOpenHandover && (
            <button
              onClick={onOpenHandover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all border border-emerald-400/40"
              title="Abrir Kit de Entrega e Manual do Dono"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>📦 Entregar ao Cliente</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
