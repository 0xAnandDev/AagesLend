import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';

// Storage Key Prefix
const TX_KEY = 'aageslend_txs_';

export const useTransactionHistory = () => {
    const { account } = useWeb3();
    const [transactions, setTransactions] = useState([]);
    
    // Load explicitly from local storage tied to account
    const loadTransactions = useCallback(() => {
        if (!account) {
            setTransactions([]);
            return;
        }
        try {
            const raw = localStorage.getItem(`${TX_KEY}${account.toLowerCase()}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Sort descending by timestamp
                setTransactions(parsed.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error("Failed to load transactions", err);
            setTransactions([]);
        }
    }, [account]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Track a new transaction execution
    const addTransaction = useCallback((tx) => {
        if (!account) return;
        const newTx = {
            id: tx.hash || Date.now().toString(),
            hash: tx.hash || '',
            type: tx.type, // 'Deposit', 'Withdraw', 'Borrow', 'Repay', 'Liquidate'
            token: tx.token,
            amount: tx.amount,
            status: tx.status || 'Pending',
            timestamp: Date.now(),
            gasUsed: tx.gasUsed || null,
        };

        setTransactions(prev => {
            const updated = [newTx, ...prev];
            localStorage.setItem(`${TX_KEY}${account.toLowerCase()}`, JSON.stringify(updated));
            return updated;
        });

        return newTx;
    }, [account]);

    // Update status mapping (e.g. from Pending to Confirmed)
    const updateTransactionStatus = useCallback((hash, newStatus, additionalData = {}) => {
        if (!account) return;
        setTransactions(prev => {
            const updated = prev.map(tx => {
                if (tx.hash === hash) {
                    return { ...tx, status: newStatus, ...additionalData };
                }
                return tx;
            });
            localStorage.setItem(`${TX_KEY}${account.toLowerCase()}`, JSON.stringify(updated));
            return updated;
        });
    }, [account]);

    return {
        transactions,
        addTransaction,
        updateTransactionStatus,
        refresh: loadTransactions
    };
};
