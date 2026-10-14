import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Download, Copy, Check, Sliders, 
  Eye, RefreshCw, XCircle, AlertCircle, FileText, Sparkles, MessageCircle 
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function AdminPhotoWatermarkModal({ 
  isOpen, 
  onClose, 
  photoBlobUrl, 
  candidateCode = 'Candidate', 
  candidateName = '' 
}) {
  const canvasRef = useRef(null);
  const [receiver, setReceiver] = useState('');
  const [opacity, setOpacity] = useState(0.32);
  const [noiseLevel, setNoiseLevel] = useState(12);
  const [fontSize, setFontSize] = useState(15);
  const [density, setDensity] = useState('balanced'); // 'balanced' (45px gap) | 'dense' (32px gap) | 'relaxed' (65px gap)
  const [rendering, setRendering] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && photoBlobUrl) {
      renderWatermarkedCanvas();
    }
  }, [isOpen, photoBlobUrl, receiver, opacity, noiseLevel, fontSize, density]);

  const renderWatermarkedCanvas = () => {
    if (!photoBlobUrl) return;
    setRendering(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setRendering(false);
        return;
      }

      // Max dimensions to restrict HD leaks
      const MAX_WIDTH = 720;
      const MAX_HEIGHT = 960;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setRendering(false);
        return;
      }

      // 1. Draw base photo
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Add diagonal tiled watermark with staggered rows & tight spacing
      ctx.save();
      ctx.rotate((-35 * Math.PI) / 180);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.95})`;
      ctx.lineWidth = 2.2;

      const text = `RaabtaNow • For: ${receiver.trim() || 'Rishta Review'} • Confidential`;
      const textMetrics = ctx.measureText(text);

      // Calculate gaps based on density
      const densityMultiplier = density === 'dense' ? 2.1 : density === 'relaxed' ? 4.2 : 2.8;
      const horizontalGap = density === 'dense' ? 25 : density === 'relaxed' ? 70 : 35;
      const stepX = textMetrics.width + horizontalGap;
      const stepY = fontSize * densityMultiplier;

      const startX = -width * 1.5;
      const endX = width * 2.5;
      const startY = -height * 1.5;
      const endY = height * 2.5;

      let rowIndex = 0;
      for (let y = startY; y < endY; y += stepY) {
        // Stagger alternate rows by 50% for impenetrable coverage
        const rowOffsetX = (rowIndex % 2 === 0) ? 0 : (stepX / 2);
        for (let x = startX; x < endX; x += stepX) {
          ctx.strokeText(text, x + rowOffsetX, y);
          ctx.fillText(text, x + rowOffsetX, y);
        }
        rowIndex++;
      }
      ctx.restore();

      // 3. Central Brand Shield Watermark
      ctx.save();
      ctx.beginPath();
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.22;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.35})`;
      ctx.fill();

      ctx.font = `bold ${Math.max(14, Math.round(width * 0.035))}px sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 1.2})`;
      ctx.textAlign = 'center';
      ctx.fillText('RAABTANOW', centerX, centerY - 8);
      ctx.font = `600 ${Math.max(10, Math.round(width * 0.024))}px sans-serif`;
      ctx.fillText('CONFIDENTIAL MATCH', centerX, centerY + 14);
      ctx.restore();

      // 4. Subtle Film Grain / Noise Injection (Makes AI Inpainting fail)
      if (noiseLevel > 0) {
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          const factor = noiseLevel * 1.5;

          for (let i = 0; i < data.length; i += 4) {
            // Apply noise only periodically to save CPU and maintain aesthetic
            if (Math.random() < 0.35) {
              const noise = (Math.random() - 0.5) * factor;
              data[i] = Math.min(255, Math.max(0, data[i] + noise));         // R
              data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
              data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn('Canvas noise injection skipped:', e);
        }
      }

      setRendering(false);
    };

    img.onerror = () => {
      setRendering(false);
    };

    if (!photoBlobUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = photoBlobUrl;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDownloading(true);
    // Export with 65% quality compression
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setDownloading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanCode = (candidateCode || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '');
        a.download = `RaabtaNow_Protected_${cleanCode}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      },
      'image/jpeg',
      0.65
    );
  };

  const confidentialityNotice = `🔒 *RaabtaNow Confidential Photo Protocol*\nYeh tasveer RaabtaNow ki taraf se sirf proposal review ke liye share ki gayi hai.\n\n⚠️ *Important Guidelines:*\n1. Is tasveer ka screenshot lena ya kisi teesre fard ko forward karna qanoonan aur akhlaqan jurm hai.\n2. Photo par verified tracking watermark laga hua hai.\n3. Rishta pasand aane ya na aane par tasveer ko fauran delete kar dein.`;

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(confidentialityNotice);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Protected Photo Watermark Studio"
      subtitle={`Secure photo distribution for #${candidateCode} with anti-removal watermark & compression.`}
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Canvas Preview (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-navy-950 p-2 flex items-center justify-center min-h-[380px] overflow-hidden relative shadow-inner">
            {rendering && (
              <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center z-10">
                <RefreshCw className="w-6 h-6 text-magenta-400 animate-spin" />
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              className="max-h-[460px] max-w-full rounded-xl object-contain shadow-2xl border border-white/5"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-AI Tiled Watermark Active
            </span>
            <span>Quality: 65% Compressed</span>
          </div>
        </div>

        {/* Right Column: Controls & Actions (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Receiver Identifier */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span>Recipient Identifier / Code</span>
              <span className="text-[10px] text-magenta-400 font-normal">Embedded in Watermark</span>
            </label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="e.g. For: Groom Family #RP-1049"
              className="w-full text-xs bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500 font-medium"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Tip: Dusri family ka code ya phone number daalein, taake leak hone par unki pehchan ho sake.
            </p>
          </div>

          {/* Watermark Density Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Grid Spacing &amp; Coverage
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-navy-950 p-1 rounded-xl border border-white/5 text-center">
              <button
                type="button"
                onClick={() => setDensity('relaxed')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                  density === 'relaxed'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Relaxed (65px)
              </button>
              <button
                type="button"
                onClick={() => setDensity('balanced')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                  density === 'balanced'
                    ? 'bg-gradient-to-r from-magenta-600 to-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Balanced (45px)
              </button>
              <button
                type="button"
                onClick={() => setDensity('dense')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                  density === 'dense'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dense (30px)
              </button>
            </div>
          </div>

          {/* Watermark Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Watermark Visibility</span>
              <span className="text-magenta-400 font-mono font-bold">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.75"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-magenta-500 cursor-pointer"
            />
          </div>

          {/* Anti-AI Grain Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Anti-AI Noise Texture</span>
              <span className="text-cyan-400 font-mono font-bold">{noiseLevel}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="2"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Noise texture AI algorithms ko watermark remove karne se rokti hai.
            </p>
          </div>

          {/* Download Button */}
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              onClick={handleDownload}
              disabled={downloading || rendering}
              className="w-full justify-center py-2.5 bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-magenta-500/20"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {downloading ? 'Exporting...' : 'Download Protected Photo (JPG)'}
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyNotice}
              className="w-full justify-center py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copiedNotice ? 'Notice Copied!' : 'Copy WhatsApp Confidentiality Notice'}
            </Button>
          </div>

          {/* WhatsApp Sharing Advice Box */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Par Bhejne Ka Tareeqa:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Yeh photo download karke WhatsApp par <strong>"View Once" (1 dafa dekhne wala option)</strong> select karke send karein. View Once par WhatsApp screenshot lena block kar deta hai.
            </p>
          </div>

        </div>

      </div>
    </Modal>
  );
}
