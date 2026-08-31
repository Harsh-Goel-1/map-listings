import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchListingById } from '@/lib/api';
import { formatDetailPrice } from '@/lib/formatters';
import ListingDetailView from '@/components/ListingDetailView';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    return { title: 'Property Not Found | NoidaHomes' };
  }

  try {
    const listing = await fetchListingById(numId);
    if (!listing) return { title: 'Property Not Found | NoidaHomes' };

    const { formatted: priceStr, unit: priceUnit } = formatDetailPrice(listing.price, listing.listingType);
    const bhkPrefix = listing.bhk > 0 ? `${listing.bhk} BHK ` : '';
    const locality = listing.societyName || listing.projectName || listing.address || 'Noida';

    const title = `${bhkPrefix}${listing.title} in ${locality} | ${priceStr}${priceUnit ? ' ' + priceUnit : ''} | NoidaHomes`;
    const description = `Explore this ${bhkPrefix}${listing.areaSqFt} sq.ft property for ${
      listing.listingType === 'RENT' ? 'rent' : 'sale'
    } at ${listing.address}, Noida. Direct owner/agent contact, exact map location, and verified photos.`;

    const primaryImage =
      listing.imageUrls && listing.imageUrls.length > 0
        ? listing.imageUrls[0]
        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80';

    const canonicalUrl = `https://noidahomes.vercel.app/listings/${listing.id}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'NoidaHomes',
        type: 'website',
        locale: 'en_IN',
        images: [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: listing.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [primaryImage],
      },
    };
  } catch (err) {
    console.error('generateMetadata error:', err);
    return {
      title: 'Property Listings in Noida | NoidaHomes',
      description: 'Explore verified residential and commercial properties in Noida with an interactive map.',
    };
  }
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    notFound();
  }

  let listing;
  try {
    listing = await fetchListingById(numId);
  } catch (err) {
    console.error(`Error loading listing ${numId}:`, err);
    notFound();
  }

  if (!listing) {
    notFound();
  }

  // Schema.org RealEstateListing Structured Data for Search Engine Bots
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description || `${listing.title} located at ${listing.address}`,
    url: `https://noidahomes.vercel.app/listings/${listing.id}`,
    image: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : [],
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'INR',
      businessFunction:
        listing.listingType === 'RENT'
          ? 'http://purl.org/goodrelations/v1#LeaseOut'
          : 'http://purl.org/goodrelations/v1#Sell',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: listing.price,
        priceCurrency: 'INR',
        unitCode: listing.listingType === 'RENT' ? 'MON' : 'C62',
      },
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: 'Noida',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailView listing={listing} />
    </>
  );
}
