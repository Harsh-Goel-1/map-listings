export type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL';

export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'PLOT'
  | 'INDEPENDENT_HOUSE'
  | 'OFFICE_SPACE'
  | 'RETAIL_SHOP'
  | 'COMMERCIAL_PLOT'
  | 'WAREHOUSE'
  | 'SHOWROOM';

export type ListingType = 'BUY' | 'RENT';

export interface Listing {
  id: number;
  title: string;
  price: number;
  bhk: number;
  areaSqFt: number;
  propertyCategory?: PropertyCategory;
  propertyType: PropertyType;
  listingType: ListingType;
  projectName: string | null;
  societyName: string | null;
  address: string;
  contactNumber?: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
}

export interface ListingFilter {
  listingType?: ListingType;
  propertyCategory?: PropertyCategory;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bhk?: number[];
}
