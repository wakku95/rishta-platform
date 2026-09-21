import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Mail, UserCircle, Settings, ShieldAlert, ArrowRight } from 'lucide-react';

export default function OnboardingBanner() {
  const { user, authenticated, emailVerified, hasProfile, hasPreferences, profileStatus } = useContext(AuthContext);
  const location = useLocation();

  if (!authenticated) return null;

  // Don't show banner if profile is active, or if user is an admin viewing admin pages
  if (profileStatus === 'active') return null;
  if (user?.role === 'admin' && location.pathname.startsWith('/admin')) return null;

  let config = null;

  if (!emailVerified) {
    config = {
      titleEng: 'Verify your email to continue.',
      titleUrdu: 'اپنا ای میل تصدیق کریں تاکہ آپ آگے بڑھ سکیں۔',
      descEng: 'Please check your inbox for the verification link.',
      descUrdu: 'براہ کرم تصدیقی لنک کے لیے اپنا ان باکس چیک کریں۔',
      icon: <Mail className="w-5 h-5 text-amber-500" />,
      link: '/verify-email',
      buttonText: 'Verify Email',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-100',
    };
  } else if (!hasProfile) {
    config = {
      titleEng: 'Complete Your Matrimonial Profile.',
      titleUrdu: 'اپنا رشتہ پروفائل مکمل کریں۔',
      descEng: 'Complete your basic information to start finding suitable rishtas.',
      descUrdu: 'مناسب رشتے تلاش کرنے کے لیے اپنی بنیادی معلومات مکمل کریں۔',
      icon: <UserCircle className="w-5 h-5 text-magenta-500" />,
      link: '/profile/edit',
      buttonText: 'Create Profile',
      bgColor: 'bg-magenta-950/30',
      borderColor: 'border-magenta-500/30',
      textColor: 'text-magenta-50',
    };
  } else if (!hasPreferences) {
    config = {
      titleEng: 'Set Partner Preferences.',
      titleUrdu: 'شریک حیات کی ترجیحات سیٹ کریں۔',
      descEng: 'Tell us what you are looking for in a partner.',
      descUrdu: 'ہمیں بتائیں کہ آپ شریک حیات میں کیا خصوصیات تلاش کر رہے ہیں۔',
      icon: <Settings className="w-5 h-5 text-emerald-500" />,
      link: '/profile/preferences',
      buttonText: 'Set Preferences',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-50',
    };
  } else if (profileStatus !== 'active') {
    config = {
      titleEng: 'Activate Your Profile.',
      titleUrdu: 'اپنا پروفائل ایکٹیویٹ کریں۔',
      descEng: 'Review and activate your profile to make it visible to others.',
      descUrdu: 'اپنا پروفائل ایکٹیویٹ کریں تاکہ دوسرے آپ کو دیکھ سکیں۔',
      icon: <ShieldAlert className="w-5 h-5 text-blue-500" />,
      link: '/profile',
      buttonText: 'Activate Now',
      bgColor: 'bg-blue-950/30',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-50',
    };
  }

  if (!config) return null;

  // Do not show the banner if they are already on the target action page (to avoid redundancy)
  if (location.pathname === config.link) return null;

  return (
    <div className={`mb-6 rounded-xl border ${config.borderColor} ${config.bgColor} shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between p-4 md:p-5 gap-4`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
        <div className="hidden md:flex mt-1 bg-navy-900/50 p-3 rounded-full ring-1 ring-white/10 shrink-0 items-center justify-center">
          {config.icon}
        </div>
        <div className="w-full">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col md:flex-row md:items-center md:gap-3 justify-between w-full">
                <h3 className={`font-semibold ${config.textColor} text-base md:text-lg`}>{config.titleEng}</h3>
                <h3 className={`font-bold ${config.textColor} font-urdu text-lg md:text-xl text-right`} dir="rtl">{config.titleUrdu}</h3>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:gap-3 justify-between w-full mt-1">
                <p className="text-sm text-slate-300">{config.descEng}</p>
                <p className="text-sm md:text-base text-slate-300 font-urdu text-right" dir="rtl">{config.descUrdu}</p>
            </div>
          </div>
        </div>
      </div>
      
      <Link
        to={config.link}
        className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm"
      >
        {config.buttonText}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
