import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

/**
 * Custom React wrapper hook mapped natively over Pool logic mechanisms.
 * @returns {Object} Data bindings holding stats, loading signals, and manual refresh controls.
 */
export const usePoolData = () => {
    const [poolStats, setPoolStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPool = useCallback(async () => {
        try {
            // Skips loading limits natively on cached refires directly modifying background updates
            if(!poolStats) setLoading(true);
            const data = await apiService.getPoolStats();
            setPoolStats(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Pool tracking connection dropped');
        } finally {
            setLoading(false);
        }
    }, [poolStats]);

    useEffect(() => {
        fetchPool();
        // 30 seconds interval logic mappings
        const interval = setInterval(fetchPool, 30000);
        return () => clearInterval(interval);
    }, [fetchPool]);

    return { poolStats, loading, error, refetch: fetchPool };
};
