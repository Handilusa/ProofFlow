import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
    return <div className={cn('bg-surface-elevated/50 animate-pulse rounded-md', className)} />;
}
