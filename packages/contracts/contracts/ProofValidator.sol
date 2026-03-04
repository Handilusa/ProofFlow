// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProofValidator — Autonomous Agent Bounty Board
 * @notice Users deposit HBAR to request an AI audit. An authorized Agent
 *         processes the request off-chain (HCS reasoning chain) and submits
 *         the result hash back here to claim the bounty.
 *
 *  Flow:  User → requestAudit() → Agent listens → Agent works (HCS) →
 *         Agent → submitResult() → Contract settles HBAR → HTS token minted
 */
contract ProofValidator {

    // ──────────────────── State ────────────────────

    address public owner;
    address public authorizedAgent;
    uint256 public minimumFee;
    uint256 public nextRequestId;

    enum RequestStatus { Pending, Completed, Cancelled }

    struct AuditRequest {
        uint256 id;
        address requester;
        string  prompt;
        uint256 deposit;
        uint256 createdAt;
        RequestStatus status;
        bytes32 resultHash;
        uint256 completedAt;
    }

    // Legacy proof registry (backward compatible)
    struct Proof {
        address submitter;
        string  taskId;
        bytes32 resultHash;
        uint256 timestamp;
        bool    validated;
    }

    mapping(uint256 => AuditRequest) public auditRequests;
    mapping(bytes32 => Proof) public proofs;
    mapping(address => uint256) public userValidationCount;
    mapping(address => uint256) public userAuditCount;

    // ──────────────────── Events ────────────────────

    event AuditRequested(
        uint256 indexed requestId,
        address indexed requester,
        string  prompt,
        uint256 deposit
    );

    event AuditCompleted(
        uint256 indexed requestId,
        address indexed requester,
        bytes32 resultHash,
        uint256 payout
    );

    event AuditCancelled(uint256 indexed requestId, address indexed requester);

    // Legacy events (backward compatible)
    event ProofRegistered(bytes32 indexed proofId, address submitter, string taskId);
    event ProofValidated(bytes32 indexed proofId);

    // ──────────────────── Modifiers ────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == authorizedAgent, "Not authorized agent");
        _;
    }

    // ──────────────────── Constructor ────────────────────

    constructor(address _agent, uint256 _minimumFee) {
        owner = msg.sender;
        authorizedAgent = _agent;
        minimumFee = _minimumFee;
        nextRequestId = 1;
    }

    // ──────────────────── User Functions ────────────────────

    /**
     * @notice User deposits HBAR and requests an AI audit.
     *         The deposit is held in escrow until the Agent delivers.
     * @param prompt The question / analysis request for the AI Agent.
     */
    function requestAudit(string calldata prompt) external payable returns (uint256) {
        // Disabled strict minimumFee check to prevent Hedera RPC gas estimation 
        // from reverting when wallets (OKX/MetaMask) drop the msg.value during simulation.
        require(bytes(prompt).length > 0, "Empty prompt");

        uint256 reqId = nextRequestId++;

        auditRequests[reqId] = AuditRequest({
            id: reqId,
            requester: msg.sender,
            prompt: prompt,
            deposit: msg.value,
            createdAt: block.timestamp,
            status: RequestStatus.Pending,
            resultHash: bytes32(0),
            completedAt: 0
        });

        userAuditCount[msg.sender]++;

        emit AuditRequested(reqId, msg.sender, prompt, msg.value);
        return reqId;
    }

    /**
     * @notice User can cancel a pending request and get a refund.
     */
    function cancelAudit(uint256 requestId) external {
        AuditRequest storage req = auditRequests[requestId];
        require(req.requester == msg.sender, "Not your request");
        require(req.status == RequestStatus.Pending, "Not pending");

        req.status = RequestStatus.Cancelled;

        // Refund user
        (bool sent, ) = payable(msg.sender).call{value: req.deposit}("");
        require(sent, "Refund failed");

        emit AuditCancelled(requestId, msg.sender);
    }

    // ──────────────────── Agent Functions ────────────────────

    /**
     * @notice The authorized Agent submits the result hash after completing
     *         the HCS reasoning chain. The escrowed HBAR is released to the Agent.
     * @param requestId ID of the audit request.
     * @param resultHash Keccak256 hash of the final AI reasoning output.
     */
    function submitResult(uint256 reqId, bytes32 rootHash) external onlyAgent {
        AuditRequest storage request = auditRequests[reqId];
        require(request.status == RequestStatus.Pending, "Not pending");
        require(request.completedAt == 0, "Already completed");

        request.status = RequestStatus.Completed;
        request.resultHash = rootHash;
        request.completedAt = block.timestamp;

        userValidationCount[request.requester]++;

        uint256 fee = request.deposit;
        request.deposit = 0;

        (bool success, ) = payable(authorizedAgent).call{value: fee}("");
        require(success, "Transfer to Agent failed");

        emit AuditCompleted(reqId, request.requester, rootHash, fee);
    }

    /**
     * @notice Allows the backend operator to directly record an audit on the EVM 
     *         (bypassing wallet estimation bugs for Hackathon demos)
     * @param prompt The original question/prompt.
     * @param rootHash The final HCS root hash generated by the AI agent.
     * @param requester The native user address.
     */
    function recordAudit(string calldata prompt, bytes32 rootHash, address requester) external onlyAgent returns (uint256) {
        uint256 reqId = nextRequestId++;

        auditRequests[reqId] = AuditRequest({
            id: reqId,
            requester: requester,
            prompt: prompt,
            deposit: 0,
            createdAt: block.timestamp,
            status: RequestStatus.Completed,
            resultHash: rootHash,
            completedAt: block.timestamp
        });

        userAuditCount[requester]++;
        userValidationCount[requester]++;

        emit AuditRequested(reqId, requester, prompt, 0);
        emit AuditCompleted(reqId, requester, rootHash, 0);

        return reqId;
    }

    // ──────────────────── Legacy Functions (backward compatible) ────────────────────

    function registerProof(string memory taskId, bytes32 resultHash) public returns (bytes32) {
        bytes32 proofId = keccak256(abi.encodePacked(msg.sender, taskId, resultHash, block.timestamp));

        proofs[proofId] = Proof({
            submitter: msg.sender,
            taskId: taskId,
            resultHash: resultHash,
            timestamp: block.timestamp,
            validated: false
        });

        emit ProofRegistered(proofId, msg.sender, taskId);
        return proofId;
    }

    function validateProof(bytes32 proofId) public {
        require(!proofs[proofId].validated, "Already validated");
        require(proofs[proofId].timestamp != 0, "Proof does not exist");

        proofs[proofId].validated = true;
        userValidationCount[proofs[proofId].submitter] += 1;

        emit ProofValidated(proofId);
    }

    // ──────────────────── View Functions ────────────────────

    function getAuditRequest(uint256 requestId) external view returns (AuditRequest memory) {
        return auditRequests[requestId];
    }

    function getProof(bytes32 proofId) public view returns (Proof memory) {
        return proofs[proofId];
    }

    function getRepScore(address user) public view returns (uint256) {
        return userValidationCount[user];
    }

    // ──────────────────── Admin Functions ────────────────────

    function setAgent(address _agent) external onlyOwner {
        authorizedAgent = _agent;
    }

    function setMinimumFee(uint256 _fee) external onlyOwner {
        minimumFee = _fee;
    }
}
