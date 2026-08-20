/**
 * Smart Tourist Safety — Blockchain Module (Standalone Reference).
 *
 * The actual blockchain logic lives in:
 *   backend/src/services/blockchain.ts
 *
 * This folder exists as the dedicated blockchain module area
 * for documentation, tests, and future migration to Hyperledger Fabric.
 *
 * Architecture:
 *   - Custom SHA-256 hash-chain stored in PostgreSQL
 *   - Each block links to the previous via current_block_hash
 *   - Tampering with any old block breaks every hash after it
 *   - Used ONLY for Digital ID integrity, NOT for live location data
 *
 * Upgrade Path:
 *   Option 1 (current): Node.js hash-chain in PostgreSQL
 *   Option 2 (production): Hyperledger Fabric permissioned network
 */
