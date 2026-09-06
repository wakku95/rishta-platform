# CHANGELOG

All notable changes to the Rishta Platform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

