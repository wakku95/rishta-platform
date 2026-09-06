# PROJECT OVERVIEW: Rishta Platform

## 1. Executive Summary

**Rishta Platform** is a privacy-first, culturally respectful Pakistani matrimonial discovery web application. It addresses the systemic friction, privacy concerns, harassment, and commercial exploitation common in both conventional dating apps and traditional informal matchmaking (*rishta aunties*).

The platform enforces a solemn, family-oriented matchmaking standard:
> **"Find suitable rishtas → express interest → mutual acceptance → paid contact unlock → mobile OTP verification → mutual contact sharing."**

---

## 2. Core Problem & Market Reality

### Traditional Matchmaking Limitations
- Heavy dependence on informal networks or middlemen (*rishta aunties*), who often charge extortionate retainers and lack verified data.
- Unsolicited circulation of sensitive biodatas, CNIC copies, and personal phone numbers across unauthorized WhatsApp groups.
- Lack of consent and boundary protection for individuals (especially women).

### Dating App Failures in Pakistan
- Western dating apps (Tinder, Bumble, etc.) carry strong cultural taboos and are unsuited for marriage intentions.
- Casual swiping, public photo browsing, instant chatting, and GPS proximity encourage harassment, superficial judgments, and privacy breaches.
- High rate of fake profiles, scammers, and married individuals seeking affairs.

### The Rishta Platform Solution
- **Zero Public Identification**: No public phone numbers, emails, addresses, or photos.
- **Dignified Discovery**: Structured matrimonial filters (city, education, profession, sect, marital status, height).
- **Consent-Driven Contact Disclosure**: Communication details are only released when **both** parties explicitly accept a Rishta Request.
- **Fraud & Cost Mitigation**: Micro-fee (e.g., Rs. 300) paid by the initiator only after mutual acceptance, followed by mandatory SMS OTP mobile verification for both parties before unlocking contacts.

---

## 3. Product Scope & Boundaries

### What the Platform IS:
- A high-trust matrimonial discovery registry.
- A mutual consent facilitation tool.
- A verified contact gateway for families and candidates.

### What the Platform IS NOT (Strict Exclusions):
| Feature | Included in MVP? | Rationale |
| :--- | :--- | :--- |
| Public Photos | **NO** | Eliminates superficial swiping, saves storage/moderation overhead, protects female candidates from photo misuse. |
| In-App Chat / Voice / Video | **NO** | Users transition to WhatsApp/direct phone calls once mutual consent is established. Keeps MVP focused, zero real-time chat moderation burden. |
| Stories, Feeds, Online Status | **NO** | Prevents casual social media behavior; maintains serious matchmaking tone. |
| AI / Algorithmic Matching | **NO** | Explicit database filtering provides transparent, reliable results without opaque black-box algorithms. |
| Public Contact Details | **NO** | Contact info is strictly protected server-side behind payment and dual-OTP verification. |

---

## 4. Key Personas & User Journeys

### 1. The Independent Candidate (Self-Registered)
- Pakistani educated professionals (in Pakistan or overseas diaspora) seeking serious marriage proposals.
- Desires control over who views their details, free from spam calls or workplace gossip.

### 2. The Family Representative (Parent / Guardian)
- Parents seeking matches for their son or daughter.
- Appreciates structured biodata fields, respectful terminology, and clear religious/cultural alignment.

### 3. The Offline Family (Admin-Assisted Profile)
- Real families who contact the platform offline through trusted community channels.
- Profiles are created by administrators with verifiable consent and tagged as `admin_assisted`. Never fake or bot profiles.

---

## 5. Success Metrics (KPIs)
1. **Request-to-Acceptance Ratio**: Quality of discovery matches.
2. **Acceptance-to-Unlock Conversion**: Trust in payment and verification flow.
3. **Report & Dispute Rate**: Target < 0.5% of active interactions.
4. **Time-to-Mutual Verification**: Smoothness of OTP flow after payment confirmation.
