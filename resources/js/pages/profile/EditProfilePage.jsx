import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getProfile, saveProfile, getProfileOptions } from '../../api/profile';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import { Save, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

// Canonical fallback options matching App\Constants\ProfileOptions
const FALLBACK_OPTIONS = {
  genders: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ],
  religions: [
    { value: 'Islam', label: 'Islam' },
    { value: 'Christianity', label: 'Christianity' },
    { value: 'Hinduism', label: 'Hinduism' },
    { value: 'Sikhism', label: 'Sikhism' },
    { value: 'Buddhism', label: 'Buddhism' },
    { value: 'Jainism', label: 'Jainism' },
    { value: 'Other', label: 'Other' },
    { value: 'No religion', label: 'No religion' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ],
  sects: [
    { value: 'Sunni', label: 'Sunni' },
    { value: 'Shia', label: 'Shia' },
    { value: 'Ahle-Hadith', label: 'Ahle-Hadith' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ],
  cities: [
    { value: 'Karachi', label: 'Karachi' },
    { value: 'Lahore', label: 'Lahore' },
    { value: 'Islamabad', label: 'Islamabad' },
    { value: 'Rawalpindi', label: 'Rawalpindi' },
    { value: 'Faisalabad', label: 'Faisalabad' },
    { value: 'Multan', label: 'Multan' },
    { value: 'Peshawar', label: 'Peshawar' },
    { value: 'Quetta', label: 'Quetta' },
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Gujranwala', label: 'Gujranwala' },
    { value: 'Sialkot', label: 'Sialkot' },
    { value: 'Bahawalpur', label: 'Bahawalpur' },
    { value: 'Sargodha', label: 'Sargodha' },
    { value: 'Abbottabad', label: 'Abbottabad' },
    { value: 'Sukkur', label: 'Sukkur' },
    { value: 'Other', label: 'Other' },
  ],
  educations: [
    { value: 'Matric / O-Level', label: 'Matric / O-Level' },
    { value: 'Intermediate / A-Level', label: 'Intermediate / A-Level' },
    { value: 'Diploma', label: 'Diploma' },
    { value: "Bachelor's", label: "Bachelor's" },
    { value: "Master's", label: "Master's" },
    { value: 'MPhil', label: 'MPhil' },
    { value: 'PhD', label: 'PhD' },
    { value: 'Other', label: 'Other' },
  ],
  professions: [
    { value: 'Student', label: 'Student' },
    { value: 'Software / IT', label: 'Software / IT' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Medical / Healthcare', label: 'Medical / Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Business', label: 'Business' },
    { value: 'Finance / Banking', label: 'Finance / Banking' },
    { value: 'Government', label: 'Government' },
    { value: 'Law', label: 'Law' },
    { value: 'Marketing / Sales', label: 'Marketing / Sales' },
    { value: 'Freelance / Self-employed', label: 'Freelance / Self-employed' },
    { value: 'Skilled Professional', label: 'Skilled Professional' },
    { value: 'Homemaker', label: 'Homemaker' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Other', label: 'Other' },
  ],
  marital_statuses: [
    { value: 'never_married', label: 'Never Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
  ],
  managed_by: [
    { value: 'myself', label: 'Myself (Candidate)' },
    { value: 'parent', label: 'Parent (Father / Mother)' },
    { value: 'sibling', label: 'Brother / Sister' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'family', label: 'Other Family Member' },
  ],
};

// Generates height options from 120 cm (3'11") to 220 cm (7'3")
const HEIGHT_OPTIONS = Array.from({ length: 101 }, (_, i) => {
  const cm = 120 + i;
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return {
    value: cm,
    label: `${feet}'${inches}" (${cm} cm)`,
  };
});

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});
  const [options, setOptions] = useState(FALLBACK_OPTIONS);

  const [formData, setFormData] = useState({
    gender: 'male',
    date_of_birth: '',
    religion: 'Islam',
    sect: 'Sunni',
    city: 'Lahore',
    education: "Bachelor's",
    profession: 'Software / IT',
    marital_status: 'never_married',
    height: 175,
    about: '',
    family_background: '',
    managed_by: 'myself',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [optRes, profRes] = await Promise.allSettled([
          getProfileOptions(),
          getProfile(),
        ]);

        if (optRes.status === 'fulfilled' && optRes.value?.data) {
          setOptions((prev) => ({
            ...prev,
            ...optRes.value.data,
          }));
        }

        if (profRes.status === 'fulfilled' && profRes.value?.data) {
          const d = profRes.value.data;
          setFormData({
            gender: d.gender || 'male',
            date_of_birth: d.date_of_birth || '',
            religion: d.religion || 'Islam',
            sect: d.sect || 'Sunni',
            city: d.city || 'Lahore',
            education: d.education || "Bachelor's",
            profession: d.profession || 'Software / IT',
            marital_status: d.marital_status || 'never_married',
            height: d.height || 175,
            about: d.about || '',
            family_background: d.family_background || '',
            managed_by: d.managed_by || 'myself',
          });
        }
      } catch (err) {
        setGeneralError('Could not load profile configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === 'height' ? parseInt(value, 10) || '' : value,
      };
      if (name === 'religion' && value !== 'Islam') {
        updated.sect = '';
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    try {
      await saveProfile(formData);
      navigate('/profile');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setGeneralError(err.response.data.message || 'Please correct the highlighted errors.');
      } else {
        setGeneralError(err.response?.data?.message || 'Failed to save profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <LoadingState text="Loading matrimonial profile form..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Back button & page heading */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-stone-200">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-burgundy-900 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900 tracking-tight">
            Edit Matrimonial Profile
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Information is structured using standardized options to maintain privacy and searchability.
          </p>
        </div>
      </div>

      {generalError && (
        <Alert variant="danger" title="Validation Notice">
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Demographics */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            1. Basic Demographics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Candidate Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              error={errors.gender?.[0]}
              options={options.genders}
              required
            />

            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth?.[0]}
              helperText="Candidate must be 18 to 80 years old. DOB is strictly private; only calculated age is shown to others."
              required
            />

            <Select
              label="Height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              error={errors.height?.[0]}
              options={HEIGHT_OPTIONS}
              required
            />

            <Select
              label="Marital Status"
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              error={errors.marital_status?.[0]}
              options={options.marital_statuses}
              required
            />
          </div>
        </Card>

        {/* Card 2: Location & Faith */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            2. Location & Religious Background
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Current City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city?.[0]}
              options={options.cities}
              required
            />

            <Select
              label="Religion"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              error={errors.religion?.[0]}
              options={options.religions}
              required
            />

            {formData.religion === 'Islam' && (
              <Select
                label="Sect / Branch"
                name="sect"
                value={formData.sect}
                onChange={handleChange}
                error={errors.sect?.[0]}
                options={options.sects}
                required
              />
            )}

            <Select
              label="Profile Managed By"
              name="managed_by"
              value={formData.managed_by}
              onChange={handleChange}
              error={errors.managed_by?.[0]}
              options={options.managed_by}
              required
            />
          </div>
        </Card>

        {/* Card 3: Education & Profession */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            3. Education & Career
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Highest Qualification"
              name="education"
              value={formData.education}
              onChange={handleChange}
              error={errors.education?.[0]}
              options={options.educations}
              required
            />

            <Select
              label="Profession / Field"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              error={errors.profession?.[0]}
              options={options.professions}
              required
            />
          </div>
        </Card>

        {/* Card 4: Private Information (Strictly Protected) */}
        <Card className="p-6 sm:p-8 bg-stone-50/70 border-2 border-stone-300 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-2 border-b-2 border-stone-200">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-burgundy-800" />
              <h2 className="text-base font-serif font-extrabold text-burgundy-900">
                4. Private Information (Protected)
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Protected
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-burgundy-50 border border-burgundy-200 text-xs text-burgundy-950 font-medium space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              🔒 Privacy Protection Guarantee
            </p>
            <p className="leading-relaxed">
              These details are <strong>never</strong> shown on public profile discovery or search results.
              They are only shared after a mutual rishta request is accepted, contact unlock fee is paid, and dual OTP verification is completed.
            </p>
            <p className="text-burgundy-900 font-bold pt-1">
              ⚠️ Strict Rule: Do NOT write phone numbers, email addresses, social handles, or street addresses here.
            </p>
          </div>

          <div className="space-y-4">
            <Textarea
              label="About Candidate (Optional)"
              name="about"
              rows={4}
              maxLength={2000}
              value={formData.about}
              onChange={handleChange}
              error={errors.about?.[0]}
              placeholder="Describe personality, hobbies, life outlook, values, and religious practice..."
              helperText="Optional for profile activation. Max 2,000 characters."
            />

            <Textarea
              label="Family Background (Optional)"
              name="family_background"
              rows={4}
              maxLength={2000}
              value={formData.family_background}
              onChange={handleChange}
              error={errors.family_background?.[0]}
              placeholder="Describe parents, siblings, family traditions, values, and native origin..."
              helperText="Optional for profile activation. Max 2,000 characters."
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <Link to="/profile" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto font-bold border-stone-300"
            >
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            loading={submitting}
            className="w-full sm:w-auto font-bold px-8 shadow-md"
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
