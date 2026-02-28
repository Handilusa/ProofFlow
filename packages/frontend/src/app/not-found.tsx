import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h2 className="text-6xl font-display font-bold text-accent-primary mb-4">404</h2>
            <p className="text-xl text-white mb-8">Page Not Found</p>
            <Link href="/">
                <Button>Return Home</Button>
            </Link>
        </div>
    );
}
