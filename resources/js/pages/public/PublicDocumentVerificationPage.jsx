import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, UploadCloud, FileText, CheckCircle2, 
  AlertTriangle, Lock, ArrowLeft, Camera, Image as ImageIcon, Eye
} from 'lucide-react';
import { verificationApi } from '../../api/verification';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PublicDocumentVerificationPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);

  // Upload Form State
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [token]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await verificationApi.getPublicVerificationDoc(token);
      setRecord(data);
    } catch (err) {
      console.error('Failed to load verification link:', err);
      setError(err.response?.data?.message || 'Invalid or expired verification link.');
    } finally {
      setLoading(false);
    }
  };

  const handleFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Front file size exceeds 5MB limit.');
        return;
      }
      setFrontFile(file);
      setUploadError(null);
      if (file.type.startsWith('image/')) {
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setFrontPreview(null);
      }
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Back file size exceeds 5MB limit.');
        return;
      }
      setBackFile(file);
      setUploadError(null);
      if (file.type.startsWith('image/')) {
        setBackPreview(URL.createObjectURL(file));
      } else {
        setBackPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frontFile) {
      setUploadError('Please select the front side of your document.');
      return;
    }

    setSubmitting(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('front_image', frontFile);
    if (backFile) {
      formData.append('back_image', backFile);
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    try {
      await verificationApi.submitPublicVerificationDoc(token, formData);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.message || 'Failed to submit document. Please check file format and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-magenta-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Loading verification portal...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
        <Card variant="glass" className="max-w-md w-full p-6 text-center space-y-4 border border-rose-500/30">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Verification Link Expired</h2>
          <p className="text-xs text-slate-400">
            {error || 'This verification link is invalid or has expired. Please contact your RaabtaNow matchmaker on WhatsApp to receive a fresh link.'}
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Go to RaabtaNow Homepage
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">
        
        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Matchmaking Verification
          </div>
          <h1 className="text-2xl font-serif font-black text-white tracking-tight">
            Raabta<span className="text-magenta-400">Now</span> Candidate Verification
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please submit your verification document for Candidate Reference{' '}
            <span className="font-mono font-bold text-white">#{record.candidate_code}</span>
          </p>
        </div>

        {/* Privacy & Confidentiality Guarantee Box */}
        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-white">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>100% Confidential &amp; Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your document is strictly used by RaabtaNow matchmakers for identity verification during marriage proposal introductions. 
            <strong className="text-slate-300"> It is NEVER published or shown to other candidates or public visitors.</strong>
          </p>
        </div>

        {/* Success Screen */}
        {submitSuccess || record.status === 'submitted' || record.status === 'approved' ? (
          <Card variant="glass" className="p-6 text-center space-y-4 border border-emerald-500/30">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {record.status === 'approved' ? 'Verification Approved!' : 'Document Submitted Successfully!'}
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {record.status === 'approved' 
                ? 'Your document has been verified and approved by the RaabtaNow matchmaking team.'
                : 'Thank you! Your document has been securely received. Our matchmakers will verify it and update your profile.'}
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-400">
              Candidate Code: #{record.candidate_code}
            </div>
          </Card>
        ) : (
          /* Upload Form */
          <Card variant="glass" className="p-6 border border-white/10 space-y-5">
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {record.rejection_reason && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <p className="font-bold">Previous submission was not approved:</p>
                <p className="text-slate-300">{record.rejection_reason}</p>
                <p className="text-[11px] text-slate-400">Please upload a clearer picture below.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Front Side Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">
                  Front Side (Photo &amp; Details) <span className="text-rose-400">*</span>
                </label>

                <label className="border-2 border-dashed border-white/15 hover:border-magenta-500/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-navy-900/40 hover:bg-navy-900/60 group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFrontChange}
                    className="hidden"
                  />
                  {frontPreview ? (
                    <div className="space-y-2 text-center">
                      <img 
                        src={frontPreview} 
                        alt="Front Preview" 
                        className="max-h-40 rounded-lg mx-auto object-cover border border-white/10"
                      />
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Front Selected (Click to change)
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 py-3">
                      <Camera className="w-8 h-8 text-slate-500 group-hover:text-magenta-400 transition mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">
                        {frontFile ? frontFile.name : 'Tap to take photo or choose file'}
                      </p>
                      <p className="text-[10px] text-slate-500">JPG, PNG, PDF up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Back Side Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">
                  Back Side (Address &amp; Details) <span className="text-slate-400 font-normal">(Optional for single-page documents)</span>
                </label>

                <label className="border-2 border-dashed border-white/15 hover:border-magenta-500/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-navy-900/40 hover:bg-navy-900/60 group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleBackChange}
                    className="hidden"
                  />
                  {backPreview ? (
                    <div className="space-y-2 text-center">
                      <img 
                        src={backPreview} 
                        alt="Back Preview" 
                        className="max-h-40 rounded-lg mx-auto object-cover border border-white/10"
                      />
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Back Selected (Click to change)
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 py-3">
                      <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-magenta-400 transition mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">
                        {backFile ? backFile.name : 'Tap to choose back side (optional)'}
                      </p>
                      <p className="text-[10px] text-slate-500">JPG, PNG, PDF up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Notes / Clarification (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Smart Card, NADRA CNIC, Degree, etc."
                  className="w-full text-xs rounded-xl bg-navy-900/80 border border-white/10 text-white px-3.5 py-2.5 focus:border-magenta-500 focus:outline-none"
                  maxLength={200}
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !frontFile}
                className="w-full justify-center py-3 bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-400 hover:to-purple-500 font-bold text-sm shadow-lg shadow-magenta-500/20"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting Securely...' : 'Submit Document for Verification'}
              </Button>
            </form>
          </Card>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} RaabtaNow Matrimonial Services. All rights reserved.</p>
          <p>For assistance, please contact your matchmaking representative.</p>
        </div>
      </div>
    </div>
  );
}
