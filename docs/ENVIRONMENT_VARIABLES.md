# ENVIRONMENT VARIABLES & CONFIGURATION REFERENCE

This document details every required and optional environment variable for the Rishta Platform.

## 1. Application & Core Settings

```env
APP_NAME="Rishta Platform"
APP_ENV=local               # local | staging | production
APP_KEY=                    # Generated via `php artisan key:generate`
APP_DEBUG=true              # Set to false in production
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

## 2. Database Configuration

```env
DB_CONNECTION=mysql         # mysql | sqlite
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rishta_platform
DB_USERNAME=root
DB_PASSWORD=
```

## 3. Sanctum & Session

```env
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
```

## 4. Mail Configuration

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@rishta-platform.com"
MAIL_FROM_NAME="Rishta Platform"
```

## 5. Payment Gateway (PayFast & Provider-Independent)

```env
PAYMENT_DEFAULT_GATEWAY=payfast        # payfast | fake
PAYMENT_CONTACT_UNLOCK_FEE=300.00      # Fee in PKR
PAYFAST_MERCHANT_ID=
PAYFAST_SECURED_KEY=
PAYFAST_ENV=sandbox                    # sandbox | live
PAYFAST_BASE_URL=https://ipguat.apps.net.pk/Ecommerce/api/Transaction/
PAYFAST_CHECKOUT_URL=https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken
```

## 6. SMS & OTP Configuration

```env
SMS_DEFAULT_PROVIDER=mock              # mock | pakistan_sms
SMS_API_KEY=
SMS_SENDER_ID=RISHTA
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```
