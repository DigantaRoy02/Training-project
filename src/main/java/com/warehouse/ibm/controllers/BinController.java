package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.Bin;
import com.warehouse.ibm.services.BinService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bins")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class BinController {

    private final BinService service;

    public BinController(BinService service) {
        this.service = service;
    }

    @GetMapping
    public List<Bin> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Bin create(@RequestBody Bin bin) {
        return service.create(bin);
    }
}
