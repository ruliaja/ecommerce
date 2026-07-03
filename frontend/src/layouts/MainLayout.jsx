import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar selalu di atas */}
      <Navbar />
      
      {/* Konten Halaman akan di-render di sini */}
      <main className="flex-grow pt-16">
        {children}
      </main>

      {/* Footer selalu di bawah */}
      <Footer />
    </div>
  );
};

export default MainLayout;