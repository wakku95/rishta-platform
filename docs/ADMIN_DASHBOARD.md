# ADMIN DASHBOARD SPECIFICATION

## 1. Role & Purpose

The Admin Dashboard is the operational control center for the platform. It provides staff with tools to oversee user safety, adjudicate user reports, audit payment releases, and support offline families via admin-assisted profiles.

---

## 2. Dashboard Modules & Views

### 2.1 Analytics & KPI Overview
- Total Registered Users (with email verification %).
- Active Matrimonial Profiles.
- Rishta Requests Sent vs. Accepted.
- Payments Volume (PKR & count).
- Pending Reports & Flagged Profiles.

### 2.2 User & Profile Management
- Filter by: `status` (active, suspended, deleted), `gender`, `city`, `profile_source`.
- Actions:
  - View full user biodata and audit history.
  - Suspend user / Invalidate sessions.
  - Toggle profile status (`active`, `under_review`, `suspended`).
  - View related requests and reports.

### 2.3 Admin-Assisted Profiles (Offline Onboarding)
- Allows administrators to create profiles for real families who reach out offline or via community referrals.
- Profile source is flagged as `admin_assisted`.
- Requires recording explicit guardian/candidate consent notes.
- **Strict Rule**: Never fabricate fake, misleading, or bot profiles.

### 2.4 Reports & Moderation Queue
- List of open user reports sorted by severity and submission date.
- Displays: Reporter, Reported User, Reason, Supporting Details.
- Adjudication Actions:
  - **Dismiss Report**: Mark as unfounded with an internal admin note.
  - **Issue Warning**: Send automated security notification email to reported user.
  - **Suspend Account**: Revoke tokens, cancel pending requests, hide profile.

### 2.5 Payments & Contact Release Audits
- Complete ledger of all `payments` and corresponding `contact_releases`.
- Search by Payment UUID, Transaction Reference, or User Email.
- Detailed view showing transaction amounts, gateway responses, and dual-OTP verification timestamps.
- Ability to manually re-query payment status or revoke unauthorized contact releases.

### 2.6 System Audit Log
- Searchable log of all actions performed by admin operators from `admin_actions`.
