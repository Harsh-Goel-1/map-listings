/**
 * Pure utility functions for formatting prices, BHKs, and property types
 * Safe to call from both Server Components (generateMetadata) and Client Components.
 */

export function formatDetailPrice(
  price: number,
  listingType?: string
): { formatted: string; unit: string; ratePerSqFt?: string } {
  const isRent = listingType === 'RENT';
  let formatted = '';
  let unit = isRent ? '/month' : '';

  if (isRent) {
    if (price >= 100000) {
      const val = price / 100000;
      formatted = `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')} L`;
    } else if (price >= 1000) {
      const val = price / 1000;
      formatted = `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.?0+$/, '')}K`;
    } else {
      formatted = `₹${price.toLocaleString('en-IN')}`;
    }
  } else {
    if (price >= 10000000) {
      const val = price / 10000000;
      formatted = `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')} Cr`;
    } else if (price >= 100000) {
      const val = price / 100000;
      formatted = `₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '')} L`;
    } else {
      formatted = `₹${price.toLocaleString('en-IN')}`;
    }
  }

  return { formatted, unit };
}

export function formatPropertyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    APARTMENT: 'Apartment',
    VILLA: 'Villa',
    PLOT: 'Residential Plot',
    INDEPENDENT_HOUSE: 'Independent House / Floor',
    OFFICE_SPACE: 'Commercial Office Space',
    RETAIL_SHOP: 'Retail Shop',
    SHOWROOM: 'Commercial Showroom',
    WAREHOUSE: 'Warehouse / Godown',
    COMMERCIAL_PLOT: 'Commercial Plot',
  };
  return map[type] || type;
}
