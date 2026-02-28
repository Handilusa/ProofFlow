import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Deploying ProofValidator...");

    const rpcUrl = process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
    const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;

    if (!privateKey) throw new Error("Missing TESTNET_OPERATOR_PRIVATE_KEY");

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const artifactPath = path.join(__dirname, "../artifacts/contracts/ProofValidator.sol/ProofValidator.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Artifact not found. Please compile the contract first.");
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`ProofValidator deployed to: ${contractAddress}`);

    const configPath = path.join(__dirname, "../../../backend/config");
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }

    const contractFilePath = path.join(configPath, "contract.json");
    fs.writeFileSync(contractFilePath, JSON.stringify({ address: contractAddress }, null, 2));

    console.log("Contract address saved to config/contract.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
