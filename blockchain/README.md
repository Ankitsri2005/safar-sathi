# Blockchain Module — Smart Tourist Safety

## Current Implementation
Custom SHA-256 hash-chain in PostgreSQL (via `backend/src/services/blockchain.ts`).

## Block Structure
```json
{
  "block_id": "UUID",
  "tourist_id": "UUID",
  "data_hash": "SHA256(KYC + itinerary + dates + salt)",
  "issue_timestamp": "ISO date",
  "expiry_timestamp": "ISO date",
  "previous_block_hash": "SHA256 of previous block",
  "current_block_hash": "SHA256 of this block"
}
```

## Verification Process
1. Fetch block by block_id
2. Walk backward to genesis, recomputing each hash
3. Any mismatch = tampering detected
4. Check expiry timestamp against current time

## Production Upgrade (Hyperledger Fabric)
- Permissioned network with Tourism Dept, Police, NIC nodes
- Chaincode in Go/JS: IssueID(), VerifyID(), ExpireID()
- Docker + Fabric CLI tooling required
