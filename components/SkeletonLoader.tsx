import React from 'react';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
            <div className="h-4 rounded skeleton-base col-span-2" />
            <div className="h-4 rounded skeleton-base col-span-1" />
        </div>
        <div className="w-full h-4 rounded skeleton-base" />
        <div className="w-5/6 h-4 rounded skeleton-base" />
        <div className="w-full h-4 rounded skeleton-base" />
        <div className="w-2/3 h-4 rounded skeleton-base" />
    </div>
);

export default SkeletonLoader;