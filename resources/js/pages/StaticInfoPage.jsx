import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="burgundy" size="md">Step-by-Step Guide</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">How Rishta Platform Works</h1>
        <p className="text-sm text-charcoal-600">The transparent, dignified discovery process designed for Pakistani families.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-4 text-sm text-charcoal-700 leading-relaxed">
          <h3 className="font-bold text-base text-burgundy-900">1. Registration & Email Verification (Free)</h3>
          <p>Create an account with your email and verify your address. Only verified email accounts can participate in matrimonial matchmaking.</p>

          <h3 className="font-bold text-base text-burgundy-900">2. Profile Creation (Free)</h3>
          <p>Enter your biodata, education, profession, city, and partner preferences. No public photos, exact home address, or phone numbers are ever exposed.</p>

          <h3 className="font-bold text-base text-burgundy-900">3. Search & Discovery (Free)</h3>
          <p>Browse through filtered profiles based on your family preferences. Shortlisting profiles is completely private and free.</p>

          <h3 className="font-bold text-base text-burgundy-900">4. Send Rishta Request (Free)</h3>
          <p>Send a formal Rishta Request to express interest. The recipient receives a polite notification and can review your biodata.</p>

          <h3 className="font-bold text-base text-burgundy-900">5. Recipient Accepts or Declines (Free)</h3>
          <p>The recipient can accept or decline without fee. Mutual interest is only confirmed if the recipient explicitly accepts.</p>

          <h3 className="font-bold text-base text-burgundy-900">6. Paid Contact Unlock (Rs. 300)</h3>
          <p>Only the person who originally sent the proposal is asked to pay Rs. 300 via PayFast to unlock contact details. The recipient never pays.</p>

          <h3 className="font-bold text-base text-burgundy-900">7. SMS OTP & Verified Contact Reveal</h3>
          <p>Both candidates verify their active mobile number via a 6-digit SMS OTP code. Once both are verified, mutual phone numbers are unlocked so communication can continue outside the platform via phone call or WhatsApp.</p>
        </div>
      </Card>
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="gold" size="md">Transparent Pricing</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Simple, Honest Pricing</h1>
        <p className="text-sm text-charcoal-600">No monthly subscriptions. No pay-per-search. Pay only upon mutual interest.</p>
      </div>

      <Card className="text-center p-6 border-burgundy-200">
        <div className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold mb-2">Contact Unlock Fee</div>
        <div className="font-serif text-4xl font-extrabold text-burgundy-800 mb-1">
          Rs. 300 <span className="text-sm font-normal text-charcoal-600">PKR</span>
        </div>
        <p className="text-xs text-charcoal-600 mb-6">One-time micro-fee per mutually accepted proposal.</p>

        <div className="text-left space-y-3 max-w-md mx-auto text-xs text-charcoal-700 bg-cream-100 p-4 rounded-xl border border-cream-200 mb-6">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to register and create profile</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to search and shortlist</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to send Rishta Requests</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Free to accept or decline requests</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Charged ONLY to original requester after recipient accepts</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Covers secure SMS OTP verification for both sides</div>
        </div>

        <p className="text-[11px] text-charcoal-500">
          Secure payment processed via PayFast (debit/credit card, UnionPay, bank account, and mobile wallets).
        </p>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <Badge variant="burgundy" size="md">Our Mission</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">About RaabtaNow</h1>
        <p className="text-sm text-charcoal-600">Restoring dignity, privacy, and family respect to Pakistani matchmaking.</p>
      </div>

      <Card className="space-y-4 text-sm text-charcoal-700 leading-relaxed">
        <p>
          In modern Pakistan, finding a life partner has become increasingly fraught with anxiety. Traditional matchmaking often involves unregulated intermediaries who circulate personal biodatas and contact numbers across public WhatsApp groups without consent. Conversely, Western dating apps encourage casual swiping and superficial photo browsing incompatible with serious marriage intentions.
        </p>
        <p>
          <strong>RaabtaNow</strong> was built from the ground up to offer a better alternative. We believe matrimonial discovery should be private, mutual, and family-friendly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
          <div className="p-4 bg-cream-100 rounded-xl border border-cream-200">
            <h4 className="font-semibold text-charcoal-900 mb-1">Privacy First</h4>
            <p className="text-xs text-charcoal-600">We do not display public photos, phone numbers, or addresses. Personal information is only revealed when both parties verify mobile numbers after mutual consent.</p>
          </div>
          <div className="p-4 bg-cream-100 rounded-xl border border-cream-200">
            <h4 className="font-semibold text-charcoal-900 mb-1">Solemn Purpose</h4>
            <p className="text-xs text-charcoal-600">Strictly matrimonial. Zero tolerance for casual dating, harassment, or fake accounts. Both self-registered individuals and admin-assisted real families are supported.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2 pb-4 border-b border-stone-200">
        <Badge variant="burgundy" size="md">Privacy & Data Protection</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Privacy Policy</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-charcoal-800 leading-relaxed p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">1. Introduction & Overview</h3>
          <p>
            At <strong>RaabtaNow</strong>, we hold the sanctity, modesty, and honor of candidate privacy as our paramount responsibility. This Privacy Policy outlines our strict protocols regarding the collection, storage, and controlled release of matrimonial information.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-700">
            <li><strong>Account & Verification Data:</strong> Legal name, email address, password hash, and active Pakistani mobile number.</li>
            <li><strong>Matrimonial Demographics (Public):</strong> Age, gender, faith, sect, city of residence, education, profession, height, and marital status.</li>
            <li><strong>Confidential Statements (Private):</strong> Detailed personal bio, family background, and partner preferences.</li>
            <li><strong>Transactional Records:</strong> Payment attempt references, transaction IDs, timestamps, and payment status. We never collect or store credit/debit card numbers or bank PINs on our servers; all payments are processed through State Bank authorized payment gateways (PayFast).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">3. Zero Public Exposure Guarantee</h3>
          <p>
            RaabtaNow does not publicly display candidate photos, phone numbers, home addresses, or full email addresses. Browsing candidates can only review verified educational, professional, and demographic criteria.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">4. Two-Way Controlled Contact Release</h3>
          <p>
            Contact details (mobile phone, email, and name) are strictly unlocked <strong>ONLY</strong> when:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-charcoal-700 mt-1">
            <li>A candidate sends a formal Rishta expression of interest.</li>
            <li>The recipient explicitly reviews and accepts the proposal.</li>
            <li>The initiator completes the standard contact unlock fee (Rs. 300 PKR).</li>
            <li>Both parties successfully verify their phone numbers via a 6-digit SMS OTP code.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">5. Data Retention & Deletion Rights</h3>
          <p>
            Users reserve the complete right to update, hide, or permanently delete their profiles from our database at any time through their account dashboard or by writing to <strong>support@raabtanow.com</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-stone-200 text-xs text-stone-500">
          <p>Registered Office: RaabtaNow, L95, 48C, Korangi, Karachi, Pakistan. | Phone: +92-323-9225450</p>
        </div>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2 pb-4 border-b border-stone-200">
        <Badge variant="burgundy" size="md">User Agreement</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Terms & Conditions</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-charcoal-800 leading-relaxed p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">1. Eligibility & Solemn Purpose</h3>
          <p>
            RaabtaNow is strictly a halal, family-oriented matrimonial platform designed exclusively for individuals and families genuinely seeking marriage (Nikah). The platform must not be used for casual dating, friendships, commercial solicitation, or any non-matrimonial purposes. Users must be at least 18 years of age.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">2. Truthful & Accurate Biodata</h3>
          <p>
            By submitting a profile, you affirm that all details—including age, marital status, education, and profession—are truthful and verifiable. Providing false information or misrepresenting identity constitutes a material violation and will result in immediate profile termination without notice.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">3. Fees & Payment Terms</h3>
          <p>
            Registration, browsing, profile creation, and receiving connection requests are completely free of charge. A standard micro-fee of <strong>Rs. 300 PKR</strong> is levied only on the proposal initiator upon mutual proposal acceptance to unlock verified contact details and finance two-way SMS OTP infrastructure.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">4. Code of Conduct & Respect</h3>
          <p>
            Candidates and family representatives agree to communicate with courtesy, modesty, and mutual respect. Any harassment, inappropriate language, fraudulent behavior, or commercial spam will lead to instant account suspension and blacklist.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">5. Disclaimer of Matrimonial Guarantee</h3>
          <p>
            While RaabtaNow verifies email and phone numbers via SMS OTP, families are urged to conduct standard, thorough family background checks and due diligence prior to formalizing wedding engagements.
          </p>
        </div>

        <div className="pt-4 border-t border-stone-200 text-xs text-stone-500">
          <p>RaabtaNow | Address: L95, 48C, Korangi, Karachi, Pakistan. | Email: support@raabtanow.com</p>
        </div>
      </Card>
    </div>
  );
}

export function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2 pb-4 border-b border-stone-200">
        <Badge variant="gold" size="md">Refund & Cancellation</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Return & Refund Policy</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-charcoal-800 leading-relaxed p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">1. Overview of Digital Services</h3>
          <p>
            RaabtaNow provides online matrimonial discovery services. Browsing, shortlisting, and proposal exchange are free. The single chargeable service is the <strong>Contact Unlock Fee (Rs. 300 PKR)</strong>, charged only after mutual acceptance to initiate phone verification and contact release.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">2. Refund Eligibility</h3>
          <p>
            Refunds are granted under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-700 mt-1">
            <li><strong>Duplicate Charges:</strong> If a technical glitch or network error causes your account or card to be charged more than once for the same request, the duplicate transaction will be refunded in full.</li>
            <li><strong>System Failure:</strong> If payment succeeds but our system fails to deliver the verification service or unlock due to technical failure, you are entitled to a full refund.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">3. Non-Refundable Scenarios</h3>
          <p>
            Once mutual SMS phone verification is completed and the counterpart's contact details (name, phone number, and email) have been successfully displayed on screen, the unlock fee is considered fully consumed and is non-refundable. Personal preferences, lack of compatibility, or subsequent decision not to pursue marriage outside the platform do not qualify for a refund.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">4. Refund Process & Timelines</h3>
          <p>
            To request a refund for an eligible transaction, please email <strong>support@raabtanow.com</strong> within 7 calendar days of the transaction, providing your Request Code, Payment Transaction Reference, and registered email address. Approved refunds are credited back to the original payment method (card or mobile wallet) within 5–7 business days in accordance with banking guidelines.
          </p>
        </div>

        <div className="pt-4 border-t border-stone-200 text-xs text-stone-500">
          <p>Customer Support: support@raabtanow.com | Phone: +92-323-9225450 | Karachi, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function DeliveryPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2 pb-4 border-b border-stone-200">
        <Badge variant="burgundy" size="md">Fulfillment & Delivery</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Service Delivery Policy</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-charcoal-800 leading-relaxed p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">1. Nature of Delivery</h3>
          <p>
            RaabtaNow operates solely as a digital matrimonial software platform. We do not sell or deliver any physical goods, parcels, or tangible items. Consequently, <strong>no shipping fees, courier handling, or physical transit times apply</strong>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">2. Instant Electronic Delivery</h3>
          <p>
            All paid services—namely the Contact Unlock feature—are delivered electronically and immediately:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-700 mt-1">
            <li>Upon confirmed payment gateway checkout (Rs. 300 PKR), the SMS OTP verification interface is instantly enabled for both candidates within 0 to 60 seconds.</li>
            <li>Upon valid completion of SMS OTP verification, the counterpart's phone number, email address, and direct WhatsApp contact link are displayed immediately on the screen and archived in the user's dashboard.</li>
            <li>An immediate email confirmation with connection details is dispatched simultaneously to the user's registered inbox.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-burgundy-900 mb-2">3. Service Inquiries & Support</h3>
          <p>
            If you encounter any delay in SMS OTP receipt or digital contact display after payment, our customer support desk is available to assist and verify delivery:
          </p>
          <p className="text-xs text-charcoal-700 mt-1">
            Email: <strong>support@raabtanow.com</strong> | WhatsApp / Call: <strong>+92-323-9225450</strong>
          </p>
        </div>

        <div className="pt-4 border-t border-stone-200 text-xs text-stone-500">
          <p>RaabtaNow Matrimonial Services | Head Office: L95, 48C, Korangi, Karachi, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function ContactUsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2 pb-4 border-b border-stone-200">
        <Badge variant="burgundy" size="md">Get In Touch</Badge>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Contact & Support</h1>
        <p className="text-sm text-charcoal-600">We are here to assist Pakistani families with dignity, privacy, and dedicated guidance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base text-burgundy-900 border-b border-stone-200 pb-2">Head Office Details</h3>
          <div className="space-y-3 text-xs text-charcoal-800">
            <div>
              <span className="font-bold block text-stone-500">Business Name:</span>
              <span className="font-serif text-sm font-extrabold text-burgundy-900">RaabtaNow</span>
            </div>
            <div>
              <span className="font-bold block text-stone-500">Registered Office Address:</span>
              <span>L95, 48C, Korangi, Karachi, Sindh, Pakistan</span>
            </div>
            <div>
              <span className="font-bold block text-stone-500">Customer Support Helpline:</span>
              <span className="font-mono font-bold text-charcoal-900">+92 323 9225450</span>
            </div>
            <div>
              <span className="font-bold block text-stone-500">Official Inquiries & Support:</span>
              <span className="font-mono font-bold text-burgundy-800">support@raabtanow.com</span>
            </div>
            <div>
              <span className="font-bold block text-stone-500">Operational Hours:</span>
              <span>Monday – Saturday: 10:00 AM – 7:00 PM (PST)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-stone-50 border-stone-200">
          <h3 className="font-bold text-base text-burgundy-900 border-b border-stone-200 pb-2">Services & Offerings</h3>
          <ul className="space-y-2 text-xs text-charcoal-700">
            <li className="flex items-center gap-2">✓ Verified Pakistani Matrimonial Profiles</li>
            <li className="flex items-center gap-2">✓ Confidential & Private Biodata Discovery</li>
            <li className="flex items-center gap-2">✓ Two-Way Mutual Consent Proposal Requests</li>
            <li className="flex items-center gap-2">✓ Secure Dual SMS OTP Verification (Rs. 300)</li>
            <li className="flex items-center gap-2">✓ Direct Family WhatsApp & Mobile Release</li>
            <li className="flex items-center gap-2">✓ Dedicated Matchmaking Assistance</li>
            <li className="flex items-center gap-2">✓ Overseas Pakistani Matrimonial Search</li>
            <li className="flex items-center gap-2">✓ Zero Public Photo / Phone Exposure Policy</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
