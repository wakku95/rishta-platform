# SYSTEM ARCHITECTURE: Rishta Platform

## 1. High-Level Architecture Overview

The Rishta Platform is built as a decoupled **Single Page Application (SPA)** communicating over HTTPS with a **Laravel 12 REST API**, persisting to a **MySQL** relational database.

```
+-------------------------------------------------------------+
|                      Client Layer (SPA)                     |
|         React 19/18 + Vite + Tailwind CSS + Axios           |
|       (Mobile-First Responsive Layout, Burgundy Palette)    |
+-------------------------------------------------------------+
                               |
                        RESTful JSON API
                       Bearer Token (Sanctum)
                               v
+-------------------------------------------------------------+
|                     Laravel 12 REST API                     |
|                                                             |
|   +-------------------+              +------------------+   |
|   | Routing & Sanctum |              |  Form Requests   |   |
|   |   Rate Limiting   |              |  & Policies      |   |
|   +-------------------+              +------------------+   |
|                                                             |
|   +-----------------------------------------------------+   |
|   |                   Controller Layer                  |   |
|   +-----------------------------------------------------+   |
|                               |                             |
|   +-----------------------------------------------------+   |
|   |                    Service Layer                    |   |
|   |                                                     |   |
|   |   +--------------------+     +------------------+   |   |
|   |   |   PaymentService   |     |    OtpService    |   |   |
|   |   +--------------------+     +------------------+   |   |
|   |             |                         |             |   |
|   |   +--------------------+     +------------------+   |   |
|   |   | PaymentGateway     |     | SmsService       |   |   |
|   |   | Interface          |     | Interface        |   |   |
|   |   +--------------------+     +------------------+   |   |
|   |             |                         |             |   |
|   |   +---------+--------+       +--------+---------+   |   |
|   |   | PayFastAdapter   |       | PakistanSms      |   |   |
|   |   | FakePayment...   |       | MockSmsAdapter   |   |   |
|   |   +------------------+       +------------------+   |   |
|   +-----------------------------------------------------+   |
|                               |                             |
|   +-----------------------------------------------------+   |
|   |               Eloquent Models / Database            |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Persistence Layer                       |
|           MySQL 8.0+ Database (Indexed & Normalized)        |
+-------------------------------------------------------------+
```

---

## 2. Decoupled Service Architecture

### 2.1 Payment Gateway Abstraction
Business logic never references PayFast directly. Controllers interact solely with `PaymentService`, which consumes `PaymentGatewayInterface`:

```php
namespace App\Contracts;

use App\Models\Payment;
use App\Models\RishtaRequest;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Initialize payment transaction and return redirect URL or form payload.
     */
    public function initiatePayment(Payment $payment): array;

    /**
     * Verify callback or webhook signature and transaction status from gateway.
     */
    public function verifyWebhook(Request $request): PaymentVerificationResult;

    /**
     * Query gateway directly to verify payment status by transaction reference.
     */
    public function queryPaymentStatus(string $transactionReference): PaymentVerificationResult;
}
```

#### Pluggable Drivers:
- `App\Services\Payments\PayFastPaymentService`: Production adapter communicating with PayFast APG.
- `App\Services\Payments\FakePaymentService`: Sandbox adapter for automated tests and local development.
- *Future*: `SafepayPaymentService`, `JazzCashPaymentService`, `EasypaisaPaymentService`.

### 2.2 SMS & OTP Abstraction
Sending SMS costs money; therefore, SMS delivery is cleanly isolated from OTP state management:

```php
namespace App\Contracts;

interface SmsServiceInterface
{
    /**
     * Send an outbound SMS text message.
     */
    public function sendSms(string $recipientNumber, string $message): bool;
}
```

#### Separation of Responsibilities:
1. `OtpService`:
   - Generates random cryptographically secure 6-digit PIN.
   - Hashes OTP before saving to database (SHA-256 or Bcrypt).
   - Validates cooldown timer, maximum retry attempts (max 5), and expiration (10 mins).
   - Marks OTP as consumed.
2. `SmsService`:
   - Takes raw phone number and SMS string, executes HTTP post to SMS gateway (e.g. Pakistan SMS / Twilio / Mock).

### 2.3 Email & Notifications
- Handled asynchronously through Laravel Queues (`Queue::later` or queued Mailable).
- Events emitted for state changes (`RishtaRequestAccepted`, `PaymentCompleted`, `ContactReleased`).
- In-app notification records stored in `notifications` table for real-time header bell badges.

---

## 3. Security & Boundary Isolation

### 3.1 Authorization Matrix
| Resource | Action | Authorized Actor | Policy Rule |
| :--- | :--- | :--- | :--- |
| Profile | View Details | Any Authenticated User | Cannot be blocked; Profile must be active. |
| Profile | Edit | Owner or Admin | `user_id === auth()->id() \|\| auth()->user()->is_admin` |
| Rishta Request | Send | Authenticated User | Receiver != Self; No active blocks; No pending duplicate. |
| Rishta Request | Accept/Decline | Recipient Only | `receiver_id === auth()->id()` |
| Payment | Initiate/Pay | Initiator Only | `rishta_request.sender_id === auth()->id()` & `status == accepted` |
| OTP | Submit OTP | Involved Users | `user_id === initiator_id \|\| user_id === recipient_id` |
| Contact Info | View Phone | Both Verified Parties | `contact_releases.status === 'released'` |

### 3.2 Sensitive Data Sanitization & Discovery Architecture
Profile API responses strictly isolate public and private domains using dedicated **Laravel API Resources**:
- `PublicProfileResource`: Exposes only public demographics (`profile_code`, `age`, `gender`, `religion`, `sect`, `city`, `education`, `profession`, `marital_status`, `height`, `height_formatted`, `managed_by`, `profile_status`, and `verifications.email_verified`). Strictly strips `about`, `family_background`, full `date_of_birth`, `email`, `phone_number`, `user_id`, internal database `id`, and passwords.
- `ProfileResource`: Emits candidate biodata, private introductory statements, and preferences strictly to the authenticated profile owner.
- `DiscoveryController`: Enforces verified email, active profile status, self-exclusion, suspended user exclusion, canonical filter queries directly on database indexes, and server-side pagination.

---

## 4. Frontend Architecture (React SPA)

- **Routing**: Client-side routing with React Router.
  - Public routes: `/`, `/about`, `/how-it-works`, `/pricing`, `/login`, `/register`, `/verify-email`, `/privacy-policy`, `/terms`.
  - Protected User routes: `/dashboard`, `/profile`, `/profile/edit`, `/search`, `/profiles/:code`, `/requests`, `/requests/:id`, `/shortlist`, `/payments`, `/notifications`, `/settings`.
  - Protected Admin routes: `/admin/dashboard`, `/admin/users`, `/admin/profiles`, `/admin/requests`, `/admin/payments`, `/admin/reports`.
- **State Management**:
  - Auth context provider holding current user, Sanctum token, email verification state, and profile completion badge.
  - Notifications context for unread counters.
- **HTTP Client**: Axios instance configured with `baseURL = /api`, automated `Authorization: Bearer <token>` injection, and global 401 interceptor.
