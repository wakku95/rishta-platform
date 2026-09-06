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
| **Phase 3** | **Profile Discovery & Search** | `COMPLETED` | Search endpoint, canonical filters, server-side pagination, candidate cards, public detail, zero-trust privacy. |
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
- **Phase 2 (Completed - Replacement Specification)**:
  - Controlled options architecture via `App\Constants\ProfileOptions` and `GET /api/profile/options` endpoint.
  - Strict privacy separation: `PublicProfileResource` (calculated age, safe public fields, no DOB, no contact info, no about/family statements) vs `ProfileResource` (full data for owner).
  - Added `family_background` column to `profiles` table.
  - Segregated `about` and `family_background` as **Private Information**, revealed only post-mutual acceptance, unlock payment, and dual OTP.
  - Deterministic profile completion formula: Basic Profile (60%), Private Information (10%), Partner Preferences (30%).
  - Profile activation requirements: verified email + 10 complete core biodata fields + completed partner preferences (`about` and `family_background` optional).
  - React UI enhancements: Public Profile Preview modal (`Modal.jsx`), private information protected cards, activation checklist, and controlled select dropdowns.
  - Extensible canonical religion support: 9 controlled religions, conditional sect handling (required for Islam, optional/cleared for non-Islam), updated completion formula & previews.
  - 20 comprehensive feature tests in `ProfileTest.php` (42 total automated tests passing, 183 assertions).
- **Phase 3 (Completed)**:
  - Discovery & candidate search endpoints: `GET /api/discovery/profiles` and `GET /api/discovery/profiles/{profile_code}`.
  - Access control enforcing authenticated session, verified email (`EMAIL_NOT_VERIFIED` 403), and active user status (`ACCOUNT_SUSPENDED` 403).
  - Migration `2026_09_07_010000_add_discovery_indexes_to_profiles_table.php` adding composite index `(profile_status, updated_at)`.
  - SQL-level exclusions: self-profile exclusion, non-active profile exclusion, suspended user exclusion, and unverified user exclusion.
  - Form request validation (`SearchProfilesRequest`) enforcing canonical options across all 9 filter types.
  - Public profile detail endpoint preserving zero-trust privacy serialization with `PublicProfileResource`.
  - Frontend SPA components: `api/discovery.js`, `ProfileCard.jsx`, `SearchProfilesPage.jsx`, and `CandidateDetailPage.jsx`.
  - Frontend routes `/search` and `/profiles/:profileCode` wrapped in `VerifiedRoute`.
  - 25 comprehensive feature tests in `DiscoveryTest.php` (67 total automated tests passing, 284 assertions).


