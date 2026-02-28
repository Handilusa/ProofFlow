'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface WalletContextType {
    account: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    error: string | null;
}

const WalletContext = createContext<WalletContextType>({
    account: null,
    isConnected: false,
    isConnecting: false,
    connect: async () => { },
    disconnect: () => { },
    error: null
});

export function WalletProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('proofflow_wallet');
        if (saved) setAccount(saved);

        const provider = (window as any).okxwallet || window.ethereum;
        if (provider) {
            provider.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length === 0) {
                    setAccount(null);
                    localStorage.removeItem('proofflow_wallet');
                } else {
                    setAccount(accounts[0]);
                    localStorage.setItem('proofflow_wallet', accounts[0]);
                }
            });
        }
    }, []);

    const connect = async () => {
        setError(null);

        const provider = (window as any).okxwallet || window.ethereum;

        if (!provider) {
            setError('Compatible Web3 wallet not found. Please install OKX Wallet or MetaMask.');
            window.open('https://www.okx.com/web3', '_blank');
            return;
        }

        setIsConnecting(true);
        try {
            // Request accounts
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            });

            // Switch to Hedera Testnet (chainId 296 = 0x128)
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x128' }],
                });
            } catch (switchError: any) {
                // Chain not added yet, add it
                if (switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x128',
                            chainName: 'Hedera Testnet',
                            nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
                            rpcUrls: ['https://testnet.hashio.io/api'],
                            blockExplorerUrls: [`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}`]
                        }]
                    });
                }
            }

            setAccount(accounts[0]);
            localStorage.setItem('proofflow_wallet', accounts[0]);
        } catch (err: any) {
            if (err.code === 4001) {
                setError('Connection rejected by user.');
            } else {
                setError(err.message || 'Failed to connect wallet.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAccount(null);
        localStorage.removeItem('proofflow_wallet');
    };

    return (
        <WalletContext.Provider value={{
            account,
            isConnected: !!account,
            isConnecting,
            connect,
            disconnect,
            error
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);
