import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormError from '../../components/ui/FormError';

const CreateAssistedProfileModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'female',
    date_of_birth: '',
    religion: 'Islam',
    sect: 'Sunni',
    city: 'Karachi',
    education: "Bachelor's",
    profession: 'Business',
    marital_status: 'never_married',
    height: 165,
    managed_by: 'myself',
    preferred_gender: '',
    min_age: '',
    max_age: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await adminApi.createAssistedProfile(formData);
      onSuccess();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: [err.response?.data?.message || 'An error occurred'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
      <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <h3 className="text-lg font-bold text-white">Create Assisted Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-navy-800">
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError errors={errors} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <Input label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">City</label>
              <select name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Gujranwala">Gujranwala</option>
                <option value="Sialkot">Sialkot</option>
                <option value="Bahawalpur">Bahawalpur</option>
                <option value="Sargodha">Sargodha</option>
                <option value="Abbottabad">Abbottabad</option>
                <option value="Sukkur">Sukkur</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Education</label>
              <select name="education" value={formData.education} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="Matric / O-Level">Matric / O-Level</option>
                <option value="Intermediate / A-Level">Intermediate / A-Level</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="MPhil">MPhil</option>
                <option value="PhD">PhD</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Religion</label>
              <select name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Sikhism">Sikhism</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Jainism">Jainism</option>
                <option value="Other">Other</option>
                <option value="No religion">No religion</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {formData.religion === 'Islam' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-200">Sect</label>
                <select name="sect" value={formData.sect} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                  <option value="Sunni">Sunni</option>
                  <option value="Shia">Shia</option>
                  <option value="Ahle-Hadith">Ahle-Hadith</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Profession</label>
              <select name="profession" value={formData.profession} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="Student">Student</option>
                <option value="Software / IT">Software / IT</option>
                <option value="Engineering">Engineering</option>
                <option value="Medical / Healthcare">Medical / Healthcare</option>
                <option value="Education">Education</option>
                <option value="Business">Business</option>
                <option value="Finance / Banking">Finance / Banking</option>
                <option value="Government">Government</option>
                <option value="Law">Law</option>
                <option value="Marketing / Sales">Marketing / Sales</option>
                <option value="Freelance / Self-employed">Freelance / Self-employed</option>
                <option value="Skilled Professional">Skilled Professional</option>
                <option value="Homemaker">Homemaker</option>
                <option value="Retired">Retired</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Marital Status</label>
              <select name="marital_status" value={formData.marital_status} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="never_married">Never Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
              </select>
            </div>

            <Input label="Height (cm)" type="number" min="120" max="230" name="height" value={formData.height} onChange={handleChange} required />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Profile Managed By</label>
              <select name="managed_by" value={formData.managed_by} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                <option value="myself">Myself</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="guardian">Guardian</option>
                <option value="family">Other Family</option>
              </select>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <h4 className="text-md font-bold text-magenta-400 mb-3">Partner Preferences (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-200">Preferred Gender</label>
                <select name="preferred_gender" value={formData.preferred_gender} onChange={handleChange} className="w-full px-4 py-2.5 bg-navy-750 border border-slate-700 rounded-xl text-sm text-white">
                  <option value="">No Preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <Input label="Min Age" type="number" min="18" max="80" name="min_age" value={formData.min_age} onChange={handleChange} />
              <Input label="Max Age" type="number" min="18" max="80" name="max_age" value={formData.max_age} onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={loading}>Create Profile & Send Email</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssistedProfileModal;
