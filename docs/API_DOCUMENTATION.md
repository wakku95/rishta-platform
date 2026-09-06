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

## 3. Profile Endpoints (`/api/profile` & `/api/profiles`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Get current user's profile and preferences | Yes |
| `POST` | `/api/profile` | Create initial profile | Yes |
| `PUT` | `/api/profile` | Update profile information | Yes |
| `PUT` | `/api/profile/preferences` | Update partner preferences | Yes |
| `PUT` | `/api/profile/status` | Change profile status (active/paused/hidden) | Yes |
| `GET` | `/api/profiles` | Search & filter profiles (paginated, safe fields) | Yes (or guest teaser) |
| `GET` | `/api/profiles/{code}` | View detailed profile by public `profile_code` | Yes |
| `POST` | `/api/profiles/{code}/shortlist` | Add profile to private shortlist | Yes |
| `DELETE` | `/api/profiles/{code}/shortlist`| Remove profile from private shortlist | Yes |

*Note: Contact info is never in `/api/profiles` responses.*

---

## 4. Rishta Requests (`/api/requests`)

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

## 5. Payments & Contact Release (`/api/payments` & `/api/releases`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/initiate` | Create payment record & get gateway redirect for accepted request | Yes (Initiator only) |
| `GET` | `/api/payments/{uuid}` | Check status of a payment session | Yes |
| `POST` | `/api/payments/webhook` | Gateway callback (PayFast APG notification) | Public (Signature verified) |
| `GET` | `/api/releases/{requestId}` | Check release status & view authorized contacts | Yes (Participating parties) |

---

## 6. Mobile OTP Verification (`/api/otp`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/otp/send` | Request SMS OTP for verified contact release | Yes |
| `POST` | `/api/otp/verify` | Submit 6-digit OTP code to verify mobile | Yes |

*Rule: `/api/otp/send` returns error `403` if payment is not yet confirmed.*

---

## 7. Shortlist, Blocking & Reporting

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
