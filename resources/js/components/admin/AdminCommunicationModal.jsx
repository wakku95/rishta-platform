import React, { useState, useEffect } from 'react';
import { 
  X, Mail, MessageCircle, Send, Copy, Check, Paperclip, 
  ExternalLink, Sparkles, AlertCircle, FileText, UserCheck, ShieldCheck
} from 'lucide-react';
import Button from '../ui/Button';
import { adminApi } from '../../api/admin';

export default function AdminCommunicationModal({ candidate, onClose, initialMatches = [] }) {
  if (!candidate) return null;

  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' or 'email'
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  
  // WhatsApp state
  const [phone, setPhone] = useState(candidate.phone || candidate.contact_number || candidate.user?.phone || '');
  const [waMessage, setWaMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Email state
  const [email, setEmail] = useState(candidate.email || candidate.user?.email || '');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (candidate) {
      setPhone(candidate.phone || candidate.contact_number || candidate.user?.phone || '');
      setEmail(candidate.email || candidate.user?.email || '');
    }
  }, [candidate]);

  // Format candidate data for template replacements
  const candName = candidate.name || candidate.full_name || 'Candidate';
  const candCode = candidate.code || candidate.listing_code || candidate.profile_code || 'N/A';
  const candCity = candidate.city || 'Pakistan';
  const candGender = candidate.gender === 'female' ? 'Bride' : 'Groom';
  const targetGender = candidate.gender === 'female' ? 'Groom (Male)' : 'Bride (Female)';

  // Build match summaries text if matches are available
  let matchSummaryText = '';
  if (initialMatches && initialMatches.length > 0) {
    matchSummaryText = initialMatches.slice(0, 3).map((m, idx) => {
      return `${idx + 1}. Code: ${m.code || m.profile_code} | Age: ${m.age || 27} yrs | City: ${m.city} | Edu: ${m.education || 'Graduate'} | Compatibility: ${m.match_score || 85}%`;
    }).join('\n');
  } else {
    matchSummaryText = `1. Code: RK-Sample | Age: 26 yrs | City: ${candCity} | Education: Bachelor's | Highly Compatible\n2. Code: AP-Sample | Age: 28 yrs | City: ${candCity} | Education: Master's | Active Profile`;
  }

  // Pre-configured rich templates (focused on matchmaking facilitation)
  const TEMPLATES = {
    someone_interested: {
      label: '💍 Someone Interested (Proposal Inquiry)',
      subject: `Marriage Proposal Inquiry for Profile ${candCode} - Raabta Matrimonial`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nWe are contacting you from Raabta Matrimonial regarding your profile (${candCode}).\n\nA respectable family on our platform has shown keen interest in your proposal for their ${targetGender}. They found your profile criteria and background highly compatible.\n\nIf you are interested in reviewing their profile details and proposal card, please reply to this message so we can share their information with you.\n\nBest Regards,\nRaabta Matrimonial Team\nhttps://raabtanow.com`,
      email: `We are pleased to inform you that a prospective family on Raabta Matrimonial has shown interest in your proposal profile (${candCode}).\n\nThey have reviewed your general criteria and would be glad to explore mutual compatibility for their ${targetGender}.\n\nNext Steps:\nIf you are open to viewing their proposal details and introductory card, please reply directly to this email or contact our support representative.\n\nYour privacy and dignity remain our utmost priority.`,
    },
    preferences_reminder: {
      label: '⚡ Partner Preferences Missing (Account Activation)',
      subject: `Complete Your Partner Preferences to Activate Auto-Matching - Raabta`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nWelcome to Raabta Matrimonial! We noticed that your profile (${candCode}) is created, but your Partner Preferences (desired age, city, sect, education) have not been saved yet.\n\nWithout preferences, our matchmaking system cannot recommend compatible proposals for you. Please log in and complete your preferences in just 2 minutes:\n👉 https://raabtanow.com/profile/preferences\n\nThank you,\nRaabta Matrimonial Support`,
      email: `Welcome to Raabta Matrimonial! We noticed that while your basic profile (${candCode}) is ready, your partner preferences (such as preferred age range, cities, education, and sect) have not been completed.\n\nWhy this is important:\nOur intelligent auto-matchmaking algorithm pairs profiles based on mutual criteria. Once you configure your preferences, you will instantly receive compatible matches and proposal cards.\n\nPlease log in to your account and complete your partner preferences today.\n\nDirect Link: https://raabtanow.com/profile/preferences`,
    },
    curated_matches: {
      label: '🎯 Recommended Matches Found for Your Profile',
      subject: `Top Compatible Matrimonial Matches Found for Profile ${candCode}`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nGood news! Based on your partner preferences on Raabta Matrimonial (${candCode}), our matchmaking team has shortlisted top compatible matches for you:\n\n${matchSummaryText}\n\nIf you would like to view their complete proposal cards or express interest, please let us know!\n\nRegards,\nRaabta Matrimonial\nhttps://raabtanow.com`,
      email: `Good news! Based on your partner preferences for profile ${candCode}, our matchmaking system has shortlisted top compatible proposals for you:\n\n${matchSummaryText}\n\nPlease check the attached proposal card(s) or visit your dashboard to review their full credentials.\n\nIf you would like our matchmaker team to coordinate an introduction, simply reply to this email.`,
    },
    bio_modification: {
      label: '🔒 Bio Privacy & Contact Info Notice',
      subject: `Friendly Safety Notice Regarding Your Profile Bio - Raabta`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nDuring our routine profile safety review for ${candCode}, our moderation team noticed personal contact details or sensitive personal identifiers in your bio section.\n\nFor your personal privacy and safety, contact details should only be exchanged via mutually accepted matches. Kindly update your bio to describe personal qualities and expectations instead:\n👉 https://raabtanow.com/profile/edit\n\nThank you for helping us maintain a safe platform.\nRaabta Support Team`,
      email: `During our regular profile quality and safety review for profile ${candCode}, our moderation team noticed direct contact information or identifiable details in your "About Myself" bio.\n\nFor your personal safety and platform security guidelines, direct contact numbers and social handles are not displayed publicly and should only be exchanged via mutually accepted requests.\n\nAction Required:\nPlease take a moment to update your bio by removing personal contact numbers and focusing on your values, interests, and family background.\n\nDirect Edit Link: https://raabtanow.com/profile/edit`,
    },
    assisted_followup: {
      label: '🤝 Assisted Listing Status & Update Follow-up',
      subject: `Follow-up Regarding Your Assisted Listing ${candCode} - Raabta`,
      whatsapp: `Assalam-o-Alaikum,\n\nWe are following up from Raabta Matrimonial regarding assisted candidate ${candName} (${candCode}, ${candCity}).\n\nWe are actively receiving marriage inquiries in ${candCity}. Could you please confirm if this proposal is still active and looking for matches, or if any details have changed?\n\nLooking forward to your response.\nBest Regards,\nRaabta Matrimonial Team\nWhatsApp: +92 303 2404609`,
      email: `We are following up from Raabta Matrimonial regarding assisted proposal ${candName} (${candCode}) based in ${candCity}.\n\nOur matchmaking desk is currently assisting families with compatible criteria. Could you please confirm if this proposal is still actively seeking a match, or if any preferences (city, education, sect) have been updated?\n\nIf you have any questions or new requirements, please feel free to reply directly to this message.`,
    },
    meeting_coordination: {
      label: '📞 Mutual Interest - Family Call Coordination',
      subject: `Mutual Interest Confirmed - Coordinating Introduction for ${candCode}`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nWe are pleased to inform you that both parties have agreed to proceed with initial family communication regarding proposal ${candCode}.\n\nPlease let us know your preferred day and time window for a brief, dignified introductory call between the guardians/families.\n\nBest Regards,\nRaabta Matrimonial Coordination Team`,
      email: `We are delighted to share that both families have expressed mutual interest in exploring matrimonial compatibility regarding profile ${candCode}.\n\nNext Step:\nWe would like to coordinate a convenient time for an introductory telephonic conversation between the families/representatives.\n\nPlease reply with:\n1. Preferred day & time window (e.g. Saturday 5 PM - 8 PM)\n2. Primary contact person (Father, Mother, Self, Guardian)\n\nWe pray this brings fruitful and blessed results for both families.`,
    },
    profile_completion: {
      label: '📋 Complete Profile & Biodata Request',
      subject: `Update and Complete Your Matrimonial Profile - Raabta`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\nTo help us find better suited matches for your profile (${candCode}), we encourage you to complete any remaining details in your profile and partner preferences:\n👉 https://raabtanow.com/profile/edit\n\nDetailed profiles help prospective families better understand your background and expectations.\n\nThank you,\nRaabta Matrimonial Support`,
      email: `To help our matchmaking team assist you in finding well-suited proposals for profile ${candCode}, we encourage you to enrich and complete your profile biodata and partner preferences.\n\nDetailed profiles allow families to better understand your background, education, and mutual values.\n\nUpdate Profile: https://raabtanow.com/profile/edit`,
    },
    custom_blank: {
      label: '📝 Custom Blank Message',
      subject: `Message from Raabta Matrimonial regarding Profile ${candCode}`,
      whatsapp: `Assalam-o-Alaikum ${candName},\n\n`,
      email: ``,
    }
  };

  // Set initial default template
  useEffect(() => {
    handleSelectTemplate('someone_interested');
  }, []);

  const handleSelectTemplate = (key) => {
    setSelectedTemplateKey(key);
    const tmpl = TEMPLATES[key];
    if (tmpl) {
      setSubject(tmpl.subject);
      setWaMessage(tmpl.whatsapp);
      setEmailBody(tmpl.email);
    }
  };

  // Format phone number to clean WhatsApp international digits
  const getNormalizedWhatsAppNumber = (raw) => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('03')) {
      digits = '92' + digits.substring(1);
    } else if (digits.startsWith('3') && digits.length === 10) {
      digits = '92' + digits;
    }
    return digits;
  };

  // Open WhatsApp Web
  const handleOpenWhatsApp = () => {
    const cleanNum = getNormalizedWhatsAppNumber(phone);
    if (!cleanNum) {
      alert('Please enter a valid phone number for WhatsApp.');
      return;
    }
    const encoded = encodeURIComponent(waMessage);
    const url = `https://wa.me/${cleanNum}?text=${encoded}`;
    window.open(url, '_blank');

    if (candidate?.id) {
      const cType = candidate.type || (candidate.source === 'assisted' ? 'assisted' : 'profile');
      adminApi.logContact({
        candidate_type: cType,
        candidate_id: candidate.id,
        channel: 'whatsapp',
        recipient_name: candName,
        recipient_contact: cleanNum,
        subject_or_template: selectedTemplateKey,
      }).catch(err => console.error('Failed to log WhatsApp contact:', err));
    }
  };

  // Copy WhatsApp message to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle file attachment addition
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Send Email via API
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Please specify a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setEmailError('Email subject cannot be empty.');
      return;
    }
    if (!emailBody.trim()) {
      setEmailError('Email body cannot be empty.');
      return;
    }

    setSendingEmail(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const formData = new FormData();
      formData.append('recipient_email', email);
      formData.append('recipient_name', candName);
      formData.append('subject', subject);
      formData.append('message', emailBody);
      formData.append('cta_url', 'https://raabtanow.com');
      formData.append('cta_text', 'Visit Raabta Matrimonial');

      if (candidate?.id) {
        const cType = candidate.type || (candidate.source === 'assisted' ? 'assisted' : 'profile');
        formData.append('candidate_type', cType);
        formData.append('candidate_id', candidate.id);
      }

      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });

      const res = await adminApi.sendCommunicationEmail(formData);
      setEmailSuccess(res.message || `Email sent successfully to ${email}!`);
      setAttachments([]);
    } catch (err) {
      console.error('Failed to send email:', err);
      setEmailError(err.response?.data?.message || 'Failed to dispatch email. Please check server SMTP configuration.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-navy-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-navy-850 via-purple-950/30 to-navy-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center text-magenta-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Direct Communication Desk</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-magenta-500/20 text-magenta-300 border border-magenta-500/30 uppercase">
                  {candidate.type === 'assisted' ? 'Assisted Profile' : 'Registered Candidate'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To: <strong className="text-slate-200">{candName}</strong> ({candCode}) • {candCity} • {candGender}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex border-b border-slate-750 bg-navy-950/50 px-6 pt-3">
          <button
            onClick={() => setChannel('whatsapp')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              channel === 'whatsapp'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Message
          </button>
          <button
            onClick={() => setChannel('email')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              channel === 'email'
                ? 'border-magenta-500 text-magenta-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Official Email (SMTP)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Choose Ready-Made Message Template</span>
              <span className="text-[11px] text-magenta-400 font-normal">Auto-fills candidate details</span>
            </label>
            <select
              value={selectedTemplateKey}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-magenta-500 transition-colors"
            >
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* WHATSAPP TAB */}
          {channel === 'whatsapp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient WhatsApp / Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 03032404544 or 923032404544"
                    className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400">
                    Clean: {getNormalizedWhatsAppNumber(phone) || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Editable WhatsApp Message</span>
                  <span className="text-[11px] text-slate-400">Feel free to edit text or add personalized notes</span>
                </label>
                <textarea
                  rows={8}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full text-xs p-3 bg-navy-950 border border-slate-700 rounded-lg text-slate-200 font-sans focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-300/90">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Pro-tip:</strong> When sending via WhatsApp Web, you can download the candidate or match profile card from the matchmaker and simply <em>drag-and-drop</em> the card image directly into the WhatsApp conversation.
                </div>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {channel === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{emailSuccess}</span>
                </div>
              )}
              {emailError && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. candidate@example.com"
                  required
                  className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-magenta-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line"
                  required
                  className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-magenta-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Editable Email Body (HTML Branded Layout)</span>
                  <span className="text-[11px] text-slate-400">Greeting and branding header added automatically</span>
                </label>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                  className="w-full text-xs p-3 bg-navy-950 border border-slate-700 rounded-lg text-slate-200 font-sans focus:outline-none focus:border-magenta-500 resize-none leading-relaxed"
                />
              </div>

              {/* Attachments Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Attach Pictures / Profile Cards / PDF Documents</span>
                  <span className="text-[11px] text-slate-400">Max 10MB per file (PNG, JPG, PDF)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-950 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-magenta-400" />
                    Browse Files to Attach
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    {attachments.length === 0 ? 'No files attached' : `${attachments.length} file(s) attached`}
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy-950 border border-slate-750 text-xs text-slate-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-magenta-400" />
                        <span className="truncate max-w-[180px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(i)}
                          className="text-slate-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-navy-950/70 border-t border-slate-750 flex items-center justify-between">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>

          {channel === 'whatsapp' ? (
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={copied ? Check : Copy}
                onClick={handleCopyMessage}
                className="text-xs font-semibold"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon={ExternalLink}
                onClick={handleOpenWhatsApp}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-none text-white shadow-emerald-950/50"
              >
                Open in WhatsApp Web
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon={Send}
              isLoading={sendingEmail}
              onClick={handleSendEmail}
              className="text-xs font-bold"
            >
              Send Branded Email Now
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
