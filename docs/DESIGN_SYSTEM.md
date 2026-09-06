# DESIGN SYSTEM SPECIFICATION

## 1. Visual Identity & Palette

The palette reflects high-trust Pakistani/South Asian matrimonial aesthetics: royal burgundy/maroon, warm cream backgrounds, subtle gold accents, and muted sage greens.

### Color Tokens (Tailwind CSS v4 Configuration)
```css
:root {
  /* Primary Brand Colors */
  --color-primary-50:  #fdf2f4;
  --color-primary-100: #fce7ea;
  --color-primary-600: #881337; /* Royal Maroon */
  --color-primary-700: #700f2d; /* Deep Burgundy Primary */
  --color-primary-800: #580c23;
  --color-primary-900: #3f0819;

  /* Secondary Accents */
  --color-gold-400: #facc15;
  --color-gold-500: #d97706; /* Warm Gold */
  --color-gold-600: #b45309;

  /* Neutrals & Surfaces */
  --color-surface-bg:    #fcfaf8; /* Warm Off-White / Cream */
  --color-surface-card:  #ffffff; /* Clean Card White */
  --color-surface-muted: #f5f0eb; /* Subtle warm border/fill */
  --color-text-main:     #1c1917; /* Dark Charcoal / Stone 900 */
  --color-text-muted:    #57534e; /* Stone 600 */

  /* Functional Status */
  --color-success: #15803d; /* Forest / Muted Green */
  --color-warning: #b45309; /* Amber */
  --color-danger:  #b91c1c; /* Crimson */
  --color-info:    #1d4ed8; /* Calm Blue */
}
```

---

## 2. Typography

- **Primary Font**: `Inter`, `Poppins`, or system `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.
- **Readability**:
  - Headings: Bold, dignified (`font-serif` or clean bold sans-serif).
  - Body: Regular, 15px - 16px with `line-height: 1.5` on mobile screens for effortless reading.
  - Badges / Micro-copy: 12px - 13px medium (`font-medium`).

---

## 3. Atomic Component Inventory

| Component | Purpose & Variants |
| :--- | :--- |
| `Button` | Variants: `primary` (Burgundy), `secondary` (Cream/Outline), `gold` (Accent), `danger` (Muted red), `ghost`. Supports `loading`, `disabled`, and icons. |
| `Input` | Text, email, phone, number. Clean borders, focus ring in Burgundy, explicit error text. |
| `Select` | Dropdown for city, education, marital status, religion. |
| `Badge` | Status indicators: `active`, `pending`, `accepted`, `verified`, `paid`. |
| `Card` | Clean border `border-stone-200`, subtle shadow `shadow-sm`, rounded corners `rounded-xl`. |
| `Modal` | Centered dialog with backdrop blur, accessible ESC/click-outside dismiss. |
| `Alert` | Informational or warning banners with icons. |
| `Toast` | Ephemeral notifications (success, error). |
| `EmptyState` | Icon + descriptive title + friendly text + CTA button. |
| `ProfileCard` | Standardized teaser/full card showing matrimonial attributes without sensitive contacts. |
| `OtpInput` | 6-box segmented numeric input with auto-tabbing and paste support. |
| `Pagination` | Responsive numbered or previous/next pagination controls. |
| `VerificationBadge` | "Email Verified" and "Mobile Verified" trust badges. |
