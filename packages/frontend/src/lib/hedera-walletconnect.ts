import type { ISignClient } from '@walletconnect/types';

export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'c149712879ca7cb7a2b50bd933d5b59f';

export const HEDERA_TESTNET_CHAIN_ID = 'hedera:testnet';
export const HEDERA_MAINNET_CHAIN_ID = 'hedera:mainnet';

let signClient: ISignClient | null = null;
// Use any or a looser type for web3Modal to avoid needing the static import
let web3Modal: any = null;
let initPromise: Promise<{ signClient: ISignClient; web3Modal: any }> | null = null;

export function getSignClient(): ISignClient | null {
    return signClient;
}

export async function initHederaWalletConnect() {
    console.log('[WalletConnect Debug] initHederaWalletConnect CALLED');
    
    // Prevent SSR crashes (WalletConnect uses indexedDB which doesn't exist in Node.js)
    if (typeof window === 'undefined') {
        throw new Error("WalletConnect cannot be initialized on the server");
    }

    if (initPromise) {
        console.log('[WalletConnect Debug] Returning existing initPromise');
        return initPromise;
    }

    initPromise = (async () => {
        try {
            // Dynamically import to prevent SSR crashes
            const { SignClient } = await import('@walletconnect/sign-client');
            const { WalletConnectModal } = await import('@walletconnect/modal');

            console.log('[WalletConnect Debug] Calling SignClient.init...');
            signClient = await SignClient.init({
                projectId: WC_PROJECT_ID,
                metadata: {
                    name: 'ProofFlow',
                    description: 'Decentralized Audit Flow',
                    url: typeof window !== 'undefined' ? window.location.origin : 'https://proofflow.com',
                    icons: ['https://walletconnect.com/walletconnect-logo.png']
                }
            });
            console.log('[WalletConnect Debug] SignClient initialized:', !!signClient);

            console.log('[WalletConnect Debug] Initializing WalletConnectModal...');
            web3Modal = new WalletConnectModal({
                projectId: WC_PROJECT_ID,
                themeMode: 'dark',
                // Let WalletConnect Explorer fetch Hedera-compatible wallets automatically
                // This requires a valid WC_PROJECT_ID (get yours free at https://cloud.walletconnect.com)
                chains: [HEDERA_TESTNET_CHAIN_ID],
                themeVariables: {
                    '--wcm-z-index': '2147483647',
                    '--wcm-accent-color': '#06B6D4',       // ProofFlow Cyan 500
                    '--wcm-accent-fill-color': '#020617',   // Background for text on accent
                }
            });
            console.log('[WalletConnect Debug] WalletConnectModal initialized:', !!web3Modal);

            return { signClient, web3Modal };
        } catch (error) {
            initPromise = null;
            console.error("[WalletConnect Debug] Failed to initialize Hedera WalletConnect", error);
            throw error;
        }
    })();

    return initPromise;
}

export async function connectToHedera() {
    console.log('[WalletConnect Debug] connectToHedera CALLED');
    try {
        const { signClient, web3Modal } = await initHederaWalletConnect();

        console.log('[WalletConnect Debug] Calling signClient.connect...');
        const { uri, approval } = await signClient.connect({
            requiredNamespaces: {
                hedera: {
                    methods: [
                        'hedera_signAndExecuteTransaction',
                        'hedera_signAndReturnTransaction',
                        'hedera_signMessage'
                    ],
                    chains: [HEDERA_TESTNET_CHAIN_ID],
                    events: ['chainChanged', 'accountsChanged']
                }
            }
        });

        console.log('[WalletConnect Debug] signClient.connect returned! uri:', !!uri);

        if (uri) {
            console.log('[WalletConnect Debug] Opening web3Modal with uri...');
            web3Modal.openModal({ uri, standaloneChains: [HEDERA_TESTNET_CHAIN_ID] });
            console.log('[WalletConnect Debug] web3Modal.openModal completed synchronously');
        }

        console.log('[WalletConnect Debug] Awaiting approval()...');

        // Race condition: if the user closes the modal manually, approval() hangs forever.
        // We race approval() against a promise that rejects if the modal is closed.
        const session = await Promise.race([
            approval(),
            new Promise((_, reject) => {
                const unsubscribe = web3Modal!.subscribeModal((state: any) => {
                    if (!state.open) {
                        console.log('[WalletConnect Debug] Modal closed by user before approval');
                        unsubscribe();
                        reject(new Error("User closed modal"));
                    }
                });
            })
        ]);

        console.log('[WalletConnect Debug] session approved:', !!session);

        console.log('[WalletConnect Debug] Closing web3Modal');
        web3Modal.closeModal();

        return session as any;

    } catch (error) {
        console.error("[WalletConnect Debug] Error connecting to Hedera via WalletConnect", error);
        if (web3Modal) web3Modal.closeModal();
        throw error;
    }
}

/**
 * Associates a token (e.g. PFR) to the user's Hedera wallet via WalletConnect.
 * This is required before the backend can transfer the token to the user.
 * Uses the same signing pattern as micropayments in dashboard.
 */
export async function associatePFRToken(accountId: string, tokenId: string): Promise<boolean> {
    try {
        const { signClient } = await initHederaWalletConnect();
        if (!signClient) throw new Error("WalletConnect not initialized");

        // Dynamically import Hedera SDK to avoid SSR issues
        const { TokenAssociateTransaction, AccountId, TransactionId } = await import('@hashgraph/sdk');

        const sessions = signClient.session.getAll();
        const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
        if (!hederaSession) throw new Error("No active Hedera WalletConnect session found.");

        // Resolve account ID from session if needed
        let signerAccountId = accountId;
        if (accountId.startsWith('0x')) {
            const sessionAccounts = hederaSession.namespaces.hedera.accounts || [];
            if (sessionAccounts[0]) {
                const parts = sessionAccounts[0].split(':');
                signerAccountId = parts[parts.length - 1];
            }
        }

        console.log(`[TokenAssociate] Associating token ${tokenId} to ${signerAccountId}...`);

        const tx = new TokenAssociateTransaction()
            .setAccountId(AccountId.fromString(signerAccountId))
            .setTokenIds([tokenId])
            .setTransactionId(TransactionId.generate(signerAccountId))
            .setNodeAccountIds([AccountId.fromString("0.0.3")]);

        tx.freeze();
        const txBytes = Buffer.from(tx.toBytes()).toString('base64');

        const response = await signClient.request({
            topic: hederaSession.topic,
            chainId: 'hedera:testnet',
            request: {
                method: 'hedera_signAndExecuteTransaction',
                params: {
                    transactionList: txBytes,
                    signerAccountId: `hedera:testnet:${signerAccountId}`
                }
            }
        }) as any;

        const txId = response?.transactionId || response?.response?.transactionId;
        console.log(`[TokenAssociate] ✅ Token associated successfully! tx: ${txId}`);
        return true;

    } catch (error: any) {
        console.error('[TokenAssociate] Failed to associate token:', error);
        // User rejection is not a fatal error
        if (error?.message?.includes('rejected') || error?.message?.includes('denied')) {
            return false;
        }
        throw error;
    }
}

/**
 * Executes a swap transaction via a Hedera-native wallet (HashPack, Kabila, etc.)
 * using ContractExecuteTransaction signed through WalletConnect.
 * This is the Hedera-native counterpart to the EVM/wagmi swap path.
 *
 * @param accountId - The user's Hedera account ID (e.g. "0.0.12345")
 * @param txData    - The prepared transaction data from the backend { to, data, value }
 * @returns The transaction ID string from the executed swap
 */
export async function executeHederaSwap(
    accountId: string,
    txData: { to: string; data: string; value: string }
): Promise<string> {
    const { signClient } = await initHederaWalletConnect();
    if (!signClient) throw new Error("WalletConnect not initialized");

    // Dynamically import Hedera SDK to avoid SSR issues
    const {
        ContractExecuteTransaction,
        ContractId,
        AccountId,
        TransactionId,
        Hbar,
        HbarUnit
    } = await import('@hashgraph/sdk');

    const sessions = signClient.session.getAll();
    const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
    if (!hederaSession) throw new Error("No active Hedera WalletConnect session found.");

    // Resolve the signer account ID from the session
    let signerAccountId = accountId;
    if (accountId.startsWith('0x')) {
        const sessionAccounts = hederaSession.namespaces.hedera.accounts || [];
        if (sessionAccounts[0]) {
            const parts = sessionAccounts[0].split(':');
            signerAccountId = parts[parts.length - 1];
        }
    }

    console.log(`[HederaSwap] Building ContractExecuteTransaction...`);
    console.log(`[HederaSwap]   Contract (EVM): ${txData.to}`);
    console.log(`[HederaSwap]   Value (tinybars): ${txData.value}`);
    console.log(`[HederaSwap]   Signer: ${signerAccountId}`);

    // Build the ContractExecuteTransaction from the backend's prepared payload
    const contractId = ContractId.fromEvmAddress(0, 0, txData.to);
    const functionParams = Buffer.from(txData.data.replace('0x', ''), 'hex');

    const tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3_000_000)
        .setFunctionParameters(functionParams)
        .setTransactionId(TransactionId.generate(signerAccountId))
        .setNodeAccountIds([AccountId.fromString("0.0.3")]);

    // If there's HBAR value to send (e.g., swapping HBAR → token)
    const valueNum = Number(txData.value || "0");
    if (valueNum > 0) {
        tx.setPayableAmount(Hbar.from(valueNum, HbarUnit.Tinybar));
    }

    tx.freeze();
    const txBytes = Buffer.from(tx.toBytes()).toString('base64');

    console.log(`[HederaSwap] Requesting WalletConnect signature...`);

    const response = await signClient.request({
        topic: hederaSession.topic,
        chainId: 'hedera:testnet',
        request: {
            method: 'hedera_signAndExecuteTransaction',
            params: {
                transactionList: txBytes,
                signerAccountId: `hedera:testnet:${signerAccountId}`
            }
        }
    }) as any;

    const txId = response?.transactionId || response?.response?.transactionId;
    if (!txId) {
        throw new Error("Swap transaction was signed but no transaction ID was returned.");
    }

    console.log(`[HederaSwap] ✅ Swap executed successfully! tx: ${txId}`);
    return txId;
}

