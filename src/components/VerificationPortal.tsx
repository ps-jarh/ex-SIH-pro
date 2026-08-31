import React, { useState, useEffect, useRef } from 'react';
import { BlockchainBlock, SignedCredential, VerificationResult } from '../types';
import { calculateFileSha256, verifyCredentialQuery, sha256 } from '../crypto/blockchain';
import { CertificateCard } from './CertificateCard';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  UploadCloud,
  QrCode,
  Search,
  FileCheck2,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Hash,
  Sparkles,
  RefreshCw,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VerificationPortalProps {
  chain: BlockchainBlock[];
  initialQuery?: string;
  onNavigateToBlock?: (blockIndex: number) => void;
  onNavigateToTamper?: (cred: SignedCredential) => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  chain,
  initialQuery,
  onNavigateToBlock,
  onNavigateToTamper,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'id' | 'qr'>('file');
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: number;
    type: string;
    hash: string;
  } | null>(null);
  const [showCertificateView, setShowCertificateView] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showRawDiagnostics, setShowRawDiagnostics] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If initialQuery is passed, trigger search
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setActiveTab('id');
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#059669', '#34D399', '#3B82F6', '#F59E0B'],
      });
    } catch {
      // ignore
    }
  };

  const handleSearch = async (queryToRun?: string) => {
    const q = (queryToRun ?? searchQuery).trim();
    if (!q) return;

    setIsProcessing(true);
    setFileDetails(null);

    try {
      // Determine if query is a 64-char hash or a credential ID
      const isHexHash = /^[a-fA-F0-9]{64}$/.test(q);
      const res = await verifyCredentialQuery(chain, {
        rawHash: isHexHash ? q : undefined,
        credentialId: !isHexHash ? q : undefined,
      });

      setVerificationResult(res);
      if (res.status === 'VALID') {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Verification error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    try {
      const calculatedHash = await calculateFileSha256(file);
      setFileDetails({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        hash: calculatedHash,
      });

      const res = await verifyCredentialQuery(chain, {
        fileHash: calculatedHash,
      });

      setVerificationResult(res);
      if (res.status === 'VALID') {
        triggerConfetti();
      }
    } catch (err) {
      console.error('File verification error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSampleFileTest = async (type: 'alice' | 'mit' | 'tampered') => {
    setIsProcessing(true);
    try {
      let sampleHash = '';
      let sampleName = '';
      let sampleSize = 0;

      if (type === 'alice') {
        // Stanford official hash
        sampleHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        sampleName = 'Alice_Chen_Stanford_BS_Degree_Official.pdf';
        sampleSize = 245812;
      } else if (type === 'mit') {
        // MIT official hash
        sampleHash = 'c7f9984920485901baef4c1a2e3d4c5b6a7890123456789abcdef0123456789a';
        sampleName = 'David_Miller_MIT_MEng_Diploma.pdf';
        sampleSize = 189420;
      } else {
        // Tampered file (1 byte flipped in hash)
        sampleHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899';
        sampleName = 'Modified_Alice_Chen_Fake_Grade_A4.pdf';
        sampleSize = 245900;
      }

      setFileDetails({
        name: sampleName,
        size: sampleSize,
        type: 'application/pdf',
        hash: sampleHash,
      });

      const res = await verifyCredentialQuery(chain, {
        fileHash: sampleHash,
      });

      setVerificationResult(res);
      if (res.status === 'VALID') {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Sample test error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const allCredentials: SignedCredential[] = chain.flatMap(b => b.transactions);

  return (
    <div id="verification-portal" className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner & Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-500/20">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Zero-Knowledge Proof & Hash-Chain Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-widest uppercase">
          Public Credential <span className="font-bold text-blue-500">Validator</span>
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl mx-auto">
          Instantly validate digital credentials, academic degrees, and certificates directly against the immutable blockchain ledger without contacting issuing registrars.
        </p>
      </div>

      {/* Verification Method Tabs */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex border-b border-white/10 gap-2">
          <button
            id="tab-file-verify"
            onClick={() => {
              setActiveTab('file');
              setVerificationResult(null);
            }}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>Verify Document File</span>
          </button>
          <button
            id="tab-id-verify"
            onClick={() => {
              setActiveTab('id');
              setVerificationResult(null);
            }}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'id'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span>Search by ID / Hash</span>
          </button>
          <button
            id="tab-qr-verify"
            onClick={() => {
              setActiveTab('qr');
              setVerificationResult(null);
            }}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'qr'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>QR Code Lookup</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div
              id="file-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : 'border-white/10 hover:border-blue-500/50 bg-black/20 hover:bg-blue-500/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">
                Drop Original Certificate File (PDF, PNG, JPG, JSON)
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto mb-3">
                Your browser calculates the cryptographic SHA-256 digest in real-time. No file contents are sent to external servers; only the fingerprint is matched against the ledger.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Select File from Device
              </button>
            </div>

            {/* Quick Demo Test Files */}
            <div className="bg-black/40 rounded-xl p-3.5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> One-Click Test Files:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-test-alice-file"
                  onClick={() => handleSampleFileTest('alice')}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg border border-white/10 text-xs font-mono transition-colors"
                >
                  📄 Stanford BS (Alice Chen)
                </button>
                <button
                  id="btn-test-mit-file"
                  onClick={() => handleSampleFileTest('mit')}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg border border-white/10 text-xs font-mono transition-colors"
                >
                  🏛️ MIT MEng (David Miller)
                </button>
                <button
                  id="btn-test-tampered-file"
                  onClick={() => handleSampleFileTest('tampered')}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 text-xs font-mono transition-colors flex items-center gap-1"
                >
                  ⚠️ Tampered PDF (Altered 1-byte)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ID or Hash Search */}
        {activeTab === 'id' && (
          <div className="space-y-4">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="input-cred-id-search"
                  type="text"
                  placeholder="Enter Credential ID (e.g. BC-2025-STAN-8841) or 64-character SHA-256 Hash..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono transition-colors"
                />
              </div>
              <button
                id="btn-submit-search"
                type="submit"
                disabled={isProcessing || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50 shrink-0"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify on Chain</span>
              </button>
            </form>

            {/* Quick Sample IDs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-stone-500 uppercase tracking-wider text-[11px]">Try existing IDs on chain:</span>
              {allCredentials.slice(0, 4).map(c => (
                <button
                  key={c.payload.credentialId}
                  onClick={() => {
                    setSearchQuery(c.payload.credentialId);
                    handleSearch(c.payload.credentialId);
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg font-mono text-[11px] border border-white/10 transition-colors"
                >
                  {c.payload.credentialId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: QR Code Verification */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center py-4">
            <div className="max-w-md mx-auto bg-black/40 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">Scan or Select Verifiable QR Code</h4>
                <p className="text-xs text-stone-400 mt-1">
                  Every issued certificate embeds a cryptographic QR payload with instant zero-contact ledger proof.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider text-left">Quick-Scan Sample Credentials:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {allCredentials.slice(0, 4).map(c => (
                    <button
                      key={c.payload.credentialId}
                      onClick={() => {
                        handleSearch(c.payload.credentialId);
                      }}
                      className="p-2.5 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-lg text-xs transition-all flex items-center gap-2 group"
                    >
                      <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-blue-400 font-mono text-[10px] group-hover:bg-blue-500/20">
                        QR
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{c.payload.recipientName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{c.payload.credentialId}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Calculated File Details Bar */}
      {fileDetails && (
        <div className="bg-black/60 text-stone-100 rounded-xl p-4 text-xs font-mono space-y-2 border border-white/10 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-blue-400 font-semibold flex items-center gap-1.5">
              <Hash className="w-4 h-4" /> Client-Side Computed SHA-256 Fingerprint
            </span>
            <span className="text-stone-400 font-sans">{fileDetails.name} ({(fileDetails.size / 1024).toFixed(1)} KB)</span>
          </div>
          <div className="flex items-center justify-between gap-2 break-all">
            <span className="text-stone-300 select-all">{fileDetails.hash}</span>
            <button
              onClick={() => handleCopy(fileDetails.hash)}
              className="p-1 text-stone-400 hover:text-white rounded transition-colors shrink-0"
              title="Copy Hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      {verificationResult && (
        <div id="verification-result-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Status Alert Banner */}
          {verificationResult.status === 'VALID' && (
            <div
              id="status-valid-banner"
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Cryptographically Verified
                    </span>
                    <span className="text-emerald-300/80 text-xs font-mono">
                      Block #{verificationResult.block?.index}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">100% Authentic & Tamper-Proof</h2>
                  <p className="text-emerald-200 text-sm mt-0.5">
                    This credential was issued by {verificationResult.credential?.payload.institutionName} and is verified against the consortium blockchain ledger.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <button
                  id="btn-toggle-cert-view"
                  onClick={() => setShowCertificateView(!showCertificateView)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs uppercase tracking-wider font-bold inline-flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{showCertificateView ? 'Hide Certificate' : 'View Official Certificate'}</span>
                </button>
              </div>
            </div>
          )}

          {verificationResult.status === 'TAMPERED' && (
            <div
              id="status-tampered-banner"
              className="bg-rose-500/10 border border-rose-500/30 text-rose-100 p-6 rounded-xl shadow-lg flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Integrity Violation
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">TAMPERING / FORGERY DETECTED!</h2>
                <p className="text-rose-200 text-sm">
                  The computed cryptographic digest does not match the immutable hash registered on the blockchain. One or more fields or the document contents have been altered after issuance.
                </p>
              </div>
            </div>
          )}

          {verificationResult.status === 'REVOKED' && (
            <div
              id="status-revoked-banner"
              className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-6 rounded-xl shadow-lg flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Revoked Credential
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">CREDENTIAL HAS BEEN REVOKED</h2>
                <p className="text-amber-200 text-sm">
                  This credential was officially invalidated on the blockchain ledger by the issuing authority.
                  Reason:{' '}
                  <span className="font-semibold text-white">
                    {verificationResult.credential?.revocation.reason || 'Revoked by authority'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {verificationResult.status === 'NOT_FOUND' && (
            <div
              id="status-notfound-banner"
              className="bg-stone-900/80 border border-white/10 text-stone-200 p-6 rounded-xl shadow-lg flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 shrink-0">
                <ShieldX className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">No Matching Ledger Record Found</h2>
                <p className="text-stone-400 text-sm">
                  No credential matching the uploaded file fingerprint or query ID exists in the blockchain database. Please verify the ID or upload the unedited original certificate file.
                </p>
              </div>
            </div>
          )}

          {/* Render Full Certificate View if Toggled */}
          {showCertificateView && verificationResult.credential && (
            <div className="animate-in fade-in duration-200">
              <CertificateCard
                credential={verificationResult.credential}
                onTamperTest={onNavigateToTamper}
              />
            </div>
          )}

          {/* 6-Point Cryptographic Check Breakdown Grid */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-white border-l-2 border-blue-500 pl-4">
                  Cryptographic Proof Diagnostics
                </h3>
                <p className="text-xs text-stone-400 mt-1 pl-4">6-point automated cryptographic verification pipeline</p>
              </div>
              <span className="text-xs font-medium text-stone-500 font-mono">
                {new Date(verificationResult.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {verificationResult.checks.map(check => (
                <div
                  key={check.id}
                  className={`p-4 rounded-lg border transition-all ${
                    check.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-stone-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-1.5">
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold text-sm leading-tight text-white">{check.name}</h4>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">{check.details}</p>
                      {check.diagnostic && (
                        <p className="text-[11px] font-mono text-stone-400 mt-1 pt-1 border-t border-white/10">
                          {check.diagnostic}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Credential Metadata Summary */}
            {verificationResult.credential && (
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-3">
                <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  Verified Credential Record
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-stone-500 block">Recipient Name</span>
                    <span className="font-bold text-white text-sm">
                      {verificationResult.credential.payload.recipientName}
                    </span>
                    <span className="text-stone-400 text-[11px] font-mono block">
                      ID: {verificationResult.credential.payload.recipientId}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Conferred Award</span>
                    <span className="font-bold text-white text-sm">
                      {verificationResult.credential.payload.title}
                    </span>
                    <span className="text-stone-300 text-[11px] block">
                      {verificationResult.credential.payload.majorOrField}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Issuing Authority</span>
                    <span className="font-bold text-white text-sm">
                      {verificationResult.credential.payload.institutionName}
                    </span>
                    <span className="text-stone-400 text-[11px] block">
                      Issued: {new Date(verificationResult.credential.payload.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onNavigateToBlock && verificationResult.block && (
                      <button
                        onClick={() => onNavigateToBlock(verificationResult.block!.index)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs font-medium uppercase tracking-wider border border-white/10 inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Inspect Block #{verificationResult.block.index} in Explorer
                      </button>
                    )}
                    {onNavigateToTamper && (
                      <button
                        onClick={() => onNavigateToTamper(verificationResult.credential!)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium uppercase tracking-wider border border-amber-500/30 inline-flex items-center gap-1 transition-colors"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400" /> Test Tampering in Lab
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowRawDiagnostics(!showRawDiagnostics)}
                    className="text-stone-400 hover:text-white text-xs font-medium inline-flex items-center gap-1"
                  >
                    <span>{showRawDiagnostics ? 'Hide Technical Hashes' : 'Show Technical Hashes'}</span>
                    {showRawDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showRawDiagnostics && (
                  <div className="bg-black/60 text-stone-200 rounded-lg p-3 text-[11px] font-mono space-y-1.5 break-all border border-white/10">
                    <div>
                      <span className="text-stone-400">Payload Hash: </span>
                      <span className="text-blue-400">{verificationResult.credential.payloadHash}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Digital Signature: </span>
                      <span className="text-cyan-300">{verificationResult.credential.signature}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Issuer Public Key: </span>
                      <span className="text-amber-300">{verificationResult.credential.payload.institutionPublicKey}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
