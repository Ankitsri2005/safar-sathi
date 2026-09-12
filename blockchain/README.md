# 🛡️ Safar Sathi — Blockchain & Immutable Ledger Module

> **Smart Tourist Safety Monitoring System (SIH 2026)**  
> Tamper-Evident Digital Identities • Cryptographic Verification • Section 65B Compliant e-FIR Registry

---

## 🏛️ Architecture Overview: Dual-Layer Hybrid Ledger

To ensure **sub-second real-time response times** during emergency SOS events while preserving **cryptographic immutability and inter-departmental trust**, Safar Sathi employs a **Dual-Layer Hybrid Architecture**:

```
+-------------------------------------------------------------------------+
|                  SAFAR SATHI HYBRID BLOCKCHAIN ARCHITECTURE             |
+-------------------------------------------------------------------------+
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
│       LAYER 2: OPERATIONAL ENGINE    │    │      LAYER 1: SETTLEMENT & AUDIT     │
│       (Real-Time Off-Chain Ledger)   │    │      (Public/Consortium EVM Smart)   │
├──────────────────────────────────────┤    ├──────────────────────────────────────┤
│ • File: backend/src/services/        │    │ • File: blockchain/contracts/        │
│         blockchain.ts                │    │         TouristIdentityLedger.sol    │
│ • Storage: PostgreSQL Hash-Chain     │    │         EFIRAuditRegistry.sol        │
│ • Latency: < 5ms                     │    │ • Consensus: Proof of Authority (PoA)│
│ • Primary: Live Digital ID checks,   │    │ • Primary: e-FIR sealing, judicial   │
│   beacon verification, geofencing.   │    │   evidence, cross-state verification │
└──────────────────────────────────────┘    └──────────────────────────────────────┘
```

---

## 🔒 Privacy & Compliance (DPDP Act 2023)

In accordance with India's **Digital Personal Data Protection (DPDP) Act 2023** and **GDPR**:
- **NO Personally Identifiable Information (PII)** (such as raw Passport number, Aadhaar number, phone number, or photo) is ever anchored directly to the public or consortium blockchain.
- Only salted cryptographic commitments:
  $$\text{DataHash} = \text{SHA-256}(\text{TouristUUID} \parallel \text{KYCPayload} \parallel \text{TripDates} \parallel \text{SecretSalt})$$
- Even if a malicious actor accesses the blockchain ledger, **zero personal data is exposed**.

---

## 📂 Directory Structure

```
blockchain/
├── contracts/
│   ├── TouristIdentityLedger.sol   # Solidity contract for digital ID anchoring & SOS log
│   └── EFIRAuditRegistry.sol       # Section 65B compliant e-FIR immutable sealing
├── scripts/
│   └── deploy.js                   # Network deployment & role assignment script
├── test/
│   └── TouristIdentityLedger.test.js # Smart contract test suite
├── src/
│   ├── standalone_ledger.js        # Zero-dependency terminal verification simulator
│   └── README.md                   # Module notes
├── hardhat.config.js               # Hardhat EVM compilation & network settings
└── README.md                       # Architecture & documentation (this file)
```

---

## ⚡ Live Terminal Verification Simulator

A standalone cryptographic verification simulator is included in this repository. It demonstrates genesis block creation, SHA-256 block linking, and simulated database tamper detection with zero external dependencies.

To run the live simulation:

```bash
node blockchain/src/standalone_ledger.js
```

### Sample Output:
```text
=======================================================
  SAFAR SATHI — BLOCKCHAIN LEDGER VERIFICATION ENGINE  
=======================================================

Genesis Block established with null-parent hash:
   Block #0: 607d24b11c6d1a6779cf3d7aabcc2c25b8c538270eb9beed8d3d17874004978a

Anchoring 3 Tourist Digital Identities onto the Chain...
   Block #1 (Ankit Kumar)      -> Hash: 7964537b7d9deda85520cf45... (Prev: 607d24b11c6d...)
   Block #2 (Rahul Sharma)     -> Hash: da4571ae0ee41b159f7e3012... (Prev: 7964537b7d9d...)
   Block #3 (Priya Sengupta)   -> Hash: 78d33c32bda425165cd3267e... (Prev: da4571ae0ee4...)

Step 1: Cryptographic Chain Verification...
   Result: PASSED (100% Intact)
   Verified Blocks: 4 blocks in sequence

Step 2: Simulating Malicious Database Tampering...
   Attempting unauthorized modification of Tourist #1 record in Postgres...
Step 3: Re-running Verification after attack...
   Tamper Detected: YES - TAMPERING CAUGHT!
   Diagnostic Message: Block #1 hash mismatch! Data has been tampered with.

=======================================================
  LEDGER INTEGRITY PROTOCOL: VERIFIED SECURE           
=======================================================
```

---

## 📜 Smart Contracts Breakdown

### 1. `TouristIdentityLedger.sol`
- **Role-based Permissions**: Allows verified Tourism Authority and Police nodes to register and verify credentials.
- **Tamper-Proof Chaining**: Each issued ID incorporates the previous block hash.
- **Emergency SOS Audit Trail**: Immutably records SOS triggers with fixed-point GPS coordinates for historical analysis and judicial reporting.
- **Automatic Expiry**: Verifies trip expiry epoch timestamps so expired passes cannot be misused.

### 2. `EFIRAuditRegistry.sol`
- **Section 65B Compliance**: Seals the SHA-256 hash of generated e-FIRs alongside the investigating officer's digital signature.
- **Non-Repudiation**: Guarantees that neither police officials nor external actors can alter an FIR post-registration.

---

## 🚀 Production Deployment (Polygon / Hyperledger Fabric)

1. **Polygon Proof of Stake (PoS) / Amoy Testnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network polygonAmoy
   ```
2. **Hyperledger Fabric Option**:
   - For enterprise state-level deployment across Ministry of Tourism, Police Department, and National Informatics Centre (NIC).
