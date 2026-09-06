# CHANGELOG

All notable changes to the Rishta Platform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

