'use client';

import { useState } from 'react';

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'gym', label: 'Gym / Fitness Studio' },
  { value: 'salon', label: 'Hair Salon' },
  { value: 'repair', label: 'Auto Repair' },
  { value: 'dental', label: 'Dental Clinic' },
  { value: 'medical', label: 'Medical Practice' },
  { value: 'law', label: 'Law Firm' },
  { value: 'accounting', label: 'Accounting / CPA' },
  { value: 'real_estate', label: 'Real Estate Agency' },
  { value: 'coffee', label: 'Coffee Shop / Café' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pizza', label: 'Pizza Shop' },
  { value: 'plumbing', label: 'Plumbing Service' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC / Heating & Cooling' },
  { value: 'landscaping', label: 'Landscaping / Lawn Care' },
  { value: 'cleaning', label: 'Cleaning Service' },
  { value: 'tutoring', label: 'Tutoring / Education' },
  { value: 'pet_grooming', label: 'Pet Grooming' },
  { value: 'veterinary', label: 'Veterinary Clinic' },
  { value: 'yoga', label: 'Yoga Studio' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'daycare', label: 'Daycare / Childcare' },
] as const;

export interface GenerateFormValues {
  business_name: string;
  business_type: string;
  city: string;
}

interface GenerateFormProps {
  onSubmit: (data: GenerateFormValues) => void;
  disabled?: boolean;
}

export default function GenerateForm({ onSubmit, disabled }: GenerateFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Partial<GenerateFormValues>>({});

  function validate(): Partial<GenerateFormValues> {
    const e: Partial<GenerateFormValues> = {};
    if (!name.trim()) e.business_name = 'Business name is required.';
    else if (name.trim().length > 100) e.business_name = 'Must be 100 characters or less.';
    if (!type) e.business_type = 'Please select a business type.';
    if (!city.trim()) e.city = 'City is required.';
    else if (city.trim().length > 50) e.city = 'Must be 50 characters or less.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({ business_name: name.trim(), business_type: type, city: city.trim() });
  }

  const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-5">
      <div className="space-y-1">
        <label htmlFor="business_name" className="block text-sm font-medium text-slate-300">
          Business Name
        </label>
        <input
          id="business_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mario's Pizza"
          maxLength={100}
          disabled={disabled}
          className={inputClass}
        />
        {errors.business_name && (
          <p className="text-xs text-red-400">{errors.business_name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="business_type" className="block text-sm font-medium text-slate-300">
          Business Type
        </label>
        <select
          id="business_type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="" disabled>
            Select a type…
          </option>
          {BUSINESS_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </select>
        {errors.business_type && (
          <p className="text-xs text-red-400">{errors.business_type}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="city" className="block text-sm font-medium text-slate-300">
          City
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Austin, TX"
          maxLength={50}
          disabled={disabled}
          className={inputClass}
        />
        {errors.city && <p className="text-xs text-red-400">{errors.city}</p>}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? 'Generating…' : 'Generate My Website ✦'}
      </button>
    </form>
  );
}
