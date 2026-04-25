import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX, FiExternalLink } from 'react-icons/fi';

const Toast = ({ id, type, message, hash, onClose, duration = 5000 }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // 300ms matches exit animation duration
    };

    const getStyles = () => {
        switch(type) {
            case 'success':
                return {
                    border: 'border-[#66BB6A]/50',
                    bg: 'bg-[#1A261B]',
                    icon: <FiCheckCircle className="text-[#66BB6A] w-5 h-5" />
                };
            case 'error':
                return {
                    border: 'border-[#EF5350]/50',
                    bg: 'bg-[#2B1B1B]',
                    icon: <FiXCircle className="text-[#EF5350] w-5 h-5" />
                };
            case 'warning':
                return {
                    border: 'border-[#FFC107]/50',
                    bg: 'bg-[#2A2416]',
                    icon: <FiAlertTriangle className="text-[#FFC107] w-5 h-5" />
                };
            default: // info
                return {
                    border: 'border-white/50',
                    bg: 'bg-black-light', // Use theme standard
                    icon: <FiInfo className="text-white w-5 h-5" />
                };
        }
    };

    const style = getStyles();

    return (
        <div 
            className={`pointer-events-auto border ${style.border} ${style.bg} p-4 rounded-xl shadow-2xl flex items-start gap-3 w-[min(calc(100vw-40px),350px)] backdrop-blur-md transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-10' : 'animate-slide-in-right opacity-100 translate-x-0'}`}
        >
            <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
            
            <div className="flex-1 flex flex-col gap-1 pr-6">
                <span className="text-sm font-medium text-gray-300">{message}</span>
                {hash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-white hover:text-white flex items-center gap-1 w-fit transition-colors"
                    >
                        View on Etherscan <FiExternalLink size={10} />
                    </a>
                )}
            </div>
            
            <button 
               onClick={handleClose}
               className="text-white hover:text-white transition-colors absolute top-4 right-4"
            >
                <FiX size={16} />
            </button>
        </div>
    );
};

export default Toast;
