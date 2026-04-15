package com.warehouse.ibm.services;

import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.model.Supplier;
import com.warehouse.ibm.model.SupplierItem;
import com.warehouse.ibm.model.SupplierItemId;
import com.warehouse.ibm.repositories.ItemRepository;
import com.warehouse.ibm.repositories.SupplierItemRepository;
import com.warehouse.ibm.repositories.SupplierRepository;
import org.springframework.stereotype.Service;

@Service
public class SupplierItemService {

    private final SupplierItemRepository repo;
    private final SupplierRepository supplierRepo;
    private final ItemRepository itemRepo;

    public SupplierItemService(SupplierItemRepository repo,
                               SupplierRepository supplierRepo,
                               ItemRepository itemRepo) {
        this.repo = repo;
        this.supplierRepo = supplierRepo;
        this.itemRepo = itemRepo;
    }

    public SupplierItem create(SupplierItem supplierItem) {
        Integer supplierId = supplierItem.getSupplier().getSupplierId();
        Integer itemId = supplierItem.getItem().getItemId();

        Supplier supplier = supplierRepo.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        supplierItem.setSupplier(supplier);
        supplierItem.setItem(item);

        SupplierItemId id = new SupplierItemId();
        id.setSupplierId(supplierId);
        id.setItemId(itemId);
        supplierItem.setId(id);

        return repo.save(supplierItem);
    }
}
