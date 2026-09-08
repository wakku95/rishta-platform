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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-burgundy-700 flex items-center justify-center text-white shadow-sm border border-burgundy-900/30 group-hover:bg-burgundy-800 transition-colors">
              <HeartHandshake className="w-6 h-6 text-gold-300" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-burgundy-900 block leading-tight">
                Rishta Platform
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-gold-600 block uppercase tracking-wider">
                Privacy-First Matrimonial
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-burgundy-50 text-burgundy-900 font-bold border-2 border-burgundy-200 shadow-xs'
                      : 'text-charcoal-700 hover:text-burgundy-800 hover:bg-stone-100'
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
                  <Button variant="secondary" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register Free
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
              className="p-2.5 rounded-xl border-2 border-stone-300 text-charcoal-800 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-700 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-burgundy-50 text-burgundy-900 border-2 border-burgundy-200'
                      : 'text-charcoal-800 hover:bg-stone-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t-2 border-stone-100 flex flex-col gap-2.5">
            {authenticated ? (
              <>
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

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacy-First Matrimonial Discovery</span>
          </div>
        </div>
      )}
    </header>
  );
}
