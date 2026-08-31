import React, { useState } from 'react';
import { BlockchainBlock, CredentialPayload, CredentialType, Institution, SignedCredential } from '../types';
import { KNOWN_INSTITUTIONS } from '../crypto/institutions';
import {
  calculateFileSha256,
  canonicalizeJson,
  issueCredentialBlock,
  revokeCredentialOnChain,
  reinstateCredentialOnChain,
  sha256,
  signPayload,
} from '../crypto/blockchain';
import { InstitutionalSignIn, IssuerAuthSession } from './InstitutionalSignIn';
import { SigningKeyAuthModal, SigningTargetDetails } from './SigningKeyAuthModal';
import {
  Building2,
  PlusCircle,
  Users,
  FileX2,
  KeyRound,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Hash,
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  Check,
  Copy,
  LogOut,
  LogIn,
  Lock,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IssuerDashboardProps {
  chain: BlockchainBlock[];
  onChainUpdate: (newChain: BlockchainBlock[]) => void;
  onViewCertificate: (cred: SignedCredential) => void;
  onNavigateToVerify: (credId: string) => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({
  chain,
  onChainUpdate,
  onViewCertificate,
  onNavigateToVerify,
}) => {
  // Institutional Authentication Session
  const [authSession, setAuthSession] = useState<IssuerAuthSession>({
    institutionId: KNOWN_INSTITUTIONS[0].id,
    institution: KNOWN_INSTITUTIONS[0],
    officerName: 'Dr. Eleanor Vance',
    officerRole: 'University Registrar & Academic Dean',
    officerEmail: 'registrar@stanford.edu',
    sessionToken: 'AUTH-SESSION-STAN-9021',
    signedInAt: new Date().toISOString(),
    cachedPrivateKey: KNOWN_INSTITUTIONS[0].privateKey,
    hasHardwareToken: true,
  });
  const [showSignInView, setShowSignInView] = useState(false);

  const [selectedInstId, setSelectedInstId] = useState<string>(KNOWN_INSTITUTIONS[0].id);
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch' | 'revocation' | 'keys'>('single');

  // Security layer states
  const [strictKeyPrompt, setStrictKeyPrompt] = useState(true);
  const [signingModal, setSigningModal] = useState<{
    isOpen: boolean;
    targetDetails: SigningTargetDetails;
    onExecute: (privateKey: string) => Promise<void>;
  }>({
    isOpen: false,
    targetDetails: { type: 'single' },
    onExecute: async () => {},
  });

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [credentialType, setCredentialType] = useState<CredentialType>('Bachelor Degree');
  const [title, setTitle] = useState('');
  const [majorOrField, setMajorOrField] = useState('');
  const [gradeOrGpa, setGradeOrGpa] = useState('');
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [customAttrKey, setCustomAttrKey] = useState('');
  const [customAttrValue, setCustomAttrValue] = useState('');
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({
    'Honors': 'Summa Cum Laude',
    'Department Seal': 'Office of Academic Affairs'
  });

  // File states
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    hash: string;
  } | null>(null);
  const [isHashingFile, setIsHashingFile] = useState(false);

  // Status & loading
  const [isMining, setIsMining] = useState(false);
  const [recentlyIssuedCred, setRecentlyIssuedCred] = useState<SignedCredential | null>(null);

  // Revocation Modal states
  const [selectedCredToRevoke, setSelectedCredToRevoke] = useState<SignedCredential | null>(null);
  const [revocationReason, setRevocationReason] = useState('Academic Dishonesty / Honor Code Violation');
  const [revocationOfficer, setRevocationOfficer] = useState('Office of the Registrar & Academic Integrity Board');

  // Copy state
  const [copiedKey, setCopiedKey] = useState(false);

  const selectedInst = KNOWN_INSTITUTIONS.find(i => i.id === selectedInstId) || KNOWN_INSTITUTIONS[0];

  const handleAuthenticated = (session: IssuerAuthSession) => {
    setAuthSession(session);
    setSelectedInstId(session.institutionId);
    setShowSignInView(false);
  };

  const handleInstitutionSwitch = (instId: string) => {
    setSelectedInstId(instId);
    const targetInst = KNOWN_INSTITUTIONS.find(i => i.id === instId) || KNOWN_INSTITUTIONS[0];
    setAuthSession(prev => ({
      ...prev,
      institutionId: targetInst.id,
      institution: targetInst,
      officerEmail: `registrar@${targetInst.domain}`,
      cachedPrivateKey: targetInst.privateKey,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsHashingFile(true);
    try {
      const hash = await calculateFileSha256(file);
      setUploadedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        hash,
      });
    } catch (err) {
      console.error('File hashing error', err);
    } finally {
      setIsHashingFile(false);
    }
  };

  const handleAddAttribute = () => {
    if (!customAttrKey.trim() || !customAttrValue.trim()) return;
    setCustomAttributes(prev => ({
      ...prev,
      [customAttrKey.trim()]: customAttrValue.trim(),
    }));
    setCustomAttrKey('');
    setCustomAttrValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    setCustomAttributes(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleQuickFill = (preset: 'cs_degree' | 'ai_masters' | 'cloud_cert') => {
    if (preset === 'cs_degree') {
      setRecipientName('Jordan Alexander Taylor');
      setRecipientEmail('jordan.taylor@alumni.stanford.edu');
      setRecipientId(`STAN-2025-${Math.floor(1000 + Math.random() * 9000)}`);
      setCredentialType('Bachelor Degree');
      setTitle('Bachelor of Science in Computer Science');
      setMajorOrField('Systems & Autonomous Robotics');
      setGradeOrGpa('3.96 / 4.00 (High Honors)');
      setUploadedFile({
        name: 'Jordan_Taylor_BS_Official_Transcript.pdf',
        size: 340912,
        mimeType: 'application/pdf',
        hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      });
    } else if (preset === 'ai_masters') {
      setRecipientName('Elena Rostova');
      setRecipientEmail('elena.rostova@mit.alum.edu');
      setRecipientId(`MIT-2025-${Math.floor(1000 + Math.random() * 9000)}`);
      setCredentialType('Master Degree');
      setTitle('Master of Science in Artificial Intelligence');
      setMajorOrField('Large Language Models & Neural Computation');
      setGradeOrGpa('4.9 / 5.0 (Dean Graduate Fellow)');
      setUploadedFile({
        name: 'Elena_Rostova_MIT_Master_Diploma.pdf',
        size: 412080,
        mimeType: 'application/pdf',
        hash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      });
    } else {
      setRecipientName('Samuel Osei');
      setRecipientEmail('samuel.osei@cloudinfra.org');
      setRecipientId(`GCP-CERT-${Math.floor(100000 + Math.random() * 900000)}`);
      setCredentialType('Professional Certification');
      setTitle('Professional Cloud DevOps Engineer');
      setMajorOrField('Site Reliability & Kubernetes Security');
      setGradeOrGpa('Passed with Highest Distinction');
      setExpiryDate('2028-12-31');
      setUploadedFile({
        name: 'Samuel_Osei_GCP_Certified_Badge.pdf',
        size: 198340,
        mimeType: 'application/pdf',
        hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      });
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !title || !recipientId) return;

    const credId = `BC-${new Date().getFullYear()}-${selectedInst.code}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload: CredentialPayload = {
      credentialId: credId,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim(),
      recipientId: recipientId.trim(),
      credentialType,
      title: title.trim(),
      majorOrField: majorOrField.trim() || 'General Studies',
      gradeOrGpa: gradeOrGpa.trim(),
      issuedAt: new Date(issuedAt).toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      institutionId: selectedInst.id,
      institutionName: selectedInst.name,
      institutionPublicKey: selectedInst.publicKey,
      fileName: uploadedFile?.name,
      fileSize: uploadedFile?.size,
      fileMimeType: uploadedFile?.mimeType,
      fileHash: uploadedFile?.hash,
      additionalAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
    };

    // Calculate canonical JSON payload hash
    const payloadHash = await sha256(canonicalizeJson(payload));

    // If strict key prompt is active, trigger security layer dialog
    if (strictKeyPrompt) {
      setSigningModal({
        isOpen: true,
        targetDetails: {
          type: 'single',
          recipientName: payload.recipientName,
          credentialTitle: payload.title,
          credentialId: payload.credentialId,
          payloadHash,
        },
        onExecute: async (privateKeyToUse: string) => {
          setIsMining(true);
          try {
            const signature = await signPayload(payloadHash, privateKeyToUse);
            const signedCred: SignedCredential = {
              payload,
              payloadHash,
              signature,
              issuingBlockIndex: chain.length,
              revocation: { isRevoked: false },
            };

            const updatedChain = await issueCredentialBlock(
              chain,
              [signedCred],
              `${selectedInst.name} (${authSession.officerName})`
            );
            onChainUpdate(updatedChain);
            setRecentlyIssuedCred(signedCred);
            setSigningModal(prev => ({ ...prev, isOpen: false }));

            // Trigger celebration
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.5 },
            });
          } finally {
            setIsMining(false);
          }
        },
      });
      return;
    }

    // Direct fast issue with cached key
    setIsMining(true);
    try {
      const privateKeyToUse = authSession.cachedPrivateKey || selectedInst.privateKey;
      const signature = await signPayload(payloadHash, privateKeyToUse);

      const signedCred: SignedCredential = {
        payload,
        payloadHash,
        signature,
        issuingBlockIndex: chain.length,
        revocation: { isRevoked: false },
      };

      const updatedChain = await issueCredentialBlock(
        chain,
        [signedCred],
        `${selectedInst.name} (${authSession.officerName})`
      );
      onChainUpdate(updatedChain);
      setRecentlyIssuedCred(signedCred);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch (err) {
      console.error('Error issuing credential', err);
    } finally {
      setIsMining(false);
    }
  };

  const handleBatchIssue = async () => {
    if (strictKeyPrompt) {
      setSigningModal({
        isOpen: true,
        targetDetails: {
          type: 'batch',
          batchCount: 4,
        },
        onExecute: async (privateKeyToUse: string) => {
          setIsMining(true);
          try {
            const batchStudents = [
              { name: 'Liam Zhang', email: 'liam.z@alum.edu', field: 'Machine Learning', grade: '3.88 / 4.00' },
              { name: 'Maya Patel', email: 'maya.p@alum.edu', field: 'Cybersecurity', grade: '3.92 / 4.00' },
              { name: 'Noah Goldberg', email: 'noah.g@alum.edu', field: 'Distributed Databases', grade: '3.85 / 4.00' },
              { name: 'Sophia Tanaka', email: 'sophia.t@alum.edu', field: 'Computer Vision', grade: '3.98 / 4.00' },
            ];

            const signedCreds: SignedCredential[] = [];

            for (let i = 0; i < batchStudents.length; i++) {
              const student = batchStudents[i];
              const credId = `BC-${new Date().getFullYear()}-${selectedInst.code}-${Math.floor(1000 + Math.random() * 9000)}`;
              const payload: CredentialPayload = {
                credentialId: credId,
                recipientName: student.name,
                recipientEmail: student.email,
                recipientId: `${selectedInst.code}-BATCH-${1000 + i}`,
                credentialType: 'Bachelor Degree',
                title: 'Bachelor of Science in Computer Science & Engineering',
                majorOrField: student.field,
                gradeOrGpa: student.grade,
                issuedAt: new Date().toISOString(),
                institutionId: selectedInst.id,
                institutionName: selectedInst.name,
                institutionPublicKey: selectedInst.publicKey,
                additionalAttributes: {
                  'Class of': '2025',
                  'Batch Issuance': 'Consortium Automated Merkle Batch #42',
                  'Signed By Officer': authSession.officerName,
                }
              };

              const payloadHash = await sha256(canonicalizeJson(payload));
              const signature = await signPayload(payloadHash, privateKeyToUse);

              signedCreds.push({
                payload,
                payloadHash,
                signature,
                issuingBlockIndex: chain.length,
                revocation: { isRevoked: false },
              });
            }

            const updatedChain = await issueCredentialBlock(
              chain,
              signedCreds,
              `${selectedInst.name} (Batch Validator // ${authSession.officerName})`
            );
            onChainUpdate(updatedChain);
            setRecentlyIssuedCred(signedCreds[0]);
            setSigningModal(prev => ({ ...prev, isOpen: false }));

            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 },
            });
          } finally {
            setIsMining(false);
          }
        },
      });
      return;
    }

    setIsMining(true);
    try {
      const privateKeyToUse = authSession.cachedPrivateKey || selectedInst.privateKey;
      const batchStudents = [
        { name: 'Liam Zhang', email: 'liam.z@alum.edu', field: 'Machine Learning', grade: '3.88 / 4.00' },
        { name: 'Maya Patel', email: 'maya.p@alum.edu', field: 'Cybersecurity', grade: '3.92 / 4.00' },
        { name: 'Noah Goldberg', email: 'noah.g@alum.edu', field: 'Distributed Databases', grade: '3.85 / 4.00' },
        { name: 'Sophia Tanaka', email: 'sophia.t@alum.edu', field: 'Computer Vision', grade: '3.98 / 4.00' },
      ];

      const signedCreds: SignedCredential[] = [];

      for (let i = 0; i < batchStudents.length; i++) {
        const student = batchStudents[i];
        const credId = `BC-${new Date().getFullYear()}-${selectedInst.code}-${Math.floor(1000 + Math.random() * 9000)}`;
        const payload: CredentialPayload = {
          credentialId: credId,
          recipientName: student.name,
          recipientEmail: student.email,
          recipientId: `${selectedInst.code}-BATCH-${1000 + i}`,
          credentialType: 'Bachelor Degree',
          title: 'Bachelor of Science in Computer Science & Engineering',
          majorOrField: student.field,
          gradeOrGpa: student.grade,
          issuedAt: new Date().toISOString(),
          institutionId: selectedInst.id,
          institutionName: selectedInst.name,
          institutionPublicKey: selectedInst.publicKey,
          additionalAttributes: {
            'Class of': '2025',
            'Batch Issuance': 'Consortium Automated Merkle Batch #42'
          }
        };

        const payloadHash = await sha256(canonicalizeJson(payload));
        const signature = await signPayload(payloadHash, privateKeyToUse);

        signedCreds.push({
          payload,
          payloadHash,
          signature,
          issuingBlockIndex: chain.length,
          revocation: { isRevoked: false },
        });
      }

      const updatedChain = await issueCredentialBlock(
        chain,
        signedCreds,
        `${selectedInst.name} (High-Throughput Batch Validator)`
      );
      onChainUpdate(updatedChain);
      setRecentlyIssuedCred(signedCreds[0]);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (err) {
      console.error('Batch issue error', err);
    } finally {
      setIsMining(false);
    }
  };

  const handleExecuteRevocation = async () => {
    if (!selectedCredToRevoke) return;

    if (strictKeyPrompt) {
      const targetCred = selectedCredToRevoke;
      setSigningModal({
        isOpen: true,
        targetDetails: {
          type: 'revocation',
          credentialId: targetCred.payload.credentialId,
          revocationReason,
        },
        onExecute: async () => {
          setIsMining(true);
          try {
            const { updatedChain, success } = await revokeCredentialOnChain(
              chain,
              targetCred.payload.credentialId,
              revocationReason,
              `${revocationOfficer} [Signed by ${authSession.officerName}]`
            );
            if (success) {
              onChainUpdate(updatedChain);
              setSelectedCredToRevoke(null);
              setSigningModal(prev => ({ ...prev, isOpen: false }));
            }
          } finally {
            setIsMining(false);
          }
        },
      });
      return;
    }

    setIsMining(true);
    try {
      const { updatedChain, success } = await revokeCredentialOnChain(
        chain,
        selectedCredToRevoke.payload.credentialId,
        revocationReason,
        `${revocationOfficer} [Signed by ${authSession.officerName}]`
      );
      if (success) {
        onChainUpdate(updatedChain);
        setSelectedCredToRevoke(null);
      }
    } catch (err) {
      console.error('Revocation error', err);
    } finally {
      setIsMining(false);
    }
  };

  const handleReinstate = async (credentialId: string) => {
    setIsMining(true);
    try {
      const updated = await reinstateCredentialOnChain(chain, credentialId);
      onChainUpdate(updated);
    } catch (err) {
      console.error('Reinstate error', err);
    } finally {
      setIsMining(false);
    }
  };

  const allCredentials: SignedCredential[] = chain.flatMap(b => b.transactions);

  if (showSignInView) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-stone-300 text-xs">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Institutional Sign-In Portal</span>
          </div>
          <button
            onClick={() => setShowSignInView(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-semibold transition-colors"
          >
            ← Return to Dashboard
          </button>
        </div>
        <InstitutionalSignIn
          onAuthenticate={handleAuthenticated}
          selectedInstitutionId={selectedInstId}
        />
      </div>
    );
  }

  return (
    <div id="issuer-dashboard" className="max-w-5xl mx-auto space-y-8">
      {/* Top Header & Institution Switcher */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-500/20 mb-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Accredited Issuing Authority Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-widest uppercase">
              Institutional Credential <span className="font-bold text-blue-500">Engine</span>
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Issue tamper-proof degrees, bind original documents via SHA-256, and anchor cryptographic proofs onto the hash-chain.
            </p>
          </div>

          {/* Officer Identity & Institution Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
              <span className="text-2xl">{selectedInst.logo}</span>
              <div className="text-left">
                <label htmlFor="select-institution" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Active Authority Node
                </label>
                <select
                  id="select-institution"
                  value={selectedInstId}
                  onChange={e => handleInstitutionSwitch(e.target.value)}
                  aria-label="Active Issuing Authority"
                  className="font-bold text-white text-sm bg-transparent border-none focus:outline-hidden cursor-pointer [&>option]:bg-stone-900 [&>option]:text-white"
                >
                  {KNOWN_INSTITUTIONS.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowSignInView(true)}
              className="px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
              title="Change registrar credentials or sign in with another institutional officer"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Sign In / Officer Profile</span>
            </button>
          </div>
        </div>

        {/* Authenticated Officer Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/30 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-stone-300">
              Authenticated Registrar: <strong className="text-white">{authSession.officerName}</strong> ({authSession.officerRole})
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-400 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Layer: {strictKeyPrompt ? 'Strict Key Check Active' : 'Session Cached'}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-stone-400">{authSession.officerEmail}</span>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            id="subtab-single"
            onClick={() => {
              setActiveSubTab('single');
              setRecentlyIssuedCred(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'single'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>Issue Single Credential</span>
          </button>
          <button
            id="subtab-batch"
            onClick={() => {
              setActiveSubTab('batch');
              setRecentlyIssuedCred(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'batch'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Batch Merkle Issuance</span>
          </button>
          <button
            id="subtab-revocation"
            onClick={() => {
              setActiveSubTab('revocation');
              setRecentlyIssuedCred(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'revocation'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <FileX2 className="w-4 h-4 text-amber-400" />
            <span>Revocation Registry ({allCredentials.filter(c => c.revocation.isRevoked).length} Revoked)</span>
          </button>
          <button
            id="subtab-keys"
            onClick={() => setActiveSubTab('keys')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'keys'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Keys & Authority</span>
          </button>
        </div>
      </div>

      {/* Success Notification Bar */}
      {recentlyIssuedCred && (
        <div
          id="recently-issued-banner"
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 p-5 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded uppercase">
                Mined into Block #{recentlyIssuedCred.issuingBlockIndex}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Credential {recentlyIssuedCred.payload.credentialId} Successfully Anchored!
              </h3>
              <p className="text-xs text-emerald-200">
                Awarded to {recentlyIssuedCred.payload.recipientName} with SHA-256 payload digest and ECDSA digital signature.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onViewCertificate(recentlyIssuedCred)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/30"
            >
              View Certificate Card
            </button>
            <button
              onClick={() => onNavigateToVerify(recentlyIssuedCred.payload.credentialId)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors"
            >
              Test Public Verification
            </button>
          </div>
        </div>
      )}

      {/* SubTab 1: Single Credential Form */}
      {activeSubTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base uppercase tracking-[0.2em] font-semibold text-white border-l-2 border-blue-500 pl-3">
                  Issue New Verifiable Credential
                </h3>
                <p className="text-xs text-stone-400 mt-1 pl-3">
                  Fill in academic / professional details and bind the original PDF/certificate hash.
                </p>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-stone-500 font-medium mr-1 uppercase">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cs_degree')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded text-[11px] font-mono border border-white/10 transition-colors"
                >
                  BS CS
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('ai_masters')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded text-[11px] font-mono border border-white/10 transition-colors"
                >
                  MS AI
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cloud_cert')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded text-[11px] font-mono border border-white/10 transition-colors"
                >
                  Cloud Cert
                </button>
              </div>
            </div>

            <form onSubmit={handleIssueCredential} className="space-y-4">
              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-recipient-name" className="text-xs font-semibold text-stone-300 block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    id="input-recipient-name"
                    type="text"
                    required
                    placeholder="e.g. Jordan Alexander Taylor"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-recipient-id" className="text-xs font-semibold text-stone-300 block mb-1">
                    Recipient Student / Employee ID *
                  </label>
                  <input
                    id="input-recipient-id"
                    type="text"
                    required
                    placeholder="e.g. SU-994021"
                    value={recipientId}
                    onChange={e => setRecipientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="input-recipient-email" className="text-xs font-semibold text-stone-300 block mb-1">
                  Recipient Email (for verifiable claims)
                </label>
                <input
                  id="input-recipient-email"
                  type="email"
                  placeholder="e.g. jordan.taylor@alumni.stanford.edu"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Award / Degree Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="select-cred-type" className="text-xs font-semibold text-stone-300 block mb-1">
                    Credential Type
                  </label>
                  <select
                    id="select-cred-type"
                    value={credentialType}
                    onChange={e => setCredentialType(e.target.value as CredentialType)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-hidden [&>option]:bg-stone-900"
                  >
                    <option value="Bachelor Degree">Bachelor Degree</option>
                    <option value="Master Degree">Master Degree</option>
                    <option value="Doctorate">Doctorate (Ph.D.)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Professional Certification">Professional Certification</option>
                    <option value="Academic Transcript">Academic Transcript</option>
                    <option value="Employment Verification">Employment Verification</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="input-cred-title" className="text-xs font-semibold text-stone-300 block mb-1">
                    Conferred Title / Degree *
                  </label>
                  <input
                    id="input-cred-title"
                    type="text"
                    required
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-major-field" className="text-xs font-semibold text-stone-300 block mb-1">
                    Major / Specialization
                  </label>
                  <input
                    id="input-major-field"
                    type="text"
                    placeholder="e.g. Systems & Autonomous Robotics"
                    value={majorOrField}
                    onChange={e => setMajorOrField(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-grade-gpa" className="text-xs font-semibold text-stone-300 block mb-1">
                    Grade / GPA / Honors
                  </label>
                  <input
                    id="input-grade-gpa"
                    type="text"
                    placeholder="e.g. 3.96 / 4.00 (High Honors)"
                    value={gradeOrGpa}
                    onChange={e => setGradeOrGpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-issued-date" className="text-xs font-semibold text-stone-300 block mb-1">
                    Issuance Date
                  </label>
                  <input
                    id="input-issued-date"
                    type="date"
                    value={issuedAt}
                    onChange={e => setIssuedAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-expiry-date" className="text-xs font-semibold text-stone-300 block mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    id="input-expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Upload Original File / PDF to compute SHA-256 */}
              <div className="border border-white/10 rounded-xl p-4 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-blue-400" /> Original Certificate File Attachment
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Calculates client-side SHA-256 hash. Enables verifiers to drag-drop the PDF later to confirm authenticity.
                    </p>
                  </div>
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-stone-400 hover:text-rose-400 text-xs"
                    >
                      Clear File
                    </button>
                  )}
                </div>

                {!uploadedFile ? (
                  <label
                    htmlFor="input-file-issuer"
                    className="block border border-dashed border-white/20 hover:border-blue-500 rounded-lg p-3 text-center cursor-pointer bg-white/[0.02] hover:bg-blue-500/[0.03] transition-colors"
                  >
                    <input
                      id="input-file-issuer"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <span className="text-xs font-medium text-stone-300">
                      {isHashingFile ? 'Computing cryptographic SHA-256...' : 'Click to attach original PDF / document'}
                    </span>
                  </label>
                ) : (
                  <div className="bg-black/60 rounded-lg p-3 border border-white/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span className="truncate">{uploadedFile.name}</span>
                      <span className="text-stone-400 text-[11px]">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="text-[11px] font-mono text-blue-400 bg-blue-500/10 p-1.5 rounded break-all border border-blue-500/20">
                      SHA-256: {uploadedFile.hash}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Attributes */}
              <div className="border border-white/10 rounded-xl p-4 bg-black/40 space-y-2.5">
                <span className="font-semibold text-xs text-white block uppercase tracking-wider text-[11px]">
                  Additional Institutional Claims / Attributes
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(customAttributes).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-stone-200 font-medium"
                    >
                      <span>{k}: <strong className="text-white">{v}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(k)}
                        className="text-stone-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. Dean Seal)"
                    value={customAttrKey}
                    onChange={e => setCustomAttrKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Approved by Registrar)"
                    value={customAttrValue}
                    onChange={e => setCustomAttrValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-stone-600 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-issue-credential"
                type="submit"
                disabled={isMining || !recipientName || !title || !recipientId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isMining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                    <span>Mining Block #{chain.length} with ECDSA Signature...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-200" />
                    <span>Sign with {selectedInst.code} Private Key & Anchor to Blockchain</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Cryptographic Preview (1 col) */}
          <div className="space-y-4">
            <div className="bg-black/60 text-stone-100 rounded-xl p-5 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Hash className="w-4 h-4" /> Cryptographic Signer Engine
                </span>
                <span className="text-[10px] font-mono text-stone-500">ECDSA secp256k1</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 block text-[11px]">Authorized Signer Node:</span>
                  <span className="font-semibold text-white">{selectedInst.name}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Signing Key Fingerprint:</span>
                  <span className="font-mono text-[10px] text-amber-300 break-all">
                    {selectedInst.publicKey.slice(0, 32)}...
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Target Ledger Block:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Block #{chain.length} (Next Height)
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Previous Block Hash Link:</span>
                  <span className="font-mono text-[10px] text-stone-400 break-all">
                    {chain[chain.length - 1]?.hash.slice(0, 32)}...
                  </span>
                </div>
              </div>

              <div className="bg-black/80 rounded-lg p-3 border border-white/10 font-mono text-[11px] text-stone-300 space-y-1">
                <div className="text-blue-400 text-[10px] uppercase font-bold tracking-wider">Live Immutability Guarantee</div>
                <p className="text-[11px] leading-relaxed text-stone-400 font-sans">
                  Any future modification to the student's name, grade, or document will break the mathematical signature validation and hash-chain pointers instantly.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-3 text-xs shadow-xl">
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">Ledger Metrics</h4>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-stone-400">Total Blocks Mined:</span>
                <span className="font-bold font-mono text-white">{chain.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-stone-400">Total Valid Credentials:</span>
                <span className="font-bold font-mono text-emerald-400">{allCredentials.filter(c => !c.revocation.isRevoked).length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-400">Revocation Rate:</span>
                <span className="font-bold font-mono text-amber-400">
                  {allCredentials.length > 0 ? ((allCredentials.filter(c => c.revocation.isRevoked).length / allCredentials.length) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Batch Merkle Issuance */}
      {activeSubTab === 'batch' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base uppercase tracking-[0.2em] font-semibold text-white border-l-2 border-blue-500 pl-3">
                Batch Credential Issuance (Class of 2025)
              </h3>
              <p className="text-xs text-stone-400 mt-1 pl-3">
                Aggregate multiple student graduation records into a single high-throughput Merkle Tree block.
              </p>
            </div>
            <button
              id="btn-execute-batch"
              onClick={handleBatchIssue}
              disabled={isMining}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/30 inline-flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isMining ? <RefreshCw className="w-4 h-4 animate-spin text-blue-200" /> : <Sparkles className="w-4 h-4 text-blue-200" />}
              <span>Issue Class of 2025 Batch (4 Students)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Liam Zhang', email: 'liam.z@alum.edu', field: 'Machine Learning', grade: '3.88 / 4.00' },
              { name: 'Maya Patel', email: 'maya.p@alum.edu', field: 'Cybersecurity', grade: '3.92 / 4.00' },
              { name: 'Noah Goldberg', email: 'noah.g@alum.edu', field: 'Distributed Databases', grade: '3.85 / 4.00' },
              { name: 'Sophia Tanaka', email: 'sophia.t@alum.edu', field: 'Computer Vision', grade: '3.98 / 4.00' },
            ].map((st, i) => (
              <div key={st.name} className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{st.name}</span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-stone-300">
                    Leaf #{i + 1}
                  </span>
                </div>
                <p className="text-xs text-stone-300">{st.field} • Grade: {st.grade}</p>
                <p className="text-[11px] text-stone-500 font-mono">{st.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: Revocation Registry */}
      {activeSubTab === 'revocation' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base uppercase tracking-[0.2em] font-semibold text-white border-l-2 border-blue-500 pl-3">
                Cryptographic Revocation Registry
              </h3>
              <p className="text-xs text-stone-400 mt-1 pl-3">
                Invalidate credentials on the blockchain ledger with an auditable cryptographic revocation notice.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-stone-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Credential ID</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Award / Title</th>
                  <th className="p-3">Issuer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {allCredentials.map(cred => (
                  <tr key={cred.payload.credentialId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono font-medium text-blue-400">
                      {cred.payload.credentialId}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {cred.payload.recipientName}
                    </td>
                    <td className="p-3 text-stone-300 truncate max-w-[200px]">
                      {cred.payload.title}
                    </td>
                    <td className="p-3 text-stone-400">
                      {cred.payload.institutionName}
                    </td>
                    <td className="p-3">
                      {cred.revocation.isRevoked ? (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                          REVOKED ({cred.revocation.reason?.slice(0, 18)}...)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {cred.revocation.isRevoked ? (
                        <button
                          onClick={() => handleReinstate(cred.payload.credentialId)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-semibold text-[11px] transition-colors"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedCredToRevoke(cred)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-semibold text-[11px] transition-colors"
                        >
                          Revoke Credential
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revocation Confirm Modal */}
          {selectedCredToRevoke && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#121216] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Revoke Credential {selectedCredToRevoke.payload.credentialId}?
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      This will append an immutable Revocation Block to the blockchain and mark the degree as invalid for public verifiers.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-stone-300 block mb-1">Revocation Reason</label>
                    <select
                      value={revocationReason}
                      onChange={e => setRevocationReason(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-white [&>option]:bg-stone-900"
                    >
                      <option value="Academic Dishonesty / Honor Code Violation">
                        Academic Dishonesty / Honor Code Violation
                      </option>
                      <option value="Administrative Error / Incorrect Degree Confirmed">
                        Administrative Error / Incorrect Degree Confirmed
                      </option>
                      <option value="Degree Superseded by Updated Transcript">
                        Degree Superseded by Updated Transcript
                      </option>
                      <option value="Fraudulent Enrollment / Impersonation">
                        Fraudulent Enrollment / Impersonation
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-stone-300 block mb-1">Revoking Authority / Officer</label>
                    <input
                      type="text"
                      value={revocationOfficer}
                      onChange={e => setRevocationOfficer(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedCredToRevoke(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteRevocation}
                    disabled={isMining}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-900/30 transition-colors"
                  >
                    {isMining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileX2 className="w-3.5 h-3.5" />}
                    <span>Confirm & Commit Revocation Block</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 4: Cryptographic Keys */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6">
          {/* Security Layer & Policy Configuration Card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Consortium Key Custody & Issuance Policy</h3>
                  <p className="text-xs text-stone-400">Enforce signature security checks on all issuance and revocation requests</p>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> WebCrypto Standard Enclave Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-400" /> Strict Private Key Prompting
                  </span>
                  <input
                    type="checkbox"
                    id="toggle-strict-key-prompt"
                    checked={strictKeyPrompt}
                    onChange={e => setStrictKeyPrompt(e.target.checked)}
                    className="w-4 h-4 rounded bg-black border-white/20 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  When enabled, pressing <strong className="text-white">Issue Credential</strong>, <strong className="text-white">Batch Issue</strong>, or <strong className="text-white">Revoke</strong> opens an interactive security modal requesting the institutional ECDSA private key before block mining.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" /> Active Session State
                  </span>
                  <button
                    onClick={() => setShowSignInView(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline"
                  >
                    Switch Officer
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-stone-300">
                  <div>Officer: <span className="text-white font-sans font-semibold">{authSession.officerName}</span></div>
                  <div>Role: <span className="text-stone-400 font-sans">{authSession.officerRole}</span></div>
                  <div>Node: <span className="text-blue-400">{selectedInst.name} ({selectedInst.code})</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Cryptographic Registry */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base uppercase tracking-[0.2em] font-semibold text-white border-l-2 border-blue-500 pl-3">
                Institutional Cryptographic Registry
              </h3>
              <p className="text-xs text-stone-400 mt-1 pl-3">
                Public keys published by authorized institutions for open verification across consortium networks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KNOWN_INSTITUTIONS.map(inst => (
                <div
                  key={inst.id}
                  className={`p-5 rounded-xl border transition-all ${
                    inst.id === selectedInst.id
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/10 bg-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{inst.logo}</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                        <span className="text-xs text-stone-400 font-mono">{inst.domain}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                      AUTHORITY
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">Public Key (Secp256k1)</span>
                      <div className="bg-black/60 text-blue-400 p-2 rounded-lg font-mono text-[10px] break-all select-all flex items-center justify-between gap-1 border border-white/10">
                        <span>{inst.publicKey}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inst.publicKey);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          className="p-1 text-stone-400 hover:text-white shrink-0"
                          title="Copy Public Key"
                        >
                          {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400 pt-1">
                      <span>Jurisdiction:</span>
                      <span className="font-semibold text-stone-200">{inst.jurisdiction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Layer Modal (Private Key Entry & Signing) */}
      <SigningKeyAuthModal
        isOpen={signingModal.isOpen}
        institution={selectedInst}
        targetDetails={signingModal.targetDetails}
        targetBlockHeight={chain.length}
        cachedKey={authSession.cachedPrivateKey}
        onConfirm={async (enteredKey, rememberSession) => {
          if (rememberSession) {
            setAuthSession(prev => ({
              ...prev,
              cachedPrivateKey: enteredKey,
            }));
          }
          await signingModal.onExecute(enteredKey);
        }}
        onCancel={() => setSigningModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
