import React, { useState } from 'react';
import { BlockchainBlock } from '../types';
import { auditBlockchainIntegrity, resetBlockchain } from '../crypto/blockchain';
import {
  Blocks,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  Download,
  RotateCcw,
  Layers,
  ArrowDown,
  Hash,
  Clock,
  Key,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BlockchainExplorerProps {
  chain: BlockchainBlock[];
  onChainReset: (newChain: BlockchainBlock[]) => void;
  selectedBlockIndex?: number;
}

export const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({
  chain,
  onChainReset,
  selectedBlockIndex,
}) => {
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(
    selectedBlockIndex !== undefined ? selectedBlockIndex : chain.length - 1
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{
    isValid: boolean;
    errors: string[];
    totalBlocks: number;
    totalCredentials: number;
    auditedAt: string;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showRawJsonModal, setShowRawJsonModal] = useState<BlockchainBlock | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditBlockchainIntegrity(chain);
      setAuditResult(res);
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExportLedger = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chain, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `consortium_blockchain_ledger_height_${chain.length}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetLedger = async () => {
    if (window.confirm('Are you sure you want to reset the blockchain ledger to the initial seed?')) {
      const defaultChain = await resetBlockchain();
      onChainReset(defaultChain);
      setAuditResult(null);
      setExpandedBlockIndex(defaultChain.length - 1);
    }
  };

  const filteredBlocks = chain.filter(b => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesBlock =
      b.index.toString() === term ||
      b.hash.toLowerCase().includes(term) ||
      b.minerOrAuthority.toLowerCase().includes(term) ||
      b.prevHash.toLowerCase().includes(term);
    const matchesTx = b.transactions.some(
      t =>
        t.payload.credentialId.toLowerCase().includes(term) ||
        t.payload.recipientName.toLowerCase().includes(term) ||
        t.payload.title.toLowerCase().includes(term) ||
        t.payloadHash.toLowerCase().includes(term)
    );
    return matchesBlock || matchesTx;
  });

  return (
    <div id="blockchain-explorer-container" className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-2">
              <Blocks className="w-3.5 h-3.5 text-blue-400" />
              <span>Permissioned Hash-Chain Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Consortium Blockchain Explorer
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Explore immutable block headers, cryptographic Merkle trees, and prevHash linkages across all authority nodes.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-run-audit"
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuditing ? 'Auditing Math...' : 'Run Full Ledger Audit'}</span>
            </button>
            <button
              id="btn-export-ledger"
              onClick={handleExportLedger}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-stone-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              id="btn-reset-ledger"
              onClick={handleResetLedger}
              className="px-3.5 py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-stone-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/10"
              title="Reset to Factory State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="bg-black/40 p-3.5 rounded-xl border border-white/10">
            <span className="text-stone-400 block text-[11px]">Chain Height</span>
            <span className="font-mono font-extrabold text-white text-base">{chain.length} Blocks</span>
          </div>
          <div className="bg-black/40 p-3.5 rounded-xl border border-white/10">
            <span className="text-stone-400 block text-[11px]">Total Credentials</span>
            <span className="font-mono font-extrabold text-white text-base">
              {chain.reduce((acc, b) => acc + b.transactions.length, 0)} Records
            </span>
          </div>
          <div className="bg-black/40 p-3.5 rounded-xl border border-white/10">
            <span className="text-stone-400 block text-[11px]">Consensus Engine</span>
            <span className="font-mono font-extrabold text-emerald-400 text-base">Proof of Authority</span>
          </div>
          <div className="bg-black/40 p-3.5 rounded-xl border border-white/10">
            <span className="text-stone-400 block text-[11px]">Hash Cryptography</span>
            <span className="font-mono font-extrabold text-blue-400 text-base">SHA-256 + ECDSA</span>
          </div>
        </div>
      </div>

      {/* Audit Banner Result */}
      {auditResult && (
        <div
          className={`p-5 rounded-2xl border shadow-xl transition-all ${
            auditResult.isValid
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {auditResult.isValid ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-base text-white">
                  {auditResult.isValid
                    ? '100% Cryptographic Ledger Integrity Verified'
                    : 'Integrity Violations Detected in Ledger'}
                </h3>
                <p className="text-xs mt-0.5 opacity-90 text-stone-300">
                  {auditResult.isValid
                    ? `All ${auditResult.totalBlocks} blocks, prevHash links, Merkle roots, and ${auditResult.totalCredentials} institutional ECDSA signatures passed validation.`
                    : `${auditResult.errors.length} integrity errors found.`}
                </p>
                {!auditResult.isValid && (
                  <ul className="mt-2 space-y-1 text-xs font-mono text-rose-300">
                    {auditResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setAuditResult(null)}
              className="text-xs font-semibold text-stone-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Filter by Block Height, Block Hash, Credential ID, or Student Name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Blocks Chain Visual Stream */}
      <div className="space-y-4">
        {filteredBlocks.map((block, index) => {
          const isExpanded = expandedBlockIndex === block.index;
          const isGenesis = block.index === 0;

          return (
            <div key={block.index} className="relative">
              {/* Down arrow link between blocks */}
              {index > 0 && (
                <div className="flex items-center justify-center my-2 text-stone-500">
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full text-[10px] font-mono border border-white/10 text-stone-400">
                    <ArrowDown className="w-3 h-3 text-blue-400" />
                    <span>Cryptographic Link: prevHash == Block #{block.index - 1} Hash</span>
                  </div>
                </div>
              )}

              {/* Block Card */}
              <div
                id={`block-card-${block.index}`}
                className={`bg-white/[0.03] rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-blue-500/60 shadow-xl ring-1 ring-blue-500/30'
                    : 'border-white/10 shadow-lg hover:border-white/20'
                }`}
              >
                {/* Block Header Row */}
                <div
                  onClick={() => setExpandedBlockIndex(isExpanded ? null : block.index)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                        isGenesis
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      #{block.index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">
                          {isGenesis ? 'Consortium Genesis Block' : `Block #${block.index}`}
                        </h3>
                        <span className="text-[10px] font-medium text-stone-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                          {block.transactions.length} {block.transactions.length === 1 ? 'Tx' : 'Txs'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(block.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{block.minerOrAuthority}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Block Digest</span>
                      <span className="font-mono text-xs text-stone-300 font-medium">
                        {block.hash.slice(0, 14)}...{block.hash.slice(-8)}
                      </span>
                    </div>
                    <div className="text-stone-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 bg-black/40 space-y-4 text-xs">
                    {/* Header Hashes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                      <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold font-sans">
                          <span>Current Block Hash</span>
                          <button
                            onClick={() => handleCopy(block.hash)}
                            className="hover:text-white"
                            title="Copy Hash"
                          >
                            {copiedHash === block.hash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-blue-400 break-all select-all font-semibold">{block.hash}</div>
                      </div>

                      <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold font-sans">
                          <span>Previous Block Hash (prevHash)</span>
                          <button
                            onClick={() => handleCopy(block.prevHash)}
                            className="hover:text-white"
                            title="Copy PrevHash"
                          >
                            {copiedHash === block.prevHash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-stone-400 break-all select-all">{block.prevHash}</div>
                      </div>

                      <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold font-sans">
                          <span>Merkle Root Digest</span>
                          <button
                            onClick={() => handleCopy(block.merkleRoot)}
                            className="hover:text-white"
                            title="Copy Merkle Root"
                          >
                            {copiedHash === block.merkleRoot ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-cyan-400 break-all select-all">{block.merkleRoot}</div>
                      </div>

                      <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold font-sans">
                          <span>PoA Nonce / Authority Signature</span>
                        </div>
                        <div className="text-amber-300 break-all truncate">
                          Nonce: {block.nonce} | Sig: {block.signature.slice(0, 24)}...
                        </div>
                      </div>
                    </div>

                    {/* Embedded Transactions / Credentials List */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                        Block Payload Transactions ({block.transactions.length})
                      </h4>
                      {block.transactions.length === 0 ? (
                        <p className="text-xs text-stone-400 italic bg-black/40 p-3.5 rounded-xl border border-white/10">
                          {isGenesis
                            ? 'Genesis Anchor Block — Consortium Root Authority Initialization.'
                            : 'Cryptographic Revocation / Audit Marker Block.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {block.transactions.map((tx, txIdx) => (
                            <div
                              key={tx.payload.credentialId}
                              className="bg-black/50 p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono text-white">
                                    {tx.payload.credentialId}
                                  </span>
                                  <span className="text-xs text-stone-400">• {tx.payload.credentialType}</span>
                                  {tx.revocation.isRevoked && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      Revoked
                                    </span>
                                  )}
                                </div>
                                <p className="text-stone-200 font-semibold">{tx.payload.recipientName}</p>
                                <p className="text-stone-400 text-[11px]">{tx.payload.title}</p>
                              </div>

                              <div className="text-right space-y-1">
                                <div className="font-mono text-[10px] text-stone-400">
                                  Payload: {tx.payloadHash.slice(0, 16)}...
                                </div>
                                <div className="font-mono text-[10px] text-stone-400">
                                  Sig: {tx.signature.slice(0, 16)}...
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* View Raw Block JSON Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setShowRawJsonModal(block)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors font-sans"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Inspect Raw Block JSON</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw JSON Modal */}
      {showRawJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] text-stone-100 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-white/10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm font-mono text-blue-400">
                Block #{showRawJsonModal.index} Canonical JSON
              </h3>
              <button
                onClick={() => setShowRawJsonModal(null)}
                className="text-stone-400 hover:text-white text-xs font-semibold"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/50 p-4 rounded-xl font-mono text-xs text-stone-300 border border-white/10">
              <pre>{JSON.stringify(showRawJsonModal, null, 2)}</pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  handleCopy(JSON.stringify(showRawJsonModal, null, 2));
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-900/30"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
