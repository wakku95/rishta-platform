import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import {
  HowItWorksPage,
  PricingPage,
  AboutPage,
  PrivacyPolicyPage,
  TermsPage,
  RefundPolicyPage,
  DeliveryPolicyPage,
  ContactUsPage,
} from './pages/StaticInfoPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import EditPreferencesPage from './pages/profile/EditPreferencesPage';

// Discovery Pages
import SearchProfilesPage from './pages/discovery/SearchProfilesPage';
import CandidateDetailPage from './pages/discovery/CandidateDetailPage';

// Requests & Shortlist Pages
import ShortlistPage from './pages/requests/ShortlistPage';
import RequestsPage from './pages/requests/RequestsPage';

// Route Guards
import GuestRoute from './components/auth/GuestRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import VerifiedRoute from './components/auth/VerifiedRoute';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
            {/* Public informational pages */}
            <Route index element={<HomePage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="refund-policy" element={<RefundPolicyPage />} />
            <Route path="delivery-policy" element={<DeliveryPolicyPage />} />
            <Route path="contact" element={<ContactUsPage />} />

            {/* Guest-only routes */}
            <Route element={<GuestRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Email verification page (accessible to authenticated users or via email link) */}
            <Route path="verify-email" element={<VerifyEmailPage />} />

            {/* Protected authenticated routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/edit" element={<EditProfilePage />} />
              <Route path="profile/preferences" element={<EditPreferencesPage />} />
            </Route>

            {/* Discovery & Shortlist & Requests routes (requires verified email) */}
            <Route element={<VerifiedRoute />}>
              <Route path="search" element={<SearchProfilesPage />} />
              <Route path="profiles/:profileCode" element={<CandidateDetailPage />} />
              <Route path="shortlist" element={<ShortlistPage />} />
              <Route path="requests" element={<RequestsPage />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
