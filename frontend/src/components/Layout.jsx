import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Layout/Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white/30">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-[80px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        
        <main className="flex-1 md:ml-[240px] relative w-full flex flex-col min-h-[calc(100vh-80px)]">
          <div className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full z-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
