'use client';

import { ListingFilter, ListingType, PropertyCategory, PropertyType } from '@/types/listing';
import LocationSearch, { SearchedArea } from './LocationSearch';

interface FilterBarProps {
  filters: ListingFilter;
  onFilterChange: (filters: ListingFilter) => void;
  searchedArea: SearchedArea | null;
  onAreaSelected: (area: SearchedArea | null) => void;
}

const RESIDENTIAL_SUBTYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'INDEPENDENT_HOUSE', label: 'House / Floor' },
  { value: 'PLOT', label: 'Residential Plot' },
];

const COMMERCIAL_SUBTYPES: { value: PropertyType; label: string }[] = [
  { value: 'OFFICE_SPACE', label: 'Office Space' },
  { value: 'RETAIL_SHOP', label: 'Retail Shop' },
  { value: 'SHOWROOM', label: 'Showroom' },
  { value: 'WAREHOUSE', label: 'Warehouse / Godown' },
  { value: 'COMMERCIAL_PLOT', label: 'Commercial Plot' },
];

const ALL_SUBTYPES: { value: PropertyType; label: string }[] = [
  ...RESIDENTIAL_SUBTYPES,
  ...COMMERCIAL_SUBTYPES,
];

const BHK_OPTIONS = [1, 2, 3, 4];

const PRICE_RANGES_BUY = [
  { label: 'No Min', value: undefined },
  { label: '₹20L', value: 2000000 },
  { label: '₹40L', value: 4000000 },
  { label: '₹60L', value: 6000000 },
  { label: '₹80L', value: 8000000 },
  { label: '₹1Cr', value: 10000000 },
  { label: '₹2Cr', value: 20000000 },
  { label: '₹5Cr', value: 50000000 },
];

const PRICE_RANGES_BUY_MAX = [
  { label: 'No Max', value: undefined },
  { label: '₹40L', value: 4000000 },
  { label: '₹60L', value: 6000000 },
  { label: '₹80L', value: 8000000 },
  { label: '₹1Cr', value: 10000000 },
  { label: '₹2Cr', value: 20000000 },
  { label: '₹5Cr', value: 50000000 },
  { label: '₹10Cr', value: 100000000 },
];

const PRICE_RANGES_RENT = [
  { label: 'No Min', value: undefined },
  { label: '₹5K', value: 5000 },
  { label: '₹10K', value: 10000 },
  { label: '₹15K', value: 15000 },
  { label: '₹20K', value: 20000 },
  { label: '₹30K', value: 30000 },
  { label: '₹50K', value: 50000 },
  { label: '₹1L', value: 100000 },
];

const PRICE_RANGES_RENT_MAX = [
  { label: 'No Max', value: undefined },
  { label: '₹10K', value: 10000 },
  { label: '₹15K', value: 15000 },
  { label: '₹20K', value: 20000 },
  { label: '₹30K', value: 30000 },
  { label: '₹50K', value: 50000 },
  { label: '₹1L', value: 100000 },
  { label: '₹2L', value: 200000 },
];

export default function FilterBar({ filters, onFilterChange, searchedArea, onAreaSelected }: FilterBarProps) {
  const isRent = filters.listingType === 'RENT';
  const minPriceOptions = isRent ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;
  const maxPriceOptions = isRent ? PRICE_RANGES_RENT_MAX : PRICE_RANGES_BUY_MAX;

  // Choose sub-type options based on active category
  const activeSubtypes =
    filters.propertyCategory === 'COMMERCIAL'
      ? COMMERCIAL_SUBTYPES
      : filters.propertyCategory === 'RESIDENTIAL'
      ? RESIDENTIAL_SUBTYPES
      : ALL_SUBTYPES;

  const handleListingTypeChange = (type: ListingType) => {
    onFilterChange({
      ...filters,
      listingType: type,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const handleCategoryChange = (category: PropertyCategory) => {
    // If clicking the active category, allow toggling back to all or switch
    const newCategory = filters.propertyCategory === category ? undefined : category;

    // Check if the current sub-type still belongs to the new category
    let newPropertyType = filters.propertyType;
    if (newCategory === 'COMMERCIAL') {
      const isStillValid = COMMERCIAL_SUBTYPES.some((st) => st.value === newPropertyType);
      if (!isStillValid) newPropertyType = undefined;
    } else if (newCategory === 'RESIDENTIAL') {
      const isStillValid = RESIDENTIAL_SUBTYPES.some((st) => st.value === newPropertyType);
      if (!isStillValid) newPropertyType = undefined;
    }

    onFilterChange({
      ...filters,
      propertyCategory: newCategory,
      propertyType: newPropertyType,
    });
  };

  const handleSubtypeChange = (subtypeVal: string) => {
    onFilterChange({
      ...filters,
      propertyType: subtypeVal ? (subtypeVal as PropertyType) : undefined,
    });
  };

  const handleBhkToggle = (bhk: number) => {
    const current = filters.bhk || [];
    const updated = current.includes(bhk)
      ? current.filter((b) => b !== bhk)
      : [...current, bhk];
    onFilterChange({ ...filters, bhk: updated.length > 0 ? updated : undefined });
  };

  const isCommercial = filters.propertyCategory === 'COMMERCIAL';

  return (
    <div className="filter-bar" id="filter-bar">
      {/* 0. Location Search */}
      <LocationSearch activeArea={searchedArea} onAreaSelected={onAreaSelected} />

      <div className="filter-divider" />

      {/* 1. Buy / Rent Toggle */}
      <div className="filter-group">
        <span className="filter-label">Intent</span>
        <div className="toggle-group">
          <button
            id="filter-buy"
            className={`toggle-btn ${filters.listingType === 'BUY' ? 'active' : ''}`}
            onClick={() => handleListingTypeChange('BUY')}
          >
            Buy
          </button>
          <button
            id="filter-rent"
            className={`toggle-btn ${filters.listingType === 'RENT' ? 'active' : ''}`}
            onClick={() => handleListingTypeChange('RENT')}
          >
            Rent
          </button>
        </div>
      </div>

      <div className="filter-divider" />

      {/* 2. Category (Residential / Commercial) - Shifted right after Buy/Rent */}
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <div className="toggle-group">
          <button
            id="category-residential"
            className={`toggle-btn ${filters.propertyCategory === 'RESIDENTIAL' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('RESIDENTIAL')}
          >
            Residential
          </button>
          <button
            id="category-commercial"
            className={`toggle-btn ${filters.propertyCategory === 'COMMERCIAL' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('COMMERCIAL')}
          >
            Commercial
          </button>
        </div>
      </div>

      {/* 3. Sub-type Dropdown */}
      <div className="filter-group">
        <span className="filter-label">Type</span>
        <select
          id="filter-property-subtype"
          className="filter-select"
          value={filters.propertyType || ''}
          onChange={(e) => handleSubtypeChange(e.target.value)}
        >
          <option value="">
            {filters.propertyCategory === 'COMMERCIAL'
              ? 'All Commercial Types'
              : filters.propertyCategory === 'RESIDENTIAL'
              ? 'All Residential Types'
              : 'All Property Types'}
          </option>
          {activeSubtypes.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-divider" />

      {/* 4. Price Range */}
      <div className="filter-group">
        <span className="filter-label">Price</span>
        <select
          id="filter-min-price"
          className="filter-select"
          value={filters.minPrice?.toString() || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              minPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          {minPriceOptions.map((opt) => (
            <option key={opt.label} value={opt.value?.toString() || ''}>
              {opt.label}
            </option>
          ))}
        </select>
        <span style={{ color: 'var(--color-mute)', fontSize: '12px' }}>to</span>
        <select
          id="filter-max-price"
          className="filter-select"
          value={filters.maxPrice?.toString() || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              maxPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          {maxPriceOptions.map((opt) => (
            <option key={opt.label} value={opt.value?.toString() || ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 5. BHK (Shown for Residential or All) */}
      {!isCommercial && (
        <>
          <div className="filter-divider" />
          <div className="filter-group">
            <span className="filter-label">BHK</span>
            <div className="chip-group">
              {BHK_OPTIONS.map((bhk) => (
                <button
                  key={bhk}
                  id={`filter-bhk-${bhk}`}
                  className={`chip ${(filters.bhk || []).includes(bhk) ? 'active' : ''}`}
                  onClick={() => handleBhkToggle(bhk)}
                >
                  {bhk === 4 ? '4+' : bhk}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
