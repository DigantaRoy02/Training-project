package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.Category;
import com.warehouse.ibm.services.CategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        return service.create(category);
    }

    @GetMapping
    public List<Category> getAll() {
        return service.getAll();
    }
}
