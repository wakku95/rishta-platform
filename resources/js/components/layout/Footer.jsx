import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, PhoneCall, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-slate-800">
      {/* Trust & Cultural Values Banner */}
      <div className="border-b border-slate-800/80 py-8 bg-navy-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 border border-slate-750 flex items-center justify-center text-magenta-400 shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Private by Default</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  No public phone numbers, emails, addresses, or photos.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 border border-slate-750 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Mutual Consent Only</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contact details are never released unless both candidates agree.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 border border-slate-750 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Verified Phone Release</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  SMS OTP verification required for both sides before contact reveal.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold text-white">
                Raabta<span className="text-magenta-400">Now</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              A dignified, privacy-first Pakistani matrimonial discovery platform designed for families and serious individuals. Not a dating app. Search privately and connect with genuine mutual consent.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 bg-navy-900 p-3.5 rounded-xl border border-slate-800 max-w-sm">
              <p><strong className="text-white">Registered Address:</strong> Sector 48-C, Korangi, Karachi, Sindh, Pakistan</p>
              <p><strong className="text-white">Helpline / Support:</strong> +92 323 9225450</p>
              <p><strong className="text-white">Email:</strong> support@raabtanow.com</p>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <a 
                href="https://www.facebook.com/p/Raabta-Now-61594211561148/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                title="Follow RaabtaNow on Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current text-blue-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
              <a 
                href="https://www.instagram.com/raabtanow/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-pink-500/50 hover:bg-pink-500/10 transition-colors"
                title="Follow RaabtaNow on Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current text-pink-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Platform</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/how-it-works" className="hover:text-magenta-400 transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-magenta-400 transition-colors">Pricing & Unlocking (Rs. 300)</Link></li>
              <li><Link to="/about" className="hover:text-magenta-400 transition-colors">About Our Mission</Link></li>
              <li><Link to="/contact" className="hover:text-magenta-400 transition-colors">Contact Us & Services</Link></li>
              <li><Link to="/register" className="hover:text-magenta-400 transition-colors">Register Profile</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Policies & Compliance</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/privacy-policy" className="hover:text-magenta-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-magenta-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-magenta-400 transition-colors">Return & Refund Policy</Link></li>
              <li><Link to="/delivery-policy" className="hover:text-magenta-400 transition-colors">Service Delivery Policy</Link></li>
              <li><Link to="/contact" className="hover:text-magenta-400 transition-colors">Head Office & Support</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RaabtaNow Matrimonial Services. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">
            Strictly matrimonial. Zero tolerance for inappropriate behavior or fake profiles.
          </p>
        </div>
      </div>
    </footer>
  );
}
