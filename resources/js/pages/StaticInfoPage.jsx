import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, CheckCircle2, HeartHandshake, PhoneCall, Mail, Clock, MapPin } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

export function HowItWorksPage() {
  const steps = [
    {
      num: '1',
      badge: 'Free Registration',
      badgeVariant: 'success',
      title: 'Dignified Private Profile Creation',
      image: '/images/raabtanow/step-profile-creation.jpg',
      alt: 'Pakistani woman thoughtfully creating a dignified matrimonial biodata on a tablet',
      desc: 'Create an account and fill in your comprehensive matrimonial biodata—education, profession, religious sect, family background, and partner preferences. No public photos, phone numbers, or residential addresses are ever exposed to the public or searchable on search engines.',
    },
    {
      num: '2',
      badge: 'Smart Discovery',
      badgeVariant: 'magenta',
      title: 'Demographic Filtering & Compatibility Search',
      image: '/images/raabtanow/step-search-discovery.jpg',
      alt: 'Father and son reviewing filtered matrimonial candidate profiles together',
      desc: 'Filter verified candidates by age, city, education, profession, sect, marital status, and height. Shortlist compatible profiles privately and consult with your family in a comfortable, respectful home setting.',
    },
    {
      num: '3',
      badge: 'Mutual Consent',
      badgeVariant: 'magenta',
      title: 'Formal Rishta Proposal with Full Dignity',
      image: '/images/raabtanow/step-mutual-proposal.jpg',
      alt: 'Formal matrimonial proposal with gold seal representing mutual honor and consent',
      desc: 'Send a formal expression of matrimonial interest. The candidate and their family review your biodata and can accept or decline freely without awkwardness. No contact details are exchanged without explicit two-way acceptance.',
    },
    {
      num: '4',
      badge: 'Rs. 300 Unlock Fee',
      badgeVariant: 'gold',
      title: 'SMS OTP Verification & Direct Contact Unlock',
      image: '/images/raabtanow/step-contact-unlock.jpg',
      alt: 'Smartphone showing verified SMS code and unlocked direct WhatsApp connection',
      desc: 'Upon mutual acceptance, the initiator pays a nominal Rs. 300 fee via Safepay. Both parties complete two-way SMS OTP phone verification. Verified mobile numbers and a direct WhatsApp connection are instantly unlocked for families to communicate.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 px-4">
      <SEOHead
        title="How Online Rishta Works | Safe & Private Pakistani Matrimonial | RaabtaNow"
        description="Learn how RaabtaNow's dignified Pakistani matrimonial discovery process works: private biodata, mutual consent proposals, and secure SMS OTP contact verification."
        canonicalPath="/how-it-works"
        isIndexable={true}
      />

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="magenta" size="md">Step-by-Step Guide</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
          How RaabtaNow Works
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
          A transparent, family-centric matrimonial process built on privacy, mutual consent, and verified contact exchange.
        </p>
      </div>

      {/* 4 Visual Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="bg-navy-800 border border-slate-750 rounded-2xl shadow-xl hover:border-magenta-500/50 transition-all overflow-hidden flex flex-col group"
          >
            <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-navy-900 shrink-0">
              <img
                src={step.image}
                alt={step.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

              <div className="absolute top-3 left-3 z-10">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-magenta-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-lg border border-white/25">
                  {step.num}
                </span>
              </div>

              <div className="absolute top-3 right-3 z-10">
                <Badge variant={step.badgeVariant} size="sm" className="shadow-md font-bold">
                  {step.badge}
                </Badge>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-2 bg-navy-800">
              <div>
                <h3 className="font-serif font-bold text-white text-lg tracking-tight mb-2 group-hover:text-magenta-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Privacy Architecture Card */}
      <Card className="p-6 sm:p-8 bg-navy-850 border border-slate-750 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-700 shadow-lg">
            <img
              src="/images/raabtanow/privacy-trust.jpg"
              alt="Privacy & Trust Architecture"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="font-serif font-bold text-white text-lg">
                Privacy Protection as a Core Guarantee
              </h3>
              <Badge variant="success" size="sm" className="inline-flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Process</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              RaabtaNow strictly prohibits arbitrary photo sharing, public phone scraping, or automated algorithmic matching. Every match inquiry is intentional, mutual, and authenticated through PTA-compliant cellular SMS verification.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6 px-4">
      <SEOHead
        title="RaabtaNow Pricing | Transparent Pakistani Online Rishta & Matrimonial Service"
        description="Completely free registration, browsing, and proposals. Transparent Rs. 300 PKR micro-fee charged only upon mutual acceptance to unlock verified contacts."
        canonicalPath="/pricing"
        isIndexable={true}
      />
      <div className="text-center space-y-2">
        <Badge variant="gold" size="md">Transparent Pricing</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Simple, Honest Pricing</h1>
        <p className="text-sm text-slate-400">No monthly subscriptions. No pay-per-search. Pay only upon mutual interest.</p>
      </div>

      <Card className="text-center p-8 bg-navy-800 border border-slate-750">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Contact Unlock Fee</div>
        <div className="font-serif text-4xl sm:text-5xl font-extrabold text-white mb-2">
          Rs. 300 <span className="text-base font-normal text-slate-400">PKR</span>
        </div>
        <p className="text-xs text-slate-400 mb-8">One-time micro-fee per mutually accepted proposal.</p>

        <div className="text-left space-y-3.5 max-w-md mx-auto text-xs text-slate-300 bg-navy-750 p-5 rounded-2xl border border-slate-700 mb-8">
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to register and create profile</div>
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to search and shortlist</div>
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to send Rishta Requests</div>
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Free to accept or decline requests</div>
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Charged ONLY to original requester after recipient accepts</div>
          <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Covers secure SMS OTP verification for both sides</div>
        </div>

        <p className="text-[12px] text-slate-400">
          Secure payment processed via PayFast (debit/credit card, UnionPay, bank account, and mobile wallets).
        </p>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 px-4">
      <SEOHead
        title="About RaabtaNow | Privacy-First Pakistani Matrimonial Platform"
        description="Discover the mission behind RaabtaNow: restoring honor, privacy, and family dignity to Pakistani rishta matchmaking through modern technology."
        canonicalPath="/about"
        isIndexable={true}
      />
      <div className="text-center space-y-2">
        <Badge variant="magenta" size="md">Our Mission</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">About RaabtaNow</h1>
        <p className="text-sm text-slate-400">Restoring dignity, privacy, and family respect to Pakistani matchmaking.</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed bg-navy-800 border border-slate-750 p-0 overflow-hidden">
        {/* About page hero image */}
        <div className="relative h-52 sm:h-64 w-full">
          <img
            src="/images/raabtanow/family-discussion.jpg"
            alt="Pakistani families building trust through meaningful connections"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-[center_20%] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="p-6 sm:p-8 space-y-6">
        <p>
          In modern Pakistan, finding a life partner has become increasingly fraught with anxiety. Traditional matchmaking often involves unregulated intermediaries who circulate personal biodatas and contact numbers across public WhatsApp groups without consent. Conversely, Western dating apps encourage casual swiping and superficial photo browsing incompatible with serious marriage intentions.
        </p>
        <p>
          <strong className="text-white">RaabtaNow</strong> was built from the ground up to offer a better alternative. We believe matrimonial discovery should be private, mutual, and family-friendly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-navy-750 rounded-2xl border border-slate-700">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-magenta-400" />
              Privacy First
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">We do not display public photos, phone numbers, or addresses. Personal information is only revealed when both parties verify mobile numbers after mutual consent.</p>
          </div>
          <div className="p-5 bg-navy-750 rounded-2xl border border-slate-700">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-purple-400" />
              Solemn Purpose
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">Strictly matrimonial. Zero tolerance for casual dating, harassment, or fake accounts. Both self-registered individuals and admin-assisted real families are supported.</p>
          </div>
        </div>
        </div>
      </Card>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Privacy Policy | Confidential Pakistani Matrimonial Platform | RaabtaNow"
        description="Read RaabtaNow's rigorous data protection protocols. Zero public candidate photo exposure, no public phone numbers, and strict mutual consent requirements."
        canonicalPath="/privacy-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Privacy & Data Protection</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Introduction & Overview</h3>
          <p>
            At <strong className="text-white">RaabtaNow</strong>, we hold the sanctity, modesty, and honor of candidate privacy as our paramount responsibility. This Privacy Policy outlines our strict protocols regarding the collection, storage, and controlled release of matrimonial information.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
            <li><strong className="text-slate-200">Account & Verification Data:</strong> Legal name, email address, password hash, and active Pakistani mobile number.</li>
            <li><strong className="text-slate-200">Matrimonial Demographics (Public):</strong> Age, gender, faith, sect, city of residence, education, profession, height, and marital status.</li>
            <li><strong className="text-slate-200">Confidential Statements (Private):</strong> Detailed personal bio, family background, and partner preferences.</li>
            <li><strong className="text-slate-200">Transactional Records:</strong> Payment attempt references, transaction IDs, timestamps, and payment status. We never collect or store credit/debit card numbers or bank PINs on our servers; all payments are processed through State Bank authorized payment gateways (PayFast).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Zero Public Exposure Guarantee</h3>
          <p>
            RaabtaNow does not publicly display candidate photos, phone numbers, home addresses, or full email addresses. Browsing candidates can only review verified educational, professional, and demographic criteria.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Two-Way Controlled Contact Release</h3>
          <p>
            Contact details (mobile phone, email, and name) are strictly unlocked <strong className="text-white">ONLY</strong> when:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-400 mt-1">
            <li>A candidate sends a formal Rishta expression of interest.</li>
            <li>The recipient explicitly reviews and accepts the proposal.</li>
            <li>The initiator completes the standard contact unlock fee (Rs. 300 PKR).</li>
            <li>Both parties successfully verify their phone numbers via a 6-digit SMS OTP code.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">5. Data Retention & Deletion Rights</h3>
          <p>
            Users reserve the complete right to update, hide, or permanently delete their profiles from our database at any time through their account dashboard or by writing to <strong className="text-magenta-400">support@raabtanow.com</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>Registered Office: RaabtaNow, L95, 48C, Korangi, Karachi, Pakistan. | Phone: +92-323-9225450</p>
        </div>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Terms & Conditions | Halal Pakistani Matrimonial Service | RaabtaNow"
        description="Review user agreement and guidelines for RaabtaNow. Solely dedicated to serious matrimonial proposals (Nikah) for Pakistani individuals and families."
        canonicalPath="/terms"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">User Agreement</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Eligibility & Solemn Purpose</h3>
          <p>
            RaabtaNow is strictly a halal, family-oriented matrimonial platform designed exclusively for individuals and families genuinely seeking marriage (Nikah). The platform must not be used for casual dating, friendships, commercial solicitation, or any non-matrimonial purposes. Users must be at least 18 years of age.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Truthful & Accurate Biodata</h3>
          <p>
            By submitting a profile, you affirm that all details—including age, marital status, education, and profession—are truthful and verifiable. Providing false information or misrepresenting identity constitutes a material violation and will result in immediate profile termination without notice.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Fees & Payment Terms</h3>
          <p>
            Registration, browsing, profile creation, and receiving connection requests are completely free of charge. A standard micro-fee of <strong className="text-white">Rs. 300 PKR</strong> is levied only on the proposal initiator upon mutual proposal acceptance to unlock verified contact details and finance two-way SMS OTP infrastructure.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Code of Conduct & Respect</h3>
          <p>
            Candidates and family representatives agree to communicate with courtesy, modesty, and mutual respect. Any harassment, inappropriate language, fraudulent behavior, or commercial spam will lead to instant account suspension and blacklist.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">5. Disclaimer of Matrimonial Guarantee</h3>
          <p>
            While RaabtaNow verifies email and phone numbers via SMS OTP, families are urged to conduct standard, thorough family background checks and due diligence prior to formalizing wedding engagements.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>RaabtaNow | Address: Sector 48-C, Korangi, Karachi, Sindh, Pakistan. | Email: support@raabtanow.com</p>
        </div>
      </Card>
    </div>
  );
}

export function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Return & Refund Policy | RaabtaNow Matrimonial Services"
        description="Clear terms regarding our digital contact unlock micro-fee, duplicate transaction refunds, and customer support escalation timelines."
        canonicalPath="/refund-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="gold" size="md">Refund & Cancellation</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Return & Refund Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Overview of Digital Services</h3>
          <p>
            RaabtaNow provides online matrimonial discovery services. Browsing, shortlisting, and proposal exchange are free. The single chargeable service is the <strong className="text-white">Contact Unlock Fee (Rs. 300 PKR)</strong>, charged only after mutual acceptance to initiate phone verification and contact release.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Refund Eligibility</h3>
          <p>
            Refunds are granted under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 mt-1">
            <li><strong className="text-slate-200">Duplicate Charges:</strong> If a technical glitch or network error causes your account or card to be charged more than once for the same request, the duplicate transaction will be refunded in full.</li>
            <li><strong className="text-slate-200">System Failure:</strong> If payment succeeds but our system fails to deliver the verification service or unlock due to technical failure, you are entitled to a full refund.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Non-Refundable Scenarios</h3>
          <p>
            Once mutual SMS phone verification is completed and the counterpart's contact details (name, phone number, and email) have been successfully displayed on screen, the unlock fee is considered fully consumed and is non-refundable. Personal preferences, lack of compatibility, or subsequent decision not to pursue marriage outside the platform do not qualify for a refund.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">4. Refund Process & Timelines</h3>
          <p>
            To request a refund for an eligible transaction, please email <strong className="text-magenta-400">support@raabtanow.com</strong> within 7 calendar days of the transaction, providing your Request Code, Payment Transaction Reference, and registered email address. Approved refunds are credited back to the original payment method (card or mobile wallet) within 5–7 business days in accordance with banking guidelines.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>Customer Support: support@raabtanow.com | Phone: +92-323-9225450 | Karachi, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function DeliveryPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Service Delivery Policy | Instant Digital Contact Unlock | RaabtaNow"
        description="Instant electronic fulfillment for contact verification and mutual phone release upon successful mutual consent and payment confirmation."
        canonicalPath="/delivery-policy"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Fulfillment & Delivery</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Service Delivery Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: September 2026 | RaabtaNow</p>
      </div>

      <Card className="space-y-6 text-sm text-slate-300 leading-relaxed p-6 sm:p-8 bg-navy-800 border border-slate-750">
        <div>
          <h3 className="font-bold text-base text-white mb-2">1. Nature of Delivery</h3>
          <p>
            RaabtaNow operates solely as a digital matrimonial software platform. We do not sell or deliver any physical goods, parcels, or tangible items. Consequently, <strong className="text-white">no shipping fees, courier handling, or physical transit times apply</strong>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">2. Instant Electronic Delivery</h3>
          <p>
            All paid services—namely the Contact Unlock feature—are delivered electronically and immediately:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 mt-1">
            <li>Upon confirmed payment gateway checkout (Rs. 300 PKR), the SMS OTP verification interface is instantly enabled for both candidates within 0 to 60 seconds.</li>
            <li>Upon valid completion of SMS OTP verification, the counterpart's phone number, email address, and direct WhatsApp contact link are displayed immediately on the screen and archived in the user's dashboard.</li>
            <li>An immediate email confirmation with connection details is dispatched simultaneously to the user's registered inbox.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-base text-white mb-2">3. Service Inquiries & Support</h3>
          <p>
            If you encounter any delay in SMS OTP receipt or digital contact display after payment, our customer support desk is available to assist and verify delivery:
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Email: <strong className="text-magenta-400">support@raabtanow.com</strong> | WhatsApp / Call: <strong className="text-white">+92-323-9225450</strong>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-750 text-xs text-slate-500">
          <p>RaabtaNow Matrimonial Services | Head Office: Sector 48-C, Korangi, Karachi, Sindh, Pakistan</p>
        </div>
      </Card>
    </div>
  );
}

export function ContactUsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <SEOHead
        title="Contact RaabtaNow | Online Rishta Pakistan & Matrimonial Support"
        description="Get in touch with RaabtaNow customer care. Head office in Karachi, dedicated support helpline (+92 323 9225450), and respectful family assistance."
        canonicalPath="/contact"
        isIndexable={true}
      />
      <div className="text-center space-y-2 pb-4 border-b border-slate-750">
        <Badge variant="magenta" size="md">Get In Touch</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Contact & Support</h1>
        <p className="text-sm text-slate-400">We are here to assist Pakistani families with dignity, privacy, and dedicated guidance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 bg-navy-800 border border-slate-750">
          <h3 className="font-bold text-base text-white border-b border-slate-700 pb-2">Head Office Details</h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <span className="font-bold block text-slate-400">Business Name:</span>
              <span className="font-serif text-base font-extrabold text-white">RaabtaNow</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Registered Office Address:</span>
              <span>Sector 48-C, Korangi, Karachi, Sindh, Pakistan</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Customer Support Helpline:</span>
              <span className="font-mono font-bold text-white">+92 323 9225450</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Official Inquiries & Support:</span>
              <span className="font-mono font-bold text-magenta-400">support@raabtanow.com</span>
            </div>
            <div>
              <span className="font-bold block text-slate-400">Operational Hours:</span>
              <span>Monday – Saturday: 10:00 AM – 7:00 PM (PST)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-navy-800 border border-slate-750">
          <h3 className="font-bold text-base text-white border-b border-slate-700 pb-2">Services & Offerings</h3>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Verified Pakistani Matrimonial Profiles</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Confidential & Private Biodata Discovery</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Two-Way Mutual Consent Proposal Requests</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Secure Dual SMS OTP Verification (Rs. 300)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Direct Family WhatsApp & Mobile Release</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Dedicated Matchmaking Assistance</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Overseas Pakistani Matrimonial Search</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-magenta-400 shrink-0" /> Zero Public Photo / Phone Exposure Policy</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
