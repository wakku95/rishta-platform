import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, PhoneCall, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-cream-200 border-t border-charcoal-800">
      {/* Trust & Cultural Values Banner */}
      <div className="border-b border-charcoal-800/80 py-8 bg-charcoal-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy-900/80 border border-burgundy-700/50 flex items-center justify-center text-gold-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">100% Private by Default</h4>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  No public phone numbers, emails, addresses, or photos.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy-900/80 border border-burgundy-700/50 flex items-center justify-center text-gold-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Mutual Consent Only</h4>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Contact details are never released unless both candidates agree.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy-900/80 border border-burgundy-700/50 flex items-center justify-center text-gold-400 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Verified Phone Release</h4>
                <p className="text-xs text-charcoal-500 mt-0.5">
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
              <div className="w-8 h-8 rounded-lg bg-burgundy-700 flex items-center justify-center text-gold-300">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-serif text-lg font-bold text-white">
                RaabtaNow
              </span>
            </div>
            <p className="text-xs text-charcoal-400 max-w-sm leading-relaxed mb-4">
              A dignified, privacy-first Pakistani matrimonial discovery platform designed for families and serious individuals. Not a dating app. Search privately and connect with genuine mutual consent.
            </p>
            <div className="text-[11px] text-stone-400 space-y-1 bg-charcoal-800/40 p-3 rounded-xl border border-charcoal-700/60 max-w-sm">
              <p><strong className="text-white">Registered Address:</strong> Sector 48-C, Korangi, Karachi, Sindh, Pakistan</p>
              <p><strong className="text-white">Helpline / Support:</strong> +92 323 9225450</p>
              <p><strong className="text-white">Email:</strong> support@raabtanow.com</p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Platform</h5>
            <ul className="space-y-2 text-xs text-charcoal-400">
              <li><Link to="/how-it-works" className="hover:text-gold-400 transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-gold-400 transition-colors">Pricing & Unlocking (Rs. 300)</Link></li>
              <li><Link to="/about" className="hover:text-gold-400 transition-colors">About Our Mission</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition-colors">Contact Us & Services</Link></li>
              <li><Link to="/register" className="hover:text-gold-400 transition-colors">Register Profile</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Policies & Compliance</h5>
            <ul className="space-y-2 text-xs text-charcoal-400">
              <li><Link to="/privacy-policy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-gold-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-gold-400 transition-colors">Return & Refund Policy</Link></li>
              <li><Link to="/delivery-policy" className="hover:text-gold-400 transition-colors">Service Delivery Policy</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition-colors">Head Office & Support</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-charcoal-800 text-center sm:flex sm:items-center sm:justify-between text-xs text-charcoal-500">
          <p>© {new Date().getFullYear()} RaabtaNow Matrimonial Services. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">
            Strictly matrimonial. Zero tolerance for inappropriate behavior or fake profiles.
          </p>
        </div>
      </div>
    </footer>
  );
}
