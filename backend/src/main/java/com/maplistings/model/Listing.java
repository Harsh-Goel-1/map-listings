package com.maplistings.model;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Double bhk;

    @Column(nullable = false)
    private Integer areaSqFt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PropertyCategory propertyCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PropertyType propertyType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ListingType listingType;

    @Column(length = 200)
    private String projectName;

    @Column(length = 200)
    private String societyName;

    @Column(length = 500)
    private String address;

    @Column(length = 20)
    private String contactNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ListingImage> images = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum PropertyCategory {
        RESIDENTIAL, COMMERCIAL
    }

    public enum PropertyType {
        APARTMENT, VILLA, PLOT, INDEPENDENT_HOUSE, OFFICE_SPACE, RETAIL_SHOP, COMMERCIAL_PLOT, WAREHOUSE, SHOWROOM
    }

    public enum ListingType {
        BUY, RENT
    }
}
