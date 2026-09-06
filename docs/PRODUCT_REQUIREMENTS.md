# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Functional Requirements

### 1.1 Authentication & Account Management
- **User Registration**:
  - Required fields: Full Name, Email, Password, Password Confirmation.
  - Generates email verification token; sends signed verification email via Laravel Mail.
  - Role: Defaults to `user`. Administrator accounts assigned via database seeder or CLI.
- **Email Verification**:
  - Unverified users cannot perform key matrimonial actions (cannot send requests or pay).
- **Authentication**:
  - Secure token-based authentication via Laravel Sanctum.
  - Password hashing using Bcrypt (cost 12).
  - Forgot Password / Password Reset via secure time-limited tokens.
- **Account Controls**:
  - Change password.
  - Delete account (anonymizes requests, soft-deletes profile, terminates active sessions).

### 1.2 Matrimonial Profiles
- **Separation of Concerns**:
  - `users` table handles authentication credentials.
  - `profiles` table handles matrimonial biodata.
- **Profile Fields (MVP)**:
  - `profile_code`: Unique public identifier (e.g., `RK-10482`) to avoid exposing auto-increment database IDs.
  - `gender`: `male` | `female`.
  - `date_of_birth`: Date (used to derive age dynamically, never hardcode age).
  - `religion`: Canonical controlled string (`Islam`, `Christianity`, `Hinduism`, `Sikhism`, `Buddhism`, `Jainism`, `Other`, `No religion`, `Prefer not to say`). Free-text religion is prohibited.
  - `sect`: Controlled string (`Sunni`, `Shia`, `Ahle-Hadith`, `Other`, `Prefer not to say`). Required for Islamic profiles; omitted / cleared for non-Islamic profiles. Extensible for other faith denominations in future phases.
  - `city`: String (e.g., Lahore, Karachi, Islamabad, Faisalabad, Rawalpindi, Overseas).
  - `country`: String (default `Pakistan`).
  - `education`: Enum / String (Matric, Inter, Bachelor's, Master's, MPhil, Doctorate, Other).
  - `profession`: String (e.g., Software Engineer, Doctor, Teacher, Businessman, Banker, Homemaker, etc.).
  - `marital_status`: Enum (`never_married`, `divorced`, `widowed`, `separated`).
  - `height`: Integer (stored in centimeters or inches, formatted as 5'8", etc. in UI).
  - `about`: Multi-line text for background, family values, and personal description.
  - `profile_status`: `active`, `hidden`, `paused`, `under_review`, `suspended`, `deleted`.
  - `can_receive_requests`: Boolean (allows a user to pause requests without deleting profile).
  - `profile_source`: `self_registered` | `admin_assisted`.
- **Exclusions**:
  - Weight is **excluded** in MVP.
  - Public photos, CNIC, and exact street addresses are **strictly excluded**.

### 1.3 Partner Preferences
- Users can specify preferred criteria for prospective partners:
  - Preferred gender, age range (`min_age`, `max_age`), preferred cities, religion, sect, minimum education, marital status, height range (`min_height`, `max_height`).

### 1.4 Profile Discovery & Search
- **Free Search & Filter**:
  - Unauthenticated visitors can view sample teaser cards or search landing page; authenticated users can search full profile listings.
  - Filters: Gender, Age (calculated from DOB), City, Religion, Sect, Education, Marital Status, Height.
  - Server-side pagination (12 or 15 items per page) to prevent scraping.
  - Exclusions: Blocked users, hidden profiles, suspended profiles, and user's own profile are automatically excluded from search queries.

### 1.5 Shortlisting
- Users can bookmark profiles to their private "Shortlist" collection.
- Adding/removing from shortlist is instant and completely free.
- The target user is **never** alerted when someone shortlists them.

### 1.6 Rishta Requests
- **Initiation**:
  - User A clicks "Send Rishta Request" on Profile B.
  - System checks: User A cannot request themselves; neither user has blocked the other; no duplicate active request exists between the two users; receiver's profile is active and `can_receive_requests = true`.
- **States**:
  - `pending`: Request sent; waiting for recipient action.
  - `accepted`: Recipient consented; prompt initiator to pay for contact unlock.
  - `declined`: Recipient declined; terminal state (no contact released, no payment required).
  - `cancelled`: Initiator cancelled request prior to recipient response.
  - `expired`: Request not acted upon within timeout (e.g., 14 days).
  - `contact_unlock_pending`: Payment confirmed; awaiting mobile OTP verifications.
  - `contact_unlocked`: Both users verified mobile numbers; contact released.

### 1.7 Payment for Contact Unlock
- **Core Business Rule**:
  - Only the initiator (the person who originally sent the request) pays.
  - Payment is triggered **only after** the recipient has accepted the request.
  - Fee is fixed in PKR (e.g., Rs. 300).
- **Payment Lifecycle**:
  - State machine: `pending` → `paid` (or `failed`, `cancelled`, `expired`).
  - Integration with PayFast via provider-independent service pattern.
  - Server-side webhook confirmation is mandatory.

### 1.8 SMS OTP & Mobile Verification
- **Timing**: Triggered **only after** payment is marked `paid`.
- **Requirements**:
  - Both initiator and recipient must have their mobile numbers verified.
  - Initiator inputs/confirms their mobile number and submits 6-digit OTP.
  - Recipient inputs/confirms their mobile number and submits 6-digit OTP.
  - 6-digit cryptographically secure OTP, 10-minute expiry, max 5 attempts, rate-limited resends.

### 1.9 Contact Release
- Controlled via dedicated `contact_releases` record.
- When both `initiator_verified_at` and `recipient_verified_at` are present, status transitions to `released`.
- Contact numbers are displayed on a dedicated, authenticated release view.

### 1.10 Blocking & Reporting
- **Blocking**:
  - Two-way exclusion: If User A blocks User B, neither sees the other in search, lists, or requests.
- **Reporting**:
  - Categories: Fake information, Harassment, Inappropriate behavior, Already married, Fraud/scam, Misleading profile, Other.
  - Submitted directly to Admin Moderation queue.

### 1.11 Admin Back-Office
- Full dashboard for user management, profile approvals, payment audits, report adjudications, and manual/offline profile onboarding.

---

## 2. Non-Functional Requirements

### 2.1 Security & Data Protection
- Sanctum bearer tokens with expiration.
- Input validation on all endpoints using Laravel Form Requests.
- Rate limiting on sensitive endpoints (Login: 5/min, OTP Send: 3/10min, Search: 60/min).
- Sensitive contact info (phone/email) stripped from API responses until authorized.

### 2.2 Performance
- API response times < 200ms for p95 search and profile reads.
- Comprehensive database indexes on foreign keys, status fields, and search attributes.
- Avoid N+1 database queries through Eloquent eager loading (`with(...)`).

### 2.3 Responsiveness & Accessibility
- Mobile-first responsive UI built with Tailwind CSS.
- Optimized for standard Pakistani mobile devices (360px – 414px screen widths).
- Semantic HTML, high-contrast readable text, accessible form inputs.
