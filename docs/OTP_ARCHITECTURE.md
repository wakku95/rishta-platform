# OTP & SMS VERIFICATION ARCHITECTURE

## 1. Design & Security Principles

1. **Post-Payment Execution**:
   - OTP SMS is sent **only** after payment confirmation.
   - Sending SMS incurs recurring operational costs; premature OTP generation before payment confirmation is strictly prohibited.
2. **Provider Decoupling**:
   - `SmsServiceInterface` isolates the SMS transport gateway.
   - The OTP lifecycle (generation, hashing, throttling, verification) is managed exclusively by `OtpService`.
3. **Defense Against Abuse**:
   - Hashed storage: Plain text OTP values are never stored in the database.
   - 6-digit numeric codes generated with `random_int(100000, 999999)`.
   - Expiration: Exactly 10 minutes from generation.
   - Maximum attempts: 5 invalid entries invalidates the OTP session.
   - Resend throttling: Minimum 60-second cooldown between resends; maximum 3 OTPs per phone number per hour.

---

## 2. SMS Gateway Interface

Located at `app/Contracts/SmsServiceInterface.php`:

```php
namespace App\Contracts;

interface SmsServiceInterface
{
    /**
     * Dispatch an SMS message to a mobile number.
     * 
     * @param string $phoneNumber Formatted e.g. "+923001234567"
     * @param string $message Text content
     * @return bool Success status
     */
    public function sendSms(string $phoneNumber, string $message): bool;
}
```

### Implementations:
- `App\Services\Sms\PakistanSmsService`: Communicates with Pakistani SMS gateway APIs (e.g., Telenor, Jazz, or BrandSMS HTTP API).
- `App\Services\Sms\MockSmsService`: Logs OTP to `storage/logs/laravel.log` in local/testing environments without incurring real costs.

---

## 3. Mutual Contact Release State Machine

Both parties must be mobile-verified before contact release:

```
[Payment Confirmed: Status = paid]
                 |
                 v
   [ContactRelease Created: awaiting_verification]
                 |
        +--------+--------+
        |                 |
        v                 v
[Initiator Submits OTP] [Recipient Submits OTP]
        |                 |
        v                 v
[initiator_verified_at]  [recipient_verified_at]
        |                 |
        +--------+--------+
                 |
        (Both verified?)
                 |
                 v
      [Status: released]
      [released_at = now()]
                 |
                 v
[Phone Numbers Unlocked on /requests/{id}]
```

---

## 4. Privacy Guarantee on Contact Release

- Phone numbers are stored in `users.phone_number` and copied into `contact_releases` at creation time.
- The `/api/releases/{requestId}` endpoint enforces authorization:
  - Caller must be either `initiator_id` or `recipient_id`.
  - If `status !== 'released'`, response returns `{ "status": "awaiting_verification", "initiator_verified": bool, "recipient_verified": bool }` and hides actual phone numbers.
  - When `status === 'released'`, each user receives the other's verified phone number.
