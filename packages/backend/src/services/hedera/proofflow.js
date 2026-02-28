import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { publishHash } from "./hcs-logger.js";
import { mintReputation } from "./reputation-token.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize EVM components
const rpcUrl = process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;

if (!privateKey) throw new Error("Missing TESTNET_OPERATOR_PRIVATE_KEY");

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Load Contract
const configPath = path.join(__dirname, "../../../config");
const contractFilePath = path.join(configPath, "contract.json");
if (!fs.existsSync(contractFilePath)) {
    throw new Error("Contract address config not found. Deploy contract first.");
}

const contractAddress = JSON.parse(fs.readFileSync(contractFilePath, "utf8")).address;
const artifactPath = path.join(__dirname, "../../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");

if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact not found. Please compile the contract first.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

export async function submitProof(taskId, resultData, submitterAccountId = process.env.HEDERA_ACCOUNT_ID) {
    try {
        console.log(`\n--- Processing Task: ${taskId} ---`);

        // 1. Generate resultHash = keccak256(resultData)
        // using ethers.id which is a shortcut for keccak256(toUtf8Bytes(text))
        const resultHash = ethers.id(resultData);
        console.log(`Generated Hash: ${resultHash}`);

        // 2. Call publishHash(taskId, resultHash) -> HCS
        console.log(`Publishing to HCS...`);
        const hcsReceipt = await publishHash(taskId, resultHash);

        // 3. Call contract.registerProof(taskId, resultHash) -> EVM
        console.log(`Registering to EVM Smart Contract...`);
        const evmTx = await contract.registerProof(taskId, resultHash);
        const evmReceipt = await evmTx.wait();
        console.log(`EVM Tx Hash: ${evmReceipt.hash}`);

        // 4. Call mintReputation(submitterAccount, 1) -> HTS
        console.log(`Minting 1 PFR Token to ${submitterAccountId}...`);
        const tokenTx = await mintReputation(submitterAccountId, 1);

        console.log(`--- Task ${taskId} Processing Complete ---\n`);

        // 5. Return all results
        return {
            taskId,
            resultHash,
            hcsReceiptStatus: hcsReceipt.status.toString(),
            contractTxHash: evmReceipt.hash,
            tokenTxStatus: tokenTx.status.toString()
        };
    } catch (error) {
        console.error(`Error processing task ${taskId}:`, error);
        throw error;
    }
}
