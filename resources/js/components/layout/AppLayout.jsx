import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ThemeToggle from '../ui/ThemeToggle';

/**
 * Mobile-First Root Layout Shell.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-slate-200 selection:bg-magenta-500/30 selection:text-white relative">
      {/* Decorative ambient radial gradients - optimized for mobile 60fps scrolling */}
      <div className="hidden md:block fixed top-0 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-magenta-600/10 rounded-full blur-[140px] pointer-events-none -z-10 will-change-transform" />
      <div className="hidden md:block fixed top-1/3 right-0 translate-x-1/3 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10 will-change-transform" />
      <div className="hidden md:block fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none -z-10 will-change-transform" />

      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <Outlet />
      </main>

      <Footer />

      {/* Floating Theme Switcher at bottom-right */}
      <ThemeToggle />
    </div>
  );
}
