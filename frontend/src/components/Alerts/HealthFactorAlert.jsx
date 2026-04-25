import React, { useState } from 'react';
import { FiAlertOctagon, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const HealthFactorAlert = ({ healthFactor }) => {
    const [dismissed, setDismissed] = useState(false);
    const navigate = useNavigate();

    // Only show when live numeric HF is below threshold.
    if (typeof healthFactor !== 'number' || healthFactor >= 1.5 || dismissed) return null;

    const isCritical = healthFactor < 1;

    return (
        <div className={`mb-6 rounded-xl border p-4 shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
            isCritical 
            ? 'bg-[#2B1B1B] border-[#EF5350]/50' 
            : 'bg-[#2A2416] border-[#FFC107]/50'
        }`}>
            <div className="flex items-start md:items-center gap-3">
                <div className={`mt-0.5 md:mt-0 p-2 rounded-full ${isCritical ? 'bg-[#EF5350]/20' : 'bg-[#FFC107]/20'}`}>
                    <FiAlertOctagon className={`w-5 h-5 ${isCritical ? 'text-[#EF5350]' : 'text-[#FFC107]'}`} />
                </div>
                <div>
                    <h4 className={`font-bold tracking-wide ${isCritical ? 'text-[#EF5350]' : 'text-[#FFC107]'}`}>
                        {isCritical ? 'CRITICAL: Position Liquidatable' : 'WARNING: Health Factor Low'}
                    </h4>
                    <p className="text-sm text-white mt-1">
                        Your health factor has dropped to <span className="font-bold text-white">{healthFactor.toFixed(2)}</span>. 
                        {isCritical ? ' Your collateral is at risk of liquidation.' : ' Please deposit more collateral or repay debt to avoid liquidation.'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => navigate('/lend')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      isCritical 
                      ? 'bg-[#EF5350] hover:bg-[#EF5350]/80 text-white' 
                      : 'bg-[#FFC107] hover:bg-[#FFC107]/80 text-black'
                  }`}
                >
                    Add Collateral
                </button>
                <button 
                   onClick={() => setDismissed(true)}
                   className="p-2 text-white hover:text-white transition-colors"
                   aria-label="Dismiss"
                >
                    <FiX size={20} />
                </button>
            </div>
        </div>
    );
};

export default HealthFactorAlert;
