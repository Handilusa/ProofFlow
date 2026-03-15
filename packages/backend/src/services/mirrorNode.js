import fs from "fs";
import path from "path";
import { getMirrorNodeUrl, getConfigDirPath, getNetwork } from "./hedera/networkManager.js";

function getTopicId(networkStr) {
    const network = getNetwork(networkStr);
    const topicFilePath = path.join(getConfigDirPath(network), "topic.json");
    if (fs.existsSync(topicFilePath)) {
        return JSON.parse(fs.readFileSync(topicFilePath, "utf8")).topicId;
    }
    return null;
}

function getTokenId(networkStr) {
    const network = getNetwork(networkStr);
    const tokenFilePath = path.join(getConfigDirPath(network), "token.json");
    if (fs.existsSync(tokenFilePath)) {
        return JSON.parse(fs.readFileSync(tokenFilePath, "utf8")).tokenId;
    }
    return null;
}

export async function fetchProofFromMirrorNode(proofId, networkStr = "testnet") {
    const topicId = getTopicId(networkStr);
    if (!topicId) throw new Error("Topic ID not configured");

    const mirrorNodeUrl = getMirrorNodeUrl(networkStr);

    // We are querying the Mirror Node to find the specific message containing the proofId / taskId
    // To be precise we fetch all messages and filter. In production, this can be heavily paginated or indexed locally.
    let nextUrl = `${mirrorNodeUrl}/topics/${topicId}/messages`;
    while (nextUrl) {
        const response = await fetch(nextUrl);
        const data = await response.json();

        const messages = data.messages || [];
        for (const msg of messages) {
            try {
                // messages in HCS are Base64 encoded
                const decodedMessage = Buffer.from(msg.message, 'base64').toString('utf8');
                const parsedPayload = JSON.parse(decodedMessage);

                // Assuming ProofId internally equates to taskId or resultHash representation
                if (parsedPayload.taskId === proofId || parsedPayload.resultHash === proofId) {
                    return {
                        sequenceNumber: msg.sequence_number,
                        consensusTimestamp: msg.consensus_timestamp,
                        payload: parsedPayload,
                        rawMessageId: msg.chunk_info?.initial_transaction_id || null
                    };
                }
            } catch (err) {
                // Ignore parsing errors for individual messages that might not be valid JSON
            }
        }
        nextUrl = data.links?.next ? `${mirrorNodeUrl}${data.links.next}` : null;
    }

    return null; // Not found
}

export async function fetchLeaderboard(userService, networkStr = "testnet") {
    const tokenId = getTokenId(networkStr);
    const genesisTokenId = "0.0.8170105"; // Hardcoded PoC for Genesis NFT
    if (!tokenId) throw new Error("Token ID not configured");

    const mirrorNodeUrl = getMirrorNodeUrl(networkStr);

    const response = await fetch(`${mirrorNodeUrl}/tokens/${tokenId}/balances?limit=100`);
    if (!response.ok) throw new Error(`Mirror Node error: ${response.statusText}`);

    const data = await response.json();
    const treasuryAccount = getNetwork(networkStr) === "mainnet"
        ? process.env.HEDERA_ACCOUNT_ID_MAINNET
        : process.env.HEDERA_ACCOUNT_ID_TESTNET;

    // Fetch Genesis Holders (up to 1000 for PoC)
    let genesisHolders = new Set();
    try {
        const genRes = await fetch(`${mirrorNodeUrl}/tokens/${genesisTokenId}/balances?limit=1000`);
        if (genRes.ok) {
            const genData = await genRes.json();
            genData.balances.forEach(b => {
                if (Number(b.balance) > 0) {
                    genesisHolders.add(b.account);
                }
            });
        }
    } catch (e) {
        console.warn("Could not fetch Genesis holders:", e);
    }

    // Async map to resolve EVM addresses for all leaderboard accounts
    let rawBalances = data.balances.filter(b => b.account !== treasuryAccount);
    
    let balances = await Promise.all(rawBalances.map(async b => {
        let evmAddress = null;
        
        try {
            // Fetch account details to get the EVM equivalent for username lookup
            const accRes = await fetch(`${mirrorNodeUrl}/accounts/${b.account}`);
            if (accRes.ok) {
                const accData = await accRes.json();
                evmAddress = accData.evm_address || null;
            }
        } catch (e) {
            // Ignored, account might not have an EVM equivalent
        }

        let isGenesis = genesisHolders.has(b.account);

        // Fallback: Check specifically for this account if not in the global top 1000 holders and not admin
        if (!isGenesis) {
            try {
                const checkRes = await fetch(`${mirrorNodeUrl}/accounts/${b.account}/tokens?token.id=${genesisTokenId}`);
                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    const relationship = checkData.tokens?.find(t => t.token_id === genesisTokenId);
                    if (relationship && Number(relationship.balance) > 0) {
                        isGenesis = true;
                    }
                }
            } catch (err) {
                // Ignored, relationship might not exist
            }
        }
        
        // Lookup username using both native ID and EVM alias
        let username = null;
        if (userService) {
            username = userService.getUsername(b.account) || (evmAddress ? userService.getUsername(evmAddress) : null);
        }

        return {
            account: b.account,
            balance: Number(b.balance),
            username: username,
            isGenesis: isGenesis
        };
    }));

    // Sort heavily by balance descending
    balances.sort((a, b) => b.balance - a.balance);

    return balances;
}

export async function fetchStats(networkStr = "testnet") {
    const topicId = getTopicId(networkStr);
    const tokenId = getTokenId(networkStr);
    const mirrorNodeUrl = getMirrorNodeUrl(networkStr);

    let totalProofs = 0;
    let totalAgents = 0;
    let totalTokensMinted = 0;
    let lastActivity = null;

    if (topicId) {
        const msgResponse = await fetch(`${mirrorNodeUrl}/topics/${topicId}/messages?order=desc&limit=1`);
        if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            if (msgData.messages && msgData.messages.length > 0) {
                totalProofs = msgData.messages[0].sequence_number;
                lastActivity = msgData.messages[0].consensus_timestamp;
            }
        }
    }

    if (tokenId) {
        const tokenResponse = await fetch(`${mirrorNodeUrl}/tokens/${tokenId}`);
        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            totalTokensMinted = tokenData.total_supply;
        }

        const limitsResponse = await fetch(`${mirrorNodeUrl}/tokens/${tokenId}/balances`);
        if (limitsResponse.ok) {
            const limitsData = await limitsResponse.json();
            totalAgents = limitsData.balances.length; // Approximate distinct agents holding PFR
        }
    }

    return {
        totalProofs,
        totalAgents,
        totalTokensMinted,
        lastActivity
    };
}
