'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Listing } from '@/types/listing';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { formatDetailPrice, formatPropertyTypeLabel } from '@/lib/formatters';

interface ListingDetailViewProps {
  listing: Listing;
}

export default function ListingDetailView({ listing }: ListingDetailViewProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const images = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : [];
  const { formatted: priceStr, unit: priceUnit } = formatDetailPrice(listing.price, listing.listingType);

  const ratePerSqFt =
    listing.areaSqFt > 0 && listing.listingType !== 'RENT'
      ? Math.round(listing.price / listing.areaSqFt).toLocaleString('en-IN')
      : null;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${listing.title} | NoidaHomes`,
          text: `Check out this property in ${listing.address}: ${priceStr}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi, I am interested in "${listing.title}" (${priceStr}${priceUnit ? ' ' + priceUnit : ''}) located at ${listing.address} listed on NoidaHomes.\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`
  );

  const cleanPhone = listing.contactNumber ? listing.contactNumber.replace(/[^0-9+]/g, '') : '';
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;

  return (
    <div className="listing-detail-page" id="listing-detail-page">
      {/* ── Top Header / Breadcrumb Bar ── */}
      <header className="listing-detail-top-nav">
        <div className="listing-detail-nav-inner">
          <Link href="/" className="listing-detail-back-btn" id="back-to-map-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Map</span>
          </Link>

          <nav className="listing-detail-breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/?listingType=BUY">Noida</Link>
            <span className="breadcrumb-separator">/</span>
            {listing.societyName && (
              <>
                <span className="breadcrumb-item">{listing.societyName}</span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-active" title={listing.title}>
              {listing.title}
            </span>
          </nav>

          <div className="listing-detail-top-actions">
            <button
              type="button"
              className="listing-detail-share-btn"
              onClick={handleShare}
              title="Share listing"
              id="share-listing-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Page Layout ── */}
      <main className="listing-detail-container">
        {/* ── 1. Hero Title & Badges ── */}
        <section className="listing-detail-hero-header">
          <div className="listing-detail-badge-row">
            <span className={`listing-type-badge ${listing.listingType.toLowerCase()}`}>
              For {listing.listingType === 'RENT' ? 'Rent' : 'Sale'}
            </span>
            <span className="listing-category-badge">
              {listing.propertyCategory === 'COMMERCIAL' ? 'Commercial' : 'Residential'}
            </span>
            <span className="listing-type-pill">{formatPropertyTypeLabel(listing.propertyType)}</span>
          </div>

          <h1 className="listing-detail-title">{listing.title}</h1>

          <div className="listing-detail-location-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <address className="listing-detail-address">{listing.address}</address>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="listing-directions-link"
              title="Get directions in Google Maps"
            >
              Get Directions ↗
            </a>
          </div>
        </section>

        {/* ── 2. Photo Gallery Showcase ── */}
        <section className="listing-detail-gallery-section" aria-label="Property Photos">
          {images.length > 0 ? (
            <div className="listing-detail-gallery-grid">
              {/* Featured main photo */}
              <div
                className="gallery-main-photo-wrap"
                onClick={() => setIsLightboxOpen(true)}
                title="Click to view full photo"
              >
                <img
                  src={images[selectedPhotoIndex]}
                  alt={`${listing.title} - Photo ${selectedPhotoIndex + 1}`}
                  className="gallery-main-photo"
                />
                <span className="gallery-photo-badge">
                  📷 {selectedPhotoIndex + 1} / {images.length}
                </span>
                <span className="gallery-expand-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  View Fullscreen
                </span>
              </div>

              {/* Thumbnails strip */}
              {images.length > 1 && (
                <div className="gallery-thumb-strip">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`gallery-thumb-btn ${idx === selectedPhotoIndex ? 'active' : ''}`}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="gallery-thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="listing-detail-no-photo-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>No photos uploaded yet for this property</p>
            </div>
          )}
        </section>

        {/* ── 3. Content Body (Grid: Details Left, Sticky Sidebar Right) ── */}
        <div className="listing-detail-body-grid">
          <div className="listing-detail-main-col">
            {/* Quick Metrics Bar */}
            <div className="listing-detail-specs-card">
              <div className="spec-item">
                <span className="spec-label">Total Price</span>
                <span className="spec-value price">
                  {priceStr}
                  {priceUnit && <small className="price-sub">{priceUnit}</small>}
                </span>
                {ratePerSqFt && <span className="spec-sub">₹{ratePerSqFt} / sq.ft</span>}
              </div>

              {listing.bhk > 0 && (
                <div className="spec-item">
                  <span className="spec-label">Configuration</span>
                  <span className="spec-value">{listing.bhk} BHK</span>
                  <span className="spec-sub">Bedrooms</span>
                </div>
              )}

              <div className="spec-item">
                <span className="spec-label">Super Area</span>
                <span className="spec-value">{listing.areaSqFt.toLocaleString('en-IN')}</span>
                <span className="spec-sub">sq.ft</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Property Type</span>
                <span className="spec-value">{formatPropertyTypeLabel(listing.propertyType)}</span>
                <span className="spec-sub">{listing.propertyCategory}</span>
              </div>
            </div>

            {/* Society / Project Highlights */}
            {(listing.projectName || listing.societyName) && (
              <section className="listing-detail-section">
                <h2 className="section-heading">Project & Community</h2>
                <div className="listing-project-card">
                  <div className="project-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="project-info">
                    {listing.projectName && <h3 className="project-title">{listing.projectName}</h3>}
                    {listing.societyName && (
                      <p className="project-society">
                        Society: <strong>{listing.societyName}</strong>
                      </p>
                    )}
                    <p className="project-address">{listing.address}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Description */}
            <section className="listing-detail-section">
              <h2 className="section-heading">About This Property</h2>
              {listing.description ? (
                <div className="listing-description-text">{listing.description}</div>
              ) : (
                <p className="listing-description-empty">
                  Premium {listing.bhk > 0 ? `${listing.bhk} BHK ` : ''}
                  {formatPropertyTypeLabel(listing.propertyType)} available for {listing.listingType.toLowerCase()} in{' '}
                  {listing.societyName || listing.projectName || listing.address}. Contact the owner/agent for complete
                  details and floor plans.
                </p>
              )}
            </section>

            {/* Key Features & Amenities Checklist */}
            <section className="listing-detail-section">
              <h2 className="section-heading">Key Features & Amenities</h2>
              <div className="amenities-grid">
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>Prime Noida Location</span>
                </div>
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>Gated Community with 24x7 Security</span>
                </div>
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>Dedicated Vehicle Parking</span>
                </div>
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>Power Backup Facility</span>
                </div>
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>24-Hour Clean Water Supply</span>
                </div>
                <div className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span>Near Metro & Expressways</span>
                </div>
              </div>
            </section>

            {/* Interactive Location Map */}
            <section className="listing-detail-section">
              <div className="section-header-row">
                <h2 className="section-heading">Location on Noida Map</h2>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="section-header-link"
                >
                  Open in Google Maps ↗
                </a>
              </div>

              <div className="listing-detail-map-box">
                <Map
                  defaultCenter={{ lat: listing.latitude, lng: listing.longitude }}
                  defaultZoom={15}
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  mapId="noida-detail-map"
                >
                  <AdvancedMarker position={{ lat: listing.latitude, lng: listing.longitude }}>
                    <div className="map-marker-pin selected">
                      <div className="map-marker-price">
                        <span>{priceStr}</span>
                      </div>
                      <div className="map-marker-pointer" />
                    </div>
                  </AdvancedMarker>
                </Map>
              </div>
              <p className="listing-map-caption">
                📍 {listing.address} ({listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)})
              </p>
            </section>
          </div>

          {/* ── Right Column: Sticky Contact Card ── */}
          <aside className="listing-detail-sidebar">
            <div className="sticky-contact-card">
              <div className="contact-card-header">
                <span className="contact-card-badge">Verified Listing</span>
                <div className="contact-price-highlight">
                  <span className="amount">{priceStr}</span>
                  {priceUnit && <span className="unit">{priceUnit}</span>}
                </div>
                <span className="contact-card-sub">
                  {listing.bhk > 0 ? `${listing.bhk} BHK • ` : ''}
                  {listing.areaSqFt.toLocaleString('en-IN')} sq.ft
                </span>
              </div>

              <div className="contact-card-body">
                {cleanPhone ? (
                  <>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="contact-action-btn primary call"
                      id="detail-call-agent-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Call {listing.contactNumber}</span>
                    </a>

                    <a
                      href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-action-btn secondary whatsapp"
                      id="detail-whatsapp-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.35 7.62 9.07 7.69 8.83 7.95C8.59 8.21 7.91 8.85 7.91 10.15C7.91 11.45 8.86 12.71 9 12.9C9.14 13.09 10.87 15.75 13.53 16.9C14.16 17.17 14.66 17.34 15.04 17.46C15.68 17.66 16.26 17.63 16.72 17.56C17.23 17.48 18.29 16.92 18.51 16.3C18.73 15.68 18.73 15.15 18.67 15.04C18.61 14.93 18.43 14.86 18.16 14.73C17.88 14.6 16.53 13.93 16.28 13.84C16.03 13.75 15.85 13.7 15.67 13.97C15.48 14.23 14.96 14.86 14.81 15.04C14.65 15.22 14.5 15.24 14.22 15.11C13.95 14.97 13.06 14.68 12.01 13.75C11.2 13.02 10.65 12.13 10.5 11.87C10.35 11.61 10.48 11.46 10.62 11.32C10.74 11.2 10.89 11.01 11.03 10.85C11.17 10.69 11.21 10.57 11.31 10.38C11.4 10.2 11.35 10.04 11.29 9.91C11.22 9.78 10.68 8.44 10.45 7.91C10.23 7.39 10.01 7.46 9.84 7.46C9.69 7.45 9.53 7.62 9.53 7.62Z" />
                      </svg>
                      <span>Inquire on WhatsApp</span>
                    </a>
                  </>
                ) : (
                  <div className="contact-unlisted-note">
                    <p>Direct contact number not listed. Please check NoidaHomes main portal for inquiries.</p>
                  </div>
                )}

                <button
                  type="button"
                  className="contact-action-btn outline share"
                  onClick={handleShare}
                  id="detail-sidebar-share-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Share this Listing'}</span>
                </button>

                <div className="contact-trust-badges">
                  <div className="trust-badge-item">
                    <span className="trust-icon">🛡️</span>
                    <span>Zero Brokerage Verified</span>
                  </div>
                  <div className="trust-badge-item">
                    <span className="trust-icon">⚡</span>
                    <span>Instant Direct Connect</span>
                  </div>
                  <div className="trust-badge-item">
                    <span className="trust-icon">📍</span>
                    <span>Exact Map-Located Pin</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Lightbox Modal for Photo Gallery ── */}
      {isLightboxOpen && images.length > 0 && (
        <div className="gallery-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="gallery-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close photos"
            >
              ✕
            </button>

            <div className="gallery-lightbox-img-wrap">
              <img
                src={images[selectedPhotoIndex]}
                alt={`${listing.title} - Photo ${selectedPhotoIndex + 1}`}
                className="gallery-lightbox-img"
              />
            </div>

            {images.length > 1 && (
              <div className="gallery-lightbox-controls">
                <button
                  type="button"
                  className="lightbox-nav-btn prev"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  aria-label="Previous photo"
                >
                  ←
                </button>
                <span className="lightbox-counter">
                  {selectedPhotoIndex + 1} of {images.length}
                </span>
                <button
                  type="button"
                  className="lightbox-nav-btn next"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  aria-label="Next photo"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
