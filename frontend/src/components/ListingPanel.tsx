'use client';

import { Listing } from '@/types/listing';
import PropertyCard from './PropertyCard';

interface ListingPanelProps {
  listings: Listing[];
  selectedId: number | null;
  hoveredId: number | null;
  loading: boolean;
  onSelect: (listing: Listing) => void;
  onHover: (id: number | null) => void;
}

export default function ListingPanel({
  listings,
  selectedId,
  hoveredId,
  loading,
  onSelect,
  onHover,
}: ListingPanelProps) {
  return (
    <aside className="listing-panel" id="listing-panel">
      <div className="listing-panel-header">
        <div className="listing-count">
          {listings.length} {listings.length === 1 ? 'property' : 'properties'}
          <span> found</span>
        </div>
        <div className="listing-sort">sort: relevance</div>
      </div>

      <div className="listing-scroll">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div className="empty-state-title">No properties found.</div>
            <div className="empty-state-text">
              Try adjusting your filters to see more results.
            </div>
          </div>
        ) : (
          listings.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              isSelected={selectedId === listing.id}
              isHovered={hoveredId === listing.id}
              onClick={() => onSelect(listing)}
              onMouseEnter={() => onHover(listing.id)}
              onMouseLeave={() => onHover(null)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
