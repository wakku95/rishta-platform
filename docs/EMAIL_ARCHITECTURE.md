# EMAIL NOTIFICATION ARCHITECTURE

## 1. Overview & Strategy

- **SMS vs Email Rule**: SMS is reserved exclusively for OTP codes due to cost. All other alerts, confirmations, and transactional updates use email.
- **Provider Decoupling**: Built on Laravel's native `Mail` and `Notification` systems, enabling seamless switches between SMTP, Mailgun, Postmark, Amazon SES, or local `log` driver.

---

## 2. Notification Catalog

| Trigger Event | Recipient | Subject | Priority |
| :--- | :--- | :--- | :--- |
| User Registration | New User | Verify Your Email Address | Immediate |
| Password Reset Request | User | Reset Your Password | Immediate |
| Rishta Request Received | Recipient | You Have Received a Rishta Request | Standard (Queued) |
| Rishta Request Accepted | Sender | Your Rishta Request Has Been Accepted! | Standard (Queued) |
| Rishta Request Declined | Sender | Update on Your Rishta Request | Standard (Queued) |
| Payment Confirmation | Payer | Payment Received - Verify Mobile Number | Immediate (Queued) |
| Mobile OTP Verified | User | Mobile Number Verified Successfully | Standard (Queued) |
| Contact Released | Both Parties | Contact Details Are Now Available | Immediate (Queued) |
| Account Reported / Warning | Target User | Security Alert Regarding Your Account | Immediate |

---

## 3. Template & Branding Guidelines

- **Tone**: Warm, dignified, respectful, and family-oriented.
- **Visual Style**: Clean HTML email template matching the Burgundy/Cream/Gold design system.
- **Privacy Enforcement**: Transactional emails never display full third-party phone numbers or addresses.
- **Unsubscribe / Preferences**: Users can manage email notification preferences from their Account Settings.
