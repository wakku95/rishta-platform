import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, CheckCircle2, HeartHandshake, PhoneCall, Mail, Clock, MapPin, Eye, Sparkles, MessageCircle, ArrowRight, UserCheck, Search, FileText, Camera } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

export function HowItWorksPage() {
  const steps = [
    {
      num: '1',
      badge: 'Free Registration',
      badge_ur: 'مفت رجسٹریشن',
      badgeVariant: 'success',
      title: 'Dignified Private Profile Creation',
      title_ur: 'باوقار اور پرائیویٹ بائیوڈیٹا کی تیاری',
      image: '/images/raabtanow/step-profile-creation.jpg',
      alt: 'Pakistani candidate creating a dignified matrimonial biodata on a tablet',
      desc: 'Create your account for free and fill in your comprehensive matrimonial biodata—education, profession, religious sect, family background, and partner preferences. No public photos, phone numbers, or residential addresses are ever exposed or indexed on search engines.',
      desc_ur: 'بغیر کسی فیس کے باآسانی اپنا اکاؤنٹ بنائیں اور روایات کے مطابق مکمل خاندانی بائیوڈیٹا درج کریں—تعلیم، پیشہ، مسلک، خاندانی پس منظر اور جیون ساتھی کے لیے ترجیحات۔ آپ کی تصاویر، فون نمبر یا رہائشی پتہ کبھی بھی پبلک نہیں کیا جاتا اور نہ ہی انٹرنیٹ پر سرچ ہو سکتا ہے۔ خاندانی وقار اور پردہ داری ہمیشہ 100 فیصد محفوظ رہتی ہے۔',
      points: [
        { en: 'Free registration & private biodata builder', ur: 'مفت اکاؤنٹ اور پرائیویٹ بائیوڈیٹا' },
        { en: 'Zero public photos, names or phone numbers', ur: 'تصاویر اور فون نمبر مکمل پوشیدہ' },
      ],
    },
    {
      num: '2',
      badge: 'Safety & Trust',
      badge_ur: 'مکمل جانچ پڑتال',
      badgeVariant: 'magenta',
      title: 'CNIC & Live Selfie Authenticity Check',
      title_ur: 'نادرا شناختی کارڈ اور لائیو سیلفی ویریفکیشن',
      image: '/images/raabtanow/privacy-trust.jpg',
      alt: 'Privacy architecture and CNIC authenticity verification check',
      desc: 'To protect families from fake profiles, scammers, and impersonators, candidates submit their government CNIC and a live selfie. Our administration manually audits and verifies identity details before granting the verified green trust badge.',
      desc_ur: 'جعلی پروفائلز اور دھوکہ دہی کے مکمل سدِباب کے لیے امیدوار نادرا شناختی کارڈ اور لائیو سیلفی جمع کرواتے ہیں جس کی ایڈمن ٹیم دستی جانچ پڑتال کرتی ہے۔ تصدیق کے بعد پروفائل کو گرین تصدیقی بیج (Verified Account) جاری کیا جاتا ہے، تاکہ دونوں خاندان مکمل اطمینان اور اعتماد کے ساتھ بات آگے بڑھا سکیں۔',
      points: [
        { en: 'Manual admin audit of CNIC & live photo', ur: 'شناختی کارڈ اور لائیو تصویر کی دستی تصدیق' },
        { en: 'Green Verified Trust Badge for serious families', ur: 'سنجیدہ امیدواروں کے لیے تصدیقی گرین بیج' },
      ],
    },
    {
      num: '3',
      badge: '100% Free Search',
      badge_ur: 'مفت تلاش و فلٹر',
      badgeVariant: 'success',
      title: 'Demographic Filtering & Family Consultation',
      title_ur: 'فلٹرز کے ذریعے تلاش اور خاندانی مشاورت',
      image: '/images/raabtanow/step-search-discovery.jpg',
      alt: 'Pakistani father and son reviewing filtered matrimonial profiles together at home',
      desc: 'Filter verified candidates by age, city, education, profession, sect, marital status, and height. Shortlist compatible profiles privately and consult with your parents and elders in a comfortable, respectful home setting.',
      desc_ur: 'شہر، عمر، تعلیم، پیشہ، مسلک اور قد کی بنیاد پر فلٹرز لگا کر موزوں ترین رشتے تلاش کریں۔ پسندیدہ رشتوں کو اپنی پرائیویٹ شارٹ لسٹ میں محفوظ کریں اور گھر میں والدین اور بزرگوں کے ساتھ باوقار انداز میں بیٹھ کر تسلی سے مشاورت فرمائیں۔',
      points: [
        { en: 'Precise filters: City, Sect, Education & Caste', ur: 'شہر، مسلک، تعلیم اور عمر کے مخصوص فلٹرز' },
        { en: 'Private family shortlisting at zero cost', ur: 'خاندان کے لیے مفت شارٹ لسٹ اور مشاورت' },
      ],
    },
    {
      num: '4',
      badge: 'Mutual Consent',
      badge_ur: 'باہمی رضامندی',
      badgeVariant: 'magenta',
      title: 'Formal Rishta Proposal with Full Dignity',
      title_ur: 'باضابطہ رشتہ پرپوزل اور باہمی رضامندی',
      image: '/images/raabtanow/step-mutual-proposal.jpg',
      alt: 'Formal matrimonial proposal with gold seal representing mutual honor and consent',
      desc: 'Send a formal expression of matrimonial interest with custom questions about values, career, or timeline. The recipient candidate and their family review your biodata and can accept or decline freely without awkwardness. No contact details are exchanged without mutual consent.',
      desc_ur: 'بغیر کسی ہچکچاہٹ یا سماجی دباؤ کے باضابطہ رشتہ پرپوزل ارسال کریں اور ساتھ ضروری سوالات بھی شامل کر سکتے ہیں۔ دوسرا خاندان آپ کا تفصیلی بائیوڈیٹا دیکھ کر اسے قبول یا باعزت طور پر مسترد کر سکتا ہے۔ دونوں اطراف کی باہمی رضامندی کے بغیر کوئی رابطہ معلومات ظاہر نہیں کی جاتیں۔',
      points: [
        { en: 'Respectful proposal with custom inquiries', ur: 'باعزت درخواست اور ضروری سوالات کا تبادلہ' },
        { en: 'Zero pressure: Accept or decline with dignity', ur: 'بغیر کسی خفت کے قبول یا باعزت انکار' },
      ],
    },
    {
      num: '5',
      badge: 'Optional • Rs. 300 PKR',
      badge_ur: 'اختیاری • 300 روپے',
      badgeVariant: 'cyan',
      title: 'Private Photo Viewing with Anti-Leak Watermark',
      title_ur: 'اینٹی لیک واٹر مارک کے ساتھ نجی تصویر کا مشاہدہ',
      image: '/images/raabtanow/photo-privacy-ad.jpg',
      alt: 'Anti-leak dynamic watermarked photo privacy security preview',
      desc: 'When mutually interested, candidates can request private photo viewing for an optional nominal fee of Rs. 300 PKR (charged only after Admin photo audit approval). Photos are secured with an irreversible dynamic viewer-ID watermark and screenshot-prevention hold-to-view security.',
      desc_ur: 'اگر دونوں فریقین تصویر دیکھنے پر آمادہ ہوں، تو صرف 300 روپے کی معمولی فیس پر محفوظ تصویر دیکھی جا سکتی ہے (فیس صرف ایڈمن اپروول کے بعد لی جاتی ہے)۔ ہر تصویر پر دیکھنے والے کا فون اور یوزر آئی ڈی واٹر مارک کے طور پر آتا ہے اور ہولڈ ٹو ویو (Hold to view) پروٹیکشن سے سکرین شاٹ اور غلط استعمال ناممکن ہو جاتا ہے۔',
      points: [
        { en: 'Strict admin quality audit before approval', ur: 'ایڈمن کی سخت جانچ پڑتال کے بعد اپروول' },
        { en: 'Dynamic viewer watermark & screenshot prevention', ur: 'متحرک واٹر مارک اور سکرین شاٹ پروٹیکشن' },
      ],
    },
    {
      num: '6',
      badge: 'Rs. 2,500 PKR Upon Mutual Acceptance',
      badge_ur: 'باہمی قبولیت پر • 2,500 روپے',
      badgeVariant: 'gold',
      title: 'Dual SMS OTP Verification & Direct Contact Unlock',
      title_ur: 'دوطرفہ ایس ایم ایس او ٹی پی اور براہِ راست رابطہ',
      image: '/images/raabtanow/step-contact-unlock.jpg',
      alt: 'Smartphone showing verified SMS code and unlocked direct WhatsApp connection',
      desc: 'Once both parties mutually accept the proposal, a one-time fee of Rs. 2,500 PKR is paid via JazzCash (Till / QR / App), IBAN transfer, or Safepay. Both parties complete two-way SMS OTP phone verification. Verified mobile numbers and direct 1-click WhatsApp buttons are instantly unlocked for families to communicate.',
      desc_ur: 'جب دونوں خاندان رشتہ باہمی طور پر قبول فرما لیں، تو رابطہ ان لاک کرنے کے لیے 2,500 روپے کی یکمشت فیس ادا کی جاتی ہے (جاز کیش، بینک ٹرانسفر یا کارڈ کے ذریعے)۔ دونوں اطراف کے موبائل فون پر 2-way ایس ایم ایس او ٹی پی تصدیق ہوتی ہے، جس کے فوری بعد تصدیق شدہ موبائل نمبرز اور 1-کلک واٹس ایپ بٹن کھل جاتے ہیں تاکہ بزرگ براہِ راست بات چیت کر سکیں۔',
      points: [
        { en: 'Two-way cellular PTA SMS OTP verification', ur: 'دوطرفہ پی ٹی اے تصدیق شدہ ایس ایم ایس او ٹی پی' },
        { en: 'Direct WhatsApp link & phone numbers for parents', ur: 'والدین کے لیے براہِ راست فون نمبر اور واٹس ایپ' },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4 sm:px-6">
      <SEOHead
        title="How Online Rishta Works | Safe & Private Pakistani Matrimonial | RaabtaNow"
        description="Learn how RaabtaNow works: private matrimonial biodata, mutual consent proposals, photo watermark security, and secure SMS OTP contact verification for Pakistani families."
        canonicalPath="/how-it-works"
        isIndexable={true}
      />

      {/* Bilingual Hero Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2">
          <Badge variant="magenta" size="md" className="font-semibold px-3 py-1">
            Step-by-Step Guide
          </Badge>
          <Badge variant="gold" size="md" className="font-urdu font-medium px-3 py-1">
            مکمل رہنمائی
          </Badge>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          How RaabtaNow Works
        </h1>
        <p className="font-urdu text-xl sm:text-2xl text-magenta-500 dark:text-magenta-400 font-bold leading-relaxed" dir="rtl">
          رابطہ ناؤ پر رشتہ تلاش کرنے کا مکمل، محفوظ اور باوقار طریقہ کار
        </p>

        <p className="text-sm sm:text-base text-slate-400 dark:text-slate-300 font-normal leading-relaxed pt-1">
          A transparent, family-centric matrimonial process built on privacy, mutual consent, and verified contact exchange.
        </p>
      </div>

      {/* 6 Visual Bilingual Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {steps.map((step) => (
          <div
            key={step.num}
            className="bg-navy-800 border border-slate-750 rounded-2xl shadow-xl hover:border-magenta-500/50 transition-all duration-300 overflow-hidden flex flex-col group"
          >
            {/* Step Image with Number & Dual Badge */}
            <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-navy-900 shrink-0">
              <img
                src={step.image}
                alt={step.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

              {/* Step Number */}
              <div className="absolute top-3 left-3 z-10">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-magenta-500 to-purple-600 text-white font-extrabold text-base flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-sm">
                  {step.num}
                </span>
              </div>

              {/* Badge with English & Urdu text */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <Badge variant={step.badgeVariant} size="sm" className="shadow-lg font-bold px-2.5 py-1 flex items-center gap-1.5">
                  <span>{step.badge}</span>
                  <span className="opacity-60">•</span>
                  <span className="font-urdu text-[11px] font-normal">{step.badge_ur}</span>
                </Badge>
              </div>
            </div>

            {/* Step Content: English + Urdu Script */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 bg-navy-800">
              {/* English Section */}
              <div className="space-y-2">
                <h2 className="font-serif font-bold text-white text-lg sm:text-xl tracking-tight group-hover:text-magenta-400 transition-colors">
                  {step.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              {/* Urdu Section Callout */}
              <div className="bg-navy-850/80 dark:bg-navy-900/60 border border-slate-750/80 rounded-xl p-3.5 sm:p-4 space-y-1.5" dir="rtl">
                <h3 className="font-urdu font-bold text-magenta-600 dark:text-magenta-400 text-base sm:text-lg leading-snug">
                  {step.title_ur}
                </h3>
                <p className="font-urdu text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-[2.1] font-normal">
                  {step.desc_ur}
                </p>
              </div>

              {/* Bullet Key Highlights */}
              <div className="pt-2 border-t border-slate-750/60 space-y-2">
                {step.points.map((pt, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] sm:text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{pt.en}</span>
                    </span>
                    <span className="font-urdu text-slate-600 dark:text-slate-400 text-right sm:text-left pr-5 sm:pr-0" dir="rtl">
                      {pt.ur}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Assisted Matchmaker Guidance Card */}
      <Card className="p-6 sm:p-8 bg-navy-800 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] sm:text-xs font-black px-4 py-1.5 uppercase tracking-wider rounded-bl-xl shadow-md">
          Assisted Service • ایڈمن معاونت
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg relative shrink-0">
            <img
              src="/images/raabtanow/family-discussion.jpg"
              alt="Pakistani family consulting respectfully with matchmaker"
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="text-xs font-semibold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20 inline-block">
                Dedicated Family Matchmaker
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 text-left">
            <div>
              <div className="inline-flex items-center gap-2 mb-1.5">
                <Badge variant="gold" size="sm" className="font-bold">
                  Personal Guidance
                </Badge>
                <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold">• برائے والدین و بزرگ</span>
              </div>
              <h2 className="font-serif font-bold text-white text-xl sm:text-2xl tracking-tight">
                Admin Assisted Matchmaker Service
              </h2>
              <p className="font-urdu text-lg sm:text-xl text-amber-500 dark:text-amber-400 font-bold mt-1" dir="rtl">
                والدین اور خاندانوں کے لیے وقف رشتہ کونسلر و اسسٹڈ سروس
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 leading-relaxed">
              Prefer personal, hands-on guidance for your family? Our dedicated matchmakers coordinate directly between families on WhatsApp, vet proposals, verify credentials, and arrange respectful introductions aligned with Pakistani cultural and Islamic values.
            </p>

            <div className="bg-navy-850/80 dark:bg-navy-900/60 border border-slate-750/80 rounded-xl p-3.5 space-y-1" dir="rtl">
              <p className="font-urdu text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-[2.1] font-normal">
                اگر آپ والدین ہیں یا چاہتے ہیں کہ ہماری تجربہ کار ٹیم ذاتی طور پر آپ کی پسند اور شرائط کے مطابق موزوں رشتوں کی تلاش، نادرا تصدیق اور دونوں خاندانوں کے درمیان واٹس ایپ پر باعزت رابطہ کروائے، تو آپ ہماری ایڈمن اسسٹڈ سروس سے رہنمائی حاصل کر سکتے ہیں۔
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/search"
                className="gradient-btn text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-magenta-500/25 transition cursor-pointer"
              >
                <span>Browse Verified Profiles</span>
                <span className="font-urdu text-xs font-normal">/ تمام رشتے دیکھیں</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/assisted-profile"
                className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Create Assisted Profile</span>
                <span className="font-urdu text-xs font-normal">/ اسسٹڈ رشتہ بنائیں</span>
              </Link>
              <a
                href="tel:+923239225450"
                className="px-4 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Helpline (+92 323 9225450)</span>
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Core Privacy & Trust Guarantees */}
      <Card className="p-6 sm:p-8 bg-navy-850 border border-slate-750 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-700 shadow-lg">
            <img
              src="/images/raabtanow/privacy-trust.jpg"
              alt="Privacy & Trust Architecture"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="font-serif font-bold text-white text-lg sm:text-xl">
                Privacy Protection as a Core Guarantee
              </h3>
              <Badge variant="success" size="sm" className="inline-flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Verified Process</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed font-normal">
              RaabtaNow strictly prohibits arbitrary photo sharing, public phone scraping, or automated algorithmic matching. Every match inquiry is intentional, mutual, and authenticated through PTA-compliant cellular SMS verification.
            </p>
            <p className="font-urdu text-xs sm:text-[13px] text-slate-400 dark:text-slate-300 leading-[2] font-normal text-center sm:text-left" dir="rtl">
              رابطہ ناؤ پر کوئی غیر ضروری تصویر یا فون نمبر پبلک نہیں ہوتا۔ ہر رابطہ خاندانی وقار، شرعی پردہ داری اور دوطرفہ رضامندی کے تحت انجام پاتا ہے۔
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Action Footer Bar */}
      <div className="text-center pt-4 pb-2 space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
          Ready to Begin Your Honorable Journey?
        </h3>
        <p className="font-urdu text-base text-magenta-500 dark:text-magenta-400 font-semibold" dir="rtl">
          آج ہی مفت رجسٹریشن مکمل کریں اور باوقار رشتہ تلاش فرمائیں
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="gradient-btn text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:shadow-magenta-500/30 transition cursor-pointer flex items-center gap-2"
          >
            <span>Register Free Account</span>
            <span className="font-urdu text-xs font-normal">/ مفت اکاؤنٹ بنائیں</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/search"
            className="px-5 py-3 rounded-xl border border-slate-700 bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-magenta-400" />
            <span>Search Profiles</span>
            <span className="font-urdu text-xs font-normal text-slate-400">/ رشتے دیکھیں</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
      <SEOHead
        title="RaabtaNow Pricing | Transparent Pakistani Online Rishta & Matrimonial Service"
        description="Completely free registration, browsing, and proposals. Transparent Rs. 2,500 PKR fee charged only upon mutual acceptance to unlock verified contacts. Optional photo viewing fee of Rs. 300 PKR for approved private photos."
        canonicalPath="/pricing"
        isIndexable={true}
      />
      <div className="text-center space-y-2">
        <Badge variant="gold" size="md">Transparent Pricing</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Simple, Honest Pricing</h1>
        <p className="text-sm text-slate-400">No monthly subscriptions. No pay-per-search. Pay only upon mutual interest.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Unlock Card */}
        <Card className="text-center p-6 sm:p-8 bg-navy-800 border border-slate-750 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Mutual Contact Unlock</div>
            <div className="font-serif text-4xl sm:text-5xl font-extrabold text-white mb-2">
              Rs. 2,500 <span className="text-base font-normal text-slate-400">PKR</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">One-time fee per mutually accepted proposal.</p>

            <div className="text-left space-y-3 max-w-md mx-auto text-xs text-slate-300 bg-navy-750 p-4.5 rounded-2xl border border-slate-700 mb-6">
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to register and create biodata</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to search, filter & shortlist</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to send & receive Rishta Requests</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Charged ONLY when both parties accept</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Dual-side 2-way SMS OTP phone verification</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlocks verified phone, email & direct WhatsApp</div>
            </div>
          </div>

          <p className="text-[12px] text-slate-400">
            Pay via JazzCash App (QR / Till), IBAN bank transfer, or Safepay.
          </p>
        </Card>

        {/* Private Photo Viewing Card */}
        <Card className="text-center p-6 sm:p-8 bg-navy-800 border border-cyan-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
            Privacy Protected
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2 mt-1">Private Photo Viewing</div>
            <div className="font-serif text-4xl sm:text-5xl font-extrabold text-white mb-2">
              Rs. 300 <span className="text-base font-normal text-slate-400">PKR</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">Per verified candidate photo unlock.</p>

            <div className="text-left space-y-3 max-w-md mx-auto text-xs text-slate-300 bg-navy-750 p-4.5 rounded-2xl border border-slate-700 mb-6">
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> 100% Admin Quality Audit & Approval first</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> No charge if photo rejected by Admin</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Irreversible custom watermark with viewer ID</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Hold-to-view screenshot prevention security</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Independent requests & viewing for both sides</div>
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Instant activation upon payment verification</div>
            </div>
          </div>

          <p className="text-[12px] text-slate-400">
            Fee charged only after admin approves the uploaded photo.
          </p>
        </Card>
      </div>

      {/* Admin Assisted Pricing Card */}
      <Card className="text-center p-8 bg-navy-800 border border-amber-500/20 mt-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-lg">
          Assisted Service
        </div>
        <h2 className="font-serif text-2xl font-bold text-white mb-3 mt-2">Admin Assisted Services</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
          Admin-assisted services are provided separately from the standard website flow. Service charges may vary depending on the type and level of assistance required. Payment arrangements are handled separately with RaabtaNow.
        </p>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 px-4">
      <SEOHead
        title="About RaabtaNow | Privacy-First Pakistani Matrimonial Platform"
        description="Discover the mission behind RaabtaNow: restoring honor, privacy, and family dignity to Pakistani rishta matchmaking through modern technology."
        canonicalPath="/about"
        isIndexable={true}
      />
      <div className="text-center space-y-2">
        <Badge variant="magenta" size="md">Our Mission</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">About RaabtaNow</h1>
        <p className="text-sm text-slate-400">Restoring dignity, privacy, and family respect to Pakistani matchmaking.</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed bg-navy-800 border border-slate-750 p-0 overflow-hidden">
        {/* About page hero image */}
        <div className="relative h-52 sm:h-64 w-full">
          <img
            src="/images/raabtanow/family-discussion.jpg"
            alt="Pakistani families building trust through meaningful connections"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-[center_20%] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="p-6 sm:p-8 space-y-6">
        <p>
          In modern Pakistan, finding a life partner has become increasingly fraught with anxiety. Traditional matchmaking often involves unregulated intermediaries who circulate personal biodatas and contact numbers across public WhatsApp groups without consent. Conversely, Western dating apps encourage casual swiping and superficial photo browsing incompatible with serious marriage intentions.
        </p>
        <p>
          <strong className="text-white">RaabtaNow</strong> was built from the ground up to offer a better alternative. We believe matrimonial discovery should be private, mutual, and family-friendly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-navy-750 rounded-2xl border border-slate-700">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-magenta-400" />
              Privacy First
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">We do not display public photos, phone numbers, or addresses. Personal information is only revealed when both parties verify mobile numbers after mutual consent.</p>
          </div>
          <div className="p-5 bg-navy-750 rounded-2xl border border-slate-700">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-purple-400" />
              Solemn Purpose
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">Strictly matrimonial. Zero tolerance for casual dating, harassment, or fake accounts. Both self-registered individuals and admin-assisted real families are supported.</p>
          </div>
        </div>
        </div>
      </Card>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Privacy Policy | Confidential Pakistani Matrimonial Platform | RaabtaNow"
        description="Read RaabtaNow's rigorous data protection protocols. Zero public candidate photo exposure, no public phone numbers, and strict mutual consent requirements."
        canonicalPath="/privacy-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Privacy & Data Protection</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Introduction & Overview</h3>
          <p>
            At <strong className="text-white">RaabtaNow</strong>, we hold the sanctity, modesty, and honor of candidate privacy as our paramount responsibility. This Privacy Policy outlines our strict protocols regarding the collection, storage, and controlled release of matrimonial information.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
            <li><strong className="text-slate-200">Account & Authentication Data:</strong> Legal name, email address, password hash, and active Pakistani mobile number.</li>
            <li><strong className="text-slate-200">Matrimonial Demographics (Public):</strong> Age, gender, faith, sect, city of residence, education, profession, height, and marital status.</li>
            <li><strong className="text-slate-200">Confidential Statements (Private):</strong> Detailed personal bio, family background, and partner preferences.</li>
            <li><strong className="text-slate-200">Optional Verification Credentials (Strictly Private):</strong> National Identity Card (CNIC / Smart Card) front and back images, and educational degree or diploma documents submitted voluntarily by candidates seeking verified trust badges.</li>
            <li><strong className="text-slate-200">Transactional Records:</strong> Payment attempt references, transaction IDs, timestamps, and payment status. We never collect or store credit/debit card numbers or bank PINs on our servers; all payments are processed through State Bank authorized payment gateways (Safepay).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Zero Public Exposure Guarantee</h3>
          <p>
            RaabtaNow does not publicly display candidate photos, phone numbers, home addresses, CNIC details, or full email addresses. Browsing candidates can only review verified educational, professional, and demographic criteria.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Identity & Education Document Protection</h3>
          <p>
            When you submit credentials for identity or educational verification:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 mt-1">
            <li><strong className="text-slate-200">Isolated Private Storage:</strong> Uploaded document files are stored in private, unlisted server disks that are completely inaccessible via direct web URLs or search engines.</li>
            <li><strong className="text-slate-200">Strictly Internal Administrative Review:</strong> Documents are reviewed solely by authorized verification moderators to confirm candidate identity and qualifications.</li>
            <li><strong className="text-slate-200">Display of Badges Only:</strong> Other platform users only see verified trust badges (<span className="text-emerald-400 font-medium">ID Submitted</span> and <span className="text-purple-400 font-medium">Education Submitted</span>). Your actual document files, CNIC numbers, or certificate scans are never shown to any other user or family.</li>
            <li><strong className="text-slate-200">Automated Storage Retention & Purging:</strong> To uphold data minimization and prevent unnecessary retention of sensitive personal identity documents, raw document images are scheduled for automatic disk purging following verification approval. User verification trust badges remain permanently active even after underlying source files have been purged.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">5. Two-Way Controlled Contact Release</h3>
          <p>
            Contact details (mobile phone, email, and name) are strictly unlocked <strong className="text-white">ONLY</strong> when:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-400 mt-1">
            <li>A candidate sends a formal Rishta expression of interest.</li>
            <li>The recipient explicitly reviews and accepts the proposal.</li>
            <li>The initiator completes the standard contact unlock fee (Rs. 2,500 PKR).</li>
            <li>Both parties successfully verify their phone numbers via a 6-digit SMS OTP code.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">6. Data Retention & Deletion Rights</h3>
          <p>
            Users reserve the complete right to update, hide, or permanently delete their profiles and associated verification submissions from our database at any time through their account dashboard or by writing to <strong className="text-magenta-400">support@raabtanow.com</strong>. Upon profile deletion, all pending documents are securely unlinked and erased.
          </p>
        </div>
  
        <div>
          <h3 className="font-bold text-base text-white mb-2">7. Governing Law & Jurisdiction</h3>
          <p>
            These Terms and Conditions are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in Pakistan.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>Registered Office: RaabtaNow, L95, 48C, Korangi, Karachi, Pakistan. | Phone: +92-323-9225450</p>
        </div>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Terms & Conditions | Halal Pakistani Matrimonial Service | RaabtaNow"
        description="Review user agreement and guidelines for RaabtaNow. Solely dedicated to serious matrimonial proposals (Nikah) for Pakistani individuals and families."
        canonicalPath="/terms"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">User Agreement</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Eligibility & Solemn Purpose</h3>
          <p>
            RaabtaNow is strictly a halal, family-oriented matrimonial platform designed exclusively for individuals and families genuinely seeking marriage (Nikah). The platform must not be used for casual dating, friendships, commercial solicitation, or any non-matrimonial purposes. Users must be at least 18 years of age.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Truthful & Accurate Biodata</h3>
          <p>
            By submitting a profile, you affirm that all details—including age, marital status, education, and profession—are truthful and verifiable. Providing false information or misrepresenting identity constitutes a material violation and will result in immediate profile termination without notice.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Identity & Credential Verification</h3>
          <p>
            Users who opt to submit National Identity Cards (CNIC) or educational credentials for verification badges warrant that all uploaded files are authentic, unaltered, and belong strictly to the registered candidate. Uploading falsified, forged, or third-party documents is strictly prohibited under Pakistani cyber laws and will result in immediate permanent account termination, badge revocation, and potential blacklisting. Information submitted by users or profile owners may not have been independently verified by RaabtaNow, and users are responsible for independently verifying information about other users.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Fees & Payment Terms</h3>
          <p>
            Registration, browsing, profile creation, and receiving connection requests are completely free of charge. A standard fee of <strong className="text-white">Rs. 2,500 PKR</strong> is levied only on the proposal initiator upon mutual proposal acceptance to unlock verified contact details and finance two-way SMS OTP infrastructure. Private photo exchange, where requested and approved by administration, carries a nominal fee of <strong className="text-white">Rs. 300 PKR</strong> per party to view verified watermarked photos. All electronic payments are processed securely via Safepay or JazzCash. For Admin Assisted services, service charges may vary depending on the type and level of assistance required. Payment arrangements for Assisted services are handled separately with RaabtaNow and do not use the standard Rs. 2,500 flow.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">5. Code of Conduct & Respect</h3>
          <p>
            Candidates and family representatives agree to communicate with courtesy, modesty, and mutual respect. Any harassment, inappropriate language, fraudulent behavior, or commercial spam will lead to instant account suspension and blacklist.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">6. Disclaimer of Matrimonial Guarantee & User Responsibility</h3>
          <p>
            RaabtaNow does not guarantee that every profile or listing is accurate, complete, current, or suitable. 
            While RaabtaNow verifies email and phone numbers via SMS OTP when applicable, we do not independently guarantee the outcome of a proposal, introduction, meeting, or marriage. Please independently verify the person's identity, education, marital status, and other important information during your first contact before sharing sensitive information, sending money, or proceeding further.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">7. Governing Law & Jurisdiction</h3>
          <p>
            These Terms and Conditions, your access to and use of RaabtaNow, and any dispute, controversy, or claim arising out of or in connection with them (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. You irrevocably agree that the competent courts located in Karachi, Pakistan shall have exclusive jurisdiction to settle any legal dispute, controversy, or claim arising out of or relating to these Terms and Conditions, the privacy policy, or the services provided by RaabtaNow.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>RaabtaNow | Address: Sector 48-C, Korangi, Karachi, Sindh, Pakistan. | Email: support@raabtanow.com</p>
        </div>
      </Card>
    </div>
  );
}

export function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Return & Refund Policy | RaabtaNow Matrimonial Services"
        description="Clear terms regarding our digital contact unlock micro-fee, duplicate transaction refunds, and customer support escalation timelines."
        canonicalPath="/refund-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="gold" size="md">Refund & Cancellation</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Return & Refund Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Overview of Digital Services</h3>
          <p>
            RaabtaNow provides online matrimonial discovery services. Browsing, shortlisting, and proposal exchange are free. Chargeable services are the <strong className="text-white">Contact Unlock Fee (Rs. 2,500 PKR)</strong>, charged only after mutual acceptance to initiate phone verification and contact release, and the optional <strong className="text-white">Photo Viewing Fee (Rs. 300 PKR)</strong>, charged only upon viewing admin-approved private photos.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Refund Eligibility</h3>
          <p>
            Refunds are granted under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 mt-1">
            <li><strong className="text-slate-200">Duplicate Charges:</strong> If a technical glitch or network error causes your account or card to be charged more than once for the same request, the duplicate transaction will be refunded in full.</li>
            <li><strong className="text-slate-200">System Failure:</strong> If payment succeeds but our system fails to deliver the verification service or unlock due to technical failure, you are entitled to a full refund.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Non-Refundable Scenarios</h3>
          <p>
            Once mutual SMS phone verification is completed and the counterpart's contact details (name, phone number, and email) have been successfully displayed on screen, the unlock fee is considered fully consumed and is non-refundable. Personal preferences, lack of compatibility, or subsequent decision not to pursue marriage outside the platform do not qualify for a refund.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Refund Process & Timelines</h3>
          <p>
            To request a refund for an eligible transaction, please email <strong className="text-magenta-400">support@raabtanow.com</strong> within 7 calendar days of the transaction, providing your Request Code, Payment Transaction Reference, and registered email address. Approved refunds are credited back to the original payment method (card or mobile wallet) within 5–7 business days in accordance with banking guidelines.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>Customer Support: support@raabtanow.com | Phone: +92-323-9225450 | Karachi, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function DeliveryPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Service Delivery Policy | Instant Digital Contact Unlock | RaabtaNow"
        description="Instant electronic fulfillment for contact verification and mutual phone release upon successful mutual consent and payment confirmation."
        canonicalPath="/delivery-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Fulfillment & Delivery</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Service Delivery Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Nature of Delivery</h3>
          <p>
            RaabtaNow operates solely as a digital matrimonial software platform. We do not sell or deliver any physical goods, parcels, or tangible items. Consequently, <strong className="text-white">no shipping fees, courier handling, or physical transit times apply</strong>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Instant Electronic Delivery</h3>
          <p>
            All paid services—namely the Contact Unlock feature—are delivered electronically and immediately:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 mt-1">
            <li>Upon confirmed payment gateway checkout (Rs. 2,500 PKR), the SMS OTP verification interface is instantly enabled for both candidates within 0 to 60 seconds.</li>
            <li>Upon valid completion of SMS OTP verification, the counterpart's phone number, email address, and direct WhatsApp contact link are displayed immediately on the screen and archived in the user's dashboard.</li>
            <li>An immediate email confirmation with connection details is dispatched simultaneously to the user's registered inbox.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Service Inquiries & Support</h3>
          <p>
            If you encounter any delay in SMS OTP receipt or digital contact display after payment, our customer support desk is available to assist and verify delivery:
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Email: <strong className="text-magenta-400">support@raabtanow.com</strong> | WhatsApp / Call: <strong className="text-white">+92-323-9225450</strong>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>RaabtaNow Matrimonial Services | Head Office: Sector 48-C, Korangi, Karachi, Sindh, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function ContactUsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Contact RaabtaNow | Online Rishta Pakistan & Matrimonial Support"
        description="Get in touch with RaabtaNow customer care. Head office in Karachi, dedicated support helpline (+92 323 9225450), and respectful family assistance."
        canonicalPath="/contact"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Get In Touch</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Contact & Support</h1>
        <p className="text-sm text-slate-400">We are here to assist Pakistani families with dignity, privacy, and dedicated guidance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 bg-navy-800 border border-slate-750">
          <h3 className="font-bold text-base text-white border-b border-slate-700 pb-2">Head Office Details</h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <span className="font-bold block text-slate-400">Business Name:</span>
              <span className="font-serif text-base font-extrabold text-white">RaabtaNow</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Registered Office Address:</span>
              <span>Sector 48-C, Korangi, Karachi, Sindh, Pakistan</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Customer Support Helpline:</span>
              <span className="font-mono font-bold text-white">+92 323 9225450</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Official Inquiries & Support:</span>
              <span className="font-mono font-bold text-magenta-400">support@raabtanow.com</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Operational Hours:</span>
              <span>Monday – Saturday: 10:00 AM – 7:00 PM (PST)</span>
            </div>
            <div className="pt-2 border-t border-slate-700/60">
              <span className="font-bold block text-slate-400 mb-1.5">Official Direct Chat & Support:</span>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://ig.me/m/raabtanow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 hover:border-pink-500 hover:text-white transition text-pink-300 text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-pink-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Chat on Instagram (@raabtanow)</span>
                </a>
                <a
                  href="https://m.me/61594211561148"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 hover:text-white transition text-blue-300 text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-blue-400" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Chat on Facebook Messenger</span>
                </a>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-navy-800 border border-slate-750">
          <h3 className="font-bold text-base text-white border-b border-slate-700 pb-2">Services & Offerings</h3>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Verified Pakistani Matrimonial Profiles</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Confidential & Private Biodata Discovery</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Two-Way Mutual Consent Proposal Requests</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Secure Dual SMS OTP Verification (Rs. 2,500)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Direct Family WhatsApp & Mobile Release</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Dedicated Matchmaking Assistance</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Overseas Pakistani Matrimonial Search</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Zero Public Photo / Phone Exposure Policy</li>
            </ul>
          </Card>
        </div>

        <Card className="p-6 space-y-4 bg-navy-800 border border-slate-750">
          <h3 className="font-bold text-base text-white border-b border-slate-700 pb-2">Customer Complaint Handling Mechanism</h3>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              At RaabtaNow, we are committed to providing a reliable and secure matrimonial platform. If you have any complaints or concerns regarding our services, profiles, or payments, please follow our dispute resolution process below:
            </p>
            <div>
              <strong className="text-white">How to contact us with a complaint:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Email: <strong className="text-magenta-400">support@raabtanow.com</strong></li>
                <li>Phone: <strong className="text-white">+92 323 9225450</strong></li>
              </ul>
            </div>
            <div>
              <strong className="text-white">Resolution Timeline:</strong>
              <p className="mt-1">
                Our support team will acknowledge your complaint within 24 hours. We aim to thoroughly investigate and provide a final resolution or solution to your dispute within <strong>3 to 5 business days</strong>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );}
