import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

/**
 * Generic specific mapping logic fetching and holding local state array binds 
 * against specific user wallet interactions gracefully.
 * @param {string} address - The active account limit context 
 * @returns {Object} Handlers linking data
 */
export const useUserData = (address) => {
    const [positions, setPositions] = useState({ supplied: [], borrowed: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPositions = useCallback(async () => {
        if (!address) {
            setLoading(false);
            setPositions({ supplied: [], borrowed: [] });
            return;
        }

        try {
            setLoading(true);
            const data = await apiService.getUserPositions(address);
            setPositions(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Error tracking ledger limits');
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    return { positions, loading, error, refetch: fetchPositions };
};
