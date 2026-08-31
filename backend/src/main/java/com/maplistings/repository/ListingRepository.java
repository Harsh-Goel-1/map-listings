package com.maplistings.repository;

import com.maplistings.model.Listing;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    long count();

    @Override
    @EntityGraph(attributePaths = {"images"})
    List<Listing> findAll(Specification<Listing> spec);
}
