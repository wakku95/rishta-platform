# UI & UX GUIDELINES

## 1. Emotional Tone & Cultural Alignment

The Rishta Platform is built for serious matrimonial discovery in Pakistan.
- **Atmosphere**: Solemn, respectable, trustworthy, warm, dignified.
- **NOT a dating app**: Strictly avoid swiping gestures, hearts, "Like/Match" terminology, hookup vernacular, or superficial gamification.
- **Appropriate Terminology**:
  - Use: **"Send Rishta Request"** (not "Like" or "Swipe Right")
  - Use: **"Mutual Interest Confirmed"** (not "It's a Match!")
  - Use: **"Matrimonial Profile"** (not "Dating Profile")
  - Use: **"Unlock Contact Details"** (not "Buy Credits")

---

## 2. Mobile-First Principles

Over 85% of traffic in Pakistan arrives via Android smartphones.
- **Target Screen Widths**: 360px (entry-level Android), 390px, 414px, and tablets/desktops.
- **Touch Targets**: Minimum 44px height for all interactive buttons and form controls.
- **One-Hand Usability**: Primary CTAs positioned within the natural thumb zone.
- **Form Design**: Clean, single-column field layouts with explicit labels (never rely solely on placeholder text).

---

## 3. Screen States & Feedback Loop

Every interactive screen must handle four explicit states:
1. **Loading State**: Subtle skeleton placeholders (not jarring full-screen spinners).
2. **Empty State**: Friendly, explanatory message and a clear next action (e.g., "No sent requests yet. Search profiles to find a suitable rishta.").
3. **Error State**: Non-technical, actionable explanations (e.g., "This request has already been acted upon.").
4. **Success State**: Clear confirmation banner or modal with reassurance of next steps.

---

## 4. Key User Journeys

### 4.1 Discovery & Search
- Canonical filter drawer (Gender, Age Range, City, Religion, Sect, Education, Profession, Marital Status, Height Range).
- Compact, mobile-friendly profile cards showing:
  - Profile Code (`#RK-XXXXXX`)
  - Age & Gender (`25 yrs • female`)
  - City (`Lahore`)
  - Faith & Sect (`Islam • Sunni` or `Christianity`)
  - Education & Profession (`Master's` · `Software / IT`)
  - Height & Marital Status (`5'7" (170 cm)` · `Never Married`)
  - Verification badge (`Email Verified`)
  - Managed By indicator (`Parent` / `Self`)
  - Primary Action: `[View Profile]` button (strictly no likes, swipes, or hearts)
- Clear Filters CTA and informative empty state when zero matches occur.

### 4.2 Rishta Request Interaction
- **Sender View**: "Request Sent. Waiting for response."
- **Recipient View**: "You have received a Rishta Request from Profile #RK-9912. Review biodata and choose to Accept or Decline."
- **Accepted State (Sender)**:
  - "Mutual interest confirmed! You can now unlock contact details to speak with the candidate/family."
  - Highlighted CTA: **"Unlock Contact Details (Rs. 300)"**

### 4.3 Payment & OTP Unlock
- Payment summary card with transparent fee breakdown (Rs. 300, no hidden charges).
- Post-payment OTP input with 6 auto-advancing digit boxes, countdown timer (60s), and "Resend OTP" button.
- Contact release screen: Displays verified phone number, WhatsApp quick-link, and courteous advice on contacting families respectfully.

### 4.4 Profile Creation & Faith Inclusivity
- Religion selection uses canonical controlled dropdowns (`Islam`, `Christianity`, `Hinduism`, `Sikhism`, `Buddhism`, `Jainism`, `Other`, `No religion`, `Prefer not to say`). Free-text religion is disallowed to maintain privacy and clean filtering.
- Sect/branch selection appears dynamically only when `Islam` is selected (`Sunni`, `Shia`, `Ahle-Hadith`, `Other`, `Prefer not to say`). For other faiths or non-religious selections, the sect input is hidden and not required.
- Public previews and biodata cards display religion cleanly (e.g. `Christianity` or `Islam (Sunni)`), without empty parentheses when sect is absent.
