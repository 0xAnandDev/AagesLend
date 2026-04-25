import React, { useEffect, useState } from 'react';

const AnimatedNumber = ({ value, duration = 500, format = (v) => v, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const endValue = value;
    
    // If the values are basically identical or it's the very first render block, don't animate needlessly
    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart) for that premium deceleration feel
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentVal = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]); // Intentionally not including displayValue in dependency array to avoid cyclic triggers

  return (
    <span className={`inline-block ${className}`}>
      {format(displayValue)}
    </span>
  );
};

export default AnimatedNumber;
