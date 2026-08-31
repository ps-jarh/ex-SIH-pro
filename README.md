# TrustChain Ledger — Decentralized Blockchain Credential Issuance & Verification Platform

> **An enterprise-grade, consortium blockchain network for tamper-proof academic & professional credential issuance, cryptographic ECDSA signature proofs, Merkle tree verification, and real-time fraud detection.**

---

## 🌟 Table of Contents
1. [Overview & Executive Summary](#-overview--executive-summary)
2. [Key Capabilities & Modules](#-key-capabilities--modules)
3. [Technology Stack](#-technology-stack)
4. [System Architecture & Cryptographic Pipeline](#-system-architecture--cryptographic-pipeline)
5. [Data Flow & Block Lifecycle](#-data-flow--block-lifecycle)
6. [Security & Key Management Model](#-security--key-management-model)
7. [Directory Structure](#-directory-structure)
8. [Setup & Local Development](#-setup--local-development)
9. [Verification & Audit Procedures](#-verification--audit-procedures)

---

## 📌 Overview & Executive Summary

Traditional credential verification relies on slow paper registries, vulnerable centralized databases, and error-prone manual cross-checks. **TrustChain Ledger** solves credential forgery by anchoring academic degrees, diplomas, and professional certificates into a **Proof-of-Authority (PoA) Consortium Blockchain**.

Every issued credential is:
- **Mathematically Immutable**: Linked via backward SHA-256 block hashes (`prevHash == hash[n-1]`).
- **Cryptographically Signed**: Authenticated with the issuing university's elliptic curve digital signature algorithm (`ECDSA` / `Secp256k1`).
- **Instantly Verifiable**: Validatable in under 50 milliseconds via file upload, QR code, or ID search without contacting the issuing body.
- **Revocation-Auditable**: Backed by a deterministic blockchain revocation registry for instant deprecation of compromised or revoked awards.

---

## 🚀 Key Capabilities & Modules

### 1. 🔍 Public Verifier Portal (`/verifier`)
- **Multi-Modal Verification**: Verify via raw file upload (SHA-256 byte hashing), drag-and-drop JSON cryptographic proofs, QR code payloads, or Credential ID lookup.
- **Live 4-Stage Cryptographic Matrix**:
  1. **SHA-256 Payload Digest Integrity**: Checks if the canonical payload matches the ledger-mined digest.
  2. **Issuer ECDSA Signature Verification**: Verifies the signature against the institution's public key registry.
  3. **Merkle Tree & Chain Inclusion**: Confirms inclusion in block transaction tree and header hash linkage.
  4. **Dynamic Revocation Status**: Validates that no revocation marker exists on chain for the credential ID.
- **Multi-Format Export**: Download official degrees as styled printable PDFs, ultra-high-resolution PNGs, or raw canonical JSON proofs.

### 2. 🏛️ Institutional Issuance Terminal & Security Enclave (`/issuer`)
- **Registrar Authentication**: Authenticate registrar officers with institutional domain emails, official designations, and hardware tokens (FIDO2 / HSM simulation).
- **Accredited Authority Nodes**: Stanford University (`STAN`), MIT (`MIT`), Oxford (`OXF`), IIT Bombay (`IITB`), and Google Cloud Certification Authority (`GCP`).
- **Interactive Private Key Security Layer**: Prompts for institutional ECDSA private keys before block mining to ensure non-repudiation.
- **Batch Merkle Issuance**: Mint entire graduating classes in a single block transaction tree.
- **On-Chain Revocation Manager**: Deprecate credentials with audit reasons, registrar signatures, and block confirmations.

### 3. 🧪 Interactive Tamper Resistance Lab (`/tamper`)
- **Real-Time Fraud Simulator**: Live-edit recipient names, degree titles, GPAs, or file byte hashes to observe instant cryptographic failure.
- **SHA-256 Avalanche Breakdown**: Visualizes how changing 1 character completely alters the hash cascade and breaks the asymmetric signature equation.
- **Preset Scenarios**: 1-click simulations for *"Falsify GPA to 4.00"*, *"Identity Hijacking"*, *"Degree Upgrade"*, and *"1-Bit File Flip"*.

### 4. ⛓️ Consortium Blockchain Explorer (`/explorer`)
- **Immutable Block Header Audit**: Inspect `index`, `timestamp`, `prevHash`, `hash`, `merkleRoot`, `nonce`, and PoA consensus signatures.
- **Full Ledger Automated Audit**: Validates complete historical continuity across every block and transaction with 1 click.
- **Canonical JSON Inspector**: View and copy deterministic block serialization data.

### 5. 🎓 Recipient & Student Gallery (`/wallet`)
- Search and browse issued verifiable credentials by student name, major, or award type.
- Present certificates with verification seals and export credentials directly to mobile wallets.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description & Purpose |
|---|---|---|
| **Frontend Framework** | **React 18** + **TypeScript** | Strict type safety, functional component architecture, and responsive state synchronization. |
| **Styling & Design** | **Tailwind CSS (v4)** + **Lucide Icons** | Custom *Sophisticated Dark* UI theme (`#0a0a0c` canvas, `#121216` cards, `border-white/10`, responsive 2-line mobile navigation). |
| **Cryptographic Engine** | **WebCrypto API** + **Native SHA-256** | Zero-dependency, browser-native elliptic curve math and cryptographic hashing for maximum execution speed. |
| **Digital Signatures** | **ECDSA / Secp256k1** | Asymmetric institutional key pairs for non-repudiation and unforgeable digital authorization seals. |
| **Merkle Trees** | **Custom Merkle Engine** | Binary Merkle tree hashing and transaction root generation for batch credential blocks. |
| **Document Generation** | **html2canvas** + **jspdf** | Client-side rendering and vector-accurate PDF & PNG credential certificate exports. |
| **QR Code Integration** | **qrcode** | High-density QR code generation storing encoded verification URLs and cryptographic payload summaries. |
| **Animations & Effects**| **canvas-confetti** + **Motion** | Celebratory visual effects upon block mining and fluid state transitions. |
| **Build & Bundling** | **Vite** + **Node.js** | Instant HMR development and optimized production asset compilation. |

---

## 📐 System Architecture & Cryptographic Pipeline

```
                     ┌─────────────────────────────────────────────────────────┐
                     │          ACCREDITED ISSUING INSTITUTION                 │
                     │  (Stanford / MIT / Oxford / IITB / GCP Authority Nodes) │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                   1. Input Credential Metadata
                                   2. Attach Transcript / PDF Hash
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │            CANONICAL JSON SERIALIZATION                 │
                     │         (RFC 8785 Deterministic Key Ordering)           │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │             SHA-256 PAYLOAD HASH GENERATION             │
                     │              Digest: d = SHA256(CanonicalJson)          │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │          INSTITUTIONAL PRIVATE KEY SECURITY LAYER       │
                     │           Signature: S = ECDSA_Sign(PrivKey, d)         │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │         PROOF-OF-AUTHORITY (PoA) BLOCK MINING           │
                     │  - Merkle Root = ComputeMerkleTree([Tx_0, Tx_1, ...])   │
                     │  - PrevHash = Block[N-1].Hash                           │
                     │  - Block Hash = SHA256(Index + Timestamp + MerkleRoot   │
                     │                        + PrevHash + Nonce)              │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │              IMMUTABLE DISTRIBUTED LEDGER               │
                     │          [Genesis] ◄── [Block 1] ◄── [Block 2]          │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
         ┌────────────────────────────────────────┴────────────────────────────────────────┐
         │                                                                                 │
         ▼                                                                                 ▼
┌─────────────────────────────────┐                                       ┌─────────────────────────────────┐
│     PUBLIC VERIFIER PORTAL      │                                       │   TAMPER RESISTANCE LAB         │
│  - Recompute SHA-256 Hash       │                                       │  - Modify payload in real time  │
│  - ECDSA_Verify(PubKey, d, S)   │                                       │  - Observe signature rejection  │
│  - Check Merkle Inclusion Path  │                                       │  - Zero trust mathematical test │
│  - Inspect Revocation Registry  │                                       └─────────────────────────────────┘
└─────────────────────────────────┘
```

---

## 🔄 Data Flow & Block Lifecycle

1. **Payload Canonicalization**:
   Before hashing, JSON keys are sorted deterministically so that whitespace or key ordering never results in differing hashes.
2. **Asymmetric Signing**:
   The calculated payload hash is signed using the institution's 256-bit ECDSA private key.
3. **Merkle Aggregation**:
   In batch issuance, individual transaction hashes form the leaves of a Merkle Tree. The Merkle root is anchored into the block header.
4. **Header Chaining**:
   The block header calculates its own hash using `prevHash`. Any alteration to historical blocks invalidates all subsequent block hashes.
5. **Real-time Zero-Knowledge Verification**:
   The public verifier does not require access to the institution's database; verifying the public key against the mathematical signature and checking the hash chain proves authenticity unconditionally.

---

## 🔐 Security & Key Management Model

- **Asymmetric Cryptography**: Every institutional node has a unique `Secp256k1` key pair. Public keys are registered in the consortium registry; private keys remain strictly with authorized registrars.
- **Strict Key Prompting**: Registrars can mandate private key re-authorization on every single block issuance to prevent unauthorized staff operations.
- **Tamper Evident Bit-Flip Protection**: If an attacker changes even 1 bit in an attached PDF certificate, the embedded SHA-256 file hash fails immediately upon verifier inspection.
- **Audit-Logged Revocations**: Credentials cannot be silently deleted; revocations are permanently appended to the chain with timestamp, reason, and signing officer credentials.

---

## 📁 Directory Structure

```
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Two-line responsive mobile & desktop nav
│   │   ├── VerifierPortal.tsx        # 4-step cryptographic verification engine
│   │   ├── IssuerDashboard.tsx       # Institutional terminal & batch issuer
│   │   ├── InstitutionalSignIn.tsx   # Registrar authentication & authority nodes
│   │   ├── SigningKeyAuthModal.tsx   # Interactive private key security layer
│   │   ├── TamperLab.tsx             # Real-time cryptographic tampering simulator
│   │   ├── BlockchainExplorer.tsx    # Hash chain visualizer & full ledger auditor
│   │   ├── RecipientWallet.tsx       # Credential gallery & certificate browser
│   │   └── CertificateCard.tsx       # High-fidelity certificate renderer & PDF export
│   ├── crypto/
│   │   ├── blockchain.ts             # Core ledger engine, SHA-256, Merkle trees, ECDSA
│   │   └── institutions.ts           # Accredited authority node registry & keys
│   ├── types.ts                      # TypeScript interfaces, payloads, blocks, txs
│   ├── App.tsx                       # Main application state & tab controller
│   ├── main.tsx                      # Vite React entry point
│   └── index.css                     # Global Tailwind CSS configurations
├── index.html                        # Application entry & meta headers
├── metadata.json                     # AI Studio application manifest
├── package.json                      # Project dependencies & scripts
└── vite.config.ts                    # Vite build configuration
```

---

## 💻 Setup & Local Development

### Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd trustchain-ledger

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build

```bash
# Build optimized static distribution
npm run build
```

---

## 🧪 Verification & Audit Procedures

To test and verify the blockchain math locally:
1. Navigate to **Blockchain Explorer** (`/explorer`).
2. Click **"Run Full Ledger Audit"** — the engine verifies every block's `prevHash`, Merkle root, and all institutional ECDSA signatures across the entire chain height.
3. Navigate to **Tamper Lab** (`/tamper`) to test edge cases, altered grades, or modified names against the live mathematical verification pipeline.

---

## 📄 License
Distributed under the **MIT License**. Created for decentralized academic & professional credential integrity.

