'use client';

import Link from 'next/link';
import { Listing } from '@/types/listing';

interface PropertyCardProps {
  listing: Listing;
  isSelected?: boolean;
  isHovered?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClose?: () => void;
}

export function formatPrice(price: number, listingType?: string): string {
  if (listingType === 'RENT') {
    if (price >= 100000) {
      const val = price / 100000;
      const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '');
      return `₹${formatted} L/m`;
    }
    if (price >= 1000) {
      const val = price / 1000;
      const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.?0+$/, '');
      return `₹${formatted}K/m`;
    }
    return `₹${price.toLocaleString('en-IN')}/m`;
  }
  if (price >= 10000000) {
    const val = price / 10000000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '');
    return `₹${formatted} Cr`;
  }
  if (price >= 100000) {
    const val = price / 100000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '');
    return `₹${formatted} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

function formatPropertyType(type: string): string {
  const map: Record<string, string> = {
    APARTMENT: 'Apartment',
    VILLA: 'Villa',
    PLOT: 'Plot',
    INDEPENDENT_HOUSE: 'Independent House',
    OFFICE_SPACE: 'Office Space',
    RETAIL_SHOP: 'Retail Shop',
    SHOWROOM: 'Showroom',
    WAREHOUSE: 'Warehouse',
    COMMERCIAL_PLOT: 'Commercial Plot',
  };
  return map[type] || type;
}

export default function PropertyCard({
  listing,
  isSelected = false,
  isHovered = false,
  compact = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: PropertyCardProps) {
  const cardClass = [
    'property-card',
    isSelected ? 'selected' : '',
    isHovered ? 'hovered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClass}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      id={`property-card-${listing.id}`}
    >
      {/* Image */}
      <div className="property-card-image">
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-mute)',
            fontSize: '12px',
          }}>
            No image
          </div>
        )}
        <span className={`property-card-badge ${listing.listingType.toLowerCase()}`}>
          {listing.listingType === 'RENT' ? 'Rent' : 'Buy'}
        </span>
        {onClose && (
          <button
            type="button"
            className="property-card-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close card"
          >
            ✕
          </button>
        )}
        {listing.imageUrls && listing.imageUrls.length > 1 && !onClose && (
          <span className="property-card-image-count">
            📷 {listing.imageUrls.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="property-card-body">
        <div className="property-card-price">
          {formatPrice(listing.price, listing.listingType)}
          {listing.listingType === 'RENT' && (
            <span className="price-unit">/mo</span>
          )}
        </div>

        <div className="property-card-meta">
          {listing.bhk > 0 && (
            <>
              <span>{listing.bhk} BHK</span>
              <span className="property-card-meta-dot" />
            </>
          )}
          <span>{listing.areaSqFt.toLocaleString('en-IN')} sq.ft</span>
          <span className="property-card-meta-dot" />
          <span>{formatPropertyType(listing.propertyType)}</span>
        </div>

        <Link
          href={`/listings/${listing.id}`}
          className="property-card-title-link"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="property-card-title">{listing.title}</div>
        </Link>

        <div className="property-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{listing.address}</span>
        </div>

        {!compact && (listing.projectName || listing.societyName) && (
          <div className="property-card-tags">
            {listing.projectName && (
              <span className="property-tag">{listing.projectName}</span>
            )}
            {listing.societyName && listing.societyName !== listing.projectName && (
              <span className="property-tag">{listing.societyName}</span>
            )}
          </div>
        )}

        <div className="property-card-actions">
          {listing.contactNumber && (
            <a
              href={`tel:${listing.contactNumber.replace(/\s+/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="property-card-contact-btn"
              title={`Call ${listing.contactNumber}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{listing.contactNumber}</span>
            </a>
          )}

          <Link
            href={`/listings/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className="property-card-view-btn"
            title="View full property details"
            id={`view-details-${listing.id}`}
          >
            <span>Details</span>
            <span className="view-btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
