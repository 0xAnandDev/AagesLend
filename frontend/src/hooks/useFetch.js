import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Robust abstract URL request tracker mapping generalized outputs natively mappings
 * @param {string} url - Target fetch URL
 * @param {Object} options - Standard network configs limits 
 * @returns {Object} Data, loading, and error states safely wrapped
 */
export const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Using string map directly circumventing exhaustive-deps infinite loops natively
    const strOpts = JSON.stringify(options);

    const executeFetch = useCallback(async () => {
        if (!url) return;
        setLoading(true);
        try {
            const parsedOpt = JSON.parse(strOpts);
            const response = await axios(url, parsedOpt);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || "AagesLend Network Limit Reverted");
        } finally {
            setLoading(false);
        }
    }, [url, strOpts]);

    useEffect(() => {
        executeFetch();
    }, [executeFetch]);

    return { data, loading, error, refetch: executeFetch };
};
