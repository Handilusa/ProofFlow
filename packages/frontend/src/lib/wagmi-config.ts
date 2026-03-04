'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    rainbowWallet,
    okxWallet,
    coinbaseWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

// Define Hedera Testnet chain
export const hederaTestnet = defineChain({
    id: 296,
    name: 'Hedera Testnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet.hashio.io/api'] },
    },
    blockExplorers: {
        default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
    },
    testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c149712879ca7cb7a2b50bd933d5b59f';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [
                metaMaskWallet,
                okxWallet,
                coinbaseWallet,
            ],
        },
        {
            groupName: 'Más opciones',
            wallets: [
                rainbowWallet,
                walletConnectWallet,
            ],
        },
    ],
    {
        appName: 'ProofFlow',
        projectId,
    }
);

export const config = createConfig({
    connectors,
    chains: [hederaTestnet],
    transports: {
        [hederaTestnet.id]: http(),
    },
    ssr: true,
});
