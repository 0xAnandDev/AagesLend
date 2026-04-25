import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-900 rounded-lg border border-gray-800">
      <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
      
      <p className="text-gray-400 mb-6 max-w-md">
        {error?.message || 'An unexpected error occurred while loading this component.'}
      </p>

      {error?.code && (
        <div className="bg-black/50 p-3 rounded-md mb-6 w-full max-w-md text-left">
          <p className="text-sm font-mono text-gray-500 break-all">
            Code: {error.code}
          </p>
        </div>
      )}

      {error?.hash && (
        <div className="bg-black/50 p-3 rounded-md mb-6 w-full max-w-md text-left">
          <p className="text-sm font-mono text-gray-500 break-all">
            Tx Hash: {error.hash}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-indigo-500/50"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700 focus:ring-4 focus:ring-gray-700/50"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;
