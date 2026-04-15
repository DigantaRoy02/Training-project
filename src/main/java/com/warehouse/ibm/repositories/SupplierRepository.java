package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
}
