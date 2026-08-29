'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { searchNoidaLocations } from '@/lib/noidaLocations';

export interface SearchedArea {
  label: string;
  lat: number;
  lng: number;
  radius: number; // metres
}

interface LocationSearchProps {
  onAreaSelected: (area: SearchedArea | null) => void;
  activeArea: SearchedArea | null;
}

interface SuggestionItem {
  id: string;
  mainText: string;
  secondaryText?: string;
  select: () => Promise<SearchedArea | null>;
}

function extractText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val.text === 'string') return val.text;
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
}

function calculateRadius(viewport: any): number {
  if (!viewport) return 800;
  try {
    const ne = typeof viewport.getNorthEast === 'function' ? viewport.getNorthEast() : viewport.northEast;
    const sw = typeof viewport.getSouthWest === 'function' ? viewport.getSouthWest() : viewport.southWest;
    if (ne && sw) {
      const neLat = typeof ne.lat === 'function' ? ne.lat() : ne.lat;
      const neLng = typeof ne.lng === 'function' ? ne.lng() : ne.lng;
      const swLat = typeof sw.lat === 'function' ? sw.lat() : sw.lat;
      const swLng = typeof sw.lng === 'function' ? sw.lng() : sw.lng;
      const R = 6371000;
      const dLat = ((neLat - swLat) * Math.PI) / 180;
      const dLng = ((neLng - swLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((swLat * Math.PI) / 180) *
          Math.cos((neLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const d = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.min(Math.max(d / 2, 350), 3000);
    }
  } catch (e) {
    console.error('Error calculating radius from viewport:', e);
  }
  return 800;
}

export default function LocationSearch({ onAreaSelected, activeArea }: LocationSearchProps) {
  const [query, setQuery] = useState(activeArea?.label || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<any>(null);

  const places = useMapsLibrary('places');
  const geocoding = useMapsLibrary('geocoding');

  // Sync query when activeArea changes externally
  useEffect(() => {
    if (activeArea) {
      setQuery(activeArea.label);
    } else if (activeArea === null && !open) {
      setQuery('');
    }
  }, [activeArea, open]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions using Places API (New), instant Noida database, and Geocoding fallback
  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!input || input.trim().length < 1) {
        setSuggestions([]);
        return;
      }

      const trimmed = input.trim();

      // 1. Instant match from curated Noida sectors & societies database (0ms latency, 100% reliable)
      const localMatches = searchNoidaLocations(trimmed, 5);
      const localItems: SuggestionItem[] = localMatches.map((loc) => ({
        id: loc.id,
        mainText: loc.name,
        secondaryText: loc.secondary,
        select: async () => ({
          label: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          radius: loc.radius,
        }),
      }));

      // Immediately show local matches so user never experiences lag
      if (localItems.length > 0) {
        setSuggestions(localItems);
        setOpen(true);
      }

      // 2. Query modern Places API (New) AutocompleteSuggestion
      if (places && (places as any).AutocompleteSuggestion) {
        try {
          if (!sessionTokenRef.current && (places as any).AutocompleteSessionToken) {
            sessionTokenRef.current = new (places as any).AutocompleteSessionToken();
          }

          const request: any = {
            input: trimmed,
            includedRegionCodes: ['in'],
            locationBias: {
              center: { lat: 28.5355, lng: 77.391 },
              radius: 25000,
            },
          };
          if (sessionTokenRef.current) {
            request.sessionToken = sessionTokenRef.current;
          }

          const response = await (places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          const rawSuggestions = response?.suggestions || [];

          if (rawSuggestions.length > 0) {
            const apiItems: SuggestionItem[] = rawSuggestions.slice(0, 6).map((s: any, idx: number) => {
              const pred = s.placePrediction;
              const main = extractText(pred?.mainText) || extractText(pred?.text) || trimmed;
              const secondary = extractText(pred?.secondaryText);
              return {
                id: pred?.placeId || `pred-${idx}`,
                mainText: main,
                secondaryText: secondary,
                select: async () => {
                  sessionTokenRef.current = null;
                  const place = pred.toPlace();
                  await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
                  });
                  const loc = place.location;
                  if (!loc) return null;
                  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
                  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
                  return {
                    label: main,
                    lat,
                    lng,
                    radius: calculateRadius(place.viewport),
                  };
                },
              };
            });

            // Combine API items with local matches, avoiding duplicates
            const combined = [...apiItems];
            for (const locItem of localItems) {
              if (!combined.some((c) => c.mainText.toLowerCase().includes(locItem.mainText.toLowerCase().slice(0, 8)))) {
                combined.push(locItem);
              }
            }
            setSuggestions(combined.slice(0, 7));
            setOpen(true);
            return;
          }
        } catch (err) {
          console.warn('Places API autocomplete error in consumer search:', err);
        }
      }

      // If local matches exist, show them immediately
      if (localItems.length > 0) {
        setSuggestions(localItems);
        return;
      }

      // 3. Seamless Geocoder fallback
      if (geocoding?.Geocoder) {
        try {
          const geocoder = new geocoding.Geocoder();
          const addressQuery = trimmed.toLowerCase().includes('noida') ? trimmed : `${trimmed}, Noida`;
          geocoder.geocode(
            {
              address: addressQuery,
              componentRestrictions: { country: 'in' },
            },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                const items: SuggestionItem[] = results.slice(0, 5).map((r, idx) => {
                  const parts = r.formatted_address.split(',');
                  const main = parts[0] || r.formatted_address;
                  const secondary = parts.slice(1).join(',').trim();
                  return {
                    id: r.place_id || `geo-${idx}`,
                    mainText: main,
                    secondaryText: secondary,
                    select: async () => {
                      return {
                        label: main,
                        lat: r.geometry.location.lat(),
                        lng: r.geometry.location.lng(),
                        radius: calculateRadius(r.geometry.viewport),
                      };
                    },
                  };
                });
                setSuggestions(items);
              } else {
                setSuggestions([]);
              }
            }
          );
        } catch (err) {
          console.error('Geocoder fallback error:', err);
          setSuggestions([]);
        }
      }
    },
    [places, geocoding]
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 180);
  };

  const handleSelect = async (item: SuggestionItem) => {
    try {
      setLoading(true);
      const area = await item.select();
      if (area) {
        setQuery(area.label);
        setSuggestions([]);
        setOpen(false);
        onAreaSelected(area);
      }
    } catch (err) {
      console.error('Error selecting suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  // Direct search fallback when pressing Enter
  const handleDirectSearch = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // 1. Instant check in local Noida database
      const localMatches = searchNoidaLocations(trimmed, 1);
      if (localMatches.length > 0) {
        const match = localMatches[0];
        const area: SearchedArea = {
          label: match.name,
          lat: match.lat,
          lng: match.lng,
          radius: match.radius,
        };
        setQuery(area.label);
        setSuggestions([]);
        setOpen(false);
        onAreaSelected(area);
        return;
      }

      // 2. Geocoder fallback
      if (!geocoding?.Geocoder) return;
      setLoading(true);
      const geocoder = new geocoding.Geocoder();
      const addressQuery = trimmed.toLowerCase().includes('noida') ? trimmed : `${trimmed}, Noida`;
      geocoder.geocode(
        {
          address: addressQuery,
          componentRestrictions: { country: 'in' },
        },
        (results, status) => {
          setLoading(false);
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const r = results[0];
            const main = r.formatted_address.split(',')[0] || trimmed;
            const area: SearchedArea = {
              label: main,
              lat: r.geometry.location.lat(),
              lng: r.geometry.location.lng(),
              radius: calculateRadius(r.geometry.viewport),
            };
            setQuery(area.label);
            setSuggestions([]);
            setOpen(false);
            onAreaSelected(area);
          }
        }
      );
    },
    [geocoding, onAreaSelected]
  );

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    sessionTokenRef.current = null;
    onAreaSelected(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (query.trim()) {
        handleDirectSearch(query);
      }
    }
  };

  return (
    <div className="location-search" ref={wrapperRef}>
      <div className={`location-search-input-wrap ${activeArea ? 'has-value' : ''}`}>
        <svg
          className="location-search-icon"
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
          ref={inputRef}
          id="location-search"
          type="text"
          className="location-search-input"
          placeholder="Search locality…"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {(activeArea || query.length > 0) && (
          <button
            type="button"
            className="location-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {loading && <span className="location-search-loading" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="location-search-dropdown">
          {suggestions.map((item) => (
            <li
              key={item.id}
              className="location-search-option"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              <svg
                className="location-search-option-icon"
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
              <div className="location-search-option-text">
                <span className="location-search-option-main">{item.mainText}</span>
                {item.secondaryText && (
                  <span className="location-search-option-secondary">{item.secondaryText}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
