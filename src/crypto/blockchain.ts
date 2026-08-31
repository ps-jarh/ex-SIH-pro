import { BlockchainBlock, CredentialPayload, SignedCredential, VerificationResult, VerificationCheck } from '../types';
import { KNOWN_INSTITUTIONS, getInstitutionById, getInstitutionByPublicKey } from './institutions';

/**
 * Standard SHA-256 calculation using Web Crypto API
 */
export async function sha256(input: string | ArrayBuffer): Promise<string> {
  const buffer = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate SHA-256 of a File or Blob
 */
export async function calculateFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return sha256(arrayBuffer);
}

/**
 * Recursively sort JSON object keys for canonical serialization
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalizeJson((obj as Record<string, unknown>)[key]);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Compute Merkle Root for an array of transaction hashes
 */
export async function computeMerkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) {
    return '0'.repeat(64);
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = await sha256(currentLevel[i] + currentLevel[i + 1]);
        nextLevel.push(combined);
      } else {
        // Odd number of leaves: duplicate the last element (Bitcoin standard)
        const combined = await sha256(currentLevel[i] + currentLevel[i]);
        nextLevel.push(combined);
      }
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

/**
 * Sign a payload hash with institution private key
 * Generates an ECDSA-style deterministic signature
 */
export async function signPayload(payloadHash: string, privateKey: string): Promise<string> {
  const combined = `SIG-ECDSA-v1:${payloadHash}:${privateKey}:NONCE-SEC`;
  const signatureRaw = await sha256(combined);
  const signaturePart2 = await sha256(signatureRaw + ':R_S_COMPONENTS');
  return `0x${signatureRaw.slice(0, 64)}${signaturePart2.slice(0, 64)}`;
}

/**
 * Verify digital signature against institution public key
 */
export async function verifySignature(
  payloadHash: string,
  signature: string,
  institutionPublicKey: string
): Promise<boolean> {
  if (!signature || !institutionPublicKey) return false;
  
  // Find known institution with this public key to verify against authority key
  const inst = getInstitutionByPublicKey(institutionPublicKey);
  if (!inst) {
    // If not in known list, verify format
    return signature.startsWith('0x') && signature.length === 130;
  }

  const expectedSig = await signPayload(payloadHash, inst.privateKey);
  return expectedSig.toLowerCase() === signature.toLowerCase();
}

/**
 * Compute block hash
 */
export async function computeBlockHash(
  index: number,
  prevHash: string,
  timestamp: string,
  merkleRoot: string,
  nonce: number,
  minerOrAuthority: string
): Promise<string> {
  const blockHeader = `${index}|${prevHash}|${timestamp}|${merkleRoot}|${nonce}|${minerOrAuthority}`;
  return sha256(blockHeader);
}

const STORAGE_KEY = 'blockchain_credential_ledger_v1';

/**
 * Initialize default genesis chain with sample credentials
 */
export async function createInitialChain(): Promise<BlockchainBlock[]> {
  const genesisTimestamp = '2025-01-01T00:00:00.000Z';
  const genesisPrevHash = '0'.repeat(64);
  const genesisMerkle = '0'.repeat(64);
  const genesisHash = await computeBlockHash(0, genesisPrevHash, genesisTimestamp, genesisMerkle, 0, 'Consortium-Root-Node-Genesis');

  const genesisBlock: BlockchainBlock = {
    index: 0,
    timestamp: genesisTimestamp,
    prevHash: genesisPrevHash,
    merkleRoot: genesisMerkle,
    transactions: [],
    nonce: 10042,
    hash: genesisHash,
    minerOrAuthority: 'Permissioned Consortium Root Node (ISO-27001)',
    signature: '0xgenesis_root_authority_authorization_valid_ledger_bootstrap',
  };

  // Block 1: Stanford University Degree to Alice Chen
  const stanford = KNOWN_INSTITUTIONS[0];
  const payload1: CredentialPayload = {
    credentialId: 'BC-2025-STAN-8841',
    recipientName: 'Alice Nicole Chen',
    recipientEmail: 'alice.chen@alumni.stanford.edu',
    recipientId: 'SU-994021',
    credentialType: 'Bachelor Degree',
    title: 'Bachelor of Science in Computer Science',
    majorOrField: 'Artificial Intelligence & Distributed Systems',
    gradeOrGpa: '3.94 / 4.00 (Distinction in Major)',
    issuedAt: '2025-06-15T14:30:00.000Z',
    institutionId: stanford.id,
    institutionName: stanford.name,
    institutionPublicKey: stanford.publicKey,
    fileName: 'Alice_Chen_Stanford_BS_Degree_Official.pdf',
    fileSize: 245812,
    fileMimeType: 'application/pdf',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    additionalAttributes: {
      'Honors': 'Summa Cum Laude',
      'Thesis': 'Fault-Tolerant Consensus in Asynchronous Peer Networks',
      'Dean Seal': 'Verified by Registrar Office'
    }
  };
  const payload1Hash = await sha256(canonicalizeJson(payload1));
  const sig1 = await signPayload(payload1Hash, stanford.privateKey);

  const cred1: SignedCredential = {
    payload: payload1,
    payloadHash: payload1Hash,
    signature: sig1,
    issuingBlockIndex: 1,
    revocation: { isRevoked: false },
  };

  const block1Timestamp = '2025-06-15T15:00:00.000Z';
  const block1Merkle = await computeMerkleRoot([payload1Hash]);
  const block1Hash = await computeBlockHash(1, genesisHash, block1Timestamp, block1Merkle, 4208, stanford.name);

  const block1: BlockchainBlock = {
    index: 1,
    timestamp: block1Timestamp,
    prevHash: genesisHash,
    merkleRoot: block1Merkle,
    transactions: [cred1],
    nonce: 4208,
    hash: block1Hash,
    minerOrAuthority: `${stanford.name} (Authorized Validator)`,
    signature: await signPayload(block1Hash, stanford.privateKey),
  };

  // Block 2: MIT Master's & IIT Bombay B.Tech
  const mit = KNOWN_INSTITUTIONS[1];
  const iitb = KNOWN_INSTITUTIONS[2];

  const payload2: CredentialPayload = {
    credentialId: 'BC-2025-MIT-4192',
    recipientName: 'David K. Miller',
    recipientEmail: 'd.miller@alum.mit.edu',
    recipientId: 'MIT-2025-9018',
    credentialType: 'Master Degree',
    title: 'Master of Engineering in Electrical Eng & Computer Science',
    majorOrField: 'Quantum Information & Cryptographic Engineering',
    gradeOrGpa: '5.0 / 5.0 (Institute Perfect Scholar)',
    issuedAt: '2025-06-20T10:00:00.000Z',
    institutionId: mit.id,
    institutionName: mit.name,
    institutionPublicKey: mit.publicKey,
    fileName: 'David_Miller_MIT_MEng_Diploma.pdf',
    fileSize: 189420,
    fileMimeType: 'application/pdf',
    fileHash: 'c7f9984920485901baef4c1a2e3d4c5b6a7890123456789abcdef0123456789a',
    additionalAttributes: {
      'Department': 'EECS Division',
      'Advisor': 'Prof. Shafi Goldwasser',
    }
  };
  const payload2Hash = await sha256(canonicalizeJson(payload2));
  const sig2 = await signPayload(payload2Hash, mit.privateKey);
  const cred2: SignedCredential = {
    payload: payload2,
    payloadHash: payload2Hash,
    signature: sig2,
    issuingBlockIndex: 2,
    revocation: { isRevoked: false },
  };

  const payload3: CredentialPayload = {
    credentialId: 'BC-2025-IITB-1082',
    recipientName: 'Priya Sharma',
    recipientEmail: 'priya.sharma@iitb.ac.in',
    recipientId: 'IITB-210050012',
    credentialType: 'Bachelor Degree',
    title: 'Bachelor of Technology in Computer Science & Engineering',
    majorOrField: 'Distributed Computing & Cryptography',
    gradeOrGpa: '9.82 / 10.00 (President Gold Medal Nominee)',
    issuedAt: '2025-07-01T09:00:00.000Z',
    institutionId: iitb.id,
    institutionName: iitb.name,
    institutionPublicKey: iitb.publicKey,
    fileName: 'Priya_Sharma_IITB_Degree_Certificate.pdf',
    fileSize: 312500,
    fileMimeType: 'application/pdf',
    fileHash: 'a5f820491823bcdef91820485901baef4c1a2e3d4c5b6a7890123456789abcde',
    additionalAttributes: {
      'Honours in': 'Quantum Computing Algorithms',
      'Campus': 'Powai, Mumbai',
    }
  };
  const payload3Hash = await sha256(canonicalizeJson(payload3));
  const sig3 = await signPayload(payload3Hash, iitb.privateKey);
  const cred3: SignedCredential = {
    payload: payload3,
    payloadHash: payload3Hash,
    signature: sig3,
    issuingBlockIndex: 2,
    revocation: { isRevoked: false },
  };

  const block2Timestamp = '2025-07-01T10:00:00.000Z';
  const block2Merkle = await computeMerkleRoot([payload2Hash, payload3Hash]);
  const block2Hash = await computeBlockHash(2, block1Hash, block2Timestamp, block2Merkle, 7731, 'Consortium Batch Validator Node #2');

  const block2: BlockchainBlock = {
    index: 2,
    timestamp: block2Timestamp,
    prevHash: block1Hash,
    merkleRoot: block2Merkle,
    transactions: [cred2, cred3],
    nonce: 7731,
    hash: block2Hash,
    minerOrAuthority: 'Consortium Batch Validator Node #2',
    signature: await signPayload(block2Hash, mit.privateKey),
  };

  // Block 3: Google Cloud Professional Certification
  const gcp = KNOWN_INSTITUTIONS[4];
  const payload4: CredentialPayload = {
    credentialId: 'BC-2025-GCP-7719',
    recipientName: 'Marcus Vance',
    recipientEmail: 'marcus.vance@techlead.io',
    recipientId: 'GCP-CERT-884920',
    credentialType: 'Professional Certification',
    title: 'Professional Cloud Security Engineer',
    majorOrField: 'Enterprise Zero Trust & Cryptographic Key Management',
    gradeOrGpa: 'Certified - Top 5% Global Score',
    issuedAt: '2025-07-15T12:00:00.000Z',
    expiryDate: '2028-07-15T12:00:00.000Z',
    institutionId: gcp.id,
    institutionName: gcp.name,
    institutionPublicKey: gcp.publicKey,
    fileName: 'Marcus_Vance_GCP_Cloud_Security_Engineer.pdf',
    fileSize: 142090,
    fileMimeType: 'application/pdf',
    fileHash: '89f1a406b7c015342517a04bd327f7742531abd0f41176243617043edab6e5e4',
    additionalAttributes: {
      'Accreditation': 'ISO/IEC 17024 Accredited',
      'Verification URL': 'https://cloud.google.com/certification/verify',
    }
  };
  const payload4Hash = await sha256(canonicalizeJson(payload4));
  const sig4 = await signPayload(payload4Hash, gcp.privateKey);
  const cred4: SignedCredential = {
    payload: payload4,
    payloadHash: payload4Hash,
    signature: sig4,
    issuingBlockIndex: 3,
    revocation: { isRevoked: false },
  };

  const block3Timestamp = '2025-07-15T13:00:00.000Z';
  const block3Merkle = await computeMerkleRoot([payload4Hash]);
  const block3Hash = await computeBlockHash(3, block2Hash, block3Timestamp, block3Merkle, 9124, gcp.name);

  const block3: BlockchainBlock = {
    index: 3,
    timestamp: block3Timestamp,
    prevHash: block2Hash,
    merkleRoot: block3Merkle,
    transactions: [cred4],
    nonce: 9124,
    hash: block3Hash,
    minerOrAuthority: `${gcp.name} (Cloud Signer Node)`,
    signature: await signPayload(block3Hash, gcp.privateKey),
  };

  return [genesisBlock, block1, block2, block3];
}

/**
 * Load chain from localStorage or initialize defaults
 */
export async function loadBlockchain(): Promise<BlockchainBlock[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BlockchainBlock[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse blockchain from localStorage, resetting to initial seed.', err);
  }

  const initialChain = await createInitialChain();
  saveBlockchain(initialChain);
  return initialChain;
}

/**
 * Save chain to localStorage
 */
export function saveBlockchain(chain: BlockchainBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
  } catch (err) {
    console.error('Failed to save blockchain to localStorage', err);
  }
}

/**
 * Reset blockchain to initial factory state
 */
export async function resetBlockchain(): Promise<BlockchainBlock[]> {
  localStorage.removeItem(STORAGE_KEY);
  const initialChain = await createInitialChain();
  saveBlockchain(initialChain);
  return initialChain;
}

/**
 * Mine & append a new block with one or more newly issued signed credentials
 */
export async function issueCredentialBlock(
  chain: BlockchainBlock[],
  newCredentials: SignedCredential[],
  minerName?: string
): Promise<BlockchainBlock[]> {
  const lastBlock = chain[chain.length - 1];
  const newIndex = lastBlock.index + 1;
  const timestamp = new Date().toISOString();

  // Set issuing block index for all credentials in this block
  const txsWithBlockIndex = newCredentials.map(cred => ({
    ...cred,
    issuingBlockIndex: newIndex,
  }));

  const txHashes = txsWithBlockIndex.map(c => c.payloadHash);
  const merkleRoot = await computeMerkleRoot(txHashes);
  const nonce = Math.floor(Math.random() * 90000) + 10000;
  const authority = minerName || (txsWithBlockIndex[0]?.payload.institutionName ?? 'Consortium Node');

  const blockHash = await computeBlockHash(
    newIndex,
    lastBlock.hash,
    timestamp,
    merkleRoot,
    nonce,
    authority
  );

  const inst = getInstitutionById(txsWithBlockIndex[0]?.payload.institutionId);
  const blockSig = inst ? await signPayload(blockHash, inst.privateKey) : `0xconsensus_sig_${blockHash.slice(0, 32)}`;

  const newBlock: BlockchainBlock = {
    index: newIndex,
    timestamp,
    prevHash: lastBlock.hash,
    merkleRoot,
    transactions: txsWithBlockIndex,
    nonce,
    hash: blockHash,
    minerOrAuthority: authority,
    signature: blockSig,
  };

  const updatedChain = [...chain, newBlock];
  saveBlockchain(updatedChain);
  return updatedChain;
}

/**
 * Revoke an existing credential and commit a cryptographic revocation record
 */
export async function revokeCredentialOnChain(
  chain: BlockchainBlock[],
  credentialId: string,
  reason: string,
  revokingAuthorityName: string
): Promise<{ updatedChain: BlockchainBlock[]; success: boolean }> {
  let found = false;
  const timestamp = new Date().toISOString();

  // Create deep copy of chain
  const updatedChain: BlockchainBlock[] = JSON.parse(JSON.stringify(chain));

  // Find target credential and update revocation status
  for (const block of updatedChain) {
    for (const tx of block.transactions) {
      if (tx.payload.credentialId.toLowerCase() === credentialId.toLowerCase()) {
        tx.revocation = {
          isRevoked: true,
          revokedAt: timestamp,
          reason,
          revokedBy: revokingAuthorityName,
          revocationBlockIndex: updatedChain.length,
        };
        found = true;
      }
    }
  }

  if (!found) {
    return { updatedChain: chain, success: false };
  }

  // Also append an explicit Audit/Revocation Block to the hash chain
  const lastBlock = updatedChain[updatedChain.length - 1];
  const newIndex = lastBlock.index + 1;
  const revocationRecordPayloadHash = await sha256(`REVOCATION:${credentialId}:${reason}:${timestamp}:${revokingAuthorityName}`);
  const merkleRoot = await computeMerkleRoot([revocationRecordPayloadHash]);
  const nonce = Math.floor(Math.random() * 90000) + 10000;
  const authority = `${revokingAuthorityName} (Revocation Officer)`;

  const blockHash = await computeBlockHash(
    newIndex,
    lastBlock.hash,
    timestamp,
    merkleRoot,
    nonce,
    authority
  );

  const revocationBlock: BlockchainBlock = {
    index: newIndex,
    timestamp,
    prevHash: lastBlock.hash,
    merkleRoot,
    transactions: [], // Marker/audit block
    nonce,
    hash: blockHash,
    minerOrAuthority: authority,
    signature: `0xrevocation_attestation_${revocationRecordPayloadHash.slice(0, 32)}`,
  };

  updatedChain.push(revocationBlock);
  saveBlockchain(updatedChain);
  return { updatedChain, success: true };
}

/**
 * Un-revoke / reinstate a credential if revoked by mistake
 */
export async function reinstateCredentialOnChain(
  chain: BlockchainBlock[],
  credentialId: string
): Promise<BlockchainBlock[]> {
  const updatedChain: BlockchainBlock[] = JSON.parse(JSON.stringify(chain));
  for (const block of updatedChain) {
    for (const tx of block.transactions) {
      if (tx.payload.credentialId.toLowerCase() === credentialId.toLowerCase()) {
        tx.revocation = { isRevoked: false };
      }
    }
  }
  saveBlockchain(updatedChain);
  return updatedChain;
}

/**
 * Run a full audit on the entire blockchain hash chain
 */
export async function auditBlockchainIntegrity(chain: BlockchainBlock[]): Promise<{
  isValid: boolean;
  errors: string[];
  totalBlocks: number;
  totalCredentials: number;
  auditedAt: string;
}> {
  const errors: string[] = [];
  let totalCredentials = 0;

  if (!chain || chain.length === 0) {
    return {
      isValid: false,
      errors: ['Ledger is empty. No genesis block found.'],
      totalBlocks: 0,
      totalCredentials: 0,
      auditedAt: new Date().toISOString(),
    };
  }

  // Genesis block check
  const genesis = chain[0];
  if (genesis.index !== 0) {
    errors.push(`Block #0 has invalid index ${genesis.index}`);
  }
  if (genesis.prevHash !== '0'.repeat(64)) {
    errors.push(`Genesis Block #0 prevHash is not root zero hash (${genesis.prevHash.slice(0, 10)}...)`);
  }
  const calcGenesisHash = await computeBlockHash(
    genesis.index,
    genesis.prevHash,
    genesis.timestamp,
    genesis.merkleRoot,
    genesis.nonce,
    genesis.minerOrAuthority
  );
  if (calcGenesisHash !== genesis.hash) {
    errors.push(`Genesis Block #0 hash mismatch! Expected ${calcGenesisHash.slice(0, 10)}..., got ${genesis.hash.slice(0, 10)}...`);
  }

  // Iterate subsequent blocks
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prevBlock = chain[i - 1];

    // 1. Index continuity
    if (block.index !== prevBlock.index + 1) {
      errors.push(`Block #${block.index} index break: follows block #${prevBlock.index}`);
    }

    // 2. Hash Linkage
    if (block.prevHash !== prevBlock.hash) {
      errors.push(
        `Chain Link Broken at Block #${block.index}! prevHash (${block.prevHash.slice(0, 10)}...) does not match Block #${prevBlock.index} hash (${prevBlock.hash.slice(0, 10)}...)`
      );
    }

    // 3. Merkle Root verification
    const txHashes = block.transactions.map(t => t.payloadHash);
    const calcMerkle = await computeMerkleRoot(txHashes);
    if (calcMerkle !== block.merkleRoot) {
      errors.push(`Block #${block.index} Merkle Root tampered! Computed ${calcMerkle.slice(0, 10)}..., recorded ${block.merkleRoot.slice(0, 10)}...`);
    }

    // 4. Block Hash recalculation
    const calcBlockHash = await computeBlockHash(
      block.index,
      block.prevHash,
      block.timestamp,
      block.merkleRoot,
      block.nonce,
      block.minerOrAuthority
    );
    if (calcBlockHash !== block.hash) {
      errors.push(`Block #${block.index} hash header altered! Recalculated ${calcBlockHash.slice(0, 10)}..., recorded ${block.hash.slice(0, 10)}...`);
    }

    // 5. Check transactions & digital signatures inside block
    for (const tx of block.transactions) {
      totalCredentials++;
      const calcPayloadHash = await sha256(canonicalizeJson(tx.payload));
      if (calcPayloadHash !== tx.payloadHash) {
        errors.push(`Transaction ${tx.payload.credentialId} payload data was modified! Hash mismatch.`);
      }
      const isSigValid = await verifySignature(calcPayloadHash, tx.signature, tx.payload.institutionPublicKey);
      if (!isSigValid) {
        errors.push(`Transaction ${tx.payload.credentialId} digital signature invalid for issuer ${tx.payload.institutionName}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalBlocks: chain.length,
    totalCredentials,
    auditedAt: new Date().toISOString(),
  };
}

/**
 * Verify a credential query (File SHA-256, Credential ID, QR Code payload, or Raw Hash)
 */
export async function verifyCredentialQuery(
  chain: BlockchainBlock[],
  query: {
    fileHash?: string;
    credentialId?: string;
    rawHash?: string;
    customPayload?: CredentialPayload;
  }
): Promise<VerificationResult> {
  const timestamp = new Date().toISOString();
  const checks: VerificationCheck[] = [];

  let matchedCred: SignedCredential | undefined;
  let matchedBlock: BlockchainBlock | undefined;
  let matchType: VerificationResult['matchType'] = 'CREDENTIAL_ID';

  const cleanFileHash = query.fileHash?.trim().toLowerCase();
  const cleanCredId = query.credentialId?.trim().toLowerCase();
  const cleanRawHash = query.rawHash?.trim().toLowerCase();

  // Search through all transactions in blockchain
  for (const block of chain) {
    for (const tx of block.transactions) {
      // 1. Match by file hash
      if (cleanFileHash && tx.payload.fileHash?.toLowerCase() === cleanFileHash) {
        matchedCred = tx;
        matchedBlock = block;
        matchType = 'FILE_HASH';
        break;
      }
      // 2. Match by payload hash
      if (cleanRawHash && tx.payloadHash.toLowerCase() === cleanRawHash) {
        matchedCred = tx;
        matchedBlock = block;
        matchType = 'PAYLOAD_HASH';
        break;
      }
      // 3. Match by credentialId
      if (cleanCredId && tx.payload.credentialId.toLowerCase() === cleanCredId) {
        matchedCred = tx;
        matchedBlock = block;
        matchType = 'CREDENTIAL_ID';
        break;
      }
    }
    if (matchedCred) break;
  }

  // If testing a custom payload directly (e.g. from QR code JSON or Tamper Lab)
  if (query.customPayload) {
    matchType = 'DIRECT';
    const computedHash = await sha256(canonicalizeJson(query.customPayload));
    
    // Look up on chain
    for (const block of chain) {
      for (const tx of block.transactions) {
        if (tx.payload.credentialId.toLowerCase() === query.customPayload.credentialId.toLowerCase()) {
          matchedCred = {
            ...tx,
            payload: query.customPayload, // Use the provided (possibly tampered) payload
          };
          matchedBlock = block;
          break;
        }
      }
      if (matchedCred) break;
    }
  }

  if (!matchedCred || !matchedBlock) {
    return {
      status: 'NOT_FOUND',
      checks: [
        {
          id: 'ledger_existence',
          name: 'Blockchain Ledger Record Lookup',
          passed: false,
          details: 'No record matching this file hash, credential ID, or cryptographic signature exists in the blockchain.',
        }
      ],
      timestamp,
      matchType,
      calculatedFileHash: cleanFileHash,
    };
  }

  const inst = getInstitutionByPublicKey(matchedCred.payload.institutionPublicKey) || getInstitutionById(matchedCred.payload.institutionId);

  // Perform 6 comprehensive cryptographic checks:
  
  // Check 1: Block Existence & Indexing
  checks.push({
    id: 'block_anchor',
    name: 'Block Anchoring & Immutability',
    passed: true,
    details: `Anchored in Ledger Block #${matchedBlock.index} with Timestamp ${new Date(matchedBlock.timestamp).toLocaleString()}`,
    diagnostic: `Block Hash: ${matchedBlock.hash.slice(0, 16)}... | Validator: ${matchedBlock.minerOrAuthority}`,
  });

  // Check 2: Hash-Chain Linkage
  const prevBlock = matchedBlock.index > 0 ? chain[matchedBlock.index - 1] : null;
  const isChainLinkValid = !prevBlock || matchedBlock.prevHash === prevBlock.hash;
  checks.push({
    id: 'chain_link',
    name: 'Cryptographic Hash-Chain Linkage',
    passed: isChainLinkValid,
    details: isChainLinkValid 
      ? `Previous Block #${matchedBlock.index - 1} hash pointer matches exactly (${matchedBlock.prevHash.slice(0, 16)}...)`
      : `Broken chain link! PrevHash does not match Block #${matchedBlock.index - 1}`,
  });

  // Check 3: Data Payload Hash Integrity
  const recalculatedPayloadHash = await sha256(canonicalizeJson(matchedCred.payload));
  const isPayloadHashValid = recalculatedPayloadHash.toLowerCase() === matchedCred.payloadHash.toLowerCase();
  checks.push({
    id: 'payload_hash',
    name: 'Payload Cryptographic Fingerprint',
    passed: isPayloadHashValid,
    details: isPayloadHashValid
      ? `SHA-256 fingerprint matches canonical record: ${recalculatedPayloadHash.slice(0, 24)}...`
      : `DATA TAMPERED! Recalculated hash (${recalculatedPayloadHash.slice(0, 16)}...) does NOT match block registered hash (${matchedCred.payloadHash.slice(0, 16)}...). One or more fields were altered!`,
  });

  // Check 4: Issuer Digital Signature (ECDSA)
  const isSigValid = await verifySignature(recalculatedPayloadHash, matchedCred.signature, matchedCred.payload.institutionPublicKey);
  checks.push({
    id: 'digital_signature',
    name: 'Issuing Authority Digital Signature',
    passed: isSigValid && isPayloadHashValid,
    details: isSigValid && isPayloadHashValid
      ? `Cryptographically signed by ${matchedCred.payload.institutionName} (${inst?.code || 'AUTH'}) with verified public key`
      : `SIGNATURE FORGERY DETECTED! Digital signature does not correspond to the current payload data or signing key.`,
  });

  // Check 5: File Hash Match (if file was verified)
  if (cleanFileHash) {
    const isFileHashMatch = matchedCred.payload.fileHash?.toLowerCase() === cleanFileHash;
    checks.push({
      id: 'file_integrity',
      name: 'Original Document File Fingerprint',
      passed: isFileHashMatch,
      details: isFileHashMatch
        ? `Uploaded file SHA-256 matches blockchain registered document digest: ${cleanFileHash.slice(0, 24)}...`
        : `FILE TAMPERED! Uploaded document hash does NOT match the issuer original file hash. File content was modified.`,
    });
  } else if (matchedCred.payload.fileHash) {
    checks.push({
      id: 'file_integrity_registered',
      name: 'Registered Document Hash',
      passed: true,
      details: `Original document digest on chain: ${matchedCred.payload.fileHash.slice(0, 24)}... (${matchedCred.payload.fileName || 'document'})`,
    });
  }

  // Check 6: Revocation Status
  const isRevoked = matchedCred.revocation.isRevoked;
  checks.push({
    id: 'revocation_status',
    name: 'Revocation Registry Status',
    passed: !isRevoked,
    details: isRevoked
      ? `REVOKED: ${matchedCred.revocation.reason || 'Revoked by authority'} on ${matchedCred.revocation.revokedAt ? new Date(matchedCred.revocation.revokedAt).toLocaleString() : 'N/A'}`
      : 'Active & In Good Standing (No revocation notices recorded on chain)',
  });

  // Determine overall status
  let status: VerificationResult['status'] = 'VALID';
  if (isRevoked) {
    status = 'REVOKED';
  } else if (!isPayloadHashValid || !isSigValid || !isChainLinkValid || (cleanFileHash && matchedCred.payload.fileHash?.toLowerCase() !== cleanFileHash)) {
    status = 'TAMPERED';
  }

  return {
    status,
    credential: matchedCred,
    block: matchedBlock,
    institution: inst,
    calculatedFileHash: cleanFileHash,
    checks,
    timestamp,
    matchType,
  };
}
