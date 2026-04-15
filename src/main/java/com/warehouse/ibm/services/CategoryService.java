package com.warehouse.ibm.services;

import com.warehouse.ibm.model.Category;
import com.warehouse.ibm.repositories.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository repo;

    public CategoryService(CategoryRepository repo) {
        this.repo = repo;
    }

    public Category create(Category category) {
        if (repo.existsById(category.getCategoryId())) {
            throw new RuntimeException("Category Id already exists");
        }
        return repo.save(category);
    }

    public List<Category> getAll() {
        return repo.findAll();
    }
}
