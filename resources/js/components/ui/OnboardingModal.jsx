import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';

export default function OnboardingModal() {
  const { user, authenticated, emailVerified, hasProfile, hasPreferences, profileStatus } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // We only want this modal to trigger automatically on specific "protected" pages like discovery or profile viewing
  const isRelevantPage = location.pathname.startsWith('/discovery') || 
                         location.pathname === '/' ||
                         (location.pathname.startsWith('/profiles/') && location.pathname !== '/profile');

  useEffect(() => {
    if (authenticated && user?.role !== 'admin' && profileStatus !== 'active' && isRelevantPage) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [authenticated, user, profileStatus, location.pathname, isRelevantPage]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <span>{!emailVerified ? 'Verification Required' : !hasProfile ? 'Profile Required' : !hasPreferences ? 'Preferences Required' : 'Activation Required'}</span>
          <span className="font-urdu text-lg font-bold" dir="rtl">{!emailVerified ? 'تصدیق درکار ہے' : !hasProfile ? 'پروفائل درکار ہے' : !hasPreferences ? 'ترجیحات درکار ہیں' : 'ایکٹیویشن درکار ہے'}</span>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 text-slate-300">
          <p className="text-base text-center">
            {!emailVerified 
              ? 'Please verify your email address to unlock full platform features.'
              : !hasProfile
                ? 'Please create your matrimonial profile to continue.'
                : !hasPreferences
                  ? 'Please set your partner preferences to continue.'
                  : 'Please activate your profile to send requests and unlock full features.'}
          </p>
          <p className="font-urdu text-center text-lg md:text-xl" dir="rtl">
            {!emailVerified
              ? 'پلیٹ فارم کی تمام سہولیات استعمال کرنے کے لیے اپنا ای میل تصدیق کریں۔'
              : !hasProfile
                ? 'آگے بڑھنے کے لیے اپنا رشتہ پروفائل مکمل کریں۔'
                : !hasPreferences
                  ? 'آگے بڑھنے کے لیے شریک حیات کی ترجیحات سیٹ کریں۔'
                  : 'درخواستیں بھیجنے اور تمام سہولیات استعمال کرنے کے لیے اپنا پروفائل ایکٹیویٹ کریں۔'}
          </p>
        </div>
        <div className="bg-navy-900/50 p-4 rounded-xl border border-slate-700/50 text-sm text-slate-400 text-center">
          {!emailVerified
            ? 'Check your inbox for the verification link.'
            : !hasProfile
              ? 'You can easily create your profile in a few steps.'
              : !hasPreferences
                ? 'Tell us what you are looking for in a partner.'
                : 'You can check your exact missing requirements on your profile page.'}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Link to={!emailVerified ? '/verify-email' : !hasProfile ? '/profile/edit' : !hasPreferences ? '/profile/preferences' : '/profile'} onClick={() => setIsOpen(false)}>
            <Button variant="primary" className="w-full sm:w-auto">
              {!emailVerified ? 'Verify Email' : !hasProfile ? 'Create Profile' : !hasPreferences ? 'Set Preferences' : 'Go to Profile'}
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
