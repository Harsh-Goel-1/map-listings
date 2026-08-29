package com.maplistings.controller;

import com.maplistings.dto.CreateListingDTO;
import com.maplistings.dto.ListingDTO;
import com.maplistings.dto.ListingFilterDTO;
import com.maplistings.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public ResponseEntity<List<ListingDTO>> getListings(
            @RequestParam(required = false) String listingType,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) List<Integer> bhk,
            @RequestParam(required = false) String propertyCategory,
            @RequestParam(required = false) String propertyType
    ) {
        ListingFilterDTO filter = ListingFilterDTO.builder()
                .listingType(listingType)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .bhk(bhk)
                .propertyCategory(propertyCategory)
                .propertyType(propertyType)
                .build();

        List<ListingDTO> listings = listingService.getListings(filter);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingDTO> getListingById(@PathVariable Long id) {
        return listingService.getListingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ListingDTO> createListing(@Valid @RequestBody CreateListingDTO dto) {
        ListingDTO created = listingService.createListing(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        boolean deleted = listingService.deleteListing(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllListings() {
        listingService.deleteAllListings();
        return ResponseEntity.noContent().build();
    }
}

