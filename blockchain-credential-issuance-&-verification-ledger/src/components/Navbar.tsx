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
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md text-white border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onSelectTab('verifier')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-md shadow-blue-900/20 group-hover:border-blue-500 transition-colors">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-light tracking-widest text-white text-base sm:text-lg uppercase">
                  TrustChain <span className="text-blue-500 font-bold">//</span> Ledger
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-tight hidden sm:block">
                Enterprise Decentralized Credential Network
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-verifier"
              onClick={() => onSelectTab('verifier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'verifier'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Public Verifier</span>
              <span className="md:hidden">Verify</span>
            </button>

            <button
              id="nav-issuer"
              onClick={() => onSelectTab('issuer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'issuer'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Issuance Terminal</span>
              <span className="md:hidden">Issuer</span>
            </button>

            <button
              id="nav-tamper"
              onClick={() => onSelectTab('tamper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'tamper'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-900/30'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
              }`}
              title="Live Tamper Resistance Simulator"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden md:inline">Tamper Lab</span>
              <span className="md:hidden">Tamper</span>
            </button>

            <button
              id="nav-explorer"
              onClick={() => onSelectTab('explorer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'explorer'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Blocks className="w-4 h-4 text-blue-400" />
              <span className="hidden lg:inline">Hash Chain</span>
              <span className="lg:hidden">Blocks</span>
            </button>

            <button
              id="nav-wallet"
              onClick={() => onSelectTab('wallet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'wallet'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4 text-blue-400" />
              <span className="hidden lg:inline">Credential Gallery</span>
              <span className="lg:hidden">Gallery</span>
            </button>
          </nav>

          {/* Right Status Badge */}
          <div className="hidden xl:flex items-center gap-4 pl-4 border-l border-white/10 text-xs">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Node Status</p>
              <p className="text-xs font-mono text-emerald-400 uppercase flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Synchronized [#{chainHeight}]</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
