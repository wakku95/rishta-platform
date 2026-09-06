# ARCHITECTURE DECISION RECORDS (ADRs)

## ADR 001: Provider-Independent Payment Gateway Abstraction
- **Context**: PayFast is the initial payment gateway for Pakistan. However, business needs may require Safepay, JazzCash, Easypaisa, or multiple gateways in the future.
- **Decision**: Define `PaymentGatewayInterface` and a domain `PaymentService`. Core controllers and state machines interact strictly with the interface. PayFast is implemented as an adapter (`PayFastPaymentService`).
- **Consequence**: Gateway can be swapped or augmented with minimal effort and zero alterations to request acceptance, contact release, or reporting logic.

## ADR 002: Contact Unlock Payment Rule (Post-Mutual Acceptance Only)
- **Context**: Many platforms charge upfront subscription fees or pay-per-search, which creates high trust friction in Pakistani culture.
- **Decision**: Registration, profile creation, search, shortlisting, sending requests, and accepting requests are 100% free. Payment occurs **only** after a Rishta Request is accepted.
- **Consequence**: Users only pay when there is tangible, mutual evidence of interest. Builds high trust.

## ADR 003: Initiator-Only Payer Model
- **Context**: Requiring both parties to pay creates deadlock where one party delays or refuses payment after acceptance.
- **Decision**: Only the original sender of the Rishta Request pays the contact unlock fee (e.g. Rs. 300 PKR). The recipient does not pay. The rule is strictly gender-neutral.
- **Consequence**: Removes payment deadlocks and provides a clear single transaction path.

## ADR 004: Post-Payment SMS OTP Verification
- **Context**: SMS OTP delivery incurs direct telecommunications costs.
- **Decision**: No SMS OTP is dispatched before payment confirmation is verified via server-side webhook.
- **Consequence**: Prevents financial loss from spam phone verification requests and fake users trying to trigger free SMS.

## ADR 005: Zero Public Photos in MVP
- **Context**: Public photos on Pakistani platforms attract harassment, unauthorized downloading, screenshotting, and misuse on social media.
- **Decision**: Matrimonial profiles do not display public photos in MVP. Users exchange photos privately after mutual contact unlocking (via WhatsApp or family meetings).
- **Consequence**: Dramatically improves female candidate safety and family trust, while eliminating heavy image moderation overhead in MVP.

## ADR 006: No In-App Chat in MVP
- **Context**: Real-time chat requires complex moderation, presence management, and often degrades into casual dating behaviors.
- **Decision**: Exclude in-app chat. Once contacts are unlocked, parties connect via WhatsApp or phone call.
- **Consequence**: Keeps the platform focused strictly on serious discovery and mutual consent. Eliminates real-time chat moderation burden.

## ADR 007: Server-Side Zero-Trust Data Isolation
- **Context**: Sensitive details (phone numbers, emails) should never be exposed prematurely.
- **Decision**: Sensitive attributes are excluded from all profile resource serializers at the database/API query level. Never rely on frontend CSS hiding.
- **Consequence**: Eliminates risks of data exposure via browser developer tools.

## ADR 008: Sanctum SPA Cookie-Based Authentication
- **Context**: Web Single Page Applications storing bearer tokens in `localStorage` or `sessionStorage` are vulnerable to XSS and token exfiltration.
- **Decision**: Use Laravel Sanctum SPA cookie-based session authentication with HttpOnly, Secure, SameSite cookies and CSRF protection (`EnsureFrontendRequestsAreStateful`). Bearer tokens in localStorage are strictly prohibited in the React web SPA.
- **Consequence**: Enterprise-grade session security, zero client-side token exposure to JavaScript.

## ADR 009: Random Public Profile Codes & Extensible String Columns
- **Context**: Exposing sequential auto-increment profile numbers (`RK-1`, `RK-2`) leaks platform growth metrics and facilitates automated enumeration and scraping. Furthermore, hardcoded database ENUMs require schema locks to extend values.
- **Decision**: Use cryptographically random, uppercase alphanumeric profile codes (`RK-XXXXXX`) generated upon model creation. Use string columns validated via Laravel Form Requests rather than rigid database ENUMs for values like `marital_status`, `managed_by`, and `profile_status`.
- **Consequence**: Prevents platform business intelligence leakage and enumeration attacks; allows frictionless additions of new options without database migrations.

## ADR 010: Controlled Public Fields & Private Information Segregation
- **Context**: Free-form text fields in public profiles invite phone number/email leakage and require intensive moderation. Additionally, candidates and families need to know their sensitive family details and personal statements are not publicly readable during casual browsing.
- **Decision**: All public biodata fields (gender, religion, sect, city, education, profession, marital status, height, managed by) use canonical controlled options defined in `App\Constants\ProfileOptions` and exposed via `GET /api/profile/options`. Free-text fields (`about`, `family_background`) are strictly categorized as **Private Information** and excluded from `PublicProfileResource`. Public views expose calculated age only (never full DOB). Private information is optional for profile activation and is only released after mutual rishta acceptance, unlock fee payment, and dual OTP verification.
- **Consequence**: Pre-emptively prevents contact leakage, improves search filtering reliability, guarantees privacy for families, and simplifies profile moderation.

## ADR 011: Canonical Extensible Religion Options & Conditional Sects
- **Context**: The platform's profiles originally defaulted strictly to Islam and required Islamic sects. To accommodate all citizens and communities seeking matrimonial arrangements without compromising data consistency, religion must be extensible across canonical faith options while prohibiting unstructured free text.
- **Decision**:
  1. Expand canonical `ProfileOptions::RELIGIONS` to: `Islam`, `Christianity`, `Hinduism`, `Sikhism`, `Buddhism`, `Jainism`, `Other`, `No religion`, and `Prefer not to say`.
  2. Maintain strict rejection of free-text inputs for religion across profile and preferences endpoints.
  3. Keep `sect` as a distinct field conditionally required for `Islam` (`Sunni`, `Shia`, `Ahle-Hadith`, `Other`, `Prefer not to say`), while making it optional and automatically cleared if a non-Islamic faith is selected.
  4. Design architecture so future phases can cleanly introduce religion-specific denominations without schema changes.
- **Consequence**: Full multi-faith compatibility, backwards-compatible with existing Islamic profiles, seamless filtering, and clear UX with no broken or forced sect dropdowns.

## ADR 012: Privacy-Safe Discovery Architecture, Server-Side Filtering & Zero-Trust Serialization
- **Context**: Candidate discovery must enable authenticated and verified users to browse and filter active matrimonial candidates while strictly preventing public scraping, enumeration, and contact/identity data leaks.
- **Decision**:
  1. Restrict discovery (`GET /api/discovery/profiles`) and public candidate details (`GET /api/discovery/profiles/{profile_code}`) strictly to authenticated users with verified email addresses (`EMAIL_NOT_VERIFIED` 403 guard).
  2. Exclude user's own profile, non-active profiles (draft, hidden, paused, suspended, deleted), suspended users, and unverified user accounts directly in SQL queries.
  3. Calculate age boundaries dynamically against `date_of_birth` using calendar-precise date math without storing redundant age columns.
  4. Enforce canonical options validation via `SearchProfilesRequest` matching `ProfileOptions`.
  5. Use `PublicProfileResource` exclusively for both search results and public profile details, strictly stripping `about`, `family_background`, full `date_of_birth`, `email`, `phone_number`, user credentials, `user_id`, and database IDs.
  6. Implement server-side pagination with default 12 items per page backed by composite index `(profile_status, updated_at)`.
- **Consequence**: Eliminates client-side data leaks, prevents scrapers from extracting private biographies, ensures consistent performance, and provides a dignified matrimonial discovery experience without dating/social media patterns.



