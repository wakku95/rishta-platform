import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getPreferences, savePreferences } from '../../api/profile';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import { Sliders, Save, ArrowLeft, CheckSquare, Square } from 'lucide-react';

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
  'Overseas / Other',
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
];

export default function EditPreferencesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    preferred_gender: 'female',
    min_age: 20,
    max_age: 30,
    preferred_cities: ['Lahore', 'Islamabad'],
    preferred_religion: 'Islam',
    preferred_sect: '',
    min_height: 155,
    max_height: 180,
    preferred_education: "Bachelor's Degree or Higher",
    preferred_marital_status: ['never_married'],
  });

  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const res = await getPreferences();
        if (res.data) {
          setFormData({
            preferred_gender: res.data.preferred_gender || 'female',
            min_age: res.data.min_age || 20,
            max_age: res.data.max_age || 30,
            preferred_cities: res.data.preferred_cities || [],
            preferred_religion: res.data.preferred_religion || 'Islam',
            preferred_sect: res.data.preferred_sect || '',
            min_height: res.data.min_height || '',
            max_height: res.data.max_height || '',
            preferred_education: res.data.preferred_education || '',
            preferred_marital_status: res.data.preferred_marital_status || ['never_married'],
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

    fetchExisting();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['min_age', 'max_age', 'min_height', 'max_height'].includes(name)
        ? value === '' ? '' : parseInt(value, 10)
        : value,
    }));
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
          Specify what you look for in a compatible matrimonial match. These criteria will guide match discovery.
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
            {CITIES.map((city) => {
              const selected = formData.preferred_cities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityToggle(city)}
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
                  <span>{city}</span>
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
            <Input
              label="Preferred Religion"
              name="preferred_religion"
              value={formData.preferred_religion}
              onChange={handleChange}
              error={errors.preferred_religion?.[0]}
              placeholder="e.g. Islam"
            />

            <Input
              label="Preferred Sect (Optional)"
              name="preferred_sect"
              value={formData.preferred_sect}
              onChange={handleChange}
              error={errors.preferred_sect?.[0]}
              placeholder="e.g. Sunni, Shia, Ahle-Hadith, or Any"
            />

            <div className="sm:col-span-2">
              <Input
                label="Preferred Education / Qualification"
                name="preferred_education"
                value={formData.preferred_education}
                onChange={handleChange}
                error={errors.preferred_education?.[0]}
                placeholder="e.g. Bachelor's or Master's, Doctor, Engineer..."
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
            <Input
              label="Minimum Height (cm, e.g. 155 for approx 5'1)"
              name="min_height"
              type="number"
              min="120"
              max="230"
              value={formData.min_height}
              onChange={handleChange}
              error={errors.min_height?.[0]}
              placeholder="150"
            />

            <Input
              label="Maximum Height (cm, e.g. 185 for approx 6'1)"
              name="max_height"
              type="number"
              min="120"
              max="230"
              value={formData.max_height}
              onChange={handleChange}
              error={errors.max_height?.[0]}
              placeholder="190"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200">
            <label className="block text-sm font-semibold text-charcoal-900">
              Acceptable Marital Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {MARITAL_STATUS_OPTIONS.map((opt) => {
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
