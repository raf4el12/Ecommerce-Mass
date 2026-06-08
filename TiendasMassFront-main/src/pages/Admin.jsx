import React, { useState } from 'react';
import Header from '../admin/components/Header';
import Sidebar from '../admin/components/Sidebar';
import { Outlet } from 'react-router-dom';

const Admin = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-on-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Admin;
