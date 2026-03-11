import { useWallet } from '@/lib/wallet-context';

export default function NetworkBadge() {
    const { network } = useWallet();
    const isMainnet = network === 'mainnet';

    return (
        <div
            className={`flex items-center w-full gap-2 px-3 py-1.5 rounded-full ${isMainnet ? 'bg-success/10 border border-success/20' : 'bg-amber-500/10 border border-amber-500/20'}`}
        >
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMainnet ? 'bg-success' : 'bg-amber-500'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMainnet ? 'bg-success' : 'bg-amber-500'}`} />
            </span>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${isMainnet ? 'text-success' : 'text-amber-500'}`}>
                {isMainnet ? 'MAINNET' : 'TESTNET'}
            </span>
        </div>
    );
}
