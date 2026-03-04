import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Deploying ProofValidator (Autonomous Agent Bounty Board)...");

    const rpcUrl = process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
    const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;

    if (!privateKey) throw new Error("Missing TESTNET_OPERATOR_PRIVATE_KEY");

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const agentAddress = wallet.address; // The deployer is the agent

    console.log(`Deployer / Agent address: ${agentAddress}`);

    const artifactPath = path.join(__dirname, "../artifacts/contracts/ProofValidator.sol/ProofValidator.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Artifact not found. Run: npx hardhat compile --network testnet");
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Constructor: (address _agent, uint256 _minimumFee)
    // Minimum fee: 0.01 HBAR = 10_000_000 tinybar (1 HBAR = 100_000_000 tinybar)
    // But on Hedera EVM the native unit is weiBars where 1 HBAR = 10^18 weiBars
    const minimumFee = ethers.parseEther("0.01"); // 0.01 HBAR

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(agentAddress, minimumFee);

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`ProofValidator deployed to: ${contractAddress}`);
    console.log(`Authorized Agent: ${agentAddress}`);
    console.log(`Minimum Fee: 0.01 HBAR`);

    // Save contract address for backend
    const configPath = path.join(__dirname, "../../../backend/config");
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }

    const contractFilePath = path.join(configPath, "contract.json");
    fs.writeFileSync(contractFilePath, JSON.stringify({
        address: contractAddress,
        agent: agentAddress,
        minimumFee: "0.01",
        deployedAt: new Date().toISOString()
    }, null, 2));

    console.log("Contract config saved to backend/config/contract.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
