package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.services.StockLevelService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-levels")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class StockLevelController {

    private final StockLevelService service;

    public StockLevelController(StockLevelService service) {
        this.service = service;
    }

    @GetMapping
    public List<StockLevel> getAll() {
        return service.getAll();
    }

    @PostMapping
    public StockLevel create(@RequestBody StockLevel stockLevel) {
        return service.create(stockLevel);
    }
}
