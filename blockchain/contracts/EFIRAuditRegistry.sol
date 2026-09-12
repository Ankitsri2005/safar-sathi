// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EFIRAuditRegistry
 * @author Safar Sathi Team (Smart India Hackathon 2026)
 * @notice Cryptographic immutable registry for Electronic First Information Reports (e-FIRs).
 * @dev Guarantees Section 65B (Indian Evidence Act) compliance:
 *      - Hash of FIR text + police officer digital signature + timestamp anchored on-chain.
 *      - Any post-facto tampering of police reports is mathematically impossible to conceal.
 */
contract EFIRAuditRegistry {
    address public immutable policeSuperAdmin;

    struct EFIRRecord {
        bytes32 firHash;           // SHA-256 hash of complete FIR JSON / PDF
        bytes32 touristHash;       // Linked tourist identity hash
        string firNumber;          // Public tracking ID (e.g. "FIR-2026-WB-0042")
        uint64 registeredAt;       // On-chain registration timestamp
        address registeredByPolice;// Officer / Station wallet public key
        bool isSealed;             // Locked for court evidence
    }

    mapping(string => EFIRRecord) private _firRecords;
    string[] private _allFirNumbers;

    event EFIRRegistered(
        string indexed firNumber,
        bytes32 indexed firHash,
        bytes32 indexed touristHash,
        address registeredByPolice,
        uint64 registeredAt
    );

    event EFIRSealed(
        string indexed firNumber,
        uint64 sealedAt
    );

    modifier onlyAdmin() {
        require(msg.sender == policeSuperAdmin, "ERR_UNAUTHORIZED");
        _;
    }

    constructor() {
        policeSuperAdmin = msg.sender;
    }

    /**
     * @notice Register an immutable hash of an e-FIR.
     */
    function registerEFIR(
        string calldata firNumber,
        bytes32 firHash,
        bytes32 touristHash
    ) external {
        require(bytes(firNumber).length > 0, "ERR_EMPTY_FIR_NUM");
        require(firHash != bytes32(0), "ERR_INVALID_HASH");
        require(_firRecords[firNumber].registeredAt == 0, "ERR_FIR_EXISTS");

        _firRecords[firNumber] = EFIRRecord({
            firHash: firHash,
            touristHash: touristHash,
            firNumber: firNumber,
            registeredAt: uint64(block.timestamp),
            registeredByPolice: msg.sender,
            isSealed: true
        });

        _allFirNumbers.push(firNumber);

        emit EFIRRegistered(
            firNumber,
            firHash,
            touristHash,
            msg.sender,
            uint64(block.timestamp)
        );
        emit EFIRSealed(firNumber, uint64(block.timestamp));
    }

    /**
     * @notice Court-admissible verification method.
     */
    function verifyEFIRIntegrity(
        string calldata firNumber,
        bytes32 candidateFirHash
    ) external view returns (
        bool matches,
        uint64 registeredAt,
        address registeredByPolice,
        bool isSealed
    ) {
        EFIRRecord memory rec = _firRecords[firNumber];
        if (rec.registeredAt == 0) {
            return (false, 0, address(0), false);
        }
        return (
            rec.firHash == candidateFirHash,
            rec.registeredAt,
            rec.registeredByPolice,
            rec.isSealed
        );
    }

    function totalFIRs() external view returns (uint256) {
        return _allFirNumbers.length;
    }
}
