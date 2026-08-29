package com.maplistings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingDTO {
    private Long id;
    private String title;
    private BigDecimal price;
    private Integer bhk;
    private Integer areaSqFt;
    private String propertyCategory;
    private String propertyType;
    private String listingType;
    private String projectName;
    private String societyName;
    private String address;
    private String contactNumber;
    private String description;
    private Double latitude;
    private Double longitude;
    private List<String> imageUrls;
}
