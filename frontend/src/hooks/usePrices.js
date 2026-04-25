import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';

/**
 * Mapped wrapper maintaining 10-second price ticks tracking actively configured token values
 * @param {string[]} tokens - Array limits 
 * @returns {Object} Extracted price matrix 
 */
export const usePrices = (tokens = []) => {
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    const fetchPrices = useCallback(async () => {
        try {
            const data = await apiService.getTokenPrices(tokens);
            setPrices(data);
            setLastUpdate(Date.now());
            setError(null);
        } catch (err) {
            setError(err.message || 'Price Oracle feeds disconnected globally');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokens.join(',')]);

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 10000); // 10s auto tick
        return () => clearInterval(interval);
    }, [fetchPrices]);

    return { prices, loading, error, lastUpdate, refetch: fetchPrices };
};
