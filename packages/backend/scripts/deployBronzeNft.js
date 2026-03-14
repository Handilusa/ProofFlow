import dotenv from "dotenv";
import {
    Client,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";

dotenv.config();

/**
 * Script to deploy the ProofFlow Bronze Loyalty Pass NFT on Hedera Testnet.
 */
async function main() {
    try {
        const operatorId = process.env.HEDERA_ACCOUNT_ID_TESTNET;
        const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY_TESTNET);

        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        console.log("Creating ProofFlow Bronze Loyalty Pass NFT Collection...");

        // 1. Create the NFT Collection
        const createTx = new TokenCreateTransaction()
            .setTokenName("ProofFlow Bronze Pass")
            .setTokenSymbol("PFBRONZE")
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setTreasuryAccountId(operatorId)
            .setAdminKey(operatorKey)
            .setSupplyKey(operatorKey)
            .setMetadataKey(operatorKey) // Required to update serial metadata later via TokenUpdateNftsTransaction
            .setSupplyType(TokenSupplyType.Infinite) // Infinite supply allows us to keep minting as users reach Bronze
            .freezeWith(client);

        const createSign = await createTx.sign(operatorKey);
        const createSubmit = await createSign.execute(client);
        const createReceipt = await createSubmit.getReceipt(client);
        const tokenId = createReceipt.tokenId;

        console.log(`\n✅ Bronze NFT Collection Created!`);
        console.log(`Token ID: ${tokenId.toString()}`);

        // Update the config file so the backend can use it
        const configPath = path.join(process.cwd(), "config", "testnet");
        if (!fs.existsSync(configPath)) {
            fs.mkdirSync(configPath, { recursive: true });
        }
        const tokenFilePath = path.join(configPath, "nft_bronze.json");
        fs.writeFileSync(tokenFilePath, JSON.stringify({ tokenId: tokenId.toString() }, null, 2));
        console.log(`\n✅ Token ID saved to ${tokenFilePath}`);

        // We do NOT mint Edition #1 yet, minting happens dynamically when a user reaches 50 audits

        console.log(`\nYou can view the collection on Hashscan: https://hashscan.io/testnet/token/${tokenId.toString()}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ HEDERA ERROR OCCURRED:");
        if (error.status) {
            console.error(`Status code: ${error.status.toString()}`);
        }
        console.error(error.message || error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("FATAL ERROR outside try/catch:");
    console.error(err);
    process.exit(1);
});
