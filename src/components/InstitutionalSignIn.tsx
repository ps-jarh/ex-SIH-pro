import React, { useState } from 'react';
import { Institution } from '../types';
import { KNOWN_INSTITUTIONS } from '../crypto/institutions';
import {
  Building2,
  Lock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';

export interface IssuerAuthSession {
  institutionId: string;
  institution: Institution;
  officerName: string;
  officerRole: string;
  officerEmail: string;
  sessionToken: string;
  signedInAt: string;
  cachedPrivateKey?: string;
  hasHardwareToken: boolean;
}

interface InstitutionalSignInProps {
  onAuthenticate: (session: IssuerAuthSession) => void;
  selectedInstitutionId?: string;
}

export const InstitutionalSignIn: React.FC<InstitutionalSignInProps> = ({
  onAuthenticate,
  selectedInstitutionId = KNOWN_INSTITUTIONS[0].id,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(selectedInstitutionId);
  const [officerName, setOfficerName] = useState('Dr. Eleanor Vance');
  const [officerRole, setOfficerRole] = useState('University Registrar & Chief Academic Officer');
  const [officerEmail, setOfficerEmail] = useState('registrar@stanford.edu');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [useHardwareToken, setUseHardwareToken] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const selectedInst = KNOWN_INSTITUTIONS.find(i => i.id === selectedInstId) || KNOWN_INSTITUTIONS[0];

  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInstId(inst.id);
    if (inst.code === 'STAN') {
      setOfficerName('Dr. Eleanor Vance');
      setOfficerRole('University Registrar & Dean of Admissions');
      setOfficerEmail('registrar@stanford.edu');
      setPrivateKeyInput(inst.privateKey);
    } else if (inst.code === 'MIT') {
      setOfficerName('Prof. Marcus Sterling');
      setOfficerRole('Director of Academic Records & Cryptography');
      setOfficerEmail('dean.academic@mit.edu');
      setPrivateKeyInput(inst.privateKey);
    } else if (inst.code === 'IITB') {
      setOfficerName('Prof. Rajeshwari Sharma');
      setOfficerRole('Dean of Academic Affairs & Convocation Head');
      setOfficerEmail('dean.aa@iitb.ac.in');
      setPrivateKeyInput(inst.privateKey);
    } else if (inst.code === 'OXF') {
      setOfficerName('Lord Julian Davenport');
      setOfficerRole('Keeper of the University Archives & Registrary');
      setOfficerEmail('registrary@ox.ac.uk');
      setPrivateKeyInput(inst.privateKey);
    } else {
      setOfficerName('Sarah Lin');
      setOfficerRole('Global Certification Lead & Root Authority Custodian');
      setOfficerEmail('cert-authority@cloud.google.com');
      setPrivateKeyInput(inst.privateKey);
    }
  };

  const handleInstantSignIn = (inst: Institution) => {
    let name = 'Dr. Eleanor Vance';
    let role = 'University Registrar';
    let email = `registrar@${inst.domain}`;

    if (inst.code === 'MIT') {
      name = 'Prof. Marcus Sterling';
      role = 'Director of Academic Records';
    } else if (inst.code === 'IITB') {
      name = 'Prof. Rajeshwari Sharma';
      role = 'Dean of Academic Affairs';
    } else if (inst.code === 'OXF') {
      name = 'Lord Julian Davenport';
      role = 'Keeper of the Archives';
    } else if (inst.code === 'GCP') {
      name = 'Sarah Lin';
      role = 'Root Certification Lead';
    }

    const session: IssuerAuthSession = {
      institutionId: inst.id,
      institution: inst,
      officerName: name,
      officerRole: role,
      officerEmail: email,
      sessionToken: `AUTH-SESSION-ECDSA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      signedInAt: new Date().toISOString(),
      cachedPrivateKey: inst.privateKey,
      hasHardwareToken: true,
    };

    onAuthenticate(session);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !officerEmail.trim()) {
      setAuthError('Please fill in officer name and institutional email.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    setTimeout(() => {
      const session: IssuerAuthSession = {
        institutionId: selectedInst.id,
        institution: selectedInst,
        officerName: officerName.trim(),
        officerRole: officerRole.trim() || 'Accredited Issuing Officer',
        officerEmail: officerEmail.trim(),
        sessionToken: `AUTH-SESSION-ECDSA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        signedInAt: new Date().toISOString(),
        cachedPrivateKey: privateKeyInput.trim() || selectedInst.privateKey,
        hasHardwareToken: useHardwareToken,
      };

      setIsAuthenticating(false);
      onAuthenticate(session);
    }, 400);
  };

  return (
    <div id="institutional-auth-container" className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/30">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Consortium Issuer Security Layer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Accredited Institutional Issuance Portal
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl mx-auto">
          Sign in with your verified institutional identity and unlock your accredited authority's cryptographic signing keys to mint and manage immutable credentials.
        </p>
      </div>

      {/* 1-Click Fast Accreditation Login Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" /> Quick-Access Accredited Authority Nodes:
          </span>
          <span className="text-[11px] text-stone-500 font-mono">Select to Authenticate Instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KNOWN_INSTITUTIONS.map(inst => (
            <div
              key={inst.id}
              onClick={() => handleInstantSignIn(inst)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                inst.id === selectedInst.id
                  ? 'border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/15 shadow-lg shadow-blue-950/40'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">{inst.logo}</span>
                  <span className="text-[10px] font-mono font-bold bg-white/10 text-stone-300 px-2 py-0.5 rounded border border-white/10">
                    {inst.code} Node
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors leading-tight">
                  {inst.name}
                </h4>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">{inst.domain}</p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
                <span className="text-[10px] text-stone-500">Secp256k1 Key Loaded</span>
                <span className="text-blue-400 font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Sign-In Form */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Custom Officer Authentication</h3>
              <p className="text-xs text-stone-400">Verify university registrar credentials & private signing key</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> TLS 1.3 & WebCrypto Enclave
          </span>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Target Institution Selection */}
          <div>
            <label htmlFor="select-signin-inst" className="text-xs font-semibold text-stone-300 block mb-1.5">
              Issuing Academic / Certifying Authority *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {KNOWN_INSTITUTIONS.map(inst => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => handleSelectInstitution(inst)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    inst.id === selectedInstId
                      ? 'border-blue-500 bg-blue-500/20 text-white font-bold'
                      : 'border-white/10 bg-black/40 text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{inst.logo}</span>
                  <span className="text-xs truncate">{inst.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-officer-name" className="text-xs font-semibold text-stone-300 block mb-1">
                Authorized Officer Full Name *
              </label>
              <input
                id="input-officer-name"
                type="text"
                required
                value={officerName}
                onChange={e => setOfficerName(e.target.value)}
                placeholder="e.g. Dr. Eleanor Vance"
                className="w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="input-officer-role" className="text-xs font-semibold text-stone-300 block mb-1">
                Official Title / Department Designation *
              </label>
              <input
                id="input-officer-role"
                type="text"
                required
                value={officerRole}
                onChange={e => setOfficerRole(e.target.value)}
                placeholder="e.g. University Registrar & Academic Dean"
                className="w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-officer-email" className="text-xs font-semibold text-stone-300 block mb-1">
                Institutional Domain Email *
              </label>
              <input
                id="input-officer-email"
                type="email"
                required
                value={officerEmail}
                onChange={e => setOfficerEmail(e.target.value)}
                placeholder={`e.g. registrar@${selectedInst.domain}`}
                className="w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="input-auth-key" className="text-xs font-semibold text-stone-300">
                  Institutional Master Signing Key
                </label>
                <button
                  type="button"
                  onClick={() => setPrivateKeyInput(selectedInst.privateKey)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                >
                  Load {selectedInst.code} Key
                </button>
              </div>
              <div className="relative">
                <input
                  id="input-auth-key"
                  type={showKey ? 'text' : 'password'}
                  value={privateKeyInput}
                  onChange={e => setPrivateKeyInput(e.target.value)}
                  placeholder={`Pre-loaded: ${selectedInst.privateKey.slice(0, 16)}...`}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* 2FA / Hardware Token Checkbox */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-stone-200 block">Hardware Security Module (HSM) / FIDO2</span>
                <span className="text-[11px] text-stone-400">Enforces biometric or hardware key protection for signing</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useHardwareToken}
              onChange={e => setUseHardwareToken(e.target.checked)}
              className="w-4 h-4 rounded bg-black/50 border-white/20 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-blue-200" />
              <span>Authenticate & Enter Issuing Terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
