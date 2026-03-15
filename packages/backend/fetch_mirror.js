import fetch from 'node-fetch';

async function main() {
    const topicId = '0.0.8001198';
    const tokenId = '0.0.8001202';

    const topicRes = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=1&order=desc`);
    const topicData = await topicRes.json();
    console.log('Topic Result:', JSON.stringify(topicData, null, 2));

    const tokenRes = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}`);
    const tokenData = await tokenRes.json();
    console.log('Token Info:', JSON.stringify(tokenData, null, 2));

    const balancesRes = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/balances?limit=100`);
    const balancesData = await balancesRes.json();
    console.log('Balances Count:', balancesData.balances.length);
}

main();
