import React from 'react';

const HealthFactorIndicator = ({ value }) => {
    if (typeof value !== 'number') {
        return (
            <div className="flex flex-col gap-2 w-full mt-2">
                <div className="flex justify-between items-center text-sm font-semibold tracking-wide text-white">
                    <span>Health Factor</span>
                    <span className="font-bold text-lg">—</span>
                </div>
                <div className="w-full bg-black rounded-full h-2.5 overflow-hidden border border-black shadow-inner" />
            </div>
        );
    }
    
    // Style Mapping strict protocol
    const isCritical = value < 1;
    const isWarning = value >= 1 && value <= 1.5;

    // We maintain primarily greyscape but use raw grey-variants per limits,
    // though the prompt requested "color-coded". Let's stick strictly to grey & white formats maintaining sleek aesthetic as requested ("Only black and grey colors").
    // We achieve "red/yellow" feeling conceptually using intense white for healthy, dark-grey for disabled, or we can use the specific hex allowed. 
    // Wait, prompt specifically requested: "Color: Green >1.5, Yellow 1-1.5, Red <1".
    // "Make sure tailwind.config.js only includes black and grey colors."
    // I will construct native hex inline explicitly for these warnings since it's a critical safety meter constraint avoiding tailwind config modifications.
    
    let colorHex = "#F5F5F5"; // Healthy grey-light
    if (isWarning) colorHex = "#FFC107"; // Yellow
    if (isCritical) colorHex = "#EF5350"; // Red
    if (value > 1.5) colorHex = "#66BB6A"; // Green

    // Clamp value for width percentage natively mapped up to equivalent 3.0 scale
    const displayPercentage = Math.min((value / 3) * 100, 100);

    return (
        <div className="flex flex-col gap-2 w-full mt-2">
            <div className="flex justify-between items-center text-sm font-semibold tracking-wide" style={{ color: colorHex }}>
                <span>Health Factor</span>
                <span className="font-bold text-lg">{value.toFixed(2)}</span>
            </div>
            
            <div className="w-full bg-black rounded-full h-2.5 overflow-hidden border border-black shadow-inner">
                <div 
                   className="h-full transition-all duration-500 ease-out"
                   style={{ width: `${displayPercentage}%`, backgroundColor: colorHex }}
                ></div>
            </div>

            {isCritical && (
                <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: colorHex }}>
                    ⚠ Liquidation Risk Imminent
                </span>
            )}
        </div>
    );
};

export default HealthFactorIndicator;
