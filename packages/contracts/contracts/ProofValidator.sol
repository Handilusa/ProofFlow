// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofValidator {
    struct Proof {
        address submitter;
        string taskId;
        bytes32 resultHash;
        uint256 timestamp;
        bool validated;
    }

    mapping(bytes32 => Proof) public proofs;
    mapping(address => uint256) public userValidationCount;

    event ProofRegistered(bytes32 indexed proofId, address submitter, string taskId);
    event ProofValidated(bytes32 indexed proofId);

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

    function getProof(bytes32 proofId) public view returns (Proof memory) {
        return proofs[proofId];
    }

    function getRepScore(address user) public view returns (uint256) {
        return userValidationCount[user];
    }
}
