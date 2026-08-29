'use client';

import { useState, useRef, FormEvent, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { createListing, CreateListingPayload } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import {
  PropertyCategory,
  PropertyType,
  ListingType,
} from '@/types/listing';
import AdminLocationPicker from '@/components/AdminLocationPicker';

const ADMIN_PASSWORD = 'admin123';

const RESIDENTIAL_SUBTYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'INDEPENDENT_HOUSE', label: 'House / Floor' },
  { value: 'PLOT', label: 'Residential Plot' },
];

const COMMERCIAL_SUBTYPES: { value: PropertyType; label: string }[] = [
  { value: 'OFFICE_SPACE', label: 'Office Space' },
  { value: 'RETAIL_SHOP', label: 'Retail Shop' },
  { value: 'SHOWROOM', label: 'Showroom' },
  { value: 'WAREHOUSE', label: 'Warehouse / Godown' },
  { value: 'COMMERCIAL_PLOT', label: 'Commercial Plot' },
];

// ─── Password Gate ───────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="admin-gate">
      <div className="admin-gate-card">
        <div className="admin-gate-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="admin-gate-title">Admin Access</h1>
        <p className="admin-gate-subtitle">Enter your password to manage listings</p>
        <form onSubmit={handleSubmit} className="admin-gate-form">
          <input
            type="password"
            className={`admin-gate-input ${error ? 'error' : ''}`}
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
          />
          <button type="submit" className="admin-gate-btn">
            Unlock
          </button>
          {error && <p className="admin-gate-error">Incorrect password</p>}
        </form>
        <Link href="/" className="admin-gate-back">
          ← Back to map
        </Link>
      </div>
    </div>
  );
}

// ─── Admin Form ──────────────────────────────────────────────────
type FormState = CreateListingPayload & { imageUrlDraft: string };

const INITIAL_FORM: FormState = {
  title: '',
  price: 0,
  bhk: 2,
  areaSqFt: 1000,
  propertyCategory: 'RESIDENTIAL',
  propertyType: 'APARTMENT',
  listingType: 'BUY',
  projectName: '',
  societyName: '',
  address: '',
  contactNumber: '',
  description: '',
  latitude: 28.5355,
  longitude: 77.391,
  imageUrls: [],
  imageUrlDraft: '',
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cloudinary image upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!authenticated) {
    return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  }

  const activeSubtypes =
    form.propertyCategory === 'COMMERCIAL' ? COMMERCIAL_SUBTYPES : RESIDENTIAL_SUBTYPES;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (cat: PropertyCategory) => {
    const subtypes = cat === 'COMMERCIAL' ? COMMERCIAL_SUBTYPES : RESIDENTIAL_SUBTYPES;
    setForm((prev) => ({
      ...prev,
      propertyCategory: cat,
      propertyType: subtypes[0].value,
    }));
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type.toLowerCase())
    );

    if (fileArray.length === 0) {
      setUploadError('Please select valid JPEG, PNG, or WebP images.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const url = await uploadImageToCloudinary(file, (percent) => {
          const overall = Math.round(((i + percent / 100) / fileArray.length) * 100);
          setUploadProgress(overall);
        });
        uploadedUrls.push(url);
      }

      setForm((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), ...uploadedUrls],
      }));
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image(s). Check Cloudinary settings.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const addImageUrl = () => {
    const url = form.imageUrlDraft.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), url],
      imageUrlDraft: '',
    }));
  };

  const removeImageUrl = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { imageUrlDraft, ...payload } = form;
      const created = await createListing(payload);
      setSuccess(`Listing "${created.title}" created successfully (ID: ${created.id})`);
      setForm(INITIAL_FORM);
    } catch (err: any) {
      setError(err?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <Link href="/" className="admin-back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            Back to Map
          </Link>
        </div>
        <h1 className="admin-page-title">Add New Listing</h1>
        <div className="admin-header-right" />
      </header>

      {success && (
        <div className="admin-toast admin-toast-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="admin-toast admin-toast-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
          {error}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* ── Section: Basic Info ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Basic Information</h2>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label className="admin-label" htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                id="title"
                className="admin-input"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. 3 BHK in Sector 150"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="price">
                Price (₹) <span className="required">*</span>
              </label>
              <input
                id="price"
                type="number"
                className="admin-input"
                value={form.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="e.g. 7500000"
                min={0}
                required
              />
            </div>
          </div>
          <div className="admin-grid-3">
            <div className="admin-field">
              <label className="admin-label" htmlFor="bhk">BHK <span className="required">*</span></label>
              <input
                id="bhk"
                type="number"
                className="admin-input"
                value={form.bhk}
                onChange={(e) => updateField('bhk', Number(e.target.value))}
                min={1}
                max={10}
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="areaSqFt">Area (sq ft) <span className="required">*</span></label>
              <input
                id="areaSqFt"
                type="number"
                className="admin-input"
                value={form.areaSqFt}
                onChange={(e) => updateField('areaSqFt', Number(e.target.value))}
                min={1}
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="contactNumber">Contact Number</label>
              <input
                id="contactNumber"
                className="admin-input"
                value={form.contactNumber}
                onChange={(e) => updateField('contactNumber', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </section>

        {/* ── Section: Property Classification ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Property Classification</h2>
          <div className="admin-grid-3">
            <div className="admin-field">
              <label className="admin-label">Intent <span className="required">*</span></label>
              <div className="admin-toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${form.listingType === 'BUY' ? 'active' : ''}`}
                  onClick={() => updateField('listingType', 'BUY')}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${form.listingType === 'RENT' ? 'active' : ''}`}
                  onClick={() => updateField('listingType', 'RENT')}
                >
                  Rent
                </button>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Category <span className="required">*</span></label>
              <div className="admin-toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${form.propertyCategory === 'RESIDENTIAL' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('RESIDENTIAL')}
                >
                  Residential
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${form.propertyCategory === 'COMMERCIAL' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('COMMERCIAL')}
                >
                  Commercial
                </button>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="propertyType">Sub-type <span className="required">*</span></label>
              <select
                id="propertyType"
                className="admin-select"
                value={form.propertyType}
                onChange={(e) => updateField('propertyType', e.target.value as PropertyType)}
              >
                {activeSubtypes.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Section: Location ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Location</h2>

          {/* Map click & Google Maps Import */}
          <AdminLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            address={form.address}
            onLocationChange={(lat, lng) => {
              setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            }}
            onAddressChange={(detectedAddress) => {
              setForm((prev) => ({ ...prev, address: detectedAddress }));
            }}
          />

          <div className="admin-field" style={{ marginTop: 'var(--space-md)' }}>
            <label className="admin-label" htmlFor="address">Address <span className="required">*</span></label>
            <input
              id="address"
              className="admin-input"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="e.g. Sector 150, Noida, UP"
              required
            />
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label className="admin-label" htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                className="admin-input"
                value={form.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                placeholder="e.g. ATS Pristine"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="societyName">Society Name</label>
              <input
                id="societyName"
                className="admin-input"
                value={form.societyName}
                onChange={(e) => updateField('societyName', e.target.value)}
                placeholder="e.g. ATS Pristine Society"
              />
            </div>
          </div>
        </section>

        {/* ── Section: Description ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Description</h2>
          <div className="admin-field">
            <textarea
              id="description"
              className="admin-textarea"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the property…"
              rows={4}
            />
          </div>
        </section>

        {/* ── Section: Images (Cloudinary Drag-and-Drop & Direct Upload) ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            Property Photos {form.imageUrls && form.imageUrls.length > 0 && `(${form.imageUrls.length})`}
          </h2>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />

          {/* Drag & Drop Upload Zone */}
          <div
            className={`admin-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="admin-dropzone-icon">📷</div>
            <div className="admin-dropzone-title">
              {uploading ? 'Uploading to Cloudinary…' : 'Click or drop JPEG / PNG photos here'}
            </div>
            <div className="admin-dropzone-subtitle">
              Supports JPEG, PNG, WebP up to 10MB each
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && uploadProgress !== null && (
            <div className="admin-upload-progress-container">
              <div className="admin-upload-progress-header">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="admin-upload-progress-bar">
                <div
                  className="admin-upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="admin-upload-error">
              {uploadError}
            </div>
          )}

          {/* Visual Thumbnail Gallery */}
          {form.imageUrls && form.imageUrls.length > 0 && (
            <div className="admin-thumbnails-grid">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="admin-thumbnail-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Listing photo ${i + 1}`} className="admin-thumbnail-img" />
                  <span className="admin-thumbnail-badge">{i === 0 ? 'Cover' : `#${i + 1}`}</span>
                  <button
                    type="button"
                    className="admin-thumbnail-delete"
                    title="Remove photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImageUrl(i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: Add Image URL Manually */}
          <details className="admin-manual-url-details">
            <summary className="admin-manual-url-summary">+ Or paste image URL manually</summary>
            <div className="admin-image-add-row">
              <input
                className="admin-input"
                placeholder="Paste image URL (https://…)…"
                value={form.imageUrlDraft}
                onChange={(e) => updateField('imageUrlDraft', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
              />
              <button type="button" className="admin-btn-secondary" onClick={addImageUrl}>
                + Add URL
              </button>
            </div>
          </details>
        </section>

        {/* ── Submit ── */}
        <div className="admin-submit-row">
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
