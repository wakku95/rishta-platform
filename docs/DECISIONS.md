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

