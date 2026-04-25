import React from 'react';

// Skeletons are universally grey mimicking the design scope limits using fast CSS pulses
export const SkeletonLoader = ({ className = "" }) => {
    return (
        <div className={`animate-pulse bg-[#262626] rounded-md ${className}`}></div>
    );
};

export const SkeletonCard = () => (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full flex flex-col gap-4">
        <SkeletonLoader className="h-4 w-1/3" />
        <SkeletonLoader className="h-8 w-1/2 mt-2" />
        <div className="border-t border-black/50 pt-4 flex justify-between">
           <SkeletonLoader className="h-3 w-1/4" />
           <SkeletonLoader className="h-3 w-1/4" />
        </div>
    </div>
);

export const SkeletonChart = () => (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full h-[320px] flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <SkeletonLoader className="h-6 w-1/4" />
            <SkeletonLoader className="h-6 w-[120px] rounded-lg" />
        </div>
        <div className="flex-1 w-full bg-[#1A1A1A] rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 border-b border-[#333333]/30"></div>
            <div className="absolute top-1/4 w-full border-b border-[#333333]/30"></div>
            <div className="absolute top-2/4 w-full border-b border-[#333333]/30"></div>
            <div className="absolute top-3/4 w-full border-b border-[#333333]/30"></div>
            <SkeletonLoader className="absolute bottom-0 w-full h-1/2 opacity-20 rounded-none bg-gradient-to-t from-[#262626] to-transparent" />
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="w-full">
        <div className="flex justify-between mb-4 border-b border-black/50 pb-2">
            <SkeletonLoader className="h-4 w-1/5" />
            <SkeletonLoader className="h-4 w-1/5" />
            <SkeletonLoader className="h-4 w-1/5" />
            <SkeletonLoader className="h-4 w-1/5" />
        </div>
        <div className="flex flex-col gap-4">
            {Array.from({ length: rows }).map((_, i) => (
               <div key={i} className="flex justify-between items-center p-3">
                   <div className="flex items-center gap-3 w-1/5">
                       <SkeletonLoader className="h-8 w-8 rounded-full" />
                       <SkeletonLoader className="h-4 w-16" />
                   </div>
                   <SkeletonLoader className="h-4 w-1/5" />
                   <SkeletonLoader className="h-4 w-1/5" />
                   <SkeletonLoader className="h-8 w-1/5 rounded-xl" />
               </div>
            ))}
        </div>
    </div>
);
