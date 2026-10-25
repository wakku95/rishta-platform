import React from 'react';

/**
 * Floating Social & Live Chat actions for the Website.
 * Features 3 matching small circular action buttons (Instagram DM, Facebook Messenger, Live Chat)
 * styled in RaabtaNow's theme color with a staggered 3D flip animation (every 5.5s, 1s stagger).
 */
export default function FloatingSocialChat() {
  const handleOpenLiveChat = (e) => {
    e.preventDefault();
    if (window.Tawk_API) {
      if (typeof window.Tawk_API.showWidget === 'function') {
        window.Tawk_API.showWidget();
      }
      if (typeof window.Tawk_API.maximize === 'function') {
        window.Tawk_API.maximize();
      }
    }
  };

  return (
    <aside 
      aria-label="Direct Support & Live Chat"
      className="fixed right-5 sm:right-6 bottom-6 z-30 flex flex-col items-center gap-2.5 sm:gap-3 print:hidden"
    >
      {/* 1. Instagram DM Floating Action */}
      <div className="relative group flex items-center">
        <div 
          role="tooltip"
          className="hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-navy-950/95 text-pink-200 text-xs font-medium whitespace-nowrap border border-pink-500/30 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl backdrop-blur-md"
        >
          Chat on Instagram DM
        </div>

        <a
          href="https://ig.me/m/raabtanow"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with RaabtaNow matchmakers on Instagram Direct Message"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 border border-white/20 hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-navy-900 animate-social-flip-1"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
      </div>

      {/* 2. Facebook Messenger Floating Action */}
      <div className="relative group flex items-center">
        <div 
          role="tooltip"
          className="hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-navy-950/95 text-blue-200 text-xs font-medium whitespace-nowrap border border-blue-500/30 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl backdrop-blur-md"
        >
          Chat on Facebook Messenger
        </div>

        <a
          href="https://m.me/61594211561148"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with RaabtaNow matchmakers on Facebook Messenger"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0084FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20 hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 animate-social-flip-2"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.21V22l3.382-1.856c.917.254 1.888.39 2.883.39 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.73-2.91-5.328 2.91 5.86-6.22 2.795 2.91 5.263-2.91-5.86 6.22z"/>
          </svg>
        </a>
      </div>

      {/* 3. Live Chat Widget Launcher (Theme Color & Matching Size) */}
      <div className="relative group flex items-center">
        <div 
          role="tooltip"
          className="hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-navy-950/95 text-magenta-200 text-xs font-medium whitespace-nowrap border border-magenta-500/30 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl backdrop-blur-md"
        >
          Live Chat Support / رابطہ و رہنمائی
        </div>

        <button
          type="button"
          onClick={handleOpenLiveChat}
          aria-label="Open live matchmaker customer support chat"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-magenta-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-magenta-500/35 border border-white/20 hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-magenta-400 focus:ring-offset-2 focus:ring-offset-navy-900 cursor-pointer animate-social-flip-3"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 9h.01M12 9h.01M16 9h.01" strokeWidth="2.5" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
