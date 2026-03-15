const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'proofs_testnet.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`[Cleanup] Initial record count: ${data.length}`);

    // Filter out proofs that:
    // 1. Are not VERIFIED or CONFIRMED (i.e. stuck in PUBLISHING / PROCESSING)
    // 2. Are VERIFIED/CONFIRMED but missing the evmTxHash (no tx reward generated)
    const filteredData = data.filter(([_key, value]) => {
        const isComplete = value.status === 'CONFIRMED' || value.status === 'VERIFIED';
        const hasTxReward = !!value.evmTxHash;

        return isComplete && hasTxReward;
    });

    console.log(`[Cleanup] Kept ${filteredData.length} valid records with tx rewards.`);
    console.log(`[Cleanup] Deleted ${data.length - filteredData.length} stuck or incomplete records.`);

    fs.writeFileSync(dataPath, JSON.stringify(filteredData, null, 2), 'utf8');
    console.log(`[Cleanup] Successfully saved cleaned data to proofs_testnet.json`);
} catch (err) {
    console.error(`[Cleanup] Error:`, err);
}
