package com.maplistings;

import com.maplistings.controller.ListingController;
import com.maplistings.dto.CreateListingDTO;
import com.maplistings.dto.ListingDTO;
import com.maplistings.service.ListingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingBulkCreationTest {

    @Mock
    private ListingService listingService;

    @InjectMocks
    private ListingController listingController;

    @Test
    void testCreateListingsBulkController() {
        CreateListingDTO variant1 = CreateListingDTO.builder()
                .title("ATS Pristine Sector 150")
                .bhk(2.0)
                .price(new BigDecimal("7500000"))
                .areaSqFt(1100)
                .propertyCategory("RESIDENTIAL")
                .propertyType("APARTMENT")
                .listingType("BUY")
                .address("Sector 150, Noida Expressway")
                .latitude(28.4595)
                .longitude(77.5142)
                .build();

        CreateListingDTO variant2 = CreateListingDTO.builder()
                .title("ATS Pristine Sector 150")
                .bhk(3.0)
                .price(new BigDecimal("12500000"))
                .areaSqFt(1550)
                .propertyCategory("RESIDENTIAL")
                .propertyType("APARTMENT")
                .listingType("BUY")
                .address("Sector 150, Noida Expressway")
                .latitude(28.4595)
                .longitude(77.5142)
                .build();

        List<CreateListingDTO> dtos = List.of(variant1, variant2);

        ListingDTO dto1 = ListingDTO.builder()
                .id(101L)
                .title("ATS Pristine Sector 150")
                .bhk(2.0)
                .price(new BigDecimal("7500000"))
                .build();

        ListingDTO dto2 = ListingDTO.builder()
                .id(102L)
                .title("ATS Pristine Sector 150")
                .bhk(3.0)
                .price(new BigDecimal("12500000"))
                .build();

        when(listingService.createListingsBulk(anyList())).thenReturn(List.of(dto1, dto2));

        ResponseEntity<List<ListingDTO>> response = listingController.createListingsBulk(dtos);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals(101L, response.getBody().get(0).getId());
        assertEquals(2.0, response.getBody().get(0).getBhk());
        assertEquals(102L, response.getBody().get(1).getId());
        assertEquals(3.0, response.getBody().get(1).getBhk());

        verify(listingService).createListingsBulk(dtos);
    }
}
