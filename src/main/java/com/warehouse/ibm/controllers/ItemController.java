package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.services.ItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/item")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ItemController {

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<Item> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Item create(@RequestBody Item item) {
        return service.create(item);
    }
}
