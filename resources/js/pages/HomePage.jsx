import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Server,
  User,
  LogIn,
  UserPlus
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import api from '../api/client';
import useAuth from '../hooks/useAuth';

export default function HomePage() {
  const { user, authenticated } = useAuth();
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
    <div className="space-y-12 sm:space-y-16 py-4">
      
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-10 max-w-3xl mx-auto space-y-6">
        <Badge variant="burgundy" size="md" icon={ShieldCheck} className="mx-auto font-bold border border-burgundy-200 shadow-xs">
          Privacy-First Pakistani Matrimonial Discovery
        </Badge>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal-900 tracking-tight leading-tight">
          Search Privately. <br className="hidden sm:inline" />
          <span className="text-burgundy-700">Connect With Mutual Consent.</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl mx-auto font-medium">
          A respectful, family-oriented rishta discovery platform. No public phone numbers, no public photos, and no dating swipes. Connect only when both sides agree.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {authenticated ? (
            <>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" icon={User} className="w-full sm:w-auto shadow-md">
                  Go to My Dashboard
                </Button>
              </Link>
              <Link to="/how-it-works" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto font-bold">
                  How It Works
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" icon={UserPlus} className="w-full sm:w-auto shadow-md">
                  Create Free Profile
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={LogIn} className="w-full sm:w-auto font-bold">
                  Sign In to Account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-stone-700 pt-3">
          <span className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free Search & Filtering
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free to Send Requests
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free to Accept Requests
          </span>
        </div>
      </section>

      {/* Step-by-Step Business Flow */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-charcoal-900">
            The Golden Matrimonial Flow
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Engineered for solemnity, privacy protection, and mutual respect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {flowSteps.map((step) => (
            <Card key={step.num} className="border-2 border-stone-200 hover:border-burgundy-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-burgundy-700 text-white font-extrabold text-sm flex items-center justify-center shadow-xs border border-burgundy-900/30">
                  {step.num}
                </span>
                <Badge variant={step.badge.includes('Rs') ? 'gold' : step.badge === 'Free' ? 'success' : 'burgundy'} size="sm" className="font-bold">
                  {step.badge}
                </Badge>
              </div>
              <h3 className="font-bold text-charcoal-900 text-base mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {step.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Development & Testing Verification Card */}
      <section className="max-w-2xl mx-auto">
        <Card
          title="Development & Testing Dashboard"
          subtitle="Real-time Laravel 12 API status and implemented Phase 1 authentication checks"
          className="border-2 border-stone-300 shadow-md"
          action={
            <Badge variant={healthData?.status === 'healthy' ? 'success' : 'warning'} size="md" className="font-bold">
              {healthLoading ? 'Checking...' : healthData?.status === 'healthy' ? 'API Online' : 'API Offline'}
            </Badge>
          }
        >
          {healthLoading && (
            <p className="text-xs text-stone-600 animate-pulse font-medium">
              Querying backend /api/health endpoint...
            </p>
          )}

          {healthError && (
            <Alert variant="danger" title="Backend Connection Issue">
              {healthError}
            </Alert>
          )}

          {healthData && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border-2 border-stone-200 font-medium">
                <div>
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">Framework / Version</span>
                  <span className="font-bold text-charcoal-900 text-sm">Laravel 12 ({healthData.version})</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">Unlock Fee</span>
                  <span className="font-bold text-gold-700 text-sm">Rs. {healthData.services?.unlock_fee} {healthData.services?.currency}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">Payment Provider</span>
                  <span className="font-mono font-bold text-charcoal-800">{healthData.services?.payment_driver}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">SMS Driver</span>
                  <span className="font-mono font-bold text-charcoal-800">{healthData.services?.sms_driver}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-burgundy-50 border border-burgundy-200 flex items-center justify-between gap-3">
                <div className="text-burgundy-900">
                  <span className="font-bold block text-xs">Phase 1 Authentication Active</span>
                  <span className="text-[11px] text-burgundy-700">Sanctum SPA cookie authentication, rate limits, and verification links ready.</span>
                </div>
                {authenticated ? (
                  <Link to="/dashboard">
                    <Button variant="primary" size="sm">Open Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button variant="secondary" size="sm">Test Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Cultural Reassurance Banner */}
      <section className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 text-white rounded-3xl p-6 sm:p-10 shadow-md border-2 border-burgundy-950">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto text-gold-300 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight">
            Designed for Dignity & Family Peace of Mind
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl mx-auto font-medium">
            Contact details are protected behind server-side authorization policies, mutual acceptance, and verified mobile numbers. We never compromise candidate privacy.
          </p>
          <div className="pt-2">
            <Link to={authenticated ? "/dashboard" : "/register"}>
              <Button variant="gold" size="lg" className="font-bold shadow-md">
                {authenticated ? "Go to Dashboard" : "Join Rishta Platform Free"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
