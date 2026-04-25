import React from 'react';

const PageLoading = () => {
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] animate-fade-in">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-black-light animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-grey border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <span className="font-extrabold text-gray-300 text-xl">A</span>
            </div>
            <p className="mt-4 text-sm font-semibold tracking-widest text-gray-300 uppercase animate-pulse">Loading Environment...</p>
        </div>
    );
};

export default PageLoading;
