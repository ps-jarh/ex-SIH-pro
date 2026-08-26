export interface Institution {
  id: string;
  name: string;
  code: string;
  domain: string;
  logo: string;
  accentColor: string;
  publicKey: string;
  privateKey: string; // In production this would be HSM/KMS; in demo held securely for client-side signing
  jurisdiction: string;
  verifiedStatus: boolean;
}

export type CredentialType = 
  | 'Bachelor Degree' 
  | 'Master Degree' 
  | 'Doctorate' 
  | 'Diploma' 
  | 'Professional Certification' 
  | 'Academic Transcript' 
  | 'Employment Verification';

export interface CredentialPayload {
  credentialId: string; // e.g. "BC-2025-STAN-8841"
  recipientName: string;
  recipientEmail: string;
  recipientId: string; // Student/Employee ID
  credentialType: CredentialType;
  title: string; // e.g. "Bachelor of Science in Computer Science"
  majorOrField: string; // e.g. "Artificial Intelligence & Distributed Systems"
  gradeOrGpa: string; // e.g. "3.92 / 4.00" or "First Class Honours"
  issuedAt: string; // ISO timestamp
  expiryDate?: string;
  institutionId: string;
  institutionName: string;
  institutionPublicKey: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  fileHash?: string; // SHA-256 of uploaded original file/certificate
  additionalAttributes?: Record<string, string>;
}

export interface RevocationRecord {
  isRevoked: boolean;
  revokedAt?: string;
  reason?: string;
  revokedBy?: string;
  revocationBlockIndex?: number;
}

export interface SignedCredential {
  payload: CredentialPayload;
  payloadHash: string; // SHA-256(canonical JSON of payload)
  signature: string; // Hex or base64 digital signature
  issuingBlockIndex: number;
  revocation: RevocationRecord;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  prevHash: string;
  merkleRoot: string;
  transactions: SignedCredential[];
  nonce: number;
  hash: string;
  minerOrAuthority: string;
  signature: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  details: string;
  diagnostic?: string;
}

export interface VerificationResult {
  status: 'VALID' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND';
  credential?: SignedCredential;
  block?: BlockchainBlock;
  institution?: Institution;
  calculatedFileHash?: string;
  checks: VerificationCheck[];
  timestamp: string;
  matchType: 'FILE_HASH' | 'PAYLOAD_HASH' | 'CREDENTIAL_ID' | 'QR_CODE' | 'DIRECT';
}
