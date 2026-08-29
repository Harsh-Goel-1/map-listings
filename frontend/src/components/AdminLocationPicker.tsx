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
import { searchNoidaLocations } from '@/lib/noidaLocations';

interface AdminLocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
  onProjectSuggest?: (projectName: string) => void;
}

interface MapSearchResult {
  id: string;
  mainText: string;
  secondaryText?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  prediction?: any;
}

function extractText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val.text === 'string') return val.text;
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
}

// Controller to smoothly pan and zoom the map when coordinates change
function MapCenterController({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (map && lat && lng) {
      map.panTo({ lat, lng });
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, lat, lng, zoom]);

  return null;
}

// Parse coordinates or place query from Google Maps URL or raw text
function parseGoogleMapsInput(rawInput: string): {
  lat?: number;
  lng?: number;
  query?: string;
  isShortLink?: boolean;
  isLink?: boolean;
} {
  const input = rawInput.trim();

  // Direct coordinates e.g. "28.5355, 77.3910" or "28.5355 77.3910"
  const directMatch = input.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*[, ]\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, isLink: false };
    }
  }

  // Shortened URL like maps.app.goo.gl or goo.gl/maps
  if (input.includes('maps.app.goo.gl') || input.includes('goo.gl/maps')) {
    return { query: input, isShortLink: true, isLink: true };
  }

  // Google Maps URL with /@lat,lng,zoom
  const atMatch = input.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), isLink: true };
  }

  // Protobuf coords in URL: !3d<lat>!4d<lng>
  const protoMatch = input.match(/!3d([-+]?\d{1,2}\.\d+)!4d([-+]?\d{1,3}\.\d+)/);
  if (protoMatch) {
    return { lat: parseFloat(protoMatch[1]), lng: parseFloat(protoMatch[2]), isLink: true };
  }

  // URL params with q=lat,lng or ll=lat,lng
  const paramCoordMatch = input.match(/[?&](?:q|ll|daddr|saddr)=([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
  if (paramCoordMatch) {
    return { lat: parseFloat(paramCoordMatch[1]), lng: parseFloat(paramCoordMatch[2]), isLink: true };
  }

  // Google Maps Place URL: /maps/place/Place+Name/...
  const placeMatch = input.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return { query, isLink: true };
  }

  // URL query param q=Place+Name
  const queryParamMatch = input.match(/[?&]q=([^&]+)/);
  if (queryParamMatch) {
    const query = decodeURIComponent(queryParamMatch[1].replace(/\+/g, ' '));
    return { query, isLink: true };
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { query: input, isShortLink: true, isLink: true };
  }

  return { query: input, isLink: false };
}

export default function AdminLocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
  onAddressChange,
  onProjectSuggest,
}: AdminLocationPickerProps) {
  // Dedicated Import States
  const [importInput, setImportInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // In-map search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapBoxRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<any>(null);

  const geocoding = useMapsLibrary('geocoding');
  const places = useMapsLibrary('places');

  // Track browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapBoxRef.current?.requestFullscreen) {
        mapBoxRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse-geocode coordinates to get clean readable address
  const reverseGeocode = useCallback(
    (lat: number, lng: number, fallbackName?: string) => {
      if (!geocoding?.Geocoder) return;

      const geocoder = new geocoding.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const addr = results[0].formatted_address;
          setDetectedAddress(addr);
          onAddressChange(addr);

          // Extract project/society name if available
          if (fallbackName) {
            onProjectSuggest?.(fallbackName);
          } else {
            const est = results.find(
              (r) =>
                r.types.includes('establishment') ||
                r.types.includes('point_of_interest') ||
                r.types.includes('premise')
            );
            if (est) {
              const name = est.address_components[0]?.long_name;
              if (name) onProjectSuggest?.(name);
            }
          }
        }
      });
    },
    [geocoding, onAddressChange, onProjectSuggest]
  );

  // Handle Dedicated Google Maps Direct Import
  const handleDirectImport = async (inputToImport?: string) => {
    const raw = (inputToImport !== undefined ? inputToImport : importInput).trim();
    if (!raw) {
      setImportFeedback({ type: 'error', text: 'Please enter a Google Maps URL, coordinates, or place name.' });
      return;
    }

    setImporting(true);
    setImportFeedback(null);

    const parsed = parseGoogleMapsInput(raw);

    // Case 1: Direct coordinates already extracted from text or URL
    if (parsed.lat !== undefined && parsed.lng !== undefined) {
      const lat = Number(parsed.lat.toFixed(6));
      const lng = Number(parsed.lng.toFixed(6));
      onLocationChange(lat, lng);
      setTargetZoom(16);
      reverseGeocode(lat, lng);
      setImporting(false);
      setImportFeedback({
        type: 'success',
        text: `✓ Imported coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Address synced!`,
      });
      return;
    }

    // Case 2: Shortened URL (e.g. maps.app.goo.gl) - Resolve on server side
    if (parsed.isShortLink && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      try {
        const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(raw)}`);
        const data = await res.json();

        if (data.success && data.lat !== null && data.lng !== null) {
          const lat = Number(data.lat.toFixed(6));
          const lng = Number(data.lng.toFixed(6));
          onLocationChange(lat, lng);
          setTargetZoom(16);

          if (data.address) {
            onAddressChange(data.address);
            setDetectedAddress(data.address);
          } else {
            reverseGeocode(lat, lng, data.name || undefined);
          }

          if (data.name) {
            onProjectSuggest?.(data.name);
          }

          setImporting(false);
          setImportFeedback({
            type: 'success',
            text: `✓ Imported "${data.name || 'Location'}" (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          });
          return;
        }
      } catch (err) {
        console.warn('Server resolve failed, falling back to geocoder:', err);
      }
    }

    // Case 3: Place query, landmark name, or address string - Geocode with Noida bias
    if (geocoding?.Geocoder) {
      const geocoder = new geocoding.Geocoder();
      const targetQuery = parsed.query || raw;
      const queryWithCity = targetQuery.toLowerCase().includes('noida')
        ? targetQuery
        : `${targetQuery}, Noida`;

      geocoder.geocode(
        {
          address: queryWithCity,
          componentRestrictions: { country: 'in' },
        },
        (results, status) => {
          setImporting(false);
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const r = results[0];
            const lat = Number(r.geometry.location.lat().toFixed(6));
            const lng = Number(r.geometry.location.lng().toFixed(6));
            const addr = r.formatted_address;

            onLocationChange(lat, lng);
            setTargetZoom(16);
            onAddressChange(addr);
            setDetectedAddress(addr);

            const name = r.address_components[0]?.long_name || targetQuery;
            onProjectSuggest?.(name);

            setImportFeedback({
              type: 'success',
              text: `✓ Located "${name}" (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            });
          } else {
            setImportFeedback({
              type: 'error',
              text: `Could not locate "${raw}". Try pasting a direct Google Maps link or coordinates.`,
            });
          }
        }
      );
    } else {
      setImporting(false);
      setImportFeedback({
        type: 'error',
        text: 'Google Maps service is still initializing. Please try again in a moment.',
      });
    }
  };

  // Handle map click to drop / move pin
  const handleMapClick = (e: any) => {
    const latLng = e.detail?.latLng || e.latLng;
    if (latLng) {
      const rawLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
      const rawLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
      if (rawLat !== undefined && rawLng !== undefined) {
        const lat = Number(rawLat.toFixed(6));
        const lng = Number(rawLng.toFixed(6));
        onLocationChange(lat, lng);
        reverseGeocode(lat, lng);
        setStatusNotification({
          type: 'success',
          text: `Pinned at: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
        setTimeout(() => setStatusNotification(null), 3000);
      }
    }
  };

  // In-map search query with Places API (New), instant local Noida database, and Geocoding fallback
  const searchPlaces = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed.length < 1) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      // 1. Instant local Noida database matches
      const localMatches = searchNoidaLocations(trimmed, 5);
      const localResults: MapSearchResult[] = localMatches.map((loc) => ({
        id: loc.id,
        mainText: loc.name,
        secondaryText: loc.secondary,
        lat: loc.lat,
        lng: loc.lng,
        formattedAddress: `${loc.name}, ${loc.secondary}`,
      }));

      // Immediately show local matches if available
      if (localResults.length > 0) {
        setSearchResults(localResults);
        setDropdownOpen(true);
      }

      // 2. Query Places API (New) AutocompleteSuggestion
      if (places && (places as any).AutocompleteSuggestion) {
        try {
          if (!sessionTokenRef.current && (places as any).AutocompleteSessionToken) {
            sessionTokenRef.current = new (places as any).AutocompleteSessionToken();
          }

          const request: any = {
            input: trimmed,
            includedRegionCodes: ['in'],
          };
          if (sessionTokenRef.current) {
            request.sessionToken = sessionTokenRef.current;
          }

          const response = await (places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          const rawSuggestions = response?.suggestions || [];

          if (rawSuggestions.length > 0) {
            const apiResults: MapSearchResult[] = rawSuggestions.slice(0, 5).map((s: any, idx: number) => {
              const pred = s.placePrediction;
              const main = extractText(pred?.mainText) || extractText(pred?.text) || trimmed;
              const secondary = extractText(pred?.secondaryText);
              return {
                id: pred?.placeId || `pred-${idx}`,
                mainText: main,
                secondaryText: secondary,
                prediction: pred,
              };
            });

            // Combine API results with local results
            const combined = [...apiResults];
            for (const locItem of localResults) {
              if (!combined.some((c) => c.mainText.toLowerCase().includes(locItem.mainText.toLowerCase().slice(0, 8)))) {
                combined.push(locItem);
              }
            }
            setSearchResults(combined.slice(0, 6));
            setSearching(false);
            setDropdownOpen(true);
            return;
          }
        } catch (err) {
          console.warn('Places API autocomplete error:', err);
        }
      }

      // If local matches exist, keep showing them
      if (localResults.length > 0) {
        setSearchResults(localResults);
        setSearching(false);
        setDropdownOpen(true);
        return;
      }

      // 3. Geocoder fallback
      if (geocoding?.Geocoder) {
        const geocoder = new geocoding.Geocoder();
        const queryWithCity = trimmed.toLowerCase().includes('noida') ? trimmed : `${trimmed}, Noida`;

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
      } else {
        setSearching(false);
        setSearchResults([]);
      }
    },
    [places, geocoding]
  );

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setDropdownOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 200);
  };

  const handleSelectResult = async (result: MapSearchResult) => {
    setDropdownOpen(false);
    setSearchQuery(result.mainText);

    try {
      let lat = result.lat;
      let lng = result.lng;
      let addr = result.formattedAddress;

      // If this is a Places API prediction, resolve location and details
      if (result.prediction && (lat === undefined || lng === undefined)) {
        sessionTokenRef.current = null;
        const place = result.prediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });

        const loc = place.location;
        if (loc) {
          lat = Number((typeof loc.lat === 'function' ? loc.lat() : loc.lat).toFixed(6));
          lng = Number((typeof loc.lng === 'function' ? loc.lng() : loc.lng).toFixed(6));
        }
        if (place.formattedAddress) {
          addr = place.formattedAddress;
        }
      }

      if (lat !== undefined && lng !== undefined) {
        onLocationChange(lat, lng);
        setTargetZoom(16);

        if (addr) {
          onAddressChange(addr);
          setDetectedAddress(addr);
        } else {
          reverseGeocode(lat, lng, result.mainText);
        }

        onProjectSuggest?.(result.mainText);

        setStatusNotification({
          type: 'success',
          text: `Pinned at "${result.mainText}" (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
        setTimeout(() => setStatusNotification(null), 3500);
      }
    } catch (err) {
      console.error('Error selecting search result:', err);
    }
  };

  return (
    <div className="admin-location-picker">
      {/* ── 1. Dedicated Google Maps Direct Import Card ── */}
      <div className="admin-import-card">
        <div className="admin-import-card-header">
          <div className="admin-import-card-title-row">
            <span className="admin-import-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Google Maps Sync
            </span>
            <h3 className="admin-import-card-title">Import Location from Google Maps directly</h3>
          </div>
          <p className="admin-import-card-sub">
            Paste any Google Maps link, coordinates, or locality to auto-pin and sync address
          </p>
        </div>

        <div className="admin-import-input-row">
          <div className="admin-import-input-wrap">
            <svg
              className="admin-import-icon-left"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input
              id="admin-maps-import-input"
              type="text"
              className="admin-import-input"
              placeholder="Paste Google Maps URL (https://maps.app.goo.gl/…), coords (28.5355, 77.3910), or landmark"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleDirectImport();
                }
              }}
            />
          </div>

          <button
            type="button"
            className="admin-import-btn"
            onClick={() => handleDirectImport()}
            disabled={importing}
            id="admin-maps-import-btn"
          >
            {importing ? (
              <>
                <span className="admin-map-search-spinner" />
                <span>Importing…</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Import Location</span>
              </>
            )}
          </button>
        </div>

        {/* Preset chips for fast testing */}
        <div className="admin-import-chips-row">
          <span>Quick test:</span>
          <button
            type="button"
            className="admin-import-chip"
            onClick={() => {
              setImportInput('Sector 62, Noida');
              handleDirectImport('Sector 62, Noida');
            }}
          >
            📍 Sector 62
          </button>
          <button
            type="button"
            className="admin-import-chip"
            onClick={() => {
              setImportInput('Sector 18, Noida');
              handleDirectImport('Sector 18, Noida');
            }}
          >
            📍 Sector 18
          </button>
          <button
            type="button"
            className="admin-import-chip"
            onClick={() => {
              setImportInput('Sector 150, Noida');
              handleDirectImport('Sector 150, Noida');
            }}
          >
            📍 Sector 150
          </button>
          <button
            type="button"
            className="admin-import-chip"
            onClick={() => {
              setImportInput('Jaypee Greens, Sector 128, Noida');
              handleDirectImport('Jaypee Greens, Sector 128, Noida');
            }}
          >
            📍 Jaypee Greens
          </button>
        </div>

        {/* Feedback Alert */}
        {importFeedback && (
          <div className={`admin-import-feedback ${importFeedback.type}`}>
            {importFeedback.type === 'success' ? '✓ ' : '⚠ '}
            {importFeedback.text}
          </div>
        )}
      </div>

      {/* ── 2. Interactive Map Container with Search Bar (Visible in Normal & Fullscreen) ── */}
      <div className="admin-map-box" ref={mapBoxRef}>
        <div className="admin-map-header">
          <div className="admin-map-instructions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10" />
              <path d="m12 8 4 4-4 4M8 12h8" />
            </svg>
            <span>Click anywhere on the map to pin, or search any place directly on the map</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="admin-coord-pill">
              <span className="admin-coord-dot" />
              <span>
                {latitude ? latitude.toFixed(5) : '28.53550'}, {longitude ? longitude.toFixed(5) : '77.39100'}
              </span>
            </div>

            <button
              type="button"
              className="admin-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            >
              {isFullscreen ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="admin-map-viewport">
          <Map
            defaultCenter={{ lat: latitude || 28.5355, lng: longitude || 77.391 }}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="noida-admin-picker"
            onClick={handleMapClick}
          >
            <MapCenterController lat={latitude} lng={longitude} zoom={targetZoom} />

            {/* Native MapControl: Renders inside Google Maps DOM, guaranteed to stay visible in Fullscreen */}
            <MapControl position={ControlPosition.TOP_LEFT}>
              <div
                className="admin-map-control-bar"
                ref={searchWrapperRef}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
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
                    ref={searchInputRef}
                    id="admin-map-search"
                    type="text"
                    className="admin-map-search-input"
                    placeholder="Search sector, society, landmark on map…"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchResults.length > 0) {
                          handleSelectResult(searchResults[0]);
                        } else if (searchQuery.trim()) {
                          searchPlaces(searchQuery);
                        }
                      } else if (e.key === 'Escape') {
                        setDropdownOpen(false);
                      }
                    }}
                    autoComplete="off"
                  />
                  {searching && <span className="admin-map-search-spinner" />}
                  {searchQuery && (
                    <button
                      type="button"
                      className="admin-map-search-clear"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setDropdownOpen(false);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions List */}
                {dropdownOpen && searchResults.length > 0 && (
                  <ul
                    className="admin-map-search-dropdown"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {searchResults.map((item) => (
                      <li
                        key={item.id}
                        className="admin-map-search-option"
                        onMouseDown={(e) => {
                          // Prevent blur from closing before selection completes
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectResult(item);
                        }}
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
                <div className="admin-pin-body">
                  <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="admin-pin-pulse" />
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

      {/* ── 3. Manual Coordinates Toggle ── */}
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
