import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiArrowUpCircle, FiArrowDownCircle, FiBriefcase, FiAlertTriangle, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import WalletConnect from '../Common/WalletConnect';

const navItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Lend', path: '/lend', icon: FiArrowUpCircle },
    { name: 'Borrow', path: '/borrow', icon: FiArrowDownCircle },
    { name: 'My Loans', path: '/loans', icon: FiBriefcase },
    { name: 'Liquidations', path: '/liquidations', icon: FiAlertTriangle },
    { name: 'Settings', path: '/settings', icon: FiSettings },
];

const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close logic mapped directly to location transitions safely routing
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Screen locking logic mapped to overlay bounds properly preventing underneath scrolls
    useEffect(() => {
        if(isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.overflowX = 'hidden'; // preserve app setup limits
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
            document.body.style.overflowX = 'hidden';
        };
    }, [isOpen]);

    return (
        <div className="md:hidden z-50">
            {/* Top Bar Header Standard Mapping replacing old app block */}
            <div className="flex items-center justify-between p-4 border-b border-black-light bg-black sticky top-0 w-full z-40 shadow">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-black border border-black shadow">A</div>
                   <span className="font-bold tracking-wide text-gray-300 text-lg">AagesLend</span>
                </div>
                <button 
                   onClick={() => setIsOpen(true)}
                   className="p-2.5 bg-black-light rounded-xl border border-black/50 hover:bg-black transition-colors"
                >
                   <FiMenu className="w-6 h-6 text-gray-300" />
                </button>
            </div>

            {/* Backdrop Drawer Logic */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-[2px] z-[60] transition-opacity animate-fade-in" 
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Side Render Push bounds tracking exactly to the right mapped limit */}
            <div className={`fixed top-0 right-0 h-full w-[280px] bg-black border-l border-black-light shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                 <div className="flex items-center justify-between p-5 border-b border-black-light bg-black h-20">
                     <span className="font-bold tracking-widest uppercase text-white text-sm">Navigation</span>
                     <button onClick={() => setIsOpen(false)} className="p-2 text-white hover:text-white transition-colors bg-black-light rounded-full border border-black/50 hover:bg-black">
                        <FiX className="w-5 h-5" />
                     </button>
                 </div>

                 <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto w-full">
                    {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center px-4 py-4 rounded-xl transition-colors ${
                            isActive 
                            ? 'bg-black-light text-gray-300 font-bold shadow-inner border border-black/50' 
                            : 'hover:bg-black-light/50 text-white hover:text-gray-300 border border-transparent'
                            }`
                        }
                        >
                        <Icon className="w-5 h-5 mr-4" />
                        <span className="tracking-wide text-[15px]">{item.name}</span>
                        </NavLink>
                    );
                    })}
                </nav>

                <div className="p-5 border-t border-black-light bg-black pb-8">
                    <WalletConnect />
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;
