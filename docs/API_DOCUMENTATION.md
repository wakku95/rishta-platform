# API SPECIFICATION & CONTRACTS

All API endpoints reside under `/api` and return standardized JSON responses.

## 1. Global Standards

### Headers
- `Accept: application/json`
- `Content-Type: application/json`
- `Authorization: Bearer <sanctum_token>` (for authenticated endpoints)

### Standard Success Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully."
}
```

### Standard Error Format
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  },
  "error_code": "VALIDATION_ERROR"
}
```

### HTTP Status Codes
- `200 OK`: Successful retrieval / idempotent update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Business rule violation (e.g., cannot request self).
- `401 Unauthorized`: Missing or invalid Sanctum token.
- `403 Forbidden`: Policy violation (e.g., trying to access contact before mutual verification).
- `404 Not Found`: Resource does not exist.
- `422 Unprocessable Entity`: Validation failure.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Generic unexpected server error.

---

## 2. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain Sanctum token | No |
| `POST` | `/api/auth/logout` | Revoke active Sanctum token | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user with profile status | Yes |
| `POST` | `/api/auth/email/verification-notification` | Resend verification email | Yes |
| `POST` | `/api/auth/forgot-password` | Send password reset link | No |
| `POST` | `/api/auth/reset-password` | Reset password using token | No |

---

## 3. Profile Endpoints (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile/options` | Retrieve canonical controlled dropdown choices (genders, religions, sects, cities, educations, professions, marital statuses, managed by) | No |
| `GET` | `/api/profile` | Get current authenticated user's full profile, preferences, and completion percentage | Yes |
| `GET` | `/api/profile/preview` | Public preview of user's own profile as seen by others (omits exact DOB, about, family background, and credentials) | Yes |
| `POST` | `/api/profile` | Create or update user matrimonial biodata with controlled options (starts in `draft` status) | Yes |
| `PUT` | `/api/profile` | Update profile matrimonial biodata | Yes |
| `GET` | `/api/profile/preferences` | Retrieve partner preferences | Yes |
| `PUT` | `/api/profile/preferences` | Create or update partner preferences | Yes |
| `POST` | `/api/profile/activate` | Activate profile (enforces verified email, complete biodata, and completed partner preferences) | Yes |
| `POST` | `/api/profile/hide` | Hide profile from public discovery | Yes |

*Note: Canonical religion values (`Islam`, `Christianity`, `Hinduism`, `Sikhism`, `Buddhism`, `Jainism`, `Other`, `No religion`, `Prefer not to say`) are enforced on profile creation, update, and partner preferences. Free-text input is prohibited. The `sect` field is conditionally required only when `religion === 'Islam'`; for non-Islamic profiles, `sect` is optional and cleared if previously set. Private information (`about`, `family_background`) and private credentials (`email`, `password`, `phone_number`, session tokens) are strictly excluded from all public profile serializers.*

---

## 4. Discovery & Candidate Search (`/api/discovery`)

| Method | Endpoint | Description | Auth Required | Email Verified |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/discovery/profiles` | Search active candidate profiles with canonical filters and server-side pagination | Yes | Yes |
| `GET` | `/api/discovery/profiles/{profile_code}` | Retrieve single candidate public profile by unique profile code | Yes | Yes |

### Query Parameters for `GET /api/discovery/profiles`
- `gender` (optional): `male` \| `female`
- `min_age` (optional): integer (18–80)
- `max_age` (optional): integer (18–80, $\ge$ `min_age`)
- `city` (optional): canonical city string from `ProfileOptions::CITIES`
- `religion` (optional): canonical religion from `ProfileOptions::RELIGIONS`
- `sect` (optional): canonical sect from `ProfileOptions::SECTS`
- `education` (optional): canonical education from `ProfileOptions::EDUCATIONS`
- `profession` (optional): canonical profession from `ProfileOptions::PROFESSIONS`
- `marital_status` (optional): canonical marital status from `ProfileOptions::MARITAL_STATUSES`
- `min_height` (optional): integer in centimeters (120–230)
- `max_height` (optional): integer in centimeters (120–230, $\ge$ `min_height`)
- `page` (optional): integer ($\ge 1$, default: 1)
- `per_page` (optional): integer (1–50, default: 12)

### Access & Exclusion Rules:
- **Authentication & Verification**: Both endpoints require authenticated users with verified email addresses. Unauthenticated requests return `401 Unauthorized` (`UNAUTHENTICATED`). Unverified users return `403 Forbidden` (`EMAIL_NOT_VERIFIED`). Suspended users return `403 Forbidden` (`ACCOUNT_SUSPENDED`).
- **Active Only**: Only profiles with `profile_status = 'active'` appear. Draft, hidden, paused, suspended, or deleted profiles are strictly excluded.
- **User Integrity**: Candidates whose user account is suspended or unverified are excluded.
- **Self-Exclusion**: The authenticated user's own profile is strictly excluded from discovery results.
- **Default Ordering**: Recently updated active profiles first (`ORDER BY updated_at DESC`).
- **Privacy Guarantee**: All results are serialized using `PublicProfileResource`. Never contains `about`, `family_background`, full `date_of_birth`, `email`, `phone_number`, `user_id`, or database IDs.

---

## 5. Rishta Requests (`/api/requests`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | Send Rishta Request to a profile (`receiver_id`) | Yes |
| `GET` | `/api/requests/sent` | List requests sent by current user | Yes |
| `GET` | `/api/requests/received` | List requests received by current user | Yes |
| `GET` | `/api/requests/{id}` | Get request detail & workflow progress | Yes |
| `POST` | `/api/requests/{id}/accept` | Recipient accepts the request | Yes |
| `POST` | `/api/requests/{id}/decline`| Recipient declines the request | Yes |
| `POST` | `/api/requests/{id}/cancel` | Sender cancels pending request | Yes |

---

## 6. Payments & Contact Release (`/api/payments` & `/api/releases`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/initiate` | Create payment record & get gateway redirect for accepted request | Yes (Initiator only) |
| `GET` | `/api/payments/{uuid}` | Check status of a payment session | Yes |
| `POST` | `/api/payments/webhook` | Gateway callback (PayFast APG notification) | Public (Signature verified) |
| `GET` | `/api/releases/{requestId}` | Check release status & view authorized contacts | Yes (Participating parties) |

---

## 7. Mobile OTP Verification (`/api/otp`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/otp/send` | Request SMS OTP for verified contact release | Yes |
| `POST` | `/api/otp/verify` | Submit 6-digit OTP code to verify mobile | Yes |

*Rule: `/api/otp/send` returns error `403` if payment is not yet confirmed.*

---

## 8. Shortlist, Blocking & Reporting

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/shortlist` | List all shortlisted profiles | Yes |
| `POST` | `/api/blocks` | Block a user (`blocked_id`) | Yes |
| `DELETE` | `/api/blocks/{userId}` | Unblock a user | Yes |
| `POST` | `/api/reports` | Submit report against a user/profile | Yes |

---

## 8. Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Fetch unread notifications with badge count | Yes |
| `PUT` | `/api/notifications/{id}/read`| Mark single notification as read | Yes |
| `PUT` | `/api/notifications/read-all`| Mark all notifications as read | Yes |

---

## 9. Admin Endpoints (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | KPI stats (users, profiles, payments, reports) | Admin |
| `GET` | `/api/admin/users` | Manage user accounts | Admin |
| `GET` | `/api/admin/profiles` | Review profiles, approve/flag | Admin |
| `POST` | `/api/admin/profiles/assisted`| Create an offline/admin-assisted profile | Admin |
| `GET` | `/api/admin/payments` | Audit transactions | Admin |
| `GET` | `/api/admin/reports` | Review reports, take punitive action | Admin |
| `PUT` | `/api/admin/reports/{id}/resolve`| Resolve report (suspend, dismiss, etc.) | Admin |
