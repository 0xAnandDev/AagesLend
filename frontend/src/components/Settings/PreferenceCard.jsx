import React from 'react';

const PreferenceCard = ({ title, options, value, onChange, isToggle = false, description }) => {
    return (
        <div className="flex items-center justify-between bg-black-light border border-black/40 p-5 rounded-xl shadow">
            <div className="flex flex-col gap-1 pr-4 max-w-[70%]">
                 <span className="font-bold text-sm text-gray-300 tracking-wide">{title}</span>
                 {description && <span className="text-[11px] text-white font-medium tracking-wide leading-tight">{description}</span>}
            </div>
            
            {isToggle ? (
                 <button 
                 onClick={onChange}
                 className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${value ? 'bg-white' : 'bg-black border border-black border-2'}`}
              >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform duration-300 ${value ? 'translate-x-7' : 'translate-x-1 bg-gray-200'}`}></div>
              </button>
            ) : (
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-black border border-black/60 text-white text-xs font-bold tracking-widest uppercase rounded-lg px-3 py-2 outline-none focus:border-white transition cursor-pointer"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default PreferenceCard;
