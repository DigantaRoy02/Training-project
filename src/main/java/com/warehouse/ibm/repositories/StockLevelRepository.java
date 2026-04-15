package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.model.StockLevelId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockLevelRepository extends JpaRepository<StockLevel, StockLevelId> {
}
