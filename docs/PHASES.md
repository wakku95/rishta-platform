# DEVELOPMENT ROADMAP & PHASES

This file tracks the implementation status of each phase.
Status indicators: `NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`

---

## Roadmap

| Phase | Description | Status | Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Foundation** | `COMPLETED` | Laravel API setup, React SPA setup, Tailwind v4 theme, Sanctum config, base layouts, error handler. |
| **Phase 1** | **Authentication** | `COMPLETED` | Registration, login, logout, email verification, password reset, Sanctum SPA cookie auth, route guards, auth tests. |
| **Phase 2** | **User Profile** | `COMPLETED` | Profile schema, creation/edit forms, partner preferences, completion indicator, validation tests. |
| **Phase 3** | **Profile Search** | `NOT_STARTED` | Search endpoint, filters (city, age, education), pagination, shortlist, privacy enforcement. |
| **Phase 4** | **Rishta Requests** | `NOT_STARTED` | Send request, received/sent lists, accept/decline, duplicate prevention, block checks, notifications. |
| **Phase 5** | **Payment Architecture** | `NOT_STARTED` | `PaymentGatewayInterface`, PayFast adapter, fake adapter, checkout flow, webhook verification, tests. |
| **Phase 6** | **OTP & Contact Release** | `NOT_STARTED` | `SmsServiceInterface`, OtpService, post-payment SMS sending, mobile verification, contact unlock view. |
| **Phase 7** | **Blocking & Reporting** | `NOT_STARTED` | Block/unblock API, report API, search exclusion filters, moderation hooks. |
| **Phase 8** | **Admin Dashboard** | `NOT_STARTED` | Admin KPIs, user/profile management, report resolution, payment audits, admin-assisted profiles. |
| **Phase 9** | **Notifications** | `NOT_STARTED` | In-app notification center, transactional emails, preference controls. |
| **Phase 10** | **Security & Quality** | `NOT_STARTED` | Security audit, rate limiting verification, policy audits, end-to-end regression tests. |
| **Phase 11** | **Production Prep** | `NOT_STARTED` | Production configs, deployment scripts, backup automation, monitoring setup. |

---

## Phase Approval & Execution Log

- **Phase 0 (Completed)**:
  - Architecture, schema, API contracts, design system, UI components, abstractions, and documentation finalized and committed locally (`074f135`).
- **Phase 1 (Completed)**:
  - Complete Sanctum SPA cookie-based authentication implemented.
  - No localStorage tokens. Safe UserResource serialization.
  - Registration, Login, Logout, Email Verification, Password Reset with enumeration protection.
  - Frontend AuthContext, route guards (GuestRoute, ProtectedRoute, VerifiedRoute), auth pages, and DashboardPage.
  - 15 comprehensive feature tests passing in `AuthenticationTest.php` (22 total tests passing).
- **Phase 2 (Completed)**:
  - `profiles` and `profile_preferences` database migrations, models, relationships, and string-backed flexible enums.
  - Random, non-sequential public profile codes (`RK-XXXXXX`).
  - Strict server-side DOB age calculation (18–80 years window) and dynamic height conversions.
  - Deterministic profile completion scoring (Core Biodata 70% + Partner Preferences 30% = 100%).
  - Mandatory server-side email verification guard for profile activation (`EMAIL_NOT_VERIFIED` 403).
  - Strict privacy enforcement: Zero exposure of email, phone, passwords, or tokens in profile endpoints.
  - Mobile-first React UI: `ProfilePage`, `EditProfilePage`, `EditPreferencesPage`, navigation links, and Dashboard integration.
  - 12 comprehensive feature tests in `ProfileTest.php` (34 total automated tests passing).
