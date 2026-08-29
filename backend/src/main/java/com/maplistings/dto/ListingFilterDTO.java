package com.maplistings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingFilterDTO {
    private String listingType;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<Double> bhk;
    private String propertyCategory;
    private String propertyType;
}
