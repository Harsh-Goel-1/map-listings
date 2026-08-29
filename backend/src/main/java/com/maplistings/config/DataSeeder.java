package com.maplistings.config;

import com.maplistings.model.Listing;
import com.maplistings.model.Listing.ListingType;
import com.maplistings.model.Listing.PropertyCategory;
import com.maplistings.model.Listing.PropertyType;
import com.maplistings.model.ListingImage;
import com.maplistings.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ListingRepository listingRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public void run(String... args) {
        if (listingRepository.count() > 0) {
            List<Listing> existing = listingRepository.findAll();
            boolean hasWarehouse = existing.stream().anyMatch(l -> l.getPropertyType() == PropertyType.WAREHOUSE);
            if (hasWarehouse) {
                log.info("Database already seeded with {} listings and warehouse/showroom present, skipping.", existing.size());
                return;
            }
            log.info("Updating existing listings to include Warehouse and Showroom...");
            listingRepository.deleteAll();
        }

        log.info("Seeding database with sample Noida listings (Residential & Commercial)...");

        List<Listing> listings = List.of(
            // ── RESIDENTIAL: APARTMENT ──
            createListing("Luxury 3BHK in ATS Greens", new BigDecimal("8500000"), 3, 1650,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "ATS Green Paradise", "ATS Greens",
                "Sector 150, Noida", "+91 98110 23456",
                "Spacious 3BHK apartment with modern amenities, swimming pool, and club house access.",
                28.5690, 77.4538,
                List.of("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop")),

            createListing("Modern 2BHK in Supertech Capetown", new BigDecimal("4500000"), 2, 1100,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "Supertech Capetown", "Supertech",
                "Sector 74, Noida", "+91 99100 87654",
                "Well-maintained 2BHK with park-facing balcony. Close to metro station.",
                28.5725, 77.3690,
                List.of("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop")),

            createListing("Spacious 3BHK in Gaur City", new BigDecimal("6200000"), 3, 1450,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "Gaur City 2", "Gaur City",
                "Greater Noida West", "+91 97118 45678",
                "Semi-furnished 3BHK in Gaur City with gym, pool, and kids play area.",
                28.5930, 77.4310,
                List.of("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop")),

            createListing("Cozy 2BHK for Rent in Sector 62", new BigDecimal("18000"), 2, 950,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.RENT, "Stellar Jeevan", "Stellar Group",
                "Sector 62, Noida", "+91 98188 56789",
                "Fully furnished 2BHK ideal for IT professionals. Walking distance to Sector 62 metro.",
                28.6273, 77.3650,
                List.of("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop")),

            createListing("Furnished 1BHK Studio for Rent", new BigDecimal("12000"), 1, 550,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.RENT, "Amrapali Zodiac", "Amrapali",
                "Sector 120, Noida", "+91 98104 89012",
                "Compact 1BHK studio apartment, fully furnished with AC and modular kitchen.",
                28.5810, 77.3940,
                List.of("https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop")),

            createListing("Elegant 4BHK in Prateek Edifice", new BigDecimal("17500000"), 4, 2800,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "Prateek Edifice", "Prateek Group",
                "Sector 107, Noida", "+91 99990 12345",
                "Premium 4BHK penthouse with panoramic city views and imported marble flooring.",
                28.5278, 77.3745,
                List.of("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop")),

            createListing("Budget 2BHK near Noida City Centre", new BigDecimal("3800000"), 2, 900,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "Assotech Windsor Court", "Assotech",
                "Sector 78, Noida", "+91 98115 23451",
                "Affordable 2BHK in a well-maintained society with 24/7 security and power backup.",
                28.5640, 77.3780,
                List.of("https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop")),

            createListing("3BHK for Rent in Sector 75", new BigDecimal("28000"), 3, 1400,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.RENT, "Civitech Stadia", "Civitech Group",
                "Sector 75, Noida", "+91 97170 34562",
                "Semi-furnished 3BHK with covered parking. Well-connected to Noida Expressway.",
                28.5715, 77.3730,
                List.of("https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop")),

            createListing("Premium 3BHK in Mahagun Moderne", new BigDecimal("9800000"), 3, 1800,
                PropertyCategory.RESIDENTIAL, PropertyType.APARTMENT, ListingType.BUY, "Mahagun Moderne", "Mahagun Group",
                "Sector 78, Noida", "+91 99901 78906",
                "Corner unit 3BHK with wrap-around balcony, Italian marble, and smart home features.",
                28.5590, 77.3820,
                List.of("https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop")),

            // ── RESIDENTIAL: VILLA ──
            createListing("Premium 4BHK Villa in Jaypee Greens", new BigDecimal("25000000"), 4, 3200,
                PropertyCategory.RESIDENTIAL, PropertyType.VILLA, ListingType.BUY, "Jaypee Greens", "Jaypee Wishtown",
                "Sector 128, Noida", "+91 98101 34567",
                "Luxurious 4BHK independent villa with private garden and premium golf course views.",
                28.5105, 77.3830,
                List.of("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop")),

            createListing("Luxury Villa in Sector 137", new BigDecimal("35000000"), 5, 4500,
                PropertyCategory.RESIDENTIAL, PropertyType.VILLA, ListingType.BUY, "Paramount Golfforeste", "Paramount Group",
                "Sector 137, Noida", "+91 98180 45673",
                "Ultra-luxury 5BHK villa with private pool, home theater, and golf course access.",
                28.5088, 77.4180,
                List.of("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1613977257363-707ba83d69ba?w=800&h=600&fit=crop")),

            // ── RESIDENTIAL: INDEPENDENT HOUSE ──
            createListing("3BHK Independent House in Sector 104", new BigDecimal("12000000"), 3, 2100,
                PropertyCategory.RESIDENTIAL, PropertyType.INDEPENDENT_HOUSE, ListingType.BUY, null, null,
                "Sector 104, Noida", "+91 98711 78901",
                "Independent house with car parking, rooftop terrace, and modular kitchen.",
                28.5340, 77.3640,
                List.of("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop")),

            createListing("2BHK Independent Floor for Rent", new BigDecimal("15000"), 2, 1000,
                PropertyCategory.RESIDENTIAL, PropertyType.INDEPENDENT_HOUSE, ListingType.RENT, null, null,
                "Sector 76, Noida", "+91 98730 67895",
                "Ground floor independent 2BHK with separate entry and parking. Pet-friendly.",
                28.5688, 77.3720,
                List.of("https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop")),

            // ── RESIDENTIAL: PLOT ──
            createListing("Residential Plot in Sector 100", new BigDecimal("15000000"), 0, 2400,
                PropertyCategory.RESIDENTIAL, PropertyType.PLOT, ListingType.BUY, null, "Noida Authority",
                "Sector 100, Noida", "+91 99112 67890",
                "Prime residential plot in a well-developed sector with all civic amenities nearby.",
                28.5445, 77.3920,
                List.of("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop")),

            // ── COMMERCIAL: OFFICE SPACE ──
            createListing("Fully Furnished Office in Advant Navis", new BigDecimal("85000"), 0, 1400,
                PropertyCategory.COMMERCIAL, PropertyType.OFFICE_SPACE, ListingType.RENT, "Advant Navis Business Park", "Advant Group",
                "Sector 142, Noida", "+91 98110 99887",
                "Ready-to-move 35-workstation corporate office with conference room, pantry, and high-speed elevators.",
                28.5020, 77.4120,
                List.of("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop")),

            createListing("Grade-A Corporate Office Space", new BigDecimal("32000000"), 0, 2800,
                PropertyCategory.COMMERCIAL, PropertyType.OFFICE_SPACE, ListingType.BUY, "Logix Cyber Park", "Logix Group",
                "Sector 62, Noida", "+91 99100 11223",
                "Premium commercial office space in prime IT hub with central AC, 100% power backup, and metro connectivity.",
                28.6290, 77.3680,
                List.of("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop")),

            // ── COMMERCIAL: RETAIL SHOP ──
            createListing("High-Footfall Retail Shop in Mall of Noida", new BigDecimal("19000000"), 0, 500,
                PropertyCategory.COMMERCIAL, PropertyType.RETAIL_SHOP, ListingType.BUY, "Mall of Noida", "Bhutani Group",
                "Sector 98, Noida", "+91 98101 22334",
                "Ground floor front-facing retail shop with excellent visibility and brand exposure in bustling mall.",
                28.5410, 77.3520,
                List.of("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop")),

            createListing("Boutique Retail Space for Rent", new BigDecimal("45000"), 0, 350,
                PropertyCategory.COMMERCIAL, PropertyType.RETAIL_SHOP, ListingType.RENT, "Spectrum Metro", "Blue Square",
                "Sector 75, Noida", "+91 97118 33445",
                "Prime retail showroom on the commercial high-street of Sector 75. Suitable for salon, café, or apparel.",
                28.5740, 77.3750,
                List.of("https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop")),

            // ── COMMERCIAL: PLOT ──
            createListing("Commercial Plot on Main Road", new BigDecimal("45000000"), 0, 5000,
                PropertyCategory.COMMERCIAL, PropertyType.COMMERCIAL_PLOT, ListingType.BUY, null, "Noida Authority",
                "Sector 143, Noida", "+91 99105 56784",
                "Commercial plot on main expressway road with high footfall area. Ideal for commercial complex or corporate tower.",
                28.4975, 77.4355,
                List.of("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop")),

            // ── COMMERCIAL: WAREHOUSE ──
            createListing("Industrial Warehouse & Logistics Space", new BigDecimal("120000"), 0, 6000,
                PropertyCategory.COMMERCIAL, PropertyType.WAREHOUSE, ListingType.RENT, "Sector 63 Industrial Zone", null,
                "Sector 63, Noida", "+91 98118 77665",
                "Spacious warehouse with 24ft clear ceiling height, heavy vehicle loading dock, and 3-phase industrial power.",
                28.6250, 77.3820,
                List.of("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop")),

            // ── COMMERCIAL: SHOWROOM ──
            createListing("Flagship Retail Showroom in Sector 18", new BigDecimal("55000000"), 0, 2200,
                PropertyCategory.COMMERCIAL, PropertyType.SHOWROOM, ListingType.BUY, "Atta Market Commercial Belt", null,
                "Sector 18, Noida", "+91 99100 33445",
                "Corner three-side open showroom in Noida's premier commercial hub, directly facing metro station.",
                28.5705, 77.3245,
                List.of("https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=600&fit=crop",
                         "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop")),

            createListing("Double-Height Commercial Showroom for Rent", new BigDecimal("180000"), 0, 1800,
                PropertyCategory.COMMERCIAL, PropertyType.SHOWROOM, ListingType.RENT, "Starling Edge High Street", "Starling Group",
                "Sector 104, Noida", "+91 98711 66554",
                "Prime double-height ground floor showroom on high-street commercial corridor of Sector 104.",
                28.5380, 77.3610,
                List.of("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop"))
        );

        listingRepository.saveAll(listings);
        log.info("Successfully seeded {} listings (Residential & Commercial).", listings.size());
    }

    private Listing createListing(String title, BigDecimal price, int bhk, int areaSqFt,
                                   PropertyCategory propertyCategory, PropertyType propertyType,
                                   ListingType listingType,
                                   String projectName, String societyName, String address,
                                   String contactNumber,
                                   String description, double lat, double lng,
                                   List<String> imageUrls) {
        Point location = geometryFactory.createPoint(new Coordinate(lng, lat));

        Listing listing = Listing.builder()
                .title(title)
                .price(price)
                .bhk(bhk)
                .areaSqFt(areaSqFt)
                .propertyCategory(propertyCategory)
                .propertyType(propertyType)
                .listingType(listingType)
                .projectName(projectName)
                .societyName(societyName)
                .address(address)
                .contactNumber(contactNumber)
                .description(description)
                .location(location)
                .build();

        for (int i = 0; i < imageUrls.size(); i++) {
            ListingImage image = ListingImage.builder()
                    .listing(listing)
                    .imageUrl(imageUrls.get(i))
                    .displayOrder(i + 1)
                    .build();
            listing.getImages().add(image);
        }

        return listing;
    }
}
