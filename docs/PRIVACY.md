# PRIVACY ARCHITECTURE & INFORMATION MINIMIZATION

## 1. The Privacy-First Mandate

In South Asian matrimonial matchmaking, unwarranted distribution of personal data (especially of young women) creates profound anxiety and social vulnerability. The Rishta Platform treats privacy as its foundational design constraint, not an afterthought.

---

## 2. Information Classification & Exposure Matrix

| Data Element | Storage Location | Public Visitor | Authenticated Searcher | Shortlist / Request | Post-Acceptance | Post-Payment & Dual OTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Profile Code** | `profiles.profile_code` | Visible | Visible | Visible | Visible | Visible |
| **Age (Calculated)** | Derived from DOB | Visible | Visible | Visible | Visible | Visible |
| **Exact Date of Birth** | `profiles.date_of_birth`| **NEVER** | **NEVER** | **NEVER** | **NEVER** | **NEVER** |
| **City & Country** | `profiles.city` | Visible | Visible | Visible | Visible | Visible |
| **Education & Profession**| `profiles` | Visible | Visible | Visible | Visible | Visible |
| **Marital Status & Height**| `profiles` | Visible | Visible | Visible | Visible | Visible |
| **Religion & Sect** | `profiles` | Visible | Visible | Visible | Visible | Visible |
| **Managed By** | `profiles.managed_by` | Visible | Visible | Visible | Visible | Visible |
| **About Statement** | `profiles.about` | **HIDDEN** | **HIDDEN** | **HIDDEN** | **HIDDEN** | **REVEALED** |
| **Family Background** | `profiles.family_background` | **HIDDEN** | **HIDDEN** | **HIDDEN** | **HIDDEN** | **REVEALED** |
| **Full Name** | `users.name` | Hidden | Hidden | Hidden | First Name Only | Full Name |
| **Email Address** | `users.email` | **NEVER** | **NEVER** | **NEVER** | **NEVER** | **NEVER** |
| **Exact Street Address** | N/A | **EXCLUDED IN MVP** | | | | |
| **Phone Number** | `users.phone_number` | **HIDDEN** | **HIDDEN** | **HIDDEN** | **HIDDEN** | **REVEALED** |
| **CNIC / National ID** | N/A | **EXCLUDED IN MVP** | | | | |
| **Profile Photos** | N/A | **EXCLUDED IN MVP** | | | | |

---

## 3. Server-Side Enforcement (Zero-Trust Frontend)

- **Rule**: Never transmit sensitive fields over the wire with the expectation that CSS or React will hide them (`display: none`).
- **Resource Classes**:
  - `PublicProfileResource`: Emits only safe, public controlled demographic attributes, calculated age, and genuine verification indicators (`verifications.email_verified`). Strictly omits exact DOB, about, family background, user_id, internal database IDs, and user credentials.
  - `ProfileResource`: Emits full profile data (including private about and family background) strictly for the owning authenticated user.
  - `ContactReleaseResource`: The **sole** resource permitted to emit phone numbers, executed only after `status === 'released'`.

---

## 4. Search Engine Crawling & Indexing Rules

- Private profiles must **never** be indexed by search engines.
- `robots.txt` disallows `/api/*`, `/profiles/*`, `/dashboard/*`.
- Single page meta tags on profile views include `<meta name="robots" content="noindex, nofollow">`.
- Only marketing pages (`/`, `/about`, `/how-it-works`, `/pricing`) allow indexing.

---

## 5. Right to Erasure & Account Deletion

When a user deletes their account:
1. Profile status set to `deleted` (soft delete).
2. Public profile code invalidated.
3. Phone number and email anonymized in historical records where legal retention allows.
4. Active sessions and Sanctum tokens immediately revoked.
