'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Listing } from '@/types/listing';
import PropertyCard, { formatPrice } from './PropertyCard';
import { SearchedArea } from './LocationSearch';

interface MapViewProps {
  listings: Listing[];
  selectedListing: Listing | null;
  hoveredId: number | null;
  searchedArea: SearchedArea | null;
  onSelectListing: (listing: Listing | null) => void;
  onHoverListing: (id: number | null) => void;
}

interface LocationGroup {
  key: string;
  lat: number;
  lng: number;
  listings: Listing[];
}

// Noida Center coordinates
const NOIDA_CENTER = { lat: 28.5355, lng: 77.391 };

function formatMarkerPrice(price: number, listingType: string): string {
  if (listingType === 'RENT') {
    if (price >= 100000) {
      const val = price / 100000;
      return `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')}L/m`;
    }
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K/m`;
    return `₹${price}/m`;
  }
  if (price >= 10000000) {
    const val = price / 10000000;
    return `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }
  if (price >= 100000) {
    const val = price / 100000;
    return `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')}L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

// Controller component to pan map when a listing is selected
function MapPanController({ selectedListing }: { selectedListing: Listing | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedListing) {
      map.panTo({ lat: selectedListing.latitude, lng: selectedListing.longitude });
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined && currentZoom < 14) {
        map.setZoom(15);
      }
    }
  }, [map, selectedListing]);

  return null;
}

// Controller to auto-fit bounds to all listings on initial load
function MapInitialBoundsController({
  listings,
  hasSearchedArea,
}: {
  listings: Listing[];
  hasSearchedArea: boolean;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!map || hasSearchedArea || listings.length === 0 || fittedRef.current) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      listings.forEach((l) => {
        if (l.latitude && l.longitude) {
          bounds.extend({ lat: l.latitude, lng: l.longitude });
        }
      });
      map.fitBounds(bounds, 60);
      fittedRef.current = true;
    } catch (e) {
      console.warn('Could not fit bounds to listings:', e);
    }
  }, [map, listings, hasSearchedArea]);

  return null;
}

// Controller to draw the area-highlight circle on the native map
function AreaHighlightController({ searchedArea }: { searchedArea: SearchedArea | null }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    // Clean up old overlay
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (!map || !searchedArea) return;

    // Draw circle
    const circle = new google.maps.Circle({
      map,
      center: { lat: searchedArea.lat, lng: searchedArea.lng },
      radius: searchedArea.radius,
      fillColor: '#1a1a1a',
      fillOpacity: 0.05,
      strokeColor: '#1a1a1a',
      strokeOpacity: 0.4,
      strokeWeight: 1.5,
      clickable: false,
    });
    circleRef.current = circle;

    // Pan and zoom to fit circle
    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds, 80);
    }

    return () => {
      circle.setMap(null);
    };
  }, [map, searchedArea]);

  return null;
}

export default function MapView({
  listings,
  selectedListing,
  hoveredId,
  searchedArea,
  onSelectListing,
  onHoverListing,
}: MapViewProps) {
  const [activeGroup, setActiveGroup] = useState<LocationGroup | null>(null);

  // Group listings that share identical or near-identical coordinates (< 15 meters)
  // Uses O(n) spatial grid hashing instead of O(n²) linear scan
  const locationGroups = useMemo(() => {
    const gridSize = 0.00015; // ~15 meters
    const gridMap: Record<string, LocationGroup> = {};

    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return;

      // Quantize to grid cell
      const cellLat = Math.round(listing.latitude / gridSize);
      const cellLng = Math.round(listing.longitude / gridSize);
      const cellKey = `${cellLat},${cellLng}`;

      const existing = gridMap[cellKey];
      if (existing) {
        existing.listings.push(listing);
      } else {
        gridMap[cellKey] = {
          key: `${listing.latitude.toFixed(5)},${listing.longitude.toFixed(5)}`,
          lat: listing.latitude,
          lng: listing.longitude,
          listings: [listing],
        };
      }
    });

    const groups = Object.values(gridMap);

    // Sort units in each group by price ascending
    groups.forEach((g) => {
      g.listings.sort((a, b) => a.price - b.price);
    });

    return groups;
  }, [listings]);

  // Sync active group window when selectedListing changes from left cards
  useEffect(() => {
    if (selectedListing) {
      const match = locationGroups.find((g) =>
        g.listings.some((l) => l.id === selectedListing.id)
      );
      if (match) {
        setActiveGroup(match);
      }
    }
  }, [selectedListing, locationGroups]);

  return (
    <div className="map-container" id="map-view">
      <Map
        defaultCenter={NOIDA_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="noida-real-estate-map"
        onClick={() => {
          setActiveGroup(null);
          onSelectListing(null);
        }}
      >
        <MapPanController selectedListing={selectedListing} />
        <MapInitialBoundsController listings={listings} hasSearchedArea={Boolean(searchedArea)} />
        <AreaHighlightController searchedArea={searchedArea} />

        {searchedArea && (
          <AdvancedMarker
            position={{ lat: searchedArea.lat, lng: searchedArea.lng }}
            title={searchedArea.label}
            zIndex={5}
          >
            <div className="area-highlight-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{searchedArea.label}</span>
            </div>
          </AdvancedMarker>
        )}

        {locationGroups.map((group) => {
          const isGroup = group.listings.length > 1;
          const isHovered = group.listings.some((l) => l.id === hoveredId);
          const isSelected = group.listings.some((l) => l.id === selectedListing?.id);
          const minListing = group.listings[0];

          return (
            <AdvancedMarker
              key={group.key}
              position={{ lat: group.lat, lng: group.lng }}
              onClick={() => {
                setActiveGroup(group);
                if (group.listings.length === 1) {
                  onSelectListing(group.listings[0]);
                } else if (!group.listings.some((l) => l.id === selectedListing?.id)) {
                  onSelectListing(group.listings[0]);
                }
              }}
              title={
                isGroup
                  ? `${group.listings.length} listings at ${minListing.projectName || minListing.address || 'location'}`
                  : minListing.title
              }
            >
              <div
                className={`map-marker-pin ${isHovered ? 'hovered' : ''} ${
                  isSelected ? 'selected' : ''
                }`}
                onMouseEnter={() => onHoverListing(minListing.id)}
                onMouseLeave={() => onHoverListing(null)}
              >
                <div className="map-marker-price">
                  <span>{formatMarkerPrice(minListing.price, minListing.listingType)}</span>
                  {isGroup && (
                    <span className="map-marker-count-pill">
                      {group.listings.length}
                    </span>
                  )}
                </div>
                <div className="map-marker-pointer" />
              </div>
            </AdvancedMarker>
          );
        })}

        {activeGroup && (
          <InfoWindow
            position={{
              lat: activeGroup.lat,
              lng: activeGroup.lng,
            }}
            onCloseClick={() => {
              setActiveGroup(null);
              onSelectListing(null);
            }}
            headerDisabled={true}
          >
            {activeGroup.listings.length === 1 ? (
              <div className="info-window-content">
                <PropertyCard
                  listing={activeGroup.listings[0]}
                  compact={true}
                  onClick={() => {}}
                  onClose={() => {
                    setActiveGroup(null);
                    onSelectListing(null);
                  }}
                />
              </div>
            ) : (
              <div className="map-group-window">
                <div className="map-group-header">
                  <div className="map-group-title-wrap">
                    <h4 className="map-group-title">
                      {activeGroup.listings[0].projectName ||
                        activeGroup.listings[0].societyName ||
                        activeGroup.listings[0].title}
                    </h4>
                    <span className="map-group-subtitle">
                      {activeGroup.listings.length} units at this location
                    </span>
                  </div>
                  <button
                    type="button"
                    className="map-group-close"
                    onClick={() => {
                      setActiveGroup(null);
                      onSelectListing(null);
                    }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="map-group-items-list">
                  {activeGroup.listings.map((item) => {
                    const isItemActive = selectedListing?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`map-group-item ${isItemActive ? 'active' : ''}`}
                        onClick={() => onSelectListing(item)}
                      >
                        {item.imageUrls && item.imageUrls.length > 0 ? (
                          <img
                            src={item.imageUrls[0]}
                            alt={item.title}
                            className="map-group-thumb"
                          />
                        ) : (
                          <div className="map-group-thumb-placeholder">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="18"
                              height="18"
                            >
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                          </div>
                        )}

                        <div className="map-group-item-info">
                          <div className="map-group-item-top">
                            <span className="map-group-item-bhk">
                              {item.bhk > 0 ? `${item.bhk} BHK` : item.propertyType}
                            </span>
                            <div className="map-group-item-price-row">
                              <span className="map-group-item-price">
                                {formatPrice(item.price, item.listingType)}
                              </span>
                              <Link
                                href={`/listings/${item.id}`}
                                className="map-group-item-link"
                                onClick={(e) => e.stopPropagation()}
                                title="Open full listing page"
                              >
                                Details ↗
                              </Link>
                            </div>
                          </div>
                          <div className="map-group-item-sub">
                            {item.areaSqFt > 0 && (
                              <span>{item.areaSqFt.toLocaleString('en-IN')} sq ft</span>
                            )}
                            {item.title && <span> • {item.title}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
