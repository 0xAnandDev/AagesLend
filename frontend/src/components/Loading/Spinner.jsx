import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const Spinner = ({ text = "Processing..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-5 h-5 text-white animate-spin" />
            {text && <span className="text-xs font-semibold tracking-widest text-white uppercase">{text}</span>}
        </div>
    );
};

export default Spinner;
