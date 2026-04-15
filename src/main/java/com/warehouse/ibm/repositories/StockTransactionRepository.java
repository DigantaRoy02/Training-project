package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Integer> {
}
