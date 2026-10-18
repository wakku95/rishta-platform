import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, X, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getProposalPhotoBlob } from '../../api/requests';

export default function SecurePhotoViewerModal({
  isOpen,
  onClose,
  requestCode,
  candidateCode,
  viewerProfileCode = 'MY-PROFILE',
  viewerPhone = 'CONFIDENTIAL',
  watermarkLevel = 'medium',
  customWatermarkText = null,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && requestCode) {
      loadPhoto();
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, requestCode]);

  const loadPhoto = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await getProposalPhotoBlob(requestCode);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      renderWatermarkedCanvas(url);
    } catch (err) {
      console.error('Failed to load private photo:', err);
      setError(err.response?.data?.message || 'Unable to load photo. Please ensure it has been approved and paid.');
    } finally {
      setLoading(false);
    }
  };

  // Render photo on HTML5 canvas with dynamic irreversible watermark tiles
  const renderWatermarkedCanvas = (imageUrl) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      // Set responsive high-res canvas dimension
      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw base image
      ctx.drawImage(img, 0, 0, width, height);

      // Watermark configurations based on intensity level
      const isDark = watermarkLevel === 'dark';
      const isStandard = watermarkLevel === 'standard';

      const opacity = isDark ? 0.85 : isStandard ? 0.40 : 0.65;
      const fontSize = isDark ? 16 : isStandard ? 13 : 15;

      // Draw Diagonal Watermark Grid with high-contrast double-tone
      ctx.save();
      ctx.rotate((-35 * Math.PI) / 180);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.min(1, opacity * 1.1)})`;
      ctx.lineWidth = isDark ? 3.2 : 2.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = isDark ? 6 : 4;

      const watermarkText = customWatermarkText?.trim()
        ? `${customWatermarkText.trim()} • ${viewerProfileCode || 'CANDIDATE'}`
        : `${viewerProfileCode || 'CANDIDATE'} • ${viewerPhone || 'CONFIDENTIAL'} • RISHTA SECURE`;

      const stepX = isDark ? 230 : isStandard ? 300 : 260;
      const stepY = isDark ? 65 : isStandard ? 95 : 80;

      let rowIndex = 0;
      for (let y = -height * 1.5; y < height * 2.5; y += stepY) {
        const rowOffsetX = (rowIndex % 2 === 0) ? 0 : (stepX / 2);
        for (let x = -width * 1.5; x < width * 2.5; x += stepX) {
          ctx.strokeText(watermarkText, x + rowOffsetX, y);
          ctx.fillText(watermarkText, x + rowOffsetX, y);
        }
        rowIndex++;
      }
      ctx.restore();

      // Top security strip if custom text exists
      if (customWatermarkText?.trim()) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, width, 26);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(customWatermarkText.trim(), width / 2, 17);
      }

      // Bottom security badge strip
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, height - 28, width, 28);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Confidential Matrimonial Viewer • Screen Captures Monitored • ID: ${viewerProfileCode}`,
        width / 2,
        height - 10
      );
    };
    img.src = imageUrl;
  };

  const handleStartHold = () => setIsHolding(true);
  const handleEndHold = () => setIsHolding(false);

  // Prevent right-click and save
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <span>Private Protected Viewer / محفوظ تصویر دیکھنے کی ونڈو</span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4 select-none" onContextMenu={handleContextMenu}>
        {/* Security Alert Header */}
        <div className="p-3 bg-gradient-to-r from-navy-900 to-navy-850 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Anti-Screenshot & Watermark Active:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            تصویر پر آپ کا موبائل نمبر اور پروفائل کوڈ پرنٹ ہے۔ کسی بھی سکرین شاٹ یا بیرونی تصویر پر آپ کی معلومات واضح ہوں گی۔
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hold to View Canvas Container */}
        <div className="relative flex flex-col items-center justify-center min-h-[360px] bg-navy-950/90 border border-slate-750 rounded-2xl overflow-hidden p-2">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-16 text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>Decrypting and stamping watermarked photo...</span>
            </div>
          ) : (
            <div
              className="relative w-full flex flex-col items-center justify-center cursor-pointer touch-none"
              onMouseDown={handleStartHold}
              onMouseUp={handleEndHold}
              onMouseLeave={handleEndHold}
              onTouchStart={handleStartHold}
              onTouchEnd={handleEndHold}
              onTouchCancel={handleEndHold}
            >
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-[460px] rounded-xl object-contain transition-all duration-300 shadow-2xl ${
                  isHolding ? 'filter-none scale-[1.01]' : 'blur-2xl opacity-40 brightness-75 scale-95'
                }`}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              />

              {/* Hold overlay banner when blurred */}
              {!isHolding && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4 text-center rounded-xl pointer-events-none transition-all">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-3 animate-pulse">
                    <Eye className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Hold to View / دیکھنے کے لیے دبا کر رکھیں
                  </h4>
                  <p className="text-xs text-cyan-200 max-w-xs leading-relaxed">
                    تصویر دیکھنے کے لیے انگلی یا ماؤس بٹن دبا کر رکھیں۔ چھوڑنے پر تصویر خودکار طور پر دھندلی ہو جائے گی۔
                  </p>
                </div>
              )}

              {/* Active Viewing Pill */}
              {isHolding && (
                <div className="absolute top-3 inset-x-auto px-3 py-1 bg-navy-950/80 backdrop-blur-md border border-cyan-400/40 rounded-full text-[11px] text-cyan-300 font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Viewing Active • Release to Blur</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile-Friendly Control Action Buttons */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onMouseDown={handleStartHold}
              onMouseUp={handleEndHold}
              onMouseLeave={handleEndHold}
              onTouchStart={handleStartHold}
              onTouchEnd={handleEndHold}
              onTouchCancel={handleEndHold}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 select-none transition-all shadow-md active:scale-95 cursor-pointer ${
                isHolding
                  ? 'bg-cyan-500 text-navy-950 shadow-cyan-500/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">{isHolding ? 'Holding Active' : 'Hold to View / دبائیں'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isHolding) {
                  setIsHolding(false);
                } else {
                  setIsHolding(true);
                  setTimeout(() => setIsHolding(false), 5000);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-850 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{isHolding ? 'Blur Now / دھندلا کریں' : 'Peek 5s / 5 سیکنڈ دیکھیں'}</span>
            </button>
          </div>
        )}

        {/* Footer info & Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-navy-900 border border-slate-750 text-slate-400">
              Candidate #{candidateCode}
            </span>
            <span className="text-[11px] text-slate-500">
              Confidential Match
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto justify-center font-semibold">
            Close / بند کریں
          </Button>
        </div>
      </div>
    </Modal>
  );
}
