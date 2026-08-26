import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SignedCredential, Institution } from '../types';
import { getInstitutionByPublicKey, getInstitutionById } from '../crypto/institutions';
import { Download, ShieldCheck, CheckCircle2, Copy, Check, FileText, AlertTriangle, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateCardProps {
  credential: SignedCredential;
  onVerify?: (credentialId: string) => void;
  onTamperTest?: (credential: SignedCredential) => void;
  compact?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  credential,
  onVerify,
  onTamperTest,
  compact = false,
}) => {
  const { payload, payloadHash, signature, issuingBlockIndex, revocation } = credential;
  const inst: Institution | undefined =
    getInstitutionByPublicKey(payload.institutionPublicKey) || getInstitutionById(payload.institutionId);

  const certRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const qrData = JSON.stringify({
    credentialId: payload.credentialId,
    recipient: payload.recipientName,
    title: payload.title,
    institution: payload.institutionName,
    payloadHash: payloadHash,
    blockIndex: issuingBlockIndex,
    signature: signature.slice(0, 32) + '...',
  });

  const handleCopyHash = () => {
    navigator.clipboard.writeText(payloadHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = async () => {
    if (!certRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${payload.recipientName.replace(/\s+/g, '_')}_${payload.credentialId}_Certificate.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${payload.recipientName.replace(/\s+/g, '_')}_${payload.credentialId}_Official.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(credential, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${payload.credentialId}_VerifiableCredential.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (compact) {
    return (
      <div
        id={`card-compact-${payload.credentialId}`}
        className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 shadow-xl hover:border-blue-500/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{inst?.logo || '🎓'}</span>
              <div>
                <h4 className="font-semibold text-white text-sm leading-tight">{payload.institutionName}</h4>
                <span className="text-xs text-stone-400">{payload.credentialType}</span>
              </div>
            </div>
            {revocation.isRevoked ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Revoked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Block #{issuingBlockIndex}
              </span>
            )}
          </div>

          <h3 className="font-bold text-white text-base mb-1">{payload.title}</h3>
          <p className="text-sm font-medium text-stone-300 mb-2">Conferred to: {payload.recipientName}</p>
          <div className="bg-black/40 rounded-xl p-3 mb-3 text-xs text-stone-300 space-y-1.5 border border-white/10">
            <div className="flex justify-between">
              <span className="text-stone-400">Credential ID:</span>
              <span className="font-mono font-medium text-white">{payload.credentialId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Major / Field:</span>
              <span className="font-medium text-stone-200 truncate max-w-[180px]">{payload.majorOrField}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Issued On:</span>
              <span>{new Date(payload.issuedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          {onVerify && (
            <button
              id={`btn-verify-compact-${payload.credentialId}`}
              onClick={() => onVerify(payload.credentialId)}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-900/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Verify
            </button>
          )}
          {onTamperTest && (
            <button
              id={`btn-tamper-compact-${payload.credentialId}`}
              onClick={() => onTamperTest(credential)}
              className="py-2 px-3 bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-stone-300 rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1"
              title="Test Tampering Simulation"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Tamper Lab
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id={`credential-detail-${payload.credentialId}`} className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121216] border border-white/10 text-white p-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">Blockchain Verifiable Credential #{payload.credentialId}</span>
          {revocation.isRevoked && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              REVOKED ON CHAIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            id={`btn-export-pdf-${payload.credentialId}`}
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            id={`btn-export-png-${payload.credentialId}`}
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
          <button
            id={`btn-export-json-${payload.credentialId}`}
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <FileText className="w-3.5 h-3.5" /> JSON Proof
          </button>
          {onVerify && (
            <button
              id={`btn-verify-full-${payload.credentialId}`}
              onClick={() => onVerify(payload.credentialId)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Validate Now
            </button>
          )}
        </div>
      </div>

      {/* Main Certificate Visual Frame */}
      <div
        ref={certRef}
        id={`certificate-render-${payload.credentialId}`}
        className="relative bg-white text-stone-900 p-8 sm:p-12 rounded-2xl border-8 border-double border-stone-300 shadow-xl overflow-hidden font-serif"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAF9 100%)',
        }}
      >
        {/* Subtle Watermark Seal Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <div className="text-[280px]">🏛️</div>
        </div>

        {/* Outer Decorative Border Frame */}
        <div className="border border-stone-400 p-6 sm:p-8 rounded-lg relative">
          {/* Corner Decorative Ornaments */}
          <div className="absolute top-2 left-2 text-stone-400 text-xs select-none">❖</div>
          <div className="absolute top-2 right-2 text-stone-400 text-xs select-none">❖</div>
          <div className="absolute bottom-2 left-2 text-stone-400 text-xs select-none">❖</div>
          <div className="absolute bottom-2 right-2 text-stone-400 text-xs select-none">❖</div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="text-4xl select-none mb-1">{inst?.logo || '🎓'}</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide uppercase text-stone-900" style={{ color: inst?.accentColor || '#1c1917' }}>
              {payload.institutionName}
            </h1>
            <p className="text-xs tracking-widest uppercase text-stone-500 font-sans font-medium">
              Official Blockchain-Authenticated Credential • {inst?.jurisdiction || 'Accredited Authority'}
            </p>
          </div>

          {/* Conferred Text */}
          <div className="text-center space-y-3 my-6 font-sans">
            <p className="text-xs uppercase tracking-widest text-stone-500">This is to officially certify that</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-stone-900 font-serif tracking-tight border-b-2 border-stone-200 pb-2 inline-block px-8">
              {payload.recipientName}
            </h2>
            <p className="text-xs text-stone-500 font-mono">Student ID: {payload.recipientId} • {payload.recipientEmail}</p>
            <p className="text-xs uppercase tracking-widest text-stone-500 pt-2">has fulfilled all requirements and is awarded the</p>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-800 font-serif">
              {payload.title}
            </h3>
            <p className="text-sm font-medium text-stone-700 italic">
              with Specialization in <span className="font-semibold text-stone-900 not-italic">{payload.majorOrField}</span>
            </p>
            {payload.gradeOrGpa && (
              <p className="text-xs text-stone-600 bg-stone-100 inline-block px-3 py-1 rounded-full font-medium">
                Academic Standing: {payload.gradeOrGpa}
              </p>
            )}
          </div>

          {/* Additional Attributes Grid */}
          {payload.additionalAttributes && Object.keys(payload.additionalAttributes).length > 0 && (
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans bg-stone-50/80 p-3 rounded-lg border border-stone-200">
              {Object.entries(payload.additionalAttributes).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-stone-500">{k}:</span>
                  <span className="font-semibold text-stone-800">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Certificate Footer / Signatures & QR */}
          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
            {/* Left: Issuance & Signer */}
            <div className="text-center sm:text-left space-y-1 text-xs">
              <div className="font-serif italic text-base text-stone-700 border-b border-stone-400 pb-1 px-4 inline-block sm:block sm:px-0">
                {inst?.name || 'Authorized Registrar'}
              </div>
              <p className="text-stone-500">Authorized Digital Signatory</p>
              <p className="text-stone-600 font-medium">Issued: {new Date(payload.issuedAt).toLocaleDateString()}</p>
              {payload.expiryDate && (
                <p className="text-stone-500">Valid Until: {new Date(payload.expiryDate).toLocaleDateString()}</p>
              )}
            </div>

            {/* Center: Dynamic Blockchain Stamp */}
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-double border-amber-600 flex items-center justify-center bg-amber-50/60 shadow-xs mb-1">
                <ShieldCheck className="w-8 h-8 text-amber-700" />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-amber-900 uppercase">
                Consortium Block #{issuingBlockIndex}
              </span>
              <span className="text-[9px] text-stone-400 font-mono">Immutable Hash-Chain</span>
            </div>

            {/* Right: Verifiable QR Code */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200 shadow-xs">
              <QRCodeSVG
                value={qrData}
                size={80}
                level="M"
                includeMargin={false}
                className="rounded"
              />
              <div className="text-left text-[10px] space-y-0.5 max-w-[130px]">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-600" /> Scan to Verify
                </div>
                <p className="text-stone-500 leading-tight">Instant zero-contact cryptographic lookup</p>
                <span className="font-mono font-bold text-stone-700 text-[9px] block">
                  {payload.credentialId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Watermark Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-[10px] text-stone-500 font-mono font-sans gap-2">
          <div className="flex items-center gap-1.5 truncate max-w-full">
            <span className="text-stone-400">SHA-256 Digest:</span>
            <span className="truncate">{payloadHash}</span>
            <button
              onClick={handleCopyHash}
              className="p-1 hover:text-stone-900 text-stone-400 rounded transition-colors"
              title="Copy Payload Hash"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="text-stone-400">
            Sig: {signature.slice(0, 18)}...{signature.slice(-10)}
          </div>
        </div>
      </div>
    </div>
  );
};
