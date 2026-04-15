package com.warehouse.ibm.repositories;

import com.warehouse.ibm.enums.OrderStatus;
import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.model.Reorder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReorderRepository extends JpaRepository<Reorder, Integer> {
    boolean existsByItemAndStatusIn(Item item, List<OrderStatus> statuses);
}
