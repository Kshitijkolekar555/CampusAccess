package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long>, JpaSpecificationExecutor<Vendor> {

    Optional<Vendor> findByCompanyName(String companyName);
}
