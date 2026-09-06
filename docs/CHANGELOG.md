# CHANGELOG

All notable changes to the Rishta Platform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Phase 2] - User Profile & Partner Preferences - 2026-09-06

### Added
- **Database & Architecture**:
  - `profiles` table migration with unique, non-sequential `profile_code` (`RK-XXXXXX`), string columns for marital status, managed by, and profile status.
  - `profile_preferences` table migration for partner criteria (age range, height range, preferred cities, education, religion, sect, marital status).
  - `Profile` and `ProfilePreference` Eloquent models with automatic random profile code generation, age calculation from DOB, height formatting (`5'7" (170 cm)`), and relationships on `User`.
- **Deterministic Profile Completion Scoring**:
  - Centralized 100% calculation: Mandatory Core Biodata (70%, 10 items @ 7% each) + Partner Preferences (30%, 6 items @ 5% each).
- **API & Security**:
  - `ProfileController` endpoints:
    - `GET /api/profile`: retrieves profile with partner preferences.
    - `POST /api/profile` and `PUT /api/profile`: creates or updates profile biodata.
    - `GET /api/profile/preferences`: retrieves partner preferences.
    - `PUT /api/profile/preferences`: creates or updates partner preferences.
    - `POST /api/profile/activate`: activates profile; enforces email verification and mandatory core fields.
    - `POST /api/profile/hide`: hides profile from search results.
  - `ProfileResource` and `ProfilePreferenceResource` serializers strictly excluding email, phone number, password hashes, and tokens.
  - Form Requests: `StoreProfileRequest`, `UpdateProfileRequest`, `UpdatePreferencesRequest`.
- **Frontend SPA**:
  - `ProfilePage`: overview dashboard with completion progress bar, status badges, biodata details, managed by indicators, partner preferences summary, empty state, and activate/hide controls.
  - `EditProfilePage`: mobile-first form with high-contrast inputs, selects, character counter, height selector, and validation errors.
  - `EditPreferencesPage`: partner criteria form with multi-city toggles, marital status checklists, and age/height bounds.
  - Integrated `My Profile` links into `Navbar` and `DashboardPage`.
- **Testing**:
  - 12 comprehensive automated feature tests in `tests/Feature/ProfileTest.php`. Total test suite passes with 34 tests and 134 assertions.
  - Vite production build succeeds with clean asset bundles.

## [Phase 1] - Authentication - 2026-09-06

### Added
- **Sanctum SPA Cookie Authentication**:
  - `User` model updated with `MustVerifyEmail`, `role`, and `status`.
  - Database migration `2026_09_06_100000_add_auth_fields_to_users_table.php`.
  - `UserResource` serializer strictly excluding password hashes, remember tokens, and sensitive fields.
  - Form Requests with validation rules and whitespace sanitization: `RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`.
  - Controllers:
    - `AuthController`: `register()`, `login()`, `logout()`, and `me()`.
    - `EmailVerificationController`: signed link validation `verify()`, and throttled `resend()`.
    - `PasswordResetController`: user enumeration-safe `forgot()`, and `reset()`.
  - Configured custom password reset URL generator in `AppServiceProvider`.
  - Route definitions under `/api/auth` with strict throttling (`throttle:5,1`, `throttle:3,15`, `throttle:3,10`).
- **Frontend SPA Authentication**:
  - Centralized `AuthContext` and `useAuth` hook managing user state, session recovery, and unauthorized event handling.
  - Navigation guards: `ProtectedRoute`, `GuestRoute`, and `VerifiedRoute`.
  - Auth pages: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`.
  - Protected `DashboardPage` displaying account details, verification badges, and privacy indicators.
  - Updated `Navbar` with dynamic user profile actions and logout handling.
- **Testing & Verification**:
  - `tests/Feature/AuthenticationTest.php` with 15 test methods (registration, login, logout, verification, password reset, enumeration defense, rate limiting).
  - All 22 automated tests passing cleanly. Production assets built via Vite.

## [Phase 0] - Project Foundation - 2026-09-06

### Added
- **Backend Foundation**:
  - Laravel Sanctum SPA cookie authentication configuration (`statefulApi` middleware, `HasApiTokens` on `User` model).
  - Standardized JSON API response structure via `App\Traits\ApiResponse` (`successResponse`, `errorResponse`).
  - Global JSON exception handling in `bootstrap/app.php` for `ValidationException`, `AuthenticationException`, `AuthorizationException`, and `NotFoundHttpException`.
  - Decoupled Payment Gateway abstraction: `PaymentGatewayInterface`, `PaymentVerificationResult`, and `FakePaymentService`.
  - Decoupled SMS gateway abstraction: `SmsServiceInterface` and `MockSmsService`.
  - Configuration files: `config/payment.php`, `config/sms.php`, and `config/rishta.php`.
  - Base API health check route: `GET /api/health`.
  - Automated feature test suite: `tests/Feature/FoundationTest.php` with 5 automated test cases covering health check, error handling, and dependency injection bindings.
- **Frontend Foundation**:
  - React 19 SPA setup integrated with Vite 7 and `@vitejs/plugin-react`.
  - Tailwind CSS v4 design system configured with Royal Burgundy (`#700f2d`), Warm Cream (`#fcfaf8`), Subtle Gold (`#d97706`), and Dark Charcoal (`#1c1917`).
  - Pre-configured Axios client in `resources/js/api/client.js` with `withCredentials: true`, CSRF token handling, and unauthorized event interceptors.
  - Complete atomic UI component library:
    - `Button.jsx`
    - `Input.jsx`
    - `Select.jsx`
    - `Textarea.jsx`
    - `Card.jsx`
    - `Badge.jsx`
    - `Alert.jsx`
    - `Modal.jsx`
    - `LoadingState.jsx`
    - `EmptyState.jsx`
    - `Pagination.jsx`
    - `FormError.jsx`
    - `ConfirmDialog.jsx`
  - Mobile-first responsive layouts and pages:
    - `Navbar.jsx` (with mobile drawer and cultural branding)
    - `Footer.jsx` (with privacy pillars and matrimonial notices)
    - `AppLayout.jsx`
    - `HomePage.jsx` (hero, 6-step flow preview, live API health card)
    - `StaticInfoPage.jsx` (`HowItWorksPage`, `PricingPage`, `AboutPage`)
    - `NotFoundPage.jsx`
  - SPA entry point `main.jsx` and catch-all web routing in `routes/web.php`.

