# TESTING STRATEGY & TEST SUITES

## 1. Testing Philosophy

A matrimonial platform dealing with sensitive personal relationships and real monetary transactions requires rigorous automated testing. No feature is marked complete without automated tests.

---

## 2. Test Suites Overview

### 2.1 Backend Feature & Unit Tests (PHPUnit / Pest)

| Suite / Test File | Key Scenarios Covered |
| :--- | :--- |
| `AuthenticationTest` | Registration, login, Sanctum token generation, password reset, email verification link validation. |
| `ProfileManagementTest`| Profile creation, required fields, updating bio, profile code uniqueness, updating partner preferences. |
| `ProfileSearchTest` | Filtering by gender, age, city, education; exclusion of blocked users and hidden profiles; pagination verification; verification that contacts/photos are omitted. |
| `RishtaRequestTest` | Sending requests, duplicate request rejection, preventing requesting self, recipient accepting, recipient declining, cancellation. |
| `PaymentWorkflowTest` | Initiator pays only after acceptance, non-initiator forbidden from payment, gateway webhook signature validation, idempotency, fake gateway handling. |
| `OtpVerificationTest` | OTP blocked before payment confirmed, 6-digit generation, rate limits, attempt limits (max 5), expiration after 10 mins. |
| `ContactReleaseTest` | Strict release condition: initiator verified + recipient verified = contact revealed. Viewing contact unauthorized if unverified. |
| `BlockingAndReportingTest` | Blocking user excludes from search and requests; submitting report; admin resolving report. |
| `AdminDashboardTest` | Admin authorization gates, KPI statistics calculation, admin-assisted profile creation. |

### 2.2 Running Tests

```bash
# Run all tests
php artisan test

# Run a specific feature test
php artisan test --filter=RishtaRequestTest

# Run with test coverage
php artisan test --coverage
```
