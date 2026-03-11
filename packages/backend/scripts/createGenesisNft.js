import dotenv from 'dotenv';
import {
    Client,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction
} from '@hashgraph/sdk';

dotenv.config();

async function main() {
    const operatorId = process.env.HEDERA_ACCOUNT_ID_TESTNET;
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY_TESTNET);

    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    console.log("Creating ProofFlow Genesis NFT Collection...");

    // 1. Create the NFT Collection
    const createTx = new TokenCreateTransaction()
        .setTokenName("ProofFlow Genesis")
        .setTokenSymbol("PFGEN")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey)
        .setSupplyKey(operatorKey)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(500)
        .freezeWith(client);

    const createSign = await createTx.sign(operatorKey);
    const createSubmit = await createSign.execute(client);
    const createReceipt = await createSubmit.getReceipt(client);
    const tokenId = createReceipt.tokenId;

    console.log(`\n✅ Genesis NFT Collection Created!`);
    console.log(`Token ID: ${tokenId.toString()}`);

    // 2. Mint Edition #1
    console.log("\nMinting Edition #1...");
    
    // Metadata needs to be stringified or passed as Buffer. HIP-412 usually expects the URI.
    const metadataURI = "ipfs://bafkreiahvascdldplfsgzqptqphjtsga7djrc7czdy7atu6jx5vpv22nru";
    const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(metadataURI)])
        .freezeWith(client);

    const mintSign = await mintTx.sign(operatorKey);
    const mintSubmit = await mintSign.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);

    console.log(`\n✅ Edition #1 Minted!`);
    console.log(`Serial Number: ${mintReceipt.serials[0].low}`);
    console.log(`\nYou can view the collection on Hashscan: https://hashscan.io/testnet/token/${tokenId.toString()}`);

    process.exit(0);
}

import fs from 'fs';

// ... at the bottom ...
main().catch(err => {
    console.error("FATAL ERROR");
    fs.writeFileSync('error.log', err.stack || err.toString() || JSON.stringify(err, null, 2));
    process.exit(1);
});
