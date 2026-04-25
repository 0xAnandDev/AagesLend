import React from 'react';

const NotificationSettings = ({ preferences, setPreferences }) => {
    const handleToggle = (key) => {
        setPreferences(prev => ({...prev, [key]: !prev[key]}));
    };

    const notes = [
        { id: 'email', label: 'General Email Digests', desc: 'Receive weekly updates holding APY changes natively.' },
        { id: 'health', label: 'Health Factor Alerts', desc: 'Priority notifications approaching 1.05 limit mapped natively.' },
        { id: 'liq', label: 'Liquidation Opportunities', desc: 'Live alerts triggering against specific flagged trackers.' },
        { id: 'tx', label: 'Transaction Receipts', desc: 'Confirmation maps directly executing locally.' }
    ];

    return (
        <div className="flex flex-col gap-4">
            {notes.map((sys) => (
                <div key={sys.id} className="flex items-center justify-between bg-black p-4 rounded-xl border border-black/40">
                    <div className="flex flex-col pr-4">
                        <span className="font-bold text-sm text-gray-300 tracking-wide">{sys.label}</span>
                        <span className="text-[11px] text-white font-medium tracking-wide mt-1">{sys.desc}</span>
                    </div>
                    
                    {/* Minimalist Custom Toggle Switch */}
                    <button 
                       onClick={() => handleToggle(sys.id)}
                       className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${preferences[sys.id] ? 'bg-white' : 'bg-black-light border border-black border-2'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform duration-300 ${preferences[sys.id] ? 'translate-x-7' : 'translate-x-1 bg-gray-200 shadow-inner'}`}></div>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationSettings;
