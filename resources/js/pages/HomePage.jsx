import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  User,
  LogIn,
  UserPlus,
  Search,
  Sparkles,
  Users,
  Shield,
  Heart,
  Quote,
  ChevronRight,
  MapPin,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import ScrollReveal from '../components/ui/ScrollReveal';
import SEOHead from '../components/seo/SEOHead';
import useAuth from '../hooks/useAuth';

export default function HomePage() {
  const { user, authenticated } = useAuth();
  const navigate = useNavigate();

  // Quick Discovery Filter state on Hero
  const [lookingFor, setLookingFor] = useState('female');
  const [selectedCity, setSelectedCity] = useState('');
  const [ageRange, setAgeRange] = useState('21-30');
  const [openFaq, setOpenFaq] = useState(0);

  const faqItems = [
    {
      q: 'What is RaabtaNow and how does online rishta work in Pakistan?',
      a: 'RaabtaNow is a privacy-first Pakistani matrimonial platform created to help individuals and families discover compatible marriage proposals (Nikah). Unlike dating apps, RaabtaNow requires verified email registrations, keeps all photographs and personal contact information completely hidden from the public, and only reveals contact numbers when both sides mutually accept a proposal and verify via SMS OTP.',
    },
    {
      q: 'Is it free to register, search, and send rishta requests?',
      a: 'Yes. It is 100% free to register an account, build your matrimonial biodata, search candidates with demographic filters, shortlist profiles, and send or receive rishta proposal requests. There are no monthly recurring subscriptions.',
    },
    {
      q: 'How does RaabtaNow protect candidate privacy?',
      a: 'Privacy is our founding pillar. No public profile photos are ever shown, preventing photo misuse or scraping. Phone numbers, home addresses, and email addresses remain strictly confidential. Other users only see relevant compatibility details such as age, religion, sect, education, profession, city, and personal values.',
    },
    {
      q: 'When and how are contact details shared between families?',
      a: 'Contact information is never shared automatically. First, candidate A sends a formal proposal request. If candidate B reviews the biodata and explicitly accepts, candidate A pays a one-time micro-fee of Rs. 300 PKR. Both parties then complete SMS OTP verification on their active mobile numbers. Once verified, mutual phone numbers, names, and emails are unlocked on screen.',
    },
    {
      q: 'Is RaabtaNow suitable for families and parents searching for their children?',
      a: 'Absolutely. RaabtaNow was specifically engineered to respect Pakistani family traditions. Profiles can be registered and managed directly by candidates, parents, elder siblings, or guardians who desire a dignified, respectful, and halal search process.',
    },
  ];

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (lookingFor) query.append('gender', lookingFor);
    if (selectedCity) query.append('city', selectedCity);
    if (ageRange) {
      const [min, max] = ageRange.split('-');
      if (min) query.append('min_age', min);
      if (max) query.append('max_age', max);
    }
    navigate(`/search?${query.toString()}`);
  };

  const flowSteps = [
    {
      num: '1',
      title: 'Dignified Private Profile',
      desc: 'Register free and create your verified matrimonial biodata without exposing private contacts.',
      badge: 'Free',
      image: '/images/raabtanow/step-profile-creation.jpg',
      alt: 'Pakistani woman thoughtfully creating a dignified matrimonial biodata on a tablet',
    },
    {
      num: '2',
      title: 'Filter & Shortlist',
      desc: 'Browse serious candidates by city, education, profession, and religious compatibility.',
      badge: 'Free',
      image: '/images/raabtanow/step-search-discovery.jpg',
      alt: 'Father and son reviewing filtered matrimonial candidate profiles together',
    },
    {
      num: '3',
      title: 'Two-Way Mutual Consent',
      desc: 'Send a respectful rishta proposal. No contact information is ever shared without mutual consent.',
      badge: 'Consent',
      image: '/images/raabtanow/step-mutual-proposal.jpg',
      alt: 'Formal matrimonial proposal with gold seal representing mutual honor and consent',
    },
    {
      num: '4',
      title: 'Verified SMS Unlock',
      desc: 'Once mutually accepted, initiator pays Rs. 300 to unlock verified mobile contacts via SMS OTP.',
      badge: 'Rs. 300 Fee',
      image: '/images/raabtanow/step-contact-unlock.jpg',
      alt: 'Smartphone showing verified SMS code and unlocked direct WhatsApp connection',
    },
  ];

  const stories = [
    {
      couple: 'Ayesha & Imran',
      location: 'Lahore',
      tagline: 'Married 1 year ago',
      quote: 'We found each other on RaabtaNow with complete dignity and family involvement. Truly transparent and trustworthy.',
    },
    {
      couple: 'Sana & Ali',
      location: 'Karachi',
      tagline: 'Married 2 years ago',
      quote: 'The platform made our search comfortable for both families. The mutual consent and SMS verification gave total peace of mind.',
    },
    {
      couple: 'Hira & Usman',
      location: 'Islamabad',
      tagline: 'Married 10 months ago',
      quote: 'A breath of fresh air compared to traditional agents. Clean, focused on marriage, and genuine profiles.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-6">
      <SEOHead
        title="Online Rishta in Pakistan | Pakistani Matrimonial Website | RaabtaNow"
        description="RaabtaNow is a privacy-first Pakistani matrimonial platform to discover compatible rishtas online, connect through mutual interest, and build meaningful marriage connections."
        canonicalPath="/"
        isIndexable={true}
      />
      
      {/* =========================================================================
          HERO SECTION (Matching Reference Visual Mood)
          ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-b from-navy-850 via-navy-800 to-navy-900 border border-slate-750/80 p-6 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-black/40">
        {/* Hero background image */}
        <img
          src="/images/raabtanow/hero-couple.jpg"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none select-none"
        />
        {/* Glow ambient spots - disabled on mobile for 60fps scrolling */}
        <div className="hidden sm:block absolute top-0 right-0 w-96 h-96 bg-magenta-500/15 rounded-full blur-[120px] pointer-events-none will-change-transform" />
        <div className="hidden sm:block absolute bottom-0 left-0 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none will-change-transform" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-750 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-magenta-400" />
              <span>Online Rishta in Pakistan — Dignified Matrimonial Platform</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Real People. <br />
                <span className="gradient-text">Meaningful Rishtas.</span> <br />
                Trusted Platform.
              </h1>
              <p className="hero-couplet text-xs sm:text-sm font-serif text-peach-400/90 italic pt-1">
                "رشتہ صرف دو دلوں کے نہیں، دو خاندانوں کے ہوتے ہیں"
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
              Discover compatible marriage proposals across Pakistan with RaabtaNow — where family tradition meets modern privacy technology. Zero public photos, no dating swiping culture, and contact details unlocked strictly with verified mutual consent.
            </p>

            {/* Hero Quick Search Box */}
            <form
              onSubmit={handleHeroSearch}
              className="bg-navy-900/95 sm:backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Looking for
                </label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full bg-navy-800 text-white text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  <option value="female">Bride</option>
                  <option value="male">Groom</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Age Range
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full bg-navy-800 text-white text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  <option value="18-25">18 - 25 yrs</option>
                  <option value="21-30">21 - 30 yrs</option>
                  <option value="26-35">26 - 35 yrs</option>
                  <option value="36-45">36 - 45 yrs</option>
                  <option value="46-60">46+ yrs</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-navy-800 text-white text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-magenta-500 cursor-pointer"
                >
                  <option value="">Any City</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Peshawar">Peshawar</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[42px] justify-center text-xs sm:text-sm font-bold shadow-md"
                  icon={Search}
                >
                  Search Now
                </Button>
              </div>
            </form>

            {/* Four Trust Highlights directly matching reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-850/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-magenta-500/15 border border-magenta-500/30 flex items-center justify-center text-magenta-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Verified Profiles</span>
                  <span className="block text-[10px] text-slate-400 truncate">Email & SMS checks</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-850/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Privacy First</span>
                  <span className="block text-[10px] text-slate-400 truncate">Your data is safe</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-850/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Smart Discovery</span>
                  <span className="block text-[10px] text-slate-400 truncate">Compatible rishtas</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-850/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Family-Friendly</span>
                  <span className="block text-[10px] text-slate-400 truncate">Parent supported</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Hero — Image + Card Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {/* Hero couple image */}
            <div className="relative w-full max-w-sm mb-4 rounded-2xl overflow-hidden shadow-xl hidden lg:block">
              <img
                src="/images/raabtanow/hero-couple.jpg"
                alt="Meaningful connections start with the right introduction"
                loading="eager"
                decoding="async"
                className="w-full h-48 object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-center">
                <p className="text-xs font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Meaningful connections start with the right introduction
                </p>
              </div>
            </div>
            <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-navy-750 to-navy-850 border border-slate-700/80 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">Live Matrimonial Discovery</span>
                </div>
                <Badge variant="magenta" size="sm">Halal & Private</Badge>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-navy-800/90 border border-slate-700/70 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    AK
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-sm">Candidate #RN-7824</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-400">26 yrs • Software Engineer • Lahore</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-magenta-300 bg-magenta-500/10 px-2 py-0.5 rounded-full">
                      Never Married • Sunni
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-navy-800/90 border border-slate-700/70 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    UA
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-sm">Candidate #RN-4519</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-400">29 yrs • Business Executive • Karachi</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                      Master's Degree • Sunni
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center space-y-2">
                <Link to={authenticated ? "/search" : "/register"} className="block w-full">
                  <Button variant="primary" size="md" className="w-full justify-center">
                    {authenticated ? "Browse Verified Candidates" : "Register to Explore Matches"}
                  </Button>
                </Link>
                <p className="text-[11px] text-slate-400">
                  Strictly matrimonial. Zero tolerance for inappropriate behavior.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SUCCESS STORIES (Matching Reference Middle Carousel/Grid)
          ========================================================================= */}
      <section className="space-y-6">
        {/* Success stories hero image banner */}
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[220px] md:h-56 shadow-xl flex items-center">
            <img
              src="/images/raabtanow/success-connection.jpg"
              alt="Families finding happiness through meaningful connections"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[center_30%] sm:object-center"
            />
            {/* Dual-layer responsive dark scrim for rich photo contrast in both themes */}
            <div className="absolute inset-0 bg-black/50 sm:bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-black/30 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/75 sm:to-transparent" />

            <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-lg" data-keep-white>
              <div className="space-y-2">
                <span className="text-xs font-bold text-magenta-400 uppercase tracking-wider block drop-shadow-sm">
                  Heartfelt Journeys
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Success Stories
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Real families who connected with mutual respect and solemn marriage intentions.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map((story, i) => (
            <ScrollReveal key={i} animation="fade-up" delay={i * 90} duration={550}>
              <Card
                className="bg-navy-800/80 border-slate-750 hover:border-magenta-500/40 transition-all p-6 space-y-4 shadow-lg flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-magenta-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {story.couple.split(' ')[0][0]}&{story.couple.split('& ')[1][0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{story.couple}</h3>
                      <p className="text-xs text-slate-400">{story.tagline} • {story.location}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Quote className="w-5 h-5 text-magenta-500/20 absolute -top-1 -left-1 -z-0" />
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10 pl-2">
                      "{story.quote}"
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-750/70 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Matchmaking Union</span>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* =========================================================================
          FAMILY TRUST BANNER (Visual interlude)
          ========================================================================= */}
      <ScrollReveal animation="fade-up" duration={650}>
        <section className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[340px] sm:min-h-[290px] md:h-72 flex items-center">
          <img
            src="/images/raabtanow/family-discussion.jpg"
            alt="Pakistani family discussing rishta in a warm, supportive environment"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-[center_20%] sm:object-center"
          />
          {/* Responsive dark scrim + directional gradient */}
          <div className="absolute inset-0 bg-black/55 sm:bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-black/30 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/75 sm:to-transparent" />

          <div className="relative z-10 w-full p-6 sm:p-10 md:p-12" data-keep-white>
            <div className="space-y-3 max-w-lg">
              <Badge variant="magenta" size="md" className="shadow-md">Family Involvement</Badge>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Where Families Find Trust
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] max-w-md">
                Every rishta journey begins at home. RaabtaNow is built for families who value privacy, respect, and genuine matrimonial intentions.
              </p>
              <div className="pt-1">
                <Link to={authenticated ? "/search" : "/register"}>
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" className="shadow-lg">
                    {authenticated ? "Start Searching" : "Join as a Family"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* =========================================================================
          PAKISTAN-WIDE MATRIMONIAL HORIZONS (Matching Reference Section)
          ========================================================================= */}
      <ScrollReveal animation="fade-up" duration={650}>
        <section className="relative rounded-3xl bg-gradient-to-r from-navy-850 to-navy-800 border border-slate-750/80 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl">
          {/* Pakistan map background */}
          <img
            src="/images/raabtanow/pakistan-nationwide.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
          />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <Badge variant="purple" size="md">Nationwide Reach</Badge>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
                Bringing Hearts Closer Across Pakistan
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                From Karachi to Lahore, Islamabad to Peshawar — and overseas Pakistani communities worldwide. Find compatible proposals from respected families with complete dignity.
              </p>
              <div className="pt-2">
                <Link to="/search">
                  <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                    Explore Matches Across Pakistan
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-navy-800 border border-slate-750/80 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-magenta-500/15 text-magenta-400 flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">For Families</h4>
                <p className="text-[11px] text-slate-400">Respectful & secure</p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-800 border border-slate-750/80 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">For Individuals</h4>
                <p className="text-[11px] text-slate-400">Find your life partner</p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-800 border border-slate-750/80 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">For Parents</h4>
                <p className="text-[11px] text-slate-400">Peace of mind & trust</p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-800 border border-slate-750/80 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">For Everyone</h4>
                <p className="text-[11px] text-slate-400">A better tomorrow</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* =========================================================================
          HOW IT WORKS (4 Step Simplified Flow)
          ========================================================================= */}
      <section className="space-y-8">
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="magenta" size="md">Simple & Transparent</Badge>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              How RaabtaNow Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A dignified 4-step matrimonial discovery flow engineered for privacy and mutual consent.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Illustrated Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {flowSteps.map((step) => (
            <ScrollReveal key={step.num} animation="fade-up" delay={step.num * 90} duration={500}>
              <div className="bg-navy-800 border border-slate-750 rounded-2xl shadow-xl hover:border-magenta-500/50 hover:shadow-2xl hover:shadow-magenta-500/10 transition-all duration-300 h-full overflow-hidden flex flex-col group">
                {/* Step Photographic Illustration */}
                <div className="relative h-48 sm:h-44 md:h-48 w-full overflow-hidden bg-navy-900 shrink-0">
                  <img
                    src={step.image}
                    alt={step.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle dark gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  {/* Step Number Floating Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-magenta-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-lg border border-white/25">
                      {step.num}
                    </span>
                  </div>

                  {/* Step Fee / Consent Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge
                      variant={step.badge.includes('Rs') ? 'gold' : step.badge === 'Free' ? 'success' : 'magenta'}
                      size="sm"
                      className="shadow-md font-bold"
                    >
                      {step.badge}
                    </Badge>
                  </div>
                </div>

                {/* Step Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-2 bg-navy-800">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base tracking-tight mb-1.5 group-hover:text-magenta-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Privacy & Trust Architecture Assurance Banner */}
        <ScrollReveal animation="fade-up" duration={500}>
          <div className="p-5 sm:p-6 rounded-2xl bg-navy-850/80 border border-slate-750 flex flex-col sm:flex-row items-center gap-5 shadow-lg">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-700 shadow-md">
              <img
                src="/images/raabtanow/privacy-trust.jpg"
                alt="Privacy & Trust Architecture"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-serif font-bold text-white text-sm sm:text-base">
                  Strict Privacy Guarantee for Every Family
                </h3>
                <Badge variant="success" size="sm" className="inline-flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>100% Protected</span>
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                No public photos, zero public phone numbers, and no unsolicited contact. Phone details are only unlocked after mutual proposal acceptance, payment verification, and two-way SMS OTP confirmation.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>


      {/* =========================================================================
          FREQUENTLY ASKED QUESTIONS (Authentic SEO & Family Clarity)
          ========================================================================= */}
      <ScrollReveal animation="fade-up" duration={600}>
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="magenta" size="md">Got Questions?</Badge>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, honest answers about online rishta and family matrimonial discovery in Pakistan.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-navy-800 border border-slate-750 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-magenta-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-750/70 pt-3">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Internal descriptive SEO navigation links */}
          <div className="text-center pt-2 text-xs text-slate-400">
            Have more questions about our privacy guarantees?{' '}
            <Link to="/how-it-works" className="text-magenta-400 hover:text-magenta-300 font-semibold underline underline-offset-4">
              Explore our step-by-step rishta process
            </Link>{' '}
            or review our{' '}
            <Link to="/pricing" className="text-magenta-400 hover:text-magenta-300 font-semibold underline underline-offset-4">
              transparent micro-pricing
            </Link>.
          </div>
        </section>
      </ScrollReveal>

      {/* =========================================================================
          CALL TO ACTION FOOTER BANNER
          ========================================================================= */}
      <ScrollReveal animation="fade-up" duration={650}>
        <section className="rounded-3xl bg-gradient-to-r from-magenta-950 via-purple-950 to-navy-900 border border-magenta-500/30 p-6 sm:p-10 lg:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          {/* Decorative background overlay */}
          <img
            src="/images/raabtanow/decorative-background.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none select-none"
          />
          <div className="max-w-2xl mx-auto space-y-4 relative z-10" data-keep-white>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Ready to Begin Your Sacred Journey?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl mx-auto drop-shadow-sm">
              Create your confidential matrimonial biodata today. It is 100% free to search, send requests, and accept connections.
            </p>
            <div className="pt-3">
              <Link to={authenticated ? "/dashboard" : "/register"}>
                <Button variant="primary" size="lg" className="font-bold shadow-lg">
                  {authenticated ? "Open Dashboard" : "Register Free Profile Now"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

    </div>
  );
}
