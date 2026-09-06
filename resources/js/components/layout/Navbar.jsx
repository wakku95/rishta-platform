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
    navLinks.push({ name: 'Dashboard', href: '/dashboard' });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-burgundy-700 flex items-center justify-center text-white shadow-xs group-hover:bg-burgundy-800 transition-colors">
              <HeartHandshake className="w-5 h-5 text-gold-300" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-burgundy-900 block leading-tight">
                Rishta Platform
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-gold-600 block uppercase tracking-wider">
                Privacy-First Matrimonial
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-charcoal-700">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`transition-colors hover:text-burgundy-700 ${
                  location.pathname === link.href ? 'text-burgundy-700 font-semibold' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            {authenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" icon={User}>
                    {user?.name ? user.name.split(' ')[0] : 'Dashboard'}
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
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
                    Create Free Profile
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
              className="p-2 rounded-xl text-charcoal-700 hover:bg-cream-200 focus:outline-none focus:ring-2 focus:ring-burgundy-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-cream-100/95 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'bg-burgundy-50 text-burgundy-800 font-semibold'
                    : 'text-charcoal-800 hover:bg-cream-200'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-cream-200 flex flex-col gap-2">
            {authenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center" icon={User}>
                    My Dashboard
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
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    Create Free Profile
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-charcoal-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Search Privately. Connect With Consent.</span>
          </div>
        </div>
      )}
    </header>
  );
}
