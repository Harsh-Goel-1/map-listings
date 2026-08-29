'use client';

import { useState, useEffect, useCallback } from 'react';
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
          listings={listings}
          selectedId={selectedListing?.id || null}
          hoveredId={hoveredId}
          loading={loading}
          onSelect={handleSelectListing}
          onHover={handleHoverListing}
        />
        <MapView
          listings={listings}
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
