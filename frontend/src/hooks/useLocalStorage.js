import { useState, useEffect } from 'react';

/**
 * Tracks and saves state tightly integrating with window.localStorage
 * @param {string} key - Lookup limit
 * @param {any} initialValue - Fallback config
 * @returns {[any, Function]} Standard React State tuple securely wrapping local overrides natively.
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn("AagesLend: localStorage mapping failure", error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn("AagesLend: localStorage execution limit blocked ->", error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};
