import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiArrowUpCircle, FiArrowDownCircle, FiBriefcase, FiAlertTriangle, FiSettings, FiActivity, FiBarChart2, FiBox } from 'react-icons/fi';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: FiHome },
        { name: 'Activity', path: '/activity', icon: FiActivity },
      ],
    },
    {
      title: 'Explore',
      items: [
        { name: 'Lend', path: '/lend', icon: FiArrowUpCircle },
        { name: 'Borrow', path: '/borrow', icon: FiArrowDownCircle },
        { name: 'My Loans', path: '/loans', icon: FiBriefcase },
        { name: 'Liquidations', path: '/liquidations', icon: FiAlertTriangle },
      ],
    },
    {
      title: 'Protocol',
      items: [
        { name: 'Insights', path: '/insights', icon: FiBarChart2 },
        { name: 'Test Lab', path: '/test-lab', icon: FiBox },
        { name: 'Settings', path: '/settings', icon: FiSettings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed left-0 top-[80px] h-[calc(100vh-80px)] w-[240px] 
        bg-black-light border-r border-[rgba(128,128,128,0.2)] 
        transition-transform duration-300 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <nav className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1.5">
              <span className="px-2 text-[11px] uppercase tracking-[0.16em] text-gray-400 font-semibold mb-1">
                {section.title}
              </span>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-black-light text-white font-medium'
                          : 'text-gray-300 hover:bg-black-light hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-[17px] h-[17px] mr-3 transition-transform group-hover:scale-110" />
                    <span className="text-[14px]">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
