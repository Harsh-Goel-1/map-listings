import { Listing, ListingFilter } from '@/types/listing';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchListings(filters: ListingFilter): Promise<Listing[]> {
  const params = new URLSearchParams();

  if (filters.listingType) {
    params.append('listingType', filters.listingType);
  }
  if (filters.minPrice !== undefined) {
    params.append('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined) {
    params.append('maxPrice', filters.maxPrice.toString());
  }
  if (filters.bhk && filters.bhk.length > 0) {
    filters.bhk.forEach((b) => params.append('bhk', b.toString()));
  }
  if (filters.propertyCategory) {
    params.append('propertyCategory', filters.propertyCategory);
  }
  if (filters.propertyType) {
    params.append('propertyType', filters.propertyType);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/api/listings${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchListingById(id: number): Promise<Listing> {
  const response = await fetch(`${API_BASE}/api/listings/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch listing: ${response.statusText}`);
  }
  return response.json();
}

export interface CreateListingPayload {
  title: string;
  price: number;
  bhk: number;
  areaSqFt: number;
  propertyCategory: string;
  propertyType: string;
  listingType: string;
  projectName?: string;
  societyName?: string;
  address: string;
  contactNumber?: string;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
}

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
  const response = await fetch(`${API_BASE}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(errBody || `Failed to create listing: ${response.statusText}`);
  }
  return response.json();
}

export async function createListingsBulk(payloads: CreateListingPayload[]): Promise<Listing[]> {
  try {
    const response = await fetch(`${API_BASE}/api/listings/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloads),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // If bulk endpoint fails (e.g. network issue or older server), fallback to sequential
  }

  // Graceful fallback for backwards compatibility
  const results: Listing[] = [];
  for (const payload of payloads) {
    const created = await createListing(payload);
    results.push(created);
  }
  return results;
}

export async function updateListing(id: number, payload: CreateListingPayload): Promise<Listing> {
  const response = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(errBody || `Failed to update listing: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteListing(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(errBody || `Failed to delete listing: ${response.statusText}`);
  }
}

