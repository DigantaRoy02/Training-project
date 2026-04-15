package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Integer> {
}
