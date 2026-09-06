# DATABASE DESIGN & SCHEMA SPECIFICATION

## 1. Overview & Principles

- **Engine**: MySQL 8.0+ / InnoDB (with SQLite support for rapid local testing).
- **ID Strategy**:
  - Internal auto-increment `id` for primary keys and foreign key relationships (high index performance).
  - External public identifiers (`profile_code` e.g., `RK-10482`, `uuid` for payments) to prevent resource scraping and enumeration attacks.
- **Strict Referential Integrity**: Foreign keys with `ON DELETE CASCADE` or `ON DELETE RESTRICT` where appropriate.
- **Performance Indexes**: All columns participating in search queries, user foreign keys, and status checks are indexed.

---

## 2. Entity Relationship Diagram (Conceptual)

```
        +-----------------------+
        |         users         |
        +-----------------------+
           | 1             1 |
           |                 |
           v 1               v 1
+-----------------------+  +------------------------+
|       profiles        |  |  profile_preferences   |
+-----------------------+  +------------------------+
           | 1
           |
       +---+---+
       |       |
       v *     v *
+-----------+ +-----------+
| shortlists| |  reports  |
+-----------+ +-----------+

Users participate in interactions:
    users (sender)    ---> rishta_requests <--- users (receiver)
                                  | 1
                                  v 1
                               payments
                                  | 1
                                  v 1
                           contact_releases
                                  | 1
                                  v *
                           otp_verifications
```

---

## 3. Table Schemas

### 3.1 `users`
Authentication credentials, role, and private contact details.
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NULL,          -- Private contact number
    phone_verified_at TIMESTAMP NULL,      -- Set after OTP verification
    role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active' NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_role_status (role, status)
);
```

### 3.2 `profiles`
Matrimonial discovery biodata (strictly separated from authentication).
```sql
CREATE TABLE profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    profile_code VARCHAR(32) NOT NULL UNIQUE, -- e.g., RK-10482
    gender ENUM('male', 'female') NOT NULL,
    date_of_birth DATE NOT NULL,
    religion VARCHAR(64) DEFAULT 'Islam' NOT NULL,
    sect VARCHAR(64) NULL,                    -- Sunni, Shia, etc.
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Pakistan' NOT NULL,
    education VARCHAR(100) NOT NULL,          -- Bachelor's, Master's, etc.
    profession VARCHAR(150) NOT NULL,
    marital_status ENUM('never_married', 'divorced', 'widowed', 'separated') NOT NULL,
    height_cm SMALLINT UNSIGNED NOT NULL,     -- In centimeters (e.g., 170cm = 5'7")
    about TEXT NULL,                          -- Private personal statement (revealed post-unlock)
    family_background TEXT NULL,              -- Private family background (revealed post-unlock)
    profile_status ENUM('active', 'hidden', 'paused', 'under_review', 'suspended', 'deleted') DEFAULT 'active' NOT NULL,
    can_receive_requests BOOLEAN DEFAULT TRUE NOT NULL,
    profile_source ENUM('self_registered', 'admin_assisted') DEFAULT 'self_registered' NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_search (gender, city, profile_status, can_receive_requests),
    INDEX idx_profiles_dob (date_of_birth),
    INDEX idx_profiles_education (education),
    INDEX idx_profiles_marital_status (marital_status)
);
```

### 3.3 `profile_preferences`
Filter criteria stored per candidate for match discovery.
```sql
CREATE TABLE profile_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL UNIQUE,
    preferred_gender ENUM('male', 'female') NOT NULL,
    min_age TINYINT UNSIGNED DEFAULT 18 NOT NULL,
    max_age TINYINT UNSIGNED DEFAULT 70 NOT NULL,
    preferred_cities JSON NULL,              -- Array of strings: ["Lahore", "Islamabad"]
    religion VARCHAR(64) DEFAULT 'Islam' NULL,
    sect VARCHAR(64) NULL,
    min_education VARCHAR(100) NULL,
    marital_status JSON NULL,                -- Array: ["never_married"]
    min_height_cm SMALLINT UNSIGNED NULL,
    max_height_cm SMALLINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

### 3.4 `rishta_requests`
Explicit interest requests between registered users.
```sql
CREATE TABLE rishta_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT UNSIGNED NOT NULL,
    receiver_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'pending',
        'accepted',
        'declined',
        'cancelled',
        'expired',
        'contact_unlock_pending',
        'contact_unlocked'
    ) DEFAULT 'pending' NOT NULL,
    accepted_at TIMESTAMP NULL,
    declined_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_requests_users (sender_id, receiver_id, status),
    INDEX idx_requests_receiver (receiver_id, status)
);
```

### 3.5 `payments`
Transactions linked to accepted Rishta Requests.
```sql
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,                -- Payer (always the request initiator)
    rishta_request_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,                 -- e.g., 300.00
    currency CHAR(3) DEFAULT 'PKR' NOT NULL,
    provider VARCHAR(64) DEFAULT 'payfast' NOT NULL,
    transaction_reference VARCHAR(128) NULL UNIQUE, -- PayFast / Gateway transaction ID
    status ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded', 'expired') DEFAULT 'pending' NOT NULL,
    gateway_response JSON NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rishta_request_id) REFERENCES rishta_requests(id) ON DELETE CASCADE,
    INDEX idx_payments_status (status),
    INDEX idx_payments_user (user_id)
);
```

### 3.6 `contact_releases`
The release ledger managing access to phone numbers.
```sql
CREATE TABLE contact_releases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rishta_request_id BIGINT UNSIGNED NOT NULL UNIQUE,
    payment_id BIGINT UNSIGNED NOT NULL UNIQUE,
    initiator_id BIGINT UNSIGNED NOT NULL,
    recipient_id BIGINT UNSIGNED NOT NULL,
    initiator_phone VARCHAR(32) NOT NULL,
    recipient_phone VARCHAR(32) NOT NULL,
    initiator_verified_at TIMESTAMP NULL,
    recipient_verified_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    status ENUM(
        'pending_payment',
        'payment_completed',
        'awaiting_verification',
        'released',
        'expired',
        'revoked'
    ) DEFAULT 'pending_payment' NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (rishta_request_id) REFERENCES rishta_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_releases_status (status)
);
```

### 3.7 `otp_verifications`
Mobile verification sessions.
```sql
CREATE TABLE otp_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,           -- Hashed OTP (never raw plain text)
    purpose VARCHAR(64) DEFAULT 'contact_release' NOT NULL,
    attempts TINYINT UNSIGNED DEFAULT 0 NOT NULL,
    max_attempts TINYINT UNSIGNED DEFAULT 5 NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user_phone (user_id, phone_number, expires_at)
);
```

### 3.8 `shortlists`
Private bookmarks.
```sql
CREATE TABLE shortlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    profile_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_shortlists_user_profile (user_id, profile_id)
);
```

### 3.9 `blocks`
Mutual access suppression.
```sql
CREATE TABLE blocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    blocker_id BIGINT UNSIGNED NOT NULL,
    blocked_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_blocks_pair (blocker_id, blocked_id)
);
```

### 3.10 `reports`
User moderation complaints.
```sql
CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    reported_user_id BIGINT UNSIGNED NOT NULL,
    reason ENUM(
        'fake_information',
        'inappropriate_behavior',
        'harassment',
        'already_married',
        'fraud_scam',
        'misleading_profile',
        'other'
    ) NOT NULL,
    details TEXT NULL,
    status ENUM('pending', 'reviewed', 'dismissed', 'action_taken') DEFAULT 'pending' NOT NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reports_status (status)
);
```

### 3.11 `admin_actions`
Immutable audit log of administrative decisions.
```sql
CREATE TABLE admin_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    target_type VARCHAR(64) NOT NULL,         -- 'user', 'profile', 'report', 'payment'
    target_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(64) NOT NULL,              -- 'suspend_user', 'approve_profile', etc.
    note TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
```
