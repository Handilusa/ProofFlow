import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { publishHash } from "./hcs-logger.js";
import { mintReputation } from "./reputation-token.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize EVM components (lazy — don't crash if not configured)
const rpcUrl = process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;

let contract = null;
let contractAddress = null;

try {
    if (!privateKey) throw new Error("Missing TESTNET_OPERATOR_PRIVATE_KEY");

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const configPath = path.join(__dirname, "../../../config");
    const contractFilePath = path.join(configPath, "contract.json");

    if (fs.existsSync(contractFilePath)) {
        contractAddress = JSON.parse(fs.readFileSync(contractFilePath, "utf8")).address;

        // Try local config copy first (for production/Render), then cross-package path
        const localArtifactPath = path.join(configPath, "ProofValidator.json");
        const crossPkgArtifactPath = path.join(__dirname, "../../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");
        const artifactPath = fs.existsSync(localArtifactPath) ? localArtifactPath : crossPkgArtifactPath;

        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
            console.log(`[EVM] ProofValidator contract loaded at ${contractAddress}`);
        } else {
            console.warn("[EVM] Contract artifact not found. EVM proof registration disabled.");
        }
    } else {
        console.warn("[EVM] contract.json not found. EVM proof registration disabled. Run deploy script first.");
    }
} catch (err) {
    console.warn("[EVM] Failed to initialize contract:", err.message);
}

export function isContractReady() {
    return contract !== null;
}

export function getContractAddress() {
    return contractAddress;
}

export async function recordAuditInEVM(prompt, rootHash, requesterAddress) {
    if (!contract) {
        console.warn("[EVM] Contract not initialized — skipping EVM recording.");
        return null;
    }
    try {
        console.log(`[EVM] Recording audit on Smart Contract via registerProof()...`);

        // Guard against undefined/null rootHash
        if (!rootHash) {
            console.warn("[EVM] rootHash is empty — using keccak256 fallback");
            rootHash = ethers.id(prompt || "fallback");
        }

        // rootHash is a hex string, ensure it has 0x prefix and is bytes32
        const formattedHash = rootHash.startsWith('0x') ? rootHash : '0x' + rootHash;
        // Pad to bytes32 if needed (SHA256 hashes are 64 hex chars = 32 bytes)
        const bytes32Hash = formattedHash.length === 66 ? formattedHash : ethers.zeroPadValue(formattedHash, 32);

        // Use a short, clean ASCII taskId — avoid special chars that may cause EVM issues
        const taskId = `pf-${Date.now()}`;

        console.log(`[EVM]   taskId: "${taskId}", hash: ${bytes32Hash.substring(0, 16)}...`);

        const tx = await contract.registerProof(taskId, bytes32Hash, {
            gasLimit: 800000
        });
        console.log(`[EVM]   Tx sent: ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait();
        console.log(`[EVM] ✅ Audit registered! Tx: ${receipt.hash}`);
        return receipt.hash;
    } catch (err) {
        console.error("[EVM] ❌ Failed to record audit:", err.message);
        return null;
    }
}

export async function submitProof(taskId, resultData, submitterAccountId = process.env.HEDERA_ACCOUNT_ID) {
    try {
        console.log(`\n--- Processing Task: ${taskId} ---`);

        // 1. Generate resultHash = keccak256(resultData)
        const resultHash = ethers.id(resultData);
        console.log(`Generated Hash: ${resultHash}`);

        // 2. Call publishHash(taskId, resultHash) -> HCS
        console.log(`Publishing to HCS...`);
        const hcsReceipt = await publishHash(taskId, resultHash);

        // 3. Call contract.registerProof(taskId, resultHash) -> EVM
        let evmTxHash = null;
        if (contract) {
            console.log(`Registering to EVM Smart Contract...`);
            const evmTx = await contract.registerProof(taskId, resultHash);
            const evmReceipt = await evmTx.wait();
            evmTxHash = evmReceipt.hash;
            console.log(`EVM Tx Hash: ${evmTxHash}`);
        } else {
            console.log(`[EVM] Skipping contract registration (contract not deployed)`);
        }

        // 4. Call mintReputation(submitterAccount, 1) -> HTS
        console.log(`Minting 1 PFR Token to ${submitterAccountId}...`);
        const tokenTx = await mintReputation(submitterAccountId, 1);

        console.log(`--- Task ${taskId} Processing Complete ---\n`);

        // 5. Return all results
        return {
            taskId,
            resultHash,
            hcsReceiptStatus: hcsReceipt.status.toString(),
            contractTxHash: evmTxHash,
            tokenTxStatus: tokenTx.status.toString()
        };
    } catch (error) {
        console.error(`Error processing task ${taskId}:`, error);
        throw error;
    }
}
