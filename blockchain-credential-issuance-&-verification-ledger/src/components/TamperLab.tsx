import React, { useState, useEffect } from 'react';
import { BlockchainBlock, CredentialPayload, SignedCredential } from '../types';
import { canonicalizeJson, sha256, verifySignature, computeMerkleRoot } from '../crypto/blockchain';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Hash,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Layers,
  FileText,
} from 'lucide-react';

interface TamperLabProps {
  chain: BlockchainBlock[];
  initialCredential?: SignedCredential;
  onSendToVerification: (tamperedPayload: CredentialPayload) => void;
}

export const TamperLab: React.FC<TamperLabProps> = ({
  chain,
  initialCredential,
  onSendToVerification,
}) => {
  const allCredentials: SignedCredential[] = chain.flatMap(b => b.transactions);
  const [selectedCredId, setSelectedCredId] = useState<string>(
    initialCredential?.payload.credentialId || allCredentials[0]?.payload.credentialId || ''
  );

  // Original reference
  const originalCred = allCredentials.find(c => c.payload.credentialId === selectedCredId) || allCredentials[0];

  // Tampered state fields
  const [tamperedName, setTamperedName] = useState('');
  const [tamperedTitle, setTamperedTitle] = useState('');
  const [tamperedGrade, setTamperedGrade] = useState('');
  const [tamperedMajor, setTamperedMajor] = useState('');
  const [tamperedFileHash, setTamperedFileHash] = useState('');

  // Computed live results
  const [originalHash, setOriginalHash] = useState('');
  const [computedTamperedHash, setComputedTamperedHash] = useState('');
  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [isMerkleRootValid, setIsMerkleRootValid] = useState(true);
  const [isChainValid, setIsChainValid] = useState(true);
  const [isTampered, setIsTampered] = useState(false);

  // Load selected credential into fields
  useEffect(() => {
    if (originalCred) {
      setTamperedName(originalCred.payload.recipientName);
      setTamperedTitle(originalCred.payload.title);
      setTamperedGrade(originalCred.payload.gradeOrGpa || '');
      setTamperedMajor(originalCred.payload.majorOrField);
      setTamperedFileHash(originalCred.payload.fileHash || '');
      setOriginalHash(originalCred.payloadHash);
    }
  }, [originalCred]);

  // Recalculate cryptographic integrity in real-time
  useEffect(() => {
    if (!originalCred) return;

    const runRecalculation = async () => {
      const currentPayload: CredentialPayload = {
        ...originalCred.payload,
        recipientName: tamperedName,
        title: tamperedTitle,
        gradeOrGpa: tamperedGrade,
        majorOrField: tamperedMajor,
        fileHash: tamperedFileHash,
      };

      const newHash = await sha256(canonicalizeJson(currentPayload));
      setComputedTamperedHash(newHash);

      const hasChanged = newHash.toLowerCase() !== originalCred.payloadHash.toLowerCase();
      setIsTampered(hasChanged);

      // Verify digital signature against institution public key
      const sigValid = await verifySignature(
        newHash,
        originalCred.signature,
        originalCred.payload.institutionPublicKey
      );
      setIsSignatureValid(sigValid && !hasChanged);

      // Merkle root check
      const associatedBlock = chain.find(b => b.index === originalCred.issuingBlockIndex);
      if (associatedBlock) {
        const blockTxHashes = associatedBlock.transactions.map(t =>
          t.payload.credentialId === originalCred.payload.credentialId ? newHash : t.payloadHash
        );
        const recomputedMerkle = await computeMerkleRoot(blockTxHashes);
        setIsMerkleRootValid(recomputedMerkle === associatedBlock.merkleRoot);
        setIsChainValid(recomputedMerkle === associatedBlock.merkleRoot && !hasChanged);
      }
    };

    runRecalculation();
  }, [tamperedName, tamperedTitle, tamperedGrade, tamperedMajor, tamperedFileHash, originalCred, chain]);

  const handleResetToOriginal = () => {
    if (originalCred) {
      setTamperedName(originalCred.payload.recipientName);
      setTamperedTitle(originalCred.payload.title);
      setTamperedGrade(originalCred.payload.gradeOrGpa || '');
      setTamperedMajor(originalCred.payload.majorOrField);
      setTamperedFileHash(originalCred.payload.fileHash || '');
    }
  };

  const handleSimulateTamperPreset = (preset: 'gpa_boost' | 'name_hijack' | 'degree_upgrade' | 'file_bitflip') => {
    if (!originalCred) return;
    if (preset === 'gpa_boost') {
      setTamperedGrade('4.00 / 4.00 (Class Rank #1 - Forged Honors)');
    } else if (preset === 'name_hijack') {
      setTamperedName('Victor "The Impostor" Vance');
    } else if (preset === 'degree_upgrade') {
      setTamperedTitle('Doctor of Philosophy (Ph.D.) in Advanced Computer Science');
    } else if (preset === 'file_bitflip') {
      // Flip last byte
      const orig = originalCred.payload.fileHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const flipped = orig.slice(0, -2) + 'ff';
      setTamperedFileHash(flipped);
    }
  };

  const handleTestInVerifier = () => {
    if (!originalCred) return;
    const currentPayload: CredentialPayload = {
      ...originalCred.payload,
      recipientName: tamperedName,
      title: tamperedTitle,
      gradeOrGpa: tamperedGrade,
      majorOrField: tamperedMajor,
      fileHash: tamperedFileHash,
    };
    onSendToVerification(currentPayload);
  };

  if (!originalCred) {
    return (
      <div className="text-center py-12 bg-white/[0.03] rounded-2xl border border-white/10">
        <p className="text-stone-400">No credentials on chain yet to test.</p>
      </div>
    );
  }

  return (
    <div id="tamper-lab-container" className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Interactive Cryptographic Tamper Simulator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Tamper Resistance & Signature Proof Lab
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl mx-auto">
          Modify any field below to witness how the cryptographic SHA-256 cascade and asymmetric digital signature guarantee immediate fraud detection.
        </p>
      </div>

      {/* Selector & Presets Bar */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="select-credential-to-tamper" className="text-xs font-bold text-stone-400 uppercase tracking-wider">Select Target:</label>
          <select
            id="select-credential-to-tamper"
            value={selectedCredId}
            onChange={e => setSelectedCredId(e.target.value)}
            className="text-xs font-semibold text-white bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-hidden [&>option]:bg-stone-900"
          >
            {allCredentials.map(c => (
              <option key={c.payload.credentialId} value={c.payload.credentialId}>
                {c.payload.credentialId} — {c.payload.recipientName} ({c.payload.institutionName})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Tamper Scenarios */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-stone-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Tamper Scenarios:
          </span>
          <button
            onClick={() => handleSimulateTamperPreset('gpa_boost')}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium transition-colors"
          >
            📈 Falsify GPA to 4.00
          </button>
          <button
            onClick={() => handleSimulateTamperPreset('name_hijack')}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium transition-colors"
          >
            👤 Change Name
          </button>
          <button
            onClick={() => handleSimulateTamperPreset('degree_upgrade')}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium transition-colors"
          >
            🎓 Upgrade to Ph.D.
          </button>
          <button
            onClick={() => handleSimulateTamperPreset('file_bitflip')}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium transition-colors"
          >
            📄 Flip 1 Bit in PDF File
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Editor vs Cryptographic Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Live Editable Fields */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Modify Credential Payload Fields</h3>
              <p className="text-xs text-stone-400">Edit any value to see live cryptographic failure</p>
            </div>
            {isTampered && (
              <button
                onClick={handleResetToOriginal}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Revert All
              </button>
            )}
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-300">Recipient Name</label>
                {tamperedName !== originalCred.payload.recipientName && (
                  <span className="text-[10px] font-bold text-rose-400">MODIFIED</span>
                )}
              </div>
              <input
                type="text"
                value={tamperedName}
                onChange={e => setTamperedName(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden ${
                  tamperedName !== originalCred.payload.recipientName
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-white/10 bg-black/40 text-white'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-300">Award / Degree Title</label>
                {tamperedTitle !== originalCred.payload.title && (
                  <span className="text-[10px] font-bold text-rose-400">MODIFIED</span>
                )}
              </div>
              <input
                type="text"
                value={tamperedTitle}
                onChange={e => setTamperedTitle(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden ${
                  tamperedTitle !== originalCred.payload.title
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-white/10 bg-black/40 text-white'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-300">Major / Field of Study</label>
                {tamperedMajor !== originalCred.payload.majorOrField && (
                  <span className="text-[10px] font-bold text-rose-400">MODIFIED</span>
                )}
              </div>
              <input
                type="text"
                value={tamperedMajor}
                onChange={e => setTamperedMajor(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden ${
                  tamperedMajor !== originalCred.payload.majorOrField
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-white/10 bg-black/40 text-white'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-300">Academic Standing / Grade / GPA</label>
                {tamperedGrade !== (originalCred.payload.gradeOrGpa || '') && (
                  <span className="text-[10px] font-bold text-rose-400">MODIFIED</span>
                )}
              </div>
              <input
                type="text"
                value={tamperedGrade}
                onChange={e => setTamperedGrade(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden ${
                  tamperedGrade !== (originalCred.payload.gradeOrGpa || '')
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-white/10 bg-black/40 text-white'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-300">Original Document File Hash (SHA-256)</label>
                {tamperedFileHash !== (originalCred.payload.fileHash || '') && (
                  <span className="text-[10px] font-bold text-rose-400">MODIFIED</span>
                )}
              </div>
              <input
                type="text"
                value={tamperedFileHash}
                onChange={e => setTamperedFileHash(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono border rounded-xl focus:outline-hidden ${
                  tamperedFileHash !== (originalCred.payload.fileHash || '')
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-white/10 bg-black/40 text-white'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleTestInVerifier}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-colors"
            >
              <span>Test This Payload in Public Verifier Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Cryptographic Cascade Results */}
        <div className="space-y-4">
          {/* Status Verdict Header */}
          <div
            className={`p-6 rounded-2xl border shadow-xl transition-all ${
              !isTampered
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/60 text-rose-200 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              {!isTampered ? (
                <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-10 h-10 text-rose-400 shrink-0" />
              )}
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  !isTampered ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {!isTampered ? 'ORIGINAL UNALTERED STATE' : 'CRYPTOGRAPHIC TAMPERING DETECTED'}
                </span>
                <h3 className="text-xl font-extrabold mt-1 text-white">
                  {!isTampered ? 'Ledger Proof & Signature VALID' : 'Integrity Broken! Mathematical Proof Failed'}
                </h3>
              </div>
            </div>
          </div>

          {/* Cryptographic Checks Breakdown */}
          <div className="bg-[#121216] text-stone-100 rounded-2xl p-5 border border-white/10 space-y-4 text-xs font-mono shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-stone-400 font-sans font-semibold">Cryptographic Pipeline</span>
              <span className="text-[10px] text-stone-500 font-mono">Real-Time WebCrypto</span>
            </div>

            {/* Check 1: SHA-256 Digest Match */}
            <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-stone-300">1. Payload SHA-256 Digest</span>
                {!isTampered ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MATCH
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> MISMATCH
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 break-all space-y-1 pt-1">
                <div>
                  <span className="text-stone-500">Expected (Block #{originalCred.issuingBlockIndex}): </span>
                  <span className="text-emerald-400">{originalHash}</span>
                </div>
                <div>
                  <span className="text-stone-500">Calculated (Current Text): </span>
                  <span className={isTampered ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {computedTamperedHash}
                  </span>
                </div>
              </div>
            </div>

            {/* Check 2: Asymmetric Digital Signature */}
            <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-stone-300">2. Issuer Digital Signature</span>
                {isSignatureValid ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> VALID
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> FORGERY REJECTED
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-stone-400 leading-relaxed pt-1">
                {isSignatureValid
                  ? `Signed with ${originalCred.payload.institutionName}'s private key and successfully verified against registered public key.`
                  : `Public key verification failed! The signature was created for the original data hash. Since you altered the payload, the math does not resolve.`}
              </p>
            </div>

            {/* Check 3: Blockchain Merkle Tree & Chain Linkage */}
            <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-stone-300">3. Blockchain Merkle Root</span>
                {isMerkleRootValid ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> INTACT
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> ROOT INVALIDATED
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-stone-400 leading-relaxed pt-1">
                {isMerkleRootValid
                  ? `Merkle root of Block #${originalCred.issuingBlockIndex} matches transaction tree.`
                  : `Block #${originalCred.issuingBlockIndex} Merkle root broken! The block header would require remining the entire chain.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
