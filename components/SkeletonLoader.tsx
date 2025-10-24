import React from 'react';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4">
        {/* Disclaimer Skeleton */}
        <div className="flex items-start gap-3 p-3 border-l-4 border-[var(--color-border)] bg-[color:rgb(from_var(--color-border)_r_g_b_/_20%)] rounded-r-lg">
            <div className="w-5 h-5 rounded-full skeleton-base flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded skeleton-base" />
                <div className="h-2 w-full rounded skeleton-base" />
                <div className="h-2 w-5/6 rounded skeleton-base" />
            </div>
        </div>
        {/* Text Skeleton */}
        <div className="space-y-3 pl-3">
            <div className="grid grid-cols-3 gap-3">
                <div className="h-4 rounded skeleton-base col-span-2" />
                <div className="h-4 rounded skeleton-base col-span-1" />
            </div>
            <div className="w-full h-4 rounded skeleton-base" />
            <div className="w-5/6 h-4 rounded skeleton-base" />
            <div className="w-2/3 h-4 rounded skeleton-base" />
        </div>
    </div>
);

export default SkeletonLoader;
