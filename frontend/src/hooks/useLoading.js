import { useState, useCallback } from 'react';

/**
 * Universal tracking logic tracking multi-threaded operations synchronously cleanly
 * @returns {Object} Management controls tracking
 */
export const useLoading = () => {
    const [operations, setOperations] = useState({});

    // Returns true if ANY mapped op limits are true natively
    const isLoading = Object.values(operations).some(val => val === true);

    const startLoading = useCallback((key) => {
        setOperations(prev => ({ ...prev, [key]: true }));
    }, []);

    const stopLoading = useCallback((key) => {
        setOperations(prev => ({ ...prev, [key]: false }));
    }, []);

    return { isLoading, startLoading, stopLoading, operations };
};
