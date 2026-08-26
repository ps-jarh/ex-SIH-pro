import React, { useState, useEffect } from 'react';
import { BlockchainBlock, CredentialPayload, SignedCredential } from './types';
import { loadBlockchain } from './crypto/blockchain';
import { Navbar, ActiveTab } from './components/Navbar';
import { VerificationPortal } from './components/VerificationPortal';
import { IssuerDashboard } from './components/IssuerDashboard';
import { TamperLab } from './components/TamperLab';
import { BlockchainExplorer } from './components/BlockchainExplorer';
import { RecipientWallet } from './components/RecipientWallet';
import { CertificateCard } from './components/CertificateCard';
import { ShieldCheck, Blocks, Key, CheckCircle2, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function App() {
  const [chain, setChain] = useState<BlockchainBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('verifier');

  // Deep-link / cross-navigation parameters
  const [verificationQuery, setVerificationQuery] = useState<string | undefined>();
  const [selectedCredForTamper, setSelectedCredForTamper] = useState<SignedCredential | undefined>();
  const [selectedBlockForExplorer, setSelectedBlockForExplorer] = useState<number | undefined>();
  const [viewingCertificate, setViewingCertificate] = useState<SignedCredential | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const loadedChain = await loadBlockchain();
        setChain(loadedChain);
      } catch (err) {
        console.error('Failed to initialize blockchain', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleNavigateToVerify = (credId: string) => {
    setVerificationQuery(credId);
    setActiveTab('verifier');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTamper = (cred: SignedCredential) => {
    setSelectedCredForTamper(cred);
    setActiveTab('tamper');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToBlock = (blockIndex: number) => {
    setSelectedBlockForExplorer(blockIndex);
    setActiveTab('explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendTamperedToVerification = (tamperedPayload: CredentialPayload) => {
    // Switch to verification portal
    setActiveTab('verifier');
    setVerificationQuery(tamperedPayload.credentialId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCredentials = chain.reduce((acc, b) => acc + b.transactions.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-[#e0e0e0] flex flex-col items-center justify-center space-y-4 p-4">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-medium text-sm tracking-widest uppercase">
          Initializing TrustChain Node & Ledger...
        </div>
        <p className="text-stone-500 text-xs font-mono">
          Verifying Genesis Root, Secp256k1 Keys, and Merkle Proofs
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e0e0e0] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          setViewingCertificate(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        chainHeight={chain.length}
        totalCredentials={totalCredentials}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Certificate Modal View if viewing single */}
        {viewingCertificate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#121216] text-stone-100 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-white/10 my-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Official Blockchain-Backed Certificate
                </h3>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-medium border border-white/10 transition-colors"
                >
                  Close ✕
                </button>
              </div>
              <CertificateCard
                credential={viewingCertificate}
                onVerify={id => {
                  setViewingCertificate(null);
                  handleNavigateToVerify(id);
                }}
                onTamperTest={c => {
                  setViewingCertificate(null);
                  handleNavigateToTamper(c);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 1: Public Verifier */}
        {activeTab === 'verifier' && (
          <VerificationPortal
            chain={chain}
            initialQuery={verificationQuery}
            onNavigateToBlock={handleNavigateToBlock}
            onNavigateToTamper={handleNavigateToTamper}
          />
        )}

        {/* Tab 2: Institution Portal */}
        {activeTab === 'issuer' && (
          <IssuerDashboard
            chain={chain}
            onChainUpdate={setChain}
            onViewCertificate={setViewingCertificate}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {/* Tab 3: Tamper Proof Lab */}
        {activeTab === 'tamper' && (
          <TamperLab
            chain={chain}
            initialCredential={selectedCredForTamper}
            onSendToVerification={handleSendTamperedToVerification}
          />
        )}

        {/* Tab 4: Blockchain Explorer */}
        {activeTab === 'explorer' && (
          <BlockchainExplorer
            chain={chain}
            onChainReset={setChain}
            selectedBlockIndex={selectedBlockForExplorer}
          />
        )}

        {/* Tab 5: Recipient Wallet */}
        {activeTab === 'wallet' && (
          <RecipientWallet
            chain={chain}
            onVerify={handleNavigateToVerify}
            onTamperTest={handleNavigateToTamper}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0a0c] border-t border-white/10 py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-stone-300 uppercase tracking-wider text-[11px]">TrustChain // Ledger</span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-400">Enterprise Decentralized Credential Network</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-emerald-400 font-medium">● Node Synchronized</span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-400">Height: #{chain.length}</span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-400">Zero-Knowledge Verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
