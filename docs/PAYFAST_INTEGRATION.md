# PAYFAST INTEGRATION SPECIFICATION

## 1. Overview

PayFast (APG) provides debit/credit card, UnionPay, bank account, and wallet processing within Pakistan. The integration uses PayFast's redirection flow with server-side webhook validation.

---

## 2. Configuration Parameters

Configured via `config/payment.php` from `.env`:

```env
PAYMENT_DEFAULT_GATEWAY=payfast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_SECURED_KEY=your_secured_key
PAYFAST_ENV=sandbox # sandbox | live
PAYFAST_BASE_URL=https://ipguat.apps.net.pk/Ecommerce/api/Transaction/
PAYFAST_CHECKOUT_URL=https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken
```

*Security Note: Secret keys must NEVER be checked into version control.*

---

## 3. Initiation Flow

1. User clicks **"Unlock Contact Details (Rs. 300)"** on an accepted request.
2. Client calls `POST /api/payments/initiate` with `{ "rishta_request_id": 123 }`.
3. Server verifies:
   - Request is in `accepted` status.
   - User is the `sender_id` (initiator).
   - No active or paid payment exists for this request.
4. Server creates a `Payment` record with a UUID.
5. Server calls `PayFastPaymentService::initiatePayment()`:
   - Generates API token / checkout parameters.
   - Computes checksum / hash per PayFast API standards using `PAYFAST_SECURED_KEY`.
   - Returns `{ redirect_url, form_data }` to client.
6. Client redirects browser to PayFast checkout portal.

---

## 4. Webhook / IPN Verification

1. When the transaction completes, PayFast sends a server-to-server POST to:
   `POST /api/payments/webhook`
2. `PaymentController::webhook` delegates to `PaymentService::handleWebhook()`:
   - Verifies incoming IP or cryptographic hash signature.
   - Extracts `transaction_reference`, `order_id` (Payment UUID), `amount`, and `status_code`.
   - Confirms amount matches exactly with internal record.
   - If status indicates success (e.g., `00` or `000` depending on APG specification):
     - Transitions `Payment` status to `paid`.
     - Emits `App\Events\PaymentConfirmed`.
   - Returns HTTP 200 JSON to PayFast to acknowledge receipt.

---

## 5. Return & Cancellation Flow

- **Success Return URL**: `https://rishta-platform.com/payments/{uuid}/callback`
  - React SPA fetches `/api/payments/{uuid}` to display status.
  - If server webhook has processed it, screen displays: "Payment Confirmed! Please verify your mobile number to unlock contact details."
  - If still pending, displays a polling loader for up to 10 seconds.
- **Cancel Return URL**: `https://rishta-platform.com/payments/{uuid}/cancelled`
  - Screen displays: "Payment Cancelled. You can retry payment anytime from your requests page."
