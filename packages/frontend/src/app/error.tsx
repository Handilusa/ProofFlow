'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h2 className="text-2xl font-display font-bold text-red-400 mb-4">Something went wrong!</h2>
            <Button onClick={() => reset()} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                Try again
            </Button>
        </div>
    );
}
