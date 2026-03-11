import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { publishHash } from "./hcs-logger.js";
import { mintReputation } from "./reputation-token.js";
import { getRpcUrl, getEvmPrivateKey, getConfigDirPath, getNetwork } from "./networkManager.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We keep a cache of EVM contracts per network
const contracts = {
    testnet: null,
    mainnet: null
};

// Lazy initialization function
function getEvmContract(networkStr) {
    const network = getNetwork(networkStr);

    // Return from cache if already loaded
    if (contracts[network]) return contracts[network];

    try {
        const privateKey = getEvmPrivateKey(network);
        const rpcUrl = getRpcUrl(network);

        if (!privateKey) throw new Error(`Missing EVM_PRIVATE_KEY for ${network}`);

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        const configPath = getConfigDirPath(network);
        const contractFilePath = path.join(configPath, "contract.json");

        if (fs.existsSync(contractFilePath)) {
            const contractAddress = JSON.parse(fs.readFileSync(contractFilePath, "utf8")).address;

            // Try local config copy first, then cross-package path
            const localArtifactPath = path.join(configPath, "ProofValidator.json");
            const generalConfigPath = path.join(__dirname, "../../../config"); // Root config
            const fallbackArtifactPath = path.join(generalConfigPath, "ProofValidator.json");
            const crossPkgArtifactPath = path.join(__dirname, "../../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");

            let artifactPath = null;
            if (fs.existsSync(localArtifactPath)) artifactPath = localArtifactPath;
            else if (fs.existsSync(fallbackArtifactPath)) artifactPath = fallbackArtifactPath;
            else if (fs.existsSync(crossPkgArtifactPath)) artifactPath = crossPkgArtifactPath;

            if (artifactPath) {
                const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
                const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
                console.log(`[EVM - ${network.toUpperCase()}] ProofValidator contract loaded at ${contractAddress}`);
                contracts[network] = contract;
                return contract;
            } else {
                console.warn(`[EVM - ${network.toUpperCase()}] Contract artifact not found. EVM registration disabled.`);
            }
        } else {
            console.warn(`[EVM - ${network.toUpperCase()}] contract.json not found. EVM registration disabled. Run deploy script first.`);
        }
    } catch (err) {
        console.warn(`[EVM - ${network.toUpperCase()}] Failed to initialize contract:`, err.message);
    }

    return null;
}

export function isContractReady(networkStr = "testnet") {
    return getEvmContract(networkStr) !== null;
}

export function getContractAddress(networkStr = "testnet") {
    const contract = getEvmContract(networkStr);
    return contract ? contract.target : null;
}

export async function recordAuditInEVM(prompt, rootHash, requesterAddress, networkStr = "testnet") {
    const network = getNetwork(networkStr);
    const contract = getEvmContract(network);

    if (!contract) {
        console.warn(`[EVM - ${network.toUpperCase()}] Contract not initialized — skipping EVM recording.`);
        return null;
    }

    try {
        console.log(`[EVM - ${network.toUpperCase()}] Recording audit on Smart Contract via registerProof()...`);

        // Guard against undefined/null rootHash
        if (!rootHash) {
            console.warn(`[EVM - ${network.toUpperCase()}] rootHash is empty — using keccak256 fallback`);
            rootHash = ethers.id(prompt || "fallback");
        }

        // rootHash is a hex string, ensure it has 0x prefix and is bytes32
        const formattedHash = rootHash.startsWith('0x') ? rootHash : '0x' + rootHash;
        // Pad to bytes32 if needed
        const bytes32Hash = formattedHash.length === 66 ? formattedHash : ethers.zeroPadValue(formattedHash, 32);

        // Use a short, clean ASCII taskId
        const taskId = `pf-${Date.now()}`;

        console.log(`[EVM - ${network.toUpperCase()}]   taskId: "${taskId}", hash: ${bytes32Hash.substring(0, 16)}...`);

        const tx = await contract.registerProof(taskId, bytes32Hash, {
            gasLimit: 800000
        });
        console.log(`[EVM - ${network.toUpperCase()}]   Tx sent: ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait();
        console.log(`[EVM - ${network.toUpperCase()}] ✅ Audit registered! Tx: ${receipt.hash}`);
        return receipt.hash;
    } catch (err) {
        console.error(`[EVM - ${network.toUpperCase()}] ❌ Failed to record audit:`, err.message);
        return null;
    }
}
