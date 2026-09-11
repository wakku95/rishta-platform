import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, HeartHandshake, User, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import useAuth from '../../hooks/useAuth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, authenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ];

  if (authenticated) {
    navLinks.push({ name: 'Find Matches', href: '/search' });
    navLinks.push({ name: 'Shortlist', href: '/shortlist' });
    navLinks.push({ name: 'Requests', href: '/requests' });
    navLinks.push({ name: 'Dashboard', href: '/dashboard' });
    navLinks.push({ name: 'My Profile', href: '/profile' });
  }

  return (
    <header className="sticky top-0 z-40 bg-navy-900 md:bg-navy-900/80 md:backdrop-blur-xl border-b border-slate-800/80 md:shadow-lg md:shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
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
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-navy-750 text-white font-semibold border border-magenta-500/30 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {authenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="gold" size="sm" icon={ShieldCheck}>
                      Admin Portal
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="secondary" size="sm" icon={User}>
                    Dashboard ({user?.name ? user.name.split(' ')[0] : 'User'})
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-750 bg-navy-800 text-slate-200 hover:text-white hover:bg-navy-750 focus:outline-none focus:ring-2 focus:ring-magenta-500 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-navy-900/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 shadow-2xl">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy-750 text-white border border-magenta-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            {authenticated ? (
              <>
                {user?.role === 'admin' && (
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

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy-First Matrimonial Discovery</span>
          </div>
        </div>
      )}
    </header>
  );
}
