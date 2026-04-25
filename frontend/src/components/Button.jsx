import React from 'react';
import { FiLoader } from 'react-icons/fi';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  // Base structural classes matching Aave Pro
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 tracking-[0.5px] focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Specific color variants and their hover/active states
  const variantStyles = {
    primary: "bg-[#a78bfa] text-white hover:bg-[#8b5cf6] hover:shadow-[0_4px_14px_0_rgba(167,139,250,0.2)] active:bg-[#7c3aed] active:shadow-none border border-transparent",
    secondary: "bg-[#232d48] text-[#f1f1f1] border border-[rgba(255,255,255,0.08)] hover:bg-[#2b3759] hover:border-[rgba(255,255,255,0.15)] hover:shadow-lg active:bg-[#1a1f3a] active:shadow-none",
    danger: "bg-[#ef4444] text-white hover:bg-[#dc2626] hover:shadow-[0_4px_14px_0_rgba(239,68,68,0.2)] active:bg-[#b91c1c] active:shadow-none border border-transparent",
    success: "bg-[#10b981] text-white hover:bg-[#059669] hover:shadow-[0_4px_14px_0_rgba(16,185,129,0.2)] active:bg-[#047857] active:shadow-none border border-transparent",
    ghost: "bg-transparent text-[#a78bfa] hover:bg-[#a78bfa]/10 active:bg-[#a78bfa]/20 border border-transparent"
  };

  // Dimensional scale classes
  const sizeStyles = {
    small: "h-[32px] px-[12px] text-xs",
    medium: "h-[44px] px-[16px] text-sm",
    large: "h-[52px] px-[20px] text-base",
  };

  // Compute final width styling
  const widthStyle = fullWidth ? "w-full" : "w-auto";

  // Spinners size map
  const spinnerSizes = {
    small: 14,
    medium: 18,
    large: 20
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {/* Absolute Loading Spinner overlay */}
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <FiLoader className="animate-spin" size={spinnerSizes[size]} />
        </span>
      )}
      
      {/* 
        Hide children visually when loading so the button retains its 
        calculated natural width based on the original label string.
      */}
      <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
};

export default Button;
