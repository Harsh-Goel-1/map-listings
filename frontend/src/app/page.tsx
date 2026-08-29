'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ListingPanel from '@/components/ListingPanel';
import MapView from '@/components/MapView';
import { Listing, ListingFilter } from '@/types/listing';
import { fetchListings } from '@/lib/api';
import { SearchedArea } from '@/components/LocationSearch';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<ListingFilter>({
    listingType: 'BUY',
  });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchedArea, setSearchedArea] = useState<SearchedArea | null>(null);

  const loadListings = useCallback(async (activeFilters: ListingFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchListings(activeFilters);
      setListings(data);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
      setError(err?.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(filters);
  }, [filters, loadListings]);

  const handleFilterChange = (newFilters: ListingFilter) => {
    setFilters(newFilters);
    setSelectedListing(null);
  };

  const handleSelectListing = (listing: Listing | null) => {
    if (listing && selectedListing?.id === listing.id) {
      setSelectedListing(null);
    } else {
      setSelectedListing(listing);
    }
  };

  const handleHoverListing = (id: number | null) => {
    setHoveredId(id);
  };

  const handleAreaSelected = (area: SearchedArea | null) => {
    setSearchedArea(area);
    setSelectedListing(null);
  };

  const displayedListings = useMemo(() => {
    if (!searchedArea || listings.length === 0) return listings;

    // Calculate distance to searched area center
    const withDistance = listings.map((l) => {
      const R = 6371000;
      const dLat = ((l.latitude - searchedArea.lat) * Math.PI) / 180;
      const dLng = ((l.longitude - searchedArea.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((searchedArea.lat * Math.PI) / 180) *
          Math.cos((l.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const dist = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...l, distance: dist };
    });

    // Check if any listings are within generous vicinity of searched area (3km)
    const inVicinity = withDistance.filter((l) => l.distance <= Math.max(searchedArea.radius * 1.5, 3000));
    if (inVicinity.length > 0) {
      return inVicinity.sort((a, b) => a.distance - b.distance);
    }

    // Otherwise sort all by distance so closest appears first
    return withDistance.sort((a, b) => a.distance - b.distance);
  }, [listings, searchedArea]);

  return (
    <div className="app-container">
      <Header />
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchedArea={searchedArea}
        onAreaSelected={handleAreaSelected}
      />

      {error && (
        <div
          style={{
            background: 'var(--color-warning-soft, #fff5ea)',
            color: 'var(--color-warning-deep, #92400e)',
            padding: '8px 24px',
            fontSize: '13px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            Backend connection note: {error}. Make sure Spring Boot backend is running on port 8080.
          </span>
          <button
            onClick={() => loadListings(filters)}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '12px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <main className="main-content">
        <ListingPanel
          listings={displayedListings}
          selectedId={selectedListing?.id || null}
          hoveredId={hoveredId}
          loading={loading}
          onSelect={handleSelectListing}
          onHover={handleHoverListing}
        />
        <MapView
          listings={displayedListings}
          selectedListing={selectedListing}
          hoveredId={hoveredId}
          searchedArea={searchedArea}
          onSelectListing={handleSelectListing}
          onHoverListing={handleHoverListing}
        />
      </main>
    </div>
  );
}
