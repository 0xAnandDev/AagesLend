import { useState, useEffect } from 'react';

/**
 * Blocks execution cascades natively delaying logic sweeps limits globally
 * @param {any} value - Trigger state
 * @param {number} delay - ms timeout limit (e.g. 500)
 * @returns {any} Delayed state
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
