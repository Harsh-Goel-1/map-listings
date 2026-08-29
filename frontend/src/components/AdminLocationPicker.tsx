'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  MapControl,
  ControlPosition,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

interface AdminLocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
}

interface MapSearchResult {
  id: string;
  mainText: string;
  secondaryText?: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

// Controller to smoothly pan the map when coordinates change
function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (map && lat && lng) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);

  return null;
}

// Parse coordinates or place query from Google Maps URL or raw text
function parseGoogleMapsInput(rawInput: string): { lat?: number; lng?: number; query?: string; isLink?: boolean } {
  const input = rawInput.trim();

  // Pattern 1: Direct coordinates e.g. "28.5355, 77.3910" or "28.5355 77.3910"
  const directMatch = input.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*[, ]\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, isLink: true };
    }
  }

  // Pattern 2: Google Maps URL with /@lat,lng,zoom
  const atMatch = input.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), isLink: true };
  }

  // Pattern 3: URL params with q=lat,lng or ll=lat,lng
  const paramCoordMatch = input.match(/[?&](?:q|ll|daddr|saddr)=([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
  if (paramCoordMatch) {
    return { lat: parseFloat(paramCoordMatch[1]), lng: parseFloat(paramCoordMatch[2]), isLink: true };
  }

  // Pattern 4: Google Maps Place URL: /maps/place/Place+Name/...
  const placeMatch = input.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return { query, isLink: true };
  }

  // Pattern 5: URL query param q=Place+Name
  const queryParamMatch = input.match(/[?&]q=([^&]+)/);
  if (queryParamMatch) {
    const query = decodeURIComponent(queryParamMatch[1].replace(/\+/g, ' '));
    return { query, isLink: true };
  }

  // If it starts with http, it's a URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { query: input, isLink: true };
  }

  return { query: input, isLink: false };
}

export default function AdminLocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
  onAddressChange,
}: AdminLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const geocoding = useMapsLibrary('geocoding');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse-geocode coordinates to get readable address
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoding?.Geocoder) return;

      const geocoder = new geocoding.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const addr = results[0].formatted_address;
          setDetectedAddress(addr);
          // If address is currently empty, automatically populate it
          if (!address || address.trim() === '') {
            onAddressChange(addr);
          }
        }
      });
    },
    [geocoding, address, onAddressChange]
  );

  // Handle map click to drop / move pin
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const lat = Number(e.detail.latLng.lat.toFixed(6));
      const lng = Number(e.detail.latLng.lng.toFixed(6));
      onLocationChange(lat, lng);
      reverseGeocode(lat, lng);
      setStatusNotification({
        type: 'success',
        text: `Pinned at: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  // Perform search / geocoding query
  const searchPlaces = useCallback(
    (input: string) => {
      if (!input || input.trim().length < 2 || !geocoding?.Geocoder) {
        setSearchResults([]);
        return;
      }

      const parsed = parseGoogleMapsInput(input);

      // Direct coordinates or coordinate URL pasted
      if (parsed.lat !== undefined && parsed.lng !== undefined) {
        setSearchResults([]);
        setDropdownOpen(false);
        const lat = Number(parsed.lat.toFixed(6));
        const lng = Number(parsed.lng.toFixed(6));
        onLocationChange(lat, lng);
        reverseGeocode(lat, lng);
        setStatusNotification({
          type: 'success',
          text: `Imported coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
        setTimeout(() => setStatusNotification(null), 3500);
        return;
      }

      setSearching(true);
      const geocoder = new geocoding.Geocoder();
      const targetQuery = parsed.query || input.trim();
      const queryWithCity = targetQuery.toLowerCase().includes('noida')
        ? targetQuery
        : `${targetQuery}, Noida`;

      geocoder.geocode(
        {
          address: queryWithCity,
          componentRestrictions: { country: 'in' },
        },
        (results, status) => {
          setSearching(false);
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const mapped: MapSearchResult[] = results.slice(0, 5).map((r, idx) => {
              const parts = r.formatted_address.split(',');
              const main = parts[0] || r.formatted_address;
              const secondary = parts.slice(1).join(',').trim();
              return {
                id: r.place_id || `res-${idx}`,
                mainText: main,
                secondaryText: secondary,
                lat: Number(r.geometry.location.lat().toFixed(6)),
                lng: Number(r.geometry.location.lng().toFixed(6)),
                formattedAddress: r.formatted_address,
              };
            });
            setSearchResults(mapped);
            setDropdownOpen(true);
          } else {
            setSearchResults([]);
          }
        }
      );
    },
    [geocoding, onLocationChange, reverseGeocode]
  );

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setDropdownOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 250);
  };

  const handleSelectResult = (result: MapSearchResult) => {
    onLocationChange(result.lat, result.lng);
    onAddressChange(result.formattedAddress);
    setDetectedAddress(result.formattedAddress);
    setSearchQuery(result.mainText);
    setSearchResults([]);
    setDropdownOpen(false);
    setStatusNotification({
      type: 'success',
      text: `Pinned at "${result.mainText}" (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`,
    });
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectResult(searchResults[0]);
      } else if (searchQuery.trim()) {
        searchPlaces(searchQuery);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setDropdownOpen(false);
  };

  return (
    <div className="admin-location-picker">
      {/* ── Map Container ── */}
      <div className="admin-map-box">
        <div className="admin-map-header">
          <div className="admin-map-instructions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10" />
              <path d="m12 8 4 4-4 4M8 12h8" />
            </svg>
            <span>Click anywhere on the map or use the search bar to place pin</span>
          </div>

          <div className="admin-coord-pill">
            <span className="admin-coord-dot" />
            <span>
              {latitude ? latitude.toFixed(5) : '28.53550'}, {longitude ? longitude.toFixed(5) : '77.39100'}
            </span>
          </div>
        </div>

        <div className="admin-map-viewport">
          <Map
            defaultCenter={{ lat: latitude || 28.5355, lng: longitude || 77.391 }}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="noida-admin-picker"
            onClick={handleMapClick}
          >
            <MapCenterController lat={latitude} lng={longitude} />

            {/* Native Google Maps Control: Stays visible on fullscreen/expand */}
            <MapControl position={ControlPosition.TOP_LEFT}>
              <div className="admin-map-control-bar" ref={wrapperRef}>
                <div className="admin-map-search-input-wrap">
                  <svg
                    className="admin-map-search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    id="admin-map-search"
                    type="text"
                    className="admin-map-search-input"
                    placeholder="Search place, sector, or paste Google Maps link…"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setDropdownOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  {searching && <span className="admin-map-search-spinner" />}
                  {searchQuery && (
                    <button
                      type="button"
                      className="admin-map-search-clear"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {dropdownOpen && searchResults.length > 0 && (
                  <ul className="admin-map-search-dropdown">
                    {searchResults.map((item) => (
                      <li
                        key={item.id}
                        className="admin-map-search-option"
                        onClick={() => handleSelectResult(item)}
                      >
                        <svg
                          className="admin-map-search-pin-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <div className="admin-map-search-option-text">
                          <span className="admin-map-search-main">{item.mainText}</span>
                          {item.secondaryText && (
                            <span className="admin-map-search-sub">{item.secondaryText}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </MapControl>

            <AdvancedMarker
              position={{ lat: latitude || 28.5355, lng: longitude || 77.391 }}
              title="Listing Location Pin"
            >
              <div className="admin-pin-marker">
                <div className="admin-pin-pulse" />
                <div className="admin-pin-body">
                  <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
            </AdvancedMarker>
          </Map>
        </div>

        {/* Live Notification / Feedback Pill */}
        {statusNotification && (
          <div className={`admin-map-notification ${statusNotification.type}`}>
            {statusNotification.type === 'success' ? '✓ ' : '⚠ '}
            {statusNotification.text}
          </div>
        )}

        {/* Suggested address banner */}
        {detectedAddress && detectedAddress !== address && (
          <div className="admin-suggested-address">
            <span className="admin-suggested-label">Detected from pin:</span>
            <span className="admin-suggested-text">{detectedAddress}</span>
            <button
              type="button"
              className="admin-suggested-apply"
              onClick={() => onAddressChange(detectedAddress)}
            >
              Use as address
            </button>
          </div>
        )}
      </div>

      {/* ── Advanced Manual Coordinates Toggle ── */}
      <div className="admin-manual-toggle-wrap">
        <button
          type="button"
          className="admin-manual-toggle-btn"
          onClick={() => setShowManualCoords(!showManualCoords)}
        >
          {showManualCoords ? '− Hide manual coordinates' : '+ Fine-tune coordinates manually'}
        </button>

        {showManualCoords && (
          <div className="admin-grid-2 admin-manual-coords-row">
            <div className="admin-field">
              <label className="admin-label" htmlFor="latitude">
                Latitude <span className="required">*</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                className="admin-input"
                value={latitude || ''}
                onChange={(e) => onLocationChange(Number(e.target.value), longitude)}
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="longitude">
                Longitude <span className="required">*</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                className="admin-input"
                value={longitude || ''}
                onChange={(e) => onLocationChange(latitude, Number(e.target.value))}
                required
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
