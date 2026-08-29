'use client';

import { useState, useRef, useEffect, useCallback, useMemo, FormEvent, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { fetchListings, createListing, updateListing, deleteListing, CreateListingPayload } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import {
  PropertyCategory,
  PropertyType,
  ListingType,
  Listing,
} from '@/types/listing';
import AdminLocationPicker from '@/components/AdminLocationPicker';
import { formatPrice } from '@/components/PropertyCard';

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
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_auth') === 'true';
    }
    return false;
  });

  const handleAuthSuccess = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_auth', 'true');
    }
    setAuthenticated(true);
  };
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit and Manage state
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [listingsList, setListingsList] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Cloudinary image upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const data = await fetchListings({});
      setListingsList(data);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadListings();
    }
  }, [authenticated, loadListings]);

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

  const handleEdit = (item: Listing) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      price: item.price,
      bhk: item.bhk,
      areaSqFt: item.areaSqFt,
      propertyCategory: item.propertyCategory || 'RESIDENTIAL',
      propertyType: item.propertyType,
      listingType: item.listingType,
      projectName: item.projectName || '',
      societyName: item.societyName || '',
      address: item.address || '',
      contactNumber: item.contactNumber || '',
      description: item.description || '',
      latitude: item.latitude,
      longitude: item.longitude,
      imageUrls: item.imageUrls ? [...item.imageUrls] : [],
      imageUrlDraft: '',
    });
    setError(null);
    setSuccess(null);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (item: Listing) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" (ID: ${item.id})? This will permanently remove it from the map.`)) {
      return;
    }

    try {
      setDeletingId(item.id);
      await deleteListing(item.id);
      setSuccess(`Listing "${item.title}" (ID: ${item.id}) deleted successfully.`);
      await loadListings();
      if (editingId === item.id) {
        setEditingId(null);
        setForm(INITIAL_FORM);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredListings = useMemo(() => {
    if (!searchFilter.trim()) return listingsList;
    const term = searchFilter.toLowerCase();
    return listingsList.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        (l.projectName && l.projectName.toLowerCase().includes(term)) ||
        (l.societyName && l.societyName.toLowerCase().includes(term)) ||
        l.address.toLowerCase().includes(term)
    );
  }, [listingsList, searchFilter]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.bhk || form.bhk < 0.5 || (form.bhk * 2) % 1 !== 0) {
        setError('BHK must be a multiple of 0.5 (e.g. 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4)');
        setSubmitting(false);
        return;
      }

      const { imageUrlDraft, ...payload } = form;
      if (editingId) {
        const updated = await updateListing(editingId, payload);
        setSuccess(`Listing "${updated.title}" (ID: ${updated.id}) updated successfully!`);
        setEditingId(null);
        setForm(INITIAL_FORM);
        await loadListings();
        setActiveTab('manage');
      } else {
        const created = await createListing(payload);
        setSuccess(`Listing "${created.title}" created successfully (ID: ${created.id})`);
        setForm(INITIAL_FORM);
        await loadListings();
      }
    } catch (err: any) {
      setError(err?.message || (editingId ? 'Failed to update listing' : 'Failed to create listing'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!authenticated) {
    return <PasswordGate onAuth={handleAuthSuccess} />;
  }

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

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            {editingId ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Listing #{editingId}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
                Add Listing
              </>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manage');
              loadListings();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Manage Listings
            <span className="admin-tab-count">{listingsList.length}</span>
          </button>
        </div>

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

      {editingId && activeTab === 'create' && (
        <div className="admin-edit-banner">
          <div className="admin-edit-banner-text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>
              You are currently editing <strong>{form.title || `Listing #${editingId}`}</strong>
            </span>
          </div>
          <button
            type="button"
            className="admin-cancel-edit-btn"
            onClick={handleCancelEdit}
          >
            Cancel Edit
          </button>
        </div>
      )}

      {activeTab === 'create' && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="admin-label" htmlFor="bhk">
                  BHK <span className="required">*</span>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-mute)' }}>Step: 0.5 (e.g. 2.5, 3.5)</span>
              </div>
              <input
                id="bhk"
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                className="admin-input"
                value={form.bhk || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateField('bhk', isNaN(val) ? 0 : val);
                }}
                placeholder="e.g. 2.5"
                required
              />
              <div className="admin-bhk-chips">
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`admin-bhk-chip ${form.bhk === val ? 'active' : ''}`}
                    onClick={() => updateField('bhk', val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
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
            onProjectSuggest={(name) => {
              setForm((prev) => ({
                ...prev,
                projectName: prev.projectName || name,
                societyName: prev.societyName || name,
              }));
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
            {submitting
              ? editingId
                ? 'Updating…'
                : 'Creating…'
              : editingId
              ? 'Update Listing'
              : 'Create Listing'}
          </button>
        </div>
      </form>
      )}

      {/* ── Manage Existing Listings Tab ── */}
      {activeTab === 'manage' && (
        <div className="admin-manage-container">
          <div className="admin-manage-header">
            <div>
              <h2 className="admin-section-title" style={{ marginBottom: '4px' }}>
                All Active Listings ({filteredListings.length})
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-mute)' }}>
                Click Edit to update property details or Delete to remove from the live map.
              </p>
            </div>

            <div className="admin-manage-search">
              <svg
                className="admin-manage-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="15"
                height="15"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="admin-manage-search-input"
                placeholder="Search properties by title, project, address…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {loadingListings ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-mute)' }}>
              Loading listings…
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="admin-manage-empty">
              <div className="admin-manage-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                {searchFilter ? 'No listings matching your search' : 'No properties found in database'}
              </p>
              <button
                type="button"
                className="admin-btn-action-edit"
                onClick={() => {
                  setEditingId(null);
                  setForm(INITIAL_FORM);
                  setActiveTab('create');
                }}
              >
                + Add First Listing
              </button>
            </div>
          ) : (
            <div className="admin-manage-list">
              {filteredListings.map((item) => (
                <div key={item.id} className="admin-manage-card">
                  <div className="admin-manage-card-left">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrls[0]} alt={item.title} className="admin-manage-card-thumb" />
                    ) : (
                      <div className="admin-manage-card-thumb-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                    )}
                    <div className="admin-manage-card-info">
                      <h3 className="admin-manage-card-title">{item.title}</h3>
                      <div className="admin-manage-card-meta">
                        <span className="admin-manage-card-price">
                          {formatPrice(item.price, item.listingType)}
                        </span>
                        <span className="admin-manage-card-pill">
                          {item.bhk > 0 ? `${item.bhk} BHK` : item.propertyType}
                        </span>
                        {item.areaSqFt > 0 && (
                          <span className="admin-manage-card-pill">
                            {item.areaSqFt.toLocaleString('en-IN')} sq ft
                          </span>
                        )}
                        <span className="admin-manage-card-pill">
                          {item.listingType}
                        </span>
                        {item.projectName && (
                          <span className="admin-manage-card-pill">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                      <p className="admin-manage-card-address">
                        📍 {item.address} • ({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})
                      </p>
                    </div>
                  </div>

                  <div className="admin-manage-card-actions">
                    <button
                      type="button"
                      className="admin-btn-action-edit"
                      onClick={() => handleEdit(item)}
                      title="Edit this listing"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action-delete"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      title="Delete this listing"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {deletingId === item.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
