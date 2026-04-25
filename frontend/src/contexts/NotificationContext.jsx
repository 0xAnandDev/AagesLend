import React, { createContext, useState, useCallback } from 'react';
import Toast from '../components/Notifications/Toast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Max 5 toasts at once constraint handled in UI rendering conceptually, 
  // but we enforce it here by keeping last 5
  const addToast = useCallback((type, message, hash = null) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => {
        const newToasts = [...prev, { id, type, message, hash }];
        if (newToasts.length > 5) return newToasts.slice(newToasts.length - 5);
        return newToasts;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((msg, hash) => addToast('success', msg, hash), [addToast]);
  const error = useCallback((msg) => addToast('error', msg), [addToast]);
  const warning = useCallback((msg) => addToast('warning', msg), [addToast]);
  const info = useCallback((msg) => addToast('info', msg), [addToast]);

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
      {/* Toast Container limits */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
              <Toast 
                 key={toast.id} 
                 id={toast.id} 
                 type={toast.type} 
                 message={toast.message} 
                 hash={toast.hash}
                 onClose={removeToast} 
              />
          ))}
      </div>
    </NotificationContext.Provider>
  );
};
