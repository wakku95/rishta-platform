import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, HeartHandshake, User, LogOut, Smartphone, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationBell from '../notifications/NotificationBell';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { getRequestCounts } from '../../api/requests';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const toolsDropdownRef = useRef(null);
  const location = useLocation();
  const { user, authenticated, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Fetch pending proposals count for badge
  useEffect(() => {
    if (!authenticated) {
      setPendingProposalsCount(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        const res = await getRequestCounts();
        if (res.success && res.data) {
          setPendingProposalsCount(res.data.pending_received || 0);
        }
      } catch (e) {
        // quiet ignore
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 45000);
    return () => clearInterval(interval);
  }, [authenticated, location.pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
  }, [location.pathname]);

  // Close tools dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu / dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (toolsDropdownOpen) setToolsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, toolsDropdownOpen]);

  const desktopNavLinks = authenticated
    ? [
        { name: 'Find Matches', href: '/search' },
        { name: 'Proposals', href: '/requests' },
        { name: 'Shortlist', href: '/shortlist' },
        { name: 'My Profile', href: '/profile' },
      ]
    : [
        { name: 'Find Matches', href: '/search' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
      ];

  const mobileNavLinks = authenticated
    ? [
        { name: 'Find Matches', href: '/search' },
        { name: 'Proposals', href: '/requests' },
        { name: 'Shortlist', href: '/shortlist' },
        { name: 'My Profile', href: '/profile' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
      ]
    : [
        { name: 'Find Matches', href: '/search' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
      ];

  return (
    <header className="sticky top-0 z-40 bg-navy-900 md:bg-navy-900/80 md:backdrop-blur-xl border-b border-slate-800/80 md:shadow-lg md:shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-magenta-500/25 border border-white/20 group-hover:scale-105 transition-all duration-200">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white block leading-tight">
                Raabta<span className="text-magenta-400">Now</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Privacy-First Matrimonial
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            {desktopNavLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const isProposals = link.name === 'Proposals';
              const showBadge = isProposals && pendingProposalsCount > 0;

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-150 whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-magenta-500/15 text-magenta-400 font-semibold border border-magenta-500/30 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                  }`}
                >
                  <span>{link.name}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-magenta-500 text-white shadow-xs">
                      {pendingProposalsCount > 99 ? '99+' : pendingProposalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {authenticated ? (
              <>
                {['admin', 'staff'].includes(user?.role) && (
                  <Link to="/admin" className="shrink-0">
                    <Button variant="gold" size="sm" icon={ShieldCheck} className="whitespace-nowrap font-bold">
                      Admin
                    </Button>
                  </Link>
                )}
                <NotificationBell />
                <Link to="/dashboard" className="shrink-0">
                  <Button variant="secondary" size="sm" icon={User} className="whitespace-nowrap">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={LogOut} 
                  onClick={logout} 
                  className="whitespace-nowrap text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="shrink-0">
                  <Button variant="ghost" size="sm" className="whitespace-nowrap">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" className="shrink-0">
                  <Button variant="primary" size="sm" className="whitespace-nowrap">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}

            {/* Desktop Unified Dropdown: App, WhatsApp, Theme */}
            <div className="relative shrink-0" ref={toolsDropdownRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                aria-expanded={toolsDropdownOpen}
                aria-haspopup="true"
                title="Quick Options: App, WhatsApp & Theme"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-navy-800 text-slate-200 hover:text-white hover:bg-navy-750 border border-slate-700/80 transition-all shrink-0 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-magenta-500/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-magenta-400" />
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-navy-850/98 backdrop-blur-xl border border-slate-750 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-750/70 mb-1">
                    Quick Options
                  </div>

                  {/* 1. App Theme Toggle */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-navy-750 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 border border-slate-700 flex items-center justify-center shrink-0">
                        {isDark ? (
                          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                          <Moon className="w-4 h-4 text-purple-400 group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">App Theme</div>
                        <div className="text-[11px] text-slate-400">
                          {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy-900 border border-slate-700 text-slate-300 group-hover:border-slate-600">
                      Switch
                    </span>
                  </button>

                  <div className="h-px bg-slate-750/60 my-1" />

                  {/* 2. Live Chat on Instagram */}
                  <a
                    href="https://ig.me/m/raabtanow"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-navy-750 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-current text-pink-400" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">
                          Chat on Instagram
                        </div>
                        <div className="text-[11px] text-slate-400">@raabtanow • Direct DM</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/25 text-pink-300">
                      DM
                    </span>
                  </a>

                  {/* 3. Live Chat on Facebook Messenger */}
                  <a
                    href="https://m.me/61594211561148"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-navy-750 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          Facebook Messenger
                        </div>
                        <div className="text-[11px] text-slate-400">Official Page Chat</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-300">
                      Chat
                    </span>
                  </a>

                  <div className="h-px bg-slate-750/60 my-1" />

                  {/* 4. Android App Download */}
                  <a
                    href="/downloads/raabtanow.apk"
                    download="raabtanow.apk"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-navy-750 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          Download App
                        </div>
                        <div className="text-[11px] text-slate-400">Android APK File</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                      .APK
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Bar: Notification Bell + Theme Toggle + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            {authenticated && <NotificationBell />}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-750 bg-navy-800 text-slate-200 hover:text-white hover:bg-navy-750 focus:outline-none focus:ring-2 focus:ring-magenta-500 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop Overlay for Outside-Click Dismiss */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 sm:top-20 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="relative z-40 md:hidden border-t border-slate-800 bg-navy-900/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 shadow-2xl"
        >
          <div className="space-y-1">
            {mobileNavLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const isProposals = link.name === 'Proposals';
              const showBadge = isProposals && pendingProposalsCount > 0;

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-magenta-500/15 text-magenta-400 border border-magenta-500/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  <span>{link.name}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-magenta-500 text-white shadow-xs">
                      {pendingProposalsCount > 99 ? '99+' : pendingProposalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            {authenticated ? (
              <>
                {['admin', 'staff'].includes(user?.role) && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gold" className="w-full justify-center" icon={ShieldCheck}>
                      Admin Control Portal
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center" icon={User}>
                    Go to My Dashboard
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  icon={LogOut}
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full justify-center">
                    Log In to Account
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    Register Free Profile
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://ig.me/m/raabtanow"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/15 border border-pink-500/35 text-pink-300 font-bold text-xs hover:bg-pink-500/25 transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current text-pink-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram DM</span>
              </a>
              <a
                href="https://m.me/61594211561148"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-300 font-bold text-xs hover:bg-blue-500/25 transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current text-blue-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook Chat</span>
              </a>
            </div>
            <a
              href="/downloads/raabtanow.apk"
              download="raabtanow.apk"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/35 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all shadow-xs"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Download Android App (.APK)</span>
            </a>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy-First Matrimonial Discovery</span>
          </div>
        </div>
      )}
    </header>
  );
}
