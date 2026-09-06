import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getProfile, saveProfile } from '../../api/profile';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import FormError from '../../components/ui/FormError';
import LoadingState from '../../components/ui/LoadingState';
import { User, Save, X, Sparkles, ArrowLeft, HeartHandshake } from 'lucide-react';

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
  'Sargodha',
  'Abbottabad',
  'Overseas / Other',
];

const EDUCATIONS = [
  "Doctorate / PhD",
  "Master's Degree",
  "Bachelor's (4 Years / Honors)",
  "Bachelor's (2 Years)",
  "Chartered Accountant / ACCA",
  "Medical (MBBS / BDS)",
  "Engineering (BE / BS)",
  "Intermediate / A-Levels",
  "Matric / O-Levels",
  "Other Qualification",
];

const MARITAL_STATUSES = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
];

const MANAGED_BY_OPTIONS = [
  { value: 'myself', label: 'Myself (Candidate)' },
  { value: 'parent', label: 'Parent (Father / Mother)' },
  { value: 'sibling', label: 'Brother / Sister' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'family', label: 'Other Family Member' },
];

// Generates height options from 135 cm (4'5") to 213 cm (7'0")
const HEIGHT_OPTIONS = Array.from({ length: 79 }, (_, i) => {
  const cm = 135 + i;
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

  const [formData, setFormData] = useState({
    gender: 'male',
    date_of_birth: '',
    religion: 'Islam',
    sect: 'Sunni',
    city: 'Lahore',
    education: "Bachelor's (4 Years / Honors)",
    profession: '',
    marital_status: 'never_married',
    height: 175,
    about: '',
    managed_by: 'myself',
  });

  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        if (res.data) {
          setFormData({
            gender: res.data.gender || 'male',
            date_of_birth: res.data.date_of_birth || '',
            religion: res.data.religion || 'Islam',
            sect: res.data.sect || '',
            city: res.data.city || 'Lahore',
            education: res.data.education || "Bachelor's (4 Years / Honors)",
            profession: res.data.profession || '',
            marital_status: res.data.marital_status || 'never_married',
            height: res.data.height || 175,
            about: res.data.about || '',
            managed_by: res.data.managed_by || 'myself',
          });
        }
      } catch (err) {
        setGeneralError('Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchExisting();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'height' ? parseInt(value, 10) || '' : value,
    }));
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
        <LoadingState text="Loading profile form..." />
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
        </div>
      </div>

      {generalError && (
        <Alert variant="danger" title="Validation Error">
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Identification & Demographics */}
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
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              required
            />

            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth?.[0]}
              helperText="Candidate must be at least 18 years old. Stored privately."
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
              options={MARITAL_STATUSES}
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
              label="Current City (Pakistan or Overseas)"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city?.[0]}
              options={CITIES.map((c) => ({ value: c, label: c }))}
              required
            />

            <Input
              label="Religion"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              error={errors.religion?.[0]}
              placeholder="e.g. Islam"
              required
            />

            <Input
              label="Sect / Branch (Optional)"
              name="sect"
              value={formData.sect}
              onChange={handleChange}
              error={errors.sect?.[0]}
              placeholder="e.g. Sunni, Shia, Ahle-Hadith, etc."
            />

            <Select
              label="Profile Managed By"
              name="managed_by"
              value={formData.managed_by}
              onChange={handleChange}
              error={errors.managed_by?.[0]}
              options={MANAGED_BY_OPTIONS}
              required
            />
          </div>
        </Card>

        {/* Card 3: Education & Career */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            3. Education & Profession
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Highest Qualification"
              name="education"
              value={formData.education}
              onChange={handleChange}
              error={errors.education?.[0]}
              options={EDUCATIONS.map((ed) => ({ value: ed, label: ed }))}
              required
            />

            <Input
              label="Profession / Occupation"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              error={errors.profession?.[0]}
              placeholder="e.g. Software Engineer, Doctor, Banker..."
              required
            />
          </div>
        </Card>

        {/* Card 4: About & Family Background */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            4. About & Family Background
          </h2>

          <Textarea
            label="Brief Introduction & Family Values"
            name="about"
            rows={5}
            maxLength={2000}
            value={formData.about}
            onChange={handleChange}
            error={errors.about?.[0]}
            placeholder="Share details regarding family background, personal interests, personality, and religious outlook. Do NOT share private contact numbers or addresses."
            helperText="Clear and respectful descriptions help suitable families initiate meaningful inquiry."
          />
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
