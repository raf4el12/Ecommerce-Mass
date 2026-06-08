import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import WhatsAppButton from '../../button/whatsappbutton';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-grey font-body-md text-on-surface antialiased">
      <PublicHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <WhatsAppButton />
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
