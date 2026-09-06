import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getPreferences, savePreferences, getProfileOptions } from '../../api/profile';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import { Sliders, Save, ArrowLeft, CheckSquare, Square } from 'lucide-react';

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
  marital_statuses: [
    { value: 'never_married', label: 'Never Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
  ],
};

// Generates height options from 120 cm (3'11") to 220 cm (7'3")
const HEIGHT_OPTIONS = [
  { value: '', label: 'Any Height' },
  ...Array.from({ length: 101 }, (_, i) => {
    const cm = 120 + i;
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return {
      value: cm,
      label: `${feet}'${inches}" (${cm} cm)`,
    };
  }),
];

export default function EditPreferencesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});
  const [options, setOptions] = useState(FALLBACK_OPTIONS);

  const [formData, setFormData] = useState({
    preferred_gender: 'female',
    min_age: 20,
    max_age: 30,
    preferred_cities: ['Lahore', 'Islamabad'],
    preferred_religion: 'Islam',
    preferred_sect: '',
    min_height: '',
    max_height: '',
    preferred_education: '',
    preferred_marital_status: ['never_married'],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [optRes, prefRes] = await Promise.allSettled([
          getProfileOptions(),
          getPreferences(),
        ]);

        if (optRes.status === 'fulfilled' && optRes.value?.data) {
          setOptions((prev) => ({
            ...prev,
            ...optRes.value.data,
          }));
        }

        if (prefRes.status === 'fulfilled' && prefRes.value?.data) {
          const d = prefRes.value.data;
          setFormData({
            preferred_gender: d.preferred_gender || 'female',
            min_age: d.min_age || 20,
            max_age: d.max_age || 30,
            preferred_cities: d.preferred_cities || [],
            preferred_religion: d.preferred_religion || 'Islam',
            preferred_sect: d.preferred_sect || '',
            min_height: d.min_height || '',
            max_height: d.max_height || '',
            preferred_education: d.preferred_education || '',
            preferred_marital_status: d.preferred_marital_status || ['never_married'],
          });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setGeneralError('Please create your basic profile before configuring partner preferences.');
        } else {
          setGeneralError('Could not load preferences.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: ['min_age', 'max_age', 'min_height', 'max_height'].includes(name)
          ? value === '' ? '' : parseInt(value, 10)
          : value,
      };
      if (name === 'preferred_religion' && value !== 'Islam') {
        next.preferred_sect = '';
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCityToggle = (city) => {
    setFormData((prev) => {
      const exists = prev.preferred_cities.includes(city);
      const updated = exists
        ? prev.preferred_cities.filter((c) => c !== city)
        : [...prev.preferred_cities, city];
      return { ...prev, preferred_cities: updated };
    });
  };

  const handleMaritalStatusToggle = (val) => {
    setFormData((prev) => {
      const exists = prev.preferred_marital_status.includes(val);
      const updated = exists
        ? prev.preferred_marital_status.filter((s) => s !== val)
        : [...prev.preferred_marital_status, val];
      return { ...prev, preferred_marital_status: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    try {
      await savePreferences(formData);
      navigate('/profile');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setGeneralError(err.response.data.message || 'Please check your inputs.');
      } else {
        setGeneralError(err.response?.data?.message || 'Failed to save partner preferences.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <LoadingState text="Loading partner preferences..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="pb-2 border-b-2 border-stone-200">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-burgundy-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900 tracking-tight">
          Partner Preferences
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
          Specify what you look for in a compatible matrimonial match. These criteria use standardized options.
        </p>
      </div>

      {generalError && (
        <Alert variant="danger" title="Notice">
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Age and Gender */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            1. Gender & Age Range
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Select
              label="Seeking Prospective"
              name="preferred_gender"
              value={formData.preferred_gender}
              onChange={handleChange}
              error={errors.preferred_gender?.[0]}
              options={[
                { value: 'female', label: 'Bride (Female)' },
                { value: 'male', label: 'Groom (Male)' },
              ]}
              required
            />

            <Input
              label="Minimum Age (Years)"
              name="min_age"
              type="number"
              min="18"
              max="80"
              value={formData.min_age}
              onChange={handleChange}
              error={errors.min_age?.[0]}
              required
            />

            <Input
              label="Maximum Age (Years)"
              name="max_age"
              type="number"
              min="18"
              max="80"
              value={formData.max_age}
              onChange={handleChange}
              error={errors.max_age?.[0]}
              required
            />
          </div>
        </Card>

        {/* Card 2: Preferred Cities */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-4">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            2. Preferred Cities
          </h2>
          <p className="text-xs text-stone-500 font-medium">Select one or more cities you would consider:</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {options.cities.map((cityOpt) => {
              const cityVal = cityOpt.value;
              const selected = formData.preferred_cities.includes(cityVal);
              return (
                <button
                  key={cityVal}
                  type="button"
                  onClick={() => handleCityToggle(cityVal)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer text-left ${
                    selected
                      ? 'bg-burgundy-50 border-burgundy-700 text-burgundy-950'
                      : 'bg-white border-stone-300 text-charcoal-800 hover:border-stone-400'
                  }`}
                >
                  {selected ? (
                    <CheckSquare className="w-4 h-4 text-burgundy-700 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                  <span>{cityOpt.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Card 3: Religion & Education */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            3. Faith & Education Expectations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Preferred Religion"
              name="preferred_religion"
              value={formData.preferred_religion}
              onChange={handleChange}
              error={errors.preferred_religion?.[0]}
              options={[
                { value: '', label: 'Any Religion' },
                ...options.religions,
              ]}
            />

            {formData.preferred_religion === 'Islam' && (
              <Select
                label="Preferred Sect"
                name="preferred_sect"
                value={formData.preferred_sect}
                onChange={handleChange}
                error={errors.preferred_sect?.[0]}
                options={[
                  { value: '', label: 'Any Sect / Branch' },
                  ...options.sects,
                ]}
              />
            )}

            <div className="sm:col-span-2">
              <Select
                label="Preferred Minimum Education"
                name="preferred_education"
                value={formData.preferred_education}
                onChange={handleChange}
                error={errors.preferred_education?.[0]}
                options={[
                  { value: '', label: 'Any Educational Qualification' },
                  ...options.educations,
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Card 4: Height Bounds & Marital Status */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
          <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
            4. Height Range & Marital Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Minimum Height"
              name="min_height"
              value={formData.min_height}
              onChange={handleChange}
              error={errors.min_height?.[0]}
              options={HEIGHT_OPTIONS}
            />

            <Select
              label="Maximum Height"
              name="max_height"
              value={formData.max_height}
              onChange={handleChange}
              error={errors.max_height?.[0]}
              options={HEIGHT_OPTIONS}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200">
            <label className="block text-sm font-semibold text-charcoal-900">
              Acceptable Marital Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {options.marital_statuses.map((opt) => {
                const selected = formData.preferred_marital_status.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMaritalStatusToggle(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer text-left ${
                      selected
                        ? 'bg-burgundy-50 border-burgundy-700 text-burgundy-950'
                        : 'bg-white border-stone-300 text-charcoal-800 hover:border-stone-400'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-burgundy-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
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
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
