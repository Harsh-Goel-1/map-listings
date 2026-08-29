package com.maplistings.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateListingDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0", message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "BHK is required")
    @DecimalMin(value = "0.5", message = "BHK must be at least 0.5")
    private Double bhk;

    @NotNull(message = "Area is required")
    @Min(value = 1, message = "Area must be at least 1 sq ft")
    private Integer areaSqFt;

    @NotBlank(message = "Property category is required")
    private String propertyCategory;

    @NotBlank(message = "Property type is required")
    private String propertyType;

    @NotBlank(message = "Listing type is required")
    private String listingType;

    private String projectName;
    private String societyName;

    @NotBlank(message = "Address is required")
    private String address;

    private String contactNumber;

    private String description;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private List<String> imageUrls;
}
