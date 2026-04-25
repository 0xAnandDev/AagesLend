import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="text-indigo-500 font-mono text-xl mb-2">404</div>
      <h1 className="text-4xl font-bold text-white mb-4">Page not found</h1>
      <p className="text-gray-400 max-w-md mb-8">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-indigo-500/50"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
