import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function AdminSocialCardModal({ candidate, onClose }) {
  if (!candidate) return null;

  function getAgeFromDob(dobString) {
    if (!dobString) return 29;
    const diff = Date.now() - new Date(dobString).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  function formatMarital(str) {
    if (!str) return 'Never Married';
    if (str === 'never_married') return 'Never Married';
    if (str === 'divorced') return 'Divorced';
    if (str === 'widowed') return 'Widowed';
    if (str === 'separated') return 'Separated';
    if (str === 'married') return 'Married (2nd/3rd Marriage)';
    return str;
  }

  function formatHeight(val) {
    if (!val) return "5'8\"";
    if (typeof val === 'string' && val.includes("'")) return val;
    const num = Number(val);
    if (!isNaN(num) && num > 80 && num < 250) {
      const totalInches = Math.round(num / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
    return String(val);
  }

  function formatLookingSummary(cand) {
    if (cand.partner_expectations) return cand.partner_expectations;
    if (cand.public_biodata?.partner_expectations) return cand.public_biodata.partner_expectations;
    
    const prefs = cand.preferences;
    if (prefs) {
      const parts = [];
      if (prefs.preferred_education) {
        parts.push(prefs.preferred_education);
      }
      if (prefs.min_age && prefs.max_age) {
        parts.push(`${prefs.min_age}–${prefs.max_age} yrs`);
      }
      if (Array.isArray(prefs.preferred_cities) && prefs.preferred_cities.length > 0) {
        parts.push(`from ${prefs.preferred_cities.slice(0, 2).join('/')}`);
      }
      if (prefs.preferred_marital_status && Array.isArray(prefs.preferred_marital_status) && prefs.preferred_marital_status.length > 0) {
        const ms = prefs.preferred_marital_status.map(s => s.replace(/_/g, ' ')).join(', ');
        parts.push(`(${ms})`);
      }
      if (parts.length > 0) {
        return `Educated partner, ${parts.join(', ')}. Respectable family values.`;
      }
    }

    return 'Educated, responsible and family-oriented partner.';
  }

  // Extract initial fields from candidate object
  const initialCode = candidate.profile_code || candidate.listing_code || (candidate.id ? `AP-${candidate.id}` : 'RN-1024');
  const initialGender = String(candidate.gender || candidate.public_biodata?.gender || 'male').toLowerCase();
  const initialAge = candidate.age || candidate.public_biodata?.age || (candidate.date_of_birth ? getAgeFromDob(candidate.date_of_birth) : candidate.public_biodata?.date_of_birth ? getAgeFromDob(candidate.public_biodata.date_of_birth) : 29);
  const initialCity = candidate.city || candidate.public_biodata?.city || 'Karachi';
  const initialReligion = candidate.religion || candidate.public_biodata?.religion || 'Islam';
  const initialSect = candidate.sect || candidate.public_biodata?.sect || 'Sunni';
  const initialCaste = candidate.caste || candidate.public_biodata?.caste || '';
  const initialFaith = (initialReligion === 'Islam' && initialSect) ? `${initialReligion} • ${initialSect}` : initialReligion;
  const initialEducation = candidate.education || candidate.public_biodata?.education || 'B.Com';
  const initialProfession = candidate.profession || candidate.public_biodata?.profession || 'Business';
  const initialHeight = candidate.height_formatted || formatHeight(candidate.height || candidate.public_biodata?.height);
  const initialMarital = formatMarital(candidate.marital_status || candidate.public_biodata?.marital_status || 'never_married');
  const initialFamilyType = candidate.family_status || candidate.public_biodata?.family_status || 
    (initialProfession && /Doctor|Engineer|Professor|Accountant|Officer/i.test(initialProfession) ? 'Educated Family' : 
     initialProfession && /Business|Trader|Merchant/i.test(initialProfession) ? 'Business Family' : 'Educated Family');
  const initialFamilyText = 
    candidate.family_background || 
    candidate.public_biodata?.family_background || 
    candidate.public_biodata?.public_about || 
    candidate.public_biodata?.about || 
    candidate.public_about || 
    candidate.about || 
    candidate.about_family || 
    candidate.public_biodata?.about_family || 
    'Respectable, educated and family-oriented household.';
  const initialLooking = formatLookingSummary(candidate);

  const [form, setForm] = useState({
    code: initialCode,
    gender: initialGender,
    age: initialAge,
    city: initialCity,
    faith: initialFaith,
    caste: initialCaste,
    education: initialEducation,
    profession: initialProfession,
    height: initialHeight,
    status: initialMarital,
    familyType: initialFamilyType,
    familyText: initialFamilyText,
    looking: initialLooking,
  });

  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const isMale = form.gender === 'male';

  // 1080 x 1350 High-Res Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1350;

    canvas.width = width;
    canvas.height = height;

    setRendering(true);

    const paper = '#fbf8f2';
    const ink = '#202421';
    const line = '#d9d0c2';
    const gold = '#a77a27';
    const accent = isMale ? '#176b5b' : '#a85d6a';
    const accentSoft = isMale ? '#e4f0ec' : '#f4e7e9';

    const renderCard = (avatarImg) => {
      // 1. Background
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, width, height);

      // Outer card border
      ctx.strokeStyle = '#cfc5b5';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      // Inset border
      const inset = 26;
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

      // Padding bounds: x = 88, y = 82, w = 904
      const contentX = 88;
      const contentW = 904;

      // 2. Header
      ctx.textAlign = 'left';
      ctx.font = '700 48px Georgia, "Times New Roman", serif';
      ctx.fillStyle = ink;
      ctx.fillText('RAABTA ', contentX, 132);

      const raabtaWidth = ctx.measureText('RAABTA ').width;
      ctx.fillStyle = gold;
      ctx.fillText('NOW', contentX + raabtaWidth, 132);

      // Header Right
      ctx.textAlign = 'right';
      ctx.font = '800 20px Inter, Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillStyle = gold;
      ctx.fillText('PAKISTANI', contentX + contentW, 118);
      ctx.fillText('MATRIMONIAL', contentX + contentW, 142);
      ctx.letterSpacing = '0px';

      // 3. Hero Section
      const heroY = 176;
      const avatarSize = 380;
      const avatarX = contentX;
      const avatarY = heroY;

      // Outer 4px outline
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // White 16px border & Soft Background fill
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Background soft tint inside circle
      ctx.fillStyle = accentSoft;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 16, 0, Math.PI * 2);
      ctx.fill();

      // Clip circular avatar image if available
      if (avatarImg && avatarImg.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 16, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      }

      // Hero Right Text
      const textX = contentX + avatarSize + 50;
      let curY = heroY + 54;

      // Eyebrow
      ctx.textAlign = 'left';
      ctx.font = '900 26px Inter, Arial, sans-serif';
      ctx.fillStyle = accent;
      ctx.letterSpacing = '3px';
      const roleText = isMale ? 'GROOM PROFILE' : 'BRIDE PROFILE';
      ctx.fillText(roleText, textX, curY);
      ctx.letterSpacing = '0px';

      // Age
      curY += 76;
      ctx.font = '900 84px Inter, Arial, sans-serif';
      ctx.fillStyle = ink;
      ctx.letterSpacing = '-2px';
      ctx.fillText(`${form.age} YEARS`, textX, curY);
      ctx.letterSpacing = '0px';

      // Location & Height
      curY += 56;
      ctx.font = '700 42px Inter, Arial, sans-serif';
      ctx.fillStyle = '#363b37';
      ctx.fillText(`${form.height}  •  ${form.city}`, textX, curY);

      // Community Pill
      curY += 40;
      const commText = form.caste ? `${form.faith} • ${form.caste}` : form.faith;
      ctx.font = '800 26px Inter, Arial, sans-serif';
      const commWidth = ctx.measureText(commText).width + 36;
      
      ctx.fillStyle = accentSoft;
      roundRect(ctx, textX, curY, commWidth, 48, 24, true, false);

      ctx.fillStyle = accent;
      ctx.fillText(commText, textX + 18, curY + 33);

      // 4. Rule
      const ruleY = 600;
      ctx.fillStyle = accent;
      roundRect(ctx, contentX, ruleY, 108, 6, 3, true, false);

      // 5. Details Grid (2x2)
      const detailsStartY = 644;
      const detailW = (contentW - 20) / 2; // 442px
      const detailH = 134;

      const details = [
        { label: 'EDUCATION', value: form.education, x: contentX, y: detailsStartY },
        { label: 'PROFESSION', value: form.profession, x: contentX + detailW + 20, y: detailsStartY },
        { label: 'MARITAL STATUS', value: form.status, x: contentX, y: detailsStartY + detailH + 20 },
        { label: 'FAMILY', value: form.familyType, x: contentX + detailW + 20, y: detailsStartY + detailH + 20 },
      ];

      details.forEach(item => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.fillRect(item.x, item.y, detailW, detailH);
        ctx.strokeRect(item.x, item.y, detailW, detailH);

        // Label
        ctx.font = '900 20px Inter, Arial, sans-serif';
        ctx.fillStyle = '#7a7c76';
        ctx.letterSpacing = '2px';
        ctx.fillText(item.label, item.x + 30, item.y + 44);
        ctx.letterSpacing = '0px';

        // Value
        ctx.font = '800 34px Inter, Arial, sans-serif';
        ctx.fillStyle = ink;
        ctx.fillText(truncateText(ctx, item.value, detailW - 60), item.x + 30, item.y + 94);
      });

      // 6. Text Row (Family Background & Looking For)
      const textRowY = 964;
      const textBoxW = detailW;

      // Family Background Box
      const famX = contentX;
      ctx.fillStyle = accent;
      ctx.fillRect(famX, textRowY, textBoxW, 4);

      ctx.font = '900 20px Inter, Arial, sans-serif';
      ctx.fillStyle = accent;
      ctx.letterSpacing = '2px';
      ctx.fillText('FAMILY BACKGROUND', famX + 4, textRowY + 32);
      ctx.letterSpacing = '0px';

      ctx.font = '600 28px Inter, Arial, sans-serif';
      ctx.fillStyle = '#343935';
      wrapText(ctx, form.familyText, famX + 4, textRowY + 76, textBoxW - 10, 38, 3);

      // Looking For Box
      const lookX = contentX + detailW + 20;
      ctx.fillStyle = accent;
      ctx.fillRect(lookX, textRowY, textBoxW, 4);

      ctx.font = '900 20px Inter, Arial, sans-serif';
      ctx.fillStyle = accent;
      ctx.letterSpacing = '2px';
      ctx.fillText('LOOKING FOR', lookX + 4, textRowY + 32);
      ctx.letterSpacing = '0px';

      ctx.font = '600 28px Inter, Arial, sans-serif';
      ctx.fillStyle = '#343935';
      wrapText(ctx, form.looking, lookX + 4, textRowY + 76, textBoxW - 10, 38, 3);

      // 7. Bottom Footer
      const footerY = 1258;

      // Left CTA
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(contentX + 9, footerY - 9, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '900 28px Inter, Arial, sans-serif';
      ctx.fillStyle = accent;
      ctx.fillText('View profile on RaabtaNow', contentX + 28, footerY);

      // Right Website & Code
      ctx.textAlign = 'right';
      ctx.font = '700 32px Georgia, "Times New Roman", serif';
      ctx.fillStyle = ink;
      ctx.fillText('RaabtaNow.com', contentX + contentW, footerY - 24);

      ctx.font = '800 20px Inter, Arial, sans-serif';
      ctx.fillStyle = '#777a73';
      ctx.letterSpacing = '2px';
      ctx.fillText(`PROFILE ${form.code}`, contentX + contentW, footerY + 4);
      ctx.letterSpacing = '0px';

      setRendering(false);
    };

    // Load exact avatar image requested by the user
    const avatarImg = new Image();
    avatarImg.src = isMale ? '/images/avatars/male_avatar.png' : '/images/avatars/female_avatar.png';

    if (avatarImg.complete && avatarImg.naturalWidth > 0) {
      renderCard(avatarImg);
    } else {
      avatarImg.onload = () => renderCard(avatarImg);
      avatarImg.onerror = () => renderCard(null);
    }
  }, [form]);

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function truncateText(ctx, text, maxWidth) {
    if (!text) return 'N/A';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return;
        }
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0 && lineCount < maxLines) {
      ctx.fillText(line.trim(), x, currentY);
    }
  }

  // Trigger High-Res PNG download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `RaabtaNow_Profile_${form.code}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#d9d0c2] rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] my-auto">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-[#d9d0c2] bg-[#fbf8f2]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a77a27]/15 border border-[#a77a27]/40 flex items-center justify-center text-[#a77a27] font-serif font-bold text-base">
              R
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#202421] tracking-tight">
                RaabtaNow Social Media Profile Card (1080 × 1350)
              </h3>
              <p className="text-[11px] text-[#626862]">
                4:5 Social Media Portrait • Ready for Facebook, Instagram & WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Form Controls + Canvas Preview */}
        <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto min-h-0 bg-[#e8e4dd]">
          
          {/* Controls Form */}
          <div className="lg:col-span-5 space-y-3.5 bg-white p-5 rounded-2xl border border-[#d9d0c2] shadow-sm overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-[#a77a27] uppercase tracking-wider">
                Candidate Information
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    isMale
                      ? 'bg-[#176b5b] text-white border-[#176b5b]'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  Groom
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    !isMale
                      ? 'bg-[#a85d6a] text-white border-[#a85d6a]'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  Bride
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Profile Code</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Height</label>
                <input
                  type="text"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Faith / Sect</label>
                <input
                  type="text"
                  name="faith"
                  value={form.faith}
                  onChange={handleChange}
                  placeholder="e.g. Muslim • Sunni"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Caste / Community</label>
                <input
                  type="text"
                  name="caste"
                  value={form.caste}
                  onChange={handleChange}
                  placeholder="e.g. Rajput"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Education</label>
                <input
                  type="text"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={form.profession}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Marital Status</label>
                <input
                  type="text"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Family Label</label>
                <input
                  type="text"
                  name="familyType"
                  value={form.familyType}
                  onChange={handleChange}
                  placeholder="e.g. Educated Family"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Family Background</label>
              <textarea
                name="familyText"
                rows={2}
                value={form.familyText}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Looking For</label>
              <textarea
                name="looking"
                rows={2}
                value={form.looking}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#a77a27] resize-none"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleDownload}
                icon={Download}
                className={`w-full justify-center font-bold py-2.5 text-white border-none shadow-md ${
                  isMale ? 'bg-[#176b5b] hover:bg-[#12584A]' : 'bg-[#a85d6a] hover:bg-[#8F4E5A]'
                }`}
                disabled={rendering}
              >
                Download 1080 × 1350 PNG
              </Button>
            </div>
          </div>

          {/* Canvas Live Preview Container */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="flex items-center justify-between w-full max-w-[500px] mb-2.5 text-xs">
              <span className="font-bold text-[#202421] tracking-wide uppercase text-[11px]">
                Live 4:5 Social Media Post Preview
              </span>
              <span className="text-[#a77a27] font-semibold flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> High-Resolution 1080 × 1350
              </span>
            </div>

            {/* Preview Box */}
            <div
              className="w-full max-w-[500px] rounded-xl overflow-hidden shadow-2xl border border-[#cfc5b5] bg-[#fbf8f2]"
              style={{ aspectRatio: '4/5', maxHeight: '76vh' }}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain block" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
