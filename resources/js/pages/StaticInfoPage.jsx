import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="burgundy" size="md">Step-by-Step Guide</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">How Rishta Platform Works</h1>
        <p className="text-sm text-charcoal-600">The transparent, dignified discovery process designed for Pakistani families.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-4 text-sm text-charcoal-700 leading-relaxed">
          <h3 className="font-bold text-base text-burgundy-900">1. Registration & Email Verification (Free)</h3>
          <p>Create an account with your email and verify your address. Only verified email accounts can participate in matrimonial matchmaking.</p>

          <h3 className="font-bold text-base text-burgundy-900">2. Profile Creation (Free)</h3>
          <p>Enter your biodata, education, profession, city, and partner preferences. No public photos, exact home address, or phone numbers are ever exposed.</p>

          <h3 className="font-bold text-base text-burgundy-900">3. Search & Discovery (Free)</h3>
          <p>Browse through filtered profiles based on your family preferences. Shortlisting profiles is completely private and free.</p>

          <h3 className="font-bold text-base text-burgundy-900">4. Send Rishta Request (Free)</h3>
          <p>Send a formal Rishta Request to express interest. The recipient receives a polite notification and can review your biodata.</p>

          <h3 className="font-bold text-base text-burgundy-900">5. Recipient Accepts or Declines (Free)</h3>
          <p>The recipient can accept or decline without fee. Mutual interest is only confirmed if the recipient explicitly accepts.</p>

          <h3 className="font-bold text-base text-burgundy-900">6. Paid Contact Unlock (Rs. 300)</h3>
          <p>Only the person who originally sent the proposal is asked to pay Rs. 300 via PayFast to unlock contact details. The recipient never pays.</p>

          <h3 className="font-bold text-base text-burgundy-900">7. SMS OTP & Verified Contact Reveal</h3>
          <p>Both candidates verify their active mobile number via a 6-digit SMS OTP code. Once both are verified, mutual phone numbers are unlocked so communication can continue outside the platform via phone call or WhatsApp.</p>
        </div>
      </Card>
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="gold" size="md">Transparent Pricing</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Simple, Honest Pricing</h1>
        <p className="text-sm text-charcoal-600">No monthly subscriptions. No pay-per-search. Pay only upon mutual interest.</p>
      </div>

      <Card className="text-center p-6 border-burgundy-200">
        <div className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold mb-2">Contact Unlock Fee</div>
        <div className="font-serif text-4xl font-extrabold text-burgundy-800 mb-1">
          Rs. 300 <span className="text-sm font-normal text-charcoal-600">PKR</span>
        </div>
        <p className="text-xs text-charcoal-600 mb-6">One-time micro-fee per mutually accepted proposal.</p>

        <div className="text-left space-y-3 max-w-md mx-auto text-xs text-charcoal-700 bg-cream-100 p-4 rounded-xl border border-cream-200 mb-6">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to register and create profile</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to search and shortlist</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to send Rishta Requests</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to accept or decline requests</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Charged ONLY to original requester after recipient accepts</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Covers secure SMS OTP verification for both sides</div>
        </div>

        <p className="text-[11px] text-charcoal-500">
          Secure payment processed via PayFast (debit/credit card, UnionPay, bank account, and mobile wallets).
        </p>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="burgundy" size="md">Our Mission</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">About Rishta Platform</h1>
        <p className="text-sm text-charcoal-600">Restoring dignity, privacy, and family respect to Pakistani matchmaking.</p>
      </div>

      <Card className="space-y-4 text-sm text-charcoal-700 leading-relaxed">
        <p>
          In modern Pakistan, finding a life partner has become increasingly fraught with anxiety. Traditional matchmaking often involves unregulated intermediaries who circulate personal biodatas and contact numbers across public WhatsApp groups without consent. Conversely, Western dating apps encourage casual swiping and superficial photo browsing incompatible with serious marriage intentions.
        </p>
        <p>
          <strong>Rishta Platform</strong> was built from the ground up to offer a better alternative. We believe matrimonial discovery should be private, mutual, and family-friendly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
          <div className="p-4 bg-cream-100 rounded-xl border border-cream-200">
            <h4 className="font-semibold text-charcoal-900 mb-1">Privacy First</h4>
            <p className="text-xs text-charcoal-600">We do not display public photos, phone numbers, or addresses. Personal information is only revealed when both parties verify mobile numbers after mutual consent.</p>
          </div>
          <div className="p-4 bg-cream-100 rounded-xl border border-cream-200">
            <h4 className="font-semibold text-charcoal-900 mb-1">Solemn Purpose</h4>
            <p className="text-xs text-charcoal-600">Strictly matrimonial. Zero tolerance for casual dating, harassment, or fake accounts. Both self-registered individuals and admin-assisted real families are supported.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
