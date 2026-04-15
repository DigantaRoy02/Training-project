package com.warehouse.ibm.repositories;

import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.model.SupplierItem;
import com.warehouse.ibm.model.SupplierItemId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierItemRepository extends JpaRepository<SupplierItem, SupplierItemId> {
    List<SupplierItem> findByItem(Item item);
    List<SupplierItem> findById_SupplierId(Integer supplierId);
}
