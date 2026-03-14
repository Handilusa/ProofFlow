import dotenv from "dotenv";
import {
    Client,
    PrivateKey,
    TokenMintTransaction,
    TransferTransaction,
    AccountId
} from "@hashgraph/sdk";

dotenv.config();

/**
 * One-time script: Mint Bronze NFT Edition #1 and transfer to user wallet.
 */
async function main() {
    const operatorId = process.env.HEDERA_ACCOUNT_ID_TESTNET;
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY_TESTNET);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    const BRONZE_TOKEN_ID = "0.0.8193220";
    const RECIPIENT = "0.0.8026799";
    const METADATA_URI = "ipfs://bafkreiekd2e3jyeyhviumhfmy6joscjf2xuyalni3a4gfw7kg7qhporu5i";

    console.log(`Minting Bronze NFT Edition #1...`);
    console.log(`  Token: ${BRONZE_TOKEN_ID}`);
    console.log(`  Metadata: ${METADATA_URI}`);
    console.log(`  Recipient: ${RECIPIENT}`);

    // 1. Mint to Treasury
    const mintTx = new TokenMintTransaction()
        .setTokenId(BRONZE_TOKEN_ID)
        .setMetadata([Buffer.from(METADATA_URI)])
        .freezeWith(client);

    const mintSign = await mintTx.sign(operatorKey);
    const mintSubmit = await mintSign.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);
    const serialNumber = mintReceipt.serials[0].low;

    console.log(`\n✅ Edition #1 Minted! Serial: ${serialNumber}`);

    // 2. Transfer to recipient
    console.log(`\nTransferring Serial #${serialNumber} to ${RECIPIENT}...`);
    const transferTx = new TransferTransaction()
        .addNftTransfer(BRONZE_TOKEN_ID, serialNumber, operatorId, RECIPIENT)
        .freezeWith(client);

    const transferSign = await transferTx.sign(operatorKey);
    const transferSubmit = await transferSign.execute(client);
    await transferSubmit.getReceipt(client);

    console.log(`\n✅ Bronze NFT transferred to ${RECIPIENT}!`);
    console.log(`View: https://hashscan.io/testnet/token/${BRONZE_TOKEN_ID}/${serialNumber}`);

    process.exit(0);
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
