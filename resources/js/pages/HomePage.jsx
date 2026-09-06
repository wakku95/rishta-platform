import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Server,
  PhoneCall,
  CreditCard,
  UserCheck
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import api from '../api/client';

export default function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setHealthData(res.data.data);
        setHealthLoading(false);
      })
      .catch((err) => {
        setHealthError(err.response?.data?.message || err.message);
        setHealthLoading(false);
      });
  }, []);

  const flowSteps = [
    {
      num: '1',
      title: 'Free Registration & Profile',
      desc: 'Verify your email and build your private matrimonial biodata. 100% free.',
      badge: 'Free',
    },
    {
      num: '2',
      title: 'Dignified Discovery',
      desc: 'Search by city, education, profession, and religious alignment without exposing sensitive data.',
      badge: 'Free',
    },
    {
      num: '3',
      title: 'Send Rishta Request',
      desc: 'Express formal interest with a respectful proposal. Free to send and free to accept.',
      badge: 'Free',
    },
    {
      num: '4',
      title: 'Mutual Acceptance',
      desc: 'Recipient reviews your profile and accepts. Mutual interest confirmed.',
      badge: 'Consent',
    },
    {
      num: '5',
      title: 'Requester Unlocks Contact',
      desc: 'Only the original request sender pays Rs. 300 via PayFast. Recipient never pays.',
      badge: 'Rs. 300 Fee',
    },
    {
      num: '6',
      title: 'Dual OTP Mobile Verification',
      desc: 'Both parties verify mobile numbers before verified contact release.',
      badge: 'Protected',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-10 max-w-3xl mx-auto space-y-5">
        <Badge variant="burgundy" size="md" icon={ShieldCheck} className="mx-auto">
          Privacy-First Pakistani Matrimonial Platform
        </Badge>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal-900 tracking-tight leading-tight">
          Search Privately. <br className="hidden sm:inline" />
          <span className="text-burgundy-700">Connect With Mutual Consent.</span>
        </h1>

        <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed max-w-2xl mx-auto">
          A respectful, family-oriented rishta discovery platform. No public phone numbers, no public photos, and no swiping. Connect only when both sides agree.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={HeartHandshake} className="w-full sm:w-auto">
              Create Matrimonial Profile
            </Button>
          </Link>
          <Link to="/how-it-works" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
              How It Works
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-charcoal-600 pt-3">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free Search & Filtering
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free to Send Requests
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free to Accept Requests
          </span>
        </div>
      </section>

      {/* Step-by-Step Business Flow */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="font-serif text-2xl font-bold text-charcoal-900">
            The Golden Matrimonial Flow
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600">
            Engineered for solemnity, privacy protection, and mutual respect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {flowSteps.map((step) => (
            <Card key={step.num} className="hover:border-burgundy-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-full bg-burgundy-700 text-white font-bold text-xs flex items-center justify-center">
                  {step.num}
                </span>
                <Badge variant={step.badge.includes('Rs') ? 'gold' : step.badge === 'Free' ? 'success' : 'burgundy'} size="sm">
                  {step.badge}
                </Badge>
              </div>
              <h3 className="font-semibold text-charcoal-900 text-sm sm:text-base mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                {step.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Backend Health Check Verification Card */}
      <section className="max-w-2xl mx-auto">
        <Card
          title="Phase 0 Architecture Verification"
          subtitle="Real-time Laravel 12 API status and decoupled provider resolution"
          action={
            <Badge variant={healthData?.status === 'healthy' ? 'success' : 'warning'} size="sm">
              {healthLoading ? 'Checking...' : healthData?.status || 'Offline'}
            </Badge>
          }
        >
          {healthLoading && (
            <p className="text-xs text-charcoal-600 animate-pulse">
              Querying backend /api/health endpoint...
            </p>
          )}

          {healthError && (
            <Alert variant="danger" title="Backend Connection Issue">
              {healthError}
            </Alert>
          )}

          {healthData && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-cream-100 p-3 rounded-xl border border-cream-200">
                <div>
                  <span className="text-charcoal-500 block">Framework & Version:</span>
                  <span className="font-semibold text-charcoal-800">Laravel 12 / {healthData.version}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Unlock Fee:</span>
                  <span className="font-semibold text-gold-700">Rs. {healthData.services?.unlock_fee} {healthData.services?.currency}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Payment Abstraction:</span>
                  <span className="font-mono text-charcoal-800">{healthData.services?.payment_driver}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">SMS Gateway:</span>
                  <span className="font-mono text-charcoal-800">{healthData.services?.sms_driver}</span>
                </div>
              </div>
              <p className="text-[11px] text-charcoal-500 text-center">
                Sanctum SPA cookie authentication, decoupled payment gateway, and SMS OTP interfaces active.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Cultural Reassurance Banner */}
      <section className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 text-white rounded-3xl p-6 sm:p-10 shadow-md">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-gold-300">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Designed for Dignity & Family Peace of Mind
          </h2>
          <p className="text-xs sm:text-sm text-cream-200/90 leading-relaxed max-w-xl mx-auto">
            Your contact details are protected behind server-side authorization policies, mutual acceptance, and verified mobile numbers. We never compromise candidate privacy.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button variant="gold" size="lg">
                Join Rishta Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
