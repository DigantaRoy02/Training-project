package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.Bin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BinRepository extends JpaRepository<Bin, Integer> {
}
