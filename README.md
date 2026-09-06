# Rishta Platform — Privacy-First Matrimonial Discovery

A modern, culturally respectful, privacy-first Pakistani matrimonial discovery platform built with **Laravel 12 REST API**, **React (Vite + Tailwind CSS)**, and **MySQL**.

---

## Core Value Proposition

> **"Search Privately. Connect With Consent."**

The platform is strictly **not a dating app**. It eliminates swiping, casual chatting, public photos, and unsolicited contact. It facilitates serious, family-oriented matchmaking through verified matrimonial discovery, mutual consent, and authorized contact disclosure.

### The Immutable Business Flow
```
REGISTER
  ↓
EMAIL VERIFICATION
  ↓
CREATE MATRIMONIAL PROFILE
  ↓
SEARCH & SHORTLIST PROFILES (FREE)
  ↓
SEND RISHTA REQUEST (FREE)
  ↓
RECIPIENT ACCEPTS OR DECLINES (FREE)
  ↓
IF ACCEPTED: INITIATOR PAYS FOR CONTACT UNLOCK (Fee: e.g. Rs. 300 via PayFast)
  ↓
PAYMENT VERIFIED (Server-side Webhook / API confirmation)
  ↓
SMS OTP MOBILE VERIFICATION (Both parties must verify their phone numbers)
  ↓
MUTUAL CONTACT RELEASE (Revealed exclusively to the verified parties)
  ↓
PARTIES COMMUNICATE EXTERNALLY (Phone, WhatsApp, Family meetings)
```

---

## Architectural Principles & Strict Rules

1. **Absolute Privacy by Default**: 
   - No public phone numbers, emails, CNIC, or addresses.
   - Sensitive contact details are **never** returned in API responses prior to mutual acceptance, confirmed payment, and mobile verification. (Never rely on frontend CSS to hide data).
   - Public photos are omitted in MVP to prioritize modesty, privacy, and safety.
2. **Provider-Independent Abstractions**:
   - **Payment**: `PaymentGatewayInterface` decouples core business logic from PayFast. Future gateways (Safepay, JazzCash, Easypaisa) plug in cleanly without rewriting controllers or workflows.
   - **SMS & OTP**: `SmsServiceInterface` abstracts mobile gateways (Pakistan SMS providers). OTP state machine handles generation, hashing, rate-limiting, and expiry independently.
3. **Payer Model**:
   - Only the user who originally sent the Rishta Request pays for contact unlocking once the request is accepted. Registration, browsing, sending, and accepting requests are 100% free.
4. **No OTP Before Payment**:
   - To conserve SMS transaction costs, OTP verification is only initiated after payment confirmation is verified via server-side webhook/callback.

---

## Technology Stack

- **Backend**: Laravel 12 (PHP 8.2+), Laravel Sanctum, MySQL / SQLite (Dev), Form Requests, Policies, Queues.
- **Frontend**: React 19 / 18 SPA, Vite, React Router v7 / v6, Tailwind CSS v4, Axios.
- **Payment Gateway**: PayFast (via `PaymentGatewayInterface`).
- **SMS / OTP**: Pluggable SMS gateway with mock driver for local testing.
- **Testing**: PHPUnit / Pest for backend tests; Component & unit testing for frontend.

---

## Permanent Project Documentation (`/docs`)

All architectural patterns, API contracts, database schemas, and workflows are permanently documented in the `/docs` directory. Consult these documents before making changes:

- [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — Mission, core values, problem statement, and scope.
- [PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) — Detailed functional and non-functional requirements.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, module boundaries, and service design.
- [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) — ER diagrams, schema specifications, indexing, and data models.
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) — REST API specifications, request/response formats, and error codes.
- [AUTHENTICATION.md](docs/AUTHENTICATION.md) — Sanctum token lifecycle, email verification, password reset.
- [PAYMENT_ARCHITECTURE.md](docs/PAYMENT_ARCHITECTURE.md) — Payment gateway contract, lifecycle, and security rules.
- [PAYFAST_INTEGRATION.md](docs/PAYFAST_INTEGRATION.md) — PayFast integration specifications, checksums, and webhook handling.
- [OTP_ARCHITECTURE.md](docs/OTP_ARCHITECTURE.md) — SMS OTP generation, rate limiting, hashing, and verification state machine.
- [EMAIL_ARCHITECTURE.md](docs/EMAIL_ARCHITECTURE.md) — Transactional email notification architecture.
- [SECURITY.md](docs/SECURITY.md) — Authorization policies, rate limiting, sanitization, and audit trails.
- [PRIVACY.md](docs/PRIVACY.md) — Data isolation rules, access controls, and information minimization.
- [UI_UX_GUIDELINES.md](docs/UI_UX_GUIDELINES.md) — Design principles, mobile-first guidelines, tone of voice, copy.
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — Color palette (Burgundy/Cream/Gold), typography, reusable components.
- [ADMIN_DASHBOARD.md](docs/ADMIN_DASHBOARD.md) — Back-office specifications for moderation, reports, and manual onboarding.
- [TESTING.md](docs/TESTING.md) — Testing strategy, test suites, and coverage goals.
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Production environment, deployment steps, queue workers, and backups.
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) — Full reference of configuration keys and `.env` requirements.
- [DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) — Git workflow, branch conventions, PR checks.
- [CHANGELOG.md](docs/CHANGELOG.md) — Historical log of changes by version and phase.
- [PHASES.md](docs/PHASES.md) — Development roadmap, phases 0 through 11, and tracking.
- [DECISIONS.md](docs/DECISIONS.md) — Architecture Decision Records (ADRs).

---

## Local Development Setup

```bash
# 1. Clone repository and install backend dependencies
composer install

# 2. Environment setup
cp .env.example .env
php artisan key:generate

# 3. Run database migrations
php artisan migrate

# 4. Install frontend dependencies
npm install

# 5. Start dev server (Laravel backend & Vite frontend)
php artisan serve
npm run dev
```

---

## License

Proprietary & Confidential. All rights reserved.
