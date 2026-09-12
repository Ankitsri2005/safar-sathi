// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TouristIdentityLedger
 * @author Safar Sathi Team (Smart Tourist Safety System - SIH 2026)
 * @notice Decentralized, tamper-evident cryptographic registry for tourist digital identities.
 * @dev Designed to adhere to India's DPDP (Digital Personal Data Protection) Act 2023:
 *      Raw PII (Passport/Aadhaar/Phone) is NEVER stored on-chain.
 *      Only SHA-256 salted hashes and verifiable credentials are anchored.
 */
contract TouristIdentityLedger {
    // --- ROLES & ACCESS CONTROL ---
    address public immutable admin;
    mapping(address => bool) public isTourismAuthority;
    mapping(address => bool) public isPoliceAuthority;

    // --- STRUCTS ---
    enum IdStatus { NonExistent, Active, Suspended, Expired, Revoked }

    struct DigitalIdRecord {
        bytes32 dataHash;          // SHA256(tourist_id + KYC_hash + trip_dates + salt)
        bytes32 previousBlockHash; // Chained cryptographic link
        uint64 issuedAt;           // Unix timestamp (seconds)
        uint64 expiresAt;          // Trip conclusion timestamp
        IdStatus status;           // Current status of digital credential
        string issuerNodeId;       // Tourism Dept / State Node ID
    }

    struct EmergencyEvent {
        bytes32 touristHash;
        uint64 timestamp;
        int32 latitudeE6;          // Fixed-point (lat * 1e6) for gas-efficient GPS
        int32 longitudeE6;         // Fixed-point (lng * 1e6)
        string alertType;          // "SOS", "GEOFENCE_BREACH", "HEALTH_ANOMALY"
        bool resolved;
    }

    // --- STORAGE ---
    // touristId (UUID as bytes32 or string hash) => Record
    mapping(bytes32 => DigitalIdRecord) private _records;
    bytes32[] private _allRegisteredTourists;
    bytes32 public latestChainHash;
    uint256 public totalIdentitiesIssued;

    // Emergency audit trail
    mapping(bytes32 => EmergencyEvent[]) private _emergencyAuditTrail;

    // --- EVENTS ---
    event DigitalIdIssued(
        bytes32 indexed touristHash,
        bytes32 indexed dataHash,
        uint64 issuedAt,
        uint64 expiresAt,
        string issuerNodeId
    );

    event DigitalIdStatusUpdated(
        bytes32 indexed touristHash,
        IdStatus newStatus,
        string reason
    );

    event EmergencyAlertLogged(
        bytes32 indexed touristHash,
        string alertType,
        int32 latitudeE6,
        int32 longitudeE6,
        uint64 timestamp
    );

    event AuthorityRoleUpdated(
        address indexed account,
        bool isTourism,
        bool isPolice
    );

    // --- MODIFIERS ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "ERR_UNAUTHORIZED: Admin only");
        _;
    }

    modifier onlyTourismAuthority() {
        require(
            msg.sender == admin || isTourismAuthority[msg.sender],
            "ERR_UNAUTHORIZED: Tourism Authority required"
        );
        _;
    }

    modifier onlyAuthorizedResponder() {
        require(
            msg.sender == admin || isTourismAuthority[msg.sender] || isPoliceAuthority[msg.sender],
            "ERR_UNAUTHORIZED: Law enforcement or Tourism required"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        isTourismAuthority[msg.sender] = true;
        isPoliceAuthority[msg.sender] = true;
        latestChainHash = bytes32(0);
    }

    // --- PERMISSION MANAGEMENT ---
    function setAuthority(
        address account,
        bool tourismRole,
        bool policeRole
    ) external onlyAdmin {
        require(account != address(0), "ERR_INVALID_ADDRESS");
        isTourismAuthority[account] = tourismRole;
        isPoliceAuthority[account] = policeRole;
        emit AuthorityRoleUpdated(account, tourismRole, policeRole);
    }

    // --- CORE IDENTITY MANAGEMENT ---

    /**
     * @notice Registers a new verifiable tourist digital identity block.
     * @param touristHash Keccak256 or SHA256 of the internal tourist UUID
     * @param dataHash SHA256 digest of KYC, itinerary & biometric salt
     * @param expiresAt Epoch timestamp when the tourist trip expires
     * @param issuerNodeId Identifier for the issuing department / portal
     */
    function issueDigitalId(
        bytes32 touristHash,
        bytes32 dataHash,
        uint64 expiresAt,
        string calldata issuerNodeId
    ) external onlyTourismAuthority {
        require(touristHash != bytes32(0), "ERR_INVALID_TOURIST_ID");
        require(dataHash != bytes32(0), "ERR_INVALID_DATA_HASH");
        require(expiresAt > block.timestamp, "ERR_INVALID_EXPIRY: Must be in future");
        require(_records[touristHash].status == IdStatus.NonExistent, "ERR_ALREADY_EXISTS");

        // Form chained block hash
        bytes32 currentBlockHash = keccak256(
            abi.encodePacked(
                latestChainHash,
                touristHash,
                dataHash,
                block.timestamp,
                expiresAt,
                issuerNodeId
            )
        );

        _records[touristHash] = DigitalIdRecord({
            dataHash: dataHash,
            previousBlockHash: latestChainHash,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            status: IdStatus.Active,
            issuerNodeId: issuerNodeId
        });

        latestChainHash = currentBlockHash;
        _allRegisteredTourists.push(touristHash);
        totalIdentitiesIssued++;

        emit DigitalIdIssued(
            touristHash,
            dataHash,
            uint64(block.timestamp),
            expiresAt,
            issuerNodeId
        );
    }

    /**
     * @notice Verifies identity integrity against on-chain proof.
     * @param touristHash Identifier hash of the tourist
     * @param candidateDataHash Recomputed SHA256(data) from off-chain database
     */
    function verifyDigitalId(
        bytes32 touristHash,
        bytes32 candidateDataHash
    ) external view returns (
        bool isValid,
        bool isExpired,
        IdStatus status,
        uint64 issuedAt,
        uint64 expiresAt,
        string memory issuerNodeId
    ) {
        DigitalIdRecord memory rec = _records[touristHash];
        if (rec.status == IdStatus.NonExistent) {
            return (false, false, IdStatus.NonExistent, 0, 0, "");
        }

        bool hashMatch = (rec.dataHash == candidateDataHash);
        bool expired = (block.timestamp > rec.expiresAt);
        bool valid = hashMatch && !expired && (rec.status == IdStatus.Active);

        return (
            valid,
            expired,
            rec.status,
            rec.issuedAt,
            rec.expiresAt,
            rec.issuerNodeId
        );
    }

    /**
     * @notice Revoke or suspend a digital ID (e.g. overstay, investigation, loss of physical RFID/BLE beacon).
     */
    function updateIdStatus(
        bytes32 touristHash,
        IdStatus newStatus,
        string calldata reason
    ) external onlyAuthorizedResponder {
        require(_records[touristHash].status != IdStatus.NonExistent, "ERR_NOT_FOUND");
        _records[touristHash].status = newStatus;
        emit DigitalIdStatusUpdated(touristHash, newStatus, reason);
    }

    // --- EMERGENCY & SOS AUDIT TRAIL ---

    /**
     * @notice Anchors emergency SOS triggers onto immutable ledger for court-admissible audit proof.
     */
    function logEmergencyAlert(
        bytes32 touristHash,
        string calldata alertType,
        int32 latitudeE6,
        int32 longitudeE6
    ) external onlyAuthorizedResponder {
        require(_records[touristHash].status != IdStatus.NonExistent, "ERR_UNKNOWN_TOURIST");

        EmergencyEvent memory evt = EmergencyEvent({
            touristHash: touristHash,
            timestamp: uint64(block.timestamp),
            latitudeE6: latitudeE6,
            longitudeE6: longitudeE6,
            alertType: alertType,
            resolved: false
        });

        _emergencyAuditTrail[touristHash].push(evt);

        emit EmergencyAlertLogged(
            touristHash,
            alertType,
            latitudeE6,
            longitudeE6,
            uint64(block.timestamp)
        );
    }

    function getEmergencyHistory(bytes32 touristHash)
        external
        view
        returns (EmergencyEvent[] memory)
    {
        return _emergencyAuditTrail[touristHash];
    }

    function getRecord(bytes32 touristHash)
        external
        view
        returns (DigitalIdRecord memory)
    {
        return _records[touristHash];
    }
}
