import React from 'react';
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  Blocks,
  Award,
  Lock,
  Layers,
  Cpu,
} from 'lucide-react';

export type ActiveTab = 'verifier' | 'issuer' | 'tamper' | 'explorer' | 'wallet';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  chainHeight: number;
  totalCredentials: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  chainHeight,
  totalCredentials,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-md text-white border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Desktop Single-Row (md:flex) vs Mobile Two-Row (flex-col md:flex-row) Layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 md:py-0 md:h-16 gap-2 md:gap-4">
          {/* Top Line on Mobile: Brand Logo, Name & Live Sync Pill */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => onSelectTab('verifier')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-md shadow-blue-900/20 group-hover:border-blue-500 transition-colors shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-light tracking-wider sm:tracking-widest text-white text-sm sm:text-base md:text-lg uppercase">
                    TrustChain <span className="text-blue-500 font-bold">//</span> Ledger
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-tight hidden sm:block">
                  Enterprise Decentralized Credential Network
                </p>
              </div>
            </div>

            {/* Mobile Block Height & Sync Indicator */}
            <div className="flex md:hidden items-center gap-2 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-emerald-400 font-semibold">Block #{chainHeight}</span>
              <span className="text-white/20">|</span>
              <span className="text-stone-400">{totalCredentials} Certs</span>
            </div>
          </div>

          {/* Navigation Items (Line 2 on Mobile, Inline on Desktop) */}
          <nav className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full md:w-auto md:flex md:items-center">
            <button
              id="nav-verifier"
              onClick={() => onSelectTab('verifier')}
              className={`py-1.5 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                activeTab === 'verifier'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
              <span className="hidden lg:inline">Public Verifier</span>
              <span className="lg:hidden truncate">Verify</span>
            </button>

            <button
              id="nav-issuer"
              onClick={() => onSelectTab('issuer')}
              className={`py-1.5 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                activeTab === 'issuer'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
              <span className="hidden lg:inline">Issuance Terminal</span>
              <span className="lg:hidden truncate">Issuer</span>
            </button>

            <button
              id="nav-tamper"
              onClick={() => onSelectTab('tamper')}
              className={`py-1.5 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                activeTab === 'tamper'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-900/30'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
              }`}
              title="Live Tamper Resistance Simulator"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden lg:inline">Tamper Lab</span>
              <span className="lg:hidden truncate">Tamper</span>
            </button>

            <button
              id="nav-explorer"
              onClick={() => onSelectTab('explorer')}
              className={`py-1.5 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                activeTab === 'explorer'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Blocks className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
              <span className="hidden xl:inline">Hash Chain</span>
              <span className="xl:hidden truncate">Blocks</span>
            </button>

            <button
              id="nav-wallet"
              onClick={() => onSelectTab('wallet')}
              className={`py-1.5 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                activeTab === 'wallet'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
              <span className="hidden xl:inline">Credential Gallery</span>
              <span className="xl:hidden truncate">Gallery</span>
            </button>
          </nav>

          {/* Desktop Right Status Badge */}
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-white/10 text-xs shrink-0">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-stone-500">Node Status</p>
              <p className="text-xs font-mono text-emerald-400 uppercase flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Block #{chainHeight}</span>
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
