package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.Supplier;
import com.warehouse.ibm.services.SupplierService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SupplierController {

    private final SupplierService service;

    public SupplierController(SupplierService service) {
        this.service = service;
    }

    @GetMapping
    public List<SupplierDTO> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Supplier create(@RequestBody Supplier supplier) {
        return service.create(supplier);
    }
}
