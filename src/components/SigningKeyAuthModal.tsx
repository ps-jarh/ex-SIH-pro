import React, { useState, useEffect } from 'react';
import { Institution } from '../types';
import { KeyRound, ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Hash } from 'lucide-react';

export interface SigningTargetDetails {
  type: 'single' | 'batch' | 'revocation';
  recipientName?: string;
  credentialTitle?: string;
  credentialId?: string;
  payloadHash?: string;
  batchCount?: number;
  revocationReason?: string;
}

interface SigningKeyAuthModalProps {
  isOpen: boolean;
  institution: Institution;
  targetDetails: SigningTargetDetails;
  targetBlockHeight: number;
  onConfirm: (validatedPrivateKey: string, rememberInSession: boolean) => Promise<void>;
  onCancel: () => void;
  cachedKey?: string;
}

export const SigningKeyAuthModal: React.FC<SigningKeyAuthModalProps> = ({
  isOpen,
  institution,
  targetDetails,
  targetBlockHeight,
  onConfirm,
  onCancel,
  cachedKey = '',
}) => {
  const [privateKeyInput, setPrivateKeyInput] = useState(cachedKey || institution.privateKey);
  const [showKey, setShowKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrivateKeyInput(cachedKey || institution.privateKey);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, cachedKey, institution]);

  if (!isOpen) return null;

  const isExactGenesisKey = privateKeyInput.trim() === institution.privateKey;
  const isKeyFormatAcceptable = privateKeyInput.trim().length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeyFormatAcceptable) {
      setErrorMsg('Private key cannot be empty and must meet minimum security entropy (8+ chars).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm(privateKeyInput.trim(), rememberKey);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Cryptographic signing failure. Please check the private key.');
      setIsSubmitting(false);
    }
  };

  const handleQuickFillGenesisKey = () => {
    setPrivateKeyInput(institution.privateKey);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121216] text-stone-100 rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-white/15 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  Security Layer // ECDSA Authority
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Institutional Private Key Authorization
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-white p-1 rounded-lg text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Institution & Action Summary Card */}
        <div className="bg-black/50 rounded-xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{institution.logo}</span>
              <div>
                <h4 className="font-bold text-white text-sm leading-tight">{institution.name}</h4>
                <span className="text-[11px] text-stone-400 font-mono">{institution.domain}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Authorized Signer
            </span>
          </div>

          <div className="border-t border-white/10 pt-2.5 text-xs space-y-1.5 font-sans">
            {targetDetails.type === 'single' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-400">Recipient Student:</span>
                  <span className="font-semibold text-white">{targetDetails.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Award / Title:</span>
                  <span className="font-medium text-stone-200 truncate max-w-[260px]">{targetDetails.credentialTitle}</span>
                </div>
                {targetDetails.credentialId && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Target Credential ID:</span>
                    <span className="font-mono text-blue-400 font-semibold">{targetDetails.credentialId}</span>
                  </div>
                )}
              </>
            )}

            {targetDetails.type === 'batch' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-400">Operation:</span>
                  <span className="font-semibold text-amber-300">Class of 2025 Batch Merkle Issuance</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Records to Anchor:</span>
                  <span className="font-mono text-white font-bold">{targetDetails.batchCount || 4} Students</span>
                </div>
              </>
            )}

            {targetDetails.type === 'revocation' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-400">Target Credential:</span>
                  <span className="font-mono text-rose-400 font-bold">{targetDetails.credentialId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Revocation Reason:</span>
                  <span className="text-stone-200 italic">{targetDetails.revocationReason}</span>
                </div>
              </>
            )}

            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span className="text-stone-400">Target Block Height:</span>
              <span className="font-mono text-emerald-400 font-bold">Block #{targetBlockHeight}</span>
            </div>

            {targetDetails.payloadHash && (
              <div className="bg-black/60 rounded-lg p-2 font-mono text-[10px] text-stone-300 space-y-0.5 border border-white/5 mt-1">
                <div className="text-stone-500 uppercase text-[9px] font-bold">SHA-256 Payload Digest to be signed:</div>
                <div className="text-blue-400 break-all">{targetDetails.payloadHash}</div>
              </div>
            )}
          </div>
        </div>

        {/* Private Key Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-inst-private-key" className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{institution.code} Institutional Private Key / Signing Secret *</span>
              </label>
              <button
                type="button"
                onClick={handleQuickFillGenesisKey}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Auto-fill Registered Genesis Key
              </button>
            </div>

            <div className="relative">
              <input
                id="input-inst-private-key"
                type={showKey ? 'text' : 'password'}
                required
                value={privateKeyInput}
                onChange={e => {
                  setPrivateKeyInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter or paste institution's Secp256k1 private key..."
                className={`w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-black/60 border rounded-xl text-white placeholder-stone-600 focus:outline-hidden transition-all ${
                  isExactGenesisKey
                    ? 'border-emerald-500/60 focus:border-emerald-400'
                    : isKeyFormatAcceptable
                    ? 'border-blue-500/60 focus:border-blue-400'
                    : 'border-white/10 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                title={showKey ? 'Hide Private Key' : 'Show Private Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Key verification indicator */}
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              {isExactGenesisKey ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matches registered consortium genesis key
                </span>
              ) : isKeyFormatAcceptable ? (
                <span className="text-amber-300 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Custom signing key loaded
                </span>
              ) : (
                <span className="text-stone-500">Enter institution's private key to proceed</span>
              )}

              <span className="text-stone-500 font-mono text-[10px]">
                {privateKeyInput.length} chars
              </span>
            </div>
          </div>

          {/* Session Cache Option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="cb-remember-key"
              type="checkbox"
              checked={rememberKey}
              onChange={e => setRememberKey(e.target.checked)}
              className="rounded bg-black/50 border-white/20 text-blue-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="cb-remember-key" className="text-xs text-stone-300 cursor-pointer select-none">
              Keep private key securely cached in memory for this browser session
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-[11px] text-stone-400 space-y-1">
            <div className="font-semibold text-blue-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> Non-Repudiation Guarantee
            </div>
            <p className="leading-relaxed">
              The digital signature produced with this key mathematically binds {institution.name}'s identity to this credential payload on the immutable blockchain ledger.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isKeyFormatAcceptable}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Computing ECDSA Signature...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-200" />
                  <span>Authorize & Mine to Ledger</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
