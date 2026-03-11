import { Client, PrivateKey } from "@hashgraph/sdk";

/**
 * Validates and retrieves the active network.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {string} The validated network name.
 */
export function getNetwork(networkStr) {
    if (networkStr === "mainnet") return "mainnet";
    return "testnet"; // Default fallback
}

/**
 * Creates and configures a Hedera Client for the specified network.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {Client} A configured Hedera Client.
 */
export function getClient(networkStr) {
    const network = getNetwork(networkStr);
    const isMainnet = network === "mainnet";

    let client;
    if (isMainnet) {
        client = Client.forMainnet();
    } else {
        client = Client.forTestnet();
    }

    const accountId = isMainnet
        ? process.env.HEDERA_ACCOUNT_ID_MAINNET
        : process.env.HEDERA_ACCOUNT_ID_TESTNET;

    const privateKey = isMainnet
        ? process.env.HEDERA_PRIVATE_KEY_MAINNET
        : process.env.HEDERA_PRIVATE_KEY_TESTNET;

    if (!accountId || !privateKey) {
        throw new Error(`[NetworkManager] Missing operator credentials for ${network}`);
    }

    try {
        let key;
        try {
            // Try to parse as ECDSA first since our project uses it for EVM aliases
            key = PrivateKey.fromStringECDSA(privateKey);
        } catch (e) {
            // Fallback to standard parsing (defaults to Ed25519 for raw hex)
            key = PrivateKey.fromString(privateKey);
        }
        client.setOperator(accountId, key);
    } catch (err) {
        console.error(`[NetworkManager] Failed to set operator for ${network}:`, err.message);
        throw err;
    }

    return client;
}

/**
 * Retrieves the JSON-RPC Endpoint URL for EVM interactions.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {string} RPC URL
 */
export function getRpcUrl(networkStr) {
    const network = getNetwork(networkStr);
    if (network === "mainnet") {
        return process.env.MAINNET_ENDPOINT || "https://mainnet.hashio.io/api";
    }
    return process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
}

/**
 * Retrieves the Mirror Node API Base URL for the specified network.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {string} Mirror Node URL
 */
export function getMirrorNodeUrl(networkStr) {
    const network = getNetwork(networkStr);
    return `https://${network}.mirrornode.hedera.com/api/v1`;
}

/**
 * Retrieves the EVM Operator Private Key for the specified network.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {string} Hex encoded private key
 */
export function getEvmPrivateKey(networkStr) {
    const network = getNetwork(networkStr);
    let key;
    if (network === "mainnet") {
        key = process.env.EVM_PRIVATE_KEY_MAINNET;
    } else {
        key = process.env.EVM_PRIVATE_KEY_TESTNET || process.env.TESTNET_OPERATOR_PRIVATE_KEY;
    }

    if (key && !key.startsWith("0x")) {
        return "0x" + key;
    }
    return key;
}

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns the absolute config directory path for the given network.
 * @param {string} networkStr - 'mainnet' or 'testnet'
 * @returns {string} Absolute config directory path
 */
export function getConfigDirPath(networkStr) {
    const network = getNetwork(networkStr);
    // This file is in src/services/hedera/networkManager.js
    // config is in ../../../config/ (relative to this file)
    return path.resolve(__dirname, "../../../config", network);
}

