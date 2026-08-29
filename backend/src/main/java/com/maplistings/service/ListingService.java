package com.maplistings.service;

import com.maplistings.dto.CreateListingDTO;
import com.maplistings.dto.ListingDTO;
import com.maplistings.dto.ListingFilterDTO;
import com.maplistings.model.Listing;
import com.maplistings.model.ListingImage;
import com.maplistings.repository.ListingRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingService {

    private final ListingRepository listingRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public List<ListingDTO> getListings(ListingFilterDTO filter) {
        Specification<Listing> spec = buildSpecification(filter);
        List<Listing> listings = listingRepository.findAll(spec);
        return listings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<ListingDTO> getListingById(Long id) {
        return listingRepository.findById(id).map(this::toDTO);
    }

    @Transactional
    public ListingDTO createListing(CreateListingDTO dto) {
        if (dto.getBhk() != null) {
            double bhkVal = dto.getBhk();
            if (bhkVal < 0.5 || (Math.round(bhkVal * 2.0) != bhkVal * 2.0)) {
                throw new IllegalArgumentException("BHK must be a multiple of 0.5 (e.g. 0.5, 1, 1.5, 2, 2.5, 3, 3.5)");
            }
        }

        Point location = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));

        Listing listing = Listing.builder()
                .title(dto.getTitle())
                .price(dto.getPrice())
                .bhk(dto.getBhk())
                .areaSqFt(dto.getAreaSqFt())
                .propertyCategory(Listing.PropertyCategory.valueOf(dto.getPropertyCategory().toUpperCase()))
                .propertyType(Listing.PropertyType.valueOf(dto.getPropertyType().toUpperCase()))
                .listingType(Listing.ListingType.valueOf(dto.getListingType().toUpperCase()))
                .projectName(dto.getProjectName())
                .societyName(dto.getSocietyName())
                .address(dto.getAddress())
                .contactNumber(dto.getContactNumber())
                .description(dto.getDescription())
                .location(location)
                .build();

        // Add images
        if (dto.getImageUrls() != null) {
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                String url = dto.getImageUrls().get(i);
                if (url != null && !url.isBlank()) {
                    ListingImage image = ListingImage.builder()
                            .listing(listing)
                            .imageUrl(url.trim())
                            .displayOrder(i)
                            .build();
                    listing.getImages().add(image);
                }
            }
        }

        Listing saved = listingRepository.save(listing);
        return toDTO(saved);
    }

    @Transactional
    public Optional<ListingDTO> updateListing(Long id, CreateListingDTO dto) {
        return listingRepository.findById(id).map(listing -> {
            if (dto.getBhk() != null) {
                double bhkVal = dto.getBhk();
                if (bhkVal < 0.5 || (Math.round(bhkVal * 2.0) != bhkVal * 2.0)) {
                    throw new IllegalArgumentException("BHK must be a multiple of 0.5 (e.g. 0.5, 1, 1.5, 2, 2.5, 3, 3.5)");
                }
            }

            Point location = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));

            listing.setTitle(dto.getTitle());
            listing.setPrice(dto.getPrice());
            listing.setBhk(dto.getBhk());
            listing.setAreaSqFt(dto.getAreaSqFt());
            listing.setPropertyCategory(Listing.PropertyCategory.valueOf(dto.getPropertyCategory().toUpperCase()));
            listing.setPropertyType(Listing.PropertyType.valueOf(dto.getPropertyType().toUpperCase()));
            listing.setListingType(Listing.ListingType.valueOf(dto.getListingType().toUpperCase()));
            listing.setProjectName(dto.getProjectName());
            listing.setSocietyName(dto.getSocietyName());
            listing.setAddress(dto.getAddress());
            listing.setContactNumber(dto.getContactNumber());
            listing.setDescription(dto.getDescription());
            listing.setLocation(location);

            // Update images
            listing.getImages().clear();
            if (dto.getImageUrls() != null) {
                for (int i = 0; i < dto.getImageUrls().size(); i++) {
                    String url = dto.getImageUrls().get(i);
                    if (url != null && !url.isBlank()) {
                        ListingImage image = ListingImage.builder()
                                .listing(listing)
                                .imageUrl(url.trim())
                                .displayOrder(i)
                                .build();
                        listing.getImages().add(image);
                    }
                }
            }

            Listing updated = listingRepository.save(listing);
            return toDTO(updated);
        });
    }

    @Transactional
    public boolean deleteListing(Long id) {
        if (listingRepository.existsById(id)) {
            listingRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public void deleteAllListings() {
        listingRepository.deleteAll();
    }

    private Specification<Listing> buildSpecification(ListingFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getListingType() != null && !filter.getListingType().isEmpty()) {
                try {
                    Listing.ListingType type = Listing.ListingType.valueOf(filter.getListingType().toUpperCase());
                    predicates.add(cb.equal(root.get("listingType"), type));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }

            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }

            if (filter.getBhk() != null && !filter.getBhk().isEmpty()) {
                predicates.add(root.get("bhk").in(filter.getBhk()));
            }

            if (filter.getPropertyCategory() != null && !filter.getPropertyCategory().isEmpty()) {
                try {
                    Listing.PropertyCategory cat = Listing.PropertyCategory.valueOf(filter.getPropertyCategory().toUpperCase());
                    predicates.add(cb.equal(root.get("propertyCategory"), cat));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (filter.getPropertyType() != null && !filter.getPropertyType().isEmpty()) {
                try {
                    Listing.PropertyType type = Listing.PropertyType.valueOf(filter.getPropertyType().toUpperCase());
                    predicates.add(cb.equal(root.get("propertyType"), type));
                } catch (IllegalArgumentException ignored) {
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ListingDTO toDTO(Listing listing) {
        return ListingDTO.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .price(listing.getPrice())
                .bhk(listing.getBhk())
                .areaSqFt(listing.getAreaSqFt())
                .propertyCategory(listing.getPropertyCategory() != null ? listing.getPropertyCategory().name() : null)
                .propertyType(listing.getPropertyType().name())
                .listingType(listing.getListingType().name())
                .projectName(listing.getProjectName())
                .societyName(listing.getSocietyName())
                .address(listing.getAddress())
                .contactNumber(listing.getContactNumber())
                .description(listing.getDescription())
                .latitude(listing.getLocation().getY())
                .longitude(listing.getLocation().getX())
                .imageUrls(listing.getImages().stream()
                        .map(ListingImage::getImageUrl)
                        .collect(Collectors.toList()))
                .build();
    }
}

