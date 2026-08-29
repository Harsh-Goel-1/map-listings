'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Listing } from '@/types/listing';
import PropertyCard from './PropertyCard';
import { SearchedArea } from './LocationSearch';

interface MapViewProps {
  listings: Listing[];
  selectedListing: Listing | null;
  hoveredId: number | null;
  searchedArea: SearchedArea | null;
  onSelectListing: (listing: Listing | null) => void;
  onHoverListing: (id: number | null) => void;
}

// Noida Center coordinates
const NOIDA_CENTER = { lat: 28.5355, lng: 77.391 };

function formatMarkerPrice(price: number, listingType: string): string {
  if (listingType === 'RENT') {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L/m`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K/m`;
    return `₹${price}/m`;
  }
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

// Controller component to pan map when a listing is selected
function MapPanController({ selectedListing }: { selectedListing: Listing | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedListing) {
      map.panTo({ lat: selectedListing.latitude, lng: selectedListing.longitude });
    }
  }, [map, selectedListing]);

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
  const [activeWindowListing, setActiveWindowListing] = useState<Listing | null>(null);

  // Sync active info window with selected listing from list or pin
  useEffect(() => {
    setActiveWindowListing(selectedListing);
  }, [selectedListing]);

  return (
    <div className="map-container" id="map-view">
      <Map
        defaultCenter={NOIDA_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="noida-real-estate-map"
        onClick={() => {
          setActiveWindowListing(null);
          onSelectListing(null);
        }}
      >
        <MapPanController selectedListing={selectedListing} />
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

        {listings.map((listing) => {
          const isHovered = hoveredId === listing.id;
          const isSelected = selectedListing?.id === listing.id;

          return (
            <AdvancedMarker
              key={listing.id}
              position={{ lat: listing.latitude, lng: listing.longitude }}
              onClick={() => {
                onSelectListing(listing);
                setActiveWindowListing(listing);
              }}
              title={listing.title}
            >
              <div
                className={`map-marker-price ${isHovered ? 'hovered' : ''} ${
                  isSelected ? 'selected' : ''
                }`}
                onMouseEnter={() => onHoverListing(listing.id)}
                onMouseLeave={() => onHoverListing(null)}
              >
                {formatMarkerPrice(listing.price, listing.listingType)}
              </div>
            </AdvancedMarker>
          );
        })}

        {activeWindowListing && (
          <InfoWindow
            position={{
              lat: activeWindowListing.latitude,
              lng: activeWindowListing.longitude,
            }}
            onCloseClick={() => {
              setActiveWindowListing(null);
              onSelectListing(null);
            }}
            headerDisabled={true}
          >
            <div className="info-window-content">
              <PropertyCard
                listing={activeWindowListing}
                compact={true}
                onClick={() => {}}
                onClose={() => {
                  setActiveWindowListing(null);
                  onSelectListing(null);
                }}
              />
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
