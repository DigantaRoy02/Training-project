package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.SupplierItem;
import com.warehouse.ibm.services.SupplierItemService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/supplier-items")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SupplierItemController {

    private final SupplierItemService service;

    public SupplierItemController(SupplierItemService service) {
        this.service = service;
    }

    @PostMapping
    public SupplierItem create(@RequestBody SupplierItem supplierItem) {
        return service.create(supplierItem);
    }
}
