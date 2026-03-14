import dotenv from "dotenv";
import {
    Client,
    PrivateKey,
    TokenUpdateTransaction,
    TokenUpdateNftsTransaction
} from "@hashgraph/sdk";

dotenv.config();

/**
 * Updates the Bronze NFT collection and serial #1 with corrected metadata
 * Usage: node updateBronzeMetadata.js <ipfs://new_cid>
 */
async function main() {
    try {
        const operatorId = process.env.HEDERA_ACCOUNT_ID_TESTNET;
        const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY_TESTNET);
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        const BRONZE_TOKEN_ID = "0.0.8193220";
        
        // Get the new URI from command line arguments
        const METADATA_URI = process.argv[2];
        
        if (!METADATA_URI || !METADATA_URI.startsWith("ipfs://")) {
            console.error("❌ Error: You must provide a valid IPFS URI.");
            console.error("Usage: node updateBronzeMetadata.js ipfs://bafkrei...");
            process.exit(1);
        }

        console.log(`Updating Bronze NFT with new metadata...`);
        console.log(`  Token: ${BRONZE_TOKEN_ID}`);
        console.log(`  New Metadata URI: ${METADATA_URI}`);

        // 1. Update Collection-Level Metadata (HIP-766)
        console.log(`\n[1/2] Updating collection metadata...`);
        const updateTx = new TokenUpdateTransaction()
            .setTokenId(BRONZE_TOKEN_ID)
            .setMetadata(Buffer.from(METADATA_URI))
            .freezeWith(client);

        const updateSign = await updateTx.sign(operatorKey);
        const updateSubmit = await updateSign.execute(client);
        const updateReceipt = await updateSubmit.getReceipt(client);
        console.log(`✅ Collection metadata updated! Status: ${updateReceipt.status.toString()}`);

        // 2. Update Serial #1 Metadata
        console.log(`\n[2/2] Updating Serial #1 metadata...`);
        // Note: TokenUpdateNftsTransaction is used to update the metadata of specific serial numbers
        // that have already been minted.
        const updateNftsTx = new TokenUpdateNftsTransaction()
            .setTokenId(BRONZE_TOKEN_ID)
            .setSerialNumbers([1])
            .setMetadata(Buffer.from(METADATA_URI))
            .freezeWith(client);

        const updateNftsSign = await updateNftsTx.sign(operatorKey);
        const updateNftsSubmit = await updateNftsSign.execute(client);
        const updateNftsReceipt = await updateNftsSubmit.getReceipt(client);
        
        console.log(`✅ Serial #1 metadata updated! Status: ${updateNftsReceipt.status.toString()}`);

        console.log(`\n🎉 All done! Check changes here:`);
        console.log(`Collection: https://hashscan.io/testnet/token/${BRONZE_TOKEN_ID}`);
        console.log(`Serial #1:  https://hashscan.io/testnet/token/${BRONZE_TOKEN_ID}/1`);

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
