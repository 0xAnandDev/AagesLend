import React from 'react';
import HealthFactorIndicator from './HealthFactorIndicator';

const CollateralSection = ({ collateralAmount, collateralToken, collateralValueUSD, healthFactor, availableBorrow, liquidationPrice }) => {
    return (
        <div className="bg-black-light border border-black/50 shadow-xl rounded-2xl p-8 relative overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-black to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
            
            <h3 className="text-xl font-bold text-gray-300 mb-6 tracking-wide">Your Collateral Backing</h3>
            
            <div className="flex flex-col gap-6 flex-1">
                {/* Collateral Main Display */}
                <div className="flex justify-between items-center bg-black border border-black/40 p-5 rounded-xl shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black border border-black shadow">{collateralToken[0]}</div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-gray-300">{collateralToken}</span>
                            <span className="text-xs text-white uppercase tracking-widest">Active Limit</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-xl tracking-wide text-gray-300">{collateralAmount}</span>
                        <span className="text-sm font-medium text-white">${collateralValueUSD}</span>
                    </div>
                </div>

                <HealthFactorIndicator value={healthFactor} />

                {/* Substats */}
                <div className="border-t border-black/40 pt-5 mt-2 space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium tracking-wide">
                        <span className="text-white">Available Capacity</span>
                        <span className="text-gray-300 font-bold">${availableBorrow}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium tracking-wide">
                        <span className="text-white">Liq. Price Limit</span>
                        <span className="text-gray-300 font-bold">${liquidationPrice}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollateralSection;
