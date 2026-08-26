import React, { useState } from 'react';
import { BlockchainBlock, SignedCredential } from '../types';
import { CertificateCard } from './CertificateCard';
import { Award, Search, ShieldCheck, Sparkles, Filter, Grid, List } from 'lucide-react';

interface RecipientWalletProps {
  chain: BlockchainBlock[];
  onVerify: (credId: string) => void;
  onTamperTest: (cred: SignedCredential) => void;
}

export const RecipientWallet: React.FC<RecipientWalletProps> = ({
  chain,
  onVerify,
  onTamperTest,
}) => {
  const allCredentials: SignedCredential[] = chain.flatMap(b => b.transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCred, setSelectedCred] = useState<SignedCredential | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = allCredentials.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.payload.recipientName.toLowerCase().includes(term) ||
      c.payload.credentialId.toLowerCase().includes(term) ||
      c.payload.title.toLowerCase().includes(term) ||
      c.payload.institutionName.toLowerCase().includes(term);

    const matchesType = filterType === 'ALL' || c.payload.credentialType === filterType;
    return matchesSearch && matchesType;
  });

  const credentialTypes = Array.from(new Set(allCredentials.map(c => c.payload.credentialType)));

  return (
    <div id="recipient-wallet-container" className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-2">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Verifiable Credential Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Recipient & Student Credential Gallery
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Browse cryptographically signed degree certificates, export official PDF/PNG documents, or share verifiable QR codes.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-500 block">Total Issued</span>
            <span className="text-2xl font-extrabold font-mono text-white">{allCredentials.length}</span>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by Student Name, Degree Title, or Credential ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-medium text-stone-300 focus:outline-hidden [&>option]:bg-stone-900"
            >
              <option value="ALL">All Credential Types</option>
              {credentialTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Certificate Modal / View */}
      {selectedCred && (
        <div className="bg-black/60 p-4 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Full Certificate Presentation
            </h3>
            <button
              onClick={() => setSelectedCred(null)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold border border-white/10 shadow-xs transition-colors"
            >
              Close View ✕
            </button>
          </div>
          <CertificateCard
            credential={selectedCred}
            onVerify={onVerify}
            onTamperTest={onTamperTest}
          />
        </div>
      )}

      {/* Grid of Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(cred => (
          <div
            key={cred.payload.credentialId}
            onClick={() => setSelectedCred(cred)}
            className="cursor-pointer group"
          >
            <CertificateCard
              credential={cred}
              onVerify={onVerify}
              onTamperTest={onTamperTest}
              compact
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white/[0.03] rounded-2xl border border-white/10">
          <p className="text-stone-400 text-xs">No credentials found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};
