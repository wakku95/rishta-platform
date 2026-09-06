# AUTHENTICATION & IDENTITY ARCHITECTURE

## 1. Overview

Authentication in Rishta Platform is built strictly on **Laravel Sanctum SPA cookie-based authentication**. In accordance with high-security privacy standards, the React Single Page Application (SPA) does **NOT** store authentication credentials or bearer tokens in `localStorage` or `sessionStorage` (which are vulnerable to XSS exfiltration).

Instead, Sanctum leverages first-party **HttpOnly, Secure, SameSite session cookies** protected with CSRF tokens.

---

## 2. Sanctum SPA Cookie-Based Authentication Lifecycle

```
[React SPA]
    |
    +---> GET /sanctum/csrf-cookie
    |     (Sets XSRF-TOKEN cookie in browser)
    |
    +---> POST /api/auth/login
    |     (Credentials sent with X-XSRF-TOKEN header)
    |
[Laravel Sanctum API]
    |
    +---> Authenticates user, starts secure session
    |
    +---> Returns 200 OK + HttpOnly session cookie
    |
[React SPA]
    |
    +---> GET /api/auth/me (Uses credentials: 'include')
    |     (Session cookie sent automatically by browser)
    |
    +---> POST /api/auth/logout
          (Invalidates session and clears cookie)
```

- **Client Configuration**:
  - Axios configured with `withCredentials: true` and `withXSRFToken: true`.
  - Cookie security attributes: `HttpOnly`, `SameSite=lax` (or `strict`), `Secure` in production.
  - Zero token exposure to JavaScript execution context.

---

## 3. Email Verification Flow

Email verification ensures valid user identity and reduces spam bots:

```
[User Registers]
       |
       v
[User Record Created] (email_verified_at = null)
       |
       v
[Event: Registered Emitted]
       |
       v
[Signed URL Email Sent via Laravel Mail]
       |
       v
[User Clicks Link in Email: /api/auth/email/verify/{id}/{hash}]
       |
       v
[Laravel Validates Signature & Timestamp]
       |
       v
[email_verified_at = now()] -> [Redirects to /email-verified in React SPA]
```

### Route Protection Middleware:
- Endpoints requiring verified status use the `verified` middleware.
- Unverified users may log in and complete their profile, but cannot send Rishta Requests or pay for contact unlocks.

---

## 4. Password Reset Mechanism

1. User requests reset at `/api/auth/forgot-password` with `email`.
2. System throttles requests (max 3 per 15 minutes).
3. Laravel generates a cryptographically secure token stored in `password_reset_tokens`.
4. User receives an email containing a link to the frontend: `https://domain.com/reset-password?token=XYZ&email=user@example.com`.
5. Frontend posts new password + token + email to `/api/auth/reset-password`.
6. Token is invalidated and password hash updated.
