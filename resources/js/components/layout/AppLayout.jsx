import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Mobile-First Root Layout Shell.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900 selection:bg-burgundy-200 selection:text-burgundy-900">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
