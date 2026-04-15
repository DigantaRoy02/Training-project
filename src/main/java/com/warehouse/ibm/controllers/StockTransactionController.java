package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.StockTransaction;
import com.warehouse.ibm.services.StockTransactionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class StockTransactionController {

    private final StockTransactionService service;

    public StockTransactionController(StockTransactionService service) {
        this.service = service;
    }

    @PostMapping
    public StockTransaction create(@RequestBody StockTransaction tx) {
        return service.create(tx);
    }
}
