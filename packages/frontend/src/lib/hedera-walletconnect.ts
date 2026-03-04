import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import type { ISignClient } from '@walletconnect/types';

export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'c149712879ca7cb7a2b50bd933d5b59f';

export const HEDERA_TESTNET_CHAIN_ID = 'hedera:testnet';
export const HEDERA_MAINNET_CHAIN_ID = 'hedera:mainnet';

let signClient: ISignClient | null = null;
let web3Modal: WalletConnectModal | null = null;
let initPromise: Promise<{ signClient: ISignClient; web3Modal: WalletConnectModal }> | null = null;

export function getSignClient(): ISignClient | null {
    return signClient;
}

export async function initHederaWalletConnect() {
    console.log('[WalletConnect Debug] initHederaWalletConnect CALLED');
    if (initPromise) {
        console.log('[WalletConnect Debug] Returning existing initPromise');
        return initPromise;
    }

    initPromise = (async () => {
        try {
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
                const unsubscribe = web3Modal!.subscribeModal(state => {
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
