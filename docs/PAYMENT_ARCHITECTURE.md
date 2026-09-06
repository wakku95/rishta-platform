# PAYMENT ARCHITECTURE & GATEWAY ABSTRACTION

## 1. Core Principles & Philosophy

1. **Strictly Decoupled**: The payment gateway is an external dependency abstracted behind `PaymentGatewayInterface`. The core domain logic (Rishta Request state, user entitlement, contact release) must have zero awareness of PayFast API nuances.
2. **Post-Mutual Consent Only**: Payments are never solicited for registration, profile viewing, or sending requests. Payment is triggered **only** after mutual interest is confirmed (request accepted).
3. **Payer Definition**: The original sender of the request is the only party prompted to pay the contact unlock fee (e.g., Rs. 300 PKR).
4. **Zero Trust on Frontend Return**: A user redirecting back from a gateway checkout page does **not** equal a successful payment. Payment is credited **only** upon cryptographic server-to-server webhook verification or direct API status inquiry.

---

## 2. Payment Gateway Interface

Located at `app/Contracts/PaymentGatewayInterface.php`:

```php
namespace App\Contracts;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentVerificationResult
{
    public function __construct(
        public readonly bool $isSuccessful,
        public readonly string $transactionReference,
        public readonly string $gatewayStatus,
        public readonly ?string $rawResponse = null,
        public readonly ?string $errorMessage = null
    ) {}
}

interface PaymentGatewayInterface
{
    /**
     * Generate checkout payload/redirect URL for the client.
     */
    public function initiatePayment(Payment $payment): array;

    /**
     * Handle incoming gateway webhook/IPN callback and verify authenticity.
     */
    public function verifyWebhook(Request $request): PaymentVerificationResult;

    /**
     * Check transaction status directly with the gateway.
     */
    public function queryPaymentStatus(string $transactionReference): PaymentVerificationResult;
}
```

---

## 3. Supported Gateways

| Gateway | Driver Name | Status | Purpose |
| :--- | :--- | :--- | :--- |
| **PayFast** | `payfast` | Primary MVP Gateway | Standard Pakistani debit/credit/wallet gateway |
| **Fake Gateway** | `fake` | Testing / Local Dev | Instant mock success/failure for CI and automated testing |
| **Safepay** | `safepay` | Future Extensibility | Ready for adapter addition |
| **JazzCash** | `jazzcash` | Future Extensibility | Direct mobile wallet support |
| **Easypaisa** | `easypaisa` | Future Extensibility | Direct mobile wallet support |

---

## 4. Payment Lifecycle State Machine

```
[Rishta Request Accepted]
           |
           v
   [Payment Created] (Status: pending, UUID generated)
           |
           v
 [Initiator Redirected to PayFast Checkout]
           |
      +----+----+
      |         |
      v         v
 [User Cancels] [User Pays]
      |         |
      v         v
 [Status:     [PayFast Dispatches Server Webhook]
  cancelled]    |
                v
          [Signature & Hash Verified by Laravel]
                |
           +----+----+
           |         |
           v         v
        [Valid]   [Tampered / Failed]
           |         |
           v         v
   [Status: paid]   [Status: failed]
           |
           v
[Event: PaymentConfirmed Emitted]
           |
           v
[Release Record: awaiting_verification]
[Trigger SMS OTP Process]
```

---

## 5. Security & Verification Rules

- **Idempotency**: Webhook handlers must be idempotent. If PayFast re-transmits a notification for an already `paid` record, the system logs the event and returns HTTP 200 without re-triggering side effects.
- **Data Integrity**: The callback amount and currency must be strictly matched against the database `payment.amount` and `payment.currency`.
- **Audit Logging**: All gateway payloads, signature validations, and status transitions are recorded in `payments.gateway_response` and system audit logs.
