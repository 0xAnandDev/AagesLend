import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi';

const PremiumSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  withSearch = false,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter options based on search query
  const filteredOptions = withSearch 
    ? options.filter(opt => 
        !opt.isDivider && !opt.isGroup &&
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    if (option.disabled || option.isDivider || option.isGroup) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-[#232d48] text-[#f1f1f1] px-4 py-3 rounded-lg border border-[rgba(255,255,255,0.08)] transition-colors duration-200 ${
          disabled 
            ? ' cursor-not-allowed' 
            : 'hover:bg-[#2b3759] focus:outline-none focus:border-[#a78bfa]'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.icon && <span className="flex-shrink-0 text-xl">{selectedOption.icon}</span>}
          <span className="truncate font-medium text-[15px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <FiChevronDown 
          className={`flex-shrink-0 text-[#888a9b] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={18} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1f3a] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-2xl z-[100] animate-fade-in overflow-hidden flex flex-col">
          
          {/* Search Input */}
          {withSearch && (
            <div className="p-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888a9b]" size={16} />
                <input
                  type="text"
                  className="w-full bg-[#0a0e27] text-sm text-[#f1f1f1] placeholder-[#888a9b] border border-[rgba(255,255,255,0.08)] rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#a78bfa] transition-colors"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <ul 
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {withSearch && filteredOptions.length === 0 ? (
              <li className="px-4 py-4 text-sm text-[#888a9b] text-center">
                No results found
              </li>
            ) : (
              (withSearch ? filteredOptions : options).map((option, idx) => {
                // Render Divider
                if (option.isDivider) {
                  return <li key={`div-${idx}`} className="h-px bg-white/5 my-1" />;
                }
                
                // Render Group Label
                if (option.isGroup) {
                  return (
                    <li key={`group-${idx}`} className="px-4 pt-3 pb-1 text-xs font-semibold text-[#888a9b] uppercase tracking-wider">
                      {option.label}
                    </li>
                  );
                }

                const isSelected = option.value === value;
                
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={`h-[44px] px-4 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                      option.disabled 
                        ? ' cursor-not-allowed' 
                        : 'hover:bg-[#232d48]'
                    } ${isSelected ? 'text-[#a78bfa] bg-[#232d48]/50' : 'text-[#f1f1f1]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && <span className="flex-shrink-0 text-lg">{option.icon}</span>}
                      <span className="text-[15px] font-medium">{option.label}</span>
                    </div>
                    {isSelected && <FiCheck size={16} className="text-[#a78bfa] flex-shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PremiumSelect;
