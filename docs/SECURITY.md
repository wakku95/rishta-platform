# SECURITY ARCHITECTURE & POLICIES

## 1. Threat Modeling & Core Defenses

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Data Scraping / Enumeration** | Sequential IDs hidden behind random public `profile_code` (e.g. `RK-10482`) and UUIDs for payments. Pagination limits (15/page) and search rate limits. |
| **Unauthorized Contact Exposure** | Zero-trust API architecture. Phone numbers and emails are excluded from all profile resource serializers. Only `/api/releases/{id}` releases phone numbers after dual verification. |
| **Payment Spoofing** | Frontend return URLs never trigger fulfillment. Only cryptographically verified webhooks or server-to-server inquiry can set status to `paid`. |
| **SMS Exhaustion / Bombing** | OTP generation blocked until payment confirmed. Rate limits: 3 attempts per phone per 10 minutes. Max 5 verification attempts before invalidating. |
| **Bypassing Consent Flow** | State machines on `rishta_requests` and `contact_releases` enforce chronological progression. Requests cannot be accepted if cancelled or expired. |
| **Harassment / Stalking** | Two-way blocking excludes users from search and requests completely. User reporting feeds directly to admin moderation dashboard. |

---

## 2. Authentication & Authorization Policies

- **Laravel Policies**:
  - `ProfilePolicy`: Controls viewing, editing, and status toggling.
  - `RishtaRequestPolicy`: Prevents requesting oneself, requesting blocked users, or duplicate requests.
  - `PaymentPolicy`: Restricts initiation to the request initiator on accepted requests only.
  - `ContactReleasePolicy`: Confines visibility strictly to the two involved users post-release.
- **Sanctum Token Security**:
  - Tokens expire after 30 days of inactivity.
  - Revoked automatically upon password change or account deletion.
- **Discovery Access Control**:
  - Requires authenticated session and verified email address (`EMAIL_NOT_VERIFIED` 403 guard).
  - Suspended accounts blocked immediately from discovery (`ACCOUNT_SUSPENDED` 403 guard).
  - Self-exclusion: Authenticated user's own profile is excluded from candidate search results.
  - Inactive/Draft/Hidden exclusion: Ineligible candidate profiles are excluded at SQL query level.

---

## 3. Input Validation & Data Sanitization

- Form Request classes (`RegisterRequest`, `UpdateProfileRequest`, `SendRishtaRequest`, `SubmitReportRequest`) validate all incoming parameters strictly against allowed types and values.
- Rich text fields (`about`, `details`) stripped of HTML tags using `strip_tags()` to prevent XSS.
- Mass assignment protection (`$fillable` attributes explicitly declared on all Eloquent models).

---

## 4. Rate Limiting Rules

Configured in `bootstrap/app.php` / `routes/api.php`:
- `auth`: 5 attempts / minute (brute force protection).
- `search`: 60 requests / minute.
- `requests`: 20 requests / hour (prevents spam proposal blasts).
- `otp`: 3 send requests / 10 minutes per IP/User.
- `general_api`: 120 requests / minute.

---

## 5. Audit Logging

Sensitive actions write an immutable record to the `admin_actions` table and system log:
- Profile suspensions and status overrides.
- Manual contact releases or revocations.
- Report resolutions.
- Payment disputes and refunds.
