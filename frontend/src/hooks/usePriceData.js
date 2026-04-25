import { useContext, useEffect, useState } from 'react';
import { PriceContext } from '../contexts/PriceContext';
import priceService from '../services/priceService';

export const usePriceData = () => {
    const context = useContext(PriceContext);
    if (context === undefined) {
        throw new Error('usePriceData must be used within a PriceProvider');
    }
    return context;
};

export const usePriceHistory = (token, days = 1) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                // days could represent interval maps, for 1 day = 24h
                const data = await priceService.getPriceHistory(token, 1);
                if (isMounted) {
                    setHistory(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (token) {
            fetchHistory();
        }

        return () => { isMounted = false; };
    }, [token, days]);

    return { history, isLoading, error };
};
